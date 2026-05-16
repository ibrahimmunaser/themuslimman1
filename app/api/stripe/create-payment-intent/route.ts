import { NextRequest, NextResponse } from "next/server";
import { stripe, PLANS, type PlanId } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";
import { validatePromoCode, applyDiscount } from "@/lib/promo-codes";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to make a purchase" },
        { status: 401 }
      );
    }

    // Check if email is verified
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

    // Apply promo code discount if provided and valid
    let finalAmount: number = plan.price;
    let discountAmount = 0;
    let appliedPromoCode: string | null = null;

    if (promoCode && promoCode.trim().length > 0) {
      const promo = validatePromoCode(promoCode);
      if (promo) {
        finalAmount = applyDiscount(plan.price, promo);
        discountAmount = plan.price - finalAmount;
        appliedPromoCode = promoCode.trim().toUpperCase();
      }
    }

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmount,
      currency: "usd",
      payment_method_types: ["card"],
      metadata: {
        userId: user.id,
        planId: plan.id,
        planName: plan.name,
        ...(appliedPromoCode ? { promoCode: appliedPromoCode, discountAmount: String(discountAmount) } : {}),
      },
      description: `${plan.name} - TheMuslimMan Seerah Course${appliedPromoCode ? ` (code: ${appliedPromoCode})` : ""}`,
      receipt_email: user.email,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      finalAmount,
      discountAmount,
      originalAmount: plan.price,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error details:", errorMessage);
    return NextResponse.json(
      { error: `Failed to initialize payment: ${errorMessage}` },
      { status: 500 }
    );
  }
}
