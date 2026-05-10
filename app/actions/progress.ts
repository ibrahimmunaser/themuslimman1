"use server";

import { prisma } from "@/lib/db";
import { requireStudent } from "@/lib/auth";
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
  const purchases = await prisma.purchase.findMany({
    where: { userId, status: "succeeded" },
    select: { planId: true },
  });
  
  if (purchases.some((p) => p.planId === "complete")) {
    console.log(`[PROGRESS] getUserPlan: User ${userId} has "complete" plan`);
    return "complete";
  }
  if (purchases.some((p) => p.planId === "essentials")) {
    console.log(`[PROGRESS] getUserPlan: User ${userId} has "essentials" plan`);
    return "essentials";
  }
  
  console.log(`[PROGRESS] getUserPlan: User ${userId} has no valid plan (purchases: ${purchases.length})`);
  return null;
}

async function getOrCreateProgress(userId: string, partNumber: number) {
  console.log(`[PROGRESS] getOrCreateProgress: User ${userId}, part ${partNumber}`);
  return prisma.partProgress.upsert({
    where:  { userId_partNumber: { userId, partNumber } },
    create: { userId, partNumber },
    update: {},
  });
}

async function recomputeAndSave(
  userId: string,
  partNumber: number,
  userPlan: UserPlan,
) {
  console.log(`[PROGRESS] recomputeAndSave: User ${userId}, part ${partNumber}, plan ${userPlan}`);
  const row = await prisma.partProgress.findUniqueOrThrow({
    where: { userId_partNumber: { userId, partNumber } },
    select: {
      videoWatchPercent: true,
      videoCompleted:    true,
      briefingOpened:    true,
      quizCompleted:     true,
      quizBestScore:     true,
      quizPassed:        true,
      flashcardsReviewed:true,
      openedAssets:      true,
      startedAt:         true,
      completedAt:       true,
      masteredAt:        true,
    },
  });
  const snap = parseProgressRow(row);
  const newStatus = computeStatus(snap, userPlan);

  console.log(`[PROGRESS] recomputeAndSave: Computed status "${newStatus}" for user ${userId}, part ${partNumber} (video: ${row.videoWatchPercent}%, briefing: ${row.briefingOpened}, quiz: ${row.quizPassed})`);

  const update: Record<string, unknown> = { status: newStatus };
  if (newStatus === "completed" && !row.completedAt) {
    update.completedAt = new Date();
    console.log(`[PROGRESS] recomputeAndSave: Setting completedAt for user ${userId}, part ${partNumber}`);
  }
  if (newStatus === "mastered"  && !row.masteredAt) {
    update.masteredAt  = new Date();
    console.log(`[PROGRESS] recomputeAndSave: Setting masteredAt for user ${userId}, part ${partNumber}`);
  }

  await prisma.partProgress.update({
    where: { userId_partNumber: { userId, partNumber } },
    data:  update,
  });
  
  console.log(`[PROGRESS] recomputeAndSave: Status updated to "${newStatus}" for user ${userId}, part ${partNumber}`);
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
  console.log(`[PROGRESS] trackVideoProgress: User ${userId} (${user.email}), part ${partNumber}, ${watchPercent}%`);
  
  const userPlan = await getUserPlan(userId);
  if (!userPlan) {
    console.log(`[PROGRESS] trackVideoProgress: User ${userId} has no valid plan, skipping`);
    return;
  }

  const clamped = Math.min(100, Math.max(0, Math.round(watchPercent)));
  console.log(`[PROGRESS] trackVideoProgress: Clamped watchPercent to ${clamped}%`);

  await getOrCreateProgress(userId, partNumber);

  await prisma.partProgress.update({
    where: { userId_partNumber: { userId, partNumber } },
    data: {
      videoWatchPercent: { set: clamped },
      videoCompleted:    clamped >= VIDEO_COMPLETION_THRESHOLD ? true : undefined,
      startedAt:         { set: new Date() }, // upserted, safe to re-set
      lastAccessedAt:    new Date(),
    },
  });

  // Re-fetch and only update if this percent is actually higher
  const existing = await prisma.partProgress.findUnique({
    where: { userId_partNumber: { userId, partNumber } },
    select: { videoWatchPercent: true },
  });
  
  if (existing && existing.videoWatchPercent < clamped) {
    console.log(`[PROGRESS] trackVideoProgress: Updating from ${existing.videoWatchPercent}% to ${clamped}% for user ${userId}, part ${partNumber}`);
    await prisma.partProgress.update({
      where: { userId_partNumber: { userId, partNumber } },
      data: {
        videoWatchPercent: clamped,
        videoCompleted:    clamped >= VIDEO_COMPLETION_THRESHOLD,
        lastAccessedAt:    new Date(),
      },
    });
  } else {
    console.log(`[PROGRESS] trackVideoProgress: No update needed (existing: ${existing?.videoWatchPercent}%, new: ${clamped}%)`);
  }

  await recomputeAndSave(userId, partNumber, userPlan);
  
  const elapsed = Date.now() - startTime;
  console.log(`[PROGRESS] trackVideoProgress: Complete for user ${userId}, part ${partNumber} [${elapsed}ms]`);
}

