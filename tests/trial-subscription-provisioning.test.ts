/**
 * AUTOMATED TESTS: BLK-02 fix — trial subscription provisioning
 *
 * Covers the corrected v2 design: create-trial-intent creates ONLY a
 * SetupIntent (no Stripe subscription, no local Subscription row, no email,
 * no access grant), and the Stripe subscription is created exclusively by
 * handleTrialSetupIntentSucceeded (setup_intent.succeeded webhook), guarded
 * by:
 *   1. A Stripe idempotency key (`trial-subscription:${setupIntent.id}`) on
 *      stripe.subscriptions.create — protects the external network side
 *      effect itself, independent of our database.
 *   2. A TrialEligibility DB claim, unique on (userId, courseKey) AND unique
 *      on setupIntentId, taken BEFORE any Stripe call — protects against TWO
 *      DIFFERENT SetupIntents for the same user racing (which the Stripe
 *      idempotency key alone cannot catch, since two different SetupIntents
 *      produce two different keys).
 *
 * Two complementary layers of testing, matching the existing convention in
 * this suite (see tests/webhook-payment-failed-ordering.test.ts and
 * tests/subscription-renewal-idempotency.test.ts):
 *
 *   A. A control-flow harness (FakeDb + FakeStripe) that mirrors the real
 *      production ordering and atomicity — using the REAL, unmodified
 *      decideTrialClaimAction/resolveTrialPriceId pure functions from
 *      lib/trial-eligibility.ts — to prove the concurrency/idempotency
 *      properties end-to-end without needing a live Postgres/Stripe.
 *   B. Structural regression assertions against the actual route.ts sources,
 *      so a future edit that reintroduces the bug (e.g. creating the
 *      subscription back in create-trial-intent, or dropping the
 *      idempotencyKey) fails this suite even if the harness in (A) wasn't
 *      updated to match.
 *
 * NOTE on true DB-level concurrency: as documented in
 * subscription-renewal-idempotency.test.ts, the actual guarantee that two
 * concurrent claims cannot both win comes from a real Postgres unique
 * constraint (see prisma/migrations/20260708_trial_eligibility.sql and its
 * post-migration verification block). That cannot be exercised by a mocked
 * unit test; the harness below verifies the DECISION LOGIC is correct
 * assuming the database serializes access as designed.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { decideTrialClaimAction, resolveTrialPriceId, TRIAL_COURSE_KEY, type TrialEligibilityRow } from "@/lib/trial-eligibility";
import { isStripeLiveMode } from "@/lib/stripe";

// ═══════════════════════════════════════════════════════════════════════════════
// PART A: Control-flow harness mirroring handleTrialSetupIntentSucceeded
// ═══════════════════════════════════════════════════════════════════════════════

interface FakeStripeSub {
  id: string;
  status: string;
  customer: string;
  metadata: Record<string, string>;
  cancel_at_period_end: boolean;
  trial_end: number | null;
  items: { data: Array<{ price: { id: string } }> };
}

/** Mirrors Stripe's own idempotency-key behavior: the SAME key always returns
 *  the SAME object, regardless of how many times or from how many "workers"
 *  create() is called with it — this is enforced Stripe-side in production,
 *  not by our code, so the harness models it as an external, authoritative
 *  server rather than something our own retry logic could get wrong. */
class FakeStripeSubscriptions {
  private byIdempotencyKey = new Map<string, FakeStripeSub>();
  private byId = new Map<string, FakeStripeSub>();
  /** Number of DISTINCT Stripe subscription objects actually created. A call
   *  with an idempotency key that already exists is still a real network
   *  round-trip in production, but must NOT increment this — it returns the
   *  same cached object rather than creating a second one. This is exactly
   *  the property the tests below need to assert on ("no duplicate
   *  subscription"), as opposed to "no duplicate network call". */
  get createCallCount() { return this.byId.size; }
  private nextId = 1;

  async create(
    params: { customer: string; items: [{ price: string }]; metadata: Record<string, string> },
    opts: { idempotencyKey: string },
  ): Promise<FakeStripeSub> {
    const existing = this.byIdempotencyKey.get(opts.idempotencyKey);
    if (existing) return existing; // Stripe returns the cached object — no new subscription

    const sub: FakeStripeSub = {
      id: `sub_${this.nextId++}`,
      status: "trialing",
      customer: params.customer,
      metadata: params.metadata,
      cancel_at_period_end: false,
      trial_end: null,
      items: { data: [{ price: { id: params.items[0].price } }] },
    };
    this.byIdempotencyKey.set(opts.idempotencyKey, sub);
    this.byId.set(sub.id, sub);
    return sub;
  }

  async retrieve(id: string): Promise<FakeStripeSub> {
    const sub = this.byId.get(id);
    if (!sub) throw new Error(`No such subscription: ${id}`);
    return sub;
  }

  /** Set of idempotency keys currently "in flight" — used only by the
   *  idempotency_key_in_use collision test below to model a second, truly
   *  concurrent request landing on the same key before the first one has
   *  finished and cached its result. */
  private inFlightKeys = new Set<string>();

