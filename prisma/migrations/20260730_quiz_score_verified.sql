-- ============================================================
-- Migration: PartProgress.quizScoreVerified
-- Date: 2026-07-30 (Audit C4 remediation — quiz-score forgery trust gap)
-- Description: Adds a boolean column tracking whether a part's current
--   quizBestScore was recomputed server-side from raw per-question answers
--   (via computeQuizScore in lib/progress.ts) or merely trusted as-sent by
--   an older/offline client with no answers to re-grade against.
--
-- Why: /api/mobile-progress/bulk-sync merges locally-cached quiz scores when
--   a device signs in/up. Newer app builds cache raw answers alongside the
--   score so bulk-sync can recompute and verify it — but older app builds
--   (and any local SQLite/SharedPreferences tampering) only have the raw
--   number, which bulk-sync has always had to trust as a graceful fallback.
--   Without this column, a once-forged score becomes byte-for-byte
--   indistinguishable from a real, verified one in "PartProgress" forever,
--   silently counting toward certificate eligibility. Both the web
--   certificate page and /api/mobile-progress/get now require
--   quizScoreVerified = true (alongside quizPassed) before a part counts.
--
-- Defaults to TRUE so existing rows (all recorded through server-validated
-- paths before this trust gap was even identified) are not retroactively
-- invalidated — only the specific legacy-fallback path in bulk-sync will
-- ever write FALSE going forward.
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

ALTER TABLE "PartProgress"
  ADD COLUMN IF NOT EXISTS "quizScoreVerified" BOOLEAN NOT NULL DEFAULT true;

-- ── Post-migration verification — fails the whole transaction on any mismatch ──
DO $$
DECLARE
  actual_type TEXT;
  actual_nullable TEXT;
  actual_default TEXT;
BEGIN
  SELECT data_type, is_nullable, column_default INTO actual_type, actual_nullable, actual_default
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'PartProgress' AND column_name = 'quizScoreVerified';

  IF actual_type IS NULL THEN
    RAISE EXCEPTION 'Verification failed: PartProgress.quizScoreVerified was not created';
  END IF;
  IF actual_type IS DISTINCT FROM 'boolean' THEN
    RAISE EXCEPTION 'Verification failed: PartProgress.quizScoreVerified is type=% (expected boolean)', actual_type;
  END IF;
  IF actual_nullable IS DISTINCT FROM 'NO' THEN
    RAISE EXCEPTION 'Verification failed: PartProgress.quizScoreVerified is nullable=% (expected NO)', actual_nullable;
  END IF;
  IF actual_default IS NULL OR actual_default !~* 'true' THEN
    RAISE EXCEPTION 'Verification failed: PartProgress.quizScoreVerified default is % (expected true)', actual_default;
  END IF;

  RAISE NOTICE 'Verification passed: PartProgress.quizScoreVerified is a NOT NULL boolean column defaulting to true.';
END $$;

COMMIT;
