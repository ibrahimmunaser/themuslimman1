// DEV ONLY — seeds test purchase/subscription records directly in DB
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { type } = await request.json() as { type: "lifetime" | "monthly" };

  if (type === "lifetime") {
    await prisma.purchase.upsert({
      where: { stripePaymentIntentId: `dev_lifetime_${user.id}` },
      create: {
        id: crypto.randomUUID(),
        updatedAt: new Date(),
        userId: user.id,
        planId: "complete",
        planName: "Complete Seerah (dev test)",
        amount: 4900,
        currency: "usd",
        stripePaymentIntentId: `dev_lifetime_${user.id}`,
        status: "succeeded",
      },
      update: { status: "succeeded" },
    });
    await prisma.user.update({ where: { id: user.id }, data: { hasPaid: true } });
    return NextResponse.json({ ok: true, granted: "lifetime" });
  }

  if (type === "monthly") {
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    await prisma.subscription.upsert({
      where: { stripeSubscriptionId: `dev_sub_${user.id}` },
      create: {
        id: crypto.randomUUID(),
        updatedAt: new Date(),
        userId: user.id,
        stripeCustomerId: `dev_cus_${user.id}`,
        stripeSubscriptionId: `dev_sub_${user.id}`,
        stripePriceId: process.env.STRIPE_MONTHLY_PRICE_ID ?? "dev_price",
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      },
      update: {
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        updatedAt: now,
      },
    });
    return NextResponse.json({ ok: true, granted: "monthly" });
  }

  return NextResponse.json({ error: "type must be lifetime or monthly" }, { status: 400 });
}

// Also allow DELETE to revoke test access
export async function DELETE(_request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  await prisma.purchase.deleteMany({ where: { stripePaymentIntentId: `dev_lifetime_${user.id}` } });
  await prisma.subscription.deleteMany({ where: { stripeSubscriptionId: `dev_sub_${user.id}` } });
  await prisma.user.update({ where: { id: user.id }, data: { hasPaid: false } });

  return NextResponse.json({ ok: true, revoked: true });
}
