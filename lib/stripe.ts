import Stripe from "stripe";

// Use a dummy key during build time to allow static generation
const stripeKey = process.env.STRIPE_SECRET_KEY || "sk_test_dummy_key_for_build";

export const stripe = new Stripe(stripeKey, {
  apiVersion: "2026-04-22.dahlia",
  typescript: true,
});

// Re-export types and client-safe config
export { PLANS, formatPrice, type PlanId } from "./stripe-config";