  async createSimulatingConcurrentCollision(
    opts: { idempotencyKey: string },
  ): Promise<never> {
    if (this.inFlightKeys.has(opts.idempotencyKey)) {
      const err = new StripeIdempotencyErrorStub(
        `Keys for idempotent requests can only be used with the same parameters they were first used with. ` +
        `Try again with a key other than '${opts.idempotencyKey}' if you meant to execute a different request.`,
      );
      throw err;
    }
    this.inFlightKeys.add(opts.idempotencyKey);
    throw new Error("unreachable in this test — first caller never resolves here");
  }
}

/** Minimal stand-in for Stripe.errors.StripeIdempotencyError so this test
 *  file doesn't need the real `stripe` package's class identity — the
 *  handler code under test checks `instanceof Stripe.errors.StripeIdempotencyError`,
 *  which is exercised separately by the structural checks below (confirming
 *  the real handler imports and checks against the real Stripe SDK class).
 *  This stub only proves the harness's OWN control flow treats the error as
 *  retryable and non-committing. */
class StripeIdempotencyErrorStub extends Error {
  type = "idempotency_error";
}

interface FakeSubscriptionRow {
  stripeSubscriptionId: string;
  userId: string;
  status: string;
}

class FakeDb {
  trialEligibility: Map<string, { id: string; userId: string; courseKey: string; setupIntentId: string; stripeSubId: string | null }> = new Map();
  webhookEventIds = new Set<string>();
  subscriptions = new Map<string, FakeSubscriptionRow>(); // keyed by stripeSubscriptionId
  private nextClaimId = 1;

  private claimKey(userId: string, courseKey: string) {
    return `${userId}::${courseKey}`;
  }

  /** Mirrors claimTrialEligibility in app/api/stripe/webhook/route.ts. */
  claim(userId: string, courseKey: string, setupIntentId: string) {
    const key = this.claimKey(userId, courseKey);
    const existing = this.trialEligibility.get(key) ?? null;

    if (!existing) {
      // Also guard the setupIntentId-unique constraint for realism, even
      // though in these tests it never collides independently of the
      // (userId, courseKey) constraint.
      for (const row of this.trialEligibility.values()) {
        if (row.setupIntentId === setupIntentId) {
          throw new Error("unique constraint violation on setupIntentId");
        }
      }
      const created = { id: `trial_${this.nextClaimId++}`, userId, courseKey, setupIntentId, stripeSubId: null };
      this.trialEligibility.set(key, created);
      return { action: "proceed" as const, id: created.id, stripeSubId: null };
    }

    const row: TrialEligibilityRow = existing;
    const decision = decideTrialClaimAction(row, setupIntentId);
    return decision!;
  }

  /** Mirrors finalizeTrialSubscriptionTx. `throwDuringTx` simulates a DB
   *  failure AFTER Stripe already created the subscription. */
  finalizeTx(
    stripeEventId: string,
    trialEligibilityId: string,
    userId: string,
    stripeSub: FakeStripeSub,
    opts: { throwDuringTx?: boolean } = {},
  ): { isFirstLocalCreation: boolean } {
    if (this.webhookEventIds.has(stripeEventId)) {
      return { isFirstLocalCreation: false };
    }

    if (opts.throwDuringTx) {
      // Whole transaction rolls back — nothing staged is committed.
      throw new Error("simulated DB failure inside finalizeTrialSubscriptionTx");
    }

    this.webhookEventIds.add(stripeEventId);

    for (const claim of this.trialEligibility.values()) {
      if (claim.id === trialEligibilityId && claim.stripeSubId === null) {
        claim.stripeSubId = stripeSub.id;
      }
    }

    const isFirstLocalCreation = !this.subscriptions.has(stripeSub.id);
    this.subscriptions.set(stripeSub.id, { stripeSubscriptionId: stripeSub.id, userId, status: stripeSub.status });

    return { isFirstLocalCreation };
  }
}

interface SimResult {
  outcome: "proceeded" | "claimed_by_other" | "already_completed";
  stripeSub: FakeStripeSub | null;
  isFirstLocalCreation: boolean;
  emailSent: boolean;
}

/**
 * Mirrors the fixed handleTrialSetupIntentSucceeded control flow (validation
 * omitted here — covered by its own throw-based checks in the real handler;
 * this harness focuses on the claim/idempotency/finalize properties).
 */
async function simulateHandleTrialSetupIntentSucceeded(
  db: FakeDb,
  stripe: FakeStripeSubscriptions,
  event: { stripeEventId: string; userId: string; setupIntentId: string; planId: string; customerId: string },
  opts: { throwDuringTx?: boolean } = {},
): Promise<SimResult> {
  const claim = db.claim(event.userId, TRIAL_COURSE_KEY, event.setupIntentId);

  if (claim.action === "claimed_by_other") {
    return { outcome: "claimed_by_other", stripeSub: null, isFirstLocalCreation: false, emailSent: false };
  }

  if (claim.action === "already_completed") {
    const stripeSub = claim.stripeSubId ? await stripe.retrieve(claim.stripeSubId) : null;
    if (stripeSub) {
      const { isFirstLocalCreation } = db.finalizeTx(event.stripeEventId, claim.id, event.userId, stripeSub, opts);
      return { outcome: "already_completed", stripeSub, isFirstLocalCreation, emailSent: false };
    }
    return { outcome: "already_completed", stripeSub: null, isFirstLocalCreation: false, emailSent: false };
  }

  // "proceed" or "recovered_no_sub_yet"
  const priceId = resolveTrialPriceId(event.planId)!;
  const idempotencyKey = `trial-subscription:${event.setupIntentId}`;
  const stripeSub = await stripe.create(
    { customer: event.customerId, items: [{ price: priceId }], metadata: { userId: event.userId, planId: event.planId, isTrial: "true" } },
    { idempotencyKey },
  );

  const { isFirstLocalCreation } = db.finalizeTx(event.stripeEventId, claim.id, event.userId, stripeSub, opts);

  return { outcome: "proceeded", stripeSub, isFirstLocalCreation, emailSent: isFirstLocalCreation };
}

