import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getActiveProfileId } from "@/app/actions/profiles";
import { hasActiveCourseAccess } from "@/lib/access";

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
 *   }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const hasAccess = await hasActiveCourseAccess(user.id, user.hasPaid);
    if (!hasAccess) return NextResponse.json({ error: "No active subscription" }, { status: 403 });

    const body = (await request.json()) as {
      viewedParts?: unknown;
      quizScores?: unknown;
    };

    const isValidPart = (n: unknown): n is number =>
      typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 100;

    const viewedParts = Array.isArray(body.viewedParts)
      ? body.viewedParts.filter(isValidPart)
      : [];
    const quizScoresRaw =
      body.quizScores && typeof body.quizScores === "object" && !Array.isArray(body.quizScores)
        ? (body.quizScores as Record<string, unknown>)
        : {};

    const partNumbers = new Set<number>(viewedParts);
    for (const key of Object.keys(quizScoresRaw)) {
      const n = Number(key);
      if (isValidPart(n)) partNumbers.add(n);
    }

    if (partNumbers.size === 0) {
      return NextResponse.json({ success: true, merged: 0 });
    }

    const userId = user.id;
    const learnerProfileId = await getActiveProfileId(userId);
    const parts = [...partNumbers].slice(0, MAX_PARTS_PER_REQUEST);

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
        update: { lastAccessedAt: new Date(), updatedAt: new Date() },
      });

      const rawScore = quizScoresRaw[String(partNumber)];
      const score =
        typeof rawScore === "number" && Number.isFinite(rawScore)
          ? Math.min(100, Math.max(0, Math.round(rawScore)))
          : null;

      if (score !== null) {
        await prisma.$executeRaw`
          UPDATE "PartProgress"
          SET
            "quizCompleted" = true,
            "quizScore" = ${score},
            "quizBestScore" = GREATEST(COALESCE("quizBestScore", 0), ${score}),
            "quizPassed" = GREATEST(COALESCE("quizBestScore", 0), ${score}) >= ${PASS_SCORE},
            "quizAttempts" = GREATEST("quizAttempts", 1),
            "updatedAt" = NOW()
          WHERE "learnerProfileId" = ${learnerProfileId} AND "partNumber" = ${partNumber}
        `;
      }

      merged++;
    }

    return NextResponse.json({ success: true, merged });
  } catch (err) {
    console.error("[mobile-progress/bulk-sync]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
