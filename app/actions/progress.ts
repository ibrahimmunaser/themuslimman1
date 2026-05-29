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

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getUserPlan(userId: string): Promise<UserPlan | null> {
  console.log(`[PROGRESS] getUserPlan: Fetching plan for user ${userId}`);

  const [user, purchases, subscription] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { hasPaid: true } }),
    prisma.purchase.findMany({ where: { userId, status: "succeeded" }, select: { planId: true } }),
    prisma.subscription.findFirst({
      where: { userId, status: { in: ["active", "trialing"] } },
      select: { id: true },
    }),
  ]);

  if (purchases.some((p) => p.planId === "complete") || user?.hasPaid || subscription) {
    console.log(`[PROGRESS] getUserPlan: User ${userId} has "complete" plan`);
    return "complete";
  }
  if (purchases.some((p) => p.planId === "essentials")) {
    console.log(`[PROGRESS] getUserPlan: User ${userId} has "essentials" plan`);
    return "essentials";
  }

  console.log(`[PROGRESS] getUserPlan: User ${userId} has no valid plan`);
  return null;
}

async function getOrCreateProgress(userId: string, learnerProfileId: string, partNumber: number) {
  console.log(`[PROGRESS] getOrCreateProgress: Profile ${learnerProfileId}, part ${partNumber}`);
  return prisma.partProgress.upsert({
    where:  { learnerProfileId_partNumber: { learnerProfileId, partNumber } },
    create: { userId, learnerProfileId, partNumber },
    update: {},
  });
}

async function recomputeAndSave(
  learnerProfileId: string,
  partNumber: number,
  userPlan: UserPlan,
) {
  console.log(`[PROGRESS] recomputeAndSave: Profile ${learnerProfileId}, part ${partNumber}, plan ${userPlan}`);
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

  console.log(`[PROGRESS] recomputeAndSave: Computed status "${newStatus}" for profile ${learnerProfileId}, part ${partNumber}`);

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
  console.log(`[PROGRESS] trackVideoProgress: Part ${partNumber}, watchPercent ${watchPercent}%`);
  
  const user = await requireStudent();
  if (!user) {
    console.log(`[PROGRESS] trackVideoProgress: No authenticated student`);
    return;
  }

  const userId = user.id;
  const learnerProfileId = await getActiveProfileId(userId);

  console.log(`[PROGRESS] trackVideoProgress: User ${userId}, profile ${learnerProfileId}, part ${partNumber}, ${watchPercent}%`);
  
  const userPlan = await getUserPlan(userId);
  if (!userPlan) {
    console.log(`[PROGRESS] trackVideoProgress: User ${userId} has no valid plan, skipping`);
    return;
  }

  const clamped = Math.min(100, Math.max(0, Math.round(watchPercent)));

  // Step 1: ensure the row exists (create on first visit).
  // The UPDATE branch intentionally does NOT write videoWatchPercent here —
  // that is handled atomically in step 2 to avoid ever regressing the value.
  await prisma.partProgress.upsert({
    where:  { learnerProfileId_partNumber: { learnerProfileId, partNumber } },
    create: {
      userId,
      learnerProfileId,
      partNumber,
      videoWatchPercent: clamped,
      videoCompleted:    clamped >= VIDEO_COMPLETION_THRESHOLD,
      status:            "started",
      startedAt:         new Date(),
      lastAccessedAt:    new Date(),
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
  console.log(`[PROGRESS] trackVideoProgress: Complete for profile ${learnerProfileId}, part ${partNumber} [${elapsed}ms]`);
}

/** Called when the user opens/views the briefing for a part. */
export async function trackBriefingOpened(partNumber: number) {
  console.log(`[PROGRESS] trackBriefingOpened: Part ${partNumber}`);
  
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
  console.log(`[PROGRESS] trackQuizCompleted: Part ${partNumber}, score ${score}`);
  
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

  console.log(`[PROGRESS] trackQuizCompleted: Profile ${learnerProfileId}, part ${partNumber}, score ${clamped}, passed: ${passed}`);
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
  console.log(`[PROGRESS] trackAssetOpened: Part ${partNumber}, assetId "${assetId}"`);
  
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
  console.log(`[PROGRESS] trackAssetOpened: Profile ${learnerProfileId}, part ${partNumber}, asset "${assetId}"`);
}

/** Mark a part as started (called when user opens the part page). */
export async function trackPartOpened(partNumber: number) {
  const user = await requireStudent();
  if (!user) return;

  const userId          = user.id;
  const learnerProfileId = await getActiveProfileId(userId);

  await prisma.partProgress.upsert({
    where:  { learnerProfileId_partNumber: { learnerProfileId, partNumber } },
    create: { userId, learnerProfileId, partNumber, status: "started", startedAt: new Date(), lastAccessedAt: new Date() },
    update: { lastAccessedAt: new Date() },
  });
  
  console.log(`[PROGRESS] trackPartOpened: Part ${partNumber} opened for profile ${learnerProfileId}`);
}
