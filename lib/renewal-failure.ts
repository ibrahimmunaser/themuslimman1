/**
 * Pure decision logic for processing invoice.payment_failed / payment_action_required
 * events against a Subscription row's failure-tracking state.
 *
 * This module has NO side effects and NO database access — it is the single
 * source of truth for the monotonicity rules enforced by
 * handleInvoicePaymentFailed in app/api/stripe/webhook/route.ts, which calls
 * this function AFTER row-locking the Subscription with `SELECT ... FOR UPDATE`
 * inside a transaction (see that file for the locking/transaction wiring).
 *
 * Extracting the decision as a pure function makes the monotonicity rules
 * exhaustively unit-testable without a real database or a live transaction.
 *
 * Rules enforced:
 *  1. renewalAttemptCount never decreases (Math.max against the stored value).
 *  2. For the SAME invoice, an incoming attempt_count <= the stored count is
 *     ignored entirely (stale/duplicate/out-of-order redelivery) — shouldApply=false.
 *  3. gracePeriodEndsAt is set ONLY when a NEW invoice (new billing cycle) fails
 *     for the first time. It is never extended on retries of the same invoice,
 *     and never touched when shouldApply is false.
 *  4. The "first failure" email should be sent only when isNewInvoice is true
 *     AND shouldApply is true (checked by the caller).
 */

export interface RenewalFailureState {
  /** Invoice ID that most recently triggered a failure update, or null if none yet. */
  lastFailedInvoiceId: string | null;
  /** Stored attempt count synced from Stripe's invoice.attempt_count. */
  renewalAttemptCount: number;
  /** Current grace-period end, or null if not in a grace window. */
  gracePeriodEndsAt: Date | null;
}

export interface RenewalFailureEvent {
  /** The invoice ID from the incoming invoice.payment_failed event. */
  invoiceId: string;
  /** invoice.attempt_count from the incoming event (Stripe's authoritative attempt number). */
  attemptCount: number;
  /** Event-processing timestamp — used to anchor a new grace period. */
  now: Date;
  /** Grace period length in days (SUBSCRIPTION_GRACE_PERIOD_DAYS). */
  graceDays: number;
}

export interface RenewalFailureDecision {
  /** False when the event must be ignored (stale, duplicate, or out-of-order). */
  shouldApply: boolean;
  /** True when this event is the first failure for a NEW invoice (new billing cycle). */
  isNewInvoice: boolean;
  /** The attempt count to persist (only meaningful when shouldApply is true). */
  nextRenewalAttemptCount: number;
  /** The grace period end to persist (only meaningful when shouldApply is true). */
  nextGracePeriodEndsAt: Date | null;
}

export function computeRenewalFailureUpdate(
  state: RenewalFailureState,
  event: RenewalFailureEvent,
): RenewalFailureDecision {
  const isNewInvoice = state.lastFailedInvoiceId !== event.invoiceId;
  const isHigherAttempt = event.attemptCount > state.renewalAttemptCount;

  // Apply when either: (a) a new invoice is failing for the first time, or
  // (b) this is a genuinely later retry attempt on the SAME invoice.
  // Ignore everything else — in particular, a same-invoice event whose
  // attempt_count is <= the stored count is a stale/duplicate/out-of-order
  // delivery and must not touch any state.
  const shouldApply = isNewInvoice || isHigherAttempt;

  if (!shouldApply) {
    return {
      shouldApply: false,
      isNewInvoice: false,
      nextRenewalAttemptCount: state.renewalAttemptCount,
      nextGracePeriodEndsAt: state.gracePeriodEndsAt,
    };
  }

  return {
    shouldApply: true,
    isNewInvoice,
    // Math.max is defense-in-depth for the "never lower" invariant — the
    // shouldApply gate above already guarantees event.attemptCount is not
    // lower than the stored count for the same-invoice case, and a new
    // invoice normally starts at attempt_count=1. Math.max protects against
    // any leftover stale count from an edge case (e.g. a new invoice arriving
    // before the previous cycle's failure state was ever cleared).
    nextRenewalAttemptCount: Math.max(state.renewalAttemptCount, event.attemptCount),
    // Grace period is anchored to the FIRST failure of a NEW invoice only.
    // It is never extended on subsequent retries of the same invoice.
    nextGracePeriodEndsAt: isNewInvoice
      ? new Date(event.now.getTime() + event.graceDays * 24 * 60 * 60 * 1000)
      : state.gracePeriodEndsAt,
  };
}
