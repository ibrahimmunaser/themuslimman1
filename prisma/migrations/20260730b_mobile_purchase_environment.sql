-- ============================================================
-- Migration: MobilePurchase.environment
-- Date: 2026-07-30 (Audit H7 remediation — Apple JWS environment claim
--   never checked/logged)
-- Description: Adds a nullable text column recording the verified
--   environment/type of a mobile purchase:
--     Apple StoreKit 2 JWS / classic receipt -> "Production" | "Sandbox"
--     Google Play                            -> "Test" | "Promo" | "Rewarded" | null
--
-- Why: StoreKit 2 signs Sandbox and Production transactions with the exact
--   same Apple root CA chain — a cryptographically valid signature alone does
--   NOT prove a transaction came from the real store. Google Play similarly
--   flags license-tester/promo/rewarded-ad purchases distinctly from real
--   paid ones. Previously this info was only ever buried inside the
--   `rawResponse` JSON blob (if not truncated away), with no queryable signal
--   and no explicit code path treating it differently. This column makes it
--   directly queryable so a spike of non-Production purchases in production
--   (e.g. someone attempting to get free access via a Sandbox Apple ID) can
--   be spotted and investigated without breaking App Review or the existing
--   Sandbox-based manual QA flow documented in STORE_RELEASE_CHECKLIST.md
--   (both of which legitimately generate Sandbox transactions against this
--   exact production endpoint).
--
-- Safety properties (same approach as sibling migrations in this folder):
-- single transaction, IF NOT EXISTS for idempotent re-runs, strict
-- post-migration verification that fails the transaction on any mismatch.
-- Adds a nullable column only — does not touch any existing row's other data.
-- ============================================================

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

ALTER TABLE "MobilePurchase"
  ADD COLUMN IF NOT EXISTS "environment" TEXT;

-- ── Post-migration verification — fails the whole transaction on any mismatch ──
DO $$
DECLARE
  actual_type TEXT;
  actual_nullable TEXT;
BEGIN
  SELECT data_type, is_nullable INTO actual_type, actual_nullable
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'MobilePurchase' AND column_name = 'environment';

  IF actual_type IS NULL THEN
    RAISE EXCEPTION 'Verification failed: MobilePurchase.environment was not created';
  END IF;
  IF actual_type IS DISTINCT FROM 'text' THEN
    RAISE EXCEPTION 'Verification failed: MobilePurchase.environment is type=% (expected text)', actual_type;
  END IF;
  IF actual_nullable IS DISTINCT FROM 'YES' THEN
    RAISE EXCEPTION 'Verification failed: MobilePurchase.environment is nullable=% (expected YES)', actual_nullable;
  END IF;

  RAISE NOTICE 'Verification passed: MobilePurchase.environment is a nullable text column.';
END $$;

COMMIT;
