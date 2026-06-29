import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getActiveProfileId } from "@/app/actions/profiles";
import { hasActiveCourseAccess } from "@/lib/access";

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
    if (!user.emailVerified) return NextResponse.json({ error: "Email not verified" }, { status: 403 });

    const hasAccess = await hasActiveCourseAccess(user.id, user.hasPaid);
    if (!hasAccess) return NextResponse.json({ error: "No active subscription" }, { status: 403 });

    const body = await request.json() as Record<string, unknown>;
    const { type, partNumber } = body;

    if (typeof partNumber !== "number" || partNumber < 1 || partNumber > 100) {
      return NextResponse.json({ error: "Invalid partNumber" }, { status: 400 });
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
        const VIDEO_THRESHOLD = 80;
        await prisma.partProgress.updateMany({
          where: { learnerProfileId, partNumber, videoWatchPercent: { lt: clamped } },
          data:  { videoWatchPercent: clamped, videoCompleted: clamped >= VIDEO_THRESHOLD, updatedAt: new Date() },
        });
        break;
      }

      case "quiz_completed": {
        const rawScore = body.score;
        if (typeof rawScore !== "number" || !Number.isFinite(rawScore)) {
          return NextResponse.json({ error: "Invalid score" }, { status: 400 });
        }
        const clamped = Math.min(100, Math.max(0, Math.round(rawScore)));
        const PASS_SCORE = 80;
        const alwaysFields = { quizCompleted: true, quizScore: clamped, quizAttempts: { increment: 1 as const }, lastAccessedAt: new Date(), updatedAt: new Date() };
        const updated = await prisma.partProgress.updateMany({
          where: { learnerProfileId, partNumber, OR: [{ quizBestScore: null }, { quizBestScore: { lt: clamped } }] },
          data:  { ...alwaysFields, quizBestScore: clamped, quizPassed: clamped >= PASS_SCORE },
        });
        if (updated.count === 0) {
          await prisma.partProgress.update({
            where: { learnerProfileId_partNumber: { learnerProfileId, partNumber } },
            data: alwaysFields,
          });
        }
        break;
      }

      default:
        return NextResponse.json({ error: "Unknown event type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[mobile-progress/track]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
