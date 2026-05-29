import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PLANS } from "@/lib/stripe-config";

// Source of truth: STRIPE_FAMILY_MONTHLY_PRICE_ID env var.
// Must start with "price_" — fail loudly at request time if misconfigured.
const FAMILY_MONTHLY_PRICE_ID = process.env.STRIPE_FAMILY_MONTHLY_PRICE_ID ?? "";
const FAMILY_MONTHLY_PLAN = PLANS.familyMonthly;

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "You must be logged in to subscribe" }, { status: 401 });
    }
    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Please verify your email address before subscribing", requiresVerification: true },
        { status: 403 }
      );
    }
    if (!FAMILY_MONTHLY_PRICE_ID.startsWith("price_")) {
      console.error("[CREATE-FAMILY-SUB] STRIPE_FAMILY_MONTHLY_PRICE_ID is missing or invalid:", FAMILY_MONTHLY_PRICE_ID);
      return NextResponse.json(
        { error: "Family Monthly subscription is not configured. Contact support." },
        { status: 500 }
      );
    }

    // Already on Family Access (lifetime) — nothing to subscribe to.
    if (user.planType === "family" && user.hasPaid) {
      return NextResponse.json(
        { error: "You already have lifetime Family Access.", hasFamily: true },
        { status: 409 }
      );
    }

    // Ensure Stripe customer exists
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
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
    }

    // Cancel any existing incomplete subscriptions for this customer
    const existingSubs = await stripe.subscriptions.list({
      customer: customerId,
      status: "incomplete",
      limit: 5,
    });
    for (const s of existingSubs.data) {
      await stripe.subscriptions.cancel(s.id).catch(() => {});
    }

    // Create subscription in incomplete state so we can confirm via Elements.
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: FAMILY_MONTHLY_PRICE_ID }],
      payment_behavior: "default_incomplete",
      payment_settings: {
        payment_method_types: ["card"],
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice", "latest_invoice.confirmation_secret"],
      metadata: {
        userId: user.id,
        planId: FAMILY_MONTHLY_PLAN.id,   // "familyMonthly"
        planType: "family",                // used in webhook to set user.planType
        type: "subscription",
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invoice = subscription.latest_invoice as any;
    const clientSecret: string | null =
      invoice?.confirmation_secret?.client_secret ?? null;

    if (!clientSecret) {
      console.error("[CREATE-FAMILY-SUB] No client_secret found. confirmation_secret:", invoice?.confirmation_secret);
      await stripe.subscriptions.cancel(subscription.id).catch(() => {});
      return NextResponse.json({ error: "Could not create subscription payment" }, { status: 500 });
    }

    // Tag the underlying PaymentIntent so the webhook skips creating a Purchase record
    const piId: string | null = invoice?.confirmation_secret?.payment_intent ?? null;
    if (piId) {
      await stripe.paymentIntents.update(piId, {
        metadata: {
          type: "subscription",
          userId: user.id,
          planId: FAMILY_MONTHLY_PLAN.id,
          planType: "family",
          subscriptionId: subscription.id,
        },
      }).catch((e) => console.warn("[CREATE-FAMILY-SUB] Could not update PI metadata:", e));
    }

    return NextResponse.json({ clientSecret, amount: FAMILY_MONTHLY_PLAN.price });
  } catch (error) {
    console.error("[CREATE-FAMILY-SUB] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to create subscription: ${message}` }, { status: 500 });
  }
}
