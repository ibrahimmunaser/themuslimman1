import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";
import { PLANS } from "@/lib/stripe-config";
import { validatePromoCode, applyDiscount } from "@/lib/promo-codes";

// Source of truth: STRIPE_FAMILY_LIFETIME_PRICE_ID env var (used only for metadata / Stripe dashboard linkage).
const FAMILY_LIFETIME_PRICE_ID = process.env.STRIPE_FAMILY_LIFETIME_PRICE_ID ?? "";
const FAMILY_PLAN = PLANS.family;

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to purchase Family Access" },
        { status: 401 }
      );
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Please verify your email address before making a purchase", requiresVerification: true },
        { status: 403 }
      );
    }

    // Block users who are already on Family Access — nothing to upgrade to.
    if (user.planType === "family") {
      return NextResponse.json(
        { error: "You already have Family Access", hasFamily: true },
        { status: 409 }
      );
    }

    // Unlike the individual checkout, we do NOT block existing Individual-plan
    // users — they're upgrading from Individual to Family.

    const body = await request.json();
    const { promoCode, isUpgrade } = body as { promoCode?: string; isUpgrade?: boolean };

    // Individual Lifetime → Family Lifetime upgrade: charge only the $100 difference.
    // Verified server-side: user must have hasPaid=true and not already be on family plan.
    const isEligibleForUpgradePrice = isUpgrade && user.hasPaid && user.planType !== "family";

    const baseAmount: number = isEligibleForUpgradePrice
      ? FAMILY_PLAN.upgradeFromLifetimePrice  // 10000 cents = $100.00
      : FAMILY_PLAN.price;                    // 19900 cents = $199.00

    // Apply promo code discount if provided
    let finalAmount: number = baseAmount;
    let appliedPromoCode: string | null = null;
    let promoDiscountAmount = 0;

    if (promoCode?.trim()) {
      const promo = validatePromoCode(promoCode);
      if (!promo) {
        return NextResponse.json({ error: "Invalid promo code" }, { status: 400 });
      }
      finalAmount = applyDiscount(baseAmount, promo);
      promoDiscountAmount = baseAmount - finalAmount;
      appliedPromoCode = promoCode.trim().toUpperCase();
    }

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmount,
      currency: "usd",
      payment_method_types: ["card"],
      metadata: {
        userId: user.id,
        planId: FAMILY_PLAN.id,                    // "family" — drives planType in webhook
        planName: FAMILY_PLAN.name,                // "Family Access"
        stripeProductId: FAMILY_PLAN.stripeProductId, // prod_UbM83Q8KLI4HX0
        ...(FAMILY_LIFETIME_PRICE_ID.startsWith("price_")
          ? { stripePriceId: FAMILY_LIFETIME_PRICE_ID }
          : {}),
        baseAmount: String(baseAmount),
        finalAmount: String(finalAmount),
        ...(isEligibleForUpgradePrice ? { upgradeFrom: "individual_lifetime" } : {}),
        ...(appliedPromoCode
          ? { promoCode: appliedPromoCode, promoDiscountAmount: String(promoDiscountAmount) }
          : {}),
      },
      description: `${FAMILY_PLAN.name} — TheMuslimMan${appliedPromoCode ? ` (${appliedPromoCode})` : ""}`,
      receipt_email: user.email,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      baseAmount,
      promoDiscountAmount,
      finalAmount,
      isUpgrade: isEligibleForUpgradePrice,
    });
  } catch (error) {
    console.error("[FAMILY_CHECKOUT] Error creating payment intent:", error);
    return NextResponse.json(
      { error: `Failed to initialize payment: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
