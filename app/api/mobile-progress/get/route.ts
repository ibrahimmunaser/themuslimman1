import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getActiveProfileId } from "@/app/actions/profiles";
import { getUserPlan } from "@/lib/progress-writes";
import { hasActiveCourseAccess } from "@/lib/access";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * GET /api/mobile-progress/get
 *
 * Returns the learner's full course progress for the Flutter app.
 * Accepts cookie-based auth.
 *
 * Response:
 * {
 *   viewedParts: number[],
 *   completedParts: number[],
 *   quizScores: { [partNumber: string]: number },
 *   lastPartNumber: number | null,
 *   activeProfileId: string,
 * }
 *
 * activeProfileId lets the Flutter app scope its local on-device cache per
 * learner profile — without it, switching profiles on a shared family
 * device could show one learner's progress merged into another's.
 */
export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Audit L-mobile-progress-get-ratelimit: this route was the one
    // mobile-progress endpoint left with zero rate limiting after the
    // track/bulk-sync fix (Audit H1) — a per-user cap here too, generous
    // enough for legitimate polling (app resume, profile switch,
    // pull-to-refresh) but bounded against a runaway client-side retry loop
    // or scripted abuse hammering this DB query.
    const rl = await checkRateLimit(`mobile-progress-get:${user.id}`, 120, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
      );
    }

    const hasAccess = await hasActiveCourseAccess(user.id, user.hasPaid);

    // Completion criteria are plan-dependent (see lib/progress.ts isCompleted):
    // "essentials" plan-holders complete a part via video + briefing alone,
    // never a quiz. Defaults to the stricter "complete" plan if undetermined
    // (e.g. no active access at all) so nothing is ever over-counted.
    const userPlan = (await getUserPlan(user.id, user.hasPaid)) ?? "complete";

    const learnerProfileId = await getActiveProfileId(user.id);

    const rows = await prisma.partProgress.findMany({
      where: { learnerProfileId },
      select: {
        partNumber: true,
        status: true,
        quizBestScore: true,
        quizPassed: true,
        quizScoreVerified: true,
        lastAccessedAt: true,
      },
    });

    const viewedParts: number[] = [];
    const completedParts: number[] = [];
    const quizScores: Record<string, number> = {};
    let lastPartNumber: number | null = null;

    for (const row of rows) {
      viewedParts.push(row.partNumber);
      // A part counts as "completed" via either of the two paths
      // lib/progress.ts's isCompleted() defines, matching web exactly:
      //  - "complete" plan: quiz passed AND server-verified from real answers
      //    (Audit C4) — a bulk-synced legacy/offline score with no answers to
      //    re-grade must never permanently inflate this list.
      //  - "essentials" plan: video + briefing only, quiz never required.
      //    `status` is recomputeAndSaveStatus's stored, plan-aware result —
      //    safe to trust directly here since the essentials path never
      //    depends on a client-reported quiz score at all. Previously this
      //    only checked quizPassed, so an essentials-tier web customer
      //    (Purchase.planId === "essentials") who signed into the mobile app
      //    saw 0% progress forever, since essentials completion never
      //    requires taking a quiz.
      const quizComplete = row.quizPassed && row.quizScoreVerified;
      const essentialsComplete =
        userPlan === "essentials" && (row.status === "completed" || row.status === "mastered");
      if (quizComplete || essentialsComplete) completedParts.push(row.partNumber);
      if (row.quizBestScore !== null) quizScores[String(row.partNumber)] = row.quizBestScore;
    }

    // "Continue Learning" must resolve to the FURTHEST part reached, not
    // whichever row happens to have the most recent lastAccessedAt. The
    // latter is not monotonic: briefly reopening an earlier part to review
    // it (on this device or another one sharing the same learner profile,
    // e.g. a family iPad and a parent's phone) touches lastAccessedAt and
    // would otherwise send "Continue Learning" backward even though real
    // progress is further along. MAX(partNumber) can only ever go up as new
    // parts are viewed, so it can never regress.
    if (rows.length > 0) {
      lastPartNumber = Math.max(...rows.map((r) => r.partNumber));
    }

    return NextResponse.json({
      hasAccess,
      viewedParts,
      completedParts,
      quizScores,
      lastPartNumber,
      activeProfileId: learnerProfileId,
    });
  } catch (err) {
    console.error("[mobile-progress/get]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
