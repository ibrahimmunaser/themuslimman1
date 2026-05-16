/**
 * Simple in-memory rate limiter for serverless auth endpoints.
 *
 * NOTE: On Vercel/serverless, each function invocation may run in a separate
 * instance, so this in-memory store is per-instance. It provides meaningful
 * protection against burst attacks on the same instance (e.g. scripted loops)
 * but is not a global rate limiter. For stricter enforcement, use Upstash Redis
 * with @upstash/ratelimit. This is suitable for early-launch protection.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes to avoid memory leaks
let lastCleanup = Date.now();
function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanup < 5 * 60 * 1000) return;
  lastCleanup = now;
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

/**
 * Check and increment rate limit for a given key.
 * Returns { allowed: true } or { allowed: false, retryAfterSeconds: number }.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds?: number } {
  maybeCleanup();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= maxRequests) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  entry.count += 1;
  return { allowed: true };
}

/** Extract the best available IP from request headers (Vercel-compatible). */
export function getIP(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
