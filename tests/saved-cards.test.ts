/**
 * AUTOMATED TESTS: Saved-card checkout reuse — pure logic
 *
 * Covers lib/saved-cards.ts, the framework-agnostic core used by both the
 * checkout SavedCardPicker (client) and the apply-saved-card API route
 * (server-side ownership verification):
 *
 *  - pickInitialSavedCard: what gets preselected in the picker
 *      1. Authenticated user with no saved cards
 *      2. Authenticated user with one valid card
 *      3. Multiple saved cards with a default
 *      4. Expired default card — must NOT be preselected
 *      5. All cards expired — falls back to "use a new card" (null)
 *  - assertPaymentMethodOwnership / assertSubscriptionOwnership: server-side
 *    "never trust the client-supplied ID" checks
 *      6. PaymentMethod belonging to another Stripe customer
 *      7. Expired card is rejected even if it otherwise matches the customer
 *      8. Detached / not-found payment method (customer null)
 *  - Expiry helpers: daysUntilCardExpiry / isCardExpired / isCardExpiringSoon
 */

import { describe, it, expect } from "vitest";
import {
  pickInitialSavedCard,
  assertPaymentMethodOwnership,
  assertSubscriptionOwnership,
  isValidSavedCardList,
  daysUntilCardExpiry,
  isCardExpired,
  isCardExpiringSoon,
  type SavedCardLike,
} from "@/lib/saved-cards";

const NOW = new Date("2026-07-07T12:00:00Z");

const card = (id: string, expMonth: number, expYear: number): SavedCardLike => ({ id, expMonth, expYear });

// ═══════════════════════════════════════════════════════════════════════════════
// Expiry helpers
// ═══════════════════════════════════════════════════════════════════════════════

