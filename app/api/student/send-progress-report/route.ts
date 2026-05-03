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
      include: {
        quizAttempts: {
          orderBy: { attemptedAt: "desc" },
          take: 1,
        },
      },
    });

    const userPlan = user.hasPaid ? "complete" : "essentials";
    const lessonsWatched = progressData.filter((p) => p.videoWatched).length;
    const briefingsRead = progressData.filter((p) => p.briefingRead).length;
    const totalLessons = 100;

    // Calculate study time (approximate based on video watches and quiz attempts)
    const studyTimeHours = Math.round(
      (lessonsWatched * 0.5 + // 30 min per lesson
        briefingsRead * 0.1 + // 5 min per briefing
        progressData.filter((p) => p.quizCompleted).length * 0.15) // 10 min per quiz
    );

    // Find current and next lesson
    const lastWatchedPart = progressData
      .filter((p) => p.videoWatched)
      .sort((a, b) => b.partNumber - a.partNumber)[0];
    
    const currentLessonNumber = lastWatchedPart ? lastWatchedPart.partNumber : 1;
    const nextLessonNumber = Math.min(currentLessonNumber + 1, totalLessons);

    // Get quiz stats for Complete users
    let quizScore: number | undefined;
    let quizAttempts = 0;
    let flashcardsReviewed = 0;

    if (userPlan === "complete") {
      const allQuizAttempts = await prisma.quizAttempt.findMany({
        where: { userId: user.id },
      });

      quizAttempts = allQuizAttempts.length;
      
      if (allQuizAttempts.length > 0) {
        const avgScore =
          allQuizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) /
          allQuizAttempts.length;
        quizScore = Math.round(avgScore);
      }

      // Placeholder for flashcards (would need actual implementation)
      flashcardsReviewed = 0;
    }

    // Extract parent name from email (before @)
    const parentName = user.parentEmail.split("@")[0];

    // Generate email
    const emailHtml = generateParentProgressReport({
      studentName: user.studentName || user.fullName,
      parentName: parentName.charAt(0).toUpperCase() + parentName.slice(1),
      userPlan: userPlan as "essentials" | "complete",
      lessonsWatched,
      totalLessons,
      briefingsRead,
      studyTimeHours,
      currentLesson: {
        number: currentLessonNumber,
        title: `Part ${currentLessonNumber}`,
      },
      suggestedNextLesson: {
        number: nextLessonNumber,
        title: `Part ${nextLessonNumber}`,
      },
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
