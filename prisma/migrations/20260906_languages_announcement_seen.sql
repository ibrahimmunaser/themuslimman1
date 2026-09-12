-- ============================================================
-- Migration: User.hasSeenLanguagesAnnouncement
-- Date: 2026-09-06
-- Description: One-time flag for the English/Arabic/French launch
--   celebration modal (confetti + WhatsApp share). Defaults to false
--   so every existing account sees it once on next authenticated visit.
-- ============================================================

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "hasSeenLanguagesAnnouncement" BOOLEAN NOT NULL DEFAULT false;

DO $$
DECLARE
  actual_type TEXT;
  actual_nullable TEXT;
  actual_default TEXT;
BEGIN
  SELECT data_type, is_nullable, column_default INTO actual_type, actual_nullable, actual_default
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'hasSeenLanguagesAnnouncement';

  IF actual_type IS NULL THEN
    RAISE EXCEPTION 'Verification failed: User.hasSeenLanguagesAnnouncement was not created';
  END IF;
  IF actual_type IS DISTINCT FROM 'boolean' THEN
    RAISE EXCEPTION 'Verification failed: User.hasSeenLanguagesAnnouncement is type=% (expected boolean)', actual_type;
  END IF;
  IF actual_nullable IS DISTINCT FROM 'NO' THEN
    RAISE EXCEPTION 'Verification failed: User.hasSeenLanguagesAnnouncement is nullable=% (expected NO)', actual_nullable;
  END IF;
  IF actual_default IS NULL OR actual_default !~* 'false' THEN
    RAISE EXCEPTION 'Verification failed: User.hasSeenLanguagesAnnouncement default is % (expected false)', actual_default;
  END IF;

  RAISE NOTICE 'Verification passed: User.hasSeenLanguagesAnnouncement is a NOT NULL boolean column defaulting to false.';
END $$;

COMMIT;
