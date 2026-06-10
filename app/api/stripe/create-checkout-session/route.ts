import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";
import { hasActiveCourseAccess } from "@/lib/access";

// ── Price ID environment variables ────────────────────────────────────────────
// New unified naming convention. Old STRIPE_MONTHLY_PRICE_ID / STRIPE_FAMILY_MONTHLY_PRICE_ID
// remain as fallbacks so existing deployments continue to work before env vars are updated.

const INDIVIDUAL_TRIAL_FEE_PRICE_ID  = process.env.STRIPE_PRICE_INDIVIDUAL_TRIAL_FEE ?? "";
const INDIVIDUAL_MONTHLY_PRICE_ID    =
  process.env.STRIPE_PRICE_INDIVIDUAL_MONTHLY ?? process.env.STRIPE_MONTHLY_PRICE_ID ?? "";
const INDIVIDUAL_LIFETIME_PRICE_ID   = process.env.STRIPE_PRICE_INDIVIDUAL_LIFETIME ?? "";
const FAMILY_TRIAL_FEE_PRICE_ID      = process.env.STRIPE_PRICE_FAMILY_TRIAL_FEE ?? "";
const FAMILY_MONTHLY_PRICE_ID        =
  process.env.STRIPE_PRICE_FAMILY_MONTHLY ?? process.env.STRIPE_FAMILY_MONTHLY_PRICE_ID ?? "";
const FAMILY_LIFETIME_PRICE_ID       =
  process.env.STRIPE_PRICE_FAMILY_LIFETIME ?? process.env.STRIPE_FAMILY_LIFETIME_PRICE_ID ?? "";

