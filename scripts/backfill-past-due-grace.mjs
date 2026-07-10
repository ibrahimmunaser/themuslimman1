/**
 * Deployment backfill: set gracePeriodEndsAt for existing past_due subscriptions.
 *
 * Run this AFTER both migrations are applied:
 *   - prisma/migrations/20260706_subscription_renewal_failure.sql
 *   - prisma/migrations/20260706b_stripe_webhook_event_idempotency.sql
 * ...but BEFORE deploying the new application code (which requires
 * gracePeriodEndsAt to be set for access).
 *
 * For each past_due subscription in the DB:
 *  1. Fetch the latest invoice from Stripe.
 *  2. If billing_reason = "subscription_cycle" AND invoice is not paid:
 *     a. Find the most recent invoice.payment_failed Stripe event to get the
 *        real failure timestamp.
 *     b. Set gracePeriodEndsAt = failedAt + GRACE_DAYS (from env or default 7).
 *     c. Set renewalAttemptCount = invoice.attempt_count.
 *     d. Set lastFailedInvoiceId = invoice.id.
 *     e. Set lastPaymentFailedAt = failedAt.
 *  3. Otherwise: log and skip (not a renewal failure).
 *
 * Safe to re-run: uses WHERE gracePeriodEndsAt IS NULL to avoid overwriting
 * rows already backfilled or already processed by a live webhook.
 *
 * Usage:
 *   node scripts/backfill-past-due-grace.mjs [--dry-run]
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const DRY_RUN  = process.argv.includes('--dry-run');
const GRACE_DAYS = parseInt(process.env.SUBSCRIPTION_GRACE_PERIOD_DAYS ?? '7', 10);

console.log(`[BACKFILL] Starting. GRACE_DAYS=${GRACE_DAYS} DRY_RUN=${DRY_RUN}`);

async function run() {
  // Find all past_due subscriptions that have no grace period set yet.
  const pastDueSubs = await prisma.subscription.findMany({
    where: {
      status: 'past_due',
      gracePeriodEndsAt: null,
    },
    select: {
      id: true,
      stripeSubscriptionId: true,
      userId: true,
      currentPeriodEnd: true,
      lastFailedInvoiceId: true,
    },
  });

  console.log(`[BACKFILL] Found ${pastDueSubs.length} past_due subscription(s) with no grace period.`);

  let backfilled = 0;
  let skipped    = 0;
  let errors     = 0;

  for (const sub of pastDueSubs) {
    const label = `sub=${sub.stripeSubscriptionId}`;
    try {
      // Fetch the subscription from Stripe to get the latest invoice.
      const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId, {
        expand: ['latest_invoice'],
      });

      const inv = stripeSub.latest_invoice;
      if (!inv || typeof inv !== 'object') {
        console.warn(`[BACKFILL] ${label}: no expanded invoice — skipping`);
        skipped++;
        continue;
      }

      const billingReason = inv.billing_reason;
      if (billingReason !== 'subscription_cycle') {
        console.log(`[BACKFILL] ${label}: billing_reason=${billingReason} — not a renewal failure, skipping`);
        skipped++;
        continue;
      }

      if (inv.status === 'paid') {
        console.log(`[BACKFILL] ${label}: latest invoice is paid — no grace needed, skipping`);
        skipped++;
        continue;
      }

      // Find the real failure timestamp from Stripe events.
      let failedAt = new Date();
      const events = await stripe.events.list({
        type: 'invoice.payment_failed',
        limit: 5,
      });
      // Find event for this invoice (events.list by related_object is not available for invoice
      // events in all API versions, so we filter manually from the recent list).
      const matchingEvent = events.data.find(
        (ev) => (ev.data.object).id === inv.id
      );
      if (matchingEvent) {
        failedAt = new Date(matchingEvent.created * 1000);
        console.log(`[BACKFILL] ${label}: found payment_failed event ${matchingEvent.id} at ${failedAt.toISOString()}`);
      } else {
        // Fall back to invoice's due_date or created timestamp.
        const fallbackTs = inv.due_date ?? inv.created;
        failedAt = new Date(fallbackTs * 1000);
        console.warn(`[BACKFILL] ${label}: no matching event found — using invoice timestamp ${failedAt.toISOString()} as failure time`);
      }

      const gracePeriodEndsAt = new Date(failedAt.getTime() + GRACE_DAYS * 86400_000);
      const attemptCount      = inv.attempt_count ?? 1;
      const eventId           = matchingEvent?.id ?? null;
      const graceExpired      = gracePeriodEndsAt.getTime() < Date.now();

      console.log(
        `[BACKFILL] ${label}: stripeStatus=${stripeSub.status} ` +
        `existingCurrentPeriodEnd=${sub.currentPeriodEnd?.toISOString() ?? 'null'} ` +
        `invoice=${inv.id} attempt=${attemptCount} ` +
        `failedAt=${failedAt.toISOString()} gracePeriodEndsAt=${gracePeriodEndsAt.toISOString()} ` +
        `graceStatus=${graceExpired ? 'EXPIRED' : 'still active'}`
      );

      // Built once so the logged preview and the actual write (if any) can never
      // drift from each other — the dry-run output below is the literal object
      // that would be passed to prisma.subscription.update({ data: ... }).
      const updateData = {
        gracePeriodEndsAt,
        renewalAttemptCount:      attemptCount,
        lastPaymentFailedAt:      failedAt,
        lastFailedInvoiceId:      inv.id,
        ...(eventId ? { lastFailedStripeEventId: eventId } : {}),
        updatedAt:                new Date(),
      };

      console.log(
        `[BACKFILL] ${label}: proposed five-field update = ${JSON.stringify(updateData, null, 2)}`
      );

      if (!DRY_RUN) {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: updateData,
        });
      }

      console.log(`[BACKFILL] ${label}: ✓ ${DRY_RUN ? '(dry-run, not written)' : 'updated'}`);
      backfilled++;
    } catch (err) {
      console.error(`[BACKFILL] ${label}: ERROR — ${err.message}`);
      errors++;
    }
  }

  console.log(
    `\n[BACKFILL] Done. backfilled=${backfilled} skipped=${skipped} errors=${errors}`
  );

  if (errors > 0) {
    process.exit(1);
  }
}

run().catch((e) => {
  console.error('[BACKFILL] Fatal error:', e.message);
  process.exit(1);
}).finally(() => prisma.$disconnect());
