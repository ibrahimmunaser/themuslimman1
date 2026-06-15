import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { generateGiftToken, hashGiftToken, buildClaimUrl, sendGiftClaimEmail } from "@/lib/gift";
import Stripe from "stripe";
import { nanoid } from "nanoid";
import { hashToken } from "@/lib/hash-token";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * Extract subscription ID from Invoice across old and new Stripe API versions.
 *
 * Stripe API v2025+: invoice.parent.subscription_details.subscription
 * Stripe API v2024 and older: invoice.subscription (direct string field)
 *
 * Both fields are typed as unknown here because the Stripe SDK types do not
 * expose both shapes simultaneously. We narrow them safely rather than using
 * `as any`.
 */
function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  type InvoiceWithLegacy = typeof invoice & {
    parent?: { subscription_details?: { subscription?: string } };
    subscription?: string;
  };
  const inv = invoice as InvoiceWithLegacy;
  const fromParent: string | null =
    typeof inv.parent?.subscription_details?.subscription === "string"
      ? inv.parent.subscription_details.subscription
      : null;
  const fromRoot: string | null =
    typeof inv.subscription === "string" ? inv.subscription : null;
  return fromParent ?? fromRoot;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log(`[WEBHOOK] POST /api/stripe/webhook: Request received`);
  
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    console.error(`[WEBHOOK] POST /api/stripe/webhook: No signature provided`);
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log(`[WEBHOOK] POST /api/stripe/webhook: Event verified - type: ${event.type}, id: ${event.id}`);
  } catch (err) {
    console.error(`[WEBHOOK] POST /api/stripe/webhook: Signature verification FAILED:`, err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`[WEBHOOK] payment_intent.succeeded: ${paymentIntent.id}, amount: ${paymentIntent.amount} ${paymentIntent.currency}, customer: ${paymentIntent.customer}`);
        if (paymentIntent.metadata?.type === "gift") {
          await handleGiftPaymentSuccess(paymentIntent);
        } else if (paymentIntent.metadata?.type === "trial_fee") {
          // Legacy $1 trial-fee PI — handled for backward compatibility with any
          // in-flight PIs created before the free-trial migration. New signups no
          // longer go through this path (subscription + SetupIntent instead).
          await handleTrialFeePayment(paymentIntent);
        } else if (paymentIntent.metadata?.type === "subscription") {
          // Subscription payment — access is handled by customer.subscription.* events
          console.log(`[WEBHOOK] payment_intent.succeeded: subscription PI ${paymentIntent.id}, skipping Purchase creation`);
        } else if ((paymentIntent as unknown as Record<string, unknown>)["invoice"]) {
          // PI is attached to an invoice (Stripe-managed subscription payment).
          // Access is granted via customer.subscription.* / invoice.payment_succeeded.
          const invoiceId = (paymentIntent as unknown as Record<string, unknown>)["invoice"];
          console.log(`[WEBHOOK] payment_intent.succeeded: invoice-attached PI ${paymentIntent.id} (invoice: ${invoiceId}), skipping Purchase creation`);
        } else if (!paymentIntent.metadata?.userId || !paymentIntent.metadata?.planId) {
          // PI has no required metadata and is not a subscription — log and skip rather
          // than throwing so Stripe does not retry indefinitely.
          console.warn(`[WEBHOOK] payment_intent.succeeded: PI ${paymentIntent.id} missing userId/planId metadata but is not a subscription PI — skipping (customer: ${paymentIntent.customer})`);
        } else {
          await handlePaymentSuccess(paymentIntent);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        const lastErr = failedPayment.last_payment_error;
        const isAuthFailure =
          lastErr?.code === "payment_intent_authentication_failure" ||
          lastErr?.code === "authentication_required" ||
          (lastErr?.decline_code ?? "").includes("authentication");
        const failureLabel = isAuthFailure ? "3D Secure / authentication failed" : (lastErr?.code ?? "unknown");
        console.error(
          `[WEBHOOK] payment_intent.payment_failed: ${failedPayment.id} | ` +
          `${failureLabel} | decline_code=${lastErr?.decline_code ?? "n/a"} | ` +
          `message=${lastErr?.message ?? "n/a"} | customer=${failedPayment.customer ?? "n/a"} | ` +
          `amount=${failedPayment.amount} ${failedPayment.currency}`
        );
        // Mark any existing Purchase row as failed so the billing page and access
        // checks reflect the correct state (prevents a stuck "processing" record).
        await prisma.purchase.updateMany({
          where: { stripePaymentIntentId: failedPayment.id, status: { not: "succeeded" } },
          data: { status: "failed", updatedAt: new Date() },
        });
        break;
      }

      case "payment_intent.canceled": {
        // Clean up any pending GiftPurchase rows created before payment was collected.
        // These accumulate when a purchaser abandons the gift checkout flow.
        const canceledPI = event.data.object as Stripe.PaymentIntent;
        console.log(`[WEBHOOK] payment_intent.canceled: ${canceledPI.id}`);
        if (canceledPI.metadata?.type === "gift") {
          const result = await prisma.giftPurchase.deleteMany({
            where: { stripePaymentIntentId: canceledPI.id, status: "pending" },
          });
          if (result.count > 0) {
            console.log(`[WEBHOOK] payment_intent.canceled: deleted ${result.count} stale pending GiftPurchase row(s) for PI ${canceledPI.id}`);
          }
        }
        // Mark any non-succeeded Purchase row as failed (mirrors payment_failed handling).
        await prisma.purchase.updateMany({
          where: { stripePaymentIntentId: canceledPI.id, status: { not: "succeeded" } },
          data: { status: "failed", updatedAt: new Date() },
        });
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`[WEBHOOK] checkout.session.completed: ${session.id}, mode: ${session.mode}`);
        if (session.mode === "subscription") {
          await handleSubscriptionCheckoutCompleted(session);
        } else if (session.mode === "payment" && session.payment_intent) {
          // Lifetime one-time payment via Stripe Checkout. Retrieve the PaymentIntent
          // so handlePaymentSuccess can run its standard idempotent upsert.
          // This fires in addition to payment_intent.succeeded — both are idempotent,
          // so double-execution is safe and acts as a reliability fallback.
          const piId = typeof session.payment_intent === "string"
            ? session.payment_intent
            : (session.payment_intent as { id: string }).id;
          console.log(`[WEBHOOK] checkout.session.completed (payment): fetching PI ${piId}`);
          const pi = await stripe.paymentIntents.retrieve(piId);
          if (pi.status === "succeeded" && pi.metadata?.userId && pi.metadata?.planId) {
            await handlePaymentSuccess(pi);
          } else {
            console.warn(`[WEBHOOK] checkout.session.completed (payment): PI ${piId} not ready or missing metadata (status=${pi.status})`);
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        console.log(`[WEBHOOK] ${event.type}: ${sub.id}, status: ${sub.status}`);
        await handleSubscriptionUpsert(sub);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        console.log(`[WEBHOOK] customer.subscription.deleted: ${sub.id}`);
        await handleSubscriptionDeleted(sub);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        // subscription_id is at invoice.parent?.subscription_details?.subscription in API v2
        const invoiceSubId = getInvoiceSubscriptionId(invoice);
        console.log(`[WEBHOOK] invoice.payment_succeeded: ${invoice.id}, subscription: ${invoiceSubId}`);
        if (invoiceSubId) {
          await syncSubscriptionStatus(invoiceSubId);
        }
        break;
      }

      case "invoice.payment_failed":
      case "invoice.payment_action_required": {
        // payment_action_required = 3DS/SCA authentication needed on renewal.
        // Treat the same as a failed payment: sync status (likely past_due) and log.
        const invoice = event.data.object as Stripe.Invoice;
        const invoiceSubId2 = getInvoiceSubscriptionId(invoice);
        console.error(`[WEBHOOK] ${event.type}: ${invoice.id}, subscription: ${invoiceSubId2}`);
        if (invoiceSubId2) {
          await syncSubscriptionStatus(invoiceSubId2);
        }
        break;
      }

      default:
        console.log(`[WEBHOOK] Unhandled event type: ${event.type} (id: ${event.id})`);
    }
  } catch (handlerError) {
    const elapsed = Date.now() - startTime;
    console.error(
      `[WEBHOOK] Handler failed for event ${event.type} (id: ${event.id}) [${elapsed}ms]:`,
      handlerError
    );
    // Return 500 so Stripe retries the webhook delivery.
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  const elapsed = Date.now() - startTime;
  console.log(`[WEBHOOK] POST /api/stripe/webhook: Complete for event ${event.type} [${elapsed}ms]`);

  return NextResponse.json({ received: true });
}

