-- ============================================================
-- Migration: User.hasSeenArabicAnnouncement
-- Date: 2026-08-10
-- Description: Adds a boolean column tracking whether a student has ever
--   dismissed or acted on the one-time dashboard banner announcing that the
--   full Seerah course is now available in Arabic.
--
-- Why: The banner must show exactly once per account (not once per learner
--   profile, and not once per browser/device) so it needs to be persisted
--   server-side on the User row rather than in localStorage.
--
-- Defaults to FALSE so every existing account is treated as "not yet seen".
-- This is safe — existing students simply get the banner once on their next
-- dashboard visit, which they can immediately dismiss.
--
-- Safety properties (same approach as sibling migrations in this folder):
-- single transaction, IF NOT EXISTS for idempotent re-runs, strict
-- post-migration verification that fails the transaction on any mismatch.
-- Adds a column with a default only — does not touch any existing row's
-- other data or any constraint.
-- ============================================================

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "hasSeenArabicAnnouncement" BOOLEAN NOT NULL DEFAULT false;

-- ── Post-migration verification — fails the whole transaction on any mismatch ──
DO $$
DECLARE
  actual_type TEXT;
  actual_nullable TEXT;
  actual_default TEXT;
BEGIN
  SELECT data_type, is_nullable, column_default INTO actual_type, actual_nullable, actual_default
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'hasSeenArabicAnnouncement';

  IF actual_type IS NULL THEN
    RAISE EXCEPTION 'Verification failed: User.hasSeenArabicAnnouncement was not created';
  END IF;
  IF actual_type IS DISTINCT FROM 'boolean' THEN
    RAISE EXCEPTION 'Verification failed: User.hasSeenArabicAnnouncement is type=% (expected boolean)', actual_type;
  END IF;
  IF actual_nullable IS DISTINCT FROM 'NO' THEN
    RAISE EXCEPTION 'Verification failed: User.hasSeenArabicAnnouncement is nullable=% (expected NO)', actual_nullable;
  END IF;
  IF actual_default IS NULL OR actual_default !~* 'false' THEN
    RAISE EXCEPTION 'Verification failed: User.hasSeenArabicAnnouncement default is % (expected false)', actual_default;
  END IF;

  RAISE NOTICE 'Verification passed: User.hasSeenArabicAnnouncement is a NOT NULL boolean column defaulting to false.';
END $$;

COMMIT;
