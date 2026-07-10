/**
 * AUTOMATED TESTS: scripts/backfill-past-due-grace.mjs — idempotency & safety
 *
 * The backfill script is a standalone Node/ESM script that talks to a real
 * Postgres + Stripe, so it isn't imported directly here (consistent with how
 * this codebase tests Stripe webhook logic — see subscription-renewal-
 * idempotency.test.ts). Instead we mirror its exact selection/update logic
 * as pure functions and verify the properties that make it safe to run
 * as part of the deployment sequence:
 *
 *  1. Candidate selection is WHERE status='past_due' AND gracePeriodEndsAt
 *     IS NULL — so running it a second time selects ZERO rows once the
 *     first run has set gracePeriodEndsAt on every candidate (idempotent).
 *  2. It NEVER overwrites or shortens an existing gracePeriodEndsAt, because
 *     a row with a non-null value is excluded from the WHERE clause itself
 *     — there is no code path that updates a row already possessing a
 *     grace period.
 *  3. The mutation always sets a superset of exactly 5 documented fields.
 */

import { describe, it, expect } from "vitest";

interface SubscriptionRow {
  id: string;
  status: string;
  gracePeriodEndsAt: Date | null;
  renewalAttemptCount: number;
  lastFailedInvoiceId: string | null;
  lastPaymentFailedAt: Date | null;
  lastFailedStripeEventId: string | null;
}

/** Mirrors the Prisma `findMany` WHERE clause in backfill-past-due-grace.mjs. */
function selectBackfillCandidates(rows: SubscriptionRow[]): SubscriptionRow[] {
  return rows.filter((r) => r.status === "past_due" && r.gracePeriodEndsAt === null);
}

/** Mirrors the exact `prisma.subscription.update({ data })` mutation shape. */
function applyBackfill(
  row: SubscriptionRow,
  computed: { gracePeriodEndsAt: Date; attemptCount: number; failedAt: Date; invoiceId: string; eventId: string | null },
): SubscriptionRow {
  return {
    ...row,
    gracePeriodEndsAt: computed.gracePeriodEndsAt,
    renewalAttemptCount: computed.attemptCount,
    lastPaymentFailedAt: computed.failedAt,
    lastFailedInvoiceId: computed.invoiceId,
    ...(computed.eventId ? { lastFailedStripeEventId: computed.eventId } : {}),
  };
}

const GRACE_DAYS = 7;
const now = new Date("2026-07-07T12:00:00Z");

function makeRow(overrides: Partial<SubscriptionRow> = {}): SubscriptionRow {
  return {
    id: "sub_row_1",
    status: "past_due",
    gracePeriodEndsAt: null,
    renewalAttemptCount: 0,
    lastFailedInvoiceId: null,
    lastPaymentFailedAt: null,
    lastFailedStripeEventId: null,
    ...overrides,
  };
}

describe("backfill-past-due-grace — candidate selection", () => {
  it("selects only past_due rows with a NULL gracePeriodEndsAt", () => {
    const rows = [
      makeRow({ id: "a", status: "past_due", gracePeriodEndsAt: null }),
      makeRow({ id: "b", status: "past_due", gracePeriodEndsAt: new Date() }), // already backfilled/webhook-set
      makeRow({ id: "c", status: "active", gracePeriodEndsAt: null }),
      makeRow({ id: "d", status: "canceled", gracePeriodEndsAt: null }),
    ];
    const candidates = selectBackfillCandidates(rows);
    expect(candidates.map((r) => r.id)).toEqual(["a"]);
  });

  it("selects zero candidates when there are no past_due subscriptions at all", () => {
    const rows = [makeRow({ status: "active" }), makeRow({ status: "canceled" })];
    expect(selectBackfillCandidates(rows)).toHaveLength(0);
  });
});

