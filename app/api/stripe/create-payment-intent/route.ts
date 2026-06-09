import { NextRequest, NextResponse } from "next/server";
import { stripe, PLANS, type PlanId } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";
import { validatePromoCode, applyDiscount } from "@/lib/promo-codes";
import { getCreatorPromoConfig } from "@/lib/creator-promos";
/** Individual lifetime price in cents ($79). */
const BASE_PRICE = 7900;
import { getUserAccessInfo } from "@/lib/access";

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

    // If the user already has lifetime access, there is nothing to buy.
    // Monthly subscribers are NOT blocked — they can still upgrade to lifetime.
    const { hasLifetime } = await getUserAccessInfo(user.id);
    if (hasLifetime) {
      return NextResponse.json(
        { error: "You already have access to this course", hasLifetime: true },
        { status: 409 }
      );
    }

    const body = await request.json();
    // Only "complete" is sold during early access — silently upgrade any other plan
    const planId: PlanId = "complete";
    const { promoCode } = body as { promoCode?: string };

    const plan = PLANS[planId];

    // Server decides the price — always $79 (7900 cents), client cannot override.
    const baseAmount: number = BASE_PRICE;

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

    // Resolve creator metadata from the promo code (if it's a creator code)
    const creatorConfig = appliedPromoCode ? getCreatorPromoConfig(appliedPromoCode) : null;

    // ── Free access: skip Stripe entirely ──────────────────────────────────
    if (finalAmount === 0) {
      return NextResponse.json({
        freeAccess: true,
        appliedPromoCode,
        baseAmount,
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
        baseAmount: String(baseAmount),
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
      baseAmount,
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
