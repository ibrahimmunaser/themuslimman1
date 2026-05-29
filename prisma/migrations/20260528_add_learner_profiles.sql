-- ============================================================
-- Migration: Add Learner Profiles for Family Access Feature
-- Date: 2026-05-28
-- Description: Adds LearnerProfile table so multiple family
--   members can share one paid account with separate progress.
--   Every existing user gets one default profile, and all
--   existing PartProgress rows are migrated to that profile.
-- ============================================================

-- Step 1: Create LearnerProfile table
CREATE TABLE IF NOT EXISTS "LearnerProfile" (
  "id"          TEXT        NOT NULL,
  "userId"      TEXT        NOT NULL,
  "displayName" TEXT        NOT NULL,
  "avatar"      TEXT,
  "isDefault"   BOOLEAN     NOT NULL DEFAULT false,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "LearnerProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "LearnerProfile_userId_idx" ON "LearnerProfile"("userId");

-- Step 2: Add planType to User
-- "individual" = 1 learner profile; "family" = up to 5 learner profiles
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "planType" TEXT NOT NULL DEFAULT 'individual';

-- Step 3: Add learnerProfileId to PartProgress (nullable first for safe migration)
ALTER TABLE "PartProgress" ADD COLUMN IF NOT EXISTS "learnerProfileId" TEXT;

-- Step 4: Add learnerProfileId to StudySession (optional — backfilled below)
ALTER TABLE "StudySession" ADD COLUMN IF NOT EXISTS "learnerProfileId" TEXT;

-- Step 5: Create one default LearnerProfile for every existing user who doesn't have one yet
INSERT INTO "LearnerProfile" ("id", "userId", "displayName", "isDefault", "createdAt", "updatedAt")
SELECT
  'lp_' || replace(gen_random_uuid()::text, '-', ''),
  u."id",
  u."fullName",
  true,
  NOW(),
  NOW()
FROM "User" u
WHERE NOT EXISTS (
  SELECT 1 FROM "LearnerProfile" lp WHERE lp."userId" = u."id"
);

-- Step 6: Backfill learnerProfileId on PartProgress using the default profile
UPDATE "PartProgress" pp
SET "learnerProfileId" = lp."id"
FROM "LearnerProfile" lp
WHERE pp."userId" = lp."userId"
  AND lp."isDefault" = true
  AND pp."learnerProfileId" IS NULL;

-- Step 7: Backfill learnerProfileId on StudySession using the default profile
UPDATE "StudySession" ss
SET "learnerProfileId" = lp."id"
FROM "LearnerProfile" lp
WHERE ss."userId" = lp."userId"
  AND lp."isDefault" = true
  AND ss."learnerProfileId" IS NULL;

-- Step 8: Make learnerProfileId NOT NULL on PartProgress
-- Safe because every existing PartProgress row was just backfilled above.
ALTER TABLE "PartProgress" ALTER COLUMN "learnerProfileId" SET NOT NULL;

-- Step 9: Add FK constraint for PartProgress.learnerProfileId
ALTER TABLE "PartProgress"
  ADD CONSTRAINT "PartProgress_learnerProfileId_fkey"
  FOREIGN KEY ("learnerProfileId") REFERENCES "LearnerProfile"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 10: Drop the old unique constraint [userId, partNumber] on PartProgress.
-- The new constraint will be [learnerProfileId, partNumber] so each profile
-- can have its own independent progress row per part.
ALTER TABLE "PartProgress" DROP CONSTRAINT IF EXISTS "PartProgress_userId_partNumber_key";

-- Step 11: Create new unique constraint [learnerProfileId, partNumber]
CREATE UNIQUE INDEX IF NOT EXISTS "PartProgress_learnerProfileId_partNumber_key"
  ON "PartProgress"("learnerProfileId", "partNumber");

-- Step 12: Add index for learnerProfileId on PartProgress
CREATE INDEX IF NOT EXISTS "PartProgress_learnerProfileId_idx" ON "PartProgress"("learnerProfileId");

-- Step 13: Add FK + index for StudySession.learnerProfileId
ALTER TABLE "StudySession"
  ADD CONSTRAINT "StudySession_learnerProfileId_fkey"
  FOREIGN KEY ("learnerProfileId") REFERENCES "LearnerProfile"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "StudySession_learnerProfileId_idx" ON "StudySession"("learnerProfileId");

-- Done.
-- After running this migration, run: npx prisma generate
-- to regenerate the Prisma client with the new types.
