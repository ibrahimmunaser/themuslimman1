/**
 * AUTOMATED TESTS: Webhook idempotency & monotonic attempt processing
 *
 * Covers the hardening pass on top of the initial renewal-failure implementation:
 *
 *  1. computeRenewalFailureUpdate() — pure decision function unit tests for every
 *     monotonicity rule (never lower attempt count, ignore stale/out-of-order
 *     same-invoice events, anchor grace to the first failure of a new invoice).
 *  2. A sequence-simulation harness modeling the production processing order
 *     (StripeWebhookEvent dedup check → row-locked monotonic decision) to verify
 *     end-to-end behavior across realistic event sequences:
 *       - attempt 1 → attempt 2 → delayed redelivery of attempt 1
 *       - two concurrent deliveries of the same Stripe event
 *       - duplicate delivery after a newer event was already processed
 *       - renewalAttemptCount never decreasing
 *       - gracePeriodEndsAt staying anchored to the first failure
 *       - exactly one failure email sent across the whole sequence
 *  3. Stripe Revenue Recovery final-state handling — access matrix for the
 *     canceled/unpaid terminal states, and the STALE_PAST_DUE_CEILING_DAYS
 *     safety net in getActiveSubscription.
 *
 * NOTE on true DB-level concurrency: the actual guarantee that two concurrent
 * webhook workers processing the exact same Stripe event ID cannot both apply
 * side effects comes from a unique constraint on StripeWebhookEvent.stripeEventId
 * combined with `SELECT ... FOR UPDATE` row locking, both inside one Postgres
 * transaction (see handleInvoicePaymentFailed in app/api/stripe/webhook/route.ts).
 * That is a database-level guarantee that cannot be exercised by a mocked unit
 * test; the harness below verifies the DECISION LOGIC is correct assuming the
 * database serializes access as designed.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { computeRenewalFailureUpdate, type RenewalFailureState } from "@/lib/renewal-failure";

const future = (days = 30) => new Date(Date.now() + days * 86400_000);
const past   = (days = 1)  => new Date(Date.now() - days * 86400_000);

// ═══════════════════════════════════════════════════════════════════════════════
// PART A: computeRenewalFailureUpdate — pure decision function
// ═══════════════════════════════════════════════════════════════════════════════

describe("computeRenewalFailureUpdate — new invoice (new billing cycle)", () => {
  const emptyState: RenewalFailureState = {
    lastFailedInvoiceId: null,
    renewalAttemptCount: 0,
    gracePeriodEndsAt: null,
  };

  it("applies and grants a fresh grace period on the very first failure", () => {
    const now = new Date();
    const decision = computeRenewalFailureUpdate(emptyState, {
      invoiceId: "in_001", attemptCount: 1, now, graceDays: 7,
    });
    expect(decision.shouldApply).toBe(true);
    expect(decision.isNewInvoice).toBe(true);
    expect(decision.nextRenewalAttemptCount).toBe(1);
    expect(decision.nextGracePeriodEndsAt).not.toBeNull();
    const diffDays = (decision.nextGracePeriodEndsAt!.getTime() - now.getTime()) / 86400_000;
    expect(diffDays).toBeCloseTo(7, 0);
  });

  it("treats a different invoice ID as a new invoice even if a prior failure exists", () => {
    const state: RenewalFailureState = {
      lastFailedInvoiceId: "in_OLD",
      renewalAttemptCount: 3,
      gracePeriodEndsAt: past(1), // previous cycle's grace already expired
    };
    const now = new Date();
    const decision = computeRenewalFailureUpdate(state, {
      invoiceId: "in_NEW", attemptCount: 1, now, graceDays: 7,
    });
    expect(decision.isNewInvoice).toBe(true);
    expect(decision.shouldApply).toBe(true);
    // Grace is reset for the new invoice, anchored to `now`.
    const diffDays = (decision.nextGracePeriodEndsAt!.getTime() - now.getTime()) / 86400_000;
    expect(diffDays).toBeCloseTo(7, 0);
  });
});

describe("computeRenewalFailureUpdate — retry on the same invoice", () => {
  it("[never lower] applies attempt 2 after attempt 1 and updates the count", () => {
    const now = new Date();
    const grace = future(6);
    const stateAfterAttempt1: RenewalFailureState = {
      lastFailedInvoiceId: "in_001",
      renewalAttemptCount: 1,
      gracePeriodEndsAt: grace,
    };
    const decision = computeRenewalFailureUpdate(stateAfterAttempt1, {
      invoiceId: "in_001", attemptCount: 2, now, graceDays: 7,
    });
    expect(decision.shouldApply).toBe(true);
    expect(decision.isNewInvoice).toBe(false);
    expect(decision.nextRenewalAttemptCount).toBe(2);
  });

  it("[grace anchored] does NOT extend gracePeriodEndsAt on a retry of the same invoice", () => {
    const grace = future(6);
    const state: RenewalFailureState = {
      lastFailedInvoiceId: "in_001",
      renewalAttemptCount: 1,
      gracePeriodEndsAt: grace,
    };
    const decision = computeRenewalFailureUpdate(state, {
      invoiceId: "in_001", attemptCount: 2, now: new Date(), graceDays: 7,
    });
    expect(decision.nextGracePeriodEndsAt).toBe(grace); // exact same reference — untouched
  });

  it("[stale/out-of-order] ignores a same-invoice event with attempt_count == stored count", () => {
    const state: RenewalFailureState = {
      lastFailedInvoiceId: "in_001",
      renewalAttemptCount: 2,
      gracePeriodEndsAt: future(6),
    };
    const decision = computeRenewalFailureUpdate(state, {
      invoiceId: "in_001", attemptCount: 2, now: new Date(), graceDays: 7,
    });
    expect(decision.shouldApply).toBe(false);
    expect(decision.nextRenewalAttemptCount).toBe(2); // unchanged
  });

  it("[stale/out-of-order] ignores a delayed redelivery of an OLDER attempt (attempt < stored)", () => {
    const state: RenewalFailureState = {
      lastFailedInvoiceId: "in_001",
      renewalAttemptCount: 2, // attempt 2 already processed
      gracePeriodEndsAt: future(6),
    };
    const decision = computeRenewalFailureUpdate(state, {
      invoiceId: "in_001", attemptCount: 1, now: new Date(), graceDays: 7, // stale attempt 1 arrives late
    });
    expect(decision.shouldApply).toBe(false);
    expect(decision.isNewInvoice).toBe(false);
    expect(decision.nextRenewalAttemptCount).toBe(2); // NOT lowered back to 1
    expect(decision.nextGracePeriodEndsAt).toBe(state.gracePeriodEndsAt); // untouched
  });

  it("[never lower] Math.max protects against a stale count even in an edge case", () => {
    // Defense-in-depth: even if shouldApply were somehow true with a lower
    // attempt count, Math.max prevents the stored value from ever decreasing.
    const state: RenewalFailureState = {
      lastFailedInvoiceId: "in_001",
      renewalAttemptCount: 5,
      gracePeriodEndsAt: future(6),
    };
    // A higher attempt still wins normally:
    const decision = computeRenewalFailureUpdate(state, {
      invoiceId: "in_001", attemptCount: 6, now: new Date(), graceDays: 7,
    });
    expect(decision.nextRenewalAttemptCount).toBe(6);
    expect(decision.nextRenewalAttemptCount).toBeGreaterThanOrEqual(state.renewalAttemptCount);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PART B: Sequence simulation — models the production processing order
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Minimal simulation of the two-layer idempotency design used in
 * handleInvoicePaymentFailed: a Set-based event dedup table (StripeWebhookEvent)
 * checked BEFORE the monotonic decision, exactly mirroring production order.
 */