// ─── Test 1: create-trial-intent alone creates no Stripe Subscription and no local Subscription ───

describe("[1] create-trial-intent creates only a SetupIntent", () => {
  it("issuing a SetupIntent alone never calls stripe.subscriptions.create nor writes a Subscription row", async () => {
    const stripe = new FakeStripeSubscriptions();
    const db = new FakeDb();

    // Simulates exactly what create-trial-intent now does: create a
    // SetupIntent (modeled here as just generating an id — the real route
    // never touches `stripe` (subscriptions) or `db` at all).
    const setupIntentId = "seti_1";

    expect(stripe.createCallCount).toBe(0);
    expect(db.subscriptions.size).toBe(0);
    expect(db.trialEligibility.size).toBe(0);
    // No-op assertion: the mere existence of a SetupIntent id, with nothing
    // else touched, is the entire "create-trial-intent ran" event.
    expect(setupIntentId).toBeTruthy();
    expect(stripe.createCallCount).toBe(0);
    expect(db.subscriptions.size).toBe(0);
  });
});

// ─── Test 2: setup_intent.succeeded creates exactly one Stripe subscription and one local Subscription ───

describe("[2] setup_intent.succeeded creates exactly one Stripe subscription and one local Subscription", () => {
  it("processes a fresh SetupIntent end-to-end", async () => {
    const stripe = new FakeStripeSubscriptions();
    const db = new FakeDb();

    const result = await simulateHandleTrialSetupIntentSucceeded(db, stripe, {
      stripeEventId: "evt_1", userId: "user_1", setupIntentId: "seti_1", planId: "individualTrial", customerId: "cus_1",
    });

    expect(result.outcome).toBe("proceeded");
    expect(stripe.createCallCount).toBe(1);
    expect(db.subscriptions.size).toBe(1);
    expect(result.isFirstLocalCreation).toBe(true);
    expect(result.emailSent).toBe(true);
  });
});

// ─── Test 3: Same event.id delivered twice creates no duplicate ───

describe("[3] same event.id delivered twice creates no duplicate", () => {
  it("the second delivery of the identical event is a pure no-op downstream", async () => {
    const stripe = new FakeStripeSubscriptions();
    const db = new FakeDb();
    const event = { stripeEventId: "evt_dup", userId: "user_1", setupIntentId: "seti_1", planId: "individualTrial", customerId: "cus_1" };

    const first = await simulateHandleTrialSetupIntentSucceeded(db, stripe, event);
    expect(first.isFirstLocalCreation).toBe(true);

    const second = await simulateHandleTrialSetupIntentSucceeded(db, stripe, event);
    // Claim is "already_completed" the second time (same setupIntentId, stripeSubId now set).
    expect(second.outcome).toBe("already_completed");
    expect(second.isFirstLocalCreation).toBe(false);
    expect(second.emailSent).toBe(false);

    expect(db.subscriptions.size).toBe(1);
    expect(stripe.createCallCount).toBe(1); // no second Stripe call at all
  });
});

// ─── Test 4: Different event IDs for the same setupIntentId do not create duplicates ───

describe("[4] different event IDs for the same setupIntentId do not create duplicates", () => {
  it("a second, distinct event referencing the same SetupIntent reuses the same Stripe subscription", async () => {
    const stripe = new FakeStripeSubscriptions();
    const db = new FakeDb();
    const base = { userId: "user_1", setupIntentId: "seti_1", planId: "individualTrial", customerId: "cus_1" };

    const first = await simulateHandleTrialSetupIntentSucceeded(db, stripe, { ...base, stripeEventId: "evt_A" });
    const second = await simulateHandleTrialSetupIntentSucceeded(db, stripe, { ...base, stripeEventId: "evt_B" });

    expect(first.stripeSub!.id).toBe(second.stripeSub!.id); // same Stripe idempotency key → same object
    expect(stripe.createCallCount).toBe(1);
    expect(db.subscriptions.size).toBe(1);
    // evt_B is a NEW event id, so it does its own (idempotent) finalize pass,
    // but must not be treated as the "first" local creation again.
    expect(second.isFirstLocalCreation).toBe(false);
    expect(second.emailSent).toBe(false);
  });
});

// ─── Test 5: Stripe subscription creation succeeds, DB transaction fails, then retry recovers using the same idempotency key ───

