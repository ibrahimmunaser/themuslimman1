import Stripe from "stripe";

// Use a dummy key during build time to allow static generation
const stripeKey = process.env.STRIPE_SECRET_KEY || "sk_test_dummy_key_for_build";

export const stripe = new Stripe(stripeKey, {
  // Let stripe-node use its own pinned API version for type compatibility
  typescript: true,
});

/** Outcome of a fail-closed charge refund probe. */
export type ChargeRefundStatus = "unrefunded" | "refunded" | "unavailable";

/** Extract latest_charge id from a PaymentIntent (string or expanded object). */
export function extractLatestChargeId(
  paymentIntent: Stripe.PaymentIntent,
): string | null {
  if (typeof paymentIntent.latest_charge === "string") {
    return paymentIntent.latest_charge;
  }
  if (
    paymentIntent.latest_charge &&
    typeof paymentIntent.latest_charge === "object"
  ) {
    return (paymentIntent.latest_charge as { id?: string }).id ?? null;
  }
  return null;
}

/**
 * Fail-closed refund probe for a Stripe Charge.
 * Throws on Stripe API errors (caller decides 503 / retry).
 */
export async function getChargeRefundStatus(
  chargeId: string,
): Promise<"unrefunded" | "refunded"> {
  const charge = await stripe.charges.retrieve(chargeId);
  const fullyRefunded =
    charge.refunded === true ||
    (typeof charge.amount_refunded === "number" &&
      charge.amount_refunded >= charge.amount &&
      charge.amount > 0);
  return fullyRefunded ? "refunded" : "unrefunded";
}

/**
 * Fail-closed refund probe for a PaymentIntent's latest charge.
 * Returns "unavailable" when latest_charge is missing; throws on Stripe errors.
 */
export async function checkPaymentIntentRefundStatus(
  piIdOrIntent: string | Stripe.PaymentIntent,
): Promise<ChargeRefundStatus> {
  const pi =
    typeof piIdOrIntent === "string"
      ? await stripe.paymentIntents.retrieve(piIdOrIntent)
      : piIdOrIntent;
  const chargeId = extractLatestChargeId(pi);
  if (!chargeId) return "unavailable";
  return getChargeRefundStatus(chargeId);
}

/**
 * Whether this deployment is configured for LIVE Stripe traffic.
 *
 * Checks both standard secret keys ("sk_live_") and restricted keys
 * ("rk_live_") — a restricted key never starts with "sk_live_", so a
 * sk_live_-only check would incorrectly treat a live restricted-key
 * deployment as test mode and reject every real production webhook (see
 * handleTrialSetupIntentSucceeded's livemode guard in
 * app/api/stripe/webhook/route.ts).
 *
 * An explicit STRIPE_LIVE_MODE env var ("true"/"1") always takes precedence
 * when set, for any deployment where key-prefix sniffing isn't reliable
 * enough (e.g. a proxied or custom key-management setup).
 */
export function isStripeLiveMode(): boolean {
  const explicit = process.env.STRIPE_LIVE_MODE;
  if (explicit !== undefined) {
    return explicit === "true" || explicit === "1";
  }
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  return key.startsWith("sk_live_") || key.startsWith("rk_live_");
}

// Re-export types and client-safe config
export { PLANS, formatPrice, type PlanId } from "./stripe-config";

