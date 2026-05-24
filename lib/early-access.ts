/**
 * Pricing configuration for Complete Seerah lifetime access.
 *
 * $99 is the permanent launch price. There is no deadline-based increase.
 * All server-side checkout and all frontend displays use 9900 cents.
 */

/** Lifetime access price in cents: $99 (permanent). */
export const EARLY_ACCESS_PRICE = 9900;

/** Kept for import compatibility — same value as EARLY_ACCESS_PRICE. */
export const REGULAR_PRICE = 9900;

/**
 * Early access ended — always returns false.
 * Kept for import compatibility; do not use for logic.
 * @deprecated
 */
export const EARLY_ACCESS_END_DATE: Date = new Date("2026-05-30T22:00:00Z");

/**
 * Early access period has ended.
 * Always returns false — no countdown UI or deadline logic should be shown.
 * @deprecated
 */
export function isEarlyAccessActive(): boolean {
  return false;
}

/** Returns the current lifetime access price in cents: always $99. */
export function getBasePrice(): number {
  return 9900;
}

/**
 * Always returns 0 — the deadline has passed.
 * @deprecated
 */
export function getMsRemaining(): number {
  return 0;
}