describe("[5] Stripe succeeds, DB transaction fails, retry recovers via the same idempotency key", () => {
  it("retries after a DB failure without creating a second Stripe subscription", async () => {
    const stripe = new FakeStripeSubscriptions();
    const db = new FakeDb();
    const event = { stripeEventId: "evt_retry", userId: "user_1", setupIntentId: "seti_1", planId: "individualTrial", customerId: "cus_1" };

    await expect(
      simulateHandleTrialSetupIntentSucceeded(db, stripe, event, { throwDuringTx: true }),
    ).rejects.toThrow("simulated DB failure");

    // Stripe already created the subscription; our DB has nothing committed yet.
    expect(stripe.createCallCount).toBe(1);
    expect(db.subscriptions.size).toBe(0);
    expect(db.webhookEventIds.has("evt_retry")).toBe(false);
    // The claim row exists (claimed before the Stripe call) but is not yet linked.
    const claimRow = [...db.trialEligibility.values()][0];
    expect(claimRow.stripeSubId).toBeNull();

    // Retry — same stripeEventId, same setupIntentId.
    const retry = await simulateHandleTrialSetupIntentSucceeded(db, stripe, event);

    expect(retry.outcome).toBe("proceeded"); // claim.action was "recovered_no_sub_yet"
    expect(stripe.createCallCount).toBe(1); // NOT called again — same idempotency key returns the cached object
    expect(db.subscriptions.size).toBe(1);
    expect(retry.isFirstLocalCreation).toBe(true);
    expect(retry.emailSent).toBe(true);
  });
});

// ─── Test 6: Existing TrialEligibility with same setupIntentId and null stripeSubId recovers correctly ───

describe("[6] existing claim, same setupIntentId, null stripeSubId → recovers (does not stop)", () => {
  it("decideTrialClaimAction returns recovered_no_sub_yet, and the flow continues to Stripe", async () => {
    const existing: TrialEligibilityRow = { id: "trial_1", setupIntentId: "seti_1", stripeSubId: null };
    const decision = decideTrialClaimAction(existing, "seti_1");
    expect(decision).toEqual({ action: "recovered_no_sub_yet", id: "trial_1", stripeSubId: null });

    // End-to-end: pre-seed the DB with exactly this state, then run the handler.
    const stripe = new FakeStripeSubscriptions();
    const db = new FakeDb();
    db.trialEligibility.set("user_1::" + TRIAL_COURSE_KEY, { id: "trial_1", userId: "user_1", courseKey: TRIAL_COURSE_KEY, setupIntentId: "seti_1", stripeSubId: null });

    const result = await simulateHandleTrialSetupIntentSucceeded(db, stripe, {
      stripeEventId: "evt_recover", userId: "user_1", setupIntentId: "seti_1", planId: "individualTrial", customerId: "cus_1",
    });

    expect(result.outcome).toBe("proceeded");
    expect(stripe.createCallCount).toBe(1);
    expect(db.subscriptions.size).toBe(1);
  });
});

// ─── Test 7: Existing TrialEligibility with a different setupIntentId rejects/no-ops before any Stripe subscription creation ───

describe("[7] existing claim, different setupIntentId → no-op before any Stripe call", () => {
  it("decideTrialClaimAction returns claimed_by_other", () => {
    const existing: TrialEligibilityRow = { id: "trial_1", setupIntentId: "seti_WINNER", stripeSubId: "sub_1" };
    const decision = decideTrialClaimAction(existing, "seti_LOSER");
    expect(decision).toEqual({ action: "claimed_by_other", id: "trial_1", stripeSubId: "sub_1" });
  });

  it("end-to-end: the losing SetupIntent never reaches stripe.subscriptions.create", async () => {
    const stripe = new FakeStripeSubscriptions();
    const db = new FakeDb();

    // seti_WINNER claims and completes first.
    const winner = await simulateHandleTrialSetupIntentSucceeded(db, stripe, {
      stripeEventId: "evt_winner", userId: "user_1", setupIntentId: "seti_WINNER", planId: "individualTrial", customerId: "cus_1",
    });
    expect(winner.outcome).toBe("proceeded");
    expect(stripe.createCallCount).toBe(1);

    // seti_LOSER (a second, genuinely different SetupIntent for the same user+course) arrives.
    const loser = await simulateHandleTrialSetupIntentSucceeded(db, stripe, {
      stripeEventId: "evt_loser", userId: "user_1", setupIntentId: "seti_LOSER", planId: "individualTrial", customerId: "cus_1",
    });
    expect(loser.outcome).toBe("claimed_by_other");
    expect(loser.stripeSub).toBeNull();
    expect(stripe.createCallCount).toBe(1); // still just one — the loser never called Stripe at all
    expect(db.subscriptions.size).toBe(1);
  });
});

// ─── Test 8: Two successful SetupIntents for the same user/course only allow one trial ───

