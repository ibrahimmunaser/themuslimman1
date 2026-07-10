/**
 * Read-only post-backfill verification.
 *
 * Run this AFTER both migrations and the real backfill (scripts/backfill-past-due-grace.mjs)
 * have completed, and BEFORE deploying the new application code.
 *
 * Confirms:
 *  1. Every currently-past_due Subscription row has all 5 backfill fields populated
 *     (gracePeriodEndsAt, renewalAttemptCount, lastPaymentFailedAt, lastFailedInvoiceId,
 *     lastFailedStripeEventId is reported but allowed to be null if Stripe had no
 *     matching event).
 *  2. Total Subscription row count is unchanged from the pre-migration baseline
 *     (pass via --expect-count=N, defaults to 194 — the count captured during
 *     this deployment's preflight).
 *  3. No Subscription row OTHER than the past_due candidate(s) was modified —
 *     checked by comparing `updatedAt` against a "before" timestamp you pass in
 *     via --since="<ISO timestamp captured immediately before running the real
 *     backfill>". Every row with updatedAt > that timestamp must be one of the
 *     candidates being verified in check #1 — if any OTHER row shows up, that is
 *     an unexpected side effect and this script exits non-zero.
 *  4. StripeWebhookEvent is empty (0 rows) — expected until the new application
 *     code starts processing real webhooks.
 *  5. hasActiveCourseAccess's exact SQL condition for past_due
 *     (status='past_due' AND gracePeriodEndsAt >= now()) is evaluated directly
 *     against each candidate row, so you can compare it to what the dry run
 *     predicted before approving deployment.
 *
 * Usage:
 *   node scripts/verify-backfill.mjs --expect-count=194 --since="2026-07-08T00:00:00.000Z"
 *
 * Exit code 0 only if all checks pass.
 */

import { config } from "dotenv";
config();
import { Client } from "pg";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);

const expectCount = args["expect-count"] ? parseInt(args["expect-count"], 10) : 194;
const since = args["since"] ? new Date(args["since"]) : null;

if (!since) {
  console.error("ERROR: --since=\"<ISO timestamp captured immediately before the real backfill run>\" is required.");
  process.exit(1);
}

const client = new Client({ connectionString: process.env.DIRECT_URL });
await client.connect();

let failed = false;
function check(label, ok, detail) {
  console.log(`${ok ? "✅" : "❌"} ${label}${detail ? `\n   ${detail}` : ""}`);
  if (!ok) failed = true;
}

// ── Check 1 & 5: every past_due row has the 5 fields populated, and the exact
//    access-control condition is evaluated directly ────────────────────────
const pastDue = await client.query(`
  SELECT id, "userId", "stripeSubscriptionId", status,
         "gracePeriodEndsAt", "renewalAttemptCount", "lastPaymentFailedAt",
         "lastFailedInvoiceId", "lastFailedStripeEventId", "updatedAt",
         ("gracePeriodEndsAt" IS NOT NULL AND "gracePeriodEndsAt" >= now()) AS grants_access_now
  FROM "Subscription"
  WHERE status = 'past_due'
  ORDER BY "updatedAt" DESC
`);

console.log(`\n=== ${pastDue.rows.length} past_due row(s) ===`);
for (const row of pastDue.rows) {
  const redactedId = row.id.slice(0, 8) + "…";
  const redactedUser = row.userId.slice(0, 8) + "…";
  const redactedSub = row.stripeSubscriptionId.slice(0, 10) + "…";
  console.log(`\n  row=${redactedId} user=${redactedUser} sub=${redactedSub}`);
  console.log(`    gracePeriodEndsAt       = ${row.gracePeriodEndsAt?.toISOString() ?? "NULL"}`);
  console.log(`    renewalAttemptCount     = ${row.renewalAttemptCount}`);
  console.log(`    lastPaymentFailedAt     = ${row.lastPaymentFailedAt?.toISOString() ?? "NULL"}`);
  console.log(`    lastFailedInvoiceId     = ${row.lastFailedInvoiceId ?? "NULL"}`);
  console.log(`    lastFailedStripeEventId = ${row.lastFailedStripeEventId ?? "NULL (no matching Stripe event found — allowed)"}`);
  console.log(`    hasActiveCourseAccess (past_due branch) = ${row.grants_access_now}`);

  check(
    `  ${redactedId}: gracePeriodEndsAt/renewalAttemptCount/lastPaymentFailedAt/lastFailedInvoiceId are all populated`,
    row.gracePeriodEndsAt !== null &&
      row.renewalAttemptCount > 0 &&
      row.lastPaymentFailedAt !== null &&
      row.lastFailedInvoiceId !== null,
  );
}

// ── Check 2: total row count unchanged ──────────────────────────────────────
const totalCount = await client.query(`SELECT count(*)::int AS n FROM "Subscription"`);
check(
  `Total Subscription row count is ${expectCount} (unchanged)`,
  totalCount.rows[0].n === expectCount,
  `actual=${totalCount.rows[0].n} expected=${expectCount}`,
);

// ── Check 3: no OTHER row was modified since the captured "before" timestamp ──
const changedSince = await client.query(
  `SELECT id, "updatedAt" FROM "Subscription" WHERE "updatedAt" > $1`,
  [since],
);
const pastDueIds = new Set(pastDue.rows.map((r) => r.id));
const unexpectedChanges = changedSince.rows.filter((r) => !pastDueIds.has(r.id));
check(
  `No Subscription row OTHER than the verified past_due candidate(s) was modified since ${since.toISOString()}`,
  unexpectedChanges.length === 0,
  unexpectedChanges.length > 0
    ? `UNEXPECTED: ${unexpectedChanges.length} other row(s) changed: ${unexpectedChanges.map((r) => r.id.slice(0, 8) + "…").join(", ")}`
    : `${changedSince.rows.length} row(s) changed since then, all accounted for as verified candidates`,
);

// ── Check 4: StripeWebhookEvent still empty ─────────────────────────────────
const webhookEventCount = await client.query(`SELECT count(*)::int AS n FROM "StripeWebhookEvent"`);
check(
  `StripeWebhookEvent is empty (no webhooks processed by new code yet)`,
  webhookEventCount.rows[0].n === 0,
  `actual=${webhookEventCount.rows[0].n}`,
);

console.log(`\n=== ${failed ? "FAILED — see ❌ above" : "ALL CHECKS PASSED"} ===`);

await client.end();
process.exit(failed ? 1 : 0);
