import { NextRequest, NextResponse } from "next/server";
import { stripe, PLANS } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  getBasePrice,
  isEarlyAccessActive,
  EARLY_ACCESS_END_DATE,
  REGULAR_PRICE,
} from "@/lib/early-access";
import { validatePromoCode, applyDiscount } from "@/lib/promo-codes";

// Family lifetime price ID for Stripe metadata linkage
const FAMILY_LIFETIME_PRICE_ID = process.env.STRIPE_FAMILY_LIFETIME_PRICE_ID ?? "";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to purchase a gift" },
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
    const { recipientEmail, recipientName, giftMessage, promoCode, planId: rawPlanId } = body as {
      recipientEmail: string;
      recipientName?: string;
      giftMessage?: string;
      promoCode?: string;
      planId?: string;
    };

    if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      return NextResponse.json(
        { error: "A valid recipient email address is required" },
        { status: 400 }
      );
    }

    if (recipientEmail.toLowerCase() === user.email.toLowerCase()) {
      return NextResponse.json(
        { error: "You cannot gift the course to yourself. Use the regular checkout instead." },
        { status: 400 }
      );
    }

    // Resolve plan — "family" or default to "complete" (individual)
    const planId = rawPlanId === "family" ? "family" : "complete";
    const isFamily = planId === "family";
    const plan = isFamily ? PLANS.family : PLANS.complete;

    // For individual plan, use the dynamic early-access price.
    // Family lifetime has a fixed price.
    const earlyAccessActive = isEarlyAccessActive();
    const baseAmount = isFamily ? PLANS.family.price : getBasePrice();
    const earlyAccessDiscount = (!isFamily && earlyAccessActive) ? REGULAR_PRICE - baseAmount : 0;

    // Apply creator/promo discount if provided
    let finalAmount = baseAmount;
    let promoDiscountAmount = 0;
    let appliedPromoCode: string | null = null;
    let appliedPromoLabel: string | null = null;

    if (promoCode) {
      const promo = validatePromoCode(promoCode);
      if (promo) {
        finalAmount = applyDiscount(baseAmount, promo);
        promoDiscountAmount = baseAmount - finalAmount;
        appliedPromoCode = promoCode.trim().toUpperCase();
        appliedPromoLabel = promo.label;
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmount,
      currency: "usd",
      payment_method_types: ["card"],
      metadata: {
        type: "gift",
        planId,
        planName: plan.name,
        purchaserUserId: user.id,
        purchaserEmail: user.email,
        recipientEmail: recipientEmail.trim().toLowerCase(),
        recipientName: recipientName?.trim() ?? "",
        giftMessage: giftMessage?.trim() ?? "",
        earlyAccessActive: String(earlyAccessActive),
        earlyAccessEndDate: EARLY_ACCESS_END_DATE.toISOString(),
        regularAmount: String(REGULAR_PRICE),
        baseAmount: String(baseAmount),
        earlyAccessDiscount: String(earlyAccessDiscount),
        promoCode: appliedPromoCode ?? "",
        promoDiscountAmount: String(promoDiscountAmount),
        finalAmount: String(finalAmount),
        ...(isFamily && FAMILY_LIFETIME_PRICE_ID.startsWith("price_")
          ? { stripePriceId: FAMILY_LIFETIME_PRICE_ID }
          : {}),
      },
      description: `Gift: ${plan.name} → ${recipientEmail.trim().toLowerCase()} — TheMuslimMan`,
      receipt_email: user.email,
    });

    // Create a pending gift record
    await prisma.giftPurchase.create({
      data: {
        id: crypto.randomUUID(),
        stripePaymentIntentId: paymentIntent.id,
        purchaserUserId: user.id,
        purchaserEmail: user.email,
        recipientEmail: recipientEmail.trim().toLowerCase(),
        recipientName: recipientName?.trim() || null,
        giftMessage: giftMessage?.trim() || null,
        planId,
        status: "pending",
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      planId,
      earlyAccessActive,
      earlyAccessEndDate: EARLY_ACCESS_END_DATE.toISOString(),
      regularAmount: REGULAR_PRICE,
      baseAmount,
      earlyAccessDiscount,
      promoCode: appliedPromoCode,
      promoLabel: appliedPromoLabel,
      promoDiscountAmount,
      finalAmount,
    });
  } catch (error) {
    console.error("[GIFT-PAYMENT] Error creating gift payment intent:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to initialize gift payment: ${message}` },
      { status: 500 }
    );
  }
}