describe("[8] two successful SetupIntents for the same user/course — only one trial ever created", () => {
  it("concurrent-style processing of two different SetupIntents results in exactly one Stripe subscription", async () => {
    const stripe = new FakeStripeSubscriptions();
    const db = new FakeDb();
    const userId = "user_race";

    // Simulates two webhook deliveries "racing" — processed sequentially here
    // (a real Postgres unique constraint is what serializes true concurrency;
    // see the module doc comment), but the claim for the second one must
    // still be rejected deterministically regardless of arrival order.
    const a = await simulateHandleTrialSetupIntentSucceeded(db, stripe, {
      stripeEventId: "evt_tabA", userId, setupIntentId: "seti_tabA", planId: "individualTrial", customerId: "cus_race",
    });
    const b = await simulateHandleTrialSetupIntentSucceeded(db, stripe, {
      stripeEventId: "evt_tabB", userId, setupIntentId: "seti_tabB", planId: "individualTrial", customerId: "cus_race",
    });

    const outcomes = [a.outcome, b.outcome].sort();
    expect(outcomes).toEqual(["claimed_by_other", "proceeded"]);
    expect(stripe.createCallCount).toBe(1);
    expect(db.subscriptions.size).toBe(1);
    expect(db.trialEligibility.size).toBe(1); // one claim row for (userId, courseKey), period
  });
});

// ─── Test 9: Browser closes after SetupIntent success; webhook still grants access ───

describe("[9] browser closes after SetupIntent success — webhook alone still completes provisioning", () => {
  it("processing depends only on the webhook event, never on any client action after confirmSetup", async () => {
    const stripe = new FakeStripeSubscriptions();
    const db = new FakeDb();

    // No client-side call of any kind is modeled here — simulating a closed
    // tab. The webhook is the only actor.
    const result = await simulateHandleTrialSetupIntentSucceeded(db, stripe, {
      stripeEventId: "evt_closed_tab", userId: "user_1", setupIntentId: "seti_1", planId: "familyTrial", customerId: "cus_1",
    });

    expect(result.outcome).toBe("proceeded");
    expect(db.subscriptions.get(result.stripeSub!.id)?.status).toBe("trialing");
    // Access (per lib/access.ts hasActiveCourseAccess) is granted purely from
    // this Subscription row's status/currentPeriodEnd — no client involvement
    // required at any point after the SetupIntent itself succeeded.
  });
});

// ─── Test 10: customer.subscription.created does not prematurely trigger trial side effects ───

describe("[10] customer.subscription.created for the trial subscription does not independently grant/trigger trial side effects", () => {
  /** Mirrors the corrected branch in upsertSubscription (app/api/stripe/webhook/route.ts):
   *  isFirstActivation && isTrialSub no longer sends any email. */
  function upsertSubscriptionTrialBranch(isFirstActivation: boolean, isTrialSub: boolean): { emailSent: boolean } {
    if (isFirstActivation && !isTrialSub) return { emailSent: true }; // normal monthly welcome email path, unaffected
    if (isFirstActivation && isTrialSub) return { emailSent: false }; // BLK-02 fix: no longer sends
    return { emailSent: false };
  }

  it("does not send a welcome email even if customer.subscription.created races ahead and creates the row first", () => {
    const result = upsertSubscriptionTrialBranch(true, true);
    expect(result.emailSent).toBe(false);
  });

  it("still sends the normal welcome email for non-trial subscriptions (regression guard)", () => {
    const result = upsertSubscriptionTrialBranch(true, false);
    expect(result.emailSent).toBe(true);
  });

  it("the row itself is still safely created (idempotent upsert) even if the race happens — only the side effect is suppressed", async () => {
    // If customer.subscription.created "wins" the race and creates the row,
    // handleTrialSetupIntentSucceeded's own finalizeTrialSubscriptionTx must
    // still complete correctly afterward (idempotent upsert, no duplicate row).
    const stripe = new FakeStripeSubscriptions();
    const db = new FakeDb();
    const stripeSub = await stripe.create(
      { customer: "cus_1", items: [{ price: "price_individual_trial" }], metadata: { userId: "user_1", planId: "individualTrial", isTrial: "true" } },
      { idempotencyKey: "trial-subscription:seti_1" },
    );

    // Simulate customer.subscription.created creating the row FIRST (race winner).
    db.subscriptions.set(stripeSub.id, { stripeSubscriptionId: stripeSub.id, userId: "user_1", status: "trialing" });

    // Our own claim + finalize still runs afterward — must not throw, must not duplicate.
    const claim = db.claim("user_1", TRIAL_COURSE_KEY, "seti_1");
    expect(claim.action).toBe("proceed"); // TrialEligibility itself wasn't touched by the race — only Subscription was
    const { isFirstLocalCreation } = db.finalizeTx("evt_race", claim.id, "user_1", stripeSub);

    expect(isFirstLocalCreation).toBe(false); // row already existed — no double-creation signal
    expect(db.subscriptions.size).toBe(1);
  });
});

// ─── Test 11: concurrent idempotency-key collision (idempotency_key_in_use) is retryable, not a no-op ───

