import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe, isStripeLiveMode } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { generateGiftToken, hashGiftToken, buildClaimUrl, sendGiftClaimEmail } from "@/lib/gift";
import { computeRenewalFailureUpdate } from "@/lib/renewal-failure";
import { decideTrialClaimAction, resolveTrialPriceId, TRIAL_COURSE_KEY } from "@/lib/trial-eligibility";
import Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { nanoid } from "nanoid";
import { hashToken } from "@/lib/hash-token";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// ── Server-side analytics helper ──────────────────────────────────────────────

/**
 * Fire a purchase_completed event from the server after successful payment.
 * Uses the same /api/influencer/track endpoint — no external dependency.
 * Non-blocking: errors are logged but never propagated.
 *
 * No sensitive payment data (card numbers, CVV, full card details) is included.
 */
/**
 * Fire a purchase_completed analytics event from the server after payment confirmation.
 *
 * Idempotency: Before firing, queries the InfluencerEvent table for an existing
 * purchase_completed event with the same orderId stored in the `plan` column.
 * This guards against:
 *   - Stripe webhook retries (same event ID re-delivered)
 *   - Multiple Stripe event types for the same payment (payment_intent.succeeded
 *     AND checkout.session.completed both call handlePaymentSuccess, but the
 *     existingPurchase guard in handlePaymentSuccess means only one will reach here)
 *   - Subscription lifecycle: isFirstActivation is DB-backed in upsertSubscription
 *   - Concurrent processing: DB query races are rare and at worst emit one extra event
 *
 * NOTE: This is NOT called for subscription renewals. Renewals emit subscription_renewed
 * (a separate event) so the funnel represents only initial conversions.
 *
 * No sensitive payment data (card numbers, CVV, expiry, auth tokens) is ever included.
 * Raw Stripe error messages are never forwarded.
 */