describe("expiry helpers", () => {
  it("treats a card expiring later this year as not expired", () => {
    expect(isCardExpired(12, 2026, NOW)).toBe(false);
  });

  it("treats a card whose exp month/year has fully passed as expired", () => {
    expect(isCardExpired(6, 2026, NOW)).toBe(true); // June 2026 ended before July 7
  });

  it("treats the current expiry month as not-yet-expired (valid through end of month)", () => {
    expect(isCardExpired(7, 2026, NOW)).toBe(false);
  });

  it("flags a card expiring within the warning window as expiring soon", () => {
    expect(isCardExpiringSoon(8, 2026, 60, NOW)).toBe(true); // ~24 days out
  });

  it("does not flag a card expiring far in the future as expiring soon", () => {
    expect(isCardExpiringSoon(6, 2028, 60, NOW)).toBe(false);
  });

  it("does not flag an already-expired card as 'expiring soon' (it's just expired)", () => {
    expect(isCardExpiringSoon(1, 2026, 60, NOW)).toBe(false);
  });

  it("daysUntilCardExpiry is negative for expired cards", () => {
    expect(daysUntilCardExpiry(1, 2026, NOW)).toBeLessThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// pickInitialSavedCard — checkout / billing picker preselection
// ═══════════════════════════════════════════════════════════════════════════════

describe("pickInitialSavedCard", () => {
  it("[Test] no saved cards — returns null (falls back to new-card entry)", () => {
    expect(pickInitialSavedCard([], null, NOW)).toBeNull();
  });

  it("[Test] one valid card, no explicit default — preselects it", () => {
    const cards = [card("pm_1", 12, 2026)];
    expect(pickInitialSavedCard(cards, null, NOW)).toBe("pm_1");
  });

  it("[Test] multiple cards with an explicit default — preselects the default, not the first", () => {
    const cards = [card("pm_1", 12, 2026), card("pm_2", 6, 2027), card("pm_3", 3, 2028)];
    expect(pickInitialSavedCard(cards, "pm_2", NOW)).toBe("pm_2");
  });

  it("[Test] expired default card — does NOT preselect it, falls back to first valid card", () => {
    const cards = [card("pm_expired", 1, 2026), card("pm_valid", 6, 2027)];
    // pm_expired is Stripe's reported default, but it's expired.
    expect(pickInitialSavedCard(cards, "pm_expired", NOW)).toBe("pm_valid");
  });

  it("all cards expired — falls back to null (use a new card)", () => {
    const cards = [card("pm_1", 1, 2026), card("pm_2", 3, 2026)];
    expect(pickInitialSavedCard(cards, "pm_1", NOW)).toBeNull();
  });

  it("no default given — picks the first (most-recently-attached) valid card", () => {
    const cards = [card("pm_recent", 12, 2026), card("pm_older", 6, 2027)];
    expect(pickInitialSavedCard(cards, null, NOW)).toBe("pm_recent");
  });

  it("default ID does not match any card in the list — falls back to first valid card", () => {
    const cards = [card("pm_1", 12, 2026), card("pm_2", 6, 2027)];
    expect(pickInitialSavedCard(cards, "pm_does_not_exist", NOW)).toBe("pm_1");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// assertPaymentMethodOwnership — server-side "never trust the client" check
// ═══════════════════════════════════════════════════════════════════════════════

describe("assertPaymentMethodOwnership", () => {
  it("accepts a payment method that belongs to the expected customer and isn't expired", () => {
    const result = assertPaymentMethodOwnership({
      paymentMethodCustomerId: "cus_123",
      expectedCustomerId: "cus_123",
      card: { expMonth: 12, expYear: 2026 },
      now: NOW,
    });
    expect(result).toEqual({ ok: true });
  });

  it("[Test] rejects a PaymentMethod belonging to another Stripe customer", () => {
    const result = assertPaymentMethodOwnership({
      paymentMethodCustomerId: "cus_ATTACKER",
      expectedCustomerId: "cus_VICTIM",
      now: NOW,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("not_owned");
  });

  it("rejects a detached / not-found payment method (customer is null)", () => {
    const result = assertPaymentMethodOwnership({
      paymentMethodCustomerId: null,
      expectedCustomerId: "cus_123",
      now: NOW,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("not_owned");
  });

  it("rejects an expired card even when ownership matches", () => {
    const result = assertPaymentMethodOwnership({
      paymentMethodCustomerId: "cus_123",
      expectedCustomerId: "cus_123",
      card: { expMonth: 1, expYear: 2026 },
      now: NOW,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("expired");
  });

  it("does not check expiry when no card details are provided", () => {
    const result = assertPaymentMethodOwnership({
      paymentMethodCustomerId: "cus_123",
      expectedCustomerId: "cus_123",
      now: NOW,
    });
    expect(result.ok).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// isValidSavedCardList — "request returns malformed data" fallback safety
// ═══════════════════════════════════════════════════════════════════════════════

describe("isValidSavedCardList", () => {
  it("accepts a well-formed list", () => {
    expect(isValidSavedCardList([{ id: "pm_1", brand: "visa", last4: "4242", expMonth: 12, expYear: 2030 }])).toBe(true);
  });

  it("accepts an empty list", () => {
    expect(isValidSavedCardList([])).toBe(true);
  });

  it("[Test] rejects malformed data — not an array", () => {
    expect(isValidSavedCardList({ error: "Internal Server Error" })).toBe(false);
  });

  it("[Test] rejects malformed data — missing required fields", () => {
    expect(isValidSavedCardList([{ id: "pm_1", brand: "visa" }])).toBe(false);
  });

  it("[Test] rejects malformed data — wrong field types", () => {
    expect(isValidSavedCardList([{ id: "pm_1", brand: "visa", last4: 4242, expMonth: "12", expYear: 2030 }])).toBe(false);
  });

  it("rejects null/undefined entries in the list", () => {
    expect(isValidSavedCardList([null])).toBe(false);
  });
});

describe("assertSubscriptionOwnership", () => {
  it("accepts a subscription that belongs to the expected customer", () => {
    expect(
      assertSubscriptionOwnership({ subscriptionCustomerId: "cus_123", expectedCustomerId: "cus_123" })
    ).toEqual({ ok: true });
  });

  it("rejects a subscription belonging to another customer", () => {
    const result = assertSubscriptionOwnership({
      subscriptionCustomerId: "cus_OTHER",
      expectedCustomerId: "cus_123",
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("not_owned");
  });
});
