import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hashGiftToken } from "@/lib/gift";
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in to claim a gift" }, { status: 401 });
  }

  const { token } = (await request.json()) as { token?: string };
  if (!token || typeof token !== "string" || token.trim().length === 0) {
    return NextResponse.json({ error: "Invalid claim token" }, { status: 400 });
  }

  const tokenHash = hashGiftToken(token.trim());

  const gift = await prisma.giftPurchase.findUnique({
    where: { claimTokenHash: tokenHash },
  });

  if (!gift) {
    return NextResponse.json({ error: "This gift link is invalid or does not exist." }, { status: 404 });
  }

  if (gift.status === "claimed") {
    return NextResponse.json(
      { error: "This gift has already been claimed.", alreadyClaimed: true },
      { status: 409 }
    );
  }

  if (gift.status !== "paid") {
    return NextResponse.json(
      { error: "This gift is not yet available to claim. Payment may still be processing." },
      { status: 400 }
    );
  }

  if (gift.expiresAt && gift.expiresAt < new Date()) {
    await prisma.giftPurchase.update({
      where: { id: gift.id },
      data: { status: "expired" },
    }).catch(() => {});
    return NextResponse.json({ error: "This gift link has expired." }, { status: 410 });
  }

  // Enforce recipient email — only the intended recipient can claim
  if (user.email.toLowerCase() !== gift.recipientEmail.toLowerCase()) {
    return NextResponse.json(
      {
        error: `This gift was sent to ${gift.recipientEmail}. Please sign in with that email address to claim it.`,
        wrongEmail: true,
        recipientEmail: gift.recipientEmail,
      },
      { status: 403 }
    );
  }

  // Check if this user already has paid access
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { hasPaid: true },
  });
  if (dbUser?.hasPaid) {
    // They already have access — still mark as claimed so it's not reusable
    await prisma.giftPurchase.updateMany({
      where: { id: gift.id, status: "paid" },
      data: { status: "claimed", claimedByUserId: user.id, claimedAt: new Date() },
    });
    return NextResponse.json({ success: true, alreadyHadAccess: true });
  }

  // Atomically mark as claimed
  const result = await prisma.giftPurchase.updateMany({
    where: { id: gift.id, status: "paid" },
    data: { status: "claimed", claimedByUserId: user.id, claimedAt: new Date() },
  });

  if (result.count === 0) {
    // Another request claimed it between our read and write
    return NextResponse.json(
      { error: "This gift was just claimed by another account.", alreadyClaimed: true },
      { status: 409 }
    );
  }

  // Grant lifetime access to the recipient: set hasPaid flag AND create a Purchase record
  // so access.ts, billing page, and admin dashboards all see a consistent record.
  // Use the actual Stripe amount rather than a hardcoded constant.
  let paidAmount = 4900; // fallback if Stripe lookup fails
  let paidCurrency = "usd";
  try {
    const pi = await stripe.paymentIntents.retrieve(gift.stripePaymentIntentId);
    if (pi.amount) paidAmount = pi.amount;
    if (pi.currency) paidCurrency = pi.currency;
  } catch (piErr) {
    console.error("[GIFT CLAIM] Could not fetch PaymentIntent for amount — using fallback:", piErr);
  }

  await Promise.all([
    prisma.user.update({
      where: { id: user.id },
      data: { hasPaid: true },
    }),
    prisma.purchase.upsert({
      where: { stripePaymentIntentId: gift.stripePaymentIntentId },
      create: {
        userId: user.id,
        stripePaymentIntentId: gift.stripePaymentIntentId,
        planId: "complete",
        planName: "Complete Seerah (gift)",
        amount: paidAmount,
        currency: paidCurrency,
        status: "succeeded",
      },
      update: {
        userId: user.id,
        status: "succeeded",
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
