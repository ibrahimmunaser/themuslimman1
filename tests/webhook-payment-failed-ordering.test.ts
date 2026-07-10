/**
 * AUTOMATED TESTS: handleInvoicePaymentFailed — post-transaction retry-gap fix
 *
 * Covers the ordering fix requested for deployment: previously,
 * syncSubscriptionStatus(subscriptionId) (a Stripe network call + separate DB
 * write) ran AFTER the StripeWebhookEvent + renewal-failure transaction had
 * already committed. If that post-commit Stripe call failed, Stripe would
 * retry the webhook, but the already-committed stripeEventId caused the
 * retry to be discarded as a duplicate by Layer-1 dedup — silently losing
 * the status sync with no automatic recovery beyond an unrelated
 * customer.subscription.updated event eventually arriving.
 *
 * The fix restructures the handler to:
 *   1. Fetch the live Stripe subscription snapshot BEFORE opening the
 *      Prisma transaction. A failure here throws before any DB write, so
 *      Stripe's normal retry picks it up cleanly.
 *   2. Apply syncSubscriptionStatus's fields (status, currentPeriodStart/End,
 *      cancelAtPeriodEnd) in the SAME transaction/SAME update() call as the
 *      StripeWebhookEvent insert and the monotonic renewal-failure fields.
 *   3. No Stripe network call happens after the transaction commits for this
 *      handler — so nothing can fail post-commit and strand a "processed"
 *      event with stale status.
 *
 * Two complementary layers of testing:
 *   A. A control-flow harness that mirrors the real implementation's ordering
 *      and atomicity (reusing the REAL computeRenewalFailureUpdate pure
 *      function from lib/renewal-failure.ts) to prove the retry-safety
 *      properties end-to-end without needing a live Postgres/Stripe.
 *   B. Structural regression assertions against the actual route.ts source,
 *      so a future edit that reintroduces the bug (e.g. moving the Stripe
 *      fetch back after the transaction, or splitting the update back into
 *      two writes) fails this test suite even if the harness in (A) still
 *      passes because it wasn't updated to match.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { computeRenewalFailureUpdate } from "@/lib/renewal-failure";

// ═══════════════════════════════════════════════════════════════════════════════
// PART A: Control-flow harness mirroring the fixed handleInvoicePaymentFailed
// ═══════════════════════════════════════════════════════════════════════════════

interface SubRow {
  userId: string;
  lastFailedInvoiceId: string | null;
  renewalAttemptCount: number;
  gracePeriodEndsAt: Date | null;
  status: string;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

interface StripeSnapshot {
  status: string;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

class FakeDb {
  webhookEventIds: Set<string>;
  sub: SubRow;
  constructor(sub: SubRow) {
    this.webhookEventIds = new Set();
    this.sub = { ...sub };
  }
}

interface SimulateResult {
  applied: boolean;
  isNewInvoice: boolean;
  emailCount: number;
  /** Every tx.subscription.update({ data }) call made during a successful commit. */
  updateCalls: Array<Record<string, unknown>>;
}

/**
 * Mirrors the fixed handleInvoicePaymentFailed control flow:
 *   fetchSnapshot() [outside any transaction]
 *   → one atomic unit: dedup insert + row read + single combined update
 *   → commit or fully discard (rollback) as one unit
 *   → email only on isNewInvoice, only after a successful commit
 */
