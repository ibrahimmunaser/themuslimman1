import Stripe from "stripe";

// Use a dummy key during build time to allow static generation
const stripeKey = process.env.STRIPE_SECRET_KEY || "sk_test_dummy_key_for_build";

export const stripe = new Stripe(stripeKey, {
  // Let stripe-node use its own pinned API version for type compatibility
  typescript: true,
});

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

