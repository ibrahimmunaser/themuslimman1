import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { validatePromoCode, applyDiscount } from "@/lib/promo-codes";
import { getBasePrice } from "@/lib/early-access";
import { prisma } from "@/lib/db";
import { PLANS, type PlanId } from "@/lib/stripe";
import { PLANS as STRIPE_CONFIG_PLANS } from "@/lib/stripe-config";

/**
 * POST /api/stripe/claim-free-access
 * Body: { promoCode: string }
 *
 * Grants course access for $0 when a valid absolute-zero promo code is applied.
 * Creates a Purchase record and marks the user as hasPaid — no Stripe involved.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Please verify your email address first", requiresVerification: true },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { promoCode, planType } = body as { promoCode?: string; planType?: string };
    const isFamily = planType === "family";

    if (!promoCode) {
      return NextResponse.json({ error: "No promo code provided" }, { status: 400 });
    }

    const promo = validatePromoCode(promoCode);
    if (!promo) {
      return NextResponse.json({ error: "Invalid promo code" }, { status: 400 });
    }

    // For family, use family price; for individual, use individual base price
    const baseAmount = isFamily ? STRIPE_CONFIG_PLANS.family.price : getBasePrice();
    const finalAmount = applyDiscount(baseAmount, promo);

    if (finalAmount !== 0) {
      return NextResponse.json(
        { error: "This code does not grant free access" },
        { status: 400 }
      );
    }

    // Check if user already has access
    const existingPurchase = await prisma.purchase.findFirst({
      where: { userId: user.id, status: "succeeded" },
    });

    if (existingPurchase) {
      return NextResponse.json({ success: true, alreadyHasAccess: true });
    }

    const planId: PlanId = isFamily ? "family" : "complete";
    const plan = PLANS[planId];

    // Create purchase record + grant access in a transaction
    await prisma.$transaction([
      prisma.purchase.create({
        data: {
          id: crypto.randomUUID(),
          updatedAt: new Date(),
          userId: user.id,
          planId: plan.id,
          planName: plan.name,
          amount: 0,
          currency: "usd",
          status: "succeeded",
          stripePaymentIntentId: `free_${promoCode.toUpperCase()}_${user.id}_${Date.now()}`,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          hasPaid: true,
          ...(isFamily ? { planType: "family" } : {}),
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[claim-free-access] Error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
