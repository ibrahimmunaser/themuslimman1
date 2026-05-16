import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  // ── 1. Require authenticated session ───────────────────────────────────────
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    console.warn("[VERIFY-PAYMENT] Rejected: no authenticated session");
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const paymentIntentId = searchParams.get("payment_intent");

  if (!paymentIntentId) {
    return NextResponse.json(
      { error: "No payment intent ID provided" },
      { status: 400 }
    );
  }

  console.log(
    `[VERIFY-PAYMENT] Session user: ${currentUser.id} | PaymentIntent: ${paymentIntentId}`
  );

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // ── 2. Payment must have succeeded ───────────────────────────────────────
    if (paymentIntent.status !== "succeeded") {
      console.log(
        `[VERIFY-PAYMENT] Intent ${paymentIntentId} status is "${paymentIntent.status}" — not succeeded`
      );
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    const { userId, planId, planName } = paymentIntent.metadata;

    // ── 3. Metadata must contain a userId ────────────────────────────────────
    if (!userId) {
      console.error(
        `[VERIFY-PAYMENT] Intent ${paymentIntentId} has no userId in metadata`
      );
      return NextResponse.json(
        { error: "Invalid payment data" },
        { status: 400 }
      );
    }

    // ── 4. Session user must be the payer ────────────────────────────────────
    if (userId !== currentUser.id) {
      console.warn(
        `[VERIFY-PAYMENT] MISMATCH — session user: ${currentUser.id} | metadata user: ${userId} | intent: ${paymentIntentId}`
      );
      return NextResponse.json(
        { error: "Payment does not belong to this account" },
        { status: 403 }
      );
    }

    if (!planId) {
      console.error(
        `[VERIFY-PAYMENT] Intent ${paymentIntentId} has no planId in metadata`
      );
      return NextResponse.json(
        { error: "Invalid payment data" },
        { status: 400 }
      );
    }

    // ── 5. Idempotent upsert — safe if webhook already ran ───────────────────
    console.log(
      `[VERIFY-PAYMENT] Checks passed for user ${currentUser.id} — upserting purchase…`
    );
    await prisma.purchase.upsert({
      where: { stripePaymentIntentId: paymentIntent.id },
      update: {},
      create: {
        userId,
        planId,
        planName: planName ?? planId,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        stripePaymentIntentId: paymentIntent.id,
        status: "succeeded",
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { hasPaid: true },
    });

    console.log(`[VERIFY-PAYMENT] Access granted for user ${currentUser.id}`);

    return NextResponse.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });
  } catch (error) {
    console.error("[VERIFY-PAYMENT] Error:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
