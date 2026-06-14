import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getUserAccessInfo, getActiveSubscription } from "@/lib/access";
import { PLANS } from "@/lib/stripe-config";
import { checkRateLimit, getIP } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = getIP(request);
  const rl = checkRateLimit(`create-sub-intent:${ip}`, 10, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }
  // Support both old and new env var names for the individual monthly price.
  const MONTHLY_PRICE_ID =
    process.env.STRIPE_PRICE_INDIVIDUAL_MONTHLY ?? process.env.STRIPE_MONTHLY_PRICE_ID;

  let body: Record<string, string> = {};
  try { body = await request.json(); } catch { /* no body is fine */ }
  const { creator, promoCode, source, utmSource, utmCampaign, utmMedium, utmContent } = body;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "You must be logged in to subscribe" }, { status: 401 });
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

    // Block active mobile IAP subscribers — they already have access through the app store.
    if (accessInfo.mobilePurchase) {
      return NextResponse.json(
        { error: "You have an active mobile subscription. Manage your access from the app.", hasAccess: true },
        { status: 409 }
      );
    }

    // Block family plan users from downgrading to individual monthly.
    if (user.planType === "family") {
      return NextResponse.json(
        {
          error: "You are on a Family plan. Individual Monthly would be a downgrade. Manage your plan from the billing page.",
          isFamilyPlan: true,
        },
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

    // Cancel any existing incomplete or past_due subscriptions for this customer
    // to avoid duplicate active subscriptions. past_due subs are canceled here so
    // the user can create a fresh one with a new payment method if retries failed.
    for (const statusFilter of ["incomplete", "past_due"] as const) {
      const existingSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: statusFilter,
        limit: 5,
      });
      for (const s of existingSubs.data) {
        await stripe.subscriptions.cancel(s.id).catch((e) =>
          console.warn(`[CREATE-SUBSCRIPTION-INTENT] Could not cancel ${statusFilter} sub ${s.id}:`, e)
        );
      }
    }

    // Create subscription in incomplete state so we can confirm via Elements.
    // Must expand BOTH 'latest_invoice' AND 'latest_invoice.confirmation_secret' to get the client_secret.
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: MONTHLY_PRICE_ID }],
      payment_behavior: "default_incomplete",
      payment_settings: {
        // "card" covers Apple Pay / Google Pay (they create card tokens).
        // "link" enables Stripe Link for saved-email fast checkout.
        payment_method_types: ["card", "link"],
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice", "latest_invoice.confirmation_secret"],
      metadata: {
        userId:    user.id,
        type:      "subscription",
        planId:    "monthly",
        planType:  "individual",
        ...(creator    ? { creator }    : {}),
        ...(promoCode  ? { promoCode }  : {}),
        ...(source     ? { source }     : {}),
        ...(utmSource  ? { utmSource }  : {}),
        ...(utmCampaign  ? { utmCampaign }  : {}),
        ...(utmMedium  ? { utmMedium }  : {}),
        ...(utmContent ? { utmContent } : {}),
      },
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

    // Tag the underlying PaymentIntent so the webhook skips creating a Purchase record.
    // Log but don't fail if the update errors — the invoice field on the PI will still
    // cause the webhook to recognise it as a subscription payment and skip it safely.
    const piId: string | null = invoice?.confirmation_secret?.payment_intent ?? null;
    if (piId) {
      await stripe.paymentIntents.update(piId, {
        metadata: {
          type:     "subscription",
          userId:   user.id,
          planId:   "monthly",
          planType: "individual",
          subscriptionId: subscription.id,
          ...(creator   ? { creator }   : {}),
          ...(promoCode ? { promoCode } : {}),
          ...(source    ? { source }    : {}),
          ...(utmSource ? { utmSource } : {}),
          ...(utmCampaign ? { utmCampaign } : {}),
        },
      }).catch((e) => console.error("[CREATE-SUBSCRIPTION-INTENT] Could not update PI metadata:", e));
    } else {
      console.warn("[CREATE-SUBSCRIPTION-INTENT] No payment_intent ID found on confirmation_secret — PI metadata not tagged");
    }

    return NextResponse.json({ clientSecret, amount: PLANS.monthly.price });
  } catch (error) {
    console.error("[CREATE-SUBSCRIPTION-INTENT] Error:", error);
    return NextResponse.json(
      { error: "Failed to initialize payment. Please try again." },
      { status: 500 }
    );
  }
}
