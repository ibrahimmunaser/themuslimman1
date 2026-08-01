-- ============================================================
-- Migration: MobilePurchase.possibleDuplicate
-- Date: 2026-07-30 (Audit M-double-charge remediation — no backend flag
--   for cross-platform double purchase)
-- Description: Adds a non-null boolean column (default false) flagging a
--   MobilePurchase row where the user already had active course access
--   through some OTHER source at the moment this transaction was first
--   verified — e.g. an active Stripe subscription/lifetime purchase on the
--   web, or a different already-active MobilePurchase (a second platform's
--   IAP). Set once at creation by /api/mobile-purchases/verify; never
--   touched again on renewal updates.
--
-- Why: The client already disables the Buy button once hasAccess is true
--   (landing_screen.dart / pricing_screen.dart), but that's a soft,
--   best-effort UI guard — a stale local access cache, an OS-queued
--   transaction auto-completed by IAPNotifier's purchase-stream listener at
--   app launch, or simply buying on a second platform can all still reach
--   the verify endpoint with a genuinely valid, chargeable receipt. Apple
--   and Google purchases cannot be blocked or auto-refunded server-side, so
--   this column exists purely to make double charges queryable/auditable
--   (e.g. `SELECT * FROM "MobilePurchase" WHERE "possibleDuplicate" = true`)
--   instead of silently invisible until a customer complains.
--
-- Safety properties (same approach as sibling migrations in this folder):
-- single transaction, IF NOT EXISTS for idempotent re-runs, strict
-- post-migration verification that fails the transaction on any mismatch.
-- Adds a NOT NULL column with a DEFAULT, so existing rows backfill to false
-- automatically — no separate UPDATE pass needed.
-- ============================================================

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

ALTER TABLE "MobilePurchase"
  ADD COLUMN IF NOT EXISTS "possibleDuplicate" BOOLEAN NOT NULL DEFAULT false;

-- ── Post-migration verification — fails the whole transaction on any mismatch ──
DO $$
DECLARE
  actual_type TEXT;
  actual_nullable TEXT;
  actual_default TEXT;
BEGIN
  SELECT data_type, is_nullable, column_default
    INTO actual_type, actual_nullable, actual_default
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'MobilePurchase' AND column_name = 'possibleDuplicate';

  IF actual_type IS NULL THEN
    RAISE EXCEPTION 'Verification failed: MobilePurchase.possibleDuplicate was not created';
  END IF;
  IF actual_type IS DISTINCT FROM 'boolean' THEN
    RAISE EXCEPTION 'Verification failed: MobilePurchase.possibleDuplicate is type=% (expected boolean)', actual_type;
  END IF;
  IF actual_nullable IS DISTINCT FROM 'NO' THEN
    RAISE EXCEPTION 'Verification failed: MobilePurchase.possibleDuplicate is nullable=% (expected NO)', actual_nullable;
  END IF;
  IF actual_default NOT ILIKE 'false%' THEN
    RAISE EXCEPTION 'Verification failed: MobilePurchase.possibleDuplicate default=% (expected false)', actual_default;
  END IF;

  RAISE NOTICE 'Verification passed: MobilePurchase.possibleDuplicate is a NOT NULL boolean column defaulting to false.';
END $$;

COMMIT;
