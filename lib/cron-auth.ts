import { timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

/**
 * Verifies the `Authorization: Bearer <CRON_SECRET>` header used by every
 * /api/cron/* route. Previously each route hand-rolled this check with a
 * plain `===` string comparison — functionally correct, but `===` on
 * strings short-circuits on the first mismatched byte, which leaks timing
 * information that could in theory help an attacker brute-force the secret
 * byte-by-byte. `timingSafeEqual` compares in constant time regardless of
 * where the strings first differ.
 *
 * Centralized here (was previously copy-pasted in cleanup-abandoned-guests,
 * checkup-followup, and no-plan-recovery route.ts files) so a future
 * hardening change only needs to happen once.
 */
export function requireCronAuth(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error(
      "[CRON] CRON_SECRET is not set — all cron requests will be rejected. Set this env var in Vercel dashboard.",
    );
    return false;
  }

  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(req.headers.get("authorization") ?? "");

  // timingSafeEqual throws on length mismatch rather than returning false —
  // length itself isn't the secret, so it's safe to branch on it directly.
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