async function trackPurchaseCompleted(opts: {
  creator: string;
  orderId: string;
  planId: string;
  planName?: string | null;
  amount: number;
  currency: string;
  /** Application user ID — used as the analytics identifier. Raw email is never sent. */
  userId?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  promoCode?: string | null;
  sessionId?: string | null;
}): Promise<void> {
  try {
    // ── DB-level idempotency guard ────────────────────────────────────────────
    // Use the orderId (PI id or subscription id) stored in `plan` as the dedup key.
    // This survives webhook retries and concurrent delivery of different event types
    // for the same underlying payment.
    const alreadyFired = await prisma.influencerEvent.findFirst({
      where: { eventType: "purchase_completed", plan: opts.orderId },
      select: { id: true },
    });
    if (alreadyFired) {
      console.log(`[WEBHOOK] trackPurchaseCompleted: already fired for ${opts.orderId}, skipping`);
      return;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://themuslimman.com";
    const KNOWN_CREATORS = new Set([
      "browniesaadi", "community", "deenresponds",
      "annarbor", "dearborn", "theorthodoxmuslim",
      "homepage", "korra", "itachi",
    ]);
    const creator = KNOWN_CREATORS.has(opts.creator) ? opts.creator : "homepage";
    const sessionId = opts.sessionId ?? `server_${opts.orderId}`;
    const visitorId = opts.userId ?? `server_${opts.orderId}`;

    const payload = {
      creator,
      eventType: "purchase_completed",
      sessionId,
      // visitorId is the application user ID — this is an internal opaque identifier,
      // not a PII field. Raw email is never included in analytics payloads.
      visitorId,
      route: "/payment/success",
      // orderId stored in `plan` field for idempotency lookups above.
      plan: opts.orderId,
      amount: opts.amount,
      metadata: JSON.stringify({
        order_id: opts.orderId,
        plan_id: opts.planId,
        plan_name: opts.planName,
        amount: opts.amount,
        currency: opts.currency,
        // user_id: application user ID — non-PII analytics identifier
        user_id: opts.userId ?? null,
        utm_source: opts.utmSource,
        utm_medium: opts.utmMedium,
        utm_campaign: opts.utmCampaign,
        utm_content: opts.utmContent,
        promo_code: opts.promoCode,
        source: "stripe_webhook",
      }),
    };

    const res = await fetch(`${appUrl}/api/influencer/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn(`[WEBHOOK] trackPurchaseCompleted: API returned ${res.status} — ${text}`);
    } else {
      console.log(`[WEBHOOK] trackPurchaseCompleted: purchase_completed fired for order ${opts.orderId}`);
    }
  } catch (err) {
    // Non-blocking — analytics must never fail a payment webhook
    console.error("[WEBHOOK] trackPurchaseCompleted: failed (non-blocking):", err);
  }
}

/**
 * Fire subscription_renewed for subsequent billing cycles.
 * Separate from purchase_completed which represents only the initial conversion.
 * Called from syncSubscriptionStatus on invoice.payment_succeeded for renewals.
 */
async function trackSubscriptionRenewed(opts: {
  creator: string;
  subscriptionId: string;
  invoiceId: string;
  planId: string;
  amount: number;
  currency: string;
  userId: string;
}): Promise<void> {
  try {
    // Guard: skip if this invoice's renewal was already recorded.
    const alreadyFired = await prisma.influencerEvent.findFirst({
      where: { eventType: "subscription_renewed", plan: opts.invoiceId },
      select: { id: true },
    });
    if (alreadyFired) return;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://themuslimman.com";
    const KNOWN_CREATORS = new Set([
      "browniesaadi", "community", "deenresponds",
      "annarbor", "dearborn", "theorthodoxmuslim",
      "homepage", "korra", "itachi",
    ]);
    const creator = KNOWN_CREATORS.has(opts.creator) ? opts.creator : "homepage";

    const payload = {
      creator,
      eventType: "subscription_renewed",
      sessionId: `server_renewal_${opts.invoiceId}`,
      visitorId: opts.userId,
      route: "/api/stripe/webhook",
      plan: opts.invoiceId, // idempotency key
      amount: opts.amount,
      metadata: JSON.stringify({
        subscription_id: opts.subscriptionId,
        invoice_id: opts.invoiceId,
        plan_id: opts.planId,
        amount: opts.amount,
        currency: opts.currency,
        source: "stripe_webhook",
      }),
    };

    await fetch(`${appUrl}/api/influencer/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch((err) => console.warn("[WEBHOOK] trackSubscriptionRenewed: fetch failed:", err));
  } catch (err) {
    console.error("[WEBHOOK] trackSubscriptionRenewed: failed (non-blocking):", err);
  }
}

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
        const invoiceSubId = getInvoiceSubscriptionId(invoice);
        console.log(`[WEBHOOK] invoice.payment_succeeded: ${invoice.id}, subscription: ${invoiceSubId}`);
        if (invoiceSubId) {
          await syncSubscriptionStatus(invoiceSubId);
          // Clear failure tracking ONLY when the paid invoice is the same invoice
          // that triggered the failure state. This prevents an unrelated successful
          // invoice (e.g. a manual invoice) from clearing an outstanding renewal failure.
          await prisma.subscription.updateMany({
            where: {
              stripeSubscriptionId: invoiceSubId,
              renewalAttemptCount:  { gt: 0 },
              lastFailedInvoiceId:  invoice.id,   // authoritative: must match the failing invoice
            },
            data: {
              gracePeriodEndsAt:       null,
              renewalAttemptCount:     0,
              lastPaymentFailedAt:     null,
              lastFailedInvoiceId:     null,
              lastFailedStripeEventId: null,
              updatedAt:               new Date(),
            },
          });

          // Fire subscription_renewed for renewal invoices only.
          // First-activation invoices are handled by customer.subscription.created
          // which calls upsertSubscription → purchase_completed via isFirstActivation.
          // We detect renewals by checking if this is NOT the first invoice
          // (billing_reason = "subscription_cycle" for renewals, "subscription_create" for first).
          const billingReason = (invoice as unknown as Record<string, unknown>)["billing_reason"];
          if (billingReason === "subscription_cycle" || billingReason === "subscription_update") {
            const sub = await prisma.subscription.findFirst({
              where: { stripeSubscriptionId: invoiceSubId },
              select: { userId: true, creator: true },
            });
            if (sub?.userId) {
              const invoiceTotal = typeof (invoice as unknown as Record<string, unknown>)["amount_paid"] === "number"
                ? (invoice as unknown as Record<string, unknown>)["amount_paid"] as number
                : 0;
              const invoiceCurrency = typeof (invoice as unknown as Record<string, unknown>)["currency"] === "string"
                ? (invoice as unknown as Record<string, unknown>)["currency"] as string
                : "usd";
              trackSubscriptionRenewed({
                creator: sub.creator ?? "homepage",
                subscriptionId: invoiceSubId,
                invoiceId: invoice.id,
                planId: invoiceSubId,
                amount: invoiceTotal,
                currency: invoiceCurrency,
                userId: sub.userId,
              }).catch(() => {});
            }
          }
        }
        break;
      }

      case "setup_intent.succeeded": {
        // Only the free-trial SetupIntent flow is handled here (metadata.type
        // === "trial_setup", set exclusively by create-trial-intent). Other
        // SetupIntents in this app (e.g. app/api/stripe/payment-methods —
        // "add a saved card" for existing lifetime users) intentionally do
        // NOT set this metadata and are correctly ignored below.
        const setupIntent = event.data.object as Stripe.SetupIntent;
        console.log(`[WEBHOOK] setup_intent.succeeded: ${setupIntent.id}, type: ${setupIntent.metadata?.type ?? "n/a"}`);
        if (setupIntent.metadata?.type === "trial_setup") {
          await handleTrialSetupIntentSucceeded(event.id, event.livemode, setupIntent.id);
        }
        break;
      }

      case "invoice.payment_failed":
      case "invoice.payment_action_required": {
        // payment_action_required = 3DS/SCA authentication needed on renewal.
        // Treat identically to payment_failed: enter grace period, sync status.
        const invoice = event.data.object as Stripe.Invoice;
        const invoiceSubId2 = getInvoiceSubscriptionId(invoice);
        console.error(`[WEBHOOK] ${event.type}: ${invoice.id}, subscription: ${invoiceSubId2}`);
        if (invoiceSubId2) {
          await handleInvoicePaymentFailed(event.id, invoice, invoiceSubId2);
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
  // Card and Link are saveable; redirect-based wallets must not be set as default.
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

// ── Trial subscription provisioning (BLK-02 fix) ─────────────────────────────

/**
 * Handles setup_intent.succeeded for the free-trial flow.
 *
 * This is the ONLY place a trial Stripe subscription is ever created. It
 * replaces the old create-trial-intent behavior of creating the subscription
 * immediately at checkout time (before the SetupIntent was even confirmed),
 * which let a subscription enter Stripe's "trialing" status — and this app's
 * access checks grant access for "trialing" — before any payment method was
 * actually verified. See scripts/fix-trial-user.js for the real production
 * incident this pattern already caused once.
 *
 * Two independent safety mechanisms, neither of which alone is sufficient:
 *
 *  1. Stripe-side idempotency key (`trial-subscription:${setupIntent.id}`) on
 *     stripe.subscriptions.create. This is enforced by Stripe itself, not our
 *     database, so it protects the actual network side effect: two calls with
 *     the same key — whether from a genuine retry after our own DB failure,
 *     or two workers racing on the same event — return the SAME Stripe
 *     subscription object, never two.
 *
 *  2. TrialEligibility DB claim (unique on (userId, courseKey) AND unique on
 *     setupIntentId), claimed BEFORE any Stripe call. This protects against
 *     TWO DIFFERENT SetupIntents for the same user (e.g. two browser tabs)
 *     racing — the Stripe idempotency key above cannot help there, since two
 *     different SetupIntents produce two different idempotency keys. Claiming
 *     is a DB-only operation (no network call), so whichever request loses
 *     the unique-constraint race never reaches stripe.subscriptions.create at
 *     all — no orphaned Stripe object is ever created for the loser.
 *
 * No Stripe network call is ever made while holding a Prisma transaction —
 * the claim (step 2) is DB-only, the subscription is created (step where
 * relevant) OUTSIDE any transaction, and only the final DB write (event dedup
 * + claim completion + Subscription upsert) happens inside a transaction, by
 * which point no further Stripe calls remain for this handler.
 */
async function handleTrialSetupIntentSucceeded(
  stripeEventId: string,
  eventLivemode: boolean,
  setupIntentId: string,
) {
  // ── Fresh retrieval — never trust the webhook payload's snapshot alone ────
  const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);

  if (setupIntent.status !== "succeeded") {
    console.warn(
      `[WEBHOOK] handleTrialSetupIntentSucceeded: SetupIntent ${setupIntentId} status is ` +
      `"${setupIntent.status}" (not succeeded) on fresh retrieval — skipping`
    );
    return;
  }

  // Refuse to process a test-mode event against a live-mode deployment (or
  // vice versa). Nothing in the webhook handled test/live separation
  // explicitly before this check existed. isStripeLiveMode() checks both
  // "sk_live_" and "rk_live_" (restricted key) prefixes — a naive
  // sk_live_-only check would misclassify a live restricted-key deployment
  // as test mode and reject every real production webhook.
  const expectedLive = isStripeLiveMode();
  if (eventLivemode !== expectedLive) {
    throw new Error(
      `[WEBHOOK] handleTrialSetupIntentSucceeded: livemode mismatch for SetupIntent ${setupIntentId} ` +
      `(event livemode=${eventLivemode}, expected=${expectedLive}) — refusing to process`
    );
  }

  const userId = setupIntent.metadata?.userId;
  const planId = setupIntent.metadata?.planId;
  if (!userId || !planId) {
    throw new Error(
      `[WEBHOOK] handleTrialSetupIntentSucceeded: missing userId/planId metadata on SetupIntent ${setupIntentId}`
    );
  }

  const priceId = resolveTrialPriceId(planId);
  if (!priceId) {
    throw new Error(
      `[WEBHOOK] handleTrialSetupIntentSucceeded: unrecognized/unconfigured trial planId "${planId}" on SetupIntent ${setupIntentId}`
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, stripeCustomerId: true },
  });
  if (!user) {
    throw new Error(
      `[WEBHOOK] handleTrialSetupIntentSucceeded: userId ${userId} from SetupIntent ${setupIntentId} metadata does not exist`
    );
  }

  const setupIntentCustomerId =
    typeof setupIntent.customer === "string" ? setupIntent.customer : setupIntent.customer?.id;
  if (!setupIntentCustomerId || setupIntentCustomerId !== user.stripeCustomerId) {
    throw new Error(
      `[WEBHOOK] handleTrialSetupIntentSucceeded: SetupIntent ${setupIntentId} customer ` +
      `(${setupIntentCustomerId ?? "none"}) does not match user ${userId}'s Stripe customer ` +
      `(${user.stripeCustomerId ?? "none"}) — refusing to process`
    );
  }

  const pmId =
    typeof setupIntent.payment_method === "string" ? setupIntent.payment_method : setupIntent.payment_method?.id;
  if (!pmId) {
    throw new Error(
      `[WEBHOOK] handleTrialSetupIntentSucceeded: SetupIntent ${setupIntentId} has no payment_method`
    );
  }

  // ── Claim (DB-only, no network) ───────────────────────────────────────────
  const claim = await claimTrialEligibility(userId, TRIAL_COURSE_KEY, setupIntentId);

  if (claim.action === "claimed_by_other") {
    console.log(
      `[WEBHOOK] handleTrialSetupIntentSucceeded: trial for user ${userId}/${TRIAL_COURSE_KEY} ` +
      `already claimed by a different SetupIntent — no-op for ${setupIntentId} (no Stripe call made)`
    );
    return;
  }

  if (claim.action === "already_completed") {
    // Redelivered/duplicate event referencing a fully-finished claim. Ensure
    // the local row exists (idempotent) but make no new Stripe call.
    if (claim.stripeSubId) {
      const stripeSub = await stripe.subscriptions.retrieve(claim.stripeSubId);
      await finalizeTrialSubscriptionTx(stripeEventId, claim.id, userId, stripeSub);
    }
    return;
  }

  // claim.action is "proceed" (brand-new claim) or "recovered_no_sub_yet"
  // (retry after a prior DB failure) — both continue identically from here,
  // using the SAME deterministic idempotency key so a retry returns the
  // existing Stripe object instead of creating a second one.
  const isFamily = planId === "familyTrial";
  const trialDays = 7;
  const creator   = setupIntent.metadata?.creator   || undefined;
  const promoCode = setupIntent.metadata?.promoCode || undefined;

  let stripeSub: Stripe.Subscription;
  try {
    stripeSub = await stripe.subscriptions.create(
      {
        customer: setupIntentCustomerId,
        items: [{ price: priceId }],
        trial_period_days: trialDays,
        trial_settings: {
          end_behavior: {
            // Cancel immediately when trial ends if no card was saved — matches
            // the pre-existing policy for this trial flow.
            missing_payment_method: "cancel",
          },
        },
        // Card only — Link excluded (see handleTrialFeePayment for the same
        // documented reasoning: Link forces setup_future_usage: off_session,
        // which mismatches this subscription's intent).
        default_payment_method: pmId,
        payment_settings: { payment_method_types: ["card"] },
        metadata: {
          userId,
          planId,
          type: "subscription",
          isTrial: "true",
          trialDays: String(trialDays),
          ...(isFamily ? { planType: "family" } : {}),
          ...(creator   ? { creator }   : {}),
          ...(promoCode ? { promoCode } : {}),
        },
      },
      { idempotencyKey: `trial-subscription:${setupIntentId}` },
    );
  } catch (err) {
    // ── Concurrent idempotency-key collision (retryable) ────────────────────
    // If two workers reach this call at the same instant for the SAME
    // setupIntentId (e.g. two near-simultaneous webhook deliveries that both
    // won a "recovered_no_sub_yet" claim decision — see claimTrialEligibility;
    // this is legitimate, not a bug, since the TrialEligibility claim only
    // protects against DIFFERENT setupIntentIds racing, not redeliveries of
    // the SAME one), Stripe returns HTTP 409 / type "idempotency_error" for
    // whichever request loses the lock on that key (StripeIdempotencyError in
    // the Node SDK). This is explicitly retryable per Stripe's docs — the
    // in-flight request holding the lock will finish and cache its result
    // under this key momentarily.
    //
    // We must NOT swallow this into a no-op: re-throwing here means nothing
    // downstream runs — no StripeWebhookEvent row is written, no
    // TrialEligibility.stripeSubId update, no Subscription upsert — so the
    // claim taken above stays exactly in its "recovered_no_sub_yet" state.
    // The webhook route below returns 500 and Stripe retries the delivery;
    // the retry either observes the OTHER request's now-cached idempotent
    // result (same idempotencyKey → same Stripe subscription, no duplicate),
    // or — in the rare case both are still in flight — hits this same
    // collision again and is retried again by Stripe's own backoff.
    if (err instanceof Stripe.errors.StripeIdempotencyError) {
      console.warn(
        `[WEBHOOK] handleTrialSetupIntentSucceeded: idempotency key trial-subscription:${setupIntentId} ` +
        `is currently in use by a concurrent request (StripeIdempotencyError) — retryable, not treated as a failure`
      );
    }
    throw err;
  }

  console.log(
    `[WEBHOOK] handleTrialSetupIntentSucceeded: Stripe subscription ${stripeSub.id} ` +
    `(status: ${stripeSub.status}) created for user ${userId} via SetupIntent ${setupIntentId}`
  );

  const { isFirstLocalCreation } = await finalizeTrialSubscriptionTx(stripeEventId, claim.id, userId, stripeSub);

  // Welcome email — sent only after the DB transaction commits, and only on
  // the very first successful local subscription creation (not on retries or
  // redelivered events). Resend idempotencyKey is a second, independent
  // safeguard against this exact call somehow firing twice for the same
  // subscription.
  if (isFirstLocalCreation) {
    const planLabel = isFamily ? "Family Trial Access" : "7-Day Trial Access";
    sendTrialWelcomeEmail(userId, planLabel, stripeSub.id).catch((err) =>
      console.error("[WEBHOOK] handleTrialSetupIntentSucceeded: Failed to send welcome email:", err)
    );
  }
}

/**
 * TrialEligibility claim orchestration (Prisma I/O) around the pure decision
 * logic in lib/trial-eligibility.ts. No Stripe calls happen in this function.
 */
async function claimTrialEligibility(
  userId: string,
  courseKey: string,
  setupIntentId: string,
): Promise<{ action: "proceed" | "recovered_no_sub_yet" | "already_completed" | "claimed_by_other"; id: string; stripeSubId: string | null }> {
  const existing = await prisma.trialEligibility.findUnique({
    where: { userId_courseKey: { userId, courseKey } },
  });

  if (!existing) {
    try {
      const created = await prisma.trialEligibility.create({
        data: { id: crypto.randomUUID(), userId, courseKey, setupIntentId },
      });
      return { action: "proceed", id: created.id, stripeSubId: null };
    } catch (err) {
      if (!isUniqueConstraintViolation(err)) throw err;
      // Lost the race between findUnique and create — re-read and fall
      // through to the same decision logic as the "already exists" path.
      const raced = await prisma.trialEligibility.findUnique({ where: { userId_courseKey: { userId, courseKey } } });
      if (!raced) throw err; // should not happen — surface the original error
      const decision = decideTrialClaimAction(raced, setupIntentId);
      return decision!;
    }
  }

  const decision = decideTrialClaimAction(existing, setupIntentId);
  return decision!;
}

/**
 * Short Prisma transaction that finalizes a trial subscription once Stripe
 * has confirmed it exists: inserts the StripeWebhookEvent dedup row, marks
 * the TrialEligibility claim complete (stripeSubId), and upserts the local
 * Subscription row. No Stripe network calls happen inside this transaction —
 * `stripeSub` is passed in already-fetched from the caller.
 *
 * Returns isFirstLocalCreation=true only when THIS call is the one that
 * inserted the Subscription row for the first time — used to gate the
 * welcome email so retries/redeliveries never send it twice.
 */
async function finalizeTrialSubscriptionTx(
  stripeEventId: string,
  trialEligibilityId: string,
  userId: string,
  stripeSub: Stripe.Subscription,
): Promise<{ isFirstLocalCreation: boolean }> {
  const customerId = typeof stripeSub.customer === "string" ? stripeSub.customer : stripeSub.customer?.id ?? "";
  const priceId = stripeSub.items.data[0]?.price?.id ?? "";
  const periods = getSubPeriod(stripeSub);
  const trialEnd = stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null;
  const periodStart = periods?.start ?? new Date();
  const periodEnd = periods?.end ?? trialEnd ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const isFamily = stripeSub.metadata?.planType === "family";
  const subCreator   = stripeSub.metadata?.creator   ?? null;
  const subPromoCode = stripeSub.metadata?.promoCode ?? null;

  return prisma.$transaction(async (tx) => {
    // Layer 1: delivery-level dedup, identical pattern to handleInvoicePaymentFailed.
    try {
      await tx.stripeWebhookEvent.create({
        data: { id: crypto.randomUUID(), stripeEventId, eventType: "setup_intent.succeeded" },
      });
    } catch (err) {
      if (isUniqueConstraintViolation(err)) {
        console.log(
          `[WEBHOOK] finalizeTrialSubscriptionTx: event ${stripeEventId} already recorded — no-op`
        );
        return { isFirstLocalCreation: false };
      }
      throw err;
    }

    // Mark the claim complete — only writes if it is still unclaimed-by-a-sub,
    // so a redelivered event that already completed this claim cannot
    // overwrite stripeSubId with a stale value.
    await tx.trialEligibility.updateMany({
      where: { id: trialEligibilityId, stripeSubId: null },
      data: { stripeSubId: stripeSub.id },
    });

    const existingRow = await tx.subscription.findUnique({
      where: { stripeSubscriptionId: stripeSub.id },
      select: { id: true },
    });

    await tx.subscription.upsert({
      where: { stripeSubscriptionId: stripeSub.id },
      create: {
        id: crypto.randomUUID(),
        updatedAt: new Date(),
        userId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: stripeSub.id,
        stripePriceId: priceId,
        status: stripeSub.status,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        ...(subCreator   ? { creator: subCreator }     : {}),
        ...(subPromoCode ? { promoCode: subPromoCode } : {}),
      },
      update: {
        status: stripeSub.status,
        ...(periods ? { currentPeriodStart: periods.start, currentPeriodEnd: periods.end } : {}),
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        updatedAt: new Date(),
      },
    });

    if (isFamily) {
      await tx.user.update({ where: { id: userId }, data: { planType: "family" } });
    }

    return { isFirstLocalCreation: !existingRow };
  });
}

/**
 * Sends the trial welcome email. Only called from handleTrialSetupIntentSucceeded
 * on the first successful local subscription creation. Uses a Resend
 * idempotencyKey derived from the Stripe subscription ID as a second,
 * independent safeguard against a duplicate send.
 */
async function sendTrialWelcomeEmail(userId: string, planName: string, stripeSubId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, fullName: true, passwordHash: true },
  });
  if (!user) return;

  // Guest checkout users get the "set your password" email instead.
  if (!user.passwordHash) {
    await sendAccountSetupEmail(userId, user.email, user.fullName, planName);
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://themuslimman.com";
  const year = new Date().getFullYear();

  await resend.emails.send(
    {
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
    },
    { idempotencyKey: `trial-welcome/${stripeSubId}` },
  );

  console.log(`[WEBHOOK] sendTrialWelcomeEmail: sent to user ${userId} (sub ${stripeSubId})`);
}

