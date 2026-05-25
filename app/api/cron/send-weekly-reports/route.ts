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
        student: {
          select: {
            id: true,
          },
        },
      },
    });

    console.log(`[CRON] Found ${usersWithReports.length} users for weekly reports`);

    const results = {
      total: usersWithReports.length,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    if (usersWithReports.length === 0) {
      return NextResponse.json({ success: true, message: "No users to report", results });
    }

    // Batch-load all data upfront — 4 queries total regardless of user count
    const userIds = usersWithReports.map((u) => u.id);
    const studentIds = usersWithReports.map((u) => u.student?.id).filter(Boolean) as string[];
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [allProgress, allPurchases, allStudySessions, allQuizAttempts] = await Promise.all([
      prisma.partProgress.findMany({
        where: { userId: { in: userIds } },
        orderBy: { partNumber: "asc" },
        select: {
          userId: true, partNumber: true, status: true, videoWatchPercent: true,
          briefingOpened: true, quizBestScore: true, updatedAt: true, quizPassed: true,
          flashcardsReviewed: true, startedAt: true, completedAt: true, masteredAt: true,
          lastAccessedAt: true,
        },
      }),
      prisma.purchase.findMany({
        where: { userId: { in: userIds }, status: "succeeded" },
        select: { userId: true },
      }),
      prisma.studySession.findMany({
        where: { userId: { in: userIds } },
        select: { userId: true, startedAt: true, secondsTracked: true },
      }),
      studentIds.length > 0
        ? prisma.quizAttempt.findMany({
            where: { studentId: { in: studentIds }, submittedAt: { not: null } },
            select: { studentId: true, score: true, submittedAt: true },
          })
        : Promise.resolve([]),
    ]);

    // Index everything by userId / studentId for O(1) lookup
    const progressByUser = new Map<string, typeof allProgress>();
    for (const p of allProgress) {
      const arr = progressByUser.get(p.userId) ?? [];
      arr.push(p);
      progressByUser.set(p.userId, arr);
    }
    const paidUserIds = new Set(allPurchases.map((p) => p.userId));
    const sessionsByUser = new Map<string, typeof allStudySessions>();
    for (const s of allStudySessions) {
      const arr = sessionsByUser.get(s.userId) ?? [];
      arr.push(s);
      sessionsByUser.set(s.userId, arr);
    }
    const quizByStudent = new Map<string, typeof allQuizAttempts>();
    for (const q of allQuizAttempts) {
      const arr = quizByStudent.get(q.studentId) ?? [];
      arr.push(q);
      quizByStudent.set(q.studentId, arr);
    }

    // Send reports
    for (const user of usersWithReports) {
      try {
        if (!user.parentEmail) continue;

        const progressData = progressByUser.get(user.id) ?? [];
        const userPlan = paidUserIds.has(user.id) ? "complete" : "essentials";

        const totalLessons = 100;
        const completedLessons = progressData.filter((p) => p.status === "completed").length;

        const weeklyProgress = progressData.filter(
          (p) => p.updatedAt >= oneWeekAgo && (p.status === "completed" || p.status === "in_progress")
        );

        const weeklyLessons = weeklyProgress.filter((p) => p.status === "completed").length;
        const weeklyBriefings = weeklyLessons;

        const userSessions = sessionsByUser.get(user.id) ?? [];
        const weeklyStudySessions = userSessions.filter((s) => s.startedAt >= oneWeekAgo);

        const totalStudySeconds = userSessions.reduce((sum, s) => sum + s.secondsTracked, 0);
        const weeklyStudySeconds = weeklyStudySessions.reduce((sum, s) => sum + s.secondsTracked, 0);

        const studyTimeHours = Math.round((totalStudySeconds / 3600) * 10) / 10;
        const weeklyStudyTime = Math.round((weeklyStudySeconds / 3600) * 10) / 10;
        const hasWeeklyActivity = weeklyProgress.length > 0 || weeklyStudySeconds > 0;

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

        let quizScore: number | undefined;
        let quizAttempts = 0;
        let weeklyQuizzes = 0;
        const weeklyFlashcards = 0;

        if (userPlan === "complete" && user.student?.id) {
          const studentQuizzes = quizByStudent.get(user.student.id) ?? [];
          quizAttempts = studentQuizzes.length;
          weeklyQuizzes = studentQuizzes.filter(
            (q) => q.submittedAt && q.submittedAt >= oneWeekAgo
          ).length;

          const validScores = studentQuizzes.filter((a) => a.score !== null);
          if (validScores.length > 0) {
            const avgScore = validScores.reduce((sum, a) => sum + (a.score ?? 0), 0) / validScores.length;
            quizScore = Math.round(avgScore);
          }
        }

        const briefingsRead = completedLessons;

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
          flashcardsReviewed: 0,
          weakAreas: [],
          strongAreas: [],
          recommendedReview: [],
          certificateProgress: 0,
        });

        // Send email
        const resend = new Resend(process.env.RESEND_API_KEY);

        const { error: emailError } = await resend.emails.send({
          from: process.env.EMAIL_FROM || "Complete Seerah <noreply@themuslimman.com>",
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
