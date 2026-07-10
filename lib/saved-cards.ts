/**
 * Pure, framework/SDK-agnostic helpers for saved-card reuse (checkout + billing).
 * Kept dependency-free (no Stripe SDK, no Next.js) so they're trivially unit-testable
 * and reusable from both API routes and client components.
 */

export interface SavedCardLike {
  id: string;
  expMonth: number;
  expYear: number;
}

/** Days until the card's expiration date (end of its expiry month). Negative if already expired. */
export function daysUntilCardExpiry(expMonth: number, expYear: number, now: Date = new Date()): number {
  // Day 0 of the month *after* expMonth == the last calendar day of expMonth (1-indexed, per Stripe).
  const expiresAt = new Date(expYear, expMonth, 0, 23, 59, 59);
  return Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function isCardExpired(expMonth: number, expYear: number, now: Date = new Date()): boolean {
  return daysUntilCardExpiry(expMonth, expYear, now) < 0;
}

export function isCardExpiringSoon(
  expMonth: number,
  expYear: number,
  windowDays = 60,
  now: Date = new Date(),
): boolean {
  const days = daysUntilCardExpiry(expMonth, expYear, now);
  return days >= 0 && days <= windowDays;
}

/**
 * Chooses which saved card (if any) should be preselected in a saved-card picker
 * (checkout or billing). Never preselects an expired card, even if Stripe reports
 * it as the customer's default — an expired card would just decline immediately,
 * which is a bad first impression for a returning customer. Falls back to the
 * most-recently-attached *valid* card, or null (→ "use a new card") if every
 * saved card is expired or none exist.
 *
 * `cards` is expected in Stripe's `paymentMethods.list` order (most-recent first).
 */
export function pickInitialSavedCard(
  cards: SavedCardLike[],
  defaultPaymentMethodId: string | null,
  now: Date = new Date(),
): string | null {
  const usable = cards.filter((c) => !isCardExpired(c.expMonth, c.expYear, now));
  if (usable.length === 0) return null;
  const asDefault = defaultPaymentMethodId
    ? usable.find((c) => c.id === defaultPaymentMethodId)
    : undefined;
  return (asDefault ?? usable[0]).id;
}

/**
 * Defensive shape-check for the GET /api/stripe/payment-methods response before
 * trusting it in the saved-card picker. Guards against "request returns
 * malformed data" (e.g. a proxy/error page swapped in for JSON, a partial
 * response, or a future API shape change) — any mismatch fails safely to an
 * empty list, which causes the picker to fall back to normal new-card entry.
 */
export function isValidSavedCardList(
  value: unknown
): value is Array<{ id: string; brand: string; last4: string; expMonth: number; expYear: number }> {
  return (
    Array.isArray(value) &&
    value.every((c) => {
      if (!c || typeof c !== "object") return false;
      const r = c as Record<string, unknown>;
      return (
        typeof r.id === "string" &&
        typeof r.brand === "string" &&
        typeof r.last4 === "string" &&
        typeof r.expMonth === "number" &&
        typeof r.expYear === "number"
      );
    })
  );
}

export interface OwnershipCheckResult {
  ok: boolean;
  reason?: "not_found" | "not_owned" | "expired";
}

/**
 * Server-side ownership + usability check for a client-supplied payment method ID.
 * Never trust a client-supplied pmId on its own — always re-verify against the
 * authenticated user's actual Stripe customer ID before using it for a charge or
 * pinning it as a subscription's default, even though Stripe's own confirm-time
 * checks would also reject a genuine mismatch.
 */
export function assertPaymentMethodOwnership(params: {
  paymentMethodCustomerId: string | null;
  expectedCustomerId: string;
  card?: { expMonth: number; expYear: number } | null;
  now?: Date;
}): OwnershipCheckResult {
  const { paymentMethodCustomerId, expectedCustomerId, card, now } = params;
  if (!paymentMethodCustomerId || paymentMethodCustomerId !== expectedCustomerId) {
    return { ok: false, reason: "not_owned" };
  }
  if (card && isCardExpired(card.expMonth, card.expYear, now)) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true };
}

/**
 * Same idea for a subscription ID a saved-card checkout wants to pin a default
 * payment method onto — must belong to the same customer.
 */
export function assertSubscriptionOwnership(params: {
  subscriptionCustomerId: string | null;
  expectedCustomerId: string;
}): OwnershipCheckResult {
  if (!params.subscriptionCustomerId || params.subscriptionCustomerId !== params.expectedCustomerId) {
    return { ok: false, reason: "not_owned" };
  }
  return { ok: true };
}
