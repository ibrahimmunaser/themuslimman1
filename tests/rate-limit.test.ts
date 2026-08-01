/**
 * AUTOMATED RISK: Rate Limiting
 *
 * Verifies the rate limiter correctly allows and blocks requests. No
 * UPSTASH_REDIS_REST_URL/TOKEN env vars are set in the test environment, so
 * this exercises the in-memory fallback path (checkRateLimit is async
 * either way, since the Upstash path performs a real network call).
 */

import { describe, it, expect } from "vitest";

// We re-import the module each test group using dynamic imports + vi.resetModules()
// so the shared module-level store is reset between test runs.

describe("checkRateLimit — allow behavior", () => {
  it("allows the first request under the limit", async () => {
    vi.resetModules();
    const { checkRateLimit } = await import("@/lib/rate-limit");
    const result = await checkRateLimit("test-key-allow", 3, 60_000);
    expect(result.allowed).toBe(true);
  });

  it("allows requests up to maxRequests within the window", async () => {
    vi.resetModules();
    const { checkRateLimit } = await import("@/lib/rate-limit");
    const key = "test-key-multi";
    await checkRateLimit(key, 3, 60_000); // 1st
    await checkRateLimit(key, 3, 60_000); // 2nd
    const third = await checkRateLimit(key, 3, 60_000); // 3rd (limit)
    expect(third.allowed).toBe(true);
  });
});

describe("checkRateLimit — block behavior", () => {
  it("blocks the (maxRequests+1)th request within the window", async () => {
    vi.resetModules();
    const { checkRateLimit } = await import("@/lib/rate-limit");
    const key = "test-key-block";
    await checkRateLimit(key, 3, 60_000);
    await checkRateLimit(key, 3, 60_000);
    await checkRateLimit(key, 3, 60_000);
    const fourth = await checkRateLimit(key, 3, 60_000); // over limit
    expect(fourth.allowed).toBe(false);
    expect(fourth.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("retryAfterSeconds is within the window duration", async () => {
    vi.resetModules();
    const { checkRateLimit } = await import("@/lib/rate-limit");
    const key = "test-key-retry";
    const windowMs = 30_000; // 30 seconds
    for (let i = 0; i < 5; i++) await checkRateLimit(key, 5, windowMs);
    const result = await checkRateLimit(key, 5, windowMs);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeLessThanOrEqual(30);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });
});

describe("checkRateLimit — different keys are independent", () => {
  it("two distinct keys have separate counters", async () => {
    vi.resetModules();
    const { checkRateLimit } = await import("@/lib/rate-limit");
    // Exhaust key A
    for (let i = 0; i < 2; i++) await checkRateLimit("key-A", 2, 60_000);
    const blockedA = await checkRateLimit("key-A", 2, 60_000);
    // Key B should still be allowed
    const allowedB = await checkRateLimit("key-B", 2, 60_000);
    expect(blockedA.allowed).toBe(false);
    expect(allowedB.allowed).toBe(true);
  });
});
