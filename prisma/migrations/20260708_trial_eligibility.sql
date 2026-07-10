-- ============================================================
-- Migration: TrialEligibility one-trial-per-user-per-course claim table
-- Date: 2026-07-08 (BLK-02 remediation — trial subscription provisioning)
-- Description: Adds a durable, uniquely-constrained claim table used by the
--   setup_intent.succeeded webhook handler (handleTrialSetupIntentSucceeded in
--   app/api/stripe/webhook/route.ts) to guarantee at most one live Stripe trial
--   subscription is ever created per (userId, courseKey), even when two
--   SetupIntents for the same user race concurrently.
--
-- Why a DB unique constraint and not just a Prisma transaction: the actual
-- side effect being protected (stripe.subscriptions.create) is an external
-- network call. A Prisma transaction cannot atomically wrap a Stripe API
-- call, so the claim row is inserted (DB-only, no network) BEFORE Stripe is
-- ever called; the unique constraint is what makes a losing concurrent
-- claim fail fast, before it can create a duplicate Stripe subscription.
--
-- Safety properties (same approach as 20260706_subscription_renewal_failure.sql
-- and 20260706b_stripe_webhook_event_idempotency.sql): single transaction,
-- IF NOT EXISTS for idempotent re-runs, strict post-migration verification
-- that fails the transaction on any mismatch. Creates a brand-new, currently
-- empty table only — does not touch any existing table, row, or constraint.
-- ============================================================

BEGIN;

-- Transaction-local safety timeouts — see sibling migrations for rationale.
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