async function simulateHandleInvoicePaymentFailed(
  db: FakeDb,
  event: { stripeEventId: string; invoiceId: string; attemptCount: number; now: Date; graceDays: number },
  fetchSnapshot: () => Promise<StripeSnapshot>,
  opts: { throwDuringTransaction?: boolean } = {},
): Promise<SimulateResult> {
  // Step 1 — network call happens BEFORE any transaction/lock is opened.
  // A throw here propagates immediately; db is untouched.
  const snapshot = await fetchSnapshot();

  // Step 2 — one atomic transaction. We stage all changes and only apply
  // them to `db` if the whole callback succeeds, exactly like a real
  // Postgres transaction's commit-or-rollback-as-one-unit semantics.
  const staged = {
    webhookEventIds: new Set(db.webhookEventIds),
    sub: { ...db.sub },
  };

  if (staged.webhookEventIds.has(event.stripeEventId)) {
    // Layer 1 dedup (unique constraint violation equivalent) — no-op.
    return { applied: false, isNewInvoice: false, emailCount: 0, updateCalls: [] };
  }

  const updateCalls: Array<Record<string, unknown>> = [];
  let isNewInvoice = false;

  // Everything below happens "inside the transaction" — if it throws, NONE
  // of it is committed (including the event-id insert simulated below).
  staged.webhookEventIds.add(event.stripeEventId);

  const decision = computeRenewalFailureUpdate(
    {
      lastFailedInvoiceId: staged.sub.lastFailedInvoiceId,
      renewalAttemptCount: staged.sub.renewalAttemptCount,
      gracePeriodEndsAt: staged.sub.gracePeriodEndsAt,
    },
    { invoiceId: event.invoiceId, attemptCount: event.attemptCount, now: event.now, graceDays: event.graceDays },
  );

  // Single combined write: syncSubscriptionStatus's fields ALWAYS included,
  // renewal-failure fields only when the decision says to apply them.
  const updateData: Record<string, unknown> = {
    status: snapshot.status,
    currentPeriodEnd: snapshot.currentPeriodEnd,
    cancelAtPeriodEnd: snapshot.cancelAtPeriodEnd,
    ...(decision.shouldApply
      ? {
          renewalAttemptCount: decision.nextRenewalAttemptCount,
          lastPaymentFailedAt: event.now,
          lastFailedInvoiceId: event.invoiceId,
          ...(decision.isNewInvoice ? { gracePeriodEndsAt: decision.nextGracePeriodEndsAt } : {}),
        }
      : {}),
  };
  updateCalls.push(updateData);

  if (opts.throwDuringTransaction) {
    // Simulates any failure between the event-insert and commit (e.g. a
    // constraint error, connection drop). The whole transaction rolls back —
    // staged is discarded, `db` is never mutated, and the event ID is NOT
    // persisted (so a retry is NOT treated as a duplicate).
    throw new Error("simulated failure inside the transaction, before commit");
  }

  staged.sub = { ...staged.sub, ...updateData } as SubRow;
  isNewInvoice = decision.shouldApply && decision.isNewInvoice;

  // Commit — apply staged state to the real db as one atomic swap.
  db.webhookEventIds = staged.webhookEventIds;
  db.sub = staged.sub;

  return {
    applied: true,
    isNewInvoice,
    emailCount: isNewInvoice ? 1 : 0,
    updateCalls,
  };
}

const baseSub: SubRow = {
  userId: "user_1",
  lastFailedInvoiceId: null,
  renewalAttemptCount: 0,
  gracePeriodEndsAt: null,
  status: "active",
  currentPeriodEnd: new Date("2026-01-01T00:00:00Z"),
  cancelAtPeriodEnd: false,
};

const snapshotOk = (): Promise<StripeSnapshot> =>
  Promise.resolve({ status: "past_due", currentPeriodEnd: new Date("2026-02-01T00:00:00Z"), cancelAtPeriodEnd: false });