/**
 * Stamps purchasedAt on any SeerahCheckupLead rows matching this email.
 * Called after both one-time lifetime payments and first subscription activations.
 * Idempotent — only updates rows where purchasedAt is still null.
 */
async function markCheckupLeadPurchased(userId: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user?.email) return;
    const result = await prisma.seerahCheckupLead.updateMany({
      where: { email: user.email, purchasedAt: null },
      data:  { purchasedAt: new Date() },
    });
    if (result.count > 0) {
      console.log(`[WEBHOOK] markCheckupLeadPurchased: stamped ${result.count} lead(s) for ${user.email}`);
    }
  } catch (err) {
    // Non-critical: don't let lead stamping fail the payment webhook.
    console.error("[WEBHOOK] markCheckupLeadPurchased: failed (non-blocking):", err);
  }
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

    // Stamp purchasedAt on any quiz funnel leads — non-blocking.
    markCheckupLeadPurchased(userId).catch(() => {});

    // Fire server-side purchase_completed event — only on first processing
    // to avoid duplicate analytics entries on webhook retries.
    if (!existingPurchase) {
      // userId comes from PI metadata — no DB lookup needed for analytics.
      trackPurchaseCompleted({
        creator: paymentIntent.metadata.creator ?? "homepage",
        orderId: paymentIntent.id,
        planId,
        planName: planName ?? null,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        userId,
        utmSource: paymentIntent.metadata.utmSource ?? paymentIntent.metadata.utm_source ?? null,
        utmMedium: paymentIntent.metadata.utmMedium ?? paymentIntent.metadata.utm_medium ?? null,
        utmCampaign: paymentIntent.metadata.utmCampaign ?? paymentIntent.metadata.utm_campaign ?? null,
        utmContent: paymentIntent.metadata.utmContent ?? paymentIntent.metadata.utm_content ?? null,
        promoCode: paymentIntent.metadata.promoCode ?? null,
      }).catch(() => {});
    }

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
  const familyMonthlyPriceId =
    process.env.STRIPE_PRICE_FAMILY_MONTHLY ?? process.env.STRIPE_FAMILY_MONTHLY_PRICE_ID;
  const isFamilySub =
    sub.metadata?.planType === "family" ||
    (!!cancelledPriceId && cancelledPriceId === familyMonthlyPriceId);

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

