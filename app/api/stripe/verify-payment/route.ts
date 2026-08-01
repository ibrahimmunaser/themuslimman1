import { NextRequest, NextResponse } from "next/server";
import { stripe, extractLatestChargeId, getChargeRefundStatus } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  ensureFamilyProfilesForUser,
  clearHasPaidIfNoOtherStripeLifetimeEvidence,
} from "@/lib/access";
import { checkRateLimit, getIP } from "@/lib/rate-limit";

// Family profile auto-provisioning is centralized in lib/access.ts's
// ensureFamilyProfilesForUser (Serializable transaction + retry) — this used
// to be an independent, non-transactional copy here that could race with
// the Stripe webhook's identical logic firing for the same purchase.

export async function GET(request: NextRequest) {
  const ip = getIP(request);
  const rl = await checkRateLimit(`verify-payment:${ip}`, 30, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

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

    // Refunded charges still report PI status "succeeded" — refuse to re-grant.
    const existingPurchase = await prisma.purchase.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
      select: { status: true },
    });
    if (existingPurchase?.status === "refunded") {
      return NextResponse.json(
        { error: "This payment was refunded" },
        { status: 400 }
      );
    }

    // Fail closed on charge lookup — never grant when we cannot confirm unrefunded.
    const chargeId = extractLatestChargeId(paymentIntent);
    if (!chargeId) {
      return NextResponse.json(
        { error: "Unable to verify payment charge. Please try again." },
        { status: 503 }
      );
    }
    try {
      const chargeStatus = await getChargeRefundStatus(chargeId);
      if (chargeStatus === "refunded") {
        return NextResponse.json(
          { error: "This payment was refunded" },
          { status: 400 }
        );
      }
    } catch (chargeErr) {
      console.error("[VERIFY-PAYMENT] Charge refund check failed (fail-closed):", chargeErr);
      return NextResponse.json(
        { error: "Unable to verify payment status. Please try again." },
        { status: 503 }
      );
    }

    const { userId, planId, planName, type: piType } = paymentIntent.metadata;

    // ── 3. Reject trial_fee and subscription PIs — those are handled by webhooks/polling
    if (piType === "trial_fee" || piType === "subscription") {
      console.warn(
        `[VERIFY-PAYMENT] Intent ${paymentIntentId} has type "${piType}" — not a lifetime purchase; rejecting`
      );
      return NextResponse.json(
        { error: "Invalid payment type for this endpoint" },
        { status: 400 }
      );
    }

    // ── 4. Metadata must contain a userId ────────────────────────────────────
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

    // ── 5. Idempotent upsert — refuse to resurrect refunded rows ─────────────
    console.log(
      `[VERIFY-PAYMENT] Checks passed for user ${currentUser.id} — upserting purchase…`
    );
    const promoCode = paymentIntent.metadata.promoCode ?? null;
    const creator   = paymentIntent.metadata.creator   ?? null;

    if (existingPurchase) {
      const promoted = await prisma.purchase.updateMany({
        where: {
          stripePaymentIntentId: paymentIntent.id,
          status: { not: "refunded" },
        },
        data: {
          ...(promoCode ? { promoCode } : {}),
          ...(creator ? { creator } : {}),
          updatedAt: new Date(),
        },
      });
      if (promoted.count === 0) {
        return NextResponse.json(
          { error: "This payment was refunded" },
          { status: 400 }
        );
      }
    } else {
      try {
        await prisma.purchase.create({
          data: {
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
      } catch {
        const again = await prisma.purchase.findUnique({
          where: { stripePaymentIntentId: paymentIntent.id },
          select: { status: true },
        });
        if (!again || again.status === "refunded") {
          return NextResponse.json(
            { error: "This payment was refunded" },
            { status: 400 }
          );
        }
      }
    }

    // Re-check after upsert — refuse hasPaid if row is refunded (TOCTOU).
    const afterUpsert = await prisma.purchase.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
      select: { id: true, status: true, planId: true },
    });
    if (!afterUpsert || afterUpsert.status === "refunded") {
      return NextResponse.json(
        { error: "This payment was refunded" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        hasPaid: true,
        ...(planId === "family"   ? { planType: "family" }     : {}),
        ...(planId === "complete" ? { planType: "individual" } : {}),
      },
    });

    // Grant/revoke race: refund may land between upsert and hasPaid.
    // Re-check DB sentinel AND re-probe Stripe (H3) — DB-only misses webhook lag.
    const postGrant = await prisma.purchase.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
      select: { id: true, status: true, planId: true },
    });
    if (!postGrant || postGrant.status === "refunded") {
      if (postGrant) {
        await clearHasPaidIfNoOtherStripeLifetimeEvidence(
          userId,
          postGrant.id,
          "VERIFY-PAYMENT:post-grant-refund",
          { refundedPlanId: postGrant.planId },
        );
      } else {
        // hasPaid was set but Purchase row vanished — clear like webhook does.
        await clearHasPaidIfNoOtherStripeLifetimeEvidence(
          userId,
          "__none__",
          "VERIFY-PAYMENT:post-grant-missing",
          { refundedPlanId: planId },
        );
      }
      return NextResponse.json(
        { error: "This payment was refunded" },
        { status: 400 }
      );
    }

    let postStripeStatus: "unrefunded" | "refunded";
    try {
      postStripeStatus = await getChargeRefundStatus(chargeId);
    } catch (postStripeErr) {
      console.error(
        "[VERIFY-PAYMENT] Post-grant Stripe re-probe failed (fail-closed):",
        postStripeErr,
      );
      // Soft revoke: demote non-refunded → pending, clear hasPaid, never success.
      await prisma.purchase.updateMany({
        where: { id: postGrant.id, status: { not: "refunded" } },
        data: { status: "pending", updatedAt: new Date() },
      });
      try {
        await clearHasPaidIfNoOtherStripeLifetimeEvidence(
          userId,
          postGrant.id,
          "VERIFY-PAYMENT:post-grant-stripe-unavailable",
          { refundedPlanId: postGrant.planId },
        );
      } catch (clearErr) {
        console.error(
          "[VERIFY-PAYMENT] CRITICAL: clearHasPaid failed after soft-revoke — retrying:",
          clearErr,
        );
        await clearHasPaidIfNoOtherStripeLifetimeEvidence(
          userId,
          postGrant.id,
          "VERIFY-PAYMENT:post-grant-stripe-unavailable-retry",
          { refundedPlanId: postGrant.planId },
        ).catch((retryErr) =>
          console.error(
            "[VERIFY-PAYMENT] CRITICAL: clearHasPaid retry failed — hasPaid may be sticky:",
            retryErr,
          ),
        );
      }
      return NextResponse.json(
        { error: "Unable to verify payment status. Please try again." },
        { status: 503 }
      );
    }
    if (postStripeStatus === "refunded") {
      await prisma.purchase.updateMany({
        where: { id: postGrant.id, status: { not: "refunded" } },
        data: { status: "refunded", updatedAt: new Date() },
      });
      await clearHasPaidIfNoOtherStripeLifetimeEvidence(
        userId,
        postGrant.id,
        "VERIFY-PAYMENT:post-grant-stripe-refunded",
        { refundedPlanId: postGrant.planId },
      );
      return NextResponse.json(
        { error: "This payment was refunded" },
        { status: 400 }
      );
    }

    if (planId === "family") {
      ensureFamilyProfilesForUser(userId).catch((e) =>
        console.error("[VERIFY-PAYMENT] ensureFamilyProfiles failed:", e)
      );
    }

    const activeSub = await prisma.subscription.findFirst({
      where: { userId, status: { in: ["active", "trialing", "past_due", "unpaid"] } },
      select: { stripeSubscriptionId: true },
    });
    if (activeSub) {
      try {
        await stripe.subscriptions.cancel(activeSub.stripeSubscriptionId);
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: activeSub.stripeSubscriptionId },
          data: { status: "canceled", cancelAtPeriodEnd: false, updatedAt: new Date() },
        });
        console.log(`[VERIFY-PAYMENT] Cancelled subscription ${activeSub.stripeSubscriptionId} after lifetime for user ${userId}`);
      } catch (cancelErr) {
        console.error(`[VERIFY-PAYMENT] Failed to cancel subscription ${activeSub.stripeSubscriptionId}:`, cancelErr);
      }
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
