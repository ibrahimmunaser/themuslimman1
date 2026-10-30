/**
 * Rate limiter for serverless auth endpoints.
 *
 * Uses Upstash Redis when UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN are set. Otherwise production counters live in
 * Postgres (RateLimitBucket), which is shared across serverless instances.
 * The in-memory store is only a last resort if that write fails, and for
 * local development (where limits are skipped entirely).
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { prisma } from "@/lib/db";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitEntry>();

let lastCleanup = Date.now();
function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanup < 5 * 60 * 1000) return;
  lastCleanup = now;
  for (const [key, entry] of memoryStore.entries()) {
    if (entry.resetAt <= now) memoryStore.delete(key);
  }
}

function checkRateLimitInMemory(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; retryAfterSeconds?: number } {
  maybeCleanup();
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || entry.resetAt <= now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= maxRequests) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  entry.count += 1;
  return { allowed: true };
}

let tableReady: Promise<void> | null = null;

function ensureRateLimitTable(): Promise<void> {
  if (!tableReady) {
    tableReady = prisma
      .$executeRawUnsafe(
        `CREATE TABLE IF NOT EXISTS "RateLimitBucket" (
          "key" TEXT NOT NULL,
          "count" INTEGER NOT NULL,
          "resetAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
        )`,
      )
      .then(() => undefined)
      .catch((error) => {
        tableReady = null;
        throw error;
      });
  }
  return tableReady;
}

async function checkRateLimitInDb(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  await ensureRateLimitTable();
  const resetAt = new Date(Date.now() + windowMs);
  const rows = await prisma.$queryRaw<Array<{ count: number; resetAt: Date }>>`
    INSERT INTO "RateLimitBucket" ("key", "count", "resetAt")
    VALUES (${key}, 1, ${resetAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimitBucket"."resetAt" <= NOW() THEN 1
        ELSE "RateLimitBucket"."count" + 1
      END,
      "resetAt" = CASE
        WHEN "RateLimitBucket"."resetAt" <= NOW() THEN EXCLUDED."resetAt"
        ELSE "RateLimitBucket"."resetAt"
      END
    RETURNING "count", "resetAt"
  `;
  if (Math.random() < 0.02) {
    prisma
      .$executeRaw`DELETE FROM "RateLimitBucket" WHERE "resetAt" < NOW() - INTERVAL '1 hour'`
      .catch(() => undefined);
  }
  const row = rows[0];
  if (!row || row.count <= maxRequests) return { allowed: true };
  const resetMs = new Date(row.resetAt).getTime();
  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, Math.ceil((resetMs - Date.now()) / 1000)),
  };
}

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

// Cache of Ratelimit instances per (maxRequests, windowMs) pair — the
// Upstash SDK expects the limit/window to be fixed per-instance, but this
// module is called with several different limit configs (login, signup,
// guest creation, etc.), so build them lazily and reuse.
const ratelimiters = new Map<string, Ratelimit>();
function getRatelimiter(maxRequests: number, windowMs: number): Ratelimit {
  const cacheKey = `${maxRequests}:${windowMs}`;
  let limiter = ratelimiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(maxRequests, `${windowMs} ms`),
      prefix: "seerah-ratelimit",
      analytics: false,
    });
    ratelimiters.set(cacheKey, limiter);
  }
  return limiter;
}

/**
 * Check and increment rate limit for a given key.
 * Returns { allowed: true } or { allowed: false, retryAfterSeconds: number }.
 *
 * Durable across instances: Upstash when configured, otherwise Postgres.
 * A database outage falls back to the per-instance store rather than
 * taking the endpoint down.
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  // Local dev hits these limits while testing login, checkout, and resets.
  // Production still enforces them. The test runner uses the in-memory store.
  if (process.env.NODE_ENV === "development") {
    return { allowed: true };
  }
  if (process.env.NODE_ENV !== "production") {
    return checkRateLimitInMemory(key, maxRequests, windowMs);
  }

  if (!redis) {
    try {
      return await checkRateLimitInDb(key, maxRequests, windowMs);
    } catch (error) {
      console.error("[RATE_LIMIT] Database counter failed, falling back to in-memory check:", error);
      return checkRateLimitInMemory(key, maxRequests, windowMs);
    }
  }
  try {
    const { success, reset } = await getRatelimiter(maxRequests, windowMs).limit(key);
    if (success) return { allowed: true };
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((reset - Date.now()) / 1000)) };
  } catch (error) {
    console.error("[RATE_LIMIT] Upstash request failed, falling back to the database counter:", error);
    try {
      return await checkRateLimitInDb(key, maxRequests, windowMs);
    } catch (dbError) {
      console.error("[RATE_LIMIT] Database counter failed, falling back to in-memory check:", dbError);
      return checkRateLimitInMemory(key, maxRequests, windowMs);
    }
  }
}

/** Extract the best available IP from request headers (Vercel-compatible). */
export function getIP(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