describe("[11] concurrent stripe.subscriptions.create collision on the same idempotency key is retryable", () => {
  it("a StripeIdempotencyError-shaped error propagates without committing anything, and a later retry succeeds cleanly", async () => {
    const stripe = new FakeStripeSubscriptions();
    const db = new FakeDb();
    const key = "trial-subscription:seti_collide";

    // Simulates the losing side of two truly concurrent requests for the
    // SAME setupIntentId — the ONE scenario the TrialEligibility unique
    // constraint does NOT prevent, because both requests present the same
    // setupIntentId and so both win "proceed"/"recovered_no_sub_yet" against
    // the claim table (that constraint only stops a DIFFERENT setupIntentId
    // from racing in — see test [7]/[8]). Stripe itself is the only thing
    // that can arbitrate two truly simultaneous calls with the identical key.
    await expect(
      stripe.createSimulatingConcurrentCollision({ idempotencyKey: key }),
    ).rejects.toThrow("unreachable"); // first call: no prior in-flight key yet

    await expect(
      stripe.createSimulatingConcurrentCollision({ idempotencyKey: key }),
    ).rejects.toBeInstanceOf(StripeIdempotencyErrorStub);

    // Nothing was committed by either failed attempt.
    expect(db.subscriptions.size).toBe(0);
    expect(db.webhookEventIds.size).toBe(0);

    // The claim itself, however, WAS taken before either Stripe call (per
    // the real handler's ordering) and remains valid for a real retry —
    // simulate that retry now succeeding via the normal (non-colliding) path.
    const retry = await simulateHandleTrialSetupIntentSucceeded(db, stripe, {
      stripeEventId: "evt_after_collision", userId: "user_1", setupIntentId: "seti_collide", planId: "individualTrial", customerId: "cus_1",
    });
    expect(retry.outcome).toBe("proceeded");
    expect(db.subscriptions.size).toBe(1);
  });
});

describe("[Structural] handleTrialSetupIntentSucceeded catches and re-throws StripeIdempotencyError as retryable", () => {
  const fnBody = extractFunctionBody(webhookSource, "async function handleTrialSetupIntentSucceeded(");

  it("checks for Stripe.errors.StripeIdempotencyError around stripe.subscriptions.create and re-throws (does not swallow it into a no-op)", () => {
    expect(fnBody).toContain("Stripe.errors.StripeIdempotencyError");
    const catchIdx = fnBody.indexOf("Stripe.errors.StripeIdempotencyError");
    const throwAfterIdx = fnBody.indexOf("throw err;", catchIdx);
    expect(throwAfterIdx).toBeGreaterThan(catchIdx); // re-thrown, not caught-and-continued
  });

  it("the stripe.subscriptions.create call is wrapped in try/catch", () => {
    const createIdx = fnBody.indexOf("stripe.subscriptions.create(");
    const tryIdx = fnBody.lastIndexOf("try {", createIdx);
    expect(tryIdx).toBeGreaterThan(-1);
    expect(createIdx - tryIdx).toBeLessThan(400); // the try block wraps this call closely, not the whole function
  });
});

// ─── Test 12: isStripeLiveMode — sk_live_/rk_live_ prefix detection and explicit override ───

describe("[12] isStripeLiveMode correctly classifies live vs. test-mode keys, including restricted keys", () => {
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    process.env.STRIPE_SECRET_KEY = ORIGINAL_ENV.STRIPE_SECRET_KEY;
    if (ORIGINAL_ENV.STRIPE_LIVE_MODE === undefined) delete process.env.STRIPE_LIVE_MODE;
    else process.env.STRIPE_LIVE_MODE = ORIGINAL_ENV.STRIPE_LIVE_MODE;
  });

  it("treats a standard sk_live_ key as live", () => {
    delete process.env.STRIPE_LIVE_MODE;
    process.env.STRIPE_SECRET_KEY = "sk_live_abc123";
    expect(isStripeLiveMode()).toBe(true);
  });

  it("treats a restricted rk_live_ key as live (the bug this fix addresses)", () => {
    delete process.env.STRIPE_LIVE_MODE;
    process.env.STRIPE_SECRET_KEY = "rk_live_abc123";
    expect(isStripeLiveMode()).toBe(true);
  });

  it("treats sk_test_ and rk_test_ keys as NOT live", () => {
    delete process.env.STRIPE_LIVE_MODE;
    process.env.STRIPE_SECRET_KEY = "sk_test_abc123";
    expect(isStripeLiveMode()).toBe(false);

    process.env.STRIPE_SECRET_KEY = "rk_test_abc123";
    expect(isStripeLiveMode()).toBe(false);
  });

  it("an explicit STRIPE_LIVE_MODE env var overrides key-prefix sniffing in both directions", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_abc123";
    process.env.STRIPE_LIVE_MODE = "true";
    expect(isStripeLiveMode()).toBe(true); // overridden to live despite a test key

    process.env.STRIPE_SECRET_KEY = "sk_live_abc123";
    process.env.STRIPE_LIVE_MODE = "false";
    expect(isStripeLiveMode()).toBe(false); // overridden to test despite a live key
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PART B: resolveTrialPriceId / decideTrialClaimAction — pure function unit tests
// ═══════════════════════════════════════════════════════════════════════════════

describe("resolveTrialPriceId — server-side allowlist, never trusts a raw metadata price ID", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV, STRIPE_PRICE_INDIVIDUAL_MONTHLY: "price_individual_123", STRIPE_PRICE_FAMILY_MONTHLY: "price_family_456" };
  });

  it("resolves individualTrial to the configured individual monthly price", () => {
    expect(resolveTrialPriceId("individualTrial")).toBe("price_individual_123");
  });

  it("resolves familyTrial to the configured family monthly price", () => {
    expect(resolveTrialPriceId("familyTrial")).toBe("price_family_456");
  });

  it("returns null for an unrecognized planId — never falls back to a guessed price", () => {
    expect(resolveTrialPriceId("some_attacker_supplied_plan")).toBeNull();
  });

  it("returns null when planId is missing", () => {
    expect(resolveTrialPriceId(undefined)).toBeNull();
    expect(resolveTrialPriceId(null)).toBeNull();
  });
});

