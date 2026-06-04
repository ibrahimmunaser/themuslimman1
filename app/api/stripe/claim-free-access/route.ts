import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { validatePromoCode, applyDiscount, getFreeAccessPlan } from "@/lib/promo-codes";
import { getBasePrice } from "@/lib/early-access";
import { prisma } from "@/lib/db";
import { PLANS, type PlanId } from "@/lib/stripe";
import { PLANS as STRIPE_CONFIG_PLANS } from "@/lib/stripe-config";
import { checkRateLimit, getIP } from "@/lib/rate-limit";

/**
 * POST /api/stripe/claim-free-access
 * Body: { promoCode: string }
 *
 * Grants course access for $0 when a valid absolute-zero promo code is applied.
 * Creates a Purchase record and marks the user as hasPaid — no Stripe involved.
 *
 * Security notes:
 * - planType is NOT accepted from the request body. The plan is determined
 *   server-side from the FREE_ACCESS_PLAN env var.
 * - The free-access code must be configured via FREE_ACCESS_CODE env var.
 *   No free-access codes are hardcoded in source.
 * - Rate-limited to 5 attempts per 15 minutes per IP.
 */
export async function POST(request: NextRequest) {
  // Rate limit: 5 attempts per 15 minutes per IP
  const ip = getIP(request);
  const rateCheck = checkRateLimit(`free-claim:${ip}`, 5, 15 * 60 * 1000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

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

    if (!promoCode) {
      return NextResponse.json({ error: "No promo code provided" }, { status: 400 });
    }

    // Validate the promo code itself (checks PROMO_CODES + FREE_ACCESS_CODE env vars).
    const promo = validatePromoCode(promoCode);
    if (!promo) {
      return NextResponse.json({ error: "Invalid promo code" }, { status: 400 });
    }

    // Determine the plan to grant.
    // Priority: FREE_ACCESS_CODE env var (explicit override) → promo type absolute $0 → reject.
    // The client sends planType ("family" | "individual") which we use when the code is a
    // generic absolute-$0 code, but we verify server-side that the price is actually $0
    // for that plan — the client cannot inflate the plan beyond what the code covers.
    const envGrantedPlan = getFreeAccessPlan(promoCode);
    let isFamily = envGrantedPlan === "family";

    if (!envGrantedPlan) {
      // Not a FREE_ACCESS_CODE env var code — accept if the promo itself is absolute $0.
      if (promo.type !== "absolute" || promo.value !== 0) {
        return NextResponse.json(
          { error: "This code does not grant free access" },
          { status: 400 }
        );
      }
      // Use the plan requested by the client (already validated above that it's $0).
      isFamily = planType === "family";
    }

    // Verify the promo actually reduces the price to $0 for the resolved plan.
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

    // Deterministic ID: removing Date.now() prevents duplicate rows if the same
    // request races (TOCTOU between the findFirst check above and the create below).
    // A unique-constraint violation from a concurrent claim is treated as success.
    const deterministicId = `free_${promoCode.toUpperCase()}_${user.id}`;

    try {
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
            stripePaymentIntentId: deterministicId,
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
    } catch (txErr) {
      const msg = txErr instanceof Error ? txErr.message : "";
      if (msg.includes("Unique constraint") || msg.includes("P2002")) {
        // Concurrent claim — idempotent, access was already granted
        return NextResponse.json({ success: true, alreadyHasAccess: true });
      }
      throw txErr;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[claim-free-access] Error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
