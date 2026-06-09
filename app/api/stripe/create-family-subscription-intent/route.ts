import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PLANS } from "@/lib/stripe-config";
import { getUserAccessInfo, getActiveSubscription, FAMILY_PROFILE_LIMIT } from "@/lib/access";

// Source of truth: STRIPE_FAMILY_MONTHLY_PRICE_ID env var.
// Must start with "price_" — fail loudly at request time if misconfigured.
const FAMILY_MONTHLY_PRICE_ID = process.env.STRIPE_FAMILY_MONTHLY_PRICE_ID ?? "";
const FAMILY_MONTHLY_PLAN = PLANS.familyMonthly;

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "You must be logged in to subscribe" }, { status: 401 });
    }
    if (!FAMILY_MONTHLY_PRICE_ID.startsWith("price_")) {
      console.error("[CREATE-FAMILY-SUB] STRIPE_FAMILY_MONTHLY_PRICE_ID is missing or invalid:", FAMILY_MONTHLY_PRICE_ID);
      return NextResponse.json(
        { error: "Family Monthly subscription is not configured. Contact support." },
        { status: 500 }
      );
    }

    // Fetch access info and active subscription in parallel.
    const [accessInfo, activeSub] = await Promise.all([
      getUserAccessInfo(user.id, user.hasPaid),
      getActiveSubscription(user.id),
    ]);

    // Block family lifetime holders — nothing to subscribe to.
    if (accessInfo.hasLifetime && user.planType === "family") {
      return NextResponse.json(
        { error: "You already have lifetime Family Access.", hasFamily: true },
        { status: 409 }
      );
    }

    // Block individual lifetime holders — they should upgrade to Family Lifetime, not subscribe.
    if (accessInfo.hasLifetime) {
      return NextResponse.json(
        {
          error:
            "You already have lifetime Individual access. Upgrade to Family Lifetime instead.",
          hasLifetime: true,
        },
        { status: 409 }
      );
    }

    // Block family plan holders — nothing to upgrade to.
    if (activeSub && user.planType === "family") {
      return NextResponse.json(
        {
          error: "You already have an active Family subscription. Manage it from your billing page.",
          hasActiveSubscription: true,
        },
        { status: 409 }
      );
    }

    // ── Upgrade path: individual trial/monthly → Family Monthly ──────────────
    // If the user already has an active individual subscription, upgrade it in
    // Stripe instead of creating a new one. This avoids a second payment form,
    // preserves the billing cycle, and lets Stripe handle proration automatically.
    if (activeSub) {
      const stripeSub = await stripe.subscriptions.retrieve(activeSub.stripeSubscriptionId);
      const existingItemId = stripeSub.items.data[0]?.id;

      if (!existingItemId) {
        return NextResponse.json({ error: "Could not locate subscription item to upgrade" }, { status: 500 });
      }

      // Upgrade the subscription to the family monthly price.
      // Stripe prorates the difference and charges the updated amount on the next invoice.
      await stripe.subscriptions.update(activeSub.stripeSubscriptionId, {
        items: [{ id: existingItemId, price: FAMILY_MONTHLY_PRICE_ID }],
        proration_behavior: "create_prorations",
        metadata: {
          userId: user.id,
          planId: FAMILY_MONTHLY_PLAN.id,
          planType: "family",
          type: "subscription",
        },
      });

      // Immediately update user planType in DB so access checks reflect the upgrade.
      await prisma.user.update({
        where: { id: user.id },
        data: { planType: "family" },
      });

      // Auto-provision up to 5 learner profiles for family access.
      await ensureFamilyProfiles(user.id);

      console.log(`[CREATE-FAMILY-SUB] Upgraded individual sub ${activeSub.stripeSubscriptionId} to family monthly for user ${user.id}`);
      return NextResponse.json({ upgraded: true });
    }

    // Ensure Stripe customer exists
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { stripeCustomerId: true },
    });
    let customerId = dbUser?.stripeCustomerId ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.fullName ?? undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
    }

    // Cancel any stale incomplete/past_due subscriptions to avoid Stripe conflicts.
    // NOTE: Active/trialing individual subs are now handled above via the upgrade path
    // (stripe.subscriptions.update), so this loop only needs to clean up orphaned ones.
    for (const statusFilter of ["incomplete", "past_due"] as const) {
      const existingSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: statusFilter,
        limit: 5,
      });
      for (const s of existingSubs.data) {
        if (s.metadata?.planType === "family") continue;
        await stripe.subscriptions.cancel(s.id).catch((e) =>
          console.warn(`[CREATE-FAMILY-SUB] Could not cancel ${statusFilter} sub ${s.id}:`, e)
        );
      }
    }

    // Create subscription in incomplete state so we can confirm via Elements.
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: FAMILY_MONTHLY_PRICE_ID }],
      payment_behavior: "default_incomplete",
      payment_settings: {
        payment_method_types: ["card"],
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice", "latest_invoice.confirmation_secret"],
      metadata: {
        userId: user.id,
        planId: FAMILY_MONTHLY_PLAN.id,   // "familyMonthly"
        planType: "family",                // used in webhook to set user.planType
        type: "subscription",
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invoice = subscription.latest_invoice as any;
    const clientSecret: string | null =
      invoice?.confirmation_secret?.client_secret ?? null;

    if (!clientSecret) {
      console.error("[CREATE-FAMILY-SUB] No client_secret found. confirmation_secret:", invoice?.confirmation_secret);
      await stripe.subscriptions.cancel(subscription.id).catch(() => {});
      return NextResponse.json({ error: "Could not create subscription payment" }, { status: 500 });
    }

    // Tag the underlying PaymentIntent so the webhook skips creating a Purchase record
    const piId: string | null = invoice?.confirmation_secret?.payment_intent ?? null;
    if (piId) {
      await stripe.paymentIntents.update(piId, {
        metadata: {
          type: "subscription",
          userId: user.id,
          planId: FAMILY_MONTHLY_PLAN.id,
          planType: "family",
          subscriptionId: subscription.id,
        },
      }).catch((e) => console.warn("[CREATE-FAMILY-SUB] Could not update PI metadata:", e));
    }

    return NextResponse.json({ clientSecret, amount: FAMILY_MONTHLY_PLAN.price });
  } catch (error) {
    console.error("[CREATE-FAMILY-SUB] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to create subscription: ${message}` }, { status: 500 });
  }
}

// ── Profile auto-provisioning ─────────────────────────────────────────────────

async function ensureFamilyProfiles(userId: string): Promise<void> {
  const [existingProfiles, user] = await Promise.all([
    prisma.learnerProfile.findMany({
      where: { userId },
      select: { id: true, isDefault: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } }),
  ]);

  const toCreate = FAMILY_PROFILE_LIMIT - existingProfiles.length;
  if (toCreate <= 0) return;

  const hasDefault    = existingProfiles.some((p) => p.isDefault);
  const existingCount = existingProfiles.length;

  const newProfiles = Array.from({ length: toCreate }, (_, i) => {
    const slot      = existingCount + i + 1;
    const isMainSlot = slot === 1;
    return {
      id:          crypto.randomUUID(),
      userId,
      displayName: isMainSlot ? (user?.fullName?.trim() || "Main Learner") : `Learner ${slot}`,
      isDefault:   isMainSlot && !hasDefault,
      createdAt:   new Date(),
      updatedAt:   new Date(),
    };
  });

  await prisma.learnerProfile.createMany({ data: newProfiles });
  console.log(`[CREATE-FAMILY-SUB] ensureFamilyProfiles: created ${newProfiles.length} profiles for user ${userId}`);
}
