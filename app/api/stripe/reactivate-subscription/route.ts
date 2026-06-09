import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * POST /api/stripe/reactivate-subscription
 *
 * Removes the cancel_at_period_end flag so the subscription renews normally.
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
        cancelAtPeriodEnd: true,
      },
      select: { stripeSubscriptionId: true },
      orderBy: { createdAt: "desc" },
    });

    if (!sub) {
      return NextResponse.json({ error: "No subscription scheduled for cancellation" }, { status: 404 });
    }

    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: sub.stripeSubscriptionId },
      data: { cancelAtPeriodEnd: false, updatedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[REACTIVATE-SUB] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reactivate subscription" },
      { status: 500 }
    );
  }
}