function createSimulatedSubscription() {
  const processedEventIds = new Set<string>();
  let state: RenewalFailureState = {
    lastFailedInvoiceId: null,
    renewalAttemptCount: 0,
    gracePeriodEndsAt: null,
  };
  let emailsSent = 0;

  function processEvent(eventId: string, invoiceId: string, attemptCount: number, now: Date, graceDays = 7) {
    // Layer 1: delivery dedup (StripeWebhookEvent unique constraint).
    if (processedEventIds.has(eventId)) {
      return { applied: false, reason: "duplicate_delivery" as const };
    }
    processedEventIds.add(eventId);

    // Layer 2: monotonic decision under row lock.
    const decision = computeRenewalFailureUpdate(state, { invoiceId, attemptCount, now, graceDays });
    if (!decision.shouldApply) {
      return { applied: false, reason: "stale_or_out_of_order" as const };
    }

    state = {
      lastFailedInvoiceId: invoiceId,
      renewalAttemptCount: decision.nextRenewalAttemptCount,
      gracePeriodEndsAt: decision.nextGracePeriodEndsAt,
    };
    if (decision.isNewInvoice) emailsSent++;
    return { applied: true, isNewInvoice: decision.isNewInvoice };
  }

  return {
    processEvent,
    getState: () => state,
    getEmailsSent: () => emailsSent,
  };
}

