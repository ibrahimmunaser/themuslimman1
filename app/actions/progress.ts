"use server";

import { prisma } from "@/lib/db";
import { requireStudent } from "@/lib/auth";
import { getActiveProfileId } from "@/app/actions/profiles";
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

async function getUserPlan(userId: string): Promise<UserPlan | null> {
  devLog(`[PROGRESS] getUserPlan: Fetching plan for user ${userId}`);

  const [user, purchases, subscription] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { hasPaid: true } }),
    prisma.purchase.findMany({ where: { userId, status: "succeeded" }, select: { planId: true } }),
    prisma.subscription.findFirst({
      where: { userId, status: { in: ["active", "trialing"] } },
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
    create: { id: crypto.randomUUID(), userId, learnerProfileId, partNumber, updatedAt: new Date() },
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

  const userPlan = await getUserPlan(userId);
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
  
  const userPlan = await getUserPlan(userId);
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
  
  const userPlan = await getUserPlan(userId);
  if (!userPlan) return;

  const clamped = Math.min(100, Math.max(0, Math.round(score)));
  const passed  = clamped >= QUIZ_PASS_SCORE;

  await getOrCreateProgress(userId, learnerProfileId, partNumber);
  const existing = await prisma.partProgress.findUnique({
    where: { learnerProfileId_partNumber: { learnerProfileId, partNumber } },
    select: { quizBestScore: true },
  });
  const bestScore = Math.max(existing?.quizBestScore ?? 0, clamped);

  await prisma.partProgress.update({
    where: { learnerProfileId_partNumber: { learnerProfileId, partNumber } },
    data: {
      quizCompleted:  true,
      quizScore:      clamped,
      quizBestScore:  bestScore,
      quizPassed:     bestScore >= QUIZ_PASS_SCORE,
      quizAttempts:   { increment: 1 },
      lastAccessedAt: new Date(),
    },
  });

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
  
  const userPlan = await getUserPlan(userId);
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
 */
export async function trackAssetOpened(partNumber: number, assetId: string) {
  devLog(`[PROGRESS] trackAssetOpened: Part ${partNumber}, assetId "${assetId}"`);
  
  const user = await requireStudent();
  if (!user) return;

  const userId          = user.id;
  const learnerProfileId = await getActiveProfileId(userId);
  
  const userPlan = await getUserPlan(userId);
  if (!userPlan) return;

  await getOrCreateProgress(userId, learnerProfileId, partNumber);
  const row = await prisma.partProgress.findUnique({
    where: { learnerProfileId_partNumber: { learnerProfileId, partNumber } },
    select: { openedAssets: true },
  });
  let opened: string[] = [];
  try { opened = JSON.parse(row?.openedAssets ?? "[]"); } catch {}
  
  if (!opened.includes(assetId)) {
    opened.push(assetId);
  }

  await prisma.partProgress.update({
    where: { learnerProfileId_partNumber: { learnerProfileId, partNumber } },
    data: { openedAssets: JSON.stringify(opened), lastAccessedAt: new Date() },
  });

  await recomputeAndSave(learnerProfileId, partNumber, userPlan);
  devLog(`[PROGRESS] trackAssetOpened: Profile ${learnerProfileId}, part ${partNumber}, asset "${assetId}"`);
}

/** Mark a part as started (called when user opens the part page). */
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