// ── Renewal failure handling ──────────────────────────────────────────────────

/** True if `err` is a Prisma unique-constraint violation (code P2002). */
function isUniqueConstraintViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

/**
 * Handles invoice.payment_failed / invoice.payment_action_required.
 *
 * Idempotency & concurrency safety (two independent layers):
 *
 *  Layer 1 — delivery dedup via StripeWebhookEvent (unique stripeEventId):
 *    Inserted inside the SAME transaction as the Subscription update. If two
 *    webhook workers race to process the exact same Stripe event ID
 *    concurrently, only one INSERT succeeds — the other hits a unique
 *    constraint violation and returns immediately with NO side effects
 *    (no counters touched, no email, no status sync).
 *
 *  Layer 2 — monotonic attempt tracking via `SELECT ... FOR UPDATE` + the
 *    pure computeRenewalFailureUpdate() decision function (lib/renewal-failure.ts):
 *    Row-locking the Subscription for the duration of the transaction
 *    serializes concurrent DIFFERENT events for the same subscription, and
 *    the decision function guarantees:
 *      - renewalAttemptCount never decreases.
 *      - A same-invoice event with attempt_count <= the stored count
 *        (a delayed/out-of-order redelivery of an older attempt) is ignored.
 *      - gracePeriodEndsAt is anchored to the FIRST failure of a NEW invoice
 *        and never extended on retries of the same invoice.
 *      - The "payment failed" email fires only when isNewInvoice is true.
 *
 * Grace period is only granted for genuine renewals (billing_reason =
 * "subscription_cycle") — checked before the transaction even begins.
 *
 * When retries are exhausted, Stripe transitions the subscription to
 * canceled or unpaid (verified Revenue Recovery behavior — see
 * docs/STRIPE_RENEWAL_FAILURE.md). Neither status matches the past_due +
 * gracePeriodEndsAt branch in hasActiveCourseAccess, so access is denied.
 *
 * ── Post-transaction retry gap (fixed) ────────────────────────────────────
 * An earlier version of this handler called syncSubscriptionStatus() (a
 * Stripe API call + separate `status`/period-column write) AFTER the
 * StripeWebhookEvent + renewal-failure transaction had already committed.
 * If that post-transaction Stripe call failed, the handler threw, Stripe
 * retried the webhook — but the StripeWebhookEvent row for that event ID
 * was already committed, so the retry hit the Layer-1 dedup check and
 * exited as a no-op, silently skipping the status sync forever (relying on
 * a later customer.subscription.updated event to self-heal `status`, which
 * is not guaranteed).
 *
 * Fixed by moving the Stripe fetch to BEFORE the transaction opens, and
 * folding syncSubscriptionStatus's field writes into the SAME transaction
 * as the event-dedup insert and the renewal-failure update:
 *   1. Fetch the live subscription snapshot from Stripe (no DB writes yet —
 *      if this throws, nothing has been touched and Stripe's normal retry
 *      picks it up cleanly, same as any other pre-transaction failure).
 *   2. Open one Prisma transaction: insert the StripeWebhookEvent row, lock
 *      the Subscription row, apply the monotonic renewal-failure fields
 *      (computeRenewalFailureUpdate), AND apply syncSubscriptionStatus's
 *      fields (status, currentPeriodStart/End, cancelAtPeriodEnd) from the
 *      snapshot fetched in step 1 — all in the same atomic write.
 *   3. Commit. No further Stripe network calls happen after this point for
 *      this handler, so there is nothing left that can fail post-commit and
 *      strand a "processed" event with unsynced state.
 *   4. Send the failure email afterward as a best-effort side effect (see
 *      sendPaymentFailedEmail doc comment for delivery semantics).
 *
 * No Stripe network request is ever made while holding the transaction or
 * the row lock — the snapshot is fetched once, up front, and reused.
 *
 * syncSubscriptionStatus() itself writes exactly these fields on the
 * Subscription row: `status`, `currentPeriodStart` + `currentPeriodEnd`
 * (only when Stripe returns real period dates — see getSubPeriod), and
 * `cancelAtPeriodEnd`. All three are preserved here, applied from the same
 * pre-fetched snapshot, inside the transaction.
 */
