-- ============================================================
-- Migration: StripeWebhookEvent idempotency table
-- Date: 2026-07-06 (follow-up hardening pass)
-- Description: Adds a durable, uniquely-constrained table of processed
--   Stripe webhook event IDs. Used inside a DB transaction alongside the
--   Subscription update in handleInvoicePaymentFailed so that concurrent
--   or redelivered webhooks for the same event ID cannot double-process.
--
-- Safety properties: see notes in 20260706_subscription_renewal_failure.sql —
--   same approach here (single transaction, IF NOT EXISTS for idempotent
--   re-runs, strict post-migration verification that fails the transaction
--   on any mismatch). Creates a brand-new, currently-empty table only —
--   does not touch any existing table, row, or constraint.
-- ============================================================

BEGIN;

-- Transaction-local safety timeouts — see 20260706_subscription_renewal_failure.sql
-- for rationale. CREATE TABLE on a brand-new table name is very unlikely to
-- contend for a lock, but this keeps both migrations consistent and fails
-- fast rather than hanging if something unexpected is holding a catalog lock.
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

CREATE TABLE IF NOT EXISTS "StripeWebhookEvent" (
  "id"            TEXT        PRIMARY KEY,
  "stripeEventId" TEXT        NOT NULL,
  "eventType"     TEXT        NOT NULL,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "StripeWebhookEvent_stripeEventId_key"
  ON "StripeWebhookEvent" ("stripeEventId");

CREATE INDEX IF NOT EXISTS "StripeWebhookEvent_createdAt_idx"
  ON "StripeWebhookEvent" ("createdAt");

CREATE INDEX IF NOT EXISTS "StripeWebhookEvent_eventType_idx"
  ON "StripeWebhookEvent" ("eventType");

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
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'StripeWebhookEvent') THEN
    RAISE EXCEPTION 'Verification failed: table StripeWebhookEvent was not created';
  END IF;

  -- No unexpected extra columns — guards against a previously, partially,
  -- or hand-created table with a different shape than this migration expects.
  -- Exactly 4 columns: id, stripeEventId, eventType, createdAt.
  SELECT count(*) INTO col_count
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'StripeWebhookEvent';
  IF col_count <> 4 THEN
    RAISE EXCEPTION 'Verification failed: StripeWebhookEvent has % columns (expected exactly 4: id, stripeEventId, eventType, createdAt)', col_count;
  END IF;

  -- id: TEXT NOT NULL, and the PRIMARY KEY is specifically ON "id" (not a
  -- composite key or a PK on some other column of the same name/type).
  SELECT data_type, is_nullable INTO actual_type, actual_nullable
  FROM information_schema.columns WHERE table_schema='public' AND table_name='StripeWebhookEvent' AND column_name='id';
  IF actual_type IS DISTINCT FROM 'text' OR actual_nullable IS DISTINCT FROM 'NO' THEN
    RAISE EXCEPTION 'Verification failed: StripeWebhookEvent.id is type=% nullable=% (expected text/NO)', actual_type, actual_nullable;
  END IF;

  SELECT array_agg(kcu.column_name ORDER BY kcu.ordinal_position) INTO pk_cols
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema
  WHERE tc.table_schema = 'public' AND tc.table_name = 'StripeWebhookEvent' AND tc.constraint_type = 'PRIMARY KEY';
  IF pk_cols IS NULL THEN
    RAISE EXCEPTION 'Verification failed: StripeWebhookEvent has no PRIMARY KEY';
  END IF;
  IF pk_cols <> ARRAY['id'] THEN
    RAISE EXCEPTION 'Verification failed: StripeWebhookEvent PRIMARY KEY is on columns % (expected exactly ["id"])', pk_cols;
  END IF;

  -- stripeEventId: TEXT NOT NULL + a genuinely UNIQUE, single-column index
  -- on exactly "stripeEventId" (checked via pg_get_indexdef, same technique
  -- as the Subscription index checks in the sibling migration).
  SELECT data_type, is_nullable INTO actual_type, actual_nullable
  FROM information_schema.columns WHERE table_schema='public' AND table_name='StripeWebhookEvent' AND column_name='stripeEventId';
  IF actual_type IS DISTINCT FROM 'text' OR actual_nullable IS DISTINCT FROM 'NO' THEN
    RAISE EXCEPTION 'Verification failed: StripeWebhookEvent.stripeEventId is type=% nullable=% (expected text/NO)', actual_type, actual_nullable;
  END IF;

  SELECT indexdef INTO idx_def FROM pg_indexes
  WHERE schemaname='public' AND tablename='StripeWebhookEvent' AND indexname='StripeWebhookEvent_stripeEventId_key';
  IF idx_def IS NULL THEN
    RAISE EXCEPTION 'Verification failed: unique index StripeWebhookEvent_stripeEventId_key was not created';
  END IF;
  IF idx_def NOT ILIKE '%UNIQUE%' THEN
    RAISE EXCEPTION 'Verification failed: StripeWebhookEvent_stripeEventId_key exists but is NOT unique. Definition: %', idx_def;
  END IF;
  IF idx_def !~ '\("stripeEventId"\)\s*$' THEN
    RAISE EXCEPTION 'Verification failed: StripeWebhookEvent_stripeEventId_key is not a single-column index on exactly "stripeEventId". Definition: %', idx_def;
  END IF;

  -- eventType: TEXT NOT NULL, plus a non-unique index on exactly "eventType".
  SELECT data_type, is_nullable INTO actual_type, actual_nullable
  FROM information_schema.columns WHERE table_schema='public' AND table_name='StripeWebhookEvent' AND column_name='eventType';
  IF actual_type IS DISTINCT FROM 'text' OR actual_nullable IS DISTINCT FROM 'NO' THEN
    RAISE EXCEPTION 'Verification failed: StripeWebhookEvent.eventType is type=% nullable=% (expected text/NO)', actual_type, actual_nullable;
  END IF;

  SELECT indexdef INTO idx_def FROM pg_indexes
  WHERE schemaname='public' AND tablename='StripeWebhookEvent' AND indexname='StripeWebhookEvent_eventType_idx';
  IF idx_def IS NULL THEN
    RAISE EXCEPTION 'Verification failed: index StripeWebhookEvent_eventType_idx was not created';
  END IF;
  IF idx_def ILIKE '%UNIQUE%' THEN
    RAISE EXCEPTION 'Verification failed: StripeWebhookEvent_eventType_idx is UNIQUE (expected non-unique). Definition: %', idx_def;
  END IF;
  IF idx_def !~ '\("eventType"\)\s*$' THEN
    RAISE EXCEPTION 'Verification failed: StripeWebhookEvent_eventType_idx is not a single-column index on exactly "eventType". Definition: %', idx_def;
  END IF;

  -- createdAt: TIMESTAMPTZ NOT NULL with a now()/CURRENT_TIMESTAMP-equivalent
  -- default, plus a non-unique index on exactly "createdAt". Postgres
  -- normalizes `DEFAULT now()` to the literal text `now()` in
  -- column_default for a timestamptz column — checked case-insensitively
  -- to also tolerate an equivalent CURRENT_TIMESTAMP default.
  SELECT data_type, is_nullable, column_default INTO actual_type, actual_nullable, actual_default
  FROM information_schema.columns WHERE table_schema='public' AND table_name='StripeWebhookEvent' AND column_name='createdAt';
  IF actual_type IS DISTINCT FROM 'timestamp with time zone' OR actual_nullable IS DISTINCT FROM 'NO' THEN
    RAISE EXCEPTION 'Verification failed: StripeWebhookEvent.createdAt is type=% nullable=% (expected timestamptz/NO)', actual_type, actual_nullable;
  END IF;
  IF actual_default IS NULL OR actual_default !~* '(now\(\)|CURRENT_TIMESTAMP)' THEN
    RAISE EXCEPTION 'Verification failed: StripeWebhookEvent.createdAt default is % (expected now()/CURRENT_TIMESTAMP-equivalent)', actual_default;
  END IF;

  SELECT indexdef INTO idx_def FROM pg_indexes
  WHERE schemaname='public' AND tablename='StripeWebhookEvent' AND indexname='StripeWebhookEvent_createdAt_idx';
  IF idx_def IS NULL THEN
    RAISE EXCEPTION 'Verification failed: index StripeWebhookEvent_createdAt_idx was not created';
  END IF;
  IF idx_def ILIKE '%UNIQUE%' THEN
    RAISE EXCEPTION 'Verification failed: StripeWebhookEvent_createdAt_idx is UNIQUE (expected non-unique). Definition: %', idx_def;
  END IF;
  IF idx_def !~ '\("createdAt"\)\s*$' THEN
    RAISE EXCEPTION 'Verification failed: StripeWebhookEvent_createdAt_idx is not a single-column index on exactly "createdAt". Definition: %', idx_def;
  END IF;

  RAISE NOTICE 'Verification passed: StripeWebhookEvent has exactly 4 columns, PK on "id" only, a genuinely unique single-column index on "stripeEventId", non-unique single-column indexes on "eventType" and "createdAt", and createdAt has a now()-equivalent default.';
END $$;

COMMIT;
