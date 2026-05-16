import { NextRequest, NextResponse } from "next/server";
import { stripe, PLANS, type PlanId } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";
import { validatePromoCode, applyDiscount } from "@/lib/promo-codes";
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

    // ── Deadline-aware base price (server decides, client cannot override) ──
    const earlyAccessActive = isEarlyAccessActive();
    const baseAmount: number = getBasePrice(); // 9900 or 14900

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

    const earlyAccessDiscount = earlyAccessActive ? REGULAR_PRICE - baseAmount : 0; // 5000 or 0

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
        regularAmount: String(REGULAR_PRICE),       // always $149
        baseAmount: String(baseAmount),             // $99 or $149
        earlyAccessDiscount: String(earlyAccessDiscount), // $50 or $0
        finalAmount: String(finalAmount),
        ...(appliedPromoCode
          ? {
              promoCode: appliedPromoCode,
              promoDiscountAmount: String(promoDiscountAmount),
            }
          : {}),
      },
      description: `${plan.name} — TheMuslimMan${appliedPromoCode ? ` (${appliedPromoCode})` : ""}`,
      receipt_email: user.email,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      // These fields drive the checkout UI — all server-computed
      earlyAccessActive,
      earlyAccessEndDate: EARLY_ACCESS_END_DATE.toISOString(),
      regularAmount: REGULAR_PRICE,      // 14900
      baseAmount,                         // 9900 or 14900
      earlyAccessDiscount,               // 5000 or 0
      promoDiscountAmount,               // e.g. 5000 for AMS49 against $99 base
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
