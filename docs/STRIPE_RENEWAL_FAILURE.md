# Stripe subscription renewal failure — verified behavior & policy

This document records what was empirically verified against live Stripe data
and account configuration while hardening the renewal-failure handling in
`app/api/stripe/webhook/route.ts` and `lib/access.ts`.

## 1. `currentPeriodEnd` behavior on renewal failure (verified)

Using a real `past_due` subscription in this account
(`sub_1TfEG6ICehG6x31hIJIYMkNt`, customer Yassine Maaroufi):

| Field | Value |
|---|---|
| Stripe `item.current_period_end` | **2026-08-06** |
| DB `currentPeriodEnd` (before this work) | **2026-08-06** — matched Stripe exactly |
| Failing invoice `billing_reason` | `subscription_cycle` |
| Failing invoice `attempt_count` | `1` |

**Conclusion:** Stripe API `2026-04-22.dahlia` advances `current_period_end`
to the next billing date as soon as a renewal invoice is generated —
*before* payment succeeds or fails. The pre-existing access logic (which used
`currentPeriodEnd >= now` for `past_due` rows too) was **not a bug**. It would
have continued granting access for the rest of that billing cycle (~30 days)
while the renewal silently failed and Stripe retried in the background.

The `gracePeriodEndsAt` mechanism introduced in this work is a **deliberate
policy change**, not a bug fix: it intentionally shortens that implicit
~30-day access window down to an explicit, short, configurable grace period
(default 7 days via `SUBSCRIPTION_GRACE_PERIOD_DAYS`).

## 2. Stripe Revenue Recovery final action (NOT verifiable via API)

Point of concern: after Stripe's smart retries are exhausted, does the
subscription end up `canceled` or `unpaid`, or can it be left `past_due`
indefinitely? This matters because `getActiveSubscription`'s checkout guard
blocks new subscriptions while status is `past_due`.

**What was checked:**

- `stripe.accounts.retrieve()` → `account.settings` — does not expose the
  dunning/"Revenue Recovery" final-action setting.
- Direct raw requests to `/v1/billing/settings` and `/v1/account/settings` —
  both returned `Unrecognized request URL`. This configuration is **not
  exposed via the Stripe API at all**; it is Dashboard-only (Settings →
  Billing → Revenue Recovery / "Subscriptions and emails" → "If the last
  invoice fails after all retries, ...").
- `stripe.subscriptions.list({ status: 'unpaid' })` → **0 results**.
- `stripe.subscriptions.list({ status: 'canceled' })` → 16 results, but every
  one has `cancellation_details.reason = "cancellation_requested"` (a
  customer/dashboard-initiated cancellation), **none** show an automatic
  dunning-exhaustion cancellation.

**Conclusion: This could not be empirically verified.** No subscription in
this account has yet completed a full dunning cycle to exhaustion, and the
setting itself is not API-readable.

**Action required (human, one-time):** Confirm in the Stripe Dashboard under
Settings → Billing → Revenue Recovery that the final action for exhausted
subscriptions is set to "Cancel the subscription" or "Mark as unpaid, and
continue attempting to charge" — **not** "leave as past_due".

**Mitigation implemented regardless of that setting:** `getActiveSubscription`
(`lib/access.ts`) now includes a safety-net ceiling
(`STALE_PAST_DUE_CEILING_DAYS`, default 45 days). If a subscription has been
`past_due` for longer than this ceiling — far longer than the 7-day course
access grace period and longer than Stripe's typical retry window
(~3–4 weeks) — the checkout guard stops blocking regardless of Stripe's
dashboard configuration or a missed final webhook. This does **not** change
course access (still governed solely by the unaffected 7-day
`gracePeriodEndsAt` grace policy); it only guarantees a user is never
permanently unable to start a fresh subscription.

## 3. Webhook idempotency & concurrency (hardened)

See `lib/renewal-failure.ts` (pure decision function, unit tested) and
`handleInvoicePaymentFailed` in `app/api/stripe/webhook/route.ts` for the
two-layer idempotency design:

1. **Delivery dedup** — a `StripeWebhookEvent` row (unique `stripeEventId`)
   is inserted inside the same DB transaction as the Subscription update.
   Concurrent or redelivered processing of the exact same Stripe event ID
   is a guaranteed no-op (unique constraint violation on the second attempt).
2. **Monotonic attempt tracking** — the Subscription row is locked with
   `SELECT ... FOR UPDATE` for the duration of the transaction, and
   `computeRenewalFailureUpdate()` guarantees:
   - `renewalAttemptCount` never decreases.
   - A same-invoice event with `attempt_count` ≤ the stored count (a
     delayed/out-of-order redelivery of an older attempt) is ignored.
   - `gracePeriodEndsAt` is anchored to the first failure of a new invoice
     and never extended on retries of the same invoice.
   - The "payment failed" email fires at most once per invoice.
