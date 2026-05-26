import Link from "next/link";
import {
  TrendingUp, Target, Award,
  Play, CheckCircle2, BookOpen,
  Mail, FileText, ChevronRight, Info,
} from "lucide-react";
import { SendProgressReportButton } from "./send-progress-report-button";
import type { StageData } from "./course-home-content";

interface CourseProgressContentProps {
  userPlan: "essentials" | "complete";
  hasParentEmail?: boolean;
  parentEmail?: string;
  studentName?: string;
  sendWeeklyReports?: boolean;
  completedLessons: number;
  totalLessons: number;
  progressPercentage: number;
  currentPart: number;
  stagesData: StageData[];
  quizAvgScore: number;
  quizTotalAttempts: number;
  activeParts: number[];
  partTitleMap: Record<number, string>;
}

export function CourseProgressContent({
  userPlan,
  hasParentEmail = false,
  parentEmail,
  studentName,
  sendWeeklyReports = false,
  completedLessons,
  totalLessons,
  progressPercentage,
  currentPart,
  stagesData,
  quizAvgScore,
  quizTotalAttempts,
  activeParts,
  partTitleMap,
}: CourseProgressContentProps) {
  const hasAnyActivity = completedLessons > 0 || activeParts.length > 0;
  const hasQuizData = quizTotalAttempts > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <section>
        <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">Your Progress</h1>
        <p className="text-text-secondary text-sm mb-4">
          Track your journey through the Complete Seerah course.
        </p>

        {!hasAnyActivity ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-gold/25 bg-gold/5">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-secondary">
                You have not started yet. Begin Part 1 to start tracking your progress.
              </p>
            </div>
            <Link
              href="/seerah/part-1"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gold hover:bg-gold/90 text-ink font-semibold rounded-lg text-sm transition-colors whitespace-nowrap shrink-0"
            >
              <Play className="w-3.5 h-3.5" />
              Start Part 1
            </Link>
          </div>
        ) : (
          <Link
            href={`/seerah/part-${currentPart}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gold hover:bg-gold/90 text-ink font-semibold rounded-lg text-sm transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            Continue Learning
          </Link>
        )}
      </section>

      {/* ── Summary Cards ─────────────────────────────────────────────────── */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Completed Parts */}
          <div className="p-5 rounded-2xl border border-border bg-surface">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-gold/70" />
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Completed</p>
            </div>
            <p className="text-2xl font-bold text-text tabular-nums">
              {completedLessons}
              <span className="text-text-muted font-normal text-base"> / {totalLessons}</span>
            </p>
            <p className="text-xs text-text-muted mt-1">Parts fully completed</p>
            <div className="mt-3 h-1.5 bg-surface-raised rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gold to-amber-400 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Progress % */}
          <div className="p-5 rounded-2xl border border-border bg-surface">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-gold/70" />
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Progress</p>
            </div>
            <p className="text-2xl font-bold text-text tabular-nums">{`${progressPercentage}%`}</p>
            <p className="text-xs text-text-muted mt-1">
              {progressPercentage === 0 ? "Not started" : `of 100 parts`}
            </p>
          </div>

          {/* Quiz Performance */}
          <div className="p-5 rounded-2xl border border-border bg-surface">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-gold/70" />
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Quiz</p>
            </div>
            {hasQuizData ? (
              <>
                <p className="text-2xl font-bold text-text tabular-nums">{Math.round(quizAvgScore)}%</p>
                <p className="text-xs text-text-muted mt-1">avg · {quizTotalAttempts} attempt{quizTotalAttempts !== 1 ? "s" : ""}</p>
              </>
            ) : (
              <>
                <p className="text-xl font-semibold text-text-muted">—</p>
                <p className="text-xs text-text-muted mt-1">No quizzes yet</p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Completion Criteria ───────────────────────────────────────────── */}
      <section>
        <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-surface/50">
          <Info className="w-4 h-4 text-gold/70 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-text mb-2">How a part counts as completed</p>
            <ul className="space-y-1.5">
              <li className="flex items-center gap-2 text-xs text-text-secondary">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500/80 shrink-0" />
                Watch at least <span className="font-semibold text-text mx-0.5">85%</span> of the video
              </li>
              <li className="flex items-center gap-2 text-xs text-text-secondary">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500/80 shrink-0" />
                Open and read the <span className="font-semibold text-text mx-0.5">Briefing</span>
              </li>
              <li className="flex items-center gap-2 text-xs text-text-secondary">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500/80 shrink-0" />
                Pass the <span className="font-semibold text-text mx-0.5">Quiz</span> with a score of 80% or higher
              </li>
            </ul>
            <p className="text-xs text-text-muted mt-2.5">
              All three are required. Video progress only, or an opened briefing alone, won&apos;t move the counter until the quiz is passed.
            </p>
          </div>
        </div>
      </section>

      {/* ── Stage Progress ────────────────────────────────────────────────── */}
      <section>
        <div className="mb-5">
          <h2 className="text-xl font-bold text-text mb-1">Stage Progress</h2>
          <p className="text-sm text-text-secondary">
            Your progress across the {stagesData.length} stages of the course.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface overflow-hidden divide-y divide-border">
          {stagesData.map((stage) => {
            const pct = stage.totalCount > 0 ? Math.round((stage.completedCount / stage.totalCount) * 100) : 0;
            const isDone = stage.completedCount === stage.totalCount && stage.totalCount > 0;
            const hasStarted = stage.completedCount > 0;

            return (
              <div key={stage.stageNumber} className="px-5 py-4">
                <div className="flex items-center gap-4">
                  {/* Stage number badge */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold tabular-nums ${
                    isDone
                      ? "bg-green-500/15 border border-green-500/25 text-green-400"
                      : hasStarted
                      ? "bg-gold/10 border border-gold/25 text-gold"
                      : "bg-surface-raised border border-border text-text-muted"
                  }`}>
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : stage.stageNumber}
                  </div>

                  {/* Label + bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <p className="text-sm font-medium text-text truncate">{stage.label}</p>
                      <span className={`text-xs tabular-nums shrink-0 font-medium ${
                        isDone ? "text-green-400" : hasStarted ? "text-gold" : "text-text-muted"
                      }`}>
                        {stage.completedCount}/{stage.totalCount}
                      </span>
                    </div>
                    <div className="h-1.5 bg-surface-raised rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isDone ? "bg-green-500" : "bg-gradient-to-r from-gold to-amber-400"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Percentage */}
                  <span className={`text-sm font-bold tabular-nums w-10 text-right shrink-0 ${
                    isDone ? "text-green-400" : hasStarted ? "text-gold" : "text-text-muted"
                  }`}>
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Recent Activity ───────────────────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-bold text-text mb-4">Recently Opened Lessons</h2>

        {!hasAnyActivity ? (
          <div className="p-8 rounded-2xl border border-border bg-surface text-center">
            <BookOpen className="w-10 h-10 mx-auto mb-3 text-text-muted opacity-50" />
            <p className="font-medium text-text mb-1">No activity yet</p>
            <p className="text-sm text-text-secondary mb-4 max-w-sm mx-auto">
              Start Part 1 and your opened lessons will appear here.
            </p>
            <Link
              href="/seerah/part-1"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gold hover:bg-gold/90 text-ink font-semibold rounded-lg text-sm transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              Start Part 1
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {completedLessons > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-xl border border-green-500/20 bg-green-500/5">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                <p className="text-sm text-text-secondary flex-1">
                  <span className="text-green-400 font-semibold">{completedLessons}</span> part{completedLessons !== 1 ? "s" : ""} completed
                </p>
                <Link href="/seerah?tab=lessons" className="text-xs text-gold hover:text-gold/80 flex items-center gap-1 shrink-0">
                  View all <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            )}

            {activeParts.slice(0, 6).map((partNum) => (
              <Link
                key={partNum}
                href={`/seerah/part-${partNum}`}
                className="group flex items-center gap-3 p-4 rounded-xl border border-border bg-surface hover:border-gold/30 hover:bg-gold/5 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <Play className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-amber-500 font-medium">Part {partNum}</span>
                  <p className="text-sm font-medium text-text truncate">
                    {partTitleMap[partNum] ?? `Part ${partNum}`}
                  </p>
                </div>
                <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded shrink-0">
                  In Progress
                </span>
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-gold transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Email / Parent Progress Reports ───────────────────────────────── */}
      <section>
        <h2 className="text-xl font-bold text-text mb-4">Email Progress Reports</h2>

        {hasParentEmail ? (
          <SendProgressReportButton
            userPlan={userPlan}
            hasParentEmail={hasParentEmail}
            parentEmail={parentEmail}
            studentName={studentName}
            sendWeeklyReports={sendWeeklyReports}
          />
        ) : (
          <div className="p-5 sm:p-6 rounded-2xl border border-border bg-surface">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/25 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-text mb-1">Set up parent reports</h3>
                <p className="text-sm text-text-secondary mb-4">
                  Keep a parent or guardian updated with automated weekly progress reports or on-demand summaries.
                </p>
                <Link
                  href="/student/settings"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gold hover:bg-gold/90 text-ink font-semibold rounded-lg text-sm transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Set Up in Settings
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>

    </div>
  );
}
