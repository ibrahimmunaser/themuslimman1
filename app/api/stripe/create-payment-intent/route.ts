import { NextRequest, NextResponse } from "next/server";
import { stripe, PLANS, type PlanId } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";
import { validatePromoCode, applyDiscount } from "@/lib/promo-codes";
import { getCreatorPromoConfig } from "@/lib/creator-promos";
import {
  getBasePrice,
  isEarlyAccessActive,
  EARLY_ACCESS_END_DATE,
  REGULAR_PRICE,
} from "@/lib/early-access";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to make a purchase" },
        { status: 401 }
      );
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Please verify your email address before making a purchase", requiresVerification: true },
        { status: 403 }
      );
    }

    const body = await request.json();
    // Only "complete" is sold during early access — silently upgrade any other plan
    const planId: PlanId = "complete";
    const { promoCode } = body as { promoCode?: string };

    const plan = PLANS[planId];

    // Server decides the price — always $99, client cannot override.
    const earlyAccessActive = isEarlyAccessActive(); // always false
    const baseAmount: number = getBasePrice(); // always 9900

    // ── Apply promo code if provided ──
    let finalAmount: number = baseAmount;
    let appliedPromoCode: string | null = null;
    let promoDiscountAmount = 0;

    if (promoCode && promoCode.trim().length > 0) {
      const promo = validatePromoCode(promoCode);
      if (!promo) {
        return NextResponse.json({ error: "Invalid promo code" }, { status: 400 });
      }
      finalAmount = applyDiscount(baseAmount, promo);
      promoDiscountAmount = baseAmount - finalAmount;
      appliedPromoCode = promoCode.trim().toUpperCase();
    }

    const earlyAccessDiscount = 0; // no early-access discount — price is flat $99

    // Resolve creator metadata from the promo code (if it's a creator code)
    const creatorConfig = appliedPromoCode ? getCreatorPromoConfig(appliedPromoCode) : null;

    // ── Free access: skip Stripe entirely ──────────────────────────────────
    if (finalAmount === 0) {
      return NextResponse.json({
        freeAccess: true,
        appliedPromoCode,
        earlyAccessActive,
        regularAmount: REGULAR_PRICE,
        baseAmount,
        earlyAccessDiscount,
        promoDiscountAmount,
        finalAmount: 0,
      });
    }

    // ── Create Stripe PaymentIntent ──
    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmount,
      currency: "usd",
      payment_method_types: ["card"],
      metadata: {
        userId: user.id,
        planId: plan.id,
        planName: plan.name,
        earlyAccessActive: String(earlyAccessActive),
        earlyAccessEndDate: EARLY_ACCESS_END_DATE.toISOString(),
        regularAmount: String(REGULAR_PRICE),
        baseAmount: String(baseAmount),
        earlyAccessDiscount: String(earlyAccessDiscount),
        finalAmount: String(finalAmount),
        ...(appliedPromoCode
          ? {
              promoCode: appliedPromoCode,
              promoDiscountAmount: String(promoDiscountAmount),
            }
          : {}),
        ...(creatorConfig
          ? {
              creator: creatorConfig.creator,
              utm_source: creatorConfig.utm_source,
              utm_medium: creatorConfig.utm_medium,
              utm_campaign: creatorConfig.utm_campaign,
              utm_content: creatorConfig.utm_content,
            }
          : {}),
      },
      description: `${plan.name} — TheMuslimMan${appliedPromoCode ? ` (${appliedPromoCode})` : ""}`,
      receipt_email: user.email,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      freeAccess: false,
      earlyAccessActive,
      earlyAccessEndDate: EARLY_ACCESS_END_DATE.toISOString(),
      regularAmount: REGULAR_PRICE,
      baseAmount,
      earlyAccessDiscount,
      promoDiscountAmount,
      finalAmount,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to initialize payment: ${errorMessage}` },
      { status: 500 }
    );
  }
}
