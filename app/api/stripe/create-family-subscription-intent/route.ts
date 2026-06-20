import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PLANS } from "@/lib/stripe-config";
import { getUserAccessInfo, getActiveSubscription, FAMILY_PROFILE_LIMIT } from "@/lib/access";
import { checkRateLimit, getIP } from "@/lib/rate-limit";

// Support both env var names — new canonical name takes priority.
const FAMILY_MONTHLY_PRICE_ID =
  process.env.STRIPE_PRICE_FAMILY_MONTHLY ??
  process.env.STRIPE_FAMILY_MONTHLY_PRICE_ID ??
  "";
const FAMILY_MONTHLY_PLAN = PLANS.familyMonthly;

export async function POST(request: NextRequest) {
  const ip = getIP(request);
  const rl = checkRateLimit(`create-family-sub-intent:${ip}`, 10, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }
  let body: Record<string, string> = {};
  try { body = await request.json(); } catch { /* no body is fine */ }
  const { creator, promoCode, source, utmSource, utmCampaign, utmMedium, utmContent } = body;

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

    // Block active mobile IAP subscribers — they already have access through the app
    // and should not be billed again via a web family subscription.
    if (accessInfo.mobilePurchase) {
      return NextResponse.json(
        { error: "You have an active mobile subscription. Manage your access from the app.", hasAccess: true },
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
      // Also clear cancel_at_period_end: if the user previously cancelled and is
      // now upgrading, we must re-activate renewal — otherwise the sub would still
      // cancel at period end at the new family price instead of renewing.
      await stripe.subscriptions.update(activeSub.stripeSubscriptionId, {
        items: [{ id: existingItemId, price: FAMILY_MONTHLY_PRICE_ID }],
        proration_behavior: "create_prorations",
        cancel_at_period_end: false,
        metadata: {
          userId: user.id,
          planId: FAMILY_MONTHLY_PLAN.id,
          planType: "family",
          type: "subscription",
        },
      });

      // Immediately update user planType and cancelAtPeriodEnd in DB.
      await Promise.all([
        prisma.user.update({
          where: { id: user.id },
          data: { planType: "family" },
        }),
        prisma.subscription.updateMany({
          where: { stripeSubscriptionId: activeSub.stripeSubscriptionId },
          data: { cancelAtPeriodEnd: false, updatedAt: new Date() },
        }),
      ]);

      // Auto-provision up to 5 learner profiles for family access.
      await ensureFamilyProfiles(user.id);

      // Send upgrade confirmation email.
      // The webhook's upsertSubscription will NOT send one because isFirstActivation=false
      // (the subscription was already active/trialing before the price change).
      sendUpgradeConfirmationEmail(user.id, user.email, user.fullName).catch((e) =>
        console.error("[CREATE-FAMILY-SUB] Failed to send upgrade email:", e)
      );

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
        // Restrict to card and link only — Cash App and similar wallets cannot be
        // saved off-session and would fail renewal charges.
        payment_method_types: ["card", "link"],
        save_default_payment_method: "on_subscription",
      },
      description: "Seerah Family Monthly — TheMuslimMan",
      expand: ["latest_invoice", "latest_invoice.confirmation_secret"],
      metadata: {
        userId:   user.id,
        planId:   FAMILY_MONTHLY_PLAN.id,  // "familyMonthly"
        planType: "family",                // used in webhook to set user.planType
        type:     "subscription",
        ...(creator    ? { creator }    : {}),
        ...(promoCode  ? { promoCode }  : {}),
        ...(source     ? { source }     : {}),
        ...(utmSource  ? { utmSource }  : {}),
        ...(utmCampaign  ? { utmCampaign }  : {}),
        ...(utmMedium  ? { utmMedium }  : {}),
        ...(utmContent ? { utmContent } : {}),
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

    // Tag the underlying PaymentIntent with metadata and description.
    // PI ID is embedded in the client_secret: "pi_{id}_secret_{token}".
    const piId: string | null = clientSecret ? clientSecret.split("_secret_")[0] : null;
    if (piId?.startsWith("pi_")) {
      await stripe.paymentIntents.update(piId, {
        description: "Seerah Family Monthly — TheMuslimMan",
        metadata: {
          type:           "subscription",
          userId:         user.id,
          planId:         FAMILY_MONTHLY_PLAN.id,
          planType:       "family",
          subscriptionId: subscription.id,
          ...(creator     ? { creator }     : {}),
          ...(promoCode   ? { promoCode }   : {}),
          ...(source      ? { source }      : {}),
          ...(utmSource   ? { utmSource }   : {}),
          ...(utmCampaign ? { utmCampaign } : {}),
          ...(utmMedium   ? { utmMedium }   : {}),
          ...(utmContent  ? { utmContent }  : {}),
        },
      }).catch((e) => console.warn("[CREATE-FAMILY-SUB] Could not update PI metadata:", e));
      console.log(`[CREATE-FAMILY-SUB] Tagged PI ${piId} with metadata for user ${user.id}`);
    } else {
      console.warn("[CREATE-FAMILY-SUB] Could not parse PI ID from client_secret:", clientSecret?.slice(0, 30));
    }

    return NextResponse.json({ clientSecret, amount: FAMILY_MONTHLY_PLAN.price });
  } catch (error) {
    console.error("[CREATE-FAMILY-SUB] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to create subscription: ${message}` }, { status: 500 });
  }
}

// ── Upgrade confirmation email ────────────────────────────────────────────────

async function sendUpgradeConfirmationEmail(
  userId: string,
  email: string,
  fullName: string | null,
): Promise<void> {
  const { Resend } = await import("resend");
  const resend  = new Resend(process.env.RESEND_API_KEY);
  const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? "https://themuslimman.com";
  const year    = new Date().getFullYear();
  const name    = fullName?.trim() || "dear student";

  await resend.emails.send({
    from:    process.env.EMAIL_FROM ?? "TheMuslimMan <noreply@themuslimman.com>",
    to:      email,
    subject: "You've been upgraded to Family Monthly Access",
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%);padding:30px 20px;text-align:center;border-radius:12px 12px 0 0;">
            <h1 style="color:#f4c542;margin:0 0 8px 0;font-size:24px;">Upgraded to Family Access</h1>
            <p style="color:#ccc;margin:0;font-size:15px;">Your plan has been updated.</p>
          </div>
          <div style="background:#fff;padding:40px 30px;border:1px solid #e5e5e5;border-top:none;">
            <p style="font-size:16px;margin:0 0 16px 0;">Assalamu Alaykum ${name},</p>
            <p style="font-size:15px;margin:0 0 16px 0;">
              Your plan has been upgraded to <strong>Family Monthly Access — $9.99/mo</strong>.
              Up to 5 learner profiles are now available, each with their own separate progress tracking.
            </p>
            <p style="font-size:14px;color:#555;margin:0 0 16px 0;">
              Stripe will handle any proration automatically — your existing card will be charged the adjusted amount on your next billing date.
            </p>
            <div style="text-align:center;margin:32px 0;">
              <a href="${appUrl}/student/profiles" style="display:inline-block;background:#f4c542;color:#1a1a1a;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:700;font-size:16px;">
                Set Up Family Profiles
              </a>
            </div>
            <p style="font-size:13px;color:#aaa;margin:0;">
              Manage your billing anytime from your <a href="${appUrl}/billing" style="color:#b8960c;">billing page</a>.
            </p>
          </div>
          <div style="background:#f8f9fa;padding:20px;text-align:center;border-radius:0 0 12px 12px;border:1px solid #e5e5e5;border-top:none;">
            <p style="font-size:12px;color:#999;margin:0;">© ${year} TheMuslimMan · Complete Seerah</p>
          </div>
        </body>
      </html>
    `,
  });

  console.log(`[CREATE-FAMILY-SUB] Upgrade email sent to user ${userId}`);
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