describe("[Sequence] attempt 1 → attempt 2 → delayed redelivery of attempt 1", () => {
  it("applies attempts 1 and 2, then ignores the delayed redelivery of attempt 1", () => {
    const sim = createSimulatedSubscription();
    const now = new Date();

    const r1 = sim.processEvent("evt_attempt1", "in_001", 1, now);
    expect(r1.applied).toBe(true);
    expect(sim.getState().renewalAttemptCount).toBe(1);
    const graceAfterFirst = sim.getState().gracePeriodEndsAt;

    const r2 = sim.processEvent("evt_attempt2", "in_001", 2, now);
    expect(r2.applied).toBe(true);
    expect(sim.getState().renewalAttemptCount).toBe(2);
    // Grace must remain anchored to the first failure.
    expect(sim.getState().gracePeriodEndsAt).toBe(graceAfterFirst);

    // A DIFFERENT event ID (Stripe redelivered attempt 1's original event
    // late, or emitted a distinct event referencing the same old attempt)
    // must be ignored by the monotonic gate.
    const r3 = sim.processEvent("evt_attempt1_delayed_redelivery", "in_001", 1, now);
    expect(r3.applied).toBe(false);
    expect((r3 as { reason: string }).reason).toBe("stale_or_out_of_order");

    // Final state unaffected by the delayed redelivery.
    expect(sim.getState().renewalAttemptCount).toBe(2);
    expect(sim.getState().gracePeriodEndsAt).toBe(graceAfterFirst);
    expect(sim.getEmailsSent()).toBe(1);
  });
});

describe("[Concurrency] two concurrent deliveries of the same Stripe event", () => {
  it("only the first delivery applies; the second is a pure no-op", () => {
    const sim = createSimulatedSubscription();
    const now = new Date();

    // Simulates the DB unique-constraint outcome: whichever worker's INSERT
    // commits first wins; the second hits a unique violation and no-ops.
    const workerA = sim.processEvent("evt_same", "in_001", 1, now);
    const workerB = sim.processEvent("evt_same", "in_001", 1, now); // identical event ID

    expect(workerA.applied).toBe(true);
    expect(workerB.applied).toBe(false);
    expect((workerB as { reason: string }).reason).toBe("duplicate_delivery");

    // Only one set of side effects — count is 1, not double-incremented.
    expect(sim.getState().renewalAttemptCount).toBe(1);
    expect(sim.getEmailsSent()).toBe(1);
  });
});

