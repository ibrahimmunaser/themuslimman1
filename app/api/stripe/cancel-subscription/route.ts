import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit, getIP } from "@/lib/rate-limit";

/**
 * POST /api/stripe/cancel-subscription
 *
 * Sets the user's active subscription to cancel at the end of the current
 * billing period. Does NOT cancel immediately — the user keeps full access
 * until the period ends.
 *
 * To undo a cancellation, POST to /api/stripe/reactivate-subscription.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getIP(request);
    const rl = await checkRateLimit(`cancel-sub:${ip}`, 10, 15 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const sub = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: { in: ["active", "trialing", "past_due", "unpaid"] },
        currentPeriodEnd: { gte: new Date() },
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
      { error: "Failed to cancel subscription. Please try again or contact support." },
      { status: 500 }
    );
  }
}
