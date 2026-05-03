import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const paymentIntentId = searchParams.get("payment_intent");

  if (!paymentIntentId) {
    return NextResponse.json(
      { error: "No payment intent ID provided" },
      { status: 400 }
    );
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    // Ensure the purchase record exists immediately — don't wait for the webhook
    const { userId, planId, planName } = paymentIntent.metadata;
    if (userId && planId) {
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
    }

    return NextResponse.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