async function handleInvoicePaymentFailed(
  stripeEventId: string,
  invoice: Stripe.Invoice,
  subscriptionId: string,
) {
  // ── Gate: only handle genuine renewal invoices ────────────────────────────
  const billingReason = (invoice as unknown as Record<string, unknown>)["billing_reason"] as string | undefined;
  if (billingReason !== "subscription_cycle") {
    // subscription_create, manual invoices, subscription_update, etc.
    // These are not renewal failures — do not grant a grace period.
    // Not part of the StripeWebhookEvent dedup table at all, so a failure
    // here is retried by Stripe's normal 500-response mechanism with no
    // false-dedup risk.
    console.log(
      `[WEBHOOK] handleInvoicePaymentFailed: skipping grace for invoice ${invoice.id} ` +
      `(billing_reason=${billingReason ?? "unknown"}, not subscription_cycle)`
    );
    await syncSubscriptionStatus(subscriptionId);
    return;
  }

  const GRACE_DAYS = parseInt(process.env.SUBSCRIPTION_GRACE_PERIOD_DAYS ?? "7", 10);
  const now = new Date();
  const invoiceAttemptCount = (invoice as unknown as Record<string, unknown>)["attempt_count"] as number | undefined ?? 1;

  // Quick existence pre-check (outside the transaction) to preserve the rare
  // "row not created yet" race handling exactly as before. Also not part of
  // the StripeWebhookEvent dedup — safe to simply retry via Stripe's normal
  // 500 mechanism if syncSubscriptionStatus fails here.
  const exists = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
    select: { id: true },
  });
  if (!exists) {
    console.warn(`[WEBHOOK] handleInvoicePaymentFailed: no row for sub ${subscriptionId} — syncing via upsert`);
    await syncSubscriptionStatus(subscriptionId);
    return;
  }

  // ── Fetch the Stripe snapshot BEFORE opening the transaction ──────────────
  // If this throws, we return/throw here — before any StripeWebhookEvent row
  // is committed — so Stripe retries the delivery normally and nothing is
  // left half-applied. No DB transaction or row lock is open during this call.
  let stripeSnapshot: Stripe.Subscription;
  try {
    stripeSnapshot = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["items.data"],
    });
  } catch (err) {
    console.error(
      `[WEBHOOK] handleInvoicePaymentFailed: Stripe snapshot fetch failed for sub ${subscriptionId} — ` +
      `aborting before any DB write so Stripe retries cleanly:`, err
    );
    throw err;
  }
  const periods = getSubPeriod(stripeSnapshot);

  type TxOutcome = {
    applied: boolean;
    isNewInvoice: boolean;
    userId: string;
    gracePeriodEndsAt: Date | null;
  };

  let outcome: TxOutcome;
  try {
    outcome = await prisma.$transaction(async (tx) => {
      // ── Layer 1: delivery-level dedup ───────────────────────────────────
      try {
        await tx.stripeWebhookEvent.create({
          data: { id: crypto.randomUUID(), stripeEventId, eventType: "invoice.payment_failed" },
        });
      } catch (err) {
        if (isUniqueConstraintViolation(err)) {
          console.log(
            `[WEBHOOK] handleInvoicePaymentFailed: event ${stripeEventId} already recorded ` +
            `(duplicate/concurrent delivery) — no-op, no side effects repeated`
          );
          return { applied: false, isNewInvoice: false, userId: "", gracePeriodEndsAt: null };
        }
        throw err;
      }

      // ── Layer 2: lock the row, then apply the monotonic decision ───────
      const rows = await tx.$queryRaw<Array<{
        id: string;
        userId: string;
        lastFailedInvoiceId: string | null;
        renewalAttemptCount: number;
        gracePeriodEndsAt: Date | null;
      }>>`
        SELECT "id", "userId", "lastFailedInvoiceId", "renewalAttemptCount", "gracePeriodEndsAt"
        FROM "Subscription"
        WHERE "stripeSubscriptionId" = ${subscriptionId}
        FOR UPDATE
      `;
      const locked = rows[0];
      if (!locked) {
        // Extremely rare TOCTOU (row deleted between the pre-check and here).
        return { applied: false, isNewInvoice: false, userId: "", gracePeriodEndsAt: null };
      }

      const decision = computeRenewalFailureUpdate(
        {
          lastFailedInvoiceId: locked.lastFailedInvoiceId,
          renewalAttemptCount: locked.renewalAttemptCount,
          gracePeriodEndsAt: locked.gracePeriodEndsAt,
        },
        { invoiceId: invoice.id, attemptCount: invoiceAttemptCount, now, graceDays: GRACE_DAYS },
      );

      if (!decision.shouldApply) {
        console.log(
          `[WEBHOOK] handleInvoicePaymentFailed: ignoring stale/out-of-order event for sub ${subscriptionId} ` +
          `(invoice=${invoice.id} attempt=${invoiceAttemptCount} <= stored=${locked.renewalAttemptCount})`
        );
      }

      // Single atomic write: syncSubscriptionStatus's fields (status/period/
      // cancelAtPeriodEnd) ALWAYS applied from the pre-fetched live snapshot,
      // plus the monotonic renewal-failure fields ONLY when shouldApply.
      // Both land in the same transaction as the StripeWebhookEvent insert —
      // there is no longer a network call, and no separate write, after commit.
      await tx.subscription.update({
        where: { id: locked.id },
        data: {
          status: stripeSnapshot.status,
          ...(periods ? { currentPeriodStart: periods.start, currentPeriodEnd: periods.end } : {}),
          cancelAtPeriodEnd: stripeSnapshot.cancel_at_period_end,
          ...(decision.shouldApply ? {
            renewalAttemptCount: decision.nextRenewalAttemptCount,
            lastPaymentFailedAt: now,
            lastFailedInvoiceId: invoice.id,
            lastFailedStripeEventId: stripeEventId,
            // Only write gracePeriodEndsAt when starting a new grace window.
            ...(decision.isNewInvoice ? { gracePeriodEndsAt: decision.nextGracePeriodEndsAt } : {}),
          } : {}),
          updatedAt: now,
        },
      });

      return {
        applied: true,
        isNewInvoice: decision.shouldApply && decision.isNewInvoice,
        userId: locked.userId,
        gracePeriodEndsAt: decision.shouldApply ? decision.nextGracePeriodEndsAt : locked.gracePeriodEndsAt,
      };
    });
  } catch (err) {
    console.error("[WEBHOOK] handleInvoicePaymentFailed: transaction failed:", err);
    throw err; // let Stripe retry the webhook delivery
  }

  if (!outcome.applied) {
    // Duplicate delivery or TOCTOU row-miss — no side effects, by design.
    return;
  }

  console.log(
    `[WEBHOOK] handleInvoicePaymentFailed: sub=${subscriptionId} invoice=${invoice.id} ` +
    `attempt=${invoiceAttemptCount} event=${stripeEventId} isNewInvoice=${outcome.isNewInvoice} ` +
    `status=${stripeSnapshot.status} gracePeriodEndsAt=${outcome.gracePeriodEndsAt?.toISOString() ?? "unchanged"}`
  );

  // Email on the FIRST event for a new failing invoice only. Best-effort —
  // see sendPaymentFailedEmail doc comment for delivery-semantics rationale.
  if (outcome.isNewInvoice) {
    sendPaymentFailedEmail(outcome.userId, outcome.gracePeriodEndsAt!, invoice.id).catch((err) =>
      console.error("[WEBHOOK] handleInvoicePaymentFailed: Failed to send payment-failed email:", err)
    );
  }
}