/**
 * POST /api/stripe/create-checkout-session
 *
 * Supported types (body.type):
 *   "individual-trial"    — $1 setup fee now, 7-day trial, then $9/month
 *   "family-trial"        — $1 setup fee now, 7-day family access, then $19/month
 *   "individual-lifetime" — $79 one-time lifetime individual access
 *   "family-lifetime"     — $149 one-time lifetime family access
 *   "monthly"             — $9/month subscription (no trial, legacy)
 *   "family-monthly"      — $19/month subscription (no trial, legacy)
 *
 * Returns: { url: string } — the Stripe-hosted Checkout Session URL.
 * On already-has-access: { url: "/seerah" }.
 *
 * NOTE: Email verification is NOT required before payment. Verified status
 * gates dashboard access, not payment. The webhook grants entitlement
 * regardless of email verification state.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to checkout" },
        { status: 401 }
      );
    }

    const body = await request.json() as { type?: string };
    const checkoutType = (body.type ?? "individual-trial") as string;

    // Short-circuit: user already has active access.
    // Exception: individual lifetime holders may still proceed to family-lifetime
    // to upgrade their plan (they pay the difference). All other combinations
    // (family lifetime, active subscription) are fully blocked.
    const alreadyHasAccess = await hasActiveCourseAccess(user.id, user.hasPaid);
    if (alreadyHasAccess) {
      const isIndividualLifetimeUpgrade =
        checkoutType === "family-lifetime" &&
        user.hasPaid &&
        user.planType !== "family";
      if (!isIndividualLifetimeUpgrade) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://themuslimman.com";
        return NextResponse.json({ url: `${appUrl}/seerah` });
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://themuslimman.com";

    // Ensure or create Stripe customer so the subscription links to the user account
    const { prisma } = await import("@/lib/db");
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { stripeCustomerId: true },
    });
    let customerId = dbUser?.stripeCustomerId ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.fullName ?? undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    let session: Awaited<ReturnType<typeof stripe.checkout.sessions.create>>;

    // One-trial-per-account guard for both trial types.
    // Mirror the same check in create-trial-intent so the rule applies regardless
    // of which checkout path is used.
    if (checkoutType === "individual-trial" || checkoutType === "family-trial") {
      const existingSubscription = await prisma.subscription.findFirst({
        where: { userId: user.id },
        select: { id: true, status: true },
      });
      if (existingSubscription) {
        return NextResponse.json(
          { error: "A trial has already been used on this account. Please choose a monthly or lifetime plan." },
          { status: 409 }
        );
      }
    }

    switch (checkoutType) {
      // ── Individual trial: $1 now, 7-day access, then $9/month ──────────────
      case "individual-trial": {
        if (
          !INDIVIDUAL_TRIAL_FEE_PRICE_ID.startsWith("price_") ||
          !INDIVIDUAL_MONTHLY_PRICE_ID.startsWith("price_")
        ) {
          console.error(
            "[CHECKOUT-SESSION] Individual trial price IDs not configured.",
            "STRIPE_PRICE_INDIVIDUAL_TRIAL_FEE:", INDIVIDUAL_TRIAL_FEE_PRICE_ID,
            "STRIPE_PRICE_INDIVIDUAL_MONTHLY:", INDIVIDUAL_MONTHLY_PRICE_ID
          );
          return NextResponse.json(
            { error: "Individual trial checkout is not configured. Contact support." },
            { status: 500 }
          );
        }
        session = await stripe.checkout.sessions.create({
          mode: "subscription",
          payment_method_types: ["card"],
          customer: customerId,
          line_items: [
            { price: INDIVIDUAL_MONTHLY_PRICE_ID, quantity: 1 },
            { price: INDIVIDUAL_TRIAL_FEE_PRICE_ID, quantity: 1 },
          ],
          subscription_data: {
            trial_period_days: 7,
            metadata: {
              userId: user.id,
              planType: "individual",
              planId: "individualTrial",
              isTrial: "true",
            },
          },
          metadata: { userId: user.id, planType: "individual" },
          success_url: `${appUrl}/payment/success?type=subscription&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${appUrl}/checkout?plan=individual-trial`,
          allow_promotion_codes: true,
        });
        break;
      }

      // ── Family trial: $1 now, 7-day family access, then $19/month ──────────
      case "family-trial": {
        if (
          !FAMILY_TRIAL_FEE_PRICE_ID.startsWith("price_") ||
          !FAMILY_MONTHLY_PRICE_ID.startsWith("price_")
        ) {
          console.error(
            "[CHECKOUT-SESSION] Family trial price IDs not configured.",
            "STRIPE_PRICE_FAMILY_TRIAL_FEE:", FAMILY_TRIAL_FEE_PRICE_ID,
            "STRIPE_PRICE_FAMILY_MONTHLY:", FAMILY_MONTHLY_PRICE_ID
          );
          return NextResponse.json(
            { error: "Family trial checkout is not configured. Contact support." },
            { status: 500 }
          );
        }
        session = await stripe.checkout.sessions.create({
          mode: "subscription",
          payment_method_types: ["card"],
          customer: customerId,
          line_items: [
            { price: FAMILY_MONTHLY_PRICE_ID, quantity: 1 },
            { price: FAMILY_TRIAL_FEE_PRICE_ID, quantity: 1 },
          ],
          subscription_data: {
            trial_period_days: 7,
            metadata: {
              userId: user.id,
              planType: "family",
              planId: "familyTrial",
              isTrial: "true",
            },
          },
          metadata: { userId: user.id, planType: "family" },
          success_url: `${appUrl}/payment/success?type=family-subscription&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${appUrl}/checkout?plan=family-trial`,
          allow_promotion_codes: true,
        });
        break;
      }

      // ── Individual lifetime: $79 one-time ───────────────────────────────────
      case "individual-lifetime": {
        if (!INDIVIDUAL_LIFETIME_PRICE_ID.startsWith("price_")) {
          console.error(
            "[CHECKOUT-SESSION] Individual lifetime price ID not configured.",
            "STRIPE_PRICE_INDIVIDUAL_LIFETIME:", INDIVIDUAL_LIFETIME_PRICE_ID
          );
          return NextResponse.json(
            { error: "Individual lifetime checkout is not configured. Contact support." },
            { status: 500 }
          );
        }
        session = await stripe.checkout.sessions.create({
          mode: "payment",
          payment_method_types: ["card"],
          customer: customerId,
          line_items: [{ price: INDIVIDUAL_LIFETIME_PRICE_ID, quantity: 1 }],
          payment_intent_data: {
            metadata: {
              userId: user.id,
              planId: "complete",
              planName: "Complete Seerah",
              packageType: "individual",
            },
          },
          metadata: { userId: user.id, planId: "complete", packageType: "individual" },
          success_url: `${appUrl}/payment/success?type=lifetime&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${appUrl}/checkout?plan=individual-lifetime`,
          allow_promotion_codes: true,
        });
        break;
      }

      // ── Family lifetime: $149 one-time ──────────────────────────────────────
      case "family-lifetime": {
        if (!FAMILY_LIFETIME_PRICE_ID.startsWith("price_")) {
          console.error(
            "[CHECKOUT-SESSION] Family lifetime price ID not configured.",
            "STRIPE_PRICE_FAMILY_LIFETIME:", FAMILY_LIFETIME_PRICE_ID
          );
          return NextResponse.json(
            { error: "Family lifetime checkout is not configured. Contact support." },
            { status: 500 }
          );
        }
        session = await stripe.checkout.sessions.create({
          mode: "payment",
          payment_method_types: ["card"],
          customer: customerId,
          line_items: [{ price: FAMILY_LIFETIME_PRICE_ID, quantity: 1 }],
          payment_intent_data: {
            metadata: {
              userId: user.id,
              planId: "family",
              planName: "Complete Seerah Family",
              packageType: "family",
            },
          },
          metadata: { userId: user.id, planId: "family", packageType: "family" },
          success_url: `${appUrl}/payment/success?type=family-lifetime&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${appUrl}/checkout?plan=family-lifetime`,
          allow_promotion_codes: true,
        });
        break;
      }

      // ── Individual monthly (also accepts "individual-monthly" alias) ──────────
      case "individual-monthly":
      case "monthly": {
        if (!INDIVIDUAL_MONTHLY_PRICE_ID.startsWith("price_")) {
          return NextResponse.json(
            { error: "Monthly subscription is not configured. Contact support." },
            { status: 500 }
          );
        }
        session = await stripe.checkout.sessions.create({
          mode: "subscription",
          payment_method_types: ["card"],
          customer: customerId,
          line_items: [{ price: INDIVIDUAL_MONTHLY_PRICE_ID, quantity: 1 }],
          subscription_data: {
            metadata: { userId: user.id, planType: "individual" },
          },
          metadata: { userId: user.id, planType: "individual" },
          success_url: `${appUrl}/payment/success?type=subscription&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${appUrl}/pricing`,
          allow_promotion_codes: true,
        });
        break;
      }

      // ── Legacy family monthly (no trial) ────────────────────────────────────
      case "family-monthly": {
        if (!FAMILY_MONTHLY_PRICE_ID.startsWith("price_")) {
          return NextResponse.json(
            { error: "Family monthly subscription is not configured. Contact support." },
            { status: 500 }
          );
        }
        session = await stripe.checkout.sessions.create({
          mode: "subscription",
          payment_method_types: ["card"],
          customer: customerId,
          line_items: [{ price: FAMILY_MONTHLY_PRICE_ID, quantity: 1 }],
          subscription_data: {
            metadata: { userId: user.id, planType: "family", planId: "familyMonthly" },
          },
          metadata: { userId: user.id, planType: "family" },
          success_url: `${appUrl}/payment/success?type=family-subscription&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${appUrl}/pricing`,
          allow_promotion_codes: true,
        });
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unknown checkout type: ${checkoutType}` },
          { status: 400 }
        );
    }

    console.log(
      `[CHECKOUT-SESSION] Created session ${session.id} type=${checkoutType} for user ${user.id}`
    );
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[CHECKOUT-SESSION] Error creating session:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to create checkout session: ${message}` },
      { status: 500 }
    );
  }
}
