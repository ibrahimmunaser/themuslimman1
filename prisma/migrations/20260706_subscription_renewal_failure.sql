-- ============================================================
-- Migration: Subscription renewal-failure grace period
-- Date: 2026-07-06
-- Description: Adds columns to Subscription to support a
--   configurable grace period after a failed renewal payment,
--   idempotent webhook handling per Stripe event ID + invoice,
--   and attempt-count tracking synced with invoice.attempt_count.
--
-- Safety properties:
--   - Wrapped in a single transaction: either all of ALTER TABLE +
--     both CREATE INDEX statements commit together, or none do. A
--     crash/interrupt mid-run cannot leave a partially-applied schema.
--   - Every ADD COLUMN / CREATE INDEX still carries IF NOT EXISTS so
--     the script is safe to re-run, but that alone doesn't verify an
--     existing object matches what THIS migration expects. The DO
--     block at the end re-checks every column's actual type/
--     nullability/default and every index's actual definition against
--     the expected values, and RAISEs an EXCEPTION (rolling back the
--     whole transaction) if anything differs from what's documented
--     here — so a stale/hand-edited object can't silently diverge.
--   - Pure additive DDL only: no UPDATE, DELETE, DROP, RENAME, or
--     destructive constraint change. Existing rows are not rewritten;
--     PostgreSQL 11+ adds a NOT-NULL-with-constant-default column as a
--     metadata-only operation (see rollout notes shared with the team).
-- ============================================================

BEGIN;

-- Transaction-local safety timeouts: if this migration cannot acquire the
-- ACCESS EXCLUSIVE lock on "Subscription" within 5s (e.g. a long-running
-- query or another transaction is already holding/queued on that table),
-- fail fast and roll back rather than queuing behind live traffic and
-- blocking every subsequent request on that table. statement_timeout is a
-- backstop in case the DDL itself somehow runs long. LOCAL scopes both to
-- this transaction only — they revert automatically at COMMIT/ROLLBACK.
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

ALTER TABLE "Subscription"
  ADD COLUMN IF NOT EXISTS "gracePeriodEndsAt"       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "renewalAttemptCount"      INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lastPaymentFailedAt"      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "lastFailedInvoiceId"      TEXT,
  ADD COLUMN IF NOT EXISTS "lastFailedStripeEventId"  TEXT;

-- Used by hasActiveCourseAccess: WHERE status = 'past_due' AND "gracePeriodEndsAt" >= now()
CREATE INDEX IF NOT EXISTS "Subscription_gracePeriodEndsAt_idx"
  ON "Subscription" ("gracePeriodEndsAt");

-- Used by invoice.payment_succeeded clear: WHERE "lastFailedInvoiceId" = $1
CREATE INDEX IF NOT EXISTS "Subscription_lastFailedInvoiceId_idx"
  ON "Subscription" ("lastFailedInvoiceId");

-- ── Post-migration verification — fails the whole transaction on any mismatch ──
DO $$
DECLARE
  col RECORD;
  expected_cols TEXT[][] := ARRAY[
    -- [column_name, data_type, is_nullable, column_default]
    ARRAY['gracePeriodEndsAt',        'timestamp with time zone', 'YES', NULL],
    ARRAY['renewalAttemptCount',      'integer',                  'NO',  '0'],
    ARRAY['lastPaymentFailedAt',      'timestamp with time zone', 'YES', NULL],
    ARRAY['lastFailedInvoiceId',      'text',                     'YES', NULL],
    ARRAY['lastFailedStripeEventId',  'text',                     'YES', NULL]
  ];
  row_data TEXT[];
  actual_type TEXT;
  actual_nullable TEXT;
  actual_default TEXT;
BEGIN
  FOREACH row_data SLICE 1 IN ARRAY expected_cols LOOP
    SELECT data_type, is_nullable,
           regexp_replace(column_default, '::[a-zA-Z0-9_ ]+$', '') -- strip ::type cast for comparison
      INTO actual_type, actual_nullable, actual_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Subscription' AND column_name = row_data[1];

    IF actual_type IS NULL THEN
      RAISE EXCEPTION 'Verification failed: column "%" was not created on Subscription', row_data[1];
    END IF;
    IF actual_type <> row_data[2] THEN
      RAISE EXCEPTION 'Verification failed: Subscription."%" has type % (expected %)', row_data[1], actual_type, row_data[2];
    END IF;
    IF actual_nullable <> row_data[3] THEN
      RAISE EXCEPTION 'Verification failed: Subscription."%" nullable=% (expected %)', row_data[1], actual_nullable, row_data[3];
    END IF;
    IF (row_data[4] IS NULL AND actual_default IS NOT NULL) OR (row_data[4] IS NOT NULL AND (actual_default IS NULL OR actual_default <> row_data[4])) THEN
      RAISE EXCEPTION 'Verification failed: Subscription."%" default=% (expected %)', row_data[1], actual_default, row_data[4];
    END IF;
  END LOOP;

  -- ── Index definition checks (not just existence-by-name) ──────────────
  -- A prior partial/hand-created object could exist under the same name but
  -- cover the wrong column(s) or be UNIQUE when it shouldn't be — a plain
  -- "index name exists" check would pass silently on that broken state.
  -- pg_get_indexdef() (surfaced via pg_indexes.indexdef) returns the fully
  -- reconstructed `CREATE [UNIQUE] INDEX ... ON ... (col[, col...])`
  -- statement, so a regex anchored on the trailing "(<exact column>)" proves
  -- both the column list AND that there is exactly one column, and an
  -- ILIKE '%UNIQUE%' check proves uniqueness. This does not depend on
  -- indexrelid/attnum plumbing, only on Postgres's own canonical DDL string.
  DECLARE
    idx_def TEXT;
  BEGIN
    SELECT indexdef INTO idx_def FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'Subscription' AND indexname = 'Subscription_gracePeriodEndsAt_idx';
    IF idx_def IS NULL THEN
      RAISE EXCEPTION 'Verification failed: index Subscription_gracePeriodEndsAt_idx was not created';
    END IF;
    IF idx_def ILIKE '%UNIQUE%' THEN
      RAISE EXCEPTION 'Verification failed: Subscription_gracePeriodEndsAt_idx is UNIQUE (expected non-unique). Definition: %', idx_def;
    END IF;
    IF idx_def !~ '\("gracePeriodEndsAt"\)\s*$' THEN
      RAISE EXCEPTION 'Verification failed: Subscription_gracePeriodEndsAt_idx is not a single-column index on exactly "gracePeriodEndsAt". Definition: %', idx_def;
    END IF;

    SELECT indexdef INTO idx_def FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'Subscription' AND indexname = 'Subscription_lastFailedInvoiceId_idx';
    IF idx_def IS NULL THEN
      RAISE EXCEPTION 'Verification failed: index Subscription_lastFailedInvoiceId_idx was not created';
    END IF;
    IF idx_def ILIKE '%UNIQUE%' THEN
      RAISE EXCEPTION 'Verification failed: Subscription_lastFailedInvoiceId_idx is UNIQUE (expected non-unique). Definition: %', idx_def;
    END IF;
    IF idx_def !~ '\("lastFailedInvoiceId"\)\s*$' THEN
      RAISE EXCEPTION 'Verification failed: Subscription_lastFailedInvoiceId_idx is not a single-column index on exactly "lastFailedInvoiceId". Definition: %', idx_def;
    END IF;
  END;

  RAISE NOTICE 'Verification passed: all 5 Subscription columns and 2 indexes (name, uniqueness, and exact column) match expected definitions.';
END $$;

COMMIT;