/**
 * Sends a "your renewal payment failed — please update your card" email.
 * Only sent on the first failure of a billing cycle (not on each Stripe retry).
 *
 * ── Delivery semantics (documented, not silently assumed) ─────────────────
 * This call is fire-and-forget from handleInvoicePaymentFailed's perspective
 * (`.catch(...)` swallows failures) — the database transaction that recorded
 * the renewal failure has ALREADY committed successfully by the time this
 * runs, and it must stay committed regardless of whether the email provider
 * is reachable. We deliberately do not roll back or retry the DB state based
 * on email outcome — access control, grace-period expiry, and dunning are
 * all driven by the DB fields, not by whether this email was delivered.
 *
 * At the same time, a failed send here is NOT silently treated as delivered:
 * a `console.error` is logged by the caller on failure, so operators can
 * grep logs for missed notifications. There is currently no automatic retry
 * queue for this specific email — if Resend is down for the exact window
 * this fires in, that customer does not get a second attempt at this email
 * (though the /billing page and future Stripe dunning emails still inform
 * them independently).
 *
 * Idempotency: we pass invoiceId as a Resend `idempotencyKey` (format
 * `payment-failed/<invoiceId>` — Resend's SDK supports this as a second
 * argument to `emails.send`, deduplicating identical requests for 24h
 * server-side). This is defense-in-depth, not the primary safeguard — the
 * primary safeguard is that the caller only invokes this function when
 * `isNewInvoice` is true, which (per computeRenewalFailureUpdate) is true
 * at most once per invoice. The idempotency key protects against the case
 * where our own process retries this exact call (e.g. a future code path
 * that reintroduces a retry) sending the same invoice's email twice.
 */
