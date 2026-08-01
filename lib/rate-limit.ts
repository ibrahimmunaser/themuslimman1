/**
 * Rate limiter for serverless auth endpoints.
 *
 * Uses Upstash Redis (durable, shared across all serverless instances) when
 * UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are set. Falls back to a
 * per-instance in-memory store otherwise so local dev / early-launch
 * environments without a Redis add-on still work, just without the
 * cross-instance guarantee.
 *
 * NOTE on the fallback: on Vercel, each function invocation may run in a
 * separate instance, so the in-memory store is per-instance — it provides
 * meaningful protection against burst attacks hitting the same warm
 * instance, but a distributed attacker can multiply the effective limit by
 * however many cold instances get spun up. Set the two env vars above (a
 * free Upstash Redis database is enough) to close that gap in production.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

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
 * Durable (Upstash) when configured; otherwise falls back to the
 * per-instance in-memory store, never throwing — a Redis outage degrades to
 * the weaker fallback rather than taking the endpoint down.
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  if (!redis) {
    return checkRateLimitInMemory(key, maxRequests, windowMs);
  }
  try {
    const { success, reset } = await getRatelimiter(maxRequests, windowMs).limit(key);
    if (success) return { allowed: true };
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((reset - Date.now()) / 1000)) };
  } catch (error) {
    console.error("[RATE_LIMIT] Upstash request failed, falling back to in-memory check:", error);
    return checkRateLimitInMemory(key, maxRequests, windowMs);
  }
}

/** Extract the best available IP from request headers (Vercel-compatible). */
export function getIP(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
