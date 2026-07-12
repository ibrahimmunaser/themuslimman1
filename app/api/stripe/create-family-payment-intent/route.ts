import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";
import { PLANS } from "@/lib/stripe-config";
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
    //     row, so they pass through and can buy Family Lifetime at $79.
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
    const { isUpgrade, creator: creatorFromSource, source, utmSource, utmMedium, utmCampaign, utmContent } = body as { isUpgrade?: boolean; creator?: string; source?: string; utmSource?: string; utmMedium?: string; utmCampaign?: string; utmContent?: string };

    // Individual Lifetime → Family Lifetime upgrade.
    // Verified server-side: user must have hasPaid=true and not already be on family plan.
    const isEligibleForUpgradePrice = isUpgrade && user.hasPaid && user.planType !== "family";

    // Upgrade pays fixed $30 diff (full $79 − full $49); new purchase pays $79.
    const baseAmount: number  = isEligibleForUpgradePrice
      ? FAMILY_PLAN.upgradeFromLifetimePrice  // 3000 cents = $30
      : FAMILY_PLAN.price;                    // 7900 cents = $79
    const finalAmount: number = baseAmount;

    // Creator attribution comes straight from the checkout's ?source= / body.creator —
    // no promo codes involved.
    const resolvedCreator = typeof creatorFromSource === "string" && creatorFromSource ? creatorFromSource : null;

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
        ...(resolvedCreator ? { creator: resolvedCreator } : {}),
        ...(source          ? { source }                  : {}),
        ...(utmSource   ? { utmSource   } : {}),
        ...(utmMedium   ? { utmMedium   } : {}),
        ...(utmCampaign ? { utmCampaign } : {}),
        ...(utmContent  ? { utmContent  } : {}),
      },
      description: `${FAMILY_PLAN.name} — TheMuslimMan`,
      receipt_email: user.email,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      baseAmount,
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