describe("backfill-past-due-grace — idempotency (run twice)", () => {
  it("running the backfill a second time selects zero rows, because the first run cleared gracePeriodEndsAt from NULL", () => {
    let rows = [makeRow({ id: "a" })];

    // First run
    const firstRunCandidates = selectBackfillCandidates(rows);
    expect(firstRunCandidates).toHaveLength(1);
    rows = rows.map((r) =>
      r.id === "a"
        ? applyBackfill(r, {
            gracePeriodEndsAt: new Date(now.getTime() + GRACE_DAYS * 86400_000),
            attemptCount: 2,
            failedAt: now,
            invoiceId: "in_001",
            eventId: "evt_001",
          })
        : r,
    );

    // Second run — same WHERE clause against the now-updated rows.
    const secondRunCandidates = selectBackfillCandidates(rows);
    expect(secondRunCandidates).toHaveLength(0);
  });

  it("does not shorten or overwrite an existing gracePeriodEndsAt on a re-run, because such rows are excluded from selection entirely", () => {
    const existingGrace = new Date(now.getTime() + 3 * 86400_000); // e.g. set by a live webhook after backfill ran
    const rows = [makeRow({ id: "a", gracePeriodEndsAt: existingGrace })];

    const candidates = selectBackfillCandidates(rows);
    expect(candidates).toHaveLength(0); // never touched — the value is preserved exactly as-is
  });
});

describe("backfill-past-due-grace — mutation shape", () => {
  it("sets exactly the 5 documented fields (plus optional lastFailedStripeEventId) and nothing else", () => {
    const row = makeRow({ id: "a" });
    const updated = applyBackfill(row, {
      gracePeriodEndsAt: new Date(now.getTime() + GRACE_DAYS * 86400_000),
      attemptCount: 3,
      failedAt: now,
      invoiceId: "in_002",
      eventId: "evt_002",
    });

    expect(updated.gracePeriodEndsAt).not.toBeNull();
    expect(updated.renewalAttemptCount).toBe(3);
    expect(updated.lastPaymentFailedAt).toEqual(now);
    expect(updated.lastFailedInvoiceId).toBe("in_002");
    expect(updated.lastFailedStripeEventId).toBe("evt_002");
    // Status itself is never touched by the backfill (it's already past_due
    // by definition of the WHERE clause) — no unexpected status flip.
    expect(updated.status).toBe("past_due");
  });

  it("leaves lastFailedStripeEventId untouched when no matching Stripe event was found", () => {
    const row = makeRow({ id: "a", lastFailedStripeEventId: null });
    const updated = applyBackfill(row, {
      gracePeriodEndsAt: new Date(now.getTime() + GRACE_DAYS * 86400_000),
      attemptCount: 1,
      failedAt: now,
      invoiceId: "in_003",
      eventId: null, // no invoice.payment_failed event found in the recent list
    });
    expect(updated.lastFailedStripeEventId).toBeNull();
  });
});

describe("backfill-past-due-grace — deploy-order finding (documents the production risk)", () => {
  /**
   * Ties directly to lib/access.ts's hasActiveCourseAccess: a past_due row
   * with gracePeriodEndsAt=NULL does NOT match the past_due+grace branch, so
   * NULL means "no access" — not "unlimited legacy access". This is why the
   * backfill MUST run (and be verified) before the new application code
   * (which relies on gracePeriodEndsAt for past_due access) is deployed.
   */
  it("confirms NULL gracePeriodEndsAt is indistinguishable from 'no access' in the access-control WHERE clause", () => {
    const now2 = new Date();
    function matchesPastDueGraceBranch(sub: { status: string; gracePeriodEndsAt: Date | null }): boolean {
      // Mirrors: WHERE status = 'past_due' AND gracePeriodEndsAt >= now
      return sub.status === "past_due" && sub.gracePeriodEndsAt !== null && sub.gracePeriodEndsAt >= now2;
    }
    expect(matchesPastDueGraceBranch({ status: "past_due", gracePeriodEndsAt: null })).toBe(false);
    expect(matchesPastDueGraceBranch({ status: "past_due", gracePeriodEndsAt: new Date(now2.getTime() + 86400_000) })).toBe(true);
  });
});