/** Called when the user opens/views the briefing for a part. */
export async function trackBriefingOpened(partNumber: number) {
  console.log(`[PROGRESS] trackBriefingOpened: Part ${partNumber}`);
  
  const user = await requireStudent();
  if (!user) {
    console.log(`[PROGRESS] trackBriefingOpened: No authenticated student`);
    return;
  }

  const userId  = user.id;
  console.log(`[PROGRESS] trackBriefingOpened: User ${userId} (${user.email}), part ${partNumber}`);
  
  const userPlan = await getUserPlan(userId);
  if (!userPlan) {
    console.log(`[PROGRESS] trackBriefingOpened: User ${userId} has no valid plan, skipping`);
    return;
  }

  await getOrCreateProgress(userId, partNumber);
  await prisma.partProgress.update({
    where: { userId_partNumber: { userId, partNumber } },
    data:  { briefingOpened: true, lastAccessedAt: new Date() },
  });

  console.log(`[PROGRESS] trackBriefingOpened: Briefing marked as opened for user ${userId}, part ${partNumber}`);
  await recomputeAndSave(userId, partNumber, userPlan);
}

/** Called when the quiz is completed with a final score (0-100). */
export async function trackQuizCompleted(partNumber: number, score: number) {
  console.log(`[PROGRESS] trackQuizCompleted: Part ${partNumber}, score ${score}`);
  
  const user = await requireStudent();
  if (!user) {
    console.log(`[PROGRESS] trackQuizCompleted: No authenticated student`);
    return;
  }

  const userId  = user.id;
  console.log(`[PROGRESS] trackQuizCompleted: User ${userId} (${user.email}), part ${partNumber}, score ${score}`);
  
  const userPlan = await getUserPlan(userId);
  if (!userPlan) {
    console.log(`[PROGRESS] trackQuizCompleted: User ${userId} has no valid plan, skipping`);
    return;
  }

  const clamped = Math.min(100, Math.max(0, Math.round(score)));
  const passed  = clamped >= QUIZ_PASS_SCORE;
  console.log(`[PROGRESS] trackQuizCompleted: Clamped score ${clamped}, passed: ${passed} (threshold: ${QUIZ_PASS_SCORE})`);

  await getOrCreateProgress(userId, partNumber);
  const existing = await prisma.partProgress.findUnique({
    where: { userId_partNumber: { userId, partNumber } },
    select: { quizBestScore: true },
  });
  const bestScore = Math.max(existing?.quizBestScore ?? 0, clamped);
  console.log(`[PROGRESS] trackQuizCompleted: Best score updated from ${existing?.quizBestScore ?? 0} to ${bestScore}`);

  await prisma.partProgress.update({
    where: { userId_partNumber: { userId, partNumber } },
    data: {
      quizCompleted:  true,
      quizScore:      clamped,
      quizBestScore:  bestScore,
      quizPassed:     bestScore >= QUIZ_PASS_SCORE,
      quizAttempts:   { increment: 1 },
      lastAccessedAt: new Date(),
    },
  });

  await recomputeAndSave(userId, partNumber, userPlan);

  console.log(`[PROGRESS] trackQuizCompleted: Quiz tracked for user ${userId}, part ${partNumber} (score: ${clamped}, best: ${bestScore}, passed: ${bestScore >= QUIZ_PASS_SCORE})`);
  return { score: clamped, passed, bestScore };
}

