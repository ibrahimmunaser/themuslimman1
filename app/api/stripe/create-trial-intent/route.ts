import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getUserAccessInfo, getActiveSubscription } from "@/lib/access";
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

    // Block users who already have active access of the SAME plan type.
    // Upgrading from individual → family (or vice versa) is allowed.
    const [accessInfo, activeSub] = await Promise.all([
      getUserAccessInfo(user.id, user.hasPaid),
      getActiveSubscription(user.id),
    ]);

    if (accessInfo.hasLifetime) {
      // Block lifetime holders only if they already have the matching scope.
      // Individual lifetime holders can still upgrade to a family trial.
      const alreadyHasSameScope =
        isFamily ? user.planType === "family" : user.planType !== "family";
      if (alreadyHasSameScope) {
        return NextResponse.json(
          { error: "You already have lifetime access.", hasLifetime: true },
          { status: 409 }
        );
      }
    }
    // How many trial days to grant for this purchase.
    // Default = full 7 days. If the user is upgrading from an existing trial of
    // a different plan type, carry over only the REMAINING days from their current
    // trial — this closes the loophole where someone could stack two 7-day trials
    // (individual then family) for $2 and get ~14 days free.
    let effectiveTrialDays: number | null = null; // null = use plan default

    if (activeSub) {
      const activeIsFamily = user.planType === "family";
      // The ONLY allowed cross-plan case is an upgrade: individual → family.
      // Everything else is blocked:
      //   individual → individual  (duplicate)
      //   family     → family      (duplicate)
      //   family     → individual  (downgrade — family already includes individual access)
      const isUpgrade = !activeIsFamily && isFamily;
      if (!isUpgrade) {
        return NextResponse.json(
          {
            error: activeIsFamily && !isFamily
              ? "You already have a Family plan. It includes everything in the Individual plan."
              : "You already have an active subscription.",
            hasActiveSubscription: true,
            currentPlanType: user.planType ?? "individual",
          },
          { status: 409 }
        );
      }

      // Cross-plan upgrade (e.g. individual trial → family trial).
      // Calculate remaining days from the existing trial so the total free
      // period never exceeds the original 7 days.
      const msRemaining = activeSub.currentPeriodEnd.getTime() - Date.now();
      effectiveTrialDays = Math.max(0, Math.ceil(msRemaining / 86_400_000));
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
    // Use remaining days when upgrading from another trial; otherwise full trial.
    const trialDaysToGrant = effectiveTrialDays ?? planConfig.trialDays;

    // Create a PaymentIntent for the $1 trial fee only.
    // The actual subscription (with trial_period_days) is created by the webhook
    // in handleTrialFeePayment AFTER this PI succeeds — ensuring no access is
    // granted and no welcome email is sent until real payment is confirmed.
    const paymentIntent = await stripe.paymentIntents.create({
      amount: planConfig.trialFeeAmount,
      currency: "usd",
      customer: customerId,
      payment_method_types: ["card"],
      setup_future_usage: "off_session", // save card for future subscription charges
      metadata: {
        type: "trial_fee",
        userId: user.id,
        planId: planConfig.id,
        monthlyPriceId,
        trialDays: String(trialDaysToGrant),
        // Flag if this is an upgrade so the webhook knows to skip the trial
        // when 0 days remain (user already used their full trial period).
        ...(effectiveTrialDays !== null ? { isUpgradedTrial: "true" } : {}),
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
