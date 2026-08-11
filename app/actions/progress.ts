"use server";

import { prisma } from "@/lib/db";
import { requireStudent } from "@/lib/auth";
import { getActiveProfileId, resolveLearnerProfileId } from "@/app/actions/profiles";
import { getPartPageData } from "@/lib/part-content-cache";
import type { Quiz } from "@/lib/types";
import type { CourseLang } from "@/lib/course-lang";
import {
  computeQuizScore,
  VIDEO_COMPLETION_THRESHOLD,
} from "@/lib/progress";
import {
  getUserPlan,
  recomputeAndSaveStatus,
  applyVerifiedQuizScore,
} from "@/lib/progress-writes";
import { hasActiveCourseAccess, TOTAL_COURSE_PARTS } from "@/lib/access";

// Verbose trace logs are active in development only to avoid spamming
// production logs on every video-threshold tick.
const isDev = process.env.NODE_ENV !== "production";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const devLog = isDev ? (...args: any[]) => console.log(...args) : () => {};

/** Valid asset IDs — mirrors mobile-progress/track allowlist. */
const VALID_ASSET_IDS = new Set([
  "video", "audio", "briefing", "study_guide", "flashcard",
  "slides", "infographic", "mindmap", "statement-of-facts", "quiz",
  // Legacy aliases normalized below
  "facts", "statement_of_facts", "study-guide",
]);

/** Reject non-integer / out-of-range part numbers (mirrors mobile track). */
function isValidPartNumber(partNumber: unknown): partNumber is number {
  return (
    typeof partNumber === "number" &&
    Number.isInteger(partNumber) &&
    partNumber >= 1 &&
    partNumber <= TOTAL_COURSE_PARTS
  );
}

/** Resolve plan for progress writes — Part 1 unpaid uses "complete" like mobile track. */
async function resolveProgressPlan(
  userId: string,
  sessionHasPaid: boolean | undefined,
  partNumber: number,
) {
  const userPlan = await getUserPlan(userId, sessionHasPaid);
  if (userPlan) return userPlan;
  // Mobile: `(await getUserPlan(...)) ?? "complete"` after Part 1 carve-out.
  if (partNumber === 1) return "complete" as const;
  return null;
}

async function getOrCreateProgress(userId: string, learnerProfileId: string, partNumber: number) {
  devLog(`[PROGRESS] getOrCreateProgress: Profile ${learnerProfileId}, part ${partNumber}`);
  return prisma.partProgress.upsert({
    where:  { learnerProfileId_partNumber: { learnerProfileId, partNumber } },
    create: {
      id: crypto.randomUUID(),
      userId,
      learnerProfileId,
      partNumber,
      updatedAt: new Date(),
      startedAt: new Date(),
      status: "started",
    },
    update: {},
  });
}

// ── Public server actions ────────────────────────────────────────────────────

/**
 * Called by the video player when the user reaches a new highest watch %.
 * Only updates if the new value is higher than what we have.
 */
export async function trackVideoProgress(partNumber: number, watchPercent: number) {
  const startTime = Date.now();
  devLog(`[PROGRESS] trackVideoProgress: Part ${partNumber}, watchPercent ${watchPercent}%`);

  if (!isValidPartNumber(partNumber)) return;

  const user = await requireStudent();
  if (!user) {
    devLog(`[PROGRESS] trackVideoProgress: No authenticated student`);
    return;
  }

  const userId = user.id;
  const learnerProfileId = await getActiveProfileId(userId);

  devLog(`[PROGRESS] trackVideoProgress: User ${userId}, profile ${learnerProfileId}, part ${partNumber}, ${watchPercent}%`);

  const userPlan = await resolveProgressPlan(userId, user.hasPaid, partNumber);
  if (!userPlan) {
    devLog(`[PROGRESS] trackVideoProgress: User ${userId} has no valid plan, skipping`);
    return;
  }

  const clamped = Math.min(100, Math.max(0, Math.round(watchPercent)));

  // Step 1: ensure the row exists (create on first visit).
  // The UPDATE branch intentionally does NOT write videoWatchPercent here â€”
  // that is handled atomically in step 2 to avoid ever regressing the value.
  await prisma.partProgress.upsert({
    where:  { learnerProfileId_partNumber: { learnerProfileId, partNumber } },
    create: {
      id: crypto.randomUUID(),
      userId,
      learnerProfileId,
      partNumber,
      videoWatchPercent: clamped,
      videoCompleted:    clamped >= VIDEO_COMPLETION_THRESHOLD,
      status:            "started",
      startedAt:         new Date(),
      lastAccessedAt:    new Date(),
      updatedAt:         new Date(),
    },
    update: {
      lastAccessedAt: new Date(),
    },
  });

  // Step 2: advance the high-water mark atomically.
  // The WHERE clause `videoWatchPercent < clamped` ensures this is a no-op
  // when the stored value is already equal or higher, preventing any regression.
  // videoCompleted is sticky (lib/progress.ts) — only set true at threshold,
  // never clear a prior true by writing false on a sub-threshold bump.
  await prisma.partProgress.updateMany({
    where: {
      learnerProfileId,
      partNumber,
      videoWatchPercent: { lt: clamped },
    },
    data: {
      videoWatchPercent: clamped,
      ...(clamped >= VIDEO_COMPLETION_THRESHOLD ? { videoCompleted: true } : {}),
    },
  });

  await recomputeAndSaveStatus(learnerProfileId, partNumber, userPlan);
  
  const elapsed = Date.now() - startTime;
  devLog(`[PROGRESS] trackVideoProgress: Complete for profile ${learnerProfileId}, part ${partNumber} [${elapsed}ms]`);
}

