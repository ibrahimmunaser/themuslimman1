/**
 * Non-"use server" progress write helpers.
 * Kept out of app/actions/progress.ts so they are NOT callable as Server Actions
 * (which would allow unauthenticated getUserPlan(userId) / status mutation /
 * client-forged quiz scores via trackQuizCompleted).
 */
import { prisma } from "@/lib/db";
import {
  computeStatus,
  parseProgressRow,
  QUIZ_PASS_SCORE,
} from "@/lib/progress";

type UserPlan = "essentials" | "complete";

const isDev = process.env.NODE_ENV !== "production";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const devLog = isDev ? (...args: any[]) => console.log(...args) : () => {};

/**
 * Determines the user's active plan.
 *
 * @param sessionHasPaid - if true (from the session cookie), short-circuits all
 *   DB queries and immediately returns "complete".
 */
export async function getUserPlan(userId: string, sessionHasPaid?: boolean): Promise<UserPlan | null> {
  if (sessionHasPaid) {
    devLog(`[PROGRESS] getUserPlan: User ${userId} short-circuited via sessionHasPaid`);
    return "complete";
  }

  devLog(`[PROGRESS] getUserPlan: Fetching plan for user ${userId}`);

  const [user, purchases, subscription, mobilePurchase] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { hasPaid: true } }),
    prisma.purchase.findMany({ where: { userId, status: "succeeded" }, select: { planId: true } }),
    // Align with hasActiveCourseAccess: past_due only counts inside gracePeriodEndsAt.
    prisma.subscription.findFirst({
      where: {
        userId,
        OR: [
          { status: { in: ["active", "trialing"] } },
          {
            status: "past_due",
            gracePeriodEndsAt: { gte: new Date() },
          },
        ],
      },
      select: { id: true },
    }),
    prisma.mobilePurchase.findFirst({
      where: {
        userId,
        status: "active",
        OR: [
          { purchaseType: "lifetime" },
          { purchaseType: "subscription", currentPeriodEnd: { gte: new Date() } },
        ],
      },
      select: { id: true },
    }),
  ]);

  if (purchases.some((p) => p.planId === "complete") || user?.hasPaid || subscription || mobilePurchase) {
    return "complete";
  }
  if (purchases.some((p) => p.planId === "essentials")) {
    return "essentials";
  }
  return null;
}

export async function recomputeAndSaveStatus(
  learnerProfileId: string,
  partNumber: number,
  userPlan: UserPlan,
) {
  const row = await prisma.partProgress.findUniqueOrThrow({
    where: { learnerProfileId_partNumber: { learnerProfileId, partNumber } },
    select: {
      videoWatchPercent: true,
      videoCompleted: true,
      briefingOpened: true,
      quizCompleted: true,
      quizBestScore: true,
      quizPassed: true,
      quizScoreVerified: true,
      flashcardsReviewed: true,
      openedAssets: true,
      startedAt: true,
      completedAt: true,
      masteredAt: true,
    },
  });
  const snap = parseProgressRow(row);
  const newStatus = computeStatus(snap, userPlan);

  const update: Record<string, unknown> = { status: newStatus };
  if (newStatus === "completed" && !row.completedAt) {
    update.completedAt = new Date();
  }
  if (newStatus === "mastered" && !row.masteredAt) {
    update.masteredAt = new Date();
  }

  await prisma.partProgress.update({
    where: { learnerProfileId_partNumber: { learnerProfileId, partNumber } },
    data: update,
  });
}

/** Apply a server-regraded quiz score (never call with a client-supplied score). */
export async function applyVerifiedQuizScore(
  userId: string,
  learnerProfileId: string,
  partNumber: number,
  score: number,
  userPlan: UserPlan,
): Promise<{ score: number; passed: boolean; bestScore: number }> {
  const raw = Number(score);
  if (!Number.isFinite(raw)) {
    return { score: 0, passed: false, bestScore: 0 };
  }
  const clamped = Math.min(100, Math.max(0, Math.round(raw)));
  const passed = clamped >= QUIZ_PASS_SCORE;

  await prisma.partProgress.upsert({
    where: { learnerProfileId_partNumber: { learnerProfileId, partNumber } },
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

  const alwaysFields = {
    quizCompleted: true,
    quizScore: clamped,
    quizAttempts: { increment: 1 as const },
    lastAccessedAt: new Date(),
  };
  const updatedHigh = await prisma.partProgress.updateMany({
    where: {
      learnerProfileId,
      partNumber,
      OR: [{ quizBestScore: null }, { quizBestScore: { lt: clamped } }],
    },
    data: {
      ...alwaysFields,
      quizBestScore: clamped,
      quizScoreVerified: true,
      quizPassed: clamped >= QUIZ_PASS_SCORE,
    },
  });

  if (updatedHigh.count === 0) {
    const tieUpdated = await prisma.partProgress.updateMany({
      where: { learnerProfileId, partNumber, quizBestScore: clamped },
      data: { ...alwaysFields, quizScoreVerified: true },
    });
    if (tieUpdated.count === 0) {
      await prisma.partProgress.update({
        where: { learnerProfileId_partNumber: { learnerProfileId, partNumber } },
        data: alwaysFields,
      });
    }
  }

  const saved = await prisma.partProgress.findUnique({
    where: { learnerProfileId_partNumber: { learnerProfileId, partNumber } },
    select: { quizBestScore: true },
  });
  const bestScore = saved?.quizBestScore ?? clamped;

  await recomputeAndSaveStatus(learnerProfileId, partNumber, userPlan);
  return { score: clamped, passed, bestScore };
}
