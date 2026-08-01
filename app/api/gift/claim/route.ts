import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hashGiftToken } from "@/lib/gift";
import { stripe, checkPaymentIntentRefundStatus } from "@/lib/stripe";
import { checkRateLimit, getIP } from "@/lib/rate-limit";
import {
  hasActiveCourseAccess,
  ensureFamilyProfilesForUser,
  clearHasPaidIfNoOtherStripeLifetimeEvidence,
} from "@/lib/access";

async function markGiftRefunded(giftId: string): Promise<void> {
  // Never overwrite an already-refunded gift (concurrent webhook sentinel).
  await prisma.giftPurchase.updateMany({
    where: { id: giftId, status: { not: "refunded" } },
    data: { status: "refunded", claimedByUserId: null, claimedAt: null },
  });
}

export async function POST(request: NextRequest) {
  // Rate limit: 10 attempts per 15 minutes per IP to prevent gift token enumeration.
  const ip = getIP(request);
  const rl = await checkRateLimit(`gift-claim:${ip}`, 10, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

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

  if (gift.status === "refunded") {
    return NextResponse.json(
      { error: "This gift payment was refunded and can no longer be claimed." },
      { status: 400 }
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

  if (user.email.toLowerCase() !== gift.recipientEmail.toLowerCase()) {
    return NextResponse.json(
      {
        error: "This gift was sent to a different email address. Please sign in with the email that received the gift link.",
        wrongEmail: true,
      },
      { status: 403 }
    );
  }

  const giftPlanId = gift.planId ?? "complete";
  const isFamily = giftPlanId === "family";

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { hasPaid: true, planType: true },
  });
  const alreadyEntitled = await hasActiveCourseAccess(user.id, dbUser?.hasPaid);

  // Already entitled: never silently burn a gift.
  if (alreadyEntitled) {
    const isFamilyMonthlyOnly =
      isFamily &&
      dbUser?.planType === "family" &&
      !dbUser?.hasPaid;
    const isIndividualToFamilyUpgrade =
      isFamily && dbUser?.planType !== "family";

    if (!isIndividualToFamilyUpgrade && !isFamilyMonthlyOnly) {
      return NextResponse.json(
        {
          error: "You already have access to this course. This gift was not claimed so it can be given to someone else.",
          alreadyHadAccess: true,
        },
        { status: 409 }
      );
    }
  }

  // Fail closed — never claim when we cannot confirm the charge is unrefunded.
  let refundStatus: "unrefunded" | "refunded" | "unavailable";
  try {
    refundStatus = await checkPaymentIntentRefundStatus(gift.stripePaymentIntentId);
  } catch (piCheckErr) {
    console.error("[GIFT CLAIM] Refund check failed (fail-closed):", piCheckErr);
    return NextResponse.json(
      { error: "Unable to verify payment status. Please try again in a moment." },
      { status: 503 }
    );
  }
  if (refundStatus === "unavailable") {
    return NextResponse.json(
      { error: "Unable to verify payment charge. Please try again." },
      { status: 503 }
    );
  }
  if (refundStatus === "refunded") {
    try {
      await markGiftRefunded(gift.id);
    } catch (e) {
      console.error("[GIFT CLAIM] Failed to persist refunded gift status:", e);
    }
    return NextResponse.json(
      { error: "This gift payment was refunded and can no longer be claimed." },
      { status: 400 }
    );
  }

  // Also refuse when a refunded Purchase sentinel already exists (persist gift status outside tx).
  const priorPurchase = await prisma.purchase.findUnique({
    where: { stripePaymentIntentId: gift.stripePaymentIntentId },
    select: { status: true },
  });
  if (priorPurchase?.status === "refunded") {
    try {
      await markGiftRefunded(gift.id);
    } catch (e) {
      console.error("[GIFT CLAIM] Failed to persist refunded gift status:", e);
    }
    return NextResponse.json(
      { error: "This gift payment was refunded and can no longer be claimed." },
      { status: 400 }
    );
  }

  let paidAmount = isFamily ? 7900 : 4900;
  let paidCurrency = "usd";
  try {
    const pi = await stripe.paymentIntents.retrieve(gift.stripePaymentIntentId);
    if (pi.amount) paidAmount = pi.amount;
    if (pi.currency) paidCurrency = pi.currency;
  } catch (piErr) {
    console.error("[GIFT CLAIM] Could not fetch PaymentIntent for amount — using fallback:", piErr);
  }

  // Single transaction: claim + Purchase (atomic non-resurrect) + hasPaid.
  // Re-checks Stripe after commit; rolls access back if a refund raced in.
  try {
    await prisma.$transaction(async (tx) => {
      const existingPurchase = await tx.purchase.findUnique({
        where: { stripePaymentIntentId: gift.stripePaymentIntentId },
        select: { id: true, status: true },
      });
      if (existingPurchase?.status === "refunded") {
        // Do not write gift→refunded inside the tx — throw rolls it back (M5).
        // Caller persists refunded status outside after catching GIFT_REFUNDED.
        throw new Error("GIFT_REFUNDED");
      }

      const claimed = await tx.giftPurchase.updateMany({
        where: { id: gift.id, status: "paid" },
        data: { status: "claimed", claimedByUserId: user.id, claimedAt: new Date() },
      });
      if (claimed.count === 0) {
        throw new Error("GIFT_ALREADY_CLAIMED");
      }

      if (existingPurchase) {
        const promoted = await tx.purchase.updateMany({
          where: {
            stripePaymentIntentId: gift.stripePaymentIntentId,
            status: { not: "refunded" },
          },
          data: {
            userId: user.id,
            status: "succeeded",
            ...(isFamily
              ? { planId: giftPlanId, planName: "Family Access (gift)" }
              : {}),
            updatedAt: new Date(),
          },
        });
        if (promoted.count === 0) {
          throw new Error("GIFT_REFUNDED");
        }
      } else {
        try {
          await tx.purchase.create({
            data: {
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
          });
        } catch {
          const again = await tx.purchase.findUnique({
            where: { stripePaymentIntentId: gift.stripePaymentIntentId },
            select: { status: true },
          });
          if (!again || again.status === "refunded") {
            throw new Error("GIFT_REFUNDED");
          }
        }
      }

      await tx.user.update({
        where: { id: user.id },
        data: {
          hasPaid: true,
          ...(isFamily ? { planType: "family" } : {}),
        },
      });
    });
  } catch (txError) {
    const msg = txError instanceof Error ? txError.message : String(txError);
    if (msg === "GIFT_ALREADY_CLAIMED") {
      return NextResponse.json(
        { error: "This gift was just claimed by another account.", alreadyClaimed: true },
        { status: 409 }
      );
    }
    if (msg === "GIFT_REFUNDED") {
      // Persist outside the aborted transaction so status sticks.
      try {
        await markGiftRefunded(gift.id);
      } catch (e) {
        console.error("[GIFT CLAIM] Failed to persist refunded gift after GIFT_REFUNDED:", e);
      }
      return NextResponse.json(
        { error: "This gift payment was refunded and can no longer be claimed." },
        { status: 400 }
      );
    }
    console.error("[GIFT CLAIM] Transaction failed — rolling back access grant:", txError);
    // Only unclaim a stuck "claimed" row — never overwrite refunded/expired (C1).
    await prisma.giftPurchase.updateMany({
      where: { id: gift.id, status: "claimed" },
      data: { status: "paid", claimedByUserId: null, claimedAt: null },
    }).catch(() => {});
    return NextResponse.json(
      { error: "Failed to grant access. Please try again or contact support." },
      { status: 500 }
    );
  }

  // Post-commit refund race: Stripe refunded while we were writing.
  // Fail closed — never return success:true if re-check/clear fails.
  try {
    const postStatus = await checkPaymentIntentRefundStatus(gift.stripePaymentIntentId);
    if (postStatus === "unavailable") {
      throw new Error("POST_COMMIT_CHARGE_UNAVAILABLE");
    }
    if (postStatus === "refunded") {
      const purchase = await prisma.purchase.findUnique({
        where: { stripePaymentIntentId: gift.stripePaymentIntentId },
        select: { id: true, planId: true },
      });
      await markGiftRefunded(gift.id);
      if (purchase) {
        await prisma.purchase.update({
          where: { id: purchase.id },
          data: { status: "refunded", updatedAt: new Date() },
        });
        await clearHasPaidIfNoOtherStripeLifetimeEvidence(
          user.id,
          purchase.id,
          "GIFT_CLAIM:post-commit-refund",
          { refundedPlanId: purchase.planId },
        );
      } else {
        await clearHasPaidIfNoOtherStripeLifetimeEvidence(
          user.id,
          "__none__",
          "GIFT_CLAIM:post-commit-refund-no-purchase",
          { refundedPlanId: giftPlanId },
        );
      }
      return NextResponse.json(
        { error: "This gift payment was refunded and can no longer be claimed." },
        { status: 400 }
      );
    }
  } catch (postErr) {
    console.error("[GIFT CLAIM] Post-commit refund re-check failed (fail-closed):", postErr);
    // Soft revoke: do NOT invent a "refunded" Purchase — demote succeeded→pending
    // so hasActiveCourseAccess cannot stick, unclaim the gift, clear hasPaid,
    // and return 503 (never success:true). Claim can retry.
    // Guards: never overwrite a concurrent webhook's refunded sentinel (C1).
    const purchase = await prisma.purchase.findUnique({
      where: { stripePaymentIntentId: gift.stripePaymentIntentId },
      select: { id: true, planId: true, status: true },
    });
    if (purchase && purchase.status !== "refunded") {
      await prisma.purchase.updateMany({
        where: { id: purchase.id, status: { not: "refunded" } },
        data: { status: "pending", updatedAt: new Date() },
      });
    }
    // clearHasPaid must not be swallowed — sticky hasPaid is worse than 503 (H1).
    try {
      if (purchase) {
        await clearHasPaidIfNoOtherStripeLifetimeEvidence(
          user.id,
          purchase.id,
          "GIFT_CLAIM:post-commit-fail-closed",
          { refundedPlanId: purchase.planId },
        );
      } else {
        await clearHasPaidIfNoOtherStripeLifetimeEvidence(
          user.id,
          "__none__",
          "GIFT_CLAIM:post-commit-fail-closed-no-purchase",
          { refundedPlanId: giftPlanId },
        );
      }
    } catch (clearErr) {
      console.error(
        "[GIFT CLAIM] CRITICAL: clearHasPaid failed after soft-revoke — retrying hard clear:",
        clearErr,
      );
      try {
        await clearHasPaidIfNoOtherStripeLifetimeEvidence(
          user.id,
          purchase?.id ?? "__none__",
          "GIFT_CLAIM:post-commit-fail-closed-retry",
          { refundedPlanId: purchase?.planId ?? giftPlanId },
        );
      } catch (retryErr) {
        console.error(
          "[GIFT CLAIM] CRITICAL: clearHasPaid retry failed — hasPaid may be sticky:",
          retryErr,
        );
      }
    }
    // Only unclaim if still claimed — never paid←refunded (C1).
    await prisma.giftPurchase.updateMany({
      where: { id: gift.id, status: "claimed" },
      data: { status: "paid", claimedByUserId: null, claimedAt: null },
    }).catch((e) =>
      console.error("[GIFT CLAIM] Fail-closed gift unclaim after post-commit error:", e),
    );
    return NextResponse.json(
      { error: "Unable to verify payment status after claim. Please try again or contact support." },
      { status: 503 }
    );
  }

  if (isFamily) {
    ensureFamilyProfilesForUser(user.id).catch((e) =>
      console.error("[GIFT CLAIM] ensureFamilyProfiles failed:", e)
    );
  }

  const activeSub = await prisma.subscription.findFirst({
    where: { userId: user.id, status: { in: ["active", "trialing", "past_due", "unpaid"] } },
    select: { stripeSubscriptionId: true },
  });
  if (activeSub) {
    try {
      await stripe.subscriptions.cancel(activeSub.stripeSubscriptionId);
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: activeSub.stripeSubscriptionId },
        data: { status: "canceled", cancelAtPeriodEnd: false, updatedAt: new Date() },
      });
      console.log(`[GIFT CLAIM] Cancelled subscription ${activeSub.stripeSubscriptionId} after lifetime gift for user ${user.id}`);
    } catch (cancelErr) {
      console.error("[GIFT CLAIM] Failed to cancel subscription after gift claim:", cancelErr);
    }
  }

  return NextResponse.json({ success: true, upgradedToFamily: isFamily && alreadyEntitled });
}
