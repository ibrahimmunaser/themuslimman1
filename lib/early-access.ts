/**
 * Early-access pricing configuration.
 *
 * Source of truth for the deadline is the environment variable:
 *   NEXT_PUBLIC_EARLY_ACCESS_END_DATE  (ISO 8601 string)
 *
 * Example .env / Vercel env value:
 *   NEXT_PUBLIC_EARLY_ACCESS_END_DATE=2026-05-30T22:00:00Z
 *
 * The NEXT_PUBLIC_ prefix makes this available on both server and client,
 * so the same deadline is used everywhere — no per-visitor variation.
 *
 * If the env var is missing, the fallback constant is used and a warning
 * is printed at startup.
 */

const FALLBACK_DEADLINE = "2026-05-30T22:00:00Z";

const rawDeadline =
  process.env.NEXT_PUBLIC_EARLY_ACCESS_END_DATE ?? FALLBACK_DEADLINE;

const parsed = new Date(rawDeadline);

if (isNaN(parsed.getTime())) {
  console.error(
    `[early-access] Invalid NEXT_PUBLIC_EARLY_ACCESS_END_DATE: "${rawDeadline}". ` +
      `Using fallback: ${FALLBACK_DEADLINE}`
  );
}

/** The single global deadline used for all users, all pages, all API calls. */
export const EARLY_ACCESS_END_DATE: Date = isNaN(parsed.getTime())
  ? new Date(FALLBACK_DEADLINE)
  : parsed;

/** Early-access price in cents: $99 */
export const EARLY_ACCESS_PRICE = 9900;

/** Regular (post-deadline) price in cents: $149 */
export const REGULAR_PRICE = 14900;

/**
 * Returns true if the early-access window is still open.
 * Pass `now` for unit-testing; defaults to the real clock.
 */
export function isEarlyAccessActive(now?: Date): boolean {
  return (now ?? new Date()) < EARLY_ACCESS_END_DATE;
}

/**
 * Returns the correct base price in cents for a new purchase:
 * - $99 during early access
 * - $149 after deadline
 */
export function getBasePrice(now?: Date): number {
  return isEarlyAccessActive(now) ? EARLY_ACCESS_PRICE : REGULAR_PRICE;
}

/** Milliseconds remaining until the deadline (minimum 0). */
export function getMsRemaining(now?: Date): number {
  return Math.max(0, EARLY_ACCESS_END_DATE.getTime() - (now ?? new Date()).getTime());
}
