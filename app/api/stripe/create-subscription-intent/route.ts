import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getUserAccessInfo, getActiveSubscription } from "@/lib/access";
import { PLANS } from "@/lib/stripe-config";

export async function POST() {
  const MONTHLY_PRICE_ID = process.env.STRIPE_MONTHLY_PRICE_ID;

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
    if (!MONTHLY_PRICE_ID) {
      console.error("[CREATE-SUBSCRIPTION-INTENT] STRIPE_MONTHLY_PRICE_ID is not set");
      return NextResponse.json({ error: "Monthly subscription is not configured" }, { status: 500 });
    }

    // Block lifetime users — they already have permanent access, no need to subscribe
    const [accessInfo, activeSub] = await Promise.all([
      getUserAccessInfo(user.id, user.hasPaid),
      getActiveSubscription(user.id),
    ]);

    if (accessInfo.hasLifetime) {
      return NextResponse.json(
        { error: "You already have lifetime access to Complete Seerah.", hasLifetime: true },
        { status: 409 }
      );
    }

    // Block users who already have any active monthly subscription (individual or family).
    // Switching between monthly plans requires canceling the current subscription first.
    if (activeSub) {
      return NextResponse.json(
        {
          error:
            "You already have an active monthly subscription. Manage your subscription from billing.",
          hasActiveSubscription: true,
        },
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

    // Cancel any existing incomplete subscriptions for this customer to avoid duplicates
    const existingSubs = await stripe.subscriptions.list({
      customer: customerId,
      status: "incomplete",
      limit: 5,
    });
    for (const s of existingSubs.data) {
      await stripe.subscriptions.cancel(s.id).catch(() => {});
    }

    // Create subscription in incomplete state so we can confirm via Elements.
    // Must expand BOTH 'latest_invoice' AND 'latest_invoice.confirmation_secret' to get the client_secret.
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: MONTHLY_PRICE_ID }],
      payment_behavior: "default_incomplete",
      payment_settings: {
        payment_method_types: ["card"],
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice", "latest_invoice.confirmation_secret"],
      metadata: { userId: user.id, type: "subscription" },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invoice = subscription.latest_invoice as any;

    // In API 2026-04-22.dahlia, client_secret is in invoice.confirmation_secret.client_secret
    // (requires explicit expansion of 'latest_invoice.confirmation_secret')
    const clientSecret: string | null =
      invoice?.confirmation_secret?.client_secret ?? null;

    if (!clientSecret) {
      console.error("[CREATE-SUBSCRIPTION-INTENT] No client_secret found. confirmation_secret:", invoice?.confirmation_secret);
      await stripe.subscriptions.cancel(subscription.id).catch(() => {});
      return NextResponse.json({ error: "Could not create subscription payment" }, { status: 500 });
    }

    // Tag the underlying PaymentIntent so the webhook skips creating a Purchase record
    const piId: string | null = invoice?.confirmation_secret?.payment_intent ?? null;
    if (piId) {
      await stripe.paymentIntents.update(piId, {
        metadata: { type: "subscription", userId: user.id, subscriptionId: subscription.id },
      }).catch((e) => console.warn("[CREATE-SUBSCRIPTION-INTENT] Could not update PI metadata:", e));
    }

    return NextResponse.json({ clientSecret, amount: PLANS.monthly.price });
  } catch (error) {
    console.error("[CREATE-SUBSCRIPTION-INTENT] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to create subscription: ${message}` }, { status: 500 });
  }
}
