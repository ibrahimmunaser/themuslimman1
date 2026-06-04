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
  if (!user.emailVerified) {
    return NextResponse.json(
      { error: "Please verify your email address before claiming a gift.", requiresVerification: true },
      { status: 403 }
    );
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

  // Enforce recipient email — only the intended recipient can claim.
  // Do NOT include the recipient email in the response to prevent leaking it
  // to a logged-in user who is probing gift tokens they don't own.
  if (user.email.toLowerCase() !== gift.recipientEmail.toLowerCase()) {
    return NextResponse.json(
      {
        error: "This gift was sent to a different email address. Please sign in with the email that received the gift link.",
        wrongEmail: true,
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

  // Resolve which plan was gifted (backward-compat default: "complete")
  const giftPlanId = gift.planId ?? "complete";
  const isFamily = giftPlanId === "family";

  // Grant lifetime access to the recipient: set hasPaid flag AND create a Purchase record
  // so access.ts, billing page, and admin dashboards all see a consistent record.
  // Use the actual Stripe amount rather than a hardcoded constant.
  let paidAmount = isFamily ? 19900 : 9900; // fallback if Stripe lookup fails
  let paidCurrency = "usd";
  try {
    const pi = await stripe.paymentIntents.retrieve(gift.stripePaymentIntentId);
    if (pi.amount) paidAmount = pi.amount;
    if (pi.currency) paidCurrency = pi.currency;
  } catch (piErr) {
    console.error("[GIFT CLAIM] Could not fetch PaymentIntent for amount — using fallback:", piErr);
  }

  // Grant access atomically — both the user flag and the purchase record must
  // succeed together. If either fails the transaction rolls back so the gift
  // cannot be consumed without access being granted.
  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          hasPaid: true,
          ...(isFamily ? { planType: "family" } : {}),
        },
      }),
      prisma.purchase.upsert({
        where: { stripePaymentIntentId: gift.stripePaymentIntentId },
        create: {
          id: crypto.randomUUID(),
          updatedAt: new Date(),
          userId: user.id,
          stripePaymentIntentId: gift.stripePaymentIntentId,
          planId: giftPlanId,
          planName: isFamily ? "Family Access (gift)" : "Complete Seerah (gift)",
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
  } catch (txError) {
    console.error("[GIFT CLAIM] Transaction failed — rolling back access grant:", txError);
    // Reverse the claimed status so the recipient can retry
    await prisma.giftPurchase.update({
      where: { id: gift.id },
      data: { status: "paid", claimedByUserId: null, claimedAt: null },
    }).catch(() => {});
    return NextResponse.json(
      { error: "Failed to grant access. Please try again or contact support." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
