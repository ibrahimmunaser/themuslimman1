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
  const purchases = await prisma.purchase.findMany({
    where: { userId, status: "succeeded" },
    select: { planId: true },
  });
  if (purchases.some((p) => p.planId === "complete")) return "complete";
  if (purchases.some((p) => p.planId === "essentials")) return "essentials";
  return null;
}

async function getOrCreateProgress(userId: string, partNumber: number) {
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

  const update: Record<string, unknown> = { status: newStatus };
  if (newStatus === "completed" && !row.completedAt) update.completedAt = new Date();
  if (newStatus === "mastered"  && !row.masteredAt)  update.masteredAt  = new Date();

  await prisma.partProgress.update({
    where: { userId_partNumber: { userId, partNumber } },
    data:  update,
  });
}

// ── Public server actions ─────────────────────────────────────────────────────

/**
 * Called by the video player when the user reaches a new highest watch %.
 * Only updates if the new value is higher than what we have.
 */
export async function trackVideoProgress(partNumber: number, watchPercent: number) {
  const user = await requireStudent();
  if (!user) return;

  const userId = user.id;
  const userPlan = await getUserPlan(userId);
  if (!userPlan) return;

  const clamped = Math.min(100, Math.max(0, Math.round(watchPercent)));

  await getOrCreateProgress(userId, partNumber);

  await prisma.partProgress.update({
    where: { userId_partNumber: { userId, partNumber } },
    data: {
      videoWatchPercent: { set: clamped },
      videoCompleted:    clamped >= VIDEO_COMPLETION_THRESHOLD ? true : undefined,
      startedAt:         { set: new Date() }, // upserted, safe to re-set
      lastAccessedAt:    new Date(),
      // Only raise, never lower the stored percent
    },
  });

  // Re-fetch and only update if this percent is actually higher
  const existing = await prisma.partProgress.findUnique({
    where: { userId_partNumber: { userId, partNumber } },
    select: { videoWatchPercent: true },
  });
  if (existing && existing.videoWatchPercent < clamped) {
    await prisma.partProgress.update({
      where: { userId_partNumber: { userId, partNumber } },
      data: {
        videoWatchPercent: clamped,
        videoCompleted:    clamped >= VIDEO_COMPLETION_THRESHOLD,
        lastAccessedAt:    new Date(),
      },
    });
  }

  await recomputeAndSave(userId, partNumber, userPlan);
}

/** Called when the user opens/views the briefing for a part. */
export async function trackBriefingOpened(partNumber: number) {
  const user = await requireStudent();
  if (!user) return;

  const userId  = user.id;
  const userPlan = await getUserPlan(userId);
  if (!userPlan) return;

  await getOrCreateProgress(userId, partNumber);
  await prisma.partProgress.update({
    where: { userId_partNumber: { userId, partNumber } },
    data:  { briefingOpened: true, lastAccessedAt: new Date() },
  });

  await recomputeAndSave(userId, partNumber, userPlan);
}

/** Called when the quiz is completed with a final score (0-100). */
export async function trackQuizCompleted(partNumber: number, score: number) {
  const user = await requireStudent();
  if (!user) return;

  const userId  = user.id;
  const userPlan = await getUserPlan(userId);
  if (!userPlan) return;

  const clamped = Math.min(100, Math.max(0, Math.round(score)));
  const passed  = clamped >= QUIZ_PASS_SCORE;

  await getOrCreateProgress(userId, partNumber);
  const existing = await prisma.partProgress.findUnique({
    where: { userId_partNumber: { userId, partNumber } },
    select: { quizBestScore: true },
  });
  const bestScore = Math.max(existing?.quizBestScore ?? 0, clamped);

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

  return { score: clamped, passed, bestScore };
}

/** Called when flashcards session is started/reviewed. */
export async function trackFlashcardsReviewed(partNumber: number) {
  const user = await requireStudent();
  if (!user) return;

  const userId  = user.id;
  const userPlan = await getUserPlan(userId);
  if (!userPlan) return;

  await getOrCreateProgress(userId, partNumber);
  await prisma.partProgress.update({
    where: { userId_partNumber: { userId, partNumber } },
    data: { flashcardsReviewed: true, lastAccessedAt: new Date() },
  });

  await recomputeAndSave(userId, partNumber, userPlan);
}

/**
 * Called when any optional asset is opened.
 * assetId examples: "slides", "mindmap", "infographic", "study_guide",
 *                   "report", "statement_of_facts", "timeline"
 */
export async function trackAssetOpened(partNumber: number, assetId: string) {
  const user = await requireStudent();
  if (!user) return;

  const userId = user.id;
  const userPlan = await getUserPlan(userId);
  if (!userPlan) return;

  await getOrCreateProgress(userId, partNumber);
  const row = await prisma.partProgress.findUnique({
    where: { userId_partNumber: { userId, partNumber } },
    select: { openedAssets: true },
  });
  let opened: string[] = [];
  try { opened = JSON.parse(row?.openedAssets ?? "[]"); } catch {}
  if (!opened.includes(assetId)) {
    opened.push(assetId);
  }

  await prisma.partProgress.update({
    where: { userId_partNumber: { userId, partNumber } },
    data: { openedAssets: JSON.stringify(opened), lastAccessedAt: new Date() },
  });

  await recomputeAndSave(userId, partNumber, userPlan);
}

/** Mark a part as started (called when user opens the part page). */
export async function trackPartOpened(partNumber: number) {
  const user = await requireStudent();
  if (!user) return;

  const userId = user.id;

  await prisma.partProgress.upsert({
    where:  { userId_partNumber: { userId, partNumber } },
    create: { userId, partNumber, status: "started", startedAt: new Date(), lastAccessedAt: new Date() },
    update: { lastAccessedAt: new Date(), startedAt: { set: new Date() } },
  });
}
