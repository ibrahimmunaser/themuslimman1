import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getActiveProfileId } from "@/app/actions/profiles";
import { hasActiveCourseAccess, TOTAL_COURSE_PARTS } from "@/lib/access";
import { getPartPageData } from "@/lib/part-content-cache";
import { computeQuizScore, VIDEO_COMPLETION_THRESHOLD } from "@/lib/progress";
import { getUserPlan, recomputeAndSaveStatus } from "@/lib/progress-writes";
import { checkRateLimit } from "@/lib/rate-limit";
import type { Quiz } from "@/lib/types";

const PASS_SCORE = 80;
const MAX_PARTS_PER_REQUEST = 100;

/**
 * POST /api/mobile-progress/bulk-sync
 *
 * One-time, best-effort merge of progress recorded locally on a device (as a
 * guest, or before creating an account / before signing in on a new device)
 * onto the now-authenticated user. Called once by the Flutter app right
 * after account creation (upgrade-account) or a successful login.
 *
 * Purely additive and idempotent: for each part, quiz scores only ever move
 * up (GREATEST), and "viewed" rows are only created if missing — nothing
 * server-side is ever downgraded or overwritten with older/lower local data.
 *
 * Body:
 *   {
 *     viewedParts?: number[],
 *     quizScores?: { [partNumber: string]: number },
 *     quizAnswers?: { [partNumber: string]: { [questionId: string]: string } },
 *     videoWatchPercents?: { [partNumber: string]: number },
 *   }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // This route does up to MAX_PARTS_PER_REQUEST (100) DB round-trips per
    // call and now runs automatically on every app start/profile-switch (see
    // progress_provider.dart's ProgressNotifier._syncFromServer), not just
    // right after login/upgrade — bound it per-user so a misbehaving or
    // malicious client can't turn that into a DB-hammering loop.
    const rl = await checkRateLimit(`mobile-progress-bulk-sync:${user.id}`, 12, 5 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }

    const body = (await request.json()) as {
      viewedParts?: unknown;
      quizScores?: unknown;
      quizAnswers?: unknown;
      videoWatchPercents?: unknown;
    };

    const isValidPart = (n: unknown): n is number =>
      typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= TOTAL_COURSE_PARTS;

    const viewedParts = Array.isArray(body.viewedParts)
      ? body.viewedParts.filter(isValidPart)
      : [];
    const quizScoresRaw =
      body.quizScores && typeof body.quizScores === "object" && !Array.isArray(body.quizScores)
        ? (body.quizScores as Record<string, unknown>)
        : {};
    // Per-question answers (questionId -> chosen option text) cached
    // alongside each score on the client — when present for a part, the
    // score is independently recomputed here instead of trusting the raw
    // number, closing the same forgeable-score gap that /track closes.
    // Older cached local data (recorded before this fix shipped) won't have
    // this, so it falls back to trusting the number for a graceful
    // migration — new quiz attempts always populate it going forward.
    const quizAnswersRaw =
      body.quizAnswers && typeof body.quizAnswers === "object" && !Array.isArray(body.quizAnswers)
        ? (body.quizAnswers as Record<string, unknown>)
        : {};
    // Audit C4: offline video/audio watch % previously never reached the
    // server (track is fire-and-forget, bulk-sync ignored it).
    const videoWatchRaw =
      body.videoWatchPercents &&
      typeof body.videoWatchPercents === "object" &&
      !Array.isArray(body.videoWatchPercents)
        ? (body.videoWatchPercents as Record<string, unknown>)
        : {};

    let partNumbers = new Set<number>(viewedParts);
    for (const key of Object.keys(quizScoresRaw)) {
      const n = Number(key);
      if (isValidPart(n)) partNumbers.add(n);
    }
    for (const key of Object.keys(videoWatchRaw)) {
      const n = Number(key);
      if (isValidPart(n)) partNumbers.add(n);
    }

    // Part 1 is always free (mirrors lib/part-access.ts's requirePartAccess).
    // Gating this whole endpoint on hasActiveCourseAccess meant a guest who
    // only ever browsed the free Part 1 lost that local progress the moment
    // they signed up/signed in — the exact scenario pushLocalToServer/
    // bulk-sync exists to preserve. Only drop parts > 1 when access is
    // missing; Part 1 always merges.
    const hasAccess = await hasActiveCourseAccess(user.id, user.hasPaid);
    if (!hasAccess) {
      partNumbers = new Set([...partNumbers].filter((n) => n === 1));
    }

    if (partNumbers.size === 0) {
      return NextResponse.json({ success: true, merged: 0 });
    }

    const userId = user.id;
    const learnerProfileId = await getActiveProfileId(userId);
    const parts = [...partNumbers].slice(0, MAX_PARTS_PER_REQUEST);
    // See /api/mobile-progress/track for why this defaults to "complete" —
    // mobile has no "essentials"-tier purchase path.
    const userPlan = (await getUserPlan(userId, user.hasPaid)) ?? "complete";

    let merged = 0;
    for (const partNumber of parts) {
      await prisma.partProgress.upsert({
        where: { learnerProfileId_partNumber: { learnerProfileId, partNumber } },
        create: {
          id: crypto.randomUUID(),
          userId,
          learnerProfileId,
          partNumber,
          status: "started",
          startedAt: new Date(),
          lastAccessedAt: new Date(),
          updatedAt: new Date(),
        },
        // Deliberately do NOT touch lastAccessedAt on update. This is called
        // with the device's ENTIRE cumulative local viewedParts set every
        // time (see the doc comment above), not just newly-added parts —
        // so bumping lastAccessedAt to "now" for every already-tracked part
        // on every call would make it meaningless for its two real
        // purposes: the parent dashboard's "last activity" timestamp
        // (getProfilesWithProgress) and, historically, Continue Learning's
        // resume point (now derived from MAX(partNumber) instead — see
        // mobile-progress/get — specifically because this timestamp isn't
        // trustworthy across a bulk merge like this one).
        update: { updatedAt: new Date() },
      });

      const rawScore = quizScoresRaw[String(partNumber)];
      let score =
        typeof rawScore === "number" && Number.isFinite(rawScore)
          ? Math.min(100, Math.max(0, Math.round(rawScore)))
          : null;

      const rawAnswers = quizAnswersRaw[String(partNumber)];
      // Was this score independently recomputed from real answers, or merely
      // trusted as-sent from an older/offline client cache with no answers to
      // re-grade? Only the former may ever mark quizScoreVerified = true —
      // see the migration note on PartProgress.quizScoreVerified (Audit C4).
      let verified = false;
      if (
        score !== null &&
        rawAnswers &&
        typeof rawAnswers === "object" &&
        !Array.isArray(rawAnswers)
      ) {
        const partData = await getPartPageData(partNumber);
        const quizData = partData.quizData as Quiz | null | undefined;
        // If a quiz genuinely exists for this part, the answers we were
        // given are authoritative — recompute and DISCARD the client's
        // number entirely rather than merely sanity-checking it, so a
        // forged high score submitted alongside real (lower-scoring)
        // answers can't sneak through.
        if (quizData && quizData.questions.length > 0) {
          score = computeQuizScore(quizData, rawAnswers as Record<string, string>);
          verified = true;
        }
      }

      if (score !== null && verified) {
        // Only verified (re-graded from answers) scores may raise best /
        // flip passed / set quizScoreVerified. Unverified offline caches
        // must not demote trust or invent a new best (Audit H5).
        await prisma.$executeRaw`
          UPDATE "PartProgress"
          SET
            "quizCompleted" = true,
            "quizScore" = ${score},
            "quizBestScore" = GREATEST(COALESCE("quizBestScore", 0), ${score}),
            "quizScoreVerified" = CASE
              WHEN ${score} > COALESCE("quizBestScore", 0) THEN true
              WHEN ${score} = COALESCE("quizBestScore", 0) THEN true
              ELSE "quizScoreVerified"
            END,
            "quizPassed" = GREATEST(COALESCE("quizBestScore", 0), ${score}) >= ${PASS_SCORE},
            "quizAttempts" = "quizAttempts" + 1,
            "updatedAt" = NOW()
          WHERE "learnerProfileId" = ${learnerProfileId} AND "partNumber" = ${partNumber}
        `;
      } else if (score !== null) {
        // Unverified: record the attempt metadata only — never touch best/passed/verified.
        await prisma.$executeRaw`
          UPDATE "PartProgress"
          SET
            "quizCompleted" = true,
            "quizScore" = ${score},
            "quizAttempts" = "quizAttempts" + 1,
            "updatedAt" = NOW()
          WHERE "learnerProfileId" = ${learnerProfileId} AND "partNumber" = ${partNumber}
        `;
      }

      const rawWatch = videoWatchRaw[String(partNumber)];
      if (typeof rawWatch === "number" && Number.isFinite(rawWatch)) {
        const clamped = Math.min(100, Math.max(0, Math.round(rawWatch)));
        // Same monotonic update as /track's video_progress case — never
        // lower an existing higher watch percent.
        // Sticky videoCompleted — never write false on a sub-threshold bump.
        await prisma.partProgress.updateMany({
          where: { learnerProfileId, partNumber, videoWatchPercent: { lt: clamped } },
          data: {
            videoWatchPercent: clamped,
            ...(clamped >= VIDEO_COMPLETION_THRESHOLD ? { videoCompleted: true } : {}),
            updatedAt: new Date(),
          },
        });
      }

      // Same status-desync issue as /track: this raw upsert/executeRaw path
      // never wrote `PartProgress.status`, so a bulk-merged part stayed
      // "started" on the web dashboard indefinitely.
      await recomputeAndSaveStatus(learnerProfileId, partNumber, userPlan);

      merged++;
    }

    return NextResponse.json({ success: true, merged });
  } catch (err) {
    console.error("[mobile-progress/bulk-sync]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
