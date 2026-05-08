import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { StudentLayout } from "@/components/student/student-layout";
import { prisma } from "@/lib/db";
import { PARTS } from "@/lib/content";
import { ClipboardCheck, CheckCircle2, XCircle, ArrowLeft, Trophy } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Quizzes | Resources" };
export const dynamic = "force-dynamic";

export default async function QuizzesPage() {
  const user = await requireStudent();
  if (!user.studentProfileId) redirect("/");

  const purchases = await prisma.purchase.findMany({
    where: { userId: user.id, status: "succeeded" },
  });

  if (purchases.length === 0) {
    redirect("/pricing");
  }

  const userPlan = "complete" as const;

  // Get quiz progress for all parts
  const progress = await prisma.partProgress.findMany({
    where: { userId: user.id },
    select: {
      partNumber: true,
      quizCompleted: true,
      quizBestScore: true,
      quizPassed: true,
      quizAttempts: true,
    },
  });

  const progressMap = Object.fromEntries(
    progress.map((p) => [p.partNumber, p])
  );

  // Calculate stats
  const totalQuizzes = PARTS.length;
  const completedQuizzes = progress.filter((p) => p.quizCompleted).length;
  const passedQuizzes = progress.filter((p) => p.quizPassed).length;
  const averageScore = progress.length > 0
    ? Math.round(
        progress
          .filter((p) => p.quizBestScore != null)
          .reduce((sum, p) => sum + (p.quizBestScore || 0), 0) / 
        progress.filter((p) => p.quizBestScore != null).length
      )
    : 0;

  return (
    <StudentLayout userPlan={userPlan} userName={user.fullName}>
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Link */}
          <Link
            href="/student/resources"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-text transition-colors text-sm mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Resources
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 text-gold" />
              </div>
              <h1 className="text-3xl font-bold text-text">Quizzes</h1>
            </div>
            <p className="text-text-secondary">
              Test your knowledge with quizzes for each part. Score 80% or higher to pass.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 rounded-xl border border-border bg-surface">
              <p className="text-text-muted text-xs mb-1">Completed</p>
              <p className="text-2xl font-bold text-text">{completedQuizzes}/{totalQuizzes}</p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-surface">
              <p className="text-text-muted text-xs mb-1">Passed</p>
              <p className="text-2xl font-bold text-green-400">{passedQuizzes}/{totalQuizzes}</p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-surface">
              <p className="text-text-muted text-xs mb-1">Average Score</p>
              <p className="text-2xl font-bold text-gold">{averageScore}%</p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-surface">
              <p className="text-text-muted text-xs mb-1">Total Attempts</p>
              <p className="text-2xl font-bold text-text">
                {progress.reduce((sum, p) => sum + p.quizAttempts, 0)}
              </p>
            </div>
          </div>

          {/* Quiz List */}
          <div className="space-y-3">
            {PARTS.map((part) => {
              const partProgress = progressMap[part.partNumber];
              const bestScore = partProgress?.quizBestScore;
              const isPassed = partProgress?.quizPassed || false;
              const attempts = partProgress?.quizAttempts || 0;

              return (
                <Link
                  key={part.id}
                  href={`/seerah/${part.id}`}
                  className="group block p-4 rounded-xl border border-border bg-surface hover:border-gold/30 hover:bg-surface-raised transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center group-hover:bg-gold/15 transition-colors">
                      <ClipboardCheck className="w-5 h-5 text-gold" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-amber-500">
                          Part {part.partNumber}
                        </span>
                        {isPassed && (
                          <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                        )}
                        {bestScore != null && bestScore < 80 && (
                          <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        )}
                        {bestScore === 100 && (
                          <Trophy className="w-4 h-4 text-gold flex-shrink-0" />
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-text group-hover:text-gold transition-colors">
                        {part.title}
                      </h3>
                      {part.subtitle && (
                        <p className="text-xs text-text-muted mt-0.5 truncate">
                          {part.subtitle}
                        </p>
                      )}
                    </div>

                    <div className="flex-shrink-0 text-right">
                      {bestScore != null ? (
                        <>
                          <div className={`text-lg font-bold ${
                            isPassed ? "text-green-400" : "text-red-400"
                          }`}>
                            {bestScore}%
                          </div>
                          <p className="text-xs text-text-muted">
                            {attempts} {attempts === 1 ? "attempt" : "attempts"}
                          </p>
                        </>
                      ) : (
                        <span className="text-xs text-text-muted">Not attempted</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
