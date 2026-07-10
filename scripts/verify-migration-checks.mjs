/**
 * Regression test for the PL/pgSQL post-migration verification blocks in:
 *   - prisma/migrations/20260706_subscription_renewal_failure.sql
 *   - prisma/migrations/20260706b_stripe_webhook_event_idempotency.sql
 *
 * These verification blocks are PL/pgSQL (DO $$ ... $$ blocks) — vitest/mocked
 * Prisma tests cannot exercise them because they run entirely inside Postgres.
 * This script proves each block correctly RAISEs EXCEPTION on a broken/
 * misdefined prior state (wrong index column, wrong uniqueness, missing
 * default, unexpected extra column, wrong PRIMARY KEY) and correctly PASSES
 * on a genuinely correct state.
 *
 * SAFE TO RUN AGAINST PRODUCTION: every scenario runs inside its own
 * `BEGIN ... ROLLBACK` — nothing is ever committed, regardless of whether the
 * scenario is expected to pass or fail. The real Subscription table only has
 * a transient index created and rolled back within the same transaction.
 *
 * The verification block text is extracted directly from the real migration
 * files (not duplicated/copy-pasted here), so this test can't silently drift
 * out of sync with the actual migration SQL that will be applied.
 *
 * Usage:
 *   node scripts/verify-migration-checks.mjs
 *
 * Exit code 0 if all scenarios behave as expected, 1 otherwise.
 */

import { config } from "dotenv";
config();
import { readFileSync } from "fs";
import { Client } from "pg";

const client = new Client({ connectionString: process.env.DIRECT_URL });
await client.connect();

function extractVerificationBlock(sqlFile) {
  const sql = readFileSync(sqlFile, "utf8");
  const start = sql.indexOf("DO $$");
  const end = sql.indexOf("END $$;", start) + "END $$;".length;
  if (start === -1 || end === -1) throw new Error(`Could not extract DO block from ${sqlFile}`);
  return sql.slice(start, end);
}

const mig1Verify = extractVerificationBlock("prisma/migrations/20260706_subscription_renewal_failure.sql");
const mig2Verify = extractVerificationBlock("prisma/migrations/20260706b_stripe_webhook_event_idempotency.sql");

let passed = 0, failed = 0;

async function scenario(name, setupSql, verifySql, expectFailure, expectedMessageFragment) {
  try {
    await client.query("BEGIN");
    await client.query(setupSql);
    let threw = false;
    let errMsg = "";
    try {
      await client.query(verifySql);
    } catch (err) {
      threw = true;
      errMsg = err.message;
    }
    if (expectFailure) {
      if (threw && (!expectedMessageFragment || errMsg.includes(expectedMessageFragment))) {
        console.log(`✅ PASS: ${name}\n   -> correctly raised: ${errMsg.split("\n")[0]}`);
        passed++;
      } else if (threw) {
        console.log(`❌ FAIL: ${name}\n   -> raised, but message didn't match expected fragment "${expectedMessageFragment}". Got: ${errMsg}`);
        failed++;
      } else {
        console.log(`❌ FAIL: ${name}\n   -> expected verification to RAISE EXCEPTION, but it passed silently`);
        failed++;
      }
    } else {
      if (!threw) {
        console.log(`✅ PASS: ${name}\n   -> correctly passed verification with no exception`);
        passed++;
      } else {
        console.log(`❌ FAIL: ${name}\n   -> expected verification to pass, but it raised: ${errMsg}`);
        failed++;
      }
    }
  } finally {
    await client.query("ROLLBACK");
  }
}

console.log("=== Migration 1 (Subscription columns/indexes) checks ===\n");

await scenario(
  "mig1: Subscription_gracePeriodEndsAt_idx exists but points at the wrong column",
  `
    CREATE INDEX "Subscription_gracePeriodEndsAt_idx" ON "Subscription" ("currentPeriodEnd");
    ALTER TABLE "Subscription"
      ADD COLUMN IF NOT EXISTS "gracePeriodEndsAt"       TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS "renewalAttemptCount"      INTEGER     NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "lastPaymentFailedAt"      TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS "lastFailedInvoiceId"      TEXT,
      ADD COLUMN IF NOT EXISTS "lastFailedStripeEventId"  TEXT;
    CREATE INDEX IF NOT EXISTS "Subscription_lastFailedInvoiceId_idx" ON "Subscription" ("lastFailedInvoiceId");
  `,
  mig1Verify,
  true,
  'not a single-column index on exactly "gracePeriodEndsAt"',
);

await scenario(
  "mig1: Subscription_lastFailedInvoiceId_idx exists but is UNIQUE (should be non-unique)",
  `
    ALTER TABLE "Subscription"
      ADD COLUMN IF NOT EXISTS "gracePeriodEndsAt"       TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS "renewalAttemptCount"      INTEGER     NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "lastPaymentFailedAt"      TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS "lastFailedInvoiceId"      TEXT,
      ADD COLUMN IF NOT EXISTS "lastFailedStripeEventId"  TEXT;
    CREATE INDEX IF NOT EXISTS "Subscription_gracePeriodEndsAt_idx" ON "Subscription" ("gracePeriodEndsAt");
    CREATE UNIQUE INDEX "Subscription_lastFailedInvoiceId_idx" ON "Subscription" ("lastFailedInvoiceId");
  `,
  mig1Verify,
  true,
  "is UNIQUE (expected non-unique)",
);