/**
 * Handles a confirmed $1 trial-fee PaymentIntent.
 *
 * The subscription is intentionally NOT created at checkout time — doing so
 * would cause Stripe to immediately put it in "trialing" status (before payment),
 * granting access and sending a premature welcome email.
 *
 * Instead, we:
 *  1. Create the subscription with trial_period_days here, after real payment.
 *  2. Set hasPaid = true so the dashboard access check passes immediately.
 *  3. Send the welcome email.
 *  4. The resulting customer.subscription.created webhook is guarded in
 *     upsertSubscription to skip re-sending the email for isTrial subs.
 */
async function handleTrialFeePayment(pi: Stripe.PaymentIntent) {
  const { userId, monthlyPriceId, trialDays, planId } = pi.metadata;
  console.log(`[WEBHOOK] handleTrialFeePayment: PI ${pi.id}, userId: ${userId}, planId: ${planId}`);

  if (!userId || !monthlyPriceId) {
    throw new Error(`[WEBHOOK] handleTrialFeePayment: Missing metadata in PI ${pi.id}`);
  }

  const customerId =
    typeof pi.customer === "string" ? pi.customer : (pi.customer as Stripe.Customer)?.id ?? "";
  const parsedTrialDays = parseInt(trialDays ?? "7", 10);
  // If trialDays is 0 the user already exhausted their trial — start billing immediately.
  // Fall back to 7 only when the metadata value is missing/NaN (normal first purchase).
  const trialDaysNum = isNaN(parsedTrialDays) ? 7 : parsedTrialDays;
  const isFamily = planId === "familyTrial";

  // Attach the payment method as default only if it supports off-session recurring charges.
  // Card and Link are saveable; other methods (e.g. Cash App) are not and must not be set.
  if (pi.payment_method && customerId) {
    try {
      const pm = await stripe.paymentMethods.retrieve(pi.payment_method as string);
      if (pm.type === "card" || pm.type === "link") {
        await stripe.customers.update(customerId, {
          invoice_settings: { default_payment_method: pi.payment_method as string },
        });
      } else {
        console.warn(
          `[WEBHOOK] handleTrialFeePayment: PM type "${pm.type}" cannot be saved off-session — skipping default PM update`
        );
      }
    } catch (e) {
      console.warn("[WEBHOOK] handleTrialFeePayment: Could not set default PM:", e);
    }
  }

  // If upgrading from an individual trial to a family trial, cancel the old
  // individual subscription so the user isn't billed twice after trial ends.
  if (isFamily) {
    const oldSubs = await prisma.subscription.findMany({
      where: { userId, status: { in: ["trialing", "active"] } },
      select: { stripeSubscriptionId: true },
    });
    for (const old of oldSubs) {
      await stripe.subscriptions
        .cancel(old.stripeSubscriptionId)
        .catch((e) => console.warn("[WEBHOOK] handleTrialFeePayment: Could not cancel old sub:", e));
      await prisma.subscription
        .update({ where: { stripeSubscriptionId: old.stripeSubscriptionId }, data: { status: "canceled" } })
        .catch(() => {});
      console.log(`[WEBHOOK] handleTrialFeePayment: Cancelled old subscription ${old.stripeSubscriptionId} for user ${userId}`);
    }
  }

  // Create the subscription. If trialDaysNum > 0 apply a trial period; otherwise
  // bill immediately (user already exhausted their trial by upgrading late).
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: monthlyPriceId }],
    ...(trialDaysNum > 0 ? { trial_period_days: trialDaysNum } : {}),
    default_payment_method: pi.payment_method as string | undefined ?? undefined,
    metadata: {
      userId,
      planId,
      type: "subscription",
      isTrial: "true",
      ...(isFamily ? { planType: "family" } : {}),
    },
  });
  console.log(`[WEBHOOK] handleTrialFeePayment: Subscription ${subscription.id} created (status: ${subscription.status})`);

  // Immediately upsert the subscription row so the payment success page can
  // detect access without waiting for the separate customer.subscription.created
  // webhook delivery. That webhook will idempotently update the same row later.
  await upsertSubscription(userId, subscription);

  // Update family planType if needed. Do NOT set hasPaid=true — trial subscribers
  // are subscription-based users, not lifetime buyers. Setting hasPaid would make
  // the billing page show them as "Lifetime access" which is incorrect.
  const userUpdate: { planType?: string; stripeCustomerId?: string } = {};
  if (isFamily) userUpdate.planType = "family";
  if (customerId) userUpdate.stripeCustomerId = customerId;
  if (Object.keys(userUpdate).length > 0) {
    await prisma.user.update({ where: { id: userId }, data: userUpdate });
    console.log(`[WEBHOOK] handleTrialFeePayment: User ${userId} updated:`, userUpdate);
  }

  // Family profiles are auto-provisioned by upsertSubscription (called above)
  // when the subscription first becomes active/trialing — no second call needed here.

  // Send welcome email (only here — upsertSubscription skips it for isTrial subs)
  const planLabel = isFamily ? "Family Trial Access" : "7-Day Trial Access";
  sendPurchaseConfirmationEmail(userId, planLabel).catch((err) =>
    console.error("[WEBHOOK] handleTrialFeePayment: Failed to send welcome email:", err)
  );
  console.log(`[WEBHOOK] handleTrialFeePayment: Welcome email queued for user ${userId}`);
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const startTime = Date.now();
  const { userId, planId, planName } = paymentIntent.metadata;

  console.log(`[WEBHOOK] handlePaymentSuccess: Processing payment ${paymentIntent.id} - userId: ${userId}, planId: ${planId}, planName: ${planName}`);

  if (!userId || !planId) {
    // Throw so Stripe retries this event rather than silently losing the access grant.
    throw new Error(`[WEBHOOK] handlePaymentSuccess: Missing required metadata (userId=${userId}, planId=${planId}) in payment intent ${paymentIntent.id}`);
  }

  try {
    console.log(`[WEBHOOK] handlePaymentSuccess: Upserting purchase record for payment ${paymentIntent.id}...`);

    // Check if the purchase row already existed — used to gate the confirmation
    // email so Stripe webhook retries don't send duplicate emails.
    const existingPurchase = await prisma.purchase.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
      select: { id: true },
    });

    // Upsert purchase — idempotent so webhook retries and the verify-payment
    // route don't create duplicate records for the same PaymentIntent.
    await prisma.purchase.upsert({
      where: { stripePaymentIntentId: paymentIntent.id },
      create: {
        id: crypto.randomUUID(),
        updatedAt: new Date(),
        userId,
        planId,
        planName,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        stripePaymentIntentId: paymentIntent.id,
        status: "succeeded",
        promoCode: paymentIntent.metadata.promoCode || null,
        creator:   paymentIntent.metadata.creator   || null,
      },
      update: {
        status:    "succeeded",
        promoCode: paymentIntent.metadata.promoCode || null,
        creator:   paymentIntent.metadata.creator   || null,
      },
    });
    
    console.log(`[WEBHOOK] handlePaymentSuccess: Purchase record upserted for payment ${paymentIntent.id}`);

    // Update user's hasPaid flag, planType, and stripeCustomerId if present.
    // Family plan → planType = "family" (5 profiles).
    // Individual lifetime ("complete") → planType = "individual" to correct any
    // stale "family" value left over if the user was previously on a family trial
    // and then purchased individual lifetime instead of family lifetime.
    const updateData: {
      hasPaid: boolean;
      planType?: string;
      stripeCustomerId?: string;
    } = { hasPaid: true };

    if (planId === "family") {
      updateData.planType = "family";
      console.log(`[WEBHOOK] handlePaymentSuccess: Setting planType=family for user ${userId}`);
    } else if (planId === "complete") {
      updateData.planType = "individual";
      console.log(`[WEBHOOK] handlePaymentSuccess: Setting planType=individual for user ${userId}`);
    }

    if (paymentIntent.customer && typeof paymentIntent.customer === "string") {
      updateData.stripeCustomerId = paymentIntent.customer;
    }
    await prisma.user.update({ where: { id: userId }, data: updateData });
    console.log(`[WEBHOOK] handlePaymentSuccess: User ${userId} updated - hasPaid=true, planType=${updateData.planType ?? "unchanged"}`);

    // Auto-provision 5 learner profiles for family lifetime purchases.
    if (planId === "family") {
      await ensureFamilyProfiles(userId).catch((e) =>
        console.error("[WEBHOOK] handlePaymentSuccess: Failed to provision family profiles:", e)
      );
    }

    // Attach payment method to Stripe customer for saved cards
    if (paymentIntent.payment_method && paymentIntent.customer) {
      console.log(`[WEBHOOK] handlePaymentSuccess: Attaching payment method ${paymentIntent.payment_method} to customer ${paymentIntent.customer}`);
      try {
        await stripe.paymentMethods.attach(paymentIntent.payment_method as string, {
          customer: paymentIntent.customer as string,
        });
        console.log(`[WEBHOOK] handlePaymentSuccess: Payment method attached successfully`);
      } catch (attachError) {
        console.log(`[WEBHOOK] handlePaymentSuccess: Payment method already attached or attachment failed (non-critical):`, attachError);
      }
    }

    // Lifetime replaces monthly: cancel any active or past_due subscription immediately
    // so the user is not billed again. Lifetime access is now active, so there is no
    // reason to keep the subscription running. The customer.subscription.deleted webhook
    // fires next; handleSubscriptionDeleted is guarded by hasPaid so planType is safe.
    const activeSub = await prisma.subscription.findFirst({
      where: { userId, status: { in: ["active", "trialing", "past_due"] } },
      select: { stripeSubscriptionId: true },
    });
    if (activeSub) {
      try {
        await stripe.subscriptions.cancel(activeSub.stripeSubscriptionId);
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: activeSub.stripeSubscriptionId },
          data: { status: "canceled", cancelAtPeriodEnd: false, updatedAt: new Date() },
        });
        console.log(`[WEBHOOK] handlePaymentSuccess: Immediately cancelled subscription ${activeSub.stripeSubscriptionId} after lifetime purchase for user ${userId}`);
      } catch (cancelErr) {
        console.error(`[WEBHOOK] handlePaymentSuccess: Failed to cancel subscription ${activeSub.stripeSubscriptionId}:`, cancelErr);
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(`[WEBHOOK] handlePaymentSuccess: Purchase recorded for user ${userId}: ${planName ?? planId} [${elapsed}ms]`);

    // Send purchase confirmation email — non-blocking, only on first processing
    // to avoid duplicate emails when Stripe retries the webhook.
    if (!existingPurchase) {
      sendPurchaseConfirmationEmail(userId, planName ?? planId).catch((err) =>
        console.error("[WEBHOOK] [PURCHASE_EMAIL] Failed to send confirmation email:", err)
      );
    } else {
      console.log(`[WEBHOOK] [PURCHASE_EMAIL] Skipping duplicate confirmation email for ${paymentIntent.id}`);
    }
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[WEBHOOK] handlePaymentSuccess: ERROR recording purchase for payment ${paymentIntent.id} [${elapsed}ms]:`, error);
    // Re-throw so the webhook route returns 500 and Stripe retries.
    throw error;
  }
}

// ── Family profile auto-provisioning ─────────────────────────────────────────

/**
 * Ensures a family user has exactly 5 learner profiles.
 * Safe to call multiple times — idempotent, never deletes existing profiles.
 *
 * Profile names:
 *   Slot 1 — user's full name (or "Main Learner") — marked isDefault=true
 *   Slots 2–5 — "Learner 2" … "Learner 5"
 *
 * If the user already has profiles those are kept and we only fill missing
 * slots up to 5 total.
 */
async function ensureFamilyProfiles(userId: string): Promise<void> {
  const FAMILY_LIMIT = 5;

  const [existingProfiles, user] = await Promise.all([
    prisma.learnerProfile.findMany({
      where: { userId },
      select: { id: true, isDefault: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true },
    }),
  ]);

  const toCreate = FAMILY_LIMIT - existingProfiles.length;
  if (toCreate <= 0) return; // already fully provisioned

  const hasDefault = existingProfiles.some((p) => p.isDefault);
  const existingCount = existingProfiles.length;

  const newProfiles = Array.from({ length: toCreate }, (_, i) => {
    const slot = existingCount + i + 1; // 1-based slot index
    const isMainSlot = slot === 1;
    return {
      id: crypto.randomUUID(),
      userId,
      displayName: isMainSlot
        ? (user?.fullName?.trim() || "Main Learner")
        : `Learner ${slot}`,
      isDefault: isMainSlot && !hasDefault,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  await prisma.learnerProfile.createMany({ data: newProfiles });
  console.log(
    `[WEBHOOK] ensureFamilyProfiles: Created ${newProfiles.length} profiles for user ${userId} ` +
    `(${existingCount} already existed)`
  );
}

// ── Subscription helpers ──────────────────────────────────────────────────────

async function handleSubscriptionCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) {
    // Throw so Stripe retries the event rather than silently losing the subscription grant.
    throw new Error(`[WEBHOOK] handleSubscriptionCheckoutCompleted: Missing userId in session metadata (session=${session.id})`);
  }

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  if (!subscriptionId) {
    throw new Error(`[WEBHOOK] handleSubscriptionCheckoutCompleted: No subscription attached to session (session=${session.id})`);
  }

  try {
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    await upsertSubscription(userId, sub);
    // Save Stripe customer ID on user if missing
    const customerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
    if (customerId) {
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      }).catch(() => {});
    }
    console.log(`[WEBHOOK] Subscription ${subscriptionId} created for user ${userId}`);
  } catch (err) {
    console.error("[WEBHOOK] handleSubscriptionCheckoutCompleted error:", err);
    // Re-throw so Stripe retries if subscription creation couldn't be persisted.
    throw err;
  }
}

async function handleSubscriptionUpsert(sub: Stripe.Subscription) {
  // userId is in subscription metadata (set during checkout session creation)
  const userId = sub.metadata?.userId;
  if (!userId) {
    // Fall back: look up user by stripeCustomerId
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
    if (customerId) {
      const user = await prisma.user.findFirst({
        where: { stripeCustomerId: customerId },
        select: { id: true },
      });
      if (user) {
        await upsertSubscription(user.id, sub);
        return;
      }
    }
    // Throw so Stripe retries and we get another chance to link the subscription
    // once the customer lookup resolves (e.g. after stripeCustomerId is written).
    throw new Error(`[WEBHOOK] handleSubscriptionUpsert: Cannot resolve userId for sub ${sub.id}`);
  }
  await upsertSubscription(userId, sub);
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: sub.id },
    data: { status: "canceled", updatedAt: new Date() },
  });
  console.log(`[WEBHOOK] Subscription ${sub.id} marked canceled`);

  // Guard: Stripe may send a deletion event with no items (e.g. a sub that was
  // cancelled before its first billing cycle). Skip planType detection in that case.
  if (!sub.items?.data?.length) {
    console.log(`[WEBHOOK] handleSubscriptionDeleted: sub ${sub.id} has no items — skipping planType downgrade`);
    return;
  }

  // If this was a Family Monthly subscription, downgrade the user's planType
  // back to "individual" — unless they also hold a lifetime Family purchase.
  //
  // Detection order:
  //   1. metadata.planType === "family"  (set by create-family-subscription-intent)
  //   2. price ID matches STRIPE_FAMILY_MONTHLY_PRICE_ID  (fallback for subs created
  //      before we added metadata, or if Stripe drops metadata on retries)
  const cancelledPriceId = sub.items.data[0]?.price?.id;
  const isFamilySub =
    sub.metadata?.planType === "family" ||
    (!!cancelledPriceId && cancelledPriceId === process.env.STRIPE_FAMILY_MONTHLY_PRICE_ID);

  if (!isFamilySub) {
    console.log(`[WEBHOOK] handleSubscriptionDeleted: sub ${sub.id} is not a family sub — no planType change`);
    return;
  }

  // Resolve userId: prefer subscription metadata, fall back to Stripe customer lookup.
  let userId: string | null = sub.metadata?.userId ?? null;
  if (!userId) {
    const customerId = typeof sub.customer === "string" ? sub.customer : (sub.customer as Stripe.Customer)?.id;
    if (customerId) {
      const u = await prisma.user.findFirst({ where: { stripeCustomerId: customerId }, select: { id: true } });
      userId = u?.id ?? null;
    }
  }

  if (!userId) {
    // Throw so Stripe retries once stripeCustomerId is populated, preventing
    // a cancelled Family sub from silently leaving planType stuck as "family".
    throw new Error(`[WEBHOOK] handleSubscriptionDeleted: Could not resolve userId for family sub ${sub.id}`);
  }

  // Higher-tier wins: if the user has ANY lifetime access (Stripe or IAP) or an
  // active family IAP subscription, do not reset planType. The lifetime purchase
  // already granted the correct planType via handlePaymentSuccess, and the
  // cancellation webhook must not override it.
  //
  // Examples this protects:
  //   • Individual monthly → buys Individual Lifetime → sub cancelled → stays planType=individual ✓
  //   • Family monthly → buys Family Lifetime → sub cancelled → stays planType=family ✓
  //   • Individual monthly → buys Family Lifetime → sub cancelled → stays planType=family ✓
  //   • Family IAP sub + Stripe family sub cancelled → stays planType=family (IAP still active) ✓
  const now = new Date();
  const [lifetimeUser, familyIap] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { hasPaid: true } }),
    prisma.mobilePurchase.findFirst({
      where: {
        userId,
        status: "active",
        OR: [
          { purchaseType: "lifetime" },
          { purchaseType: "subscription", currentPeriodEnd: { gte: now } },
        ],
      },
      select: { id: true },
    }),
  ]);

  if (!lifetimeUser?.hasPaid && !familyIap) {
    await prisma.user.update({
      where: { id: userId },
      data: { planType: "individual" },
    }).catch((e) => console.error("[WEBHOOK] handleSubscriptionDeleted: Failed to reset planType:", e));
    console.log(`[WEBHOOK] Downgraded user ${userId} to planType=individual after family sub ${sub.id} cancelled`);
  } else {
    const reason = lifetimeUser?.hasPaid ? "hasPaid=true" : "active IAP subscription";
    console.log(`[WEBHOOK] User ${userId} retains planType (${reason}) after sub ${sub.id} cancelled`);
  }
}

async function syncSubscriptionStatus(subscriptionId: string) {
  try {
    const sub = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["items.data"],
    });
    const periods = getSubPeriod(sub);
    const result = await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscriptionId },
      data: {
        status: sub.status,
        // Only overwrite period dates when Stripe provides real values.
        ...(periods ? {
          currentPeriodStart: periods.start,
          currentPeriodEnd: periods.end,
        } : {}),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        updatedAt: new Date(),
      },
    });

    // If 0 rows updated, the subscription row hasn't been created yet
    // (e.g. invoice event arrives before customer.subscription.created).
    // Upsert so the state is correct regardless of event ordering.
    if (result.count === 0) {
      console.warn(`[WEBHOOK] syncSubscriptionStatus: No row for sub ${subscriptionId} — upserting via handleSubscriptionUpsert`);
      await handleSubscriptionUpsert(sub);
    }
  } catch (err) {
    console.error("[WEBHOOK] syncSubscriptionStatus error:", err);
    // Re-throw so Stripe retries if subscription status update fails.
    throw err;
  }
}

/**
 * In Stripe API 2026-04-22.dahlia, period dates moved from Subscription to SubscriptionItem.
 * Returns the real period dates when available, or null when they cannot be determined safely.
 *
 * The old fallback using `sub.created + 30 days` was removed because it writes stale dates
 * for any webhook fired after the subscription's first billing cycle (e.g. a renewal event
 * on a 6-month-old subscription would store a currentPeriodEnd 6 months in the past).
 * Callers must handle null: skip updating period columns on UPDATE; use a logged approximate
 * on CREATE (since the DB columns are non-nullable).
 */
function getSubPeriod(sub: Stripe.Subscription): { start: Date; end: Date } | null {
  const item = sub.items?.data?.[0];
  if (item?.current_period_start && item?.current_period_end) {
    return {
      start: new Date(item.current_period_start * 1000),
      end: new Date(item.current_period_end * 1000),
    };
  }
  console.warn(
    `[WEBHOOK] getSubPeriod: No SubscriptionItem period dates for sub ${sub.id}. ` +
    `Period columns will not be overwritten on existing records.`
  );
  return null;
}

async function upsertSubscription(userId: string, sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : (sub.customer as Stripe.Customer)?.id ?? "";
  const priceId = sub.items.data[0]?.price?.id ?? "";
  const periods = getSubPeriod(sub);

  // On CREATE the schema requires non-nullable period columns.
  // If Stripe didn't provide real dates, approximate now→+30d and log — this
  // only affects brand-new subscriptions where we have no prior data to preserve.
  const createPeriodStart = periods?.start ?? new Date();
  const createPeriodEnd   = periods?.end   ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  if (!periods) {
    console.warn(
      `[WEBHOOK] upsertSubscription: Using approximate period dates for CREATE of sub ${sub.id}`
    );
  }

  // Check if this subscription was previously non-active (incomplete/null) — used below
  // to send a welcome email on first activation only.
  const ACTIVE_STATUSES = ["active", "trialing"];
  const existing = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: sub.id },
    select: { status: true },
  });
  const isFirstActivation =
    ACTIVE_STATUSES.includes(sub.status) &&
    (!existing || !ACTIVE_STATUSES.includes(existing.status));

  // Abandoned checkout: Stripe expires incomplete subscriptions after ~23 hours.
  // When that happens, send a one-time recovery email so we have a chance to win
  // the customer back. Only fires once — when status transitions to incomplete_expired.
  const isAbandonedExpiry =
    sub.status === "incomplete_expired" &&
    (!existing || existing.status === "incomplete");

  if (isAbandonedExpiry) {
    console.log(`[WEBHOOK] upsertSubscription: incomplete_expired for sub ${sub.id} (userId ${userId}) — queueing recovery email`);
    sendAbandonedCheckoutEmail(userId, sub).catch((e) =>
      console.error("[WEBHOOK] upsertSubscription: Failed to send abandoned checkout email:", e)
    );
  }

  const subCreator   = sub.metadata?.creator   ?? null;
  const subPromoCode = sub.metadata?.promoCode ?? null;

  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: sub.id },
    create: {
      id: crypto.randomUUID(),
      updatedAt: new Date(),
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      status: sub.status,
      currentPeriodStart: createPeriodStart,
      currentPeriodEnd: createPeriodEnd,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      ...(subCreator   ? { creator: subCreator }     : {}),
      ...(subPromoCode ? { promoCode: subPromoCode } : {}),
    },
    update: {
      status: sub.status,
      stripePriceId: priceId,
      // Only overwrite period dates when Stripe provides real values.
      // Leaving them untouched is always safer than writing stale dates.
      ...(periods ? {
        currentPeriodStart: periods.start,
        currentPeriodEnd: periods.end,
      } : {}),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      updatedAt: new Date(),
      // Only backfill creator/promoCode if they are missing — never overwrite
      ...(subCreator   ? { creator: subCreator }     : {}),
      ...(subPromoCode ? { promoCode: subPromoCode } : {}),
    },
  });

  // If this is a Family plan subscription that just became active or trialing,
  // upgrade the user's planType to "family" so they get the 5-profile limit.
  const isFamilySub = sub.metadata?.planType === "family";
  const isActiveOrTrialing = ACTIVE_STATUSES.includes(sub.status);
  if (isFamilySub && isActiveOrTrialing) {
    await prisma.user.update({
      where: { id: userId },
      data: { planType: "family" },
    }).catch((e) => console.error("[WEBHOOK] upsertSubscription: Failed to set planType=family:", e));
    console.log(`[WEBHOOK] upsertSubscription: Set planType=family for user ${userId} (sub ${sub.id})`);

    // Auto-provision up to 5 learner profiles on first activation so the user
    // doesn't have to visit /profiles before they appear.
    if (isFirstActivation) {
      ensureFamilyProfiles(userId).catch((e) =>
        console.error("[WEBHOOK] upsertSubscription: ensureFamilyProfiles failed:", e)
      );
    }
  }

  // Send a welcome email the first time a subscription becomes active/trialing.
  // Monthly buyers would otherwise get no confirmation after checkout.
  //
  // Skip for trial subscriptions (isTrial = "true"): the trial welcome email is
  // sent synchronously by create-trial-intent (the API route that creates the
  // subscription). Since that route also writes the DB row immediately,
  // isFirstActivation will be false when this webhook fires — so this branch is
  // only a safety guard in case the DB write raced. For legacy $1-trial PIs,
  // handleTrialFeePayment sends the email instead.
  const isTrialSub = sub.metadata?.isTrial === "true";
  if (isFirstActivation && !isTrialSub) {
    const planLabel = isFamilySub ? "Family Monthly Access" : "Monthly Access";
    sendPurchaseConfirmationEmail(userId, planLabel).catch((err) =>
      console.error("[WEBHOOK] upsertSubscription: Failed to send subscription welcome email:", err)
    );
    console.log(`[WEBHOOK] upsertSubscription: Welcome email queued for user ${userId} (sub ${sub.id})`);
  } else if (isFirstActivation && isTrialSub) {
    // DB row created after a race — send email here as fallback
    const planLabel = isFamilySub ? "Family Trial Access" : "7-Day Trial Access";
    sendPurchaseConfirmationEmail(userId, planLabel).catch((err) =>
      console.error("[WEBHOOK] upsertSubscription: Failed to send trial welcome email fallback:", err)
    );
    console.log(`[WEBHOOK] upsertSubscription: Trial welcome email fallback queued for user ${userId} (sub ${sub.id})`);
  }
}

// ── Gift payment ──────────────────────────────────────────────────────────────

async function handleGiftPaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const { purchaserUserId, purchaserEmail, recipientEmail, recipientName, giftMessage } =
    paymentIntent.metadata;

  console.log(`[WEBHOOK] handleGiftPaymentSuccess: ${paymentIntent.id} purchaser: ${purchaserEmail} → recipient: ${recipientEmail}`);

  if (!purchaserEmail || !recipientEmail) {
    // Throw so Stripe retries rather than silently dropping gift fulfillment.
    throw new Error(`[WEBHOOK] handleGiftPaymentSuccess: Missing purchaserEmail/recipientEmail metadata in payment intent ${paymentIntent.id}`);
  }

  try {
    // Ensure a GiftPurchase record exists (create if webhook fires before verify-and-create).
    // planId must come from metadata — "complete" is the safe fallback for individual gifts.
    const giftPlanId = paymentIntent.metadata.planId ?? "complete";
    await prisma.giftPurchase.upsert({
      where: { stripePaymentIntentId: paymentIntent.id },
      create: {
        id: crypto.randomUUID(),
        stripePaymentIntentId: paymentIntent.id,
        purchaserUserId: purchaserUserId || null,
        purchaserEmail,
        recipientEmail,
        recipientName: recipientName || null,
        giftMessage: giftMessage || null,
        planId: giftPlanId,
        status: "pending",
      },
      update: {
        // Ensure planId is set if the row was created without it by an earlier webhook
        planId: giftPlanId,
      },
    });

    // Atomically transition pending → paid and generate claim token
    const rawToken = generateGiftToken();
    const tokenHash = hashGiftToken(rawToken);

    // Transition pending → paid (idempotent; noop if already paid)
    await prisma.giftPurchase.updateMany({
      where: { stripePaymentIntentId: paymentIntent.id, status: "pending" },
      data: { status: "paid", claimTokenHash: tokenHash },
    });

    // Send email whenever it hasn't been sent yet — this is the retry-safe guard.
    // Checking emailSentAt (not the status transition count) means a failed send
    // on a previous webhook attempt is retried correctly on the next one.
    const giftRecord = await prisma.giftPurchase.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
      select: { emailSentAt: true, claimTokenHash: true },
    });

    if (giftRecord && !giftRecord.emailSentAt) {
      // Generate a fresh token on every email attempt (including retries) so the
      // stored hash and the emailed URL always match. The transition updateMany
      // above may have been a no-op on retries (status already "paid"), so we
      // must explicitly overwrite the stored hash here before sending.
      const freshRawToken = generateGiftToken();
      const freshHash = hashGiftToken(freshRawToken);
      await prisma.giftPurchase.update({
        where: { stripePaymentIntentId: paymentIntent.id },
        data: { claimTokenHash: freshHash },
      });
      const claimUrl = buildClaimUrl(freshRawToken);
      try {
        await sendGiftClaimEmail({
          recipientEmail,
          recipientName: recipientName || null,
          purchaserEmail,
          giftMessage: giftMessage || null,
          claimUrl,
          planId: giftPlanId,
        });
        await prisma.giftPurchase.update({
          where: { stripePaymentIntentId: paymentIntent.id },
          data: { emailSentAt: new Date() },
        });
        console.log(`[WEBHOOK] handleGiftPaymentSuccess: Gift email sent`);
      } catch (emailErr) {
        // Throw so Stripe retries and the email is attempted again.
        throw new Error(`[WEBHOOK] handleGiftPaymentSuccess: Email send failed — will retry: ${emailErr}`);
      }
    } else {
      console.log(`[WEBHOOK] handleGiftPaymentSuccess: Gift email already sent for ${paymentIntent.id}, skipping`);
    }
  } catch (error) {
    console.error(`[WEBHOOK] handleGiftPaymentSuccess: ERROR for ${paymentIntent.id}:`, error);
    // Re-throw so the webhook route returns 500 and Stripe retries this event.
    throw error;
  }
}

async function sendPurchaseConfirmationEmail(userId: string, planName: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, fullName: true, passwordHash: true },
  });

  if (!user) {
    console.error("[PURCHASE_EMAIL] User not found:", userId);
    return;
  }

  // Guest checkout users (no password yet) receive a "set your password" email
  // rather than the regular welcome email. Setting the password also verifies
  // their email, granting full dashboard access.
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
    subject: "Your Complete Seerah access is ready",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #f4c542; margin: 0 0 8px 0; font-size: 24px;">JazakAllahu Khayran</h1>
            <p style="color: #ccc; margin: 0; font-size: 15px;">Your access is ready.</p>
          </div>

          <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e5e5; border-top: none;">
            <p style="font-size: 16px; margin: 0 0 16px 0;">Assalamu Alaykum ${user.fullName ? user.fullName : "dear student"},</p>

            <p style="font-size: 15px; margin: 0 0 16px 0;">
              Thank you for your purchase. Your <strong>${planName}</strong> is now active and ready to use.
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

            <p style="font-size: 14px; color: #555; margin: 0 0 10px 0;">
              Your access includes:
            </p>
            <ul style="font-size: 14px; color: #555; padding-left: 20px; margin: 0 0 24px 0;">
              <li style="margin-bottom: 6px;">All 100 Seerah parts — videos, audio, briefings, flashcards, quizzes, and more</li>
              <li style="margin-bottom: 6px;">Progress tracking across every lesson</li>
              <li style="margin-bottom: 6px;">Lifetime access — learn at your own pace, anytime</li>
            </ul>

            <div style="background: #f5f5f5; border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin: 24px 0; font-size: 13px; color: #666;">
              <strong style="color: #333;">7-Day Clarity Guarantee:</strong> If the course is not what you expected,
              email us within 7 days for a full refund. No hoops.
              <a href="${appUrl}/contact" style="color: #b8960c; text-decoration: none;"> Contact us here.</a>
            </div>

            <p style="font-size: 13px; color: #777; margin: 0 0 12px 0;">
              Want to understand our approach and sources?
              <a href="${appUrl}/methodology" style="color: #b8960c;"> Read our methodology.</a>
            </p>

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

  console.log(`[PURCHASE_EMAIL] Confirmation sent to user ${userId}`);
}

/**
 * Sends a "set your password" email to a guest-checkout user after their
 * purchase is confirmed. The token link (48h expiry) takes them to
 * /set-password where they choose a password and are automatically verified
 * and logged in.
 *
 * Idempotent: if a valid token already exists it is reused so that multiple
 * webhook events for the same purchase don't each generate a new token and
 * invalidate the link already sent in the first email.
 */
async function sendAccountSetupEmail(
  userId: string,
  email: string,
  fullName: string | null,
  planName: string,
) {
  // Reload the user to get the current token state
  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true, passwordResetToken: true, passwordResetExpiry: true },
  });

  // Already set up — nothing to do
  if (!current || current.passwordHash) return;

  let rawToken: string;

  if (current.passwordResetToken && current.passwordResetExpiry && current.passwordResetExpiry > new Date()) {
    // A valid token already exists — skip regenerating to avoid invalidating
    // the link that was already emailed. Don't send a duplicate email.
    console.log(`[PURCHASE_EMAIL] Valid setup token already exists for user ${userId} — skipping duplicate email`);
    return;
  }

  // Generate a fresh token (48-hour expiry)
  rawToken = nanoid(32);
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
            <h1 style="color: #f4c542; margin: 0 0 8px 0; font-size: 24px;">JazakAllahu Khayran</h1>
            <p style="color: #ccc; margin: 0; font-size: 15px;">One last step to start learning.</p>
          </div>

          <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e5e5; border-top: none;">
            <p style="font-size: 16px; margin: 0 0 16px 0;">Assalamu Alaykum ${greeting},</p>

            <p style="font-size: 15px; margin: 0 0 16px 0;">
              Your <strong>${planName}</strong> is now active. Click the button below to set your
              password and go straight to the dashboard.
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

            <div style="background: #f9f4e8; border: 1px solid #e8d88a; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <p style="font-size: 14px; font-weight: 700; color: #333; margin: 0 0 8px 0;">Once you&rsquo;re in, start here:</p>
              <ol style="font-size: 14px; color: #555; padding-left: 20px; margin: 0; line-height: 1.8;">
                <li>Go to Part 1 on the dashboard</li>
                <li>Use the <strong>video, briefing, flashcards, and quiz together</strong></li>
                <li>Reply to this email if anything is unclear</li>
              </ol>
            </div>

            <div style="background: #f5f5f5; border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin: 24px 0; font-size: 13px; color: #666;">
              <strong style="color: #333;">7-Day Clarity Guarantee:</strong> Not what you expected? Email us within 7 days for a full refund.
              <a href="${appUrl}/contact" style="color: #b8960c; text-decoration: none;"> Contact us.</a>
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

  console.log(`[PURCHASE_EMAIL] Account setup email sent to user ${userId}`);
}

// ── Abandoned subscription checkout recovery ──────────────────────────────────

/**
 * Fires when a subscription expires in `incomplete_expired` state — meaning the
 * customer started checkout (subscription was created in Stripe) but never paid.
 *
 * Sends a single recovery email with a direct link back to checkout so the
 * customer can complete their purchase. Idempotent: called at most once per
 * subscription (only on the incomplete → incomplete_expired transition).
 */
async function sendAbandonedCheckoutEmail(
  userId: string,
  sub: Stripe.Subscription,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, fullName: true },
  });
  if (!user) {
    console.warn(`[ABANDONED_EMAIL] User ${userId} not found — cannot send recovery email`);
    return;
  }

  const isFamilySub  = sub.metadata?.planType === "family";
  const planParam    = isFamilySub ? "family-monthly" : "individual-monthly";
  const source       = sub.metadata?.source      ?? "";
  const promoCode    = sub.metadata?.promoCode   ?? "";
  const utmSource    = sub.metadata?.utmSource   ?? "";
  const utmCampaign  = sub.metadata?.utmCampaign ?? "";
  const utmMedium    = sub.metadata?.utmMedium   ?? "";
  const utmContent   = sub.metadata?.utmContent  ?? "";

  // Build checkout URL that re-applies original source / promo / UTM attribution.
  const { Resend } = await import("resend");
  const resend  = new Resend(process.env.RESEND_API_KEY);
  const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? "https://themuslimman.com";
  const year    = new Date().getFullYear();

  const params = new URLSearchParams({ plan: planParam });
  if (source)      params.set("source",       source);
  if (promoCode)   params.set("promo",        promoCode);
  if (utmSource)   params.set("utm_source",   utmSource);
  if (utmCampaign) params.set("utm_campaign", utmCampaign);
  if (utmMedium)   params.set("utm_medium",   utmMedium);
  if (utmContent)  params.set("utm_content",  utmContent);
  const checkoutUrl = `${appUrl}/checkout?${params.toString()}`;

  const greeting = user.fullName?.trim() || "dear student";
  const planLabel = isFamilySub ? "Family Membership ($9.99/month)" : "Individual Membership ($4.99/month)";

  await resend.emails.send({
    from:    process.env.EMAIL_FROM ?? "TheMuslimMan <noreply@themuslimman.com>",
    to:      user.email,
    subject: "You left before completing your Seerah membership",
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%);padding:30px 20px;text-align:center;border-radius:12px 12px 0 0;">
            <h1 style="color:#f4c542;margin:0 0 8px 0;font-size:22px;">You were almost in.</h1>
            <p style="color:#ccc;margin:0;font-size:15px;">Complete Seerah — ${planLabel}</p>
          </div>
          <div style="background:#fff;padding:40px 30px;border:1px solid #e5e5e5;border-top:none;">
            <p style="font-size:16px;margin:0 0 16px 0;">Assalamu Alaykum ${greeting},</p>
            <p style="font-size:15px;margin:0 0 16px 0;">
              You started signing up for the <strong>Complete Seerah ${planLabel}</strong>,
              but your payment was not completed.
            </p>
            <p style="font-size:15px;margin:0 0 24px 0;">
              Part 1 is still free. If you want to continue after Part 1, your spot is still here.
            </p>
            <div style="text-align:center;margin:32px 0;">
              <a href="${checkoutUrl}" style="display:inline-block;background:#f4c542;color:#1a1a1a;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:700;font-size:16px;">
                Complete My Membership
              </a>
            </div>
            <ul style="font-size:14px;color:#555;padding-left:20px;margin:0 0 24px 0;line-height:1.9;">
              <li>Less than a coffee each month</li>
              <li>Cancel anytime — no commitment</li>
              <li>Instant access after payment</li>
              <li>7-day refund guarantee</li>
            </ul>
            <p style="font-size:13px;color:#aaa;margin:0;">
              Questions? Reply to this email or <a href="${appUrl}/contact" style="color:#b8960c;">contact us here</a>.
            </p>
          </div>
          <div style="background:#f8f9fa;padding:20px;text-align:center;border-radius:0 0 12px 12px;border:1px solid #e5e5e5;border-top:none;">
            <p style="font-size:12px;color:#999;margin:0;">© ${year} TheMuslimMan · Complete Seerah</p>
          </div>
        </body>
      </html>
    `,
  });

  console.log(`[ABANDONED_EMAIL] Recovery email sent to user ${userId} (sub ${sub.id})`);
}
