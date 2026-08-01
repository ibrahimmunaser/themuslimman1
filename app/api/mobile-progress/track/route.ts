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

// Valid asset IDs the mobile app can report.
const VALID_ASSET_IDS = new Set([
  "video", "audio", "briefing", "study_guide", "flashcard",
  "slides", "infographic", "mindmap", "statement-of-facts", "quiz",
]);

/**
 * POST /api/mobile-progress/track
 *
 * Unified progress-tracking endpoint for the Flutter mobile app.
 * Accepts cookie-based auth (same session cookies as the web app).
 *
 * Body:
 *   { type: "part_opened" | "asset_opened" | "quiz_completed" | "video_progress", partNumber, ...extras }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // Note: deliberately NOT gated on emailVerified — mobile guest accounts
    // (created by /api/auth/mobile-anonymous) have no email to verify, and
    // real accounts created via /api/auth/upgrade-account aren't verified
    // until the user clicks the email link. Gating here silently dropped
    // 100% of mobile progress tracking. Access is still gated below.

    // Per-user (not per-IP — this is authenticated) rate limit. Legitimate
    // usage is bursty but bounded: a part's tabs (video/audio/slides/quiz)
    // each fire one event on open, plus periodic video-progress ticks —
    // 120/min comfortably covers real usage while still bounding an
    // authenticated client that hammers this with up to hundreds of
    // DB round-trips per call otherwise.
    const rl = await checkRateLimit(`mobile-progress-track:${user.id}`, 120, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }

    const body = await request.json() as Record<string, unknown>;
    const { type, partNumber } = body;

    if (typeof partNumber !== "number" || partNumber < 1 || partNumber > TOTAL_COURSE_PARTS) {
      return NextResponse.json({ error: "Invalid partNumber" }, { status: 400 });
    }

    // Part 1 is always free (mirrors lib/part-access.ts's requirePartAccess)
    // — gating this whole endpoint on hasActiveCourseAccess with no carve-out
    // meant every free-tier user's Part 1 activity 403'd and only ever
    // survived in local SharedPreferences, lost on reinstall/new device.
    if (partNumber !== 1) {
      const hasAccess = await hasActiveCourseAccess(user.id, user.hasPaid);
      if (!hasAccess) return NextResponse.json({ error: "No active subscription" }, { status: 403 });
    }

    const userId = user.id;
    const learnerProfileId = await getActiveProfileId(userId);

    // Ensure the progress row exists.
    await prisma.partProgress.upsert({
      where:  { learnerProfileId_partNumber: { learnerProfileId, partNumber } },
      create: { id: crypto.randomUUID(), userId, learnerProfileId, partNumber, status: "started", startedAt: new Date(), lastAccessedAt: new Date(), updatedAt: new Date() },
      update: { lastAccessedAt: new Date(), updatedAt: new Date() },
    });

    switch (type) {
      case "part_opened": {
        // Already handled by the upsert above.
        break;
      }

      case "asset_opened": {
        const assetId = body.assetId as string | undefined;
        if (!assetId || !VALID_ASSET_IDS.has(assetId)) {
          return NextResponse.json({ error: "Invalid assetId" }, { status: 400 });
        }
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
            "briefingOpened"     = CASE WHEN ${isBriefing}  THEN true ELSE "briefingOpened"     END,
            "flashcardsReviewed" = CASE WHEN ${isFlashcard} THEN true ELSE "flashcardsReviewed" END,
            "lastAccessedAt" = NOW(),
            "updatedAt" = NOW()
          WHERE "learnerProfileId" = ${learnerProfileId}
            AND "partNumber" = ${partNumber}
        `;
        break;
      }

      case "video_progress": {
        const rawPct = body.watchPercent;
        if (typeof rawPct !== "number") {
          return NextResponse.json({ error: "Invalid watchPercent" }, { status: 400 });
        }
        const clamped = Math.min(100, Math.max(0, Math.round(rawPct)));
        // Audit H8 fix: this used to hardcode its own 80% threshold, diverging
        // from web's shared VIDEO_COMPLETION_THRESHOLD (85%, lib/progress.ts) —
        // a part could show "video complete" on mobile at 82% watched but not
        // on web for the exact same PartProgress row, since both platforms
        // read the same videoCompleted flag from the same table.
        // videoCompleted is sticky (lib/progress.ts): once true, never clear it
        // by writing `false` on a sub-threshold bump (e.g. legacy 80–84% rows).
        await prisma.partProgress.updateMany({
          where: { learnerProfileId, partNumber, videoWatchPercent: { lt: clamped } },
          data: {
            videoWatchPercent: clamped,
            ...(clamped >= VIDEO_COMPLETION_THRESHOLD ? { videoCompleted: true } : {}),
            updatedAt: new Date(),
          },
        });
        break;
      }

      case "quiz_completed": {
        // The score is never trusted as-sent — it's trivial to POST here
        // directly (curl/devtools) with `{ score: 100 }` and no client at
        // all. Require the raw per-question answers and recompute the score
        // server-side from the part's authoritative correct_answer values,
        // exactly like the web's submitQuizAnswers.
        const answers = body.answers;
        if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
          return NextResponse.json({ error: "Quiz answers required" }, { status: 400 });
        }
        const partData = await getPartPageData(partNumber);
        const quizData = partData.quizData as Quiz | null | undefined;
        if (!quizData || quizData.questions.length === 0) {
          return NextResponse.json({ error: "No quiz data for this part" }, { status: 400 });
        }
        const clamped = computeQuizScore(quizData, answers as Record<string, string>);
        const PASS_SCORE = 80;
        const alwaysFields = { quizCompleted: true, quizScore: clamped, quizAttempts: { increment: 1 as const }, lastAccessedAt: new Date(), updatedAt: new Date() };
        // quizScoreVerified is only ever set alongside quizBestScore itself
        // (this attempt is always freshly re-graded from real answers, so
        // it's fine to mark verified whenever it becomes the new best) — the
        // no-op branch below must NOT touch it, or a genuinely unverified
        // legacy best score would get relabeled "verified" by an unrelated,
        // lower-scoring attempt that never touched quizBestScore at all.
        const updated = await prisma.partProgress.updateMany({
          where: { learnerProfileId, partNumber, OR: [{ quizBestScore: null }, { quizBestScore: { lt: clamped } }] },
          data:  { ...alwaysFields, quizBestScore: clamped, quizScoreVerified: true, quizPassed: clamped >= PASS_SCORE },
        });
        if (updated.count === 0) {
          // Tie with existing best: upgrade quizScoreVerified (mirrors bulk-sync)
          // so a freshly re-graded attempt can clear a legacy unverified best.
          // Lower scores must NOT touch quizScoreVerified.
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
        break;
      }

      default:
        return NextResponse.json({ error: "Unknown event type" }, { status: 400 });
    }

    // Mobile writes went straight through prisma.$executeRaw/updateMany above
    // and never touched `PartProgress.status` — the web dashboard, progress
    // page, and certificate all read that column, so a part finished
    // exclusively on mobile silently stayed "started" forever there even
    // though every underlying field (quiz, video, briefing) was correct.
    // No "essentials"-tier purchase path exists on mobile, so default to
    // "complete" when the user has no billing record we recognize yet
    // (e.g. a guest tracking the free Part 1).
    const userPlan = (await getUserPlan(userId, user.hasPaid)) ?? "complete";
    await recomputeAndSaveStatus(learnerProfileId, partNumber, userPlan);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[mobile-progress/track]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
