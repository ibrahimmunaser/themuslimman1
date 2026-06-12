import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getUserAccessInfo } from "@/lib/access";
import { PLANS } from "@/lib/stripe-config";

const INDIVIDUAL_MONTHLY_PRICE_ID =
  process.env.STRIPE_PRICE_INDIVIDUAL_MONTHLY ??
  process.env.STRIPE_MONTHLY_PRICE_ID ??
  "";
const FAMILY_MONTHLY_PRICE_ID =
  process.env.STRIPE_PRICE_FAMILY_MONTHLY ??
  process.env.STRIPE_FAMILY_MONTHLY_PRICE_ID ??
  "";

/**
 * POST /api/stripe/create-trial-intent
 *
 * Body: { planId: "individualTrial" | "familyTrial" }
 *
 * Creates a $1 PaymentIntent for the trial fee.
 * The subscription with trial_period_days is created in the webhook
 * AFTER the $1 payment is confirmed — this is critical so that:
 *  - No subscription (and thus no course access) exists before payment
 *  - The welcome email is only sent after real payment
 *
 * Email verification is NOT required before payment — per our design,
 * payment grants entitlement and email verification gates dashboard access.
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

    const monthlyPriceId = isFamily
      ? FAMILY_MONTHLY_PRICE_ID
      : INDIVIDUAL_MONTHLY_PRICE_ID;

    if (!monthlyPriceId.startsWith("price_")) {
      console.error(
        "[CREATE-TRIAL-INTENT] Monthly price ID not configured.",
        "monthly:", monthlyPriceId
      );
      return NextResponse.json(
        { error: "Trial checkout is not configured. Contact support." },
        { status: 500 }
      );
    }

    // ── Access & subscription checks ─────────────────────────────────────────
    const accessInfo = await getUserAccessInfo(user.id, user.hasPaid);

    // Block any user who already has active course access — this covers:
    //   • Lifetime buyers (hasPaid = true)
    //   • Active/trialing Stripe subscribers
    //   • Active mobile IAP subscribers (MobilePurchase table)
    // Individual lifetime holders who want family access are redirected by
    // checkout/page.tsx to /checkout?plan=family-lifetime before they reach here.
    if (accessInfo.hasAccess) {
      return NextResponse.json(
        { error: "You already have active access.", hasAccess: true },
        { status: 409 }
      );
    }

    // ── One $1 trial per account ───────────────────────────────────────────────
    // A user may use the $1 starter offer ONCE across any plan (individual or family).
    // If any subscription row exists in the DB (even a cancelled one) the user has
    // already consumed their trial and must upgrade via family monthly or lifetime.
    const anyPriorSub = await prisma.subscription.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });

    if (anyPriorSub) {
      const isOnFamily = user.planType === "family";
      return NextResponse.json(
        {
          error: isOnFamily
            ? "You already have a Family plan. Manage it from your billing page."
            : "You've already used your free trial. Upgrade to Family Monthly or Family Lifetime instead.",
          trialAlreadyUsed: true,
          hasActiveSubscription: !isOnFamily,
          currentPlanType: user.planType ?? "individual",
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

    const planConfig = isFamily ? PLANS.familyTrial : PLANS.individualTrial;

    // Create a PaymentIntent for the $1 trial fee only.
    // The actual subscription (with trial_period_days) is created by the webhook
    // in handleTrialFeePayment AFTER this PI succeeds — ensuring no access is
    // granted and no welcome email is sent until real payment is confirmed.
    const paymentIntent = await stripe.paymentIntents.create({
      amount: planConfig.trialFeeAmount,
      currency: "usd",
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      setup_future_usage: "off_session", // save payment method for future subscription charges
      metadata: {
        type: "trial_fee",
        userId: user.id,
        planId: planConfig.id,
        monthlyPriceId,
        trialDays: String(planConfig.trialDays),
      },
      description: `${planConfig.name} — 7-day trial fee`,
      receipt_email: user.email,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
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
