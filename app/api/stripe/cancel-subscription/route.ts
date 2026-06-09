import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * POST /api/stripe/cancel-subscription
 *
 * Sets the user's active subscription to cancel at the end of the current
 * billing period. Does NOT cancel immediately — the user keeps full access
 * until the period ends.
 *
 * To undo a cancellation, POST to /api/stripe/reactivate-subscription.
 */
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const sub = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: { in: ["active", "trialing", "past_due"] },
      },
      select: { stripeSubscriptionId: true, cancelAtPeriodEnd: true, currentPeriodEnd: true },
      orderBy: { createdAt: "desc" },
    });

    if (!sub) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
    }

    if (sub.cancelAtPeriodEnd) {
      return NextResponse.json({ error: "Subscription is already set to cancel" }, { status: 409 });
    }

    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: sub.stripeSubscriptionId },
      data: { cancelAtPeriodEnd: true, updatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      cancelDate: sub.currentPeriodEnd.toISOString(),
    });
  } catch (error) {
    console.error("[CANCEL-SUB] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
