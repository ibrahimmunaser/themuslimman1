import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getUserAccessInfo } from "@/lib/access";
import { PLANS } from "@/lib/stripe-config";
import { nanoid } from "nanoid";
import { hashToken } from "@/lib/hash-token";

const INDIVIDUAL_MONTHLY_PRICE_ID =
  process.env.STRIPE_PRICE_INDIVIDUAL_MONTHLY ??
  process.env.STRIPE_MONTHLY_PRICE_ID ??
  "";
const FAMILY_MONTHLY_PRICE_ID =
  process.env.STRIPE_PRICE_FAMILY_MONTHLY ??
  process.env.STRIPE_FAMILY_MONTHLY_PRICE_ID ??
  "";

/**
 * POST /api/stripe/create-trial-intent
 *
 * Body: { planId: "individualTrial" | "familyTrial" }
 *
 * Free 7-day trial flow:
 *  1. Creates a Stripe subscription with trial_period_days=7 (no charge today).
 *  2. Writes the subscription row to the DB immediately so the success page can
 *     detect access without waiting for a separate webhook delivery.
 *  3. Returns the subscription's pending_setup_intent.client_secret so the
 *     checkout form can collect (but not charge) the card for post-trial billing.
 *
 * The client calls stripe.confirmSetup() — not confirmPayment() — since no
 * money changes hands at checkout. First charge occurs after the 7-day trial.
 *
 * Email verification is NOT required before checkout — per design, payment
 * (or in this case, account creation) grants entitlement; email verification
 * gates dashboard access.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to start a trial" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as { planId?: string };
    const planId = body.planId ?? "individualTrial";
    const isFamily = planId === "familyTrial";

    const monthlyPriceId = isFamily
      ? FAMILY_MONTHLY_PRICE_ID
      : INDIVIDUAL_MONTHLY_PRICE_ID;

    if (!monthlyPriceId.startsWith("price_")) {
      console.error(
        "[CREATE-TRIAL-INTENT] Monthly price ID not configured.",
        "monthly:", monthlyPriceId
      );
      return NextResponse.json(
        { error: "Trial checkout is not configured. Contact support." },
        { status: 500 }
      );
    }

    // ── Access & subscription checks ─────────────────────────────────────────
    const accessInfo = await getUserAccessInfo(user.id, user.hasPaid);

    if (accessInfo.hasAccess) {
      return NextResponse.json(
        { error: "You already have active access.", hasAccess: true },
        { status: 409 }
      );
    }

    // One free trial per account — any prior subscription row blocks re-use.
    const anyPriorSub = await prisma.subscription.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });

    if (anyPriorSub) {
      const isOnFamily = user.planType === "family";
      return NextResponse.json(
        {
          error: isOnFamily
            ? "You already have a Family plan. Manage it from your billing page."
            : "You've already used your free trial. Upgrade to Family Monthly or Family Lifetime instead.",
          trialAlreadyUsed: true,
          hasActiveSubscription: !isOnFamily,
          currentPlanType: user.planType ?? "individual",
        },
        { status: 409 }
      );
    }

    // ── Ensure Stripe customer ────────────────────────────────────────────────
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
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const planConfig = isFamily ? PLANS.familyTrial : PLANS.individualTrial;

    // ── Create subscription with 7-day free trial ─────────────────────────────
    // payment_settings.payment_method_collection = "always" forces Stripe to
    // create a pending_setup_intent even though no money is due today.
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: monthlyPriceId }],
      trial_period_days: planConfig.trialDays,
      trial_settings: {
        end_behavior: {
          // Cancel immediately when trial ends if no card was saved — prevents
          // zombie subscriptions and unexpected charges on accounts without cards.
          missing_payment_method: "cancel",
        },
      },
      payment_settings: {
        // Restrict to methods that support off-session recurring charges.
        // Cash App Pay cannot be saved for future subscription billing — exclude it.
        payment_method_types: ["card", "link"],
        save_default_payment_method: "on_subscription",
      },
      expand: ["pending_setup_intent"],
      metadata: {
        userId: user.id,
        planId: planConfig.id,
        type: "subscription",
        isTrial: "true",
        trialDays: String(planConfig.trialDays),
        ...(isFamily ? { planType: "family" } : {}),
      },
    });

    // ── Write DB row immediately ──────────────────────────────────────────────
    // This lets the payment/success page detect access via polling without
    // waiting for the customer.subscription.created webhook delivery.
    const trialEnd = subscription.trial_end
      ? new Date(subscription.trial_end * 1000)
      : new Date(Date.now() + planConfig.trialDays * 24 * 60 * 60 * 1000);
    const periodStart = subscription.start_date
      ? new Date(subscription.start_date * 1000)
      : new Date();

    await prisma.subscription.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: monthlyPriceId,
        status: "trialing",
        currentPeriodStart: periodStart,
        currentPeriodEnd: trialEnd,
        cancelAtPeriodEnd: false,
        updatedAt: new Date(),
      },
    });

    // ── Update family planType ────────────────────────────────────────────────
    if (isFamily) {
      await prisma.user.update({
        where: { id: user.id },
        data: { planType: "family" },
      });
    }

    // ── Send welcome email ────────────────────────────────────────────────────
    const planLabel = isFamily ? "Family Trial Access" : "7-Day Trial Access";
    sendTrialWelcomeEmail(user.id, planLabel).catch((err) =>
      console.error("[CREATE-TRIAL-INTENT] Failed to send welcome email:", err)
    );

    // ── Return SetupIntent client secret ──────────────────────────────────────
    // The client calls stripe.confirmSetup() to save the card for post-trial billing.
    const pendingSetupIntent = subscription.pending_setup_intent as Stripe.SetupIntent | null;

    let clientSecret = pendingSetupIntent?.client_secret ?? null;

    if (!clientSecret) {
      // Fallback: Stripe didn't auto-create a pending_setup_intent — create one
      // explicitly so the checkout form can still collect a payment method.
      console.warn(
        "[CREATE-TRIAL-INTENT] No pending_setup_intent on subscription",
        subscription.id, "— creating standalone SetupIntent"
      );
      const si = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ["card", "link"],
        usage: "off_session",
        metadata: { userId: user.id, subscriptionId: subscription.id },
      });
      clientSecret = si.client_secret;
    }

    if (!clientSecret) {
      return NextResponse.json(
        { error: "Failed to initialize trial setup. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      clientSecret,
      isFreeTrialSetup: true,
    });
  } catch (error) {
    console.error("[CREATE-TRIAL-INTENT] Error:", error);
    return NextResponse.json(
      { error: "Failed to initialize trial. Please try again." },
      { status: 500 }
    );
  }
}

async function sendTrialWelcomeEmail(userId: string, planName: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, fullName: true, passwordHash: true },
  });
  if (!user) return;

  // Guest checkout users get the "set your password" email instead
  if (!user.passwordHash) {
    await sendAccountSetupEmail(userId, user.email, user.fullName, planName);
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://themuslimman.com";
  const year = new Date().getFullYear();

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "TheMuslimMan <noreply@themuslimman.com>",
    to: user.email,
    subject: "Your 7-day free trial has started",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #f4c542; margin: 0 0 8px 0; font-size: 24px;">Your Free Trial is Active</h1>
            <p style="color: #ccc; margin: 0; font-size: 15px;">7 days of full access — no charge today.</p>
          </div>

          <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e5e5; border-top: none;">
            <p style="font-size: 16px; margin: 0 0 16px 0;">Assalamu Alaykum ${user.fullName ? user.fullName : "dear student"},</p>

            <p style="font-size: 15px; margin: 0 0 16px 0;">
              Your <strong>${planName}</strong> is now active. You have <strong>7 days of full access</strong> — completely free.
            </p>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${appUrl}/seerah" style="display: inline-block; background: #f4c542; color: #1a1a1a; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 16px;">
                Open the Course Dashboard
              </a>
            </div>

            <div style="background: #f9f4e8; border: 1px solid #e8d88a; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <p style="font-size: 15px; font-weight: 700; color: #333; margin: 0 0 12px 0;">Start here:</p>
              <ol style="font-size: 14px; color: #555; padding-left: 20px; margin: 0; line-height: 1.8;">
                <li><a href="${appUrl}/seerah" style="color: #b8960c; text-decoration: none;">Open the course dashboard</a></li>
                <li>Begin with <strong>Part 1</strong></li>
                <li>For each part, use the <strong>video, briefing, flashcards, and quiz together</strong> — they&rsquo;re designed to work as a set</li>
                <li>Reply to this email or <a href="${appUrl}/contact" style="color: #b8960c; text-decoration: none;">contact support</a> if anything breaks or is unclear</li>
              </ol>
            </div>

            <div style="background: #f0f9f0; border: 1px solid #c3e6c3; border-radius: 8px; padding: 16px; margin: 24px 0; font-size: 13px; color: #555;">
              <strong style="color: #333;">After your 7-day trial:</strong> Your subscription continues automatically at
              ${planName.includes("Family") ? "$19/month" : "$9/month"}. Cancel anytime from your
              <a href="${appUrl}/billing" style="color: #b8960c; text-decoration: none;">billing page</a> before the trial ends to avoid any charge.
            </div>

            <p style="font-size: 13px; color: #aaa; margin: 0;">
              After you&rsquo;ve had a chance to use the course, we&rsquo;d love to hear what you think.
              No pressure — whenever you&rsquo;re ready:
              <a href="${appUrl}/testimonial" style="color: #b8960c;"> Share your feedback.</a>
            </p>
          </div>

          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid #e5e5e5; border-top: none;">
            <p style="font-size: 12px; color: #999; margin: 0;">
              © ${year} TheMuslimMan · Complete Seerah
            </p>
          </div>
        </body>
      </html>
    `,
  });

  console.log(`[CREATE-TRIAL-INTENT] Welcome email sent to user ${userId}`);
}

/**
 * Sends an account setup email (set password + verify) for guest-checkout users.
 * Token is stored in the passwordResetToken field and expires in 48 hours.
 *
 * Idempotent: reuses any existing valid token to avoid invalidating a link
 * that was already emailed by an earlier call for the same purchase.
 */
