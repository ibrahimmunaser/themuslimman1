import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateParentProgressReport } from "@/lib/emails/parent-progress-report";
import { Resend } from "resend";

export async function POST() {
  try {
    const user = await requireStudent();

    // Check if user has parent email configured
    if (!user.parentEmail) {
      return NextResponse.json(
        { error: "No parent email configured" },
        { status: 400 }
      );
    }

    // Get user's progress data
    const progressData = await prisma.partProgress.findMany({
      where: { userId: user.id },
      orderBy: { partNumber: "asc" },
    });

    // Determine user plan
    const purchases = await prisma.purchase.findFirst({
      where: { userId: user.id, status: "succeeded" },
    });
    const userPlan = purchases ? "complete" : "essentials";
    
    const totalLessons = 100;
    const completedLessons = progressData.filter((p) => p.status === "completed").length;
    const inProgressLessons = progressData.filter((p) => p.status === "in_progress").length;
    
    // Calculate weekly activity (past 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyProgress = progressData.filter(
      (p) => p.updatedAt >= oneWeekAgo && (p.status === "completed" || p.status === "in_progress")
    );
    
    const weeklyLessons = weeklyProgress.filter((p) => p.status === "completed").length;
    const weeklyBriefings = weeklyLessons; // Use completed lessons as proxy for briefings
    const weeklyStudyTime = Math.round((weeklyLessons * 0.5) * 10) / 10;
    
    // Check if there's any weekly activity
    const hasWeeklyActivity = weeklyProgress.length > 0 || user.lastLoginAt && user.lastLoginAt >= oneWeekAgo;
    
    // Estimate total study time based on progress (rough estimate: 30min per completed lesson)
    const studyTimeHours = Math.round((completedLessons * 0.5) * 10) / 10; // rounded to 1 decimal

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

      // Placeholder for flashcards (would need actual implementation)
      flashcardsReviewed = 0;
      weeklyFlashcards = 0;
    }
    
    // For MVP, use completed lessons as proxy for briefings read
    const briefingsRead = completedLessons;

    // Extract parent name from email (before @)
    const parentName = user.parentEmail.split("@")[0];

    // Generate email
    const emailHtml = generateParentProgressReport({
      studentName: user.studentName || user.fullName,
      parentName: parentName.charAt(0).toUpperCase() + parentName.slice(1),
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
      from: process.env.EMAIL_FROM || "Seerah LMS <noreply@themuslimman.com>",
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

    console.log(`[EMAIL] Progress report sent to ${user.parentEmail}`);

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
