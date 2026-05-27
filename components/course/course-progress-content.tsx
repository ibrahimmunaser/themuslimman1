import Link from "next/link";
import {
  TrendingUp, Target, Award,
  Play, CheckCircle2, BookOpen,
  FileText, ChevronRight,
} from "lucide-react";
import { SendProgressReportButton } from "./send-progress-report-button";
import { ProgressReportsAccordion } from "./progress-reports-accordion";
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
  const hasQuizData    = quizTotalAttempts > 0;
  const currentTitle   = partTitleMap[currentPart];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-7 sm:space-y-10">

      {/* ── Page Header + Continue CTA ──────────────────────────────────── */}
      <section>
        <h1 className="text-xl sm:text-3xl font-bold text-text mb-1">Your Progress</h1>
        <p className="text-xs sm:text-sm text-text-secondary mb-4">
          Your journey through the Complete Seerah course.
        </p>

        {!hasAnyActivity ? (
          <Link
            href="/seerah/part-1"
            className="flex items-center justify-between gap-3 w-full px-5 py-4 min-h-[56px] bg-gold hover:bg-gold-light text-ink font-bold rounded-xl text-sm transition-colors shadow-md shadow-gold/20"
          >
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 flex-shrink-0" />
              <div>
                <p className="font-bold leading-none">Start Learning</p>
                <p className="text-[11px] font-normal text-ink/70 mt-0.5 leading-none">Begin Part 1 of the Seerah</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-70" />
          </Link>
        ) : (
          <Link
            href={`/seerah/part-${currentPart}`}
            className="flex items-center justify-between gap-3 w-full px-5 py-4 min-h-[56px] bg-gold hover:bg-gold-light text-ink font-bold rounded-xl text-sm transition-colors shadow-md shadow-gold/20"
          >
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 flex-shrink-0" />
              <div>
                <p className="font-bold leading-none">Continue Learning</p>
                {currentTitle ? (
                  <p className="text-[11px] font-normal text-ink/70 mt-0.5 leading-none truncate max-w-[200px] sm:max-w-xs">
                    Part {currentPart} · {currentTitle}
                  </p>
                ) : (
                  <p className="text-[11px] font-normal text-ink/70 mt-0.5 leading-none">Part {currentPart}</p>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-70" />
          </Link>
        )}
      </section>

      {/* ── Summary Cards — 2-col on mobile ─────────────────────────────── */}
      <section>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">

          {/* Completed */}
          <div className="p-3.5 sm:p-5 rounded-2xl border border-border bg-surface flex flex-col">
            <div className="flex items-center gap-1.5 mb-2">
              <Target className="w-3.5 h-3.5 text-gold/60 flex-shrink-0" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-text-muted">Completed</p>
            </div>
            <p className="text-[1.75rem] sm:text-3xl font-bold text-text tabular-nums leading-none">
              {completedLessons}
              <span className="text-text-muted font-normal text-sm"> / {totalLessons}</span>
            </p>
            <p className="text-[11px] text-text-muted mt-1.5">Parts fully completed</p>
            <div className="mt-2.5 h-1 bg-surface-raised rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gold to-amber-400 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Overall Progress */}
          <div className="p-3.5 sm:p-5 rounded-2xl border border-border bg-surface flex flex-col">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-gold/60 flex-shrink-0" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-text-muted">Progress</p>
            </div>
            <p className="text-[1.75rem] sm:text-3xl font-bold text-text tabular-nums leading-none">
              {progressPercentage}<span className="text-lg">%</span>
            </p>
            <p className="text-[11px] text-text-muted mt-1.5">
              {progressPercentage === 0 ? "Not started yet" : "of the full Seerah"}
            </p>
          </div>

          {/* Quiz — full-width on mobile 2-col, 3rd col on sm */}
          <div className="col-span-2 sm:col-span-1 p-3.5 sm:p-5 rounded-2xl border border-border bg-surface flex flex-col sm:flex-none">
            <div className="flex items-center gap-1.5 mb-2">
              <Award className="w-3.5 h-3.5 text-gold/60 flex-shrink-0" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-text-muted">Avg Quiz Score</p>
            </div>
            {hasQuizData ? (
              <div className="flex items-baseline gap-3 sm:block">
                <p className="text-[1.75rem] sm:text-3xl font-bold text-text tabular-nums leading-none">
                  {Math.round(quizAvgScore)}<span className="text-lg">%</span>
                </p>
                <p className="text-[11px] text-text-muted sm:mt-1.5">
                  {quizTotalAttempts} attempt{quizTotalAttempts !== 1 ? "s" : ""}
                </p>
              </div>
            ) : (
              <>
                <p className="text-[1.75rem] font-bold text-text-muted/50 leading-none">—</p>
                <p className="text-[11px] text-text-muted mt-1.5">No quizzes attempted yet</p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Completion Criteria — quieter helper card ───────────────────── */}
      <section>
        <details className="group">
          <summary className="flex items-center gap-2 cursor-pointer list-none select-none">
            <span className="text-[11px] font-semibold uppercase tracking-[0.11em] text-text-muted/60">
              How parts are counted as completed
            </span>
            <ChevronRight className="w-3 h-3 text-text-muted/40 transition-transform group-open:rotate-90" />
          </summary>
          <div className="mt-2.5 flex items-start gap-3 px-3 py-3 rounded-xl border border-border/50 bg-surface/30">
            <ul className="space-y-1.5 w-full">
              <li className="flex items-center gap-2 text-xs text-text-secondary">
                <CheckCircle2 className="w-3 h-3 text-green-500/60 shrink-0" />
                Watch at least <span className="font-semibold text-text mx-0.5">85%</span> of the video
              </li>
              <li className="flex items-center gap-2 text-xs text-text-secondary">
                <CheckCircle2 className="w-3 h-3 text-green-500/60 shrink-0" />
                Open and read the <span className="font-semibold text-text mx-0.5">Briefing</span>
              </li>
              <li className="flex items-center gap-2 text-xs text-text-secondary">
                <CheckCircle2 className="w-3 h-3 text-green-500/60 shrink-0" />
                Pass the <span className="font-semibold text-text mx-0.5">Quiz</span> with 80% or higher
              </li>
            </ul>
          </div>
        </details>
      </section>

      {/* ── Stage Progress — signature section ──────────────────────────── */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-base sm:text-xl font-bold text-text">Stage Progress</h2>
          <span className="text-xs text-text-muted">{stagesData.length} stages</span>
        </div>

        <div className="rounded-2xl border border-border/70 bg-surface overflow-hidden divide-y divide-border/50">
          {stagesData.map((stage) => {
            const pct       = stage.totalCount > 0 ? Math.round((stage.completedCount / stage.totalCount) * 100) : 0;
            const isDone    = stage.completedCount === stage.totalCount && stage.totalCount > 0;
            const isActive  = !isDone && stage.completedCount > 0;
            const isNext    = !isDone && stage.completedCount === 0 && stagesData.find(
              (s) => s.completedCount > 0 && s.stageNumber < stage.stageNumber
            ) !== undefined;

            return (
              <div
                key={stage.stageNumber}
                className={`px-4 py-3 sm:px-5 sm:py-4 ${isActive ? "bg-gold/3" : ""}`}
              >
                <div className="flex items-center gap-3">
                  {/* Stage badge */}
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold tabular-nums transition-colors ${
                    isDone
                      ? "bg-green-500/12 border border-green-500/20 text-green-400"
                      : isActive
                      ? "bg-gold/12 border border-gold/25 text-gold"
                      : "bg-surface-raised border border-border/60 text-text-muted/50"
                  }`}>
                    {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : stage.stageNumber}
                  </div>

                  {/* Label + bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className={`text-xs sm:text-sm font-medium truncate ${
                        isActive ? "text-text" : isDone ? "text-text-secondary" : "text-text-muted"
                      }`}>
                        {stage.label}
                      </p>
                      <span className={`text-[11px] sm:text-xs tabular-nums shrink-0 font-medium ${
                        isDone ? "text-green-400" : isActive ? "text-gold" : "text-text-muted/50"
                      }`}>
                        {stage.completedCount}/{stage.totalCount}
                      </span>
                    </div>
                    <div className="h-1 bg-surface-raised rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isDone ? "bg-green-500/70" : isActive ? "bg-gradient-to-r from-gold to-amber-400" : "bg-transparent"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Percentage */}
                  <span className={`text-xs sm:text-sm font-bold tabular-nums w-9 text-right shrink-0 ${
                    isDone ? "text-green-400" : isActive ? "text-gold" : "text-text-muted/40"
                  }`}>
                    {pct > 0 ? `${pct}%` : "—"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Recently Opened Lessons ──────────────────────────────────────── */}
      <section>
        <h2 className="text-base sm:text-xl font-bold text-text mb-3">Recently Opened</h2>

        {!hasAnyActivity ? (
          <div className="p-6 rounded-2xl border border-border bg-surface text-center">
            <BookOpen className="w-8 h-8 mx-auto mb-2.5 text-text-muted opacity-40" />
            <p className="font-medium text-text mb-1 text-sm">No activity yet</p>
            <p className="text-xs text-text-secondary mb-4">Start Part 1 and your recent lessons will appear here.</p>
            <Link
              href="/seerah/part-1"
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-gold hover:bg-gold/90 text-ink font-semibold rounded-lg text-sm transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              Start Part 1
            </Link>
          </div>
        ) : (
          <div className="space-y-1.5">
            {/* Completed banner — quieter */}
            {completedLessons > 0 && (
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-green-500/12 bg-green-500/4">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400/70 shrink-0" />
                <p className="text-xs text-text-secondary flex-1">
                  <span className="text-green-400 font-semibold">{completedLessons}</span>{" "}
                  part{completedLessons !== 1 ? "s" : ""} completed
                </p>
                <Link
                  href="/seerah?tab=lessons"
                  className="text-[11px] text-gold/70 hover:text-gold flex items-center gap-0.5 shrink-0 transition-colors"
                >
                  View <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            )}

            {/* Active parts — compact cards */}
            {activeParts.slice(0, 6).map((partNum) => (
              <Link
                key={partNum}
                href={`/seerah/part-${partNum}`}
                className="group flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-border/60 bg-surface/60 hover:border-gold/25 hover:bg-gold/4 transition-all min-h-[48px]"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center shrink-0">
                  <Play className="w-3 h-3 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-amber-500/80 font-medium">Part {partNum}</span>
                  <p className="text-xs font-medium text-text truncate leading-snug">
                    {partTitleMap[partNum] ?? `Part ${partNum}`}
                  </p>
                </div>
                <span className="text-[10px] text-amber-400/80 bg-amber-500/8 border border-amber-500/15 px-1.5 py-0.5 rounded shrink-0 font-medium">
                  In Progress
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-gold transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Email / Parent Progress Reports — collapsed by default ─────── */}
      <section>
        <ProgressReportsAccordion
          hasParentEmail={hasParentEmail}
          parentEmail={parentEmail}
          sendWeeklyReports={sendWeeklyReports}
        >
          {hasParentEmail ? (
            <SendProgressReportButton
              userPlan={userPlan}
              hasParentEmail={hasParentEmail}
              parentEmail={parentEmail}
              studentName={studentName}
              sendWeeklyReports={sendWeeklyReports}
            />
          ) : (
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text mb-1">Set up parent reports</p>
                <p className="text-xs text-text-secondary mb-3">
                  Keep a parent or guardian updated with automated weekly progress reports or on-demand summaries.
                </p>
                <Link
                  href="/student/settings"
                  className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-gold hover:bg-gold/90 text-ink font-semibold rounded-lg text-sm transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Set Up in Settings
                </Link>
              </div>
            </div>
          )}
        </ProgressReportsAccordion>
      </section>

    </div>
  );
}
