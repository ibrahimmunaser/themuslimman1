"use server";

import { prisma } from "@/lib/db";
import { requireStudent } from "@/lib/auth";
import { getActiveProfileId } from "@/app/actions/profiles";
import { getPartPageData } from "@/lib/part-content-cache";
import type { Quiz } from "@/lib/types";
import {
  computeStatus,
  parseProgressRow,
  VIDEO_COMPLETION_THRESHOLD,
  QUIZ_PASS_SCORE,
} from "@/lib/progress";
type UserPlan = "essentials" | "complete";

// Verbose trace logs are active in development only to avoid spamming
// production logs on every video-threshold tick (up to 6× per viewing session).
const isDev = process.env.NODE_ENV !== "production";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const devLog = isDev ? (...args: any[]) => console.log(...args) : () => {};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Determines the user's active plan.
 *
 * @param sessionHasPaid - if true (from the session cookie), short-circuits all
 *   DB queries and immediately returns "complete". This avoids 3 round-trips on
 *   every video-progress heartbeat for lifetime/one-time buyers.
 */
async function getUserPlan(userId: string, sessionHasPaid?: boolean): Promise<UserPlan | null> {
  // Fast path: the session already knows the user has paid. No DB queries needed.
  if (sessionHasPaid) {
    devLog(`[PROGRESS] getUserPlan: User ${userId} short-circuited via sessionHasPaid`);
    return "complete";
  }

  devLog(`[PROGRESS] getUserPlan: Fetching plan for user ${userId}`);

  const [user, purchases, subscription] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { hasPaid: true } }),
    prisma.purchase.findMany({ where: { userId, status: "succeeded" }, select: { planId: true } }),
    prisma.subscription.findFirst({
      where: {
        userId,
        // Include "past_due" so users in Stripe's dunning window keep progress tracking.
        // Mirrors ACTIVE_SUBSCRIPTION_STATUSES from lib/access.ts.
        status: { in: ["active", "trialing", "past_due"] },
        currentPeriodEnd: { gt: new Date() },
      },
      select: { id: true },
    }),
  ]);

  if (purchases.some((p) => p.planId === "complete") || user?.hasPaid || subscription) {
    devLog(`[PROGRESS] getUserPlan: User ${userId} has "complete" plan`);
    return "complete";
  }
  if (purchases.some((p) => p.planId === "essentials")) {
    devLog(`[PROGRESS] getUserPlan: User ${userId} has "essentials" plan`);
    return "essentials";
  }

  devLog(`[PROGRESS] getUserPlan: User ${userId} has no valid plan`);
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

async function recomputeAndSave(
  learnerProfileId: string,
  partNumber: number,
  userPlan: UserPlan,
) {
  devLog(`[PROGRESS] recomputeAndSave: Profile ${learnerProfileId}, part ${partNumber}, plan ${userPlan}`);
  const row = await prisma.partProgress.findUniqueOrThrow({
    where: { learnerProfileId_partNumber: { learnerProfileId, partNumber } },
    select: {
      videoWatchPercent:  true,
      videoCompleted:     true,
      briefingOpened:     true,
      quizCompleted:      true,
      quizBestScore:      true,
      quizPassed:         true,
      flashcardsReviewed: true,
      openedAssets:       true,
      startedAt:          true,
      completedAt:        true,
      masteredAt:         true,
    },
  });
  const snap = parseProgressRow(row);
  const newStatus = computeStatus(snap, userPlan);

  devLog(`[PROGRESS] recomputeAndSave: Computed status "${newStatus}" for profile ${learnerProfileId}, part ${partNumber}`);

  const update: Record<string, unknown> = { status: newStatus };
  if (newStatus === "completed" && !row.completedAt) {
    update.completedAt = new Date();
  }
  if (newStatus === "mastered" && !row.masteredAt) {
    update.masteredAt = new Date();
  }

  await prisma.partProgress.update({
    where: { learnerProfileId_partNumber: { learnerProfileId, partNumber } },
    data:  update,
  });
}

// ── Public server actions ─────────────────────────────────────────────────────

/**
 * Called by the video player when the user reaches a new highest watch %.
 * Only updates if the new value is higher than what we have.
 */