async function sendPaymentFailedEmail(userId: string, gracePeriodEndsAt: Date, invoiceId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, fullName: true },
  });
  if (!user) {
    console.warn(`[PAYMENT_FAILED_EMAIL] User ${userId} not found — cannot send email`);
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://themuslimman.com";
  const year = new Date().getFullYear();
  const greeting = user.fullName?.trim() || "dear student";

  // Format grace period end date in a human-readable way (UTC for simplicity)
  const graceEndStr = gracePeriodEndsAt.toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York",
  });

  await resend.emails.send(
    {
      from: process.env.EMAIL_FROM ?? "TheMuslimMan <noreply@themuslimman.com>",
      to: user.email,
      subject: "Action required: Your Seerah membership payment failed",
      html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%);padding:30px 20px;text-align:center;border-radius:12px 12px 0 0;">
            <h1 style="color:#f4c542;margin:0 0 8px 0;font-size:22px;">Payment failed</h1>
            <p style="color:#ccc;margin:0;font-size:15px;">Action required to keep your access</p>
          </div>
          <div style="background:#fff;padding:40px 30px;border:1px solid #e5e5e5;border-top:none;">
            <p style="font-size:16px;margin:0 0 16px 0;">Assalamu Alaykum ${greeting},</p>
            <p style="font-size:15px;margin:0 0 16px 0;">
              Your most recent monthly payment for <strong>Complete Seerah</strong> was declined.
              We are retrying the charge automatically over the next few days.
            </p>
            <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:16px;margin:20px 0;font-size:14px;color:#856404;">
              <strong>Your access is still active until ${graceEndStr}.</strong><br>
              To keep uninterrupted access, please update your payment method before that date.
            </div>
            <div style="text-align:center;margin:32px 0;">
              <a href="${appUrl}/billing" style="display:inline-block;background:#f4c542;color:#1a1a1a;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:700;font-size:16px;">
                Update Payment Method
              </a>
            </div>
            <p style="font-size:14px;color:#555;margin:0 0 8px 0;">Clicking the button above takes you to your secure Stripe billing portal, where you can update your card or add a new one.</p>
            <p style="font-size:13px;color:#aaa;margin:0;">
              Questions? Reply to this email or <a href="${appUrl}/contact" style="color:#b8960c;">contact support</a>.
            </p>
          </div>
          <div style="background:#f8f9fa;padding:20px;text-align:center;border-radius:0 0 12px 12px;border:1px solid #e5e5e5;border-top:none;">
            <p style="font-size:12px;color:#999;margin:0;">© ${year} TheMuslimMan · Complete Seerah</p>
          </div>
        </body>
      </html>
    `,
    },
    { idempotencyKey: `payment-failed/${invoiceId}` },
  );

  console.log(`[PAYMENT_FAILED_EMAIL] Sent to user ${userId} (grace until ${graceEndStr})`);
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

  // NOTE: We deliberately do NOT clear failure tracking here even when the subscription
  // returns to active/trialing. Webhook delivery is not ordered — a stale
  // customer.subscription.updated (active) could arrive after invoice.payment_failed,
  // silently clearing the grace period. Failure state is only cleared by
  // invoice.payment_succeeded or invoice.paid when the authoritative paid invoice ID
  // matches lastFailedInvoiceId.

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

  // Stamp purchasedAt on quiz funnel leads on first activation — non-blocking.
  if (isFirstActivation) {
    markCheckupLeadPurchased(userId).catch(() => {});

    // Fire server-side purchase_completed for subscription activations.
    // userId is already in scope from paymentIntent.metadata — no DB lookup needed.
    const planLabel = isFamilySub ? "Family Monthly" : "Individual Monthly";
    trackPurchaseCompleted({
      creator: sub.metadata?.creator ?? "homepage",
      orderId: sub.id,
      planId: sub.metadata?.planId ?? (isFamilySub ? "family-monthly" : "individual-monthly"),
      planName: planLabel,
      amount: sub.items.data[0]?.price?.unit_amount ?? 0,
      currency: sub.items.data[0]?.price?.currency ?? "usd",
      userId,
      utmSource: sub.metadata?.utmSource ?? null,
      utmMedium: sub.metadata?.utmMedium ?? null,
      utmCampaign: sub.metadata?.utmCampaign ?? null,
      utmContent: sub.metadata?.utmContent ?? null,
      promoCode: sub.metadata?.promoCode ?? null,
    }).catch(() => {});
  }

  // Send a welcome email the first time a subscription becomes active/trialing.
  // Monthly buyers would otherwise get no confirmation after checkout.
  //
  // Skip for trial subscriptions (isTrial = "true", set by BOTH the current
  // SetupIntent-based trial flow AND the legacy $1-trial-fee PI path): the
  // trial welcome email is exclusively owned by handleTrialSetupIntentSucceeded
  // (current flow, `trial-welcome/${stripeSubId}` idempotency key) or
  // handleTrialFeePayment (legacy path). Neither normal monthly nor family
  // monthly subscriptions ever set isTrial metadata — create-subscription-intent
  // and create-family-subscription-intent don't set it — so this condition
  // narrowly targets trial subs only and never affects the normal paid
  // monthly/family welcome-email path below.
  //
  // isFirstActivation is normally already false by the time this webhook
  // fires for a SetupIntent-based trial, because
  // handleTrialSetupIntentSucceeded's own finalizeTrialSubscriptionTx creates
  // the Subscription row first (see BLK-02 fix). This branch is reached only
  // if customer.subscription.created/updated races ahead of that transaction
  // — harmless for the row itself (the upsert above is idempotent either
  // way), but no email must be sent from here (see comment below).
  const isTrialSub = sub.metadata?.isTrial === "true";
  if (isFirstActivation && !isTrialSub) {
    const planLabel = isFamilySub ? "Family Monthly Access" : "Monthly Access";
    sendPurchaseConfirmationEmail(userId, planLabel).catch((err) =>
      console.error("[WEBHOOK] upsertSubscription: Failed to send subscription welcome email:", err)
    );
    console.log(`[WEBHOOK] upsertSubscription: Welcome email queued for user ${userId} (sub ${sub.id})`);
  } else if (isFirstActivation && isTrialSub) {
    // BLK-02 fix: trial welcome emails are now exclusively owned by
    // handleTrialSetupIntentSucceeded (with its own
    // `trial-welcome/${stripeSubId}` Resend idempotency key). If this branch
    // is reached, customer.subscription.created raced ahead of that
    // handler's own finalizeTrialSubscriptionTx and created the row first —
    // harmless for the row itself (upsert is idempotent either way), but we
    // must NOT send a second, non-deduplicated email from here. There used
    // to be a "fallback" send in this branch; removing it is required so
    // customer.subscription.created can never independently trigger a
    // trial-signup side effect outside the intended (webhook-validated) path.
    console.log(
      `[WEBHOOK] upsertSubscription: trial sub ${sub.id} row created via customer.subscription.created race — ` +
      `welcome email is owned by handleTrialSetupIntentSucceeded, not sent here`
    );
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
    select: { email: true, fullName: true, hasPaid: true },
  });
  if (!user) {
    console.warn(`[ABANDONED_EMAIL] User ${userId} not found — cannot send recovery email`);
    return;
  }

  // Do not send a recovery email if the user has already paid (lifetime purchase)
  // or currently has an active/trialing subscription — they either came back and
  // completed a new checkout session, or the expiry was for a previous attempt
  // while they were actively on the page for a fresh one.
  if (user.hasPaid) {
    console.log(`[ABANDONED_EMAIL] Skipping — user ${userId} already has lifetime access`);
    return;
  }
  const activeSubscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ["active", "trialing", "past_due"] },
      stripeSubscriptionId: { not: sub.id }, // exclude the expiring sub itself
    },
    select: { id: true },
  });
  if (activeSubscription) {
    console.log(`[ABANDONED_EMAIL] Skipping — user ${userId} already has an active subscription`);
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
