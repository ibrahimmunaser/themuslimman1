import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { StudentLayout } from "@/components/student/student-layout";
import { prisma } from "@/lib/db";
import { getActiveProfileId } from "@/app/actions/profiles";
import { PARTS } from "@/lib/content";
import { TrendingUp, Target, Clock, Award, ChevronRight } from "lucide-react";
import { FadeUp, StaggerChildren, AnimatedCard } from "@/components/motion";
import Link from "next/link";

export const metadata = { title: "Progress | Complete Seerah" };
export const dynamic = "force-dynamic";

function formatStudyTime(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
}

export default async function ProgressPage() {
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

  // Fetch all progress for this profile in parallel with study sessions
  const [allProgress, studySessions] = await Promise.all([
    prisma.partProgress.findMany({
      where: { learnerProfileId },
      orderBy: { partNumber: "asc" },
      select: {
        partNumber: true,
        status: true,
        videoWatchPercent: true,
        videoCompleted: true,
        briefingOpened: true,
        quizCompleted: true,
        quizPassed: true,
        quizBestScore: true,
        quizAttempts: true,
        flashcardsReviewed: true,
        openedAssets: true,
        startedAt: true,
        completedAt: true,
        lastAccessedAt: true,
      },
    }),
    prisma.studySession.findMany({
      where: { learnerProfileId },
      select: { secondsTracked: true, partNumber: true, startedAt: true },
    }),
  ]);

  const TOTAL_PARTS = 100;

  // Compute stats
  const completedParts = allProgress.filter(
    (p) => p.status === "completed" || p.status === "mastered"
  );
  const inProgressParts = allProgress.filter(
    (p) => p.status === "started" && (p.videoWatchPercent ?? 0) > 0
  );
  const completedCount = completedParts.length;
  const progressPercent = Math.round((completedCount / TOTAL_PARTS) * 100);

  const totalStudySeconds = studySessions.reduce((sum, s) => sum + s.secondsTracked, 0);

  const quizAttemptedRows = allProgress.filter((p) => (p.quizAttempts ?? 0) > 0 && p.quizBestScore != null);
  const avgQuizScore =
    quizAttemptedRows.length > 0
      ? Math.round(
          quizAttemptedRows.reduce((s, p) => s + (p.quizBestScore ?? 0), 0) / quizAttemptedRows.length
        )
      : 0;

  // Parse openedAssets once
  const openedAssetsMap: Record<number, string[]> = Object.fromEntries(
    allProgress.map((p) => {
      try { return [p.partNumber, JSON.parse(p.openedAssets as string ?? "[]")]; }
      catch { return [p.partNumber, []]; }
    })
  );

  // Asset counts
  const assetCounts = {
    videos: allProgress.filter((p) => p.videoCompleted).length,
    slides: allProgress.filter((p) => (openedAssetsMap[p.partNumber] ?? []).includes("slides")).length,
    briefings: allProgress.filter((p) => p.briefingOpened).length,
    flashcards: allProgress.filter((p) => p.flashcardsReviewed).length,
    quizzes: allProgress.filter((p) => p.quizPassed).length,
    audio: allProgress.filter((p) => (openedAssetsMap[p.partNumber] ?? []).includes("audio")).length,
    mindmaps: allProgress.filter((p) => (openedAssetsMap[p.partNumber] ?? []).includes("mindmap")).length,
    infographics: allProgress.filter((p) => (openedAssetsMap[p.partNumber] ?? []).includes("infographic")).length,
  };

  // Recent activity — most recently accessed parts with any progress
  const partTitleMap = Object.fromEntries(PARTS.map((p) => [p.partNumber, p.title]));
  const recentParts = allProgress
    .filter((p) => p.lastAccessedAt)
    .sort((a, b) => new Date(b.lastAccessedAt!).getTime() - new Date(a.lastAccessedAt!).getTime())
    .slice(0, 6);

  const stats = [
    { icon: Target, label: "Lessons Completed", value: `${completedCount} / ${TOTAL_PARTS}` },
    { icon: TrendingUp, label: "Progress", value: `${progressPercent}%` },
    { icon: Clock, label: "Study Time", value: formatStudyTime(totalStudySeconds) },
    { icon: Award, label: "Avg Quiz Score", value: avgQuizScore > 0 ? `${avgQuizScore}%` : "—" },
  ];

  return (
    <StudentLayout userPlan={userPlan} userName={user.fullName} activeProfileName={user.activeProfileName} planType={user.planType}>
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <FadeUp className="mb-8">
            <h1 className="text-3xl font-bold text-text mb-1">My Progress</h1>
            <p className="text-text-secondary">
              {profileName}&apos;s learning journey through the Complete Seerah
            </p>
          </FadeUp>

          {/* Top stats */}
          <StaggerChildren className="grid sm:grid-cols-4 gap-4 mb-8" stagger={0.08}>
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <AnimatedCard
                  key={stat.label}
                  lift
                  className="p-6 rounded-xl border border-border bg-surface hover:border-gold/20 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="w-5 h-5 text-gold" />
                  </div>
                  <p className="text-text-muted text-sm mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-text">{stat.value}</p>
                </AnimatedCard>
              );
            })}
          </StaggerChildren>

          {/* Overall progress bar */}
          <FadeUp className="p-6 rounded-xl border border-border bg-surface mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-text">Overall Completion</h2>
              <span className="text-sm text-gold font-medium">{completedCount} of {TOTAL_PARTS} parts</span>
            </div>
            <div className="h-3 rounded-full bg-surface-raised overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold/80 to-gold transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-text-muted mt-2">
              {inProgressParts.length > 0
                ? `${inProgressParts.length} lesson${inProgressParts.length !== 1 ? "s" : ""} in progress`
                : completedCount === 0
                ? "Start Part 1 to begin tracking your progress"
                : "Keep going — you're making great progress!"}
            </p>
          </FadeUp>

          {/* Asset breakdown */}
          <FadeUp className="p-6 rounded-xl border border-border bg-surface mb-8">
            <h2 className="text-base font-semibold text-text mb-5">Assets Completed</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: "🎬", label: "Videos", count: assetCounts.videos },
                { icon: "📄", label: "Briefings", count: assetCounts.briefings },
                { icon: "🗂️", label: "Slides", count: assetCounts.slides },
                { icon: "🃏", label: "Flashcards", count: assetCounts.flashcards },
                { icon: "✅", label: "Quizzes Passed", count: assetCounts.quizzes },
                { icon: "🎧", label: "Audio", count: assetCounts.audio },
                { icon: "🧠", label: "Mindmaps", count: assetCounts.mindmaps },
                { icon: "🖼️", label: "Infographics", count: assetCounts.infographics },
              ].map((asset) => (
                <div key={asset.label} className="flex items-center gap-3 p-3 rounded-lg bg-surface-raised">
                  <span className="text-2xl">{asset.icon}</span>
                  <div>
                    <p className="text-lg font-bold text-text leading-none">{asset.count}</p>
                    <p className="text-xs text-text-muted mt-0.5">{asset.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeUp>

          {/* Recent activity */}
          <FadeUp className="p-6 rounded-xl border border-border bg-surface">
            <h2 className="text-base font-semibold text-text mb-5">Recent Activity</h2>
            {recentParts.length === 0 ? (
              <div className="text-center py-8 text-text-muted">
                <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No activity yet — start a lesson to see it here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentParts.map((p) => {
                  const opened = openedAssetsMap[p.partNumber] ?? [];
                  const done = p.status === "completed" || p.status === "mastered";
                  return (
                    <Link
                      key={p.partNumber}
                      href={`/seerah/part-${p.partNumber}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-surface-raised hover:bg-surface-raised/70 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                            done
                              ? "bg-gold/15 text-gold border border-gold/30"
                              : "bg-surface text-text-muted border border-border"
                          }`}
                        >
                          {p.partNumber}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-text leading-snug line-clamp-1">
                            {partTitleMap[p.partNumber] ?? `Part ${p.partNumber}`}
                          </p>
                          <p className="text-xs text-text-muted mt-0.5">
                            {done
                              ? "Completed"
                              : `${p.videoWatchPercent ?? 0}% video · ${opened.length} asset${opened.length !== 1 ? "s" : ""} opened`}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text transition-colors shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </FadeUp>
        </div>
      </div>
    </StudentLayout>
  );
}
