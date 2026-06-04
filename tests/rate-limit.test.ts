/**
 * AUTOMATED RISK: Rate Limiting
 *
 * Verifies the in-memory rate limiter correctly allows and blocks requests.
 * NOTE: This tests single-instance behavior. In multi-instance serverless
 * (Vercel), each instance has its own store. Upstash Redis solves that.
 */

import { describe, it, expect } from "vitest";

// We re-import the module each test group using dynamic imports + vi.resetModules()
// so the shared module-level store is reset between test runs.

describe("checkRateLimit — allow behavior", () => {
  it("allows the first request under the limit", async () => {
    vi.resetModules();
    const { checkRateLimit } = await import("@/lib/rate-limit");
    const result = checkRateLimit("test-key-allow", 3, 60_000);
    expect(result.allowed).toBe(true);
  });

  it("allows requests up to maxRequests within the window", async () => {
    vi.resetModules();
    const { checkRateLimit } = await import("@/lib/rate-limit");
    const key = "test-key-multi";
    checkRateLimit(key, 3, 60_000); // 1st
    checkRateLimit(key, 3, 60_000); // 2nd
    const third = checkRateLimit(key, 3, 60_000); // 3rd (limit)
    expect(third.allowed).toBe(true);
  });
});

describe("checkRateLimit — block behavior", () => {
  it("blocks the (maxRequests+1)th request within the window", async () => {
    vi.resetModules();
    const { checkRateLimit } = await import("@/lib/rate-limit");
    const key = "test-key-block";
    checkRateLimit(key, 3, 60_000);
    checkRateLimit(key, 3, 60_000);
    checkRateLimit(key, 3, 60_000);
    const fourth = checkRateLimit(key, 3, 60_000); // over limit
    expect(fourth.allowed).toBe(false);
    expect(fourth.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("retryAfterSeconds is within the window duration", async () => {
    vi.resetModules();
    const { checkRateLimit } = await import("@/lib/rate-limit");
    const key = "test-key-retry";
    const windowMs = 30_000; // 30 seconds
    for (let i = 0; i < 5; i++) checkRateLimit(key, 5, windowMs);
    const result = checkRateLimit(key, 5, windowMs);
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
    for (let i = 0; i < 2; i++) checkRateLimit("key-A", 2, 60_000);
    const blockedA = checkRateLimit("key-A", 2, 60_000);
    // Key B should still be allowed
    const allowedB = checkRateLimit("key-B", 2, 60_000);
    expect(blockedA.allowed).toBe(false);
    expect(allowedB.allowed).toBe(true);
  });
});