describe("handleInvoicePaymentFailed ordering fix — Part A: control-flow harness", () => {
  it("Stripe subscription retrieval fails BEFORE the transaction — no DB write of any kind", async () => {
    const db = new FakeDb(baseSub);
    const fetchFails = () => Promise.reject(new Error("Stripe API unreachable"));

    await expect(
      simulateHandleInvoicePaymentFailed(
        db,
        { stripeEventId: "evt_1", invoiceId: "in_1", attemptCount: 1, now: new Date(), graceDays: 7 },
        fetchFails,
      ),
    ).rejects.toThrow("Stripe API unreachable");

    // Nothing was written — not the event dedup row, not the subscription.
    expect(db.webhookEventIds.size).toBe(0);
    expect(db.sub).toEqual(baseSub);
  });

  it("local transaction fails AFTER the Stripe snapshot is fetched — retry is NOT discarded as already-processed", async () => {
    const db = new FakeDb(baseSub);
    const event = { stripeEventId: "evt_2", invoiceId: "in_1", attemptCount: 1, now: new Date(), graceDays: 7 };

    // First attempt: transaction fails after the event insert would have happened.
    await expect(
      simulateHandleInvoicePaymentFailed(db, event, snapshotOk, { throwDuringTransaction: true }),
    ).rejects.toThrow("simulated failure inside the transaction");

    // Rollback must have discarded the staged event-id insert.
    expect(db.webhookEventIds.has("evt_2")).toBe(false);
    expect(db.sub.status).toBe("active"); // unchanged — original state preserved

    // Retry (Stripe redelivers the same event ID) — must succeed normally,
    // NOT be treated as a duplicate.
    const retryResult = await simulateHandleInvoicePaymentFailed(db, event, snapshotOk);
    expect(retryResult.applied).toBe(true);
    expect(retryResult.isNewInvoice).toBe(true);
    expect(db.webhookEventIds.has("evt_2")).toBe(true);
    expect(db.sub.status).toBe("past_due");
  });

  it("duplicate event after successful processing is a true no-op (no second status sync, no second email)", async () => {
    const db = new FakeDb(baseSub);
    const event = { stripeEventId: "evt_3", invoiceId: "in_1", attemptCount: 1, now: new Date(), graceDays: 7 };

    const first = await simulateHandleInvoicePaymentFailed(db, event, snapshotOk);
    expect(first.applied).toBe(true);
    expect(first.emailCount).toBe(1);

    // Redelivery of the exact same event — dedup must short-circuit before
    // any Stripe fetch would even matter; simulate a snapshot fetch that
    // would throw if it were ever called, to prove it is NOT called again
    // in a true duplicate... but per the real implementation, the Stripe
    // fetch always happens before we know it's a duplicate (that's the only
    // way to guarantee the fetch never happens inside the lock). So here we
    // assert the DOWNSTREAM effects (DB write, email) are not repeated,
    // which is the actual correctness property that matters.
    const second = await simulateHandleInvoicePaymentFailed(db, event, snapshotOk);
    expect(second.applied).toBe(false);
    expect(second.emailCount).toBe(0);
    expect(second.updateCalls).toEqual([]);
  });

  it("status/period/cancelAtPeriodEnd fields are written in the SAME update call as the renewal-failure fields", async () => {
    const db = new FakeDb(baseSub);
    const event = { stripeEventId: "evt_4", invoiceId: "in_1", attemptCount: 1, now: new Date(), graceDays: 7 };

    const result = await simulateHandleInvoicePaymentFailed(db, event, snapshotOk);

    // Exactly ONE update call — not a separate "status sync" write.
    expect(result.updateCalls).toHaveLength(1);
    const data = result.updateCalls[0];

    // syncSubscriptionStatus's fields:
    expect(data).toHaveProperty("status", "past_due");
    expect(data).toHaveProperty("currentPeriodEnd");
    expect(data).toHaveProperty("cancelAtPeriodEnd", false);

    // Renewal-failure fields, in the SAME object:
    expect(data).toHaveProperty("renewalAttemptCount", 1);
    expect(data).toHaveProperty("lastFailedInvoiceId", "in_1");
    expect(data).toHaveProperty("gracePeriodEndsAt");
  });

  it("a stale/out-of-order event still syncs status fields, but does NOT touch renewal-failure fields", async () => {
    const db = new FakeDb({ ...baseSub, lastFailedInvoiceId: "in_1", renewalAttemptCount: 2, gracePeriodEndsAt: new Date(Date.now() + 5 * 86400_000) });
    // attemptCount=1 for the SAME invoice, but stored count is already 2 — stale/out-of-order.
    const event = { stripeEventId: "evt_5", invoiceId: "in_1", attemptCount: 1, now: new Date(), graceDays: 7 };

    const result = await simulateHandleInvoicePaymentFailed(db, event, snapshotOk);

    expect(result.applied).toBe(true); // the event itself is recorded (dedup insert succeeds)
    expect(result.isNewInvoice).toBe(false);
    expect(result.emailCount).toBe(0);

    const data = result.updateCalls[0];
    expect(data).toHaveProperty("status", "past_due"); // status sync still happens
    expect(data).not.toHaveProperty("renewalAttemptCount"); // but stale attempt is ignored
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PART B: Structural regression checks against the real route.ts source
// ═══════════════════════════════════════════════════════════════════════════════

const routeSource = readFileSync(
  join(process.cwd(), "app/api/stripe/webhook/route.ts"),
  "utf8",
);

function extractFunctionBody(source: string, signature: string): string {
  const start = source.indexOf(signature);
  if (start === -1) throw new Error(`Could not find function signature: ${signature}`);
  // Find the matching closing brace by counting braces from the first `{` after the signature.
  const openIdx = source.indexOf("{", start);
  let depth = 0;
  for (let i = openIdx; i < source.length; i++) {
    if (source[i] === "{") depth++;
    if (source[i] === "}") depth--;
    if (depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`Could not find matching closing brace for: ${signature}`);
}

describe("handleInvoicePaymentFailed ordering fix — Part B: source structure regression", () => {
  const fnBody = extractFunctionBody(
    routeSource,
    "async function handleInvoicePaymentFailed(",
  );

  it("fetches the Stripe subscription snapshot BEFORE opening the Prisma transaction", () => {
    const fetchIdx = fnBody.indexOf("stripe.subscriptions.retrieve(subscriptionId");
    const txIdx = fnBody.indexOf("prisma.$transaction(");
    expect(fetchIdx).toBeGreaterThan(-1);
    expect(txIdx).toBeGreaterThan(-1);
    expect(fetchIdx).toBeLessThan(txIdx);
  });

  it("does not call the Stripe API again after the transaction (no post-commit network call)", () => {
    const txEndMarkerIdx = fnBody.indexOf("if (!outcome.applied)");
    expect(txEndMarkerIdx).toBeGreaterThan(-1);
    const afterTx = fnBody.slice(txEndMarkerIdx);
    // The old bug was a `await syncSubscriptionStatus(subscriptionId);` call here.
    expect(afterTx).not.toContain("syncSubscriptionStatus(subscriptionId)");
    expect(afterTx).not.toContain("stripe.subscriptions.retrieve");
  });

  it("applies syncSubscriptionStatus's fields (status, cancelAtPeriodEnd) inside the same tx.subscription.update as the renewal-failure fields", () => {
    const updateIdx = fnBody.indexOf("tx.subscription.update(");
    expect(updateIdx).toBeGreaterThan(-1);
    // Grab a reasonably large window after the update call to inspect its `data` object.
    const updateBlock = fnBody.slice(updateIdx, updateIdx + 900);
    expect(updateBlock).toContain("status: stripeSnapshot.status");
    expect(updateBlock).toContain("cancelAtPeriodEnd: stripeSnapshot.cancel_at_period_end");
    expect(updateBlock).toContain("renewalAttemptCount: decision.nextRenewalAttemptCount");
    // Only one tx.subscription.update call should exist in the whole function.
    expect(fnBody.split("tx.subscription.update(").length - 1).toBe(1);
  });

  it("passes invoice.id through to sendPaymentFailedEmail for the Resend idempotency key", () => {
    expect(fnBody).toContain("sendPaymentFailedEmail(outcome.userId, outcome.gracePeriodEndsAt!, invoice.id)");
  });

  it("sendPaymentFailedEmail uses a Resend idempotencyKey derived from the invoice ID", () => {
    const emailFnBody = extractFunctionBody(routeSource, "async function sendPaymentFailedEmail(");
    expect(emailFnBody).toContain("idempotencyKey: `payment-failed/${invoiceId}`");
  });
});
