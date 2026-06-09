import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getUserAccessInfo, getActiveSubscription } from "@/lib/access";
import { PLANS } from "@/lib/stripe-config";

const INDIVIDUAL_TRIAL_FEE_PRICE_ID =
  process.env.STRIPE_PRICE_INDIVIDUAL_TRIAL_FEE ?? "";
const INDIVIDUAL_MONTHLY_PRICE_ID =
  process.env.STRIPE_PRICE_INDIVIDUAL_MONTHLY ??
  process.env.STRIPE_MONTHLY_PRICE_ID ??
  "";
const FAMILY_TRIAL_FEE_PRICE_ID =
  process.env.STRIPE_PRICE_FAMILY_TRIAL_FEE ?? "";
const FAMILY_MONTHLY_PRICE_ID =
  process.env.STRIPE_PRICE_FAMILY_MONTHLY ??
  process.env.STRIPE_FAMILY_MONTHLY_PRICE_ID ??
  "";

/**
 * POST /api/stripe/create-trial-intent
 *
 * Body: { planId: "individualTrial" | "familyTrial" }
 *
 * Creates a Stripe subscription with a 7-day trial and a $1 upfront trial fee.
 * Returns { clientSecret, amount } for use with Stripe Elements.
 *
 * Email verification is NOT required before payment — per our design, payment
 * grants entitlement and email verification gates dashboard access.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to start a trial" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as { planId?: string };
    const planId = body.planId ?? "individualTrial";
    const isFamily = planId === "familyTrial";

    const trialFeePriceId = isFamily
      ? FAMILY_TRIAL_FEE_PRICE_ID
      : INDIVIDUAL_TRIAL_FEE_PRICE_ID;
    const monthlyPriceId = isFamily
      ? FAMILY_MONTHLY_PRICE_ID
      : INDIVIDUAL_MONTHLY_PRICE_ID;

    if (
      !trialFeePriceId.startsWith("price_") ||
      !monthlyPriceId.startsWith("price_")
    ) {
      console.error(
        "[CREATE-TRIAL-INTENT] Price IDs not configured.",
        "trialFee:", trialFeePriceId,
        "monthly:", monthlyPriceId
      );
      return NextResponse.json(
        { error: "Trial checkout is not configured. Contact support." },
        { status: 500 }
      );
    }

    // Block users who already have active access
    const [accessInfo, activeSub] = await Promise.all([
      getUserAccessInfo(user.id, user.hasPaid),
      getActiveSubscription(user.id),
    ]);

    if (accessInfo.hasLifetime) {
      return NextResponse.json(
        { error: "You already have lifetime access.", hasLifetime: true },
        { status: 409 }
      );
    }
    if (activeSub) {
      return NextResponse.json(
        {
          error: "You already have an active subscription.",
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
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Cancel any existing incomplete or past_due subscriptions
    for (const statusFilter of ["incomplete", "past_due"] as const) {
      const existingSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: statusFilter,
        limit: 5,
      });
      for (const s of existingSubs.data) {
        await stripe.subscriptions
          .cancel(s.id)
          .catch((e) =>
            console.warn(
              `[CREATE-TRIAL-INTENT] Could not cancel ${statusFilter} sub ${s.id}:`,
              e
            )
          );
      }
    }

    // Add a $1 trial fee invoice item so it appears on the first invoice.
    // Stripe SDK v22+ uses pricing.price instead of a top-level price field.
    await stripe.invoiceItems.create({
      customer: customerId,
      pricing: { price: trialFeePriceId },
    });

    // Create subscription with 7-day trial in incomplete state
    const planConfig = isFamily ? PLANS.familyTrial : PLANS.individualTrial;
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: monthlyPriceId }],
      trial_period_days: planConfig.trialDays,
      payment_behavior: "default_incomplete",
      payment_settings: {
        payment_method_types: ["card"],
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice", "latest_invoice.confirmation_secret"],
      metadata: {
        userId: user.id,
        planId: planConfig.id,
        type: "subscription",
        isTrial: "true",
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invoice = subscription.latest_invoice as any;
    const clientSecret: string | null =
      invoice?.confirmation_secret?.client_secret ?? null;

    if (!clientSecret) {
      console.error(
        "[CREATE-TRIAL-INTENT] No client_secret found. confirmation_secret:",
        invoice?.confirmation_secret
      );
      await stripe.subscriptions.cancel(subscription.id).catch(() => {});
      return NextResponse.json(
        { error: "Could not create trial payment" },
        { status: 500 }
      );
    }

    // Tag the underlying PaymentIntent with subscription metadata
    const piId: string | null =
      invoice?.confirmation_secret?.payment_intent ?? null;
    if (piId) {
      await stripe.paymentIntents
        .update(piId, {
          metadata: {
            type: "subscription",
            userId: user.id,
            subscriptionId: subscription.id,
            isTrial: "true",
          },
        })
        .catch((e) =>
          console.error(
            "[CREATE-TRIAL-INTENT] Could not update PI metadata:",
            e
          )
        );
    }

    return NextResponse.json({
      clientSecret,
      amount: planConfig.trialFeeAmount,
    });
  } catch (error) {
    console.error("[CREATE-TRIAL-INTENT] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to create trial: ${message}` },
      { status: 500 }
    );
  }
}
