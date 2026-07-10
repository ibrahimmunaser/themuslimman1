/**
 * Pure Stripe error → human-friendly message mapping, shared by the checkout
 * page's new-card and saved-card confirm branches (both feed the exact same
 * Stripe.js error shape into this function). Extracted to its own module so it
 * can be unit-tested without importing the full checkout client component.
 */

export interface StripeLikeError {
  code?: string;
  decline_code?: string;
  message?: string;
}

/**
 * Maps a Stripe StripeError to a human-friendly message.
 * 3DS / authentication failures get a specific message that encourages
 * the user to retry or try Apple Pay / Google Pay.
 */
export function friendlyPaymentError(err: StripeLikeError): string {
  const code         = err.code ?? "";
  const declineCode  = err.decline_code ?? "";
  const msgLower     = (err.message ?? "").toLowerCase();

  // ── 3DS / authentication failures ────────────────────────────────────────
  const authCodes = new Set([
    "payment_intent_authentication_failure",
    "authentication_required",
    "card_authentication_required",
  ]);
  const isAuthFailure =
    authCodes.has(code) ||
    authCodes.has(declineCode) ||
    msgLower.includes("authentication") ||
    msgLower.includes("3d secure") ||
    msgLower.includes("3ds");

  if (isAuthFailure) {
    return "Your bank could not verify this payment. Please try again, use a different card, or use Apple Pay / Google Pay if available.";
  }

  // ── Bank blocked / international transaction ──────────────────────────────
  // "do_not_honor" is the most common decline for international cards (e.g. AU banks
  // that block cross-border online transactions by default).
  if (
    declineCode === "do_not_honor" ||
    declineCode === "transaction_not_allowed" ||
    declineCode === "card_not_supported" ||
    declineCode === "service_not_allowed"
  ) {
    return "Your bank declined this payment. This often happens when your bank blocks international or online transactions. Please contact your bank to enable these, then try again — or use a different card or Apple Pay / Google Pay.";
  }

  // ── Insufficient funds ───────────────────────────────────────────────────
  if (declineCode === "insufficient_funds") {
    return "Your card has insufficient funds. Please use a different card.";
  }

  // ── Expired card ─────────────────────────────────────────────────────────
  if (code === "expired_card" || declineCode === "expired_card") {
    return "Your card has expired. Please use a different card.";
  }

  // ── Wrong CVC / number ───────────────────────────────────────────────────
  if (code === "incorrect_cvc" || declineCode === "incorrect_cvc") {
    return "Your card's security code (CVV/CVC) is incorrect. Please double-check the 3-digit code on the back of your card.";
  }
  if (code === "incorrect_number" || code === "invalid_number") {
    return "Your card number is invalid. Please double-check all 16 digits and try again.";
  }

  // ── Too many attempts ────────────────────────────────────────────────────
  if (declineCode === "card_velocity_exceeded") {
    return "Too many payment attempts on this card. Please wait a few minutes and try again, or use a different card.";
  }

  // ── Generic / unknown decline — keep Stripe's message, add guidance ───────
  const base = err.message ?? "Your payment was declined.";
  return `${base} Please try again, use a different card, or contact support at support@themuslimman.com.`;
}

/**
 * Converts Stripe elements.submit() validation errors into actionable messages.
 * These fire before any server call — purely client-side card field validation.
 */
export function friendlySubmitError(err: { code?: string; message?: string }): string {
  switch (err.code) {
    case "incomplete_number":
      return "Your card number is incomplete. Please enter all digits on your card.";
    case "invalid_number":
      return "Your card number appears to be invalid. Please double-check the number and try again.";
    case "incomplete_expiry":
      return "Your card's expiration date is incomplete.";
    case "invalid_expiry_year_past":
      return "Your card's expiration year is in the past. Please use a different card.";
    case "incomplete_cvc":
      return "Your card's security code (CVV/CVC) is incomplete.";
    case "incomplete_zip":
      return "Please enter your card's billing postal code.";
    default:
      // Fall back to Stripe's own message — it's usually descriptive enough.
      return err.message ?? "Please check your card details and try again.";
  }
}
