import { NextRequest, NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getActiveProfileId } from "@/app/actions/profiles";
import { generateParentProgressReport } from "@/lib/emails/parent-progress-report";
import { Resend } from "resend";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(_req: NextRequest) {
  try {
    const user = await requireStudent();

    // Rate-limit per user: 3 reports per hour — prevents inbox flooding / Resend abuse.
    const rl = checkRateLimit(`progress-report:${user.id}`, 3, 60 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "You've sent too many reports recently. Please wait before sending another." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }

    // Check if user has a verified parent email configured
    if (!user.parentEmail) {
      return NextResponse.json(
        { error: "No parent email configured" },
        { status: 400 }
      );
    }
    if (!user.parentEmailVerified) {
      return NextResponse.json(
        { error: "Parent email is not yet verified. Please ask your parent to verify their email first." },
        { status: 400 }
      );
    }

    // Scope progress report to the active learner profile.
    const learnerProfileId = await getActiveProfileId(user.id);

    // Get user's progress data
    const progressData = await prisma.partProgress.findMany({
      where: { learnerProfileId },
      orderBy: { partNumber: "asc" },
      select: {
        partNumber:        true,
        status:            true,
        videoWatchPercent: true,
        briefingOpened:    true,
        quizBestScore:     true,
        updatedAt:         true,
        quizPassed:        true,
        flashcardsReviewed:true,
        startedAt:         true,
        completedAt:       true,
        masteredAt:        true,
        lastAccessedAt:    true,
      },
    });

    // Determine user plan — check both lifetime purchase AND active subscription
    // so monthly subscribers get the "complete" report template.
    const [lifetimePurchase, activeSub] = await Promise.all([
      prisma.purchase.findFirst({ where: { userId: user.id, status: "succeeded" } }),
      prisma.subscription.findFirst({
        where: { userId: user.id, status: { in: ["active", "trialing"] } },
      }),
    ]);
    const userPlan = lifetimePurchase || activeSub ? "complete" : "essentials";
    
    const totalLessons = 100;
    // Quiz-passed is the canonical completion signal — "completed" DB status is legacy.
    const completedLessons = progressData.filter((p) => p.quizPassed).length;
    
    // Calculate weekly activity (past 7 days).
    // DB writes "started" for in-progress parts — "in_progress" is a UI-only label.
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyProgress = progressData.filter(
      (p) => p.updatedAt >= oneWeekAgo && (p.quizPassed || p.status === "started")
    );
    
    const weeklyLessons = weeklyProgress.filter((p) => p.quizPassed).length;
    const weeklyBriefings = progressData.filter(
      (p) => p.briefingOpened && p.updatedAt >= oneWeekAgo
    ).length;
    
    // Get actual tracked study time — scoped to the active learner profile so
    // family plan study time from other profiles is not merged in.
    const allStudySessions = await prisma.studySession.findMany({
      where: { userId: user.id, learnerProfileId },
    });
    
    const weeklyStudySessions = allStudySessions.filter(
      (s) => s.startedAt >= oneWeekAgo
    );
    
    const totalStudySeconds = allStudySessions.reduce((sum, s) => sum + s.secondsTracked, 0);
    const weeklyStudySeconds = weeklyStudySessions.reduce((sum, s) => sum + s.secondsTracked, 0);
    
    // Convert to hours (rounded to 1 decimal)
    const studyTimeHours = Math.round((totalStudySeconds / 3600) * 10) / 10;
    const weeklyStudyTime = Math.round((weeklyStudySeconds / 3600) * 10) / 10;
    
    // Check if there's any weekly activity
    const hasWeeklyActivity = weeklyProgress.length > 0 || weeklyStudySeconds > 0;

    // Find current and next lesson
    const lastAccessedPart = progressData
      .filter((p) => p.lastAccessedAt)
      .sort((a, b) => {
        if (!a.lastAccessedAt || !b.lastAccessedAt) return 0;
        return b.lastAccessedAt.getTime() - a.lastAccessedAt.getTime();
      })[0];
    
    const currentLessonNumber = lastAccessedPart ? lastAccessedPart.partNumber : 1;
    const currentLessonData = progressData.find((p) => p.partNumber === currentLessonNumber);
    const currentLessonStatus = currentLessonData?.status || "not_started";
    const nextLessonNumber = Math.min(currentLessonNumber + 1, totalLessons);

    // Get quiz stats for Complete users (if they have a student profile)
    let quizScore: number | undefined;
    let quizAttempts = 0;
    let flashcardsReviewed = 0;
    let weeklyQuizzes = 0;
    let weeklyFlashcards = 0;

    if (userPlan === "complete" && user.studentProfileId) {
      const allQuizAttempts = await prisma.quizAttempt.findMany({
        where: { 
          studentId: user.studentProfileId,
          submittedAt: { not: null },
        },
      });

      quizAttempts = allQuizAttempts.length;
      
      // Calculate weekly quizzes
      weeklyQuizzes = allQuizAttempts.filter(
        (q) => q.submittedAt && q.submittedAt >= oneWeekAgo
      ).length;
      
      if (allQuizAttempts.length > 0) {
        const validScores = allQuizAttempts.filter(a => a.score !== null);
        if (validScores.length > 0) {
          const avgScore =
            validScores.reduce((sum, attempt) => sum + (attempt.score || 0), 0) /
            validScores.length;
          quizScore = Math.round(avgScore);
        }
      }

      flashcardsReviewed = progressData.filter((p) => p.flashcardsReviewed).length;
      weeklyFlashcards = weeklyProgress.filter((p) => p.flashcardsReviewed).length;
    }
    
    const briefingsRead = progressData.filter((p) => p.briefingOpened).length;

    // Generate email
    const emailHtml = generateParentProgressReport({
      studentName: user.studentName || user.fullName,
      parentName: "", // Don't try to extract name from email
      userPlan: userPlan as "essentials" | "complete",
      lessonsWatched: completedLessons,
      totalLessons,
      briefingsRead,
      studyTimeHours,
      currentLesson: {
        number: currentLessonNumber,
        title: `Part ${currentLessonNumber}`,
        status: currentLessonStatus as "not_started" | "in_progress" | "completed",
      },
      suggestedNextLesson: {
        number: nextLessonNumber,
        title: `Part ${nextLessonNumber}`,
      },
      // Weekly activity data
      weeklyLessons,
      weeklyBriefings,
      weeklyQuizzes,
      weeklyFlashcards,
      weeklyStudyTime,
      hasWeeklyActivity,
      // Complete-only stats
      quizScore,
      quizAttempts,
      flashcardsReviewed,
      weakAreas: [],
      strongAreas: [],
      recommendedReview: [],
      certificateProgress: 0,
    });

    // Send email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { error: emailError } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Complete Seerah <noreply@themuslimman.com>",
      to: user.parentEmail,
      subject: `${user.studentName || user.fullName}'s Weekly Seerah Progress Report`,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Failed to send progress report:", emailError);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    console.log(`[EMAIL] Progress report sent to parent of user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: "Progress report sent successfully",
    });
  } catch (error) {
    console.error("Send progress report error:", error);
    return NextResponse.json(
      { error: "Failed to send progress report" },
      { status: 500 }
    );
  }
}