/** Called when flashcards session is started/reviewed. */
export async function trackFlashcardsReviewed(partNumber: number) {
  console.log(`[PROGRESS] trackFlashcardsReviewed: Part ${partNumber}`);
  
  const user = await requireStudent();
  if (!user) {
    console.log(`[PROGRESS] trackFlashcardsReviewed: No authenticated student`);
    return;
  }

  const userId  = user.id;
  console.log(`[PROGRESS] trackFlashcardsReviewed: User ${userId} (${user.email}), part ${partNumber}`);
  
  const userPlan = await getUserPlan(userId);
  if (!userPlan) {
    console.log(`[PROGRESS] trackFlashcardsReviewed: User ${userId} has no valid plan, skipping`);
    return;
  }

  await getOrCreateProgress(userId, partNumber);
  await prisma.partProgress.update({
    where: { userId_partNumber: { userId, partNumber } },
    data: { flashcardsReviewed: true, lastAccessedAt: new Date() },
  });

  console.log(`[PROGRESS] trackFlashcardsReviewed: Flashcards marked as reviewed for user ${userId}, part ${partNumber}`);
  await recomputeAndSave(userId, partNumber, userPlan);
}

/**
 * Called when any optional asset is opened.
 * assetId examples: "slides", "mindmap", "infographic", "study_guide",
 *                   "report", "statement_of_facts", "timeline"
 */
export async function trackAssetOpened(partNumber: number, assetId: string) {
  console.log(`[PROGRESS] trackAssetOpened: Part ${partNumber}, assetId "${assetId}"`);
  
  const user = await requireStudent();
  if (!user) {
    console.log(`[PROGRESS] trackAssetOpened: No authenticated student`);
    return;
  }

  const userId = user.id;
  console.log(`[PROGRESS] trackAssetOpened: User ${userId} (${user.email}), part ${partNumber}, asset "${assetId}"`);
  
  const userPlan = await getUserPlan(userId);
  if (!userPlan) {
    console.log(`[PROGRESS] trackAssetOpened: User ${userId} has no valid plan, skipping`);
    return;
  }

  await getOrCreateProgress(userId, partNumber);
  const row = await prisma.partProgress.findUnique({
    where: { userId_partNumber: { userId, partNumber } },
    select: { openedAssets: true },
  });
  let opened: string[] = [];
  try { opened = JSON.parse(row?.openedAssets ?? "[]"); } catch {}
  
  if (!opened.includes(assetId)) {
    opened.push(assetId);
    console.log(`[PROGRESS] trackAssetOpened: Adding "${assetId}" to opened assets (now: [${opened.join(", ")}])`);
  } else {
    console.log(`[PROGRESS] trackAssetOpened: Asset "${assetId}" already opened, no update`);
  }

  await prisma.partProgress.update({
    where: { userId_partNumber: { userId, partNumber } },
    data: { openedAssets: JSON.stringify(opened), lastAccessedAt: new Date() },
  });

  await recomputeAndSave(userId, partNumber, userPlan);
  console.log(`[PROGRESS] trackAssetOpened: Asset tracked for user ${userId}, part ${partNumber}, asset "${assetId}"`);
}

/** Mark a part as started (called when user opens the part page). */
export async function trackPartOpened(partNumber: number) {
  console.log(`[PROGRESS] trackPartOpened: Part ${partNumber}`);
  
  const user = await requireStudent();
  if (!user) {
    console.log(`[PROGRESS] trackPartOpened: No authenticated student`);
    return;
  }

  const userId = user.id;
  console.log(`[PROGRESS] trackPartOpened: User ${userId} (${user.email}), part ${partNumber}`);

  await prisma.partProgress.upsert({
    where:  { userId_partNumber: { userId, partNumber } },
    create: { userId, partNumber, status: "started", startedAt: new Date(), lastAccessedAt: new Date() },
    update: { lastAccessedAt: new Date(), startedAt: { set: new Date() } },
  });
  
  console.log(`[PROGRESS] trackPartOpened: Part ${partNumber} marked as opened/accessed for user ${userId}`);
}
