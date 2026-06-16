import { NextRequest, NextResponse } from "next/server";
import { stripe, PLANS, type PlanId } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { validatePromoCode, applyDiscount } from "@/lib/promo-codes";
import { getCreatorPromoConfig } from "@/lib/creator-promos";
import { getUserAccessInfo } from "@/lib/access";
import { checkRateLimit, getIP } from "@/lib/rate-limit";

/** Individual lifetime price in cents ($49). */
const BASE_PRICE = 4900;

/**
 * Gets the existing Stripe Customer ID for a user, or creates one and saves it.
 * Linking a Customer to every PaymentIntent means Stripe can email the user
 * about failed/abandoned payments and we can recover them from the dashboard.
 */
async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true, fullName: true },
  });

  if (dbUser?.stripeCustomerId) return dbUser.stripeCustomerId;

  const customer = await stripe.customers.create({
    email,
    name: dbUser?.fullName ?? undefined,
    metadata: { userId },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

export async function POST(request: NextRequest) {
  // Rate limit: 10 payment intent creations per 10 minutes per IP.
  const ip = getIP(request);
  const rl = checkRateLimit(`create-pi:${ip}`, 10, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to make a purchase" },
        { status: 401 }
      );
    }

    const { hasLifetime, mobilePurchase } = await getUserAccessInfo(user.id, user.hasPaid);

    // Block lifetime holders — nothing left to buy individually.
    if (hasLifetime) {
      return NextResponse.json(
        { error: "You already have access to this course", hasLifetime: true },
        { status: 409 }
      );
    }

    // Block active mobile IAP subscribers — they already have access through the app store
    // and should not be double-billed via a web lifetime purchase.
    if (mobilePurchase) {
      return NextResponse.json(
        { error: "You have an active mobile subscription. Manage your access from the app.", hasAccess: true },
        { status: 409 }
      );
    }

    // Block family plan users from buying individual lifetime — that would be a downgrade.
    if (user.planType === "family") {
      return NextResponse.json(
        {
          error:
            "You are on a Family plan. Individual Lifetime would be a downgrade. " +
            "Upgrade to Family Lifetime from your billing page, or contact support.",
          isFamilyPlan: true,
        },
        { status: 409 }
      );
    }

    const body = await request.json();
    // Only "complete" is sold during early access — silently upgrade any other plan
    const planId: PlanId = "complete";
    const { promoCode } = body as { promoCode?: string };

    const plan = PLANS[planId];

    // Server decides the price — always $49 (4900 cents), client cannot override.
    const baseAmount: number = BASE_PRICE;

    // ── Apply promo code if provided ──
    let finalAmount: number = baseAmount;
    let appliedPromoCode: string | null = null;
    let promoDiscountAmount = 0;

    if (promoCode && promoCode.trim().length > 0) {
      const normalized = promoCode.trim().toUpperCase();
      const promo = validatePromoCode(normalized);
      if (!promo) {
        return NextResponse.json({ error: "Invalid promo code" }, { status: 400 });
      }
      // Reject codes that are explicitly scoped to the family plan.
      if (promo.planType === "family") {
        return NextResponse.json({ error: "This code is for family plans only" }, { status: 400 });
      }
      finalAmount = applyDiscount(baseAmount, promo);
      promoDiscountAmount = baseAmount - finalAmount;
      appliedPromoCode = normalized;
    }

    // Resolve creator metadata from the promo code (if it's a creator code)
    const creatorConfig = appliedPromoCode ? getCreatorPromoConfig(appliedPromoCode) : null;

    // ── Free access: skip Stripe entirely ──────────────────────────────────
    if (finalAmount === 0) {
      return NextResponse.json({
        freeAccess: true,
        appliedPromoCode,
        baseAmount,
        promoDiscountAmount,
        finalAmount: 0,
      });
    }

    // ── Create Stripe PaymentIntent ──
    const customerId = await getOrCreateStripeCustomer(user.id, user.email);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmount,
      currency: "usd",
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: user.id,
        planId: plan.id,
        planName: plan.name,
        baseAmount: String(baseAmount),
        finalAmount: String(finalAmount),
        ...(appliedPromoCode
          ? {
              promoCode: appliedPromoCode,
              promoDiscountAmount: String(promoDiscountAmount),
            }
          : {}),
        ...(creatorConfig
          ? {
              creator: creatorConfig.creator,
              utm_source: creatorConfig.utm_source,
              utm_medium: creatorConfig.utm_medium,
              utm_campaign: creatorConfig.utm_campaign,
              utm_content: creatorConfig.utm_content,
            }
          : {}),
      },
      description: `${plan.name} — TheMuslimMan${appliedPromoCode ? ` (${appliedPromoCode})` : ""}`,
      receipt_email: user.email,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      freeAccess: false,
      baseAmount,
      promoDiscountAmount,
      finalAmount,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      { error: "Failed to initialize payment. Please try again." },
      { status: 500 }
    );
  }
}