export async function trackVideoProgress(partNumber: number, watchPercent: number) {
  const startTime = Date.now();
  devLog(`[PROGRESS] trackVideoProgress: Part ${partNumber}, watchPercent ${watchPercent}%`);

  const user = await requireStudent();
  if (!user) {
    devLog(`[PROGRESS] trackVideoProgress: No authenticated student`);
    return;
  }

  const userId = user.id;
  const learnerProfileId = await getActiveProfileId(userId);

  devLog(`[PROGRESS] trackVideoProgress: User ${userId}, profile ${learnerProfileId}, part ${partNumber}, ${watchPercent}%`);

  const userPlan = await getUserPlan(userId, user.hasPaid);
  if (!userPlan) {
    devLog(`[PROGRESS] trackVideoProgress: User ${userId} has no valid plan, skipping`);
    return;
  }

  const clamped = Math.min(100, Math.max(0, Math.round(watchPercent)));

  // Step 1: ensure the row exists (create on first visit).
  // The UPDATE branch intentionally does NOT write videoWatchPercent here —
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
  await prisma.partProgress.updateMany({
    where: {
      learnerProfileId,
      partNumber,
      videoWatchPercent: { lt: clamped },
    },
    data: {
      videoWatchPercent: clamped,
      videoCompleted:    clamped >= VIDEO_COMPLETION_THRESHOLD,
    },
  });

  await recomputeAndSave(learnerProfileId, partNumber, userPlan);
  
  const elapsed = Date.now() - startTime;
  devLog(`[PROGRESS] trackVideoProgress: Complete for profile ${learnerProfileId}, part ${partNumber} [${elapsed}ms]`);
}

/** Called when the user opens/views the briefing for a part. */
export async function trackBriefingOpened(partNumber: number) {
  devLog(`[PROGRESS] trackBriefingOpened: Part ${partNumber}`);
  
  const user = await requireStudent();
  if (!user) return;

  const userId          = user.id;
  const learnerProfileId = await getActiveProfileId(userId);
  
  const userPlan = await getUserPlan(userId, user.hasPaid);
  if (!userPlan) return;

  await getOrCreateProgress(userId, learnerProfileId, partNumber);
  await prisma.partProgress.update({
    where: { learnerProfileId_partNumber: { learnerProfileId, partNumber } },
    data:  { briefingOpened: true, lastAccessedAt: new Date() },
  });

  await recomputeAndSave(learnerProfileId, partNumber, userPlan);
}

/** Called when the quiz is completed with a final score (0-100). */
export async function trackQuizCompleted(partNumber: number, score: number) {
  devLog(`[PROGRESS] trackQuizCompleted: Part ${partNumber}, score ${score}`);
  
  const user = await requireStudent();
  if (!user) return;

  const userId          = user.id;
  const learnerProfileId = await getActiveProfileId(userId);
  
  const userPlan = await getUserPlan(userId, user.hasPaid);
  if (!userPlan) return;

  // Clamp score to [0, 100] — never trust a raw client value.
  // isFinite check BEFORE clamp: Math.min/max convert Infinity → 100/0 so
  // checking afterwards is always true and misses the Infinity/NaN case.
  const raw = Number(score);
  if (!Number.isFinite(raw)) return; // reject NaN, Infinity, -Infinity
  const clamped = Math.min(100, Math.max(0, Math.round(raw)));

  const passed  = clamped >= QUIZ_PASS_SCORE;

  await getOrCreateProgress(userId, learnerProfileId, partNumber);

  // Atomic best-score update: only raise quizBestScore, never lower it.
  // Using updateMany with a WHERE condition (quizBestScore IS NULL OR < clamped)
  // eliminates the read-then-write race condition from concurrent quiz submissions.
  const alwaysFields = {
    quizCompleted:  true,
    quizScore:      clamped,
    quizAttempts:   { increment: 1 as const },
    lastAccessedAt: new Date(),
  };
  const updatedHigh = await prisma.partProgress.updateMany({
    where: {
      learnerProfileId,
      partNumber,
      OR: [
        { quizBestScore: null },
        { quizBestScore: { lt: clamped } },
      ],
    },
    data: {
      ...alwaysFields,
      quizBestScore: clamped,
      quizPassed:    clamped >= QUIZ_PASS_SCORE,
    },
  });

  if (updatedHigh.count === 0) {
    // Score is not higher than existing best — still record the attempt metadata.
    await prisma.partProgress.update({
      where: { learnerProfileId_partNumber: { learnerProfileId, partNumber } },
      data: alwaysFields,
    });
  }

  // Re-read final bestScore for the return value.
  const saved = await prisma.partProgress.findUnique({
    where: { learnerProfileId_partNumber: { learnerProfileId, partNumber } },
    select: { quizBestScore: true, quizPassed: true },
  });
  const bestScore = saved?.quizBestScore ?? clamped;

  await recomputeAndSave(learnerProfileId, partNumber, userPlan);

  devLog(`[PROGRESS] trackQuizCompleted: Profile ${learnerProfileId}, part ${partNumber}, score ${clamped}, passed: ${passed}`);
  return { score: clamped, passed, bestScore };
}

