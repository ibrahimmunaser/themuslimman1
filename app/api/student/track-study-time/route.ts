import { NextRequest, NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getActiveProfileId } from "@/app/actions/profiles";

export async function POST(request: NextRequest) {
  try {
    const user = await requireStudent();
    const body = await request.json();
    
    const { partNumber, secondsToAdd } = body;
    
    if (!partNumber || typeof partNumber !== "number") {
      return NextResponse.json(
        { error: "Valid partNumber is required" },
        { status: 400 }
      );
    }
    
    if (!secondsToAdd || typeof secondsToAdd !== "number" || secondsToAdd <= 0) {
      return NextResponse.json(
        { error: "Valid secondsToAdd is required" },
        { status: 400 }
      );
    }
    
    // Limit to reasonable values (max 5 minutes per update to prevent abuse)
    const cappedSeconds = Math.min(secondsToAdd, 300);
    
    // Resolve active learner profile for study time tracking.
    const learnerProfileId = await getActiveProfileId(user.id);

    // Find or create a study session for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingSession = await prisma.studySession.findFirst({
      where: {
        userId: user.id,
        learnerProfileId,
        partNumber,
        startedAt: {
          gte: today,
        },
      },
      orderBy: {
        startedAt: "desc",
      },
    });
    
    if (existingSession) {
      await prisma.studySession.update({
        where: { id: existingSession.id },
        data: {
          secondsTracked: {
            increment: cappedSeconds,
          },
          lastUpdatedAt: new Date(),
        },
      });
    } else {
      await prisma.studySession.create({
        data: {
          userId: user.id,
          learnerProfileId,
          partNumber,
          secondsTracked: cappedSeconds,
          lastUpdatedAt: new Date(),
        },
      });
    }
    
    return NextResponse.json({
      success: true,
      secondsTracked: cappedSeconds,
    });
  } catch (error) {
    console.error("Track study time error:", error);
    return NextResponse.json(
      { error: "Failed to track study time" },
      { status: 500 }
    );
  }
}
