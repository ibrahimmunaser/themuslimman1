import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getUserAccessInfo } from "@/lib/access";
import { checkRateLimit, getIP } from "@/lib/rate-limit";
import { resolveTrialPriceId } from "@/lib/trial-eligibility";

/**
 * POST /api/stripe/create-trial-intent
 *
 * Body: { planId: "individualTrial" | "familyTrial", creator?: string, promoCode?: string }
 *
 * Free 7-day trial flow — BLK-02 fix.
 *
 * This route creates ONLY a Stripe SetupIntent. It does NOT create a Stripe
 * subscription, a local Subscription row, a welcome email, or any access
 * grant — those all used to happen here, immediately, before the customer
 * had actually confirmed a payment method. That let a subscription enter
 * Stripe's "trialing" status (and this app's access checks treat "trialing"
 * as active access) before any card was verified, and it already caused one
 * real production incident, manually patched by scripts/fix-trial-user.js
 * ("Fix the user who got a premature trial subscription before payment").
 *
 * The Stripe subscription, local Subscription row, welcome email, and
 * planType=family update are now created exclusively by the
 * setup_intent.succeeded webhook handler (handleTrialSetupIntentSucceeded in
 * app/api/stripe/webhook/route.ts), which only runs after Stripe confirms
 * the SetupIntent actually succeeded (payment method verified, 3DS included
 * where required). That handler is additionally guarded by a TrialEligibility
 * DB claim (one trial per user per course) and a Stripe idempotency key on
 * the subscription-creation call, so concurrent or duplicate SetupIntents
 * can never create two trial subscriptions for the same user.
 *
 * creator/promoCode (if present) are carried on the SetupIntent's metadata
 * so the webhook can propagate them onto the Stripe subscription's own
 * metadata (and from there into the Subscription row's creator/promoCode
 * columns), preserving affiliate/creator attribution through the new flow.
 */
export async function POST(request: NextRequest) {
  const ip = getIP(request);
  const rl = checkRateLimit(`create-trial-intent:${ip}`, 10, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to start a trial" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as { planId?: string; creator?: string; promoCode?: string };
    const planId = body.planId === "familyTrial" ? "familyTrial" : "individualTrial";
    const creator   = typeof body.creator   === "string" ? body.creator   : undefined;
    const promoCode = typeof body.promoCode === "string" ? body.promoCode : undefined;

    if (!resolveTrialPriceId(planId)) {
      console.error("[CREATE-TRIAL-INTENT] Monthly price ID not configured for planId:", planId);
      return NextResponse.json(
        { error: "Trial checkout is not configured. Contact support." },
        { status: 500 }
      );
    }

    // ── Access & subscription checks ─────────────────────────────────────────
    const accessInfo = await getUserAccessInfo(user.id, user.hasPaid);
    if (accessInfo.hasAccess) {
      return NextResponse.json(
        { error: "You already have active access.", hasAccess: true },
        { status: 409 }
      );
    }

    // One free trial per account — fast, user-friendly pre-check ONLY.
    // The AUTHORITATIVE enforcement is the TrialEligibility unique constraint
    // claimed inside the setup_intent.succeeded webhook handler, not this
    // read. There is no longer any Stripe subscription (and therefore no
    // "abandoned checkout" pending_setup_intent) to recover here — every
    // fresh call simply issues a new SetupIntent. If this pre-check races
    // (e.g. two tabs), the worst outcome is one extra, harmless, never-used
    // SetupIntent; the webhook's claim is what actually prevents a second
    // trial subscription from ever being created.
    const priorSub = await prisma.subscription.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });

    if (priorSub) {
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

    // ── Ensure Stripe customer ────────────────────────────────────────────────
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

    // ── Create a SetupIntent only ─────────────────────────────────────────────
    // No subscription, no DB row, no email — see doc comment above. The
    // webhook re-resolves planId to a trusted priceId via resolveTrialPriceId
    // rather than trusting a raw price ID placed in metadata.
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      usage: "off_session",
      metadata: {
        userId: user.id,
        planId,
        type: "trial_setup",
        ...(creator   ? { creator }   : {}),
        ...(promoCode ? { promoCode } : {}),
      },
    });

    if (!setupIntent.client_secret) {
      return NextResponse.json(
        { error: "Failed to initialize trial setup. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      isFreeTrialSetup: true,
    });
  } catch (error) {
    console.error("[CREATE-TRIAL-INTENT] Error:", error);
    return NextResponse.json(
      { error: "Failed to initialize trial. Please try again." },
      { status: 500 }
    );
  }
}