/** Called when flashcards session is started/reviewed. */
export async function trackFlashcardsReviewed(partNumber: number) {
  const user = await requireStudent();
  if (!user) return;

  const userId          = user.id;
  const learnerProfileId = await getActiveProfileId(userId);
  
  const userPlan = await getUserPlan(userId, user.hasPaid);
  if (!userPlan) return;

  await getOrCreateProgress(userId, learnerProfileId, partNumber);
  await prisma.partProgress.update({
    where: { learnerProfileId_partNumber: { learnerProfileId, partNumber } },
    data: { flashcardsReviewed: true, lastAccessedAt: new Date() },
  });

  await recomputeAndSave(learnerProfileId, partNumber, userPlan);
}

/**
 * Called when any optional asset is opened.
 * assetId examples: "slides", "mindmap", "infographic", "study_guide",
 *                   "report", "statement-of-facts", "timeline", "audio"
 *
 * NOTE: openedAssets is stored as a JSON string in the DB (e.g. '["slides","audio"]').
 * The max realistic size is ~20 assets × ~30 chars each ≈ 600 bytes, well within
 * the varchar limit. Avoid storing unbounded user input as assetId values here.
 */
export async function trackAssetOpened(partNumber: number, assetId: string) {
  devLog(`[PROGRESS] trackAssetOpened: Part ${partNumber}, assetId "${assetId}"`);
  
  const user = await requireStudent();
  if (!user) return;

  const userId          = user.id;
  const learnerProfileId = await getActiveProfileId(userId);
  
  const userPlan = await getUserPlan(userId, user.hasPaid);
  if (!userPlan) return;

  await getOrCreateProgress(userId, learnerProfileId, partNumber);

  // Atomic JSON-array append via a single UPDATE statement.
  // The CASE expression is a no-op when assetId is already present,
  // preventing duplicates without a separate read-then-write race.
  // Also sync the dedicated boolean columns when "briefing" or "flashcard"
  // are opened via the Resources tab so both write paths stay consistent.
  const isBriefing  = assetId === "briefing";
  const isFlashcard = assetId === "flashcard";

  await prisma.$executeRaw`
    UPDATE "PartProgress"
    SET
      "openedAssets" = CASE
        WHEN COALESCE("openedAssets", '[]')::jsonb ? ${assetId}
        THEN COALESCE("openedAssets", '[]')
        ELSE (COALESCE("openedAssets", '[]')::jsonb || jsonb_build_array(${assetId}::text))::text
      END,
      "briefingOpened"    = CASE WHEN ${isBriefing}  THEN true ELSE "briefingOpened"    END,
      "flashcardsReviewed"= CASE WHEN ${isFlashcard} THEN true ELSE "flashcardsReviewed" END,
      "lastAccessedAt" = NOW(),
      "updatedAt" = NOW()
    WHERE "learnerProfileId" = ${learnerProfileId}
      AND "partNumber" = ${partNumber}
  `;

  await recomputeAndSave(learnerProfileId, partNumber, userPlan);
  devLog(`[PROGRESS] trackAssetOpened: Profile ${learnerProfileId}, part ${partNumber}, asset "${assetId}"`);
}

/**
 * Mark a part as started (called when user opens the part page).
 *
 * Intentionally skips the plan check here: by the time this action is called,
 * the page-level access gate (hasActiveCourseAccess) has already verified the
 * user has an active subscription or purchase. The server action doesn't repeat
 * that check to avoid an extra round-trip on every page view.
 */
export async function trackPartOpened(partNumber: number) {
  const user = await requireStudent();
  if (!user) return;

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
 * quiz data, computes the score, then delegates to trackQuizCompleted.
 *
 * Use this instead of calling trackQuizCompleted with a client-supplied score.
 * The client still uses getQuizAnswerMap for instant per-question feedback, but
 * the final score that is recorded is always computed on the server.
 *
 * @param answers - map of questionId → the option the user selected
 */
export async function submitQuizAnswers(
  partNumber: number,
  answers: Record<string, string>,
): Promise<{ score: number; passed: boolean; bestScore: number } | undefined> {
  const user = await requireStudent();
  if (!user) return;

  // Load quiz data from the shared in-memory cache (no extra R2 round-trip
  // when the user just finished the quiz — data is almost always hot).
  const partData = await getPartPageData(partNumber);
  const quizData = partData.quizData as Quiz | null | undefined;
  if (!quizData || quizData.questions.length === 0) {
    devLog(`[PROGRESS] submitQuizAnswers: No quiz data for part ${partNumber}`);
    return;
  }

  // Compute score server-side from authoritative correct_answer values.
  const total   = quizData.questions.length;
  const correct = quizData.questions.filter(
    (q) => answers[q.id] !== undefined && answers[q.id] === q.correct_answer,
  ).length;
  const serverScore = Math.round((correct / total) * 100);

  devLog(`[PROGRESS] submitQuizAnswers: Part ${partNumber} server-computed score ${serverScore}% (${correct}/${total})`);

  return trackQuizCompleted(partNumber, serverScore);
}