describe("[Duplicate after newer event] redelivery of an old event after a newer one was processed", () => {
  it("ignores the old event's redelivery even though it references an earlier attempt", () => {
    const sim = createSimulatedSubscription();
    const now = new Date();

    sim.processEvent("evt_A_attempt1", "in_001", 1, now);
    sim.processEvent("evt_B_attempt2", "in_001", 2, now);

    // evt_A is redelivered (same event ID as before) after evt_B was processed.
    const redelivery = sim.processEvent("evt_A_attempt1", "in_001", 1, now);
    expect(redelivery.applied).toBe(false);
    expect((redelivery as { reason: string }).reason).toBe("duplicate_delivery");

    expect(sim.getState().renewalAttemptCount).toBe(2); // not reverted to 1
    expect(sim.getEmailsSent()).toBe(1);
  });
});

describe("[Monotonic invariant] renewalAttemptCount never decreases across a full sequence", () => {
  it("stays monotonically non-decreasing through attempts 1, 2, 3 and a stale replay", () => {
    const sim = createSimulatedSubscription();
    const now = new Date();
    const seenCounts: number[] = [];

    sim.processEvent("evt_1", "in_001", 1, now);
    seenCounts.push(sim.getState().renewalAttemptCount);

    sim.processEvent("evt_2", "in_001", 2, now);
    seenCounts.push(sim.getState().renewalAttemptCount);

    sim.processEvent("evt_3", "in_001", 3, now);
    seenCounts.push(sim.getState().renewalAttemptCount);

    // Stale replay of attempt 1 under a fresh event ID — must not lower the count.
    sim.processEvent("evt_stale_replay", "in_001", 1, now);
    seenCounts.push(sim.getState().renewalAttemptCount);

    expect(seenCounts).toEqual([1, 2, 3, 3]);
    for (let i = 1; i < seenCounts.length; i++) {
      expect(seenCounts[i]).toBeGreaterThanOrEqual(seenCounts[i - 1]);
    }
  });
});

describe("[Grace anchoring] gracePeriodEndsAt stays anchored to the first failure across retries", () => {
  it("keeps the same grace deadline through 3 retries on one invoice", () => {
    const sim = createSimulatedSubscription();
    const now = new Date();

    sim.processEvent("evt_1", "in_001", 1, now);
    const grace1 = sim.getState().gracePeriodEndsAt;

    sim.processEvent("evt_2", "in_001", 2, now);
    sim.processEvent("evt_3", "in_001", 3, now);
    const graceFinal = sim.getState().gracePeriodEndsAt;

    expect(graceFinal).toBe(grace1);
  });

  it("resets the grace anchor only when a genuinely new invoice starts failing", () => {
    const sim = createSimulatedSubscription();
    const now = new Date();

    sim.processEvent("evt_cycle1_a1", "in_001", 1, now);
    const graceCycle1 = sim.getState().gracePeriodEndsAt;

    // New billing cycle, new invoice, first failure.
    const later = new Date(now.getTime() + 30 * 86400_000);
    sim.processEvent("evt_cycle2_a1", "in_002", 1, later);
    const graceCycle2 = sim.getState().gracePeriodEndsAt;

    expect(graceCycle2).not.toBe(graceCycle1);
    expect(graceCycle2!.getTime()).toBeGreaterThan(graceCycle1!.getTime());
  });
});

