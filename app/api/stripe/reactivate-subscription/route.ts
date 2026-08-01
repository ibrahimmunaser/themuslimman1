import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit, getIP } from "@/lib/rate-limit";

/**
 * POST /api/stripe/reactivate-subscription
 *
 * Removes the cancel_at_period_end flag so the subscription renews normally.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getIP(request);
    const rl = await checkRateLimit(`reactivate-sub:${ip}`, 10, 15 * 60 * 1000);
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
        status: { in: ["active", "trialing", "past_due"] },
        cancelAtPeriodEnd: true,
        currentPeriodEnd: { gte: new Date() },
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
      { error: "Failed to reactivate subscription. Please try again or contact support." },
      { status: 500 }
    );
  }
}