/** Called when the user opens/views the briefing for a part. */
export async function trackBriefingOpened(partNumber: number) {
  devLog(`[PROGRESS] trackBriefingOpened: Part ${partNumber}`);

  if (!isValidPartNumber(partNumber)) return;
  
  const user = await requireStudent();
  if (!user) return;
  const userId          = user.id;
  const learnerProfileId = await getActiveProfileId(userId);
  
  const userPlan = await resolveProgressPlan(userId, user.hasPaid, partNumber);
  if (!userPlan) return;

  await getOrCreateProgress(userId, learnerProfileId, partNumber);
  await prisma.partProgress.update({
    where: { learnerProfileId_partNumber: { learnerProfileId, partNumber } },
    data:  { briefingOpened: true, lastAccessedAt: new Date() },
  });

  await recomputeAndSaveStatus(learnerProfileId, partNumber, userPlan);
}

/** Called when flashcards session is started/reviewed. */
export async function trackFlashcardsReviewed(partNumber: number) {
  if (!isValidPartNumber(partNumber)) return;
  const user = await requireStudent();
  if (!user) return;
  const userId          = user.id;
  const learnerProfileId = await getActiveProfileId(userId);
  
  const userPlan = await resolveProgressPlan(userId, user.hasPaid, partNumber);
  if (!userPlan) return;

  await getOrCreateProgress(userId, learnerProfileId, partNumber);

  // Write flashcardsReviewed=true AND append "flashcard" to openedAssets so both
  // the part-page path and the resources-page path agree on completion counts.
  // The CASE expression is a no-op when "flashcard" is already in the array.
  await prisma.$executeRaw`
    UPDATE "PartProgress"
    SET
      "flashcardsReviewed" = true,
      "openedAssets" = CASE
        WHEN COALESCE("openedAssets", '[]')::jsonb ? 'flashcard'
        THEN COALESCE("openedAssets", '[]')
        ELSE (COALESCE("openedAssets", '[]')::jsonb || jsonb_build_array('flashcard'::text))::text
      END,
      "lastAccessedAt" = NOW(),
      "updatedAt" = NOW()
    WHERE "learnerProfileId" = ${learnerProfileId}
      AND "partNumber" = ${partNumber}
  `;

  await recomputeAndSaveStatus(learnerProfileId, partNumber, userPlan);
}

/**
 * Called when any optional asset is opened.
 * assetId examples: "slides", "mindmap", "infographic", "study_guide",
 *                   "report", "statement-of-facts", "timeline", "audio"
 *
 * NOTE: openedAssets is stored as a JSON string in the DB (e.g. '["slides","audio"]').
 * The max realistic size is ~20 assets Ã— ~30 chars each â‰ˆ 600 bytes, well within
 * the varchar limit. Avoid storing unbounded user input as assetId values here.
 */