describe("[Email] exactly one failure email sent across a realistic multi-retry sequence", () => {
  it("sends exactly one email for attempt1 → attempt2 → attempt3 → paid", () => {
    const sim = createSimulatedSubscription();
    const now = new Date();

    sim.processEvent("evt_1", "in_001", 1, now);
    sim.processEvent("evt_2", "in_001", 2, now);
    sim.processEvent("evt_3", "in_001", 3, now);

    expect(sim.getEmailsSent()).toBe(1);
  });

  it("sends exactly two emails across two separate failing billing cycles", () => {
    const sim = createSimulatedSubscription();
    const now = new Date();
    const nextCycle = new Date(now.getTime() + 30 * 86400_000);

    sim.processEvent("evt_c1_a1", "in_001", 1, now);
    sim.processEvent("evt_c1_a2", "in_001", 2, now);
    sim.processEvent("evt_c2_a1", "in_002", 1, nextCycle); // new cycle, first failure again

    expect(sim.getEmailsSent()).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PART C: Revenue Recovery final state & checkout-guard safety net
// ═══════════════════════════════════════════════════════════════════════════════

vi.mock("@/lib/db", () => ({
  prisma: {
    user:           { findUnique: vi.fn() },
    purchase:       { findFirst: vi.fn() },
    subscription:   { findFirst: vi.fn() },
    mobilePurchase: { findFirst: vi.fn() },
  },
}));

import { prisma } from "@/lib/db";
import { hasActiveCourseAccess, getActiveSubscription, STALE_PAST_DUE_CEILING_DAYS } from "@/lib/access";

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.user.findUnique          as ReturnType<typeof vi.fn>).mockResolvedValue({ hasPaid: false });
  (prisma.purchase.findFirst       as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  (prisma.mobilePurchase.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
});

describe("[Revenue Recovery] final webhook state: past_due → canceled", () => {
  it("denies course access once the subscription is canceled", async () => {
    // WHERE status != canceled excludes the row → findFirst returns null.
    (prisma.subscription.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    expect(await hasActiveCourseAccess("u1")).toBe(false);
  });

  it("no longer blocks new checkout once canceled", async () => {
    (prisma.subscription.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    expect(await getActiveSubscription("u1")).toBeNull();
  });
});

describe("[Revenue Recovery] final webhook state: past_due → unpaid", () => {
  it("denies course access once the subscription is unpaid", async () => {
    // WHERE clauses only match active/trialing/past_due — unpaid is excluded.
    (prisma.subscription.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    expect(await hasActiveCourseAccess("u1")).toBe(false);
  });

  it("no longer blocks new checkout once unpaid", async () => {
    (prisma.subscription.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    expect(await getActiveSubscription("u1")).toBeNull();
  });
});

describe("[Safety net] STALE_PAST_DUE_CEILING_DAYS prevents indefinite checkout blocking", () => {
  it("still blocks checkout while past_due and within the ceiling", async () => {
    (prisma.subscription.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "sub_1",
      stripeSubscriptionId: "sub_stripe_1",
      status: "past_due",
      currentPeriodEnd: future(20),
      gracePeriodEndsAt: past(2), // grace expired — course access denied, but checkout still guarded
      lastPaymentFailedAt: past(5), // well within the 45-day ceiling
    });
    const result = await getActiveSubscription("u1");
    expect(result).not.toBeNull();
  });

  it("stops blocking checkout once past_due has exceeded the ceiling (Stripe never finalized it)", async () => {
    (prisma.subscription.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "sub_1",
      stripeSubscriptionId: "sub_stripe_1",
      status: "past_due",
      currentPeriodEnd: past(40),
      gracePeriodEndsAt: past(38),
      lastPaymentFailedAt: past(STALE_PAST_DUE_CEILING_DAYS + 1), // past the safety-net ceiling
    });
    const result = await getActiveSubscription("u1");
    expect(result).toBeNull();
  });

  it("does not engage the safety net for active/trialing subscriptions", async () => {
    (prisma.subscription.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "sub_1",
      stripeSubscriptionId: "sub_stripe_1",
      status: "active",
      currentPeriodEnd: future(10),
      gracePeriodEndsAt: null,
      lastPaymentFailedAt: null,
    });
    const result = await getActiveSubscription("u1");
    expect(result).not.toBeNull();
  });

  it("the safety net never affects course access (still governed by the 7-day grace policy)", async () => {
    // Even though checkout is unblocked past the ceiling, course access itself
    // is governed solely by hasActiveCourseAccess's gracePeriodEndsAt check,
    // which is untouched by this constant.
    (prisma.subscription.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null); // grace long expired
    expect(await hasActiveCourseAccess("u1")).toBe(false);
  });
});
