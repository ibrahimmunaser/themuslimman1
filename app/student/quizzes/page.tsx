import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { StudentLayout } from "@/components/student/student-layout";
import { prisma } from "@/lib/db";
import { getActiveProfileId } from "@/app/actions/profiles";
import { PARTS } from "@/lib/content";
import { ClipboardCheck, CheckCircle2, XCircle, ChevronRight, Trophy } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Quizzes | Complete Seerah" };
export const dynamic = "force-dynamic";

export default async function QuizzesPage() {
  const user = await requireStudent();
  if (!user.studentProfileId) redirect("/");

  if (!user.hasPaid) {
    const purchases = await prisma.purchase.findMany({
      where: { userId: user.id, status: "succeeded" },
    });
    if (purchases.length === 0) redirect("/pricing");
  }

  const userPlan = "complete" as const;

  // Resolve the active learner profile
  const learnerProfileId = user.activeProfileId ?? await getActiveProfileId(user.id);
  const profileName = user.activeProfileName ?? user.fullName.split(" ")[0];

  // Fetch all quiz data for this profile
  const quizProgress = await prisma.partProgress.findMany({
    where: {
      learnerProfileId,
      quizAttempts: { gt: 0 },
    },
    orderBy: { lastAccessedAt: "desc" },
    select: {
      partNumber: true,
      quizAttempts: true,
      quizCompleted: true,
      quizPassed: true,
      quizScore: true,
      quizBestScore: true,
      lastAccessedAt: true,
    },
  });

  const partTitleMap = Object.fromEntries(PARTS.map((p) => [p.partNumber, p.title]));

  const totalAttempted = quizProgress.length;
  const passed = quizProgress.filter((q) => q.quizPassed).length;
  const failed = quizProgress.filter((q) => !q.quizPassed && (q.quizAttempts ?? 0) > 0).length;
  const avgScore =
    quizProgress.length > 0
      ? Math.round(
          quizProgress.reduce((s, q) => s + (q.quizBestScore ?? 0), 0) / quizProgress.length
        )
      : 0;

  return (
    <StudentLayout userPlan={userPlan} userName={user.fullName} activeProfileName={user.activeProfileName} planType={user.planType}>
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text mb-1">Quizzes</h1>
            <p className="text-text-secondary">
              {profileName}&apos;s quiz history and performance
            </p>
          </div>

          {/* Stats */}
          <div className="grid sm:grid-cols-4 gap-4 mb-8">
            {[
              { icon: ClipboardCheck, label: "Attempted", value: String(totalAttempted), color: "text-gold" },
              { icon: CheckCircle2, label: "Passed", value: String(passed), color: "text-emerald-400" },
              { icon: XCircle, label: "Not Yet Passed", value: String(failed), color: "text-red-400" },
              { icon: Trophy, label: "Avg Best Score", value: totalAttempted > 0 ? `${avgScore}%` : "—", color: "text-amber-400" },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="p-6 rounded-xl border border-border bg-surface">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                    <p className="text-text-muted text-sm">{stat.label}</p>
                  </div>
                  <p className="text-3xl font-bold text-text">{stat.value}</p>
                </div>
              );
            })}
          </div>

          {/* Quiz history */}
          {quizProgress.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-4">
                <ClipboardCheck className="w-8 h-8 text-gold" />
              </div>
              <h2 className="text-xl font-semibold text-text mb-2">No Quiz History Yet</h2>
              <p className="text-text-secondary max-w-md mx-auto mb-6">
                Complete quizzes inside lessons to track your performance here.
              </p>
              <Link
                href="/seerah"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gold text-ink font-semibold text-sm hover:bg-gold/90 transition-colors"
              >
                Start Learning
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="text-base font-semibold text-text">Quiz History</h2>
              </div>
              <div className="divide-y divide-border">
                {quizProgress.map((q) => (
                  <Link
                    key={q.partNumber}
                    href={`/seerah/part-${q.partNumber}?tab=quiz`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-surface-raised/50 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      {/* Pass/fail badge */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${
                          q.quizPassed
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {q.quizPassed ? "✓" : "✗"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text">
                          Part {q.partNumber}: {partTitleMap[q.partNumber] ?? `Part ${q.partNumber}`}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {q.quizAttempts} attempt{q.quizAttempts !== 1 ? "s" : ""}
                          {q.quizBestScore != null && ` · Best: ${q.quizBestScore}%`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Score pill */}
                      {q.quizBestScore != null && (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            q.quizPassed
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {q.quizBestScore}%
                        </span>
                      )}
                      <span
                        className={`hidden sm:inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                          q.quizPassed
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {q.quizPassed ? "Passed" : "Retry"}
                      </span>
                      <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
