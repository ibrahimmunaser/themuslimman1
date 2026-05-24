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
    const { recipientEmail, recipientName, giftMessage } = body as {
      recipientEmail: string;
      recipientName?: string;
      giftMessage?: string;
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

    const plan = PLANS.complete;
    const earlyAccessActive = isEarlyAccessActive();
    const baseAmount = getBasePrice();
    const earlyAccessDiscount = earlyAccessActive ? REGULAR_PRICE - baseAmount : 0;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: baseAmount,
      currency: "usd",
      payment_method_types: ["card"],
      metadata: {
        type: "gift",
        purchaserUserId: user.id,
        purchaserEmail: user.email,
        recipientEmail: recipientEmail.trim().toLowerCase(),
        recipientName: recipientName?.trim() ?? "",
        giftMessage: giftMessage?.trim() ?? "",
        planId: plan.id,
        planName: plan.name,
        earlyAccessActive: String(earlyAccessActive),
        earlyAccessEndDate: EARLY_ACCESS_END_DATE.toISOString(),
        regularAmount: String(REGULAR_PRICE),
        baseAmount: String(baseAmount),
        earlyAccessDiscount: String(earlyAccessDiscount),
        finalAmount: String(baseAmount),
      },
      description: `Gift: ${plan.name} → ${recipientEmail.trim().toLowerCase()} — TheMuslimMan`,
      receipt_email: user.email,
    });

    // Create a pending gift record so we have it before payment completes
    await prisma.giftPurchase.create({
      data: {
        stripePaymentIntentId: paymentIntent.id,
        purchaserUserId: user.id,
        purchaserEmail: user.email,
        recipientEmail: recipientEmail.trim().toLowerCase(),
        recipientName: recipientName?.trim() || null,
        giftMessage: giftMessage?.trim() || null,
        status: "pending",
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      earlyAccessActive,
      earlyAccessEndDate: EARLY_ACCESS_END_DATE.toISOString(),
      regularAmount: REGULAR_PRICE,
      baseAmount,
      earlyAccessDiscount,
      finalAmount: baseAmount,
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
