import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

async function ensureFamilyProfiles(userId: string): Promise<void> {
  const FAMILY_LIMIT = 5;
  const [existingProfiles, user] = await Promise.all([
    prisma.learnerProfile.findMany({
      where: { userId },
      select: { id: true, isDefault: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } }),
  ]);
  const toCreate = FAMILY_LIMIT - existingProfiles.length;
  if (toCreate <= 0) return;
  const hasDefault     = existingProfiles.some((p) => p.isDefault);
  const existingCount  = existingProfiles.length;
  const newProfiles    = Array.from({ length: toCreate }, (_, i) => {
    const slot       = existingCount + i + 1;
    const isMainSlot = slot === 1;
    return {
      id:          crypto.randomUUID(),
      userId,
      displayName: isMainSlot ? (user?.fullName?.trim() || "Main Learner") : `Learner ${slot}`,
      isDefault:   isMainSlot && !hasDefault,
      createdAt:   new Date(),
      updatedAt:   new Date(),
    };
  });
  await prisma.learnerProfile.createMany({ data: newProfiles });
  console.log(`[VERIFY-PAYMENT] ensureFamilyProfiles: created ${newProfiles.length} profiles for user ${userId}`);
}

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
    const promoCode = paymentIntent.metadata.promoCode ?? null;
    const creator   = paymentIntent.metadata.creator   ?? null;

    await prisma.purchase.upsert({
      where: { stripePaymentIntentId: paymentIntent.id },
      // If the webhook already wrote the record, only fill in nulls (don't overwrite)
      update: {
        ...(promoCode ? { promoCode } : {}),
        ...(creator   ? { creator }   : {}),
      },
      create: {
        id: crypto.randomUUID(),
        updatedAt: new Date(),
        userId,
        planId,
        planName: planName ?? planId,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        stripePaymentIntentId: paymentIntent.id,
        status: "succeeded",
        promoCode,
        creator,
      },
    });

    // Set hasPaid and planType to mirror handlePaymentSuccess in the webhook,
    // so access is granted immediately even if the webhook is delayed.
    //   family    → planType = "family"  (5-profile household access)
    //   complete  → planType = "individual" (corrects any stale "family" value left over
    //               if the user was previously on a family trial before buying individual lifetime)
    await prisma.user.update({
      where: { id: userId },
      data: {
        hasPaid: true,
        ...(planId === "family"   ? { planType: "family" }     : {}),
        ...(planId === "complete" ? { planType: "individual" } : {}),
      },
    });

    // Auto-provision 5 learner profiles for family lifetime purchases immediately,
    // so the user doesn't see 0 profiles if they navigate to /profiles before
    // the webhook's handlePaymentSuccess fires.
    if (planId === "family") {
      ensureFamilyProfiles(userId).catch((e) =>
        console.error("[VERIFY-PAYMENT] ensureFamilyProfiles failed:", e)
      );
    }

    console.log(`[VERIFY-PAYMENT] Access granted for user ${currentUser.id}${planId === "family" ? " (planType=family set)" : ""}`);

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