CREATE TABLE IF NOT EXISTS "TrialEligibility" (
  "id"            TEXT        PRIMARY KEY,
  "userId"        TEXT        NOT NULL,
  "courseKey"     TEXT        NOT NULL,
  "setupIntentId" TEXT        NOT NULL,
  "stripeSubId"   TEXT,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "TrialEligibility_userId_courseKey_key"
  ON "TrialEligibility" ("userId", "courseKey");

CREATE UNIQUE INDEX IF NOT EXISTS "TrialEligibility_setupIntentId_key"
  ON "TrialEligibility" ("setupIntentId");

-- ── Post-migration verification — fails the whole transaction on any mismatch ──
DO $$
DECLARE
  actual_type TEXT;
  actual_nullable TEXT;
  actual_default TEXT;
  idx_def TEXT;
  col_count INTEGER;
  pk_cols TEXT[];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'TrialEligibility') THEN
    RAISE EXCEPTION 'Verification failed: table TrialEligibility was not created';
  END IF;

  -- Exactly 6 columns: id, userId, courseKey, setupIntentId, stripeSubId, createdAt.
  SELECT count(*) INTO col_count
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'TrialEligibility';
  IF col_count <> 6 THEN
    RAISE EXCEPTION 'Verification failed: TrialEligibility has % columns (expected exactly 6: id, userId, courseKey, setupIntentId, stripeSubId, createdAt)', col_count;
  END IF;

  -- id: TEXT NOT NULL, PRIMARY KEY specifically on "id".
  SELECT data_type, is_nullable INTO actual_type, actual_nullable
  FROM information_schema.columns WHERE table_schema='public' AND table_name='TrialEligibility' AND column_name='id';
  IF actual_type IS DISTINCT FROM 'text' OR actual_nullable IS DISTINCT FROM 'NO' THEN
    RAISE EXCEPTION 'Verification failed: TrialEligibility.id is type=% nullable=% (expected text/NO)', actual_type, actual_nullable;
  END IF;

  SELECT array_agg(kcu.column_name ORDER BY kcu.ordinal_position) INTO pk_cols
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema
  WHERE tc.table_schema = 'public' AND tc.table_name = 'TrialEligibility' AND tc.constraint_type = 'PRIMARY KEY';
  IF pk_cols IS NULL THEN
    RAISE EXCEPTION 'Verification failed: TrialEligibility has no PRIMARY KEY';
  END IF;
  IF pk_cols <> ARRAY['id'] THEN
    RAISE EXCEPTION 'Verification failed: TrialEligibility PRIMARY KEY is on columns % (expected exactly ["id"])', pk_cols;
  END IF;

  -- userId: TEXT NOT NULL.
  SELECT data_type, is_nullable INTO actual_type, actual_nullable
  FROM information_schema.columns WHERE table_schema='public' AND table_name='TrialEligibility' AND column_name='userId';
  IF actual_type IS DISTINCT FROM 'text' OR actual_nullable IS DISTINCT FROM 'NO' THEN
    RAISE EXCEPTION 'Verification failed: TrialEligibility.userId is type=% nullable=% (expected text/NO)', actual_type, actual_nullable;
  END IF;

  -- courseKey: TEXT NOT NULL.
  SELECT data_type, is_nullable INTO actual_type, actual_nullable
  FROM information_schema.columns WHERE table_schema='public' AND table_name='TrialEligibility' AND column_name='courseKey';
  IF actual_type IS DISTINCT FROM 'text' OR actual_nullable IS DISTINCT FROM 'NO' THEN
    RAISE EXCEPTION 'Verification failed: TrialEligibility.courseKey is type=% nullable=% (expected text/NO)', actual_type, actual_nullable;
  END IF;

  -- (userId, courseKey): genuinely UNIQUE, exactly those two columns, in that order.
  -- pg_get_indexdef (surfaced via pg_indexes.indexdef) reconstructs the exact
  -- column list, so anchoring on "(userId, courseKey)" proves both the column
  -- set AND the absence of extra columns.
  SELECT indexdef INTO idx_def FROM pg_indexes
  WHERE schemaname='public' AND tablename='TrialEligibility' AND indexname='TrialEligibility_userId_courseKey_key';
  IF idx_def IS NULL THEN
    RAISE EXCEPTION 'Verification failed: unique index TrialEligibility_userId_courseKey_key was not created';
  END IF;
  IF idx_def NOT ILIKE '%UNIQUE%' THEN
    RAISE EXCEPTION 'Verification failed: TrialEligibility_userId_courseKey_key exists but is NOT unique. Definition: %', idx_def;
  END IF;
  IF idx_def !~ '\("userId", "courseKey"\)\s*$' THEN
    RAISE EXCEPTION 'Verification failed: TrialEligibility_userId_courseKey_key is not a unique index on exactly ("userId", "courseKey"). Definition: %', idx_def;
  END IF;

  -- setupIntentId: TEXT NOT NULL + a genuinely UNIQUE, single-column index.
  SELECT data_type, is_nullable INTO actual_type, actual_nullable
  FROM information_schema.columns WHERE table_schema='public' AND table_name='TrialEligibility' AND column_name='setupIntentId';
  IF actual_type IS DISTINCT FROM 'text' OR actual_nullable IS DISTINCT FROM 'NO' THEN
    RAISE EXCEPTION 'Verification failed: TrialEligibility.setupIntentId is type=% nullable=% (expected text/NO)', actual_type, actual_nullable;
  END IF;

  SELECT indexdef INTO idx_def FROM pg_indexes
  WHERE schemaname='public' AND tablename='TrialEligibility' AND indexname='TrialEligibility_setupIntentId_key';
  IF idx_def IS NULL THEN
    RAISE EXCEPTION 'Verification failed: unique index TrialEligibility_setupIntentId_key was not created';
  END IF;
  IF idx_def NOT ILIKE '%UNIQUE%' THEN
    RAISE EXCEPTION 'Verification failed: TrialEligibility_setupIntentId_key exists but is NOT unique. Definition: %', idx_def;
  END IF;
  IF idx_def !~ '\("setupIntentId"\)\s*$' THEN
    RAISE EXCEPTION 'Verification failed: TrialEligibility_setupIntentId_key is not a single-column index on exactly "setupIntentId". Definition: %', idx_def;
  END IF;

  -- stripeSubId: TEXT, NULLABLE (starts null until the Stripe subscription is created).
  SELECT data_type, is_nullable INTO actual_type, actual_nullable
  FROM information_schema.columns WHERE table_schema='public' AND table_name='TrialEligibility' AND column_name='stripeSubId';
  IF actual_type IS DISTINCT FROM 'text' OR actual_nullable IS DISTINCT FROM 'YES' THEN
    RAISE EXCEPTION 'Verification failed: TrialEligibility.stripeSubId is type=% nullable=% (expected text/YES — must be nullable)', actual_type, actual_nullable;
  END IF;

  -- createdAt: TIMESTAMPTZ NOT NULL with a now()/CURRENT_TIMESTAMP-equivalent default.
  SELECT data_type, is_nullable, column_default INTO actual_type, actual_nullable, actual_default
  FROM information_schema.columns WHERE table_schema='public' AND table_name='TrialEligibility' AND column_name='createdAt';
  IF actual_type IS DISTINCT FROM 'timestamp with time zone' OR actual_nullable IS DISTINCT FROM 'NO' THEN
    RAISE EXCEPTION 'Verification failed: TrialEligibility.createdAt is type=% nullable=% (expected timestamptz/NO)', actual_type, actual_nullable;
  END IF;
  IF actual_default IS NULL OR actual_default !~* '(now\(\)|CURRENT_TIMESTAMP)' THEN
    RAISE EXCEPTION 'Verification failed: TrialEligibility.createdAt default is % (expected now()/CURRENT_TIMESTAMP-equivalent)', actual_default;
  END IF;

  RAISE NOTICE 'Verification passed: TrialEligibility has exactly 6 columns, PK on "id" only, a genuinely unique composite index on ("userId","courseKey"), a genuinely unique single-column index on "setupIntentId", stripeSubId is nullable, and createdAt has a now()-equivalent default.';
END $$;

COMMIT;
