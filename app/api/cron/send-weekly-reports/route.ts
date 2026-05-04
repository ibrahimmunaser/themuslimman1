import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Resend } from "resend";
import { generateParentProgressReport } from "@/lib/emails/parent-progress-report";

// This endpoint should be called by a cron job every Sunday
// Vercel Cron or external cron service
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all users with verified parent emails and weekly reports enabled
    const usersWithReports = await prisma.user.findMany({
      where: {
        parentEmail: { not: null },
        parentEmailVerified: true,
        sendWeeklyReports: true,
        role: "student",
      },
      select: {
        id: true,
        fullName: true,
        studentName: true,
        parentEmail: true,
        studentProfileId: true,
      },
    });

    console.log(`[CRON] Found ${usersWithReports.length} users for weekly reports`);

    const results = {
      total: usersWithReports.length,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Send reports
    for (const user of usersWithReports) {
      try {
        if (!user.parentEmail) continue;

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

        // Estimate study time
        const studyTimeHours = Math.round((completedLessons * 0.5) * 10) / 10;

        // Find current and next lesson
        const lastAccessedPart = progressData
          .filter((p) => p.lastAccessedAt)
          .sort((a, b) => {
            if (!a.lastAccessedAt || !b.lastAccessedAt) return 0;
            return b.lastAccessedAt.getTime() - a.lastAccessedAt.getTime();
          })[0];

        const currentLessonNumber = lastAccessedPart ? lastAccessedPart.partNumber : 1;
        const nextLessonNumber = Math.min(currentLessonNumber + 1, totalLessons);

        // Get quiz stats for Complete users
        let quizScore: number | undefined;
        let quizAttempts = 0;

        if (userPlan === "complete" && user.studentProfileId) {
          const allQuizAttempts = await prisma.quizAttempt.findMany({
            where: {
              studentId: user.studentProfileId,
              submittedAt: { not: null },
            },
          });

          quizAttempts = allQuizAttempts.length;

          if (allQuizAttempts.length > 0) {
            const validScores = allQuizAttempts.filter((a) => a.score !== null);
            if (validScores.length > 0) {
              const avgScore =
                validScores.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / validScores.length;
              quizScore = Math.round(avgScore);
            }
          }
        }

        const briefingsRead = completedLessons;

        // Extract parent name from email
        const parentName = user.parentEmail.split("@")[0];
        const parentNameCapitalized = parentName.charAt(0).toUpperCase() + parentName.slice(1);

        // Generate email
        const emailHtml = generateParentProgressReport({
          studentName: user.studentName || user.fullName,
          parentName: parentNameCapitalized,
          userPlan: userPlan as "essentials" | "complete",
          lessonsWatched: completedLessons,
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
          flashcardsReviewed: 0,
          weakAreas: [],
          strongAreas: [],
          recommendedReview: [],
          certificateProgress: 0,
        });

        // Send email
        const resend = new Resend(process.env.RESEND_API_KEY);

        const { error: emailError } = await resend.emails.send({
          from: process.env.EMAIL_FROM || "Seerah LMS <noreply@themuslimman.com>",
          to: user.parentEmail,
          subject: `${user.studentName || user.fullName}'s Weekly Seerah Progress Report`,
          html: emailHtml,
        });

        if (emailError) {
          console.error(`[CRON] Failed to send to ${user.parentEmail}:`, emailError);
          results.failed++;
          results.errors.push(`${user.id}: ${emailError.message || "Unknown error"}`);
        } else {
          console.log(`[CRON] Sent weekly report to ${user.parentEmail}`);
          results.sent++;
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (userError) {
        console.error(`[CRON] Error processing user ${user.id}:`, userError);
        results.failed++;
        results.errors.push(`${user.id}: ${userError instanceof Error ? userError.message : "Unknown error"}`);
      }
    }

    console.log(`[CRON] Weekly reports completed:`, results);

    return NextResponse.json({
      success: true,
      message: "Weekly reports sent",
      results,
    });
  } catch (error) {
    console.error("[CRON] Weekly reports error:", error);
    return NextResponse.json(
      {
        error: "Failed to send weekly reports",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