export async function trackAssetOpened(partNumber: number, assetId: string) {
  devLog(`[PROGRESS] trackAssetOpened: Part ${partNumber}, assetId "${assetId}"`);

  if (!isValidPartNumber(partNumber)) return;
  if (typeof assetId !== "string" || !VALID_ASSET_IDS.has(assetId)) {
    return;
  }
  // Normalize legacy IDs to canonical values stored in openedAssets.
  const canonicalId =
    assetId === "facts" || assetId === "statement_of_facts"
      ? "statement-of-facts"
      : assetId === "study-guide"
        ? "study_guide"
        : assetId;
  
  const user = await requireStudent();
  if (!user) return;
  const userId          = user.id;
  const learnerProfileId = await getActiveProfileId(userId);
  
  const userPlan = await resolveProgressPlan(userId, user.hasPaid, partNumber);
  if (!userPlan) return;

  await getOrCreateProgress(userId, learnerProfileId, partNumber);

  // Atomic JSON-array append via a single UPDATE statement.
  // The CASE expression is a no-op when assetId is already present,
  // preventing duplicates without a separate read-then-write race.
  // Also sync the dedicated boolean columns when "briefing" or "flashcard"
  // are opened via the Resources tab so both write paths stay consistent.
  const isBriefing  = canonicalId === "briefing";
  const isFlashcard = canonicalId === "flashcard";

  await prisma.$executeRaw`
    UPDATE "PartProgress"
    SET
      "openedAssets" = CASE
        WHEN COALESCE("openedAssets", '[]')::jsonb ? ${canonicalId}
        THEN COALESCE("openedAssets", '[]')
        ELSE (COALESCE("openedAssets", '[]')::jsonb || jsonb_build_array(${canonicalId}::text))::text
      END,
      "briefingOpened"    = CASE WHEN ${isBriefing}  THEN true ELSE "briefingOpened"    END,
      "flashcardsReviewed"= CASE WHEN ${isFlashcard} THEN true ELSE "flashcardsReviewed" END,
      "lastAccessedAt" = NOW(),
      "updatedAt" = NOW()
    WHERE "learnerProfileId" = ${learnerProfileId}
      AND "partNumber" = ${partNumber}
  `;

  await recomputeAndSaveStatus(learnerProfileId, partNumber, userPlan);
  devLog(`[PROGRESS] trackAssetOpened: Profile ${learnerProfileId}, part ${partNumber}, asset "${canonicalId}"`);
}

/**
 * Mark a part as started (called when user opens the part page).
 * Requires active course access (or Part 1 free) — do not trust page-only gates;
 * this action is callable directly and would inflate certificate "studied" counts.
 */
export async function trackPartOpened(partNumber: number) {
  const user = await requireStudent();
  if (!user) return;
  if (!isValidPartNumber(partNumber)) return;

  if (partNumber !== 1) {
    const hasAccess = await hasActiveCourseAccess(user.id, user.hasPaid);
    if (!hasAccess) return;
  }

  const userId          = user.id;
  const learnerProfileId = await getActiveProfileId(userId);

  await prisma.partProgress.upsert({
    where:  { learnerProfileId_partNumber: { learnerProfileId, partNumber } },
    create: { id: crypto.randomUUID(), userId, learnerProfileId, partNumber, status: "started", startedAt: new Date(), lastAccessedAt: new Date(), updatedAt: new Date() },
    update: { lastAccessedAt: new Date() },
  });
  
  devLog(`[PROGRESS] trackPartOpened: Part ${partNumber} opened for profile ${learnerProfileId}`);
}

/**
 * Server-side quiz submission — validates every answer against the authoritative
 * quiz data, computes the score, then persists it. Never accept a client score.
 * Mirrors mobile `/api/mobile-progress/track` which also requires answers.
 */
export async function submitQuizAnswers(
  partNumber: number,
  answers: Record<string, string>,
  explicitProfileId?: string,
  lang: CourseLang = "en",
): Promise<{ score: number; passed: boolean; bestScore: number } | undefined> {
  if (!isValidPartNumber(partNumber)) return;
  const user = await requireStudent();
  if (!user) return;
  const partData = await getPartPageData(partNumber, lang);
  const quizData = partData.quizData as Quiz | null | undefined;
  if (!quizData || quizData.questions.length === 0) {
    devLog(`[PROGRESS] submitQuizAnswers: No quiz data for part ${partNumber}`);
    return;
  }

  const serverScore = computeQuizScore(quizData, answers);
  const userPlan = await resolveProgressPlan(user.id, user.hasPaid, partNumber);
  if (!userPlan) return;

  const learnerProfileId = await resolveLearnerProfileId(user.id, explicitProfileId);
  devLog(`[PROGRESS] submitQuizAnswers: Part ${partNumber} server-computed score ${serverScore}%`);

  return applyVerifiedQuizScore(user.id, learnerProfileId, partNumber, serverScore, userPlan);
}
