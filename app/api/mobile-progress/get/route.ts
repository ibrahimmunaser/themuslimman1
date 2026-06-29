import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getActiveProfileId } from "@/app/actions/profiles";
import { hasActiveCourseAccess } from "@/lib/access";

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
 * }
 */
export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const hasAccess = await hasActiveCourseAccess(user.id, user.hasPaid);

    const learnerProfileId = await getActiveProfileId(user.id);

    const rows = await prisma.partProgress.findMany({
      where: { learnerProfileId },
      select: {
        partNumber: true,
        status: true,
        quizBestScore: true,
        quizPassed: true,
        lastAccessedAt: true,
      },
      orderBy: { lastAccessedAt: "desc" },
    });

    const viewedParts: number[] = [];
    const completedParts: number[] = [];
    const quizScores: Record<string, number> = {};
    let lastPartNumber: number | null = null;

    for (const row of rows) {
      viewedParts.push(row.partNumber);
      if (row.quizPassed) completedParts.push(row.partNumber);
      if (row.quizBestScore !== null) quizScores[String(row.partNumber)] = row.quizBestScore;
    }

    if (rows.length > 0) {
      lastPartNumber = rows[0].partNumber;
    }

    return NextResponse.json({
      hasAccess,
      viewedParts,
      completedParts,
      quizScores,
      lastPartNumber,
    });
  } catch (err) {
    console.error("[mobile-progress/get]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