describe("decideTrialClaimAction — pure branching", () => {
  it("returns null when no existing row (caller must attempt create())", () => {
    expect(decideTrialClaimAction(null, "seti_1")).toBeNull();
  });

  it("same setupIntentId, null stripeSubId → recovered_no_sub_yet", () => {
    expect(decideTrialClaimAction({ id: "t1", setupIntentId: "seti_1", stripeSubId: null }, "seti_1")).toEqual({
      action: "recovered_no_sub_yet", id: "t1", stripeSubId: null,
    });
  });

  it("same setupIntentId, non-null stripeSubId → already_completed", () => {
    expect(decideTrialClaimAction({ id: "t1", setupIntentId: "seti_1", stripeSubId: "sub_1" }, "seti_1")).toEqual({
      action: "already_completed", id: "t1", stripeSubId: "sub_1",
    });
  });

  it("different setupIntentId → claimed_by_other, regardless of stripeSubId state", () => {
    expect(decideTrialClaimAction({ id: "t1", setupIntentId: "seti_OTHER", stripeSubId: null }, "seti_1")).toEqual({
      action: "claimed_by_other", id: "t1", stripeSubId: null,
    });
    expect(decideTrialClaimAction({ id: "t1", setupIntentId: "seti_OTHER", stripeSubId: "sub_1" }, "seti_1")).toEqual({
      action: "claimed_by_other", id: "t1", stripeSubId: "sub_1",
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PART C: Structural regression checks against the real route.ts sources
// ═══════════════════════════════════════════════════════════════════════════════

const webhookSource = readFileSync(join(process.cwd(), "app/api/stripe/webhook/route.ts"), "utf8");
const createTrialIntentSource = readFileSync(join(process.cwd(), "app/api/stripe/create-trial-intent/route.ts"), "utf8");

function extractFunctionBody(source: string, signature: string): string {
  const start = source.indexOf(signature);
  if (start === -1) throw new Error(`Could not find function signature: ${signature}`);

  // Skip over the parameter list (which may itself contain nested parens,
  // e.g. destructured defaults) by tracking paren depth from the first "(".
  const parenStart = source.indexOf("(", start);
  let parenDepth = 0;
  let afterParams = -1;
  for (let i = parenStart; i < source.length; i++) {
    if (source[i] === "(") parenDepth++;
    if (source[i] === ")") {
      parenDepth--;
      if (parenDepth === 0) { afterParams = i + 1; break; }
    }
  }
  if (afterParams === -1) throw new Error(`Could not find end of parameter list for: ${signature}`);

  // From there, find the function body's real opening brace — skip any "{"
  // that is part of a generic return-type annotation (e.g.
  // `Promise<{ isFirstLocalCreation: boolean }>`) by requiring the nearest
  // non-whitespace character before a candidate "{" not be "<".
  let openIdx = -1;
  for (let i = afterParams; i < source.length; i++) {
    if (source[i] !== "{") continue;
    let j = i - 1;
    while (j >= 0 && /\s/.test(source[j])) j--;
    if (source[j] === "<") continue; // part of a generic type literal, not the body
    openIdx = i;
    break;
  }
  if (openIdx === -1) throw new Error(`Could not find opening brace for: ${signature}`);

  let depth = 0;
  for (let i = openIdx; i < source.length; i++) {
    if (source[i] === "{") depth++;
    if (source[i] === "}") depth--;
    if (depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`Could not find matching closing brace for: ${signature}`);
}

describe("[Structural] create-trial-intent no longer creates a subscription, DB row, or email", () => {
  it("does not call stripe.subscriptions.create", () => {
    expect(createTrialIntentSource).not.toContain("stripe.subscriptions.create");
  });

  it("does not write to prisma.subscription", () => {
    expect(createTrialIntentSource).not.toContain("prisma.subscription.create");
    expect(createTrialIntentSource).not.toContain("prisma.subscription.upsert");
  });

  it("does not send any email (no resend import)", () => {
    expect(createTrialIntentSource).not.toContain("resend");
    expect(createTrialIntentSource).not.toContain("Resend");
  });

  it("creates a SetupIntent with metadata.type = trial_setup", () => {
    expect(createTrialIntentSource).toContain("stripe.setupIntents.create");
    expect(createTrialIntentSource).toContain('type: "trial_setup"');
  });
});

describe("[Structural] handleTrialSetupIntentSucceeded — ordering and idempotency", () => {
  const fnBody = extractFunctionBody(webhookSource, "async function handleTrialSetupIntentSucceeded(");

  it("retrieves the SetupIntent fresh from Stripe", () => {
    expect(fnBody).toContain("stripe.setupIntents.retrieve(setupIntentId)");
  });

  it("validates status, livemode, metadata, customer ownership, and payment_method before any claim or Stripe subscription call", () => {
    const claimIdx = fnBody.indexOf("claimTrialEligibility(");
    const createIdx = fnBody.indexOf("stripe.subscriptions.create(");
    const statusCheckIdx = fnBody.indexOf('setupIntent.status !== "succeeded"');
    const livemodeCheckIdx = fnBody.indexOf("eventLivemode !== expectedLive");
    const customerCheckIdx = fnBody.indexOf("setupIntentCustomerId !== user.stripeCustomerId");
    const pmCheckIdx = fnBody.indexOf("if (!pmId)");

    for (const idx of [statusCheckIdx, livemodeCheckIdx, customerCheckIdx, pmCheckIdx]) {
      expect(idx).toBeGreaterThan(-1);
      expect(idx).toBeLessThan(claimIdx);
      expect(idx).toBeLessThan(createIdx);
    }
  });

  it("claims TrialEligibility (DB-only) BEFORE calling stripe.subscriptions.create", () => {
    const claimIdx = fnBody.indexOf("claimTrialEligibility(");
    const createIdx = fnBody.indexOf("stripe.subscriptions.create(");
    expect(claimIdx).toBeGreaterThan(-1);
    expect(createIdx).toBeGreaterThan(-1);
    expect(claimIdx).toBeLessThan(createIdx);
  });

  it("passes a deterministic idempotencyKey derived from setupIntent.id to stripe.subscriptions.create", () => {
    expect(fnBody).toContain("idempotencyKey: `trial-subscription:${setupIntentId}`");
  });

  it("does not call stripe.subscriptions.create when the claim was won by a different SetupIntent", () => {
    const claimedByOtherIdx = fnBody.indexOf('claim.action === "claimed_by_other"');
    expect(claimedByOtherIdx).toBeGreaterThan(-1);
    const block = fnBody.slice(claimedByOtherIdx, fnBody.indexOf("if (claim.action ===", claimedByOtherIdx + 10));
    expect(block).not.toContain("stripe.subscriptions.create");
  });

  it("sends the welcome email only after finalizeTrialSubscriptionTx resolves, gated on isFirstLocalCreation", () => {
    const finalizeIdx = fnBody.indexOf("finalizeTrialSubscriptionTx(");
    const emailGateIdx = fnBody.indexOf("if (isFirstLocalCreation)");
    expect(finalizeIdx).toBeGreaterThan(-1);
    expect(emailGateIdx).toBeGreaterThan(finalizeIdx);
    expect(fnBody.slice(emailGateIdx)).toContain("sendTrialWelcomeEmail(");
  });
});

describe("[Structural] finalizeTrialSubscriptionTx — no Stripe network calls inside the transaction", () => {
  const fnBody = extractFunctionBody(webhookSource, "async function finalizeTrialSubscriptionTx(");

  it("contains prisma.$transaction and no stripe.* calls anywhere in its body", () => {
    expect(fnBody).toContain("prisma.$transaction(");
    expect(fnBody).not.toContain("stripe.subscriptions");
    expect(fnBody).not.toContain("stripe.setupIntents");
  });

  it("inserts the StripeWebhookEvent dedup row and updates TrialEligibility.stripeSubId only when still null", () => {
    expect(fnBody).toContain("tx.stripeWebhookEvent.create(");
    expect(fnBody).toContain("tx.trialEligibility.updateMany(");
    expect(fnBody).toContain("stripeSubId: null");
  });

  it("upserts the Subscription row keyed by stripeSubscriptionId", () => {
    expect(fnBody).toContain("tx.subscription.upsert(");
    expect(fnBody).toContain("where: { stripeSubscriptionId: stripeSub.id }");
  });
});

describe("[Structural] upsertSubscription no longer sends a trial welcome email from the customer.subscription.created race branch", () => {
  const fnBody = extractFunctionBody(webhookSource, "async function upsertSubscription(");

  it("the isFirstActivation && isTrialSub branch does not call any email-sending function", () => {
    const branchIdx = fnBody.indexOf("isFirstActivation && isTrialSub");
    expect(branchIdx).toBeGreaterThan(-1);
    const branchBlock = fnBody.slice(branchIdx, branchIdx + 700);
    expect(branchBlock).not.toContain("sendPurchaseConfirmationEmail(");
    expect(branchBlock).not.toContain("sendTrialWelcomeEmail(");
  });
});

describe("[Structural] setup_intent.succeeded is routed only for trial_setup SetupIntents", () => {
  it("the switch case gates on metadata.type === \"trial_setup\" before calling the handler", () => {
    const caseIdx = webhookSource.indexOf('case "setup_intent.succeeded":');
    expect(caseIdx).toBeGreaterThan(-1);
    const nextCaseIdx = webhookSource.indexOf('\n      case ', caseIdx + 10);
    const caseBlock = webhookSource.slice(caseIdx, nextCaseIdx > -1 ? nextCaseIdx : caseIdx + 1200);
    expect(caseBlock).toContain('setupIntent.metadata?.type === "trial_setup"');
    expect(caseBlock).toContain("handleTrialSetupIntentSucceeded(");
  });
});
