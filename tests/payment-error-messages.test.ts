/**
 * AUTOMATED TESTS: friendlyPaymentError — used by BOTH the new-card
 * (confirmPayment) and saved-card (confirmCardPayment) branches of checkout.
 *
 * Covers the "Declined saved card" and "Saved card requiring 3DS" verification
 * scenarios: confirmCardPayment transparently handles the 3DS challenge itself
 * (shows Stripe's modal, resolves after) — if authentication ultimately fails,
 * or the card is declined for any other reason, it resolves with a StripeError
 * of the exact shape tested here, which is fed through this same function
 * regardless of whether the original card was new or saved.
 */

import { describe, it, expect } from "vitest";
import { friendlyPaymentError, friendlySubmitError } from "@/lib/payment-error-messages";

describe("friendlyPaymentError — 3DS / authentication failures", () => {
  it("[Test] saved card requiring 3DS that ultimately fails authentication", () => {
    const msg = friendlyPaymentError({ code: "payment_intent_authentication_failure" });
    expect(msg).toMatch(/could not verify this payment/i);
  });

  it("flags authentication_required decline code", () => {
    const msg = friendlyPaymentError({ decline_code: "authentication_required" });
    expect(msg).toMatch(/could not verify this payment/i);
  });

  it("flags messages mentioning 3D Secure even without a matching code", () => {
    const msg = friendlyPaymentError({ message: "3D Secure authentication failed" });
    expect(msg).toMatch(/could not verify this payment/i);
  });
});

describe("friendlyPaymentError — declines", () => {
  it("[Test] declined saved card — insufficient funds", () => {
    const msg = friendlyPaymentError({ decline_code: "insufficient_funds" });
    expect(msg).toMatch(/insufficient funds/i);
  });

  it("declined — generic do_not_honor (common for saved international cards)", () => {
    const msg = friendlyPaymentError({ decline_code: "do_not_honor" });
    expect(msg).toMatch(/bank declined this payment/i);
  });

  it("declined — expired card at confirm time (race: card expired between selection and submit)", () => {
    const msg = friendlyPaymentError({ code: "expired_card" });
    expect(msg).toMatch(/card has expired/i);
  });

  it("falls back to a generic message + support contact for unknown decline codes", () => {
    const msg = friendlyPaymentError({ message: "Some new Stripe decline reason." });
    expect(msg).toContain("Some new Stripe decline reason.");
    expect(msg).toMatch(/support@themuslimman\.com/);
  });
});

describe("friendlySubmitError — client-side card field validation (new-card path only)", () => {
  it("maps incomplete card number", () => {
    expect(friendlySubmitError({ code: "incomplete_number" })).toMatch(/incomplete/i);
  });

  it("falls back to Stripe's message for unknown codes", () => {
    expect(friendlySubmitError({ code: "some_unknown_code", message: "Stripe says X" })).toBe("Stripe says X");
  });
});