await scenario(
  "mig1: correctly-applied columns and indexes pass verification",
  `
    ALTER TABLE "Subscription"
      ADD COLUMN IF NOT EXISTS "gracePeriodEndsAt"       TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS "renewalAttemptCount"      INTEGER     NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "lastPaymentFailedAt"      TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS "lastFailedInvoiceId"      TEXT,
      ADD COLUMN IF NOT EXISTS "lastFailedStripeEventId"  TEXT;
    CREATE INDEX IF NOT EXISTS "Subscription_gracePeriodEndsAt_idx" ON "Subscription" ("gracePeriodEndsAt");
    CREATE INDEX IF NOT EXISTS "Subscription_lastFailedInvoiceId_idx" ON "Subscription" ("lastFailedInvoiceId");
  `,
  mig1Verify,
  false,
);

console.log("\n=== Migration 2 (StripeWebhookEvent table) checks ===\n");

await scenario(
  "mig2: StripeWebhookEvent_stripeEventId_key exists but is NOT unique",
  `
    CREATE TABLE "StripeWebhookEvent" (
      "id" TEXT PRIMARY KEY, "stripeEventId" TEXT NOT NULL, "eventType" TEXT NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX "StripeWebhookEvent_stripeEventId_key" ON "StripeWebhookEvent" ("stripeEventId");
    CREATE INDEX "StripeWebhookEvent_createdAt_idx" ON "StripeWebhookEvent" ("createdAt");
    CREATE INDEX "StripeWebhookEvent_eventType_idx" ON "StripeWebhookEvent" ("eventType");
  `,
  mig2Verify,
  true,
  "exists but is NOT unique",
);

await scenario(
  "mig2: StripeWebhookEvent.createdAt missing its now()-equivalent default",
  `
    CREATE TABLE "StripeWebhookEvent" (
      "id" TEXT PRIMARY KEY, "stripeEventId" TEXT NOT NULL, "eventType" TEXT NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL
    );
    CREATE UNIQUE INDEX "StripeWebhookEvent_stripeEventId_key" ON "StripeWebhookEvent" ("stripeEventId");
    CREATE INDEX "StripeWebhookEvent_createdAt_idx" ON "StripeWebhookEvent" ("createdAt");
    CREATE INDEX "StripeWebhookEvent_eventType_idx" ON "StripeWebhookEvent" ("eventType");
  `,
  mig2Verify,
  true,
  "createdAt default is",
);

await scenario(
  "mig2: StripeWebhookEvent has an unexpected extra column",
  `
    CREATE TABLE "StripeWebhookEvent" (
      "id" TEXT PRIMARY KEY, "stripeEventId" TEXT NOT NULL, "eventType" TEXT NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(), "extraColumn" TEXT
    );
    CREATE UNIQUE INDEX "StripeWebhookEvent_stripeEventId_key" ON "StripeWebhookEvent" ("stripeEventId");
    CREATE INDEX "StripeWebhookEvent_createdAt_idx" ON "StripeWebhookEvent" ("createdAt");
    CREATE INDEX "StripeWebhookEvent_eventType_idx" ON "StripeWebhookEvent" ("eventType");
  `,
  mig2Verify,
  true,
  "columns (expected exactly 4",
);

await scenario(
  "mig2: PRIMARY KEY is not on \"id\" alone",
  `
    CREATE TABLE "StripeWebhookEvent" (
      "id" TEXT NOT NULL, "stripeEventId" TEXT NOT NULL, "eventType" TEXT NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY ("id", "stripeEventId")
    );
    CREATE UNIQUE INDEX "StripeWebhookEvent_stripeEventId_key" ON "StripeWebhookEvent" ("stripeEventId");
    CREATE INDEX "StripeWebhookEvent_createdAt_idx" ON "StripeWebhookEvent" ("createdAt");
    CREATE INDEX "StripeWebhookEvent_eventType_idx" ON "StripeWebhookEvent" ("eventType");
  `,
  mig2Verify,
  true,
  "PRIMARY KEY is on columns",
);

await scenario(
  "mig2: correctly-created table passes verification",
  `
    CREATE TABLE "StripeWebhookEvent" (
      "id" TEXT PRIMARY KEY, "stripeEventId" TEXT NOT NULL, "eventType" TEXT NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX "StripeWebhookEvent_stripeEventId_key" ON "StripeWebhookEvent" ("stripeEventId");
    CREATE INDEX "StripeWebhookEvent_createdAt_idx" ON "StripeWebhookEvent" ("createdAt");
    CREATE INDEX "StripeWebhookEvent_eventType_idx" ON "StripeWebhookEvent" ("eventType");
  `,
  mig2Verify,
  false,
);

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);

await client.end();
process.exit(failed > 0 ? 1 : 0);