async function sendAccountSetupEmail(
  userId: string,
  email: string,
  fullName: string | null,
  planName: string,
) {
  // Reload to get current token state
  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true, passwordResetToken: true, passwordResetExpiry: true },
  });

  if (!current || current.passwordHash) return; // already set up

  if (current.passwordResetToken && current.passwordResetExpiry && current.passwordResetExpiry > new Date()) {
    // Valid token already exists — don't overwrite or send a duplicate email
    console.log(`[CREATE-TRIAL-INTENT] Valid setup token already exists for user ${userId} — skipping duplicate email`);
    return;
  }

  const rawToken = nanoid(32);
  const tokenHash = hashToken(rawToken);
  const expiry = new Date(Date.now() + 48 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordResetToken: tokenHash, passwordResetExpiry: expiry },
  });

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://themuslimman.com";
  const setupUrl = `${appUrl}/set-password?token=${rawToken}`;
  const year = new Date().getFullYear();
  const greeting = fullName ? fullName : "dear student";

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "TheMuslimMan <noreply@themuslimman.com>",
    to: email,
    subject: "Set your password and start learning — Complete Seerah",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #f4c542; margin: 0 0 8px 0; font-size: 24px;">Your Trial is Active</h1>
            <p style="color: #ccc; margin: 0; font-size: 15px;">One last step to start learning.</p>
          </div>

          <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e5e5; border-top: none;">
            <p style="font-size: 16px; margin: 0 0 16px 0;">Assalamu Alaykum ${greeting},</p>

            <p style="font-size: 15px; margin: 0 0 16px 0;">
              Your <strong>${planName}</strong> is active. Click below to set your password and
              go straight to the dashboard.
            </p>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${setupUrl}" style="display: inline-block; background: #f4c542; color: #1a1a1a; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 16px;">
                Set My Password &amp; Start Learning
              </a>
            </div>

            <p style="font-size: 13px; color: #888; text-align: center; margin: 0 0 24px 0;">
              This link expires in 48 hours. If it stops working, use
              <a href="${appUrl}/forgot-password" style="color: #b8960c; text-decoration: none;">Forgot Password</a>
              to get a new one.
            </p>

            <div style="background: #f0f9f0; border: 1px solid #c3e6c3; border-radius: 8px; padding: 16px; margin: 24px 0; font-size: 13px; color: #555;">
              <strong style="color: #333;">After your 7-day trial:</strong> Continues at
              ${planName.includes("Family") ? "$19/month" : "$9/month"}. Cancel anytime before the trial ends from your
              <a href="${appUrl}/billing" style="color: #b8960c; text-decoration: none;">billing page</a>.
            </div>
          </div>

          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid #e5e5e5; border-top: none;">
            <p style="font-size: 12px; color: #999; margin: 0;">
              © ${year} TheMuslimMan · Complete Seerah
            </p>
          </div>
        </body>
      </html>
    `,
  });

  console.log(`[CREATE-TRIAL-INTENT] Account setup email sent to user ${userId}`);
}
