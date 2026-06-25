import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";
import { PLANS } from "@/lib/stripe-config";
import { validatePromoCode, applyDiscount } from "@/lib/promo-codes";
import { getCreatorPromoConfig } from "@/lib/creator-promos";
import { getUserAccessInfo } from "@/lib/access";
import { checkRateLimit, getIP } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";

// Family lifetime price ID — used for metadata / Stripe dashboard linkage only.
const FAMILY_LIFETIME_PRICE_ID = process.env.STRIPE_FAMILY_LIFETIME_PRICE_ID ?? "";
const FAMILY_PLAN = PLANS.family;

export async function POST(request: NextRequest) {
  // Rate limit: 10 payment intent creations per 10 minutes per IP.
  const ip = getIP(request);
  const rl = checkRateLimit(`create-family-pi:${ip}`, 10, 10 * 60 * 1000);
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
        { error: "You must be logged in to purchase Family Access" },
        { status: 401 }
      );
    }

    // Block only users who already hold a Family Lifetime purchase — they have nothing to buy.
    //
    // OLD (wrong):  user.planType === "family"
    //   → caught Family Monthly users too, because upsertSubscription sets planType=family
    //     when a family monthly sub activates. Those users have hasPaid=false and should
    //     be allowed to upgrade to Family Lifetime.
    //
    // NEW (correct): hasLifetime && user.planType === "family"
    //   → hasLifetime = user.hasPaid || has a succeeded Purchase row, which is true only
    //     for actual lifetime buyers. Family Monthly users have hasPaid=false and no Purchase
    //     row, so they pass through and can buy Family Lifetime at $99.
    const accessInfo = await getUserAccessInfo(user.id, user.hasPaid);
    if (accessInfo.hasLifetime && user.planType === "family") {
      return NextResponse.json(
        { error: "You already have Family Lifetime Access", hasFamily: true },
        { status: 409 }
      );
    }

    // Block active IAP subscribers from buying a web family lifetime plan — they
    // already have access through the app store and should not be double-billed.
    // Exception: individual lifetime holders (hasPaid=true) upgrading to family
    // lifetime are allowed through regardless of any IAP subscription.
    if (accessInfo.mobilePurchase && !user.hasPaid) {
      return NextResponse.json(
        { error: "You have an active mobile subscription. Manage your access from the app.", hasAccess: true },
        { status: 409 }
      );
    }

    // Unlike the individual checkout, we do NOT block existing Individual-plan
    // users — they're upgrading from Individual to Family.

    const body = await request.json();
    const { promoCode, isUpgrade, creator: creatorFromSource, source } = body as { promoCode?: string; isUpgrade?: boolean; creator?: string; source?: string };

    // Individual Lifetime → Family Lifetime upgrade.
    // Verified server-side: user must have hasPaid=true and not already be on family plan.
    const isEligibleForUpgradePrice = isUpgrade && user.hasPaid && user.planType !== "family";

    // Apply promo code discount if provided
    let appliedPromoCode: string | null = null;
    let baseAmount: number;
    let finalAmount: number;
    let promoDiscountAmount = 0;

    if (promoCode?.trim()) {
      const promo = validatePromoCode(promoCode);
      if (!promo) {
        return NextResponse.json({ error: "Invalid promo code" }, { status: 400 });
      }
      // Reject codes that are explicitly scoped to the individual plan.
      if (promo.planType === "individual") {
        return NextResponse.json(
          { error: "This code is for individual plans only" },
          { status: 400 }
        );
      }

      if (isEligibleForUpgradePrice) {
        // Smart upgrade with promo: charge discounted_family_price − what_they_paid_for_individual.
        // e.g. BROWNIE119 ($119) − individual purchase ($59) = $60 upgrade cost.
        // This ensures total lifetime spend equals the discounted family price.
        const discountedFamilyPrice = applyDiscount(FAMILY_PLAN.price, promo);
        const individualPurchase = await prisma.purchase.findFirst({
          where: { userId: user.id, status: "succeeded" },
          select: { amount: true },
          orderBy: { createdAt: "asc" }, // earliest = the original individual purchase
        });
        const individualPaid = individualPurchase?.amount ?? PLANS.complete.price; // fallback $49
        baseAmount  = discountedFamilyPrice;
        finalAmount = Math.max(0, discountedFamilyPrice - individualPaid);
        promoDiscountAmount = baseAmount - finalAmount;
      } else {
        // New family purchase with promo (not an upgrade).
        baseAmount  = FAMILY_PLAN.price;
        finalAmount = applyDiscount(baseAmount, promo);
        promoDiscountAmount = baseAmount - finalAmount;
      }
      appliedPromoCode = promoCode.trim().toUpperCase();
    } else {
      // No promo: upgrade pays fixed $50 diff (full $99 − full $49); new purchase pays $99.
      baseAmount  = isEligibleForUpgradePrice
        ? FAMILY_PLAN.upgradeFromLifetimePrice  // 5000 cents = $50
        : FAMILY_PLAN.price;                    // 9900 cents = $99
      finalAmount = baseAmount;
    }

    // Resolve creator: prefer promo-code config; fall back to source attribution from checkout
    const creatorConfig = appliedPromoCode ? getCreatorPromoConfig(appliedPromoCode) : null;
    const resolvedCreator = creatorConfig?.creator ?? (typeof creatorFromSource === "string" && creatorFromSource ? creatorFromSource : null);

    // Free access: skip Stripe entirely when code makes it $0
    if (finalAmount === 0) {
      return NextResponse.json({
        freeAccess: true,
        appliedPromoCode,
        baseAmount,
        promoDiscountAmount,
        finalAmount: 0,
        isUpgrade: isEligibleForUpgradePrice,
      });
    }

    // Get or create Stripe Customer so failed/abandoned payments are recoverable by email.
    const existingCustomer = await prisma.user.findUnique({
      where: { id: user.id },
      select: { stripeCustomerId: true, fullName: true },
    });
    let customerId = existingCustomer?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: existingCustomer?.fullName ?? undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customer.id } });
    }

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmount,
      currency: "usd",
      customer: customerId,
      payment_method_types: ["card"],
      metadata: {
        userId: user.id,
        planId: FAMILY_PLAN.id,                    // "family" — drives planType in webhook
        planName: FAMILY_PLAN.name,                // "Family Access"
        stripeProductId: FAMILY_PLAN.stripeProductId, // prod_UbM83Q8KLI4HX0
        ...(FAMILY_LIFETIME_PRICE_ID.startsWith("price_")
          ? { stripePriceId: FAMILY_LIFETIME_PRICE_ID }
          : {}),
        baseAmount: String(baseAmount),
        finalAmount: String(finalAmount),
        ...(isEligibleForUpgradePrice ? { upgradeFrom: "individual_lifetime" } : {}),
        ...(appliedPromoCode
          ? { promoCode: appliedPromoCode, promoDiscountAmount: String(promoDiscountAmount) }
          : {}),
        ...(resolvedCreator ? { creator: resolvedCreator } : {}),
        ...(source          ? { source }                  : {}),
        ...(creatorConfig
          ? {
              utm_source: creatorConfig.utm_source,
              utm_medium: creatorConfig.utm_medium,
              utm_campaign: creatorConfig.utm_campaign,
              utm_content: creatorConfig.utm_content,
            }
          : {}),
      },
      description: `${FAMILY_PLAN.name} — TheMuslimMan${appliedPromoCode ? ` (${appliedPromoCode})` : ""}`,
      receipt_email: user.email,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      baseAmount,
      promoDiscountAmount,
      finalAmount,
      isUpgrade: isEligibleForUpgradePrice,
    });
  } catch (error) {
    console.error("[FAMILY_CHECKOUT] Error creating payment intent:", error);
    return NextResponse.json(
      { error: "Failed to initialize payment. Please try again." },
      { status: 500 }
    );
  }
}
