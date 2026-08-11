import Link from "next/link";
import {
  TrendingUp, Target, Award,
  Play, CheckCircle2, BookOpen,
  ChevronRight, ChevronLeft,
} from "lucide-react";
import type { StageData } from "./course-home-content";
import type { CourseLang } from "@/lib/course-lang";
import { t, tf } from "@/lib/ui-strings";

interface CourseProgressContentProps {
  userPlan: "essentials" | "complete";
  completedLessons: number;
  totalLessons: number;
  progressPercentage: number;
  currentPart: number;
  stagesData: StageData[];
  quizAvgScore: number;
  quizTotalAttempts: number;
  activeParts: number[];
  partTitleMap: Record<number, string>;
  lang?: CourseLang;
}

export function CourseProgressContent({
  userPlan,
  completedLessons,
  totalLessons,
  progressPercentage,
  currentPart,
  stagesData,
  quizAvgScore,
  quizTotalAttempts,
  activeParts,
  partTitleMap,
  lang = "en",
}: CourseProgressContentProps) {
  const hasAnyActivity = completedLessons > 0 || activeParts.length > 0;
  const hasQuizData    = quizTotalAttempts > 0;
  const currentTitle   = partTitleMap[currentPart];
  const isRtl          = lang === "ar";
  const NextIcon        = isRtl ? ChevronLeft : ChevronRight;
  void userPlan;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-7 sm:space-y-10">

      {/* ── Page Header + Continue CTA ──────────────────────────────────── */}
      <section>
        <h1 className="text-xl sm:text-3xl font-bold text-text mb-1">{t(lang, "yourProgress")}</h1>
        <p className="text-xs sm:text-sm text-text-secondary mb-4">
          {t(lang, "journeyDesc")}
        </p>

        {!hasAnyActivity ? (
          <Link
            href="/seerah/part-1"
            className="flex items-center justify-between gap-3 w-full px-5 py-4 min-h-[56px] bg-gold hover:bg-gold-light text-ink font-bold rounded-xl text-sm transition-colors shadow-md shadow-gold/20"
          >
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 flex-shrink-0" />
              <div>
                <p className="font-bold leading-none">{t(lang, "startLearning")}</p>
                <p className="text-[11px] font-normal text-ink/70 mt-0.5 leading-none">{t(lang, "beginPart1")}</p>
              </div>
            </div>
            <NextIcon className="w-4 h-4 flex-shrink-0 opacity-70" />
          </Link>
        ) : (
          <Link
            href={`/seerah/part-${currentPart}`}
            className="flex items-center justify-between gap-3 w-full px-5 py-4 min-h-[56px] bg-gold hover:bg-gold-light text-ink font-bold rounded-xl text-sm transition-colors shadow-md shadow-gold/20"
          >
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 flex-shrink-0" />
              <div>
                <p className="font-bold leading-none">{t(lang, "continueLearningBtn")}</p>
                {currentTitle ? (
                  <p className="text-[11px] font-normal text-ink/70 mt-0.5 leading-none truncate max-w-[200px] sm:max-w-xs">
                    {tf(lang, "partN", { n: currentPart })} · {currentTitle}
                  </p>
                ) : (
                  <p className="text-[11px] font-normal text-ink/70 mt-0.5 leading-none">{tf(lang, "partN", { n: currentPart })}</p>
                )}
              </div>
            </div>
            <NextIcon className="w-4 h-4 flex-shrink-0 opacity-70" />
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
              <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-text-muted">{t(lang, "completedStat")}</p>
            </div>
            <p className="text-[1.75rem] sm:text-3xl font-bold text-text tabular-nums leading-none">
              {completedLessons}
              <span className="text-text-muted font-normal text-sm"> / {totalLessons}</span>
            </p>
            <p className="text-[11px] text-text-muted mt-1.5">{t(lang, "partsFullyCompleted")}</p>
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
              <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-text-muted">{t(lang, "progressStat")}</p>
            </div>
            <p className="text-[1.75rem] sm:text-3xl font-bold text-text tabular-nums leading-none">
              {progressPercentage}<span className="text-lg">%</span>
            </p>
            <p className="text-[11px] text-text-muted mt-1.5">
              {progressPercentage === 0 ? t(lang, "notStartedYet") : t(lang, "ofFullSeerah")}
            </p>
          </div>

          {/* Quiz — full-width on mobile 2-col, 3rd col on sm */}
          <div className="col-span-2 sm:col-span-1 p-3.5 sm:p-5 rounded-2xl border border-border bg-surface flex flex-col sm:flex-none">
            <div className="flex items-center gap-1.5 mb-2">
              <Award className="w-3.5 h-3.5 text-gold/60 flex-shrink-0" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-text-muted">{t(lang, "avgQuizScore")}</p>
            </div>
            {hasQuizData ? (
              <div className="flex items-baseline gap-3 sm:block">
                <p className="text-[1.75rem] sm:text-3xl font-bold text-text tabular-nums leading-none">
                  {Math.round(quizAvgScore)}<span className="text-lg">%</span>
                </p>
                <p className="text-[11px] text-text-muted sm:mt-1.5">
                  {tf(lang, quizTotalAttempts === 1 ? "attempts1" : "attemptsN", { n: quizTotalAttempts })}
                </p>
              </div>
            ) : (
              <>
                <p className="text-[1.75rem] font-bold text-text-muted/50 leading-none">—</p>
                <p className="text-[11px] text-text-muted mt-1.5">{t(lang, "noQuizzesYet")}</p>
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
              {t(lang, "howPartsCompleted")}
            </span>
            <NextIcon className="w-3 h-3 text-text-muted/40 transition-transform group-open:rotate-90" />
          </summary>
          <div className="mt-2.5 flex items-start gap-3 px-3 py-3 rounded-xl border border-border/50 bg-surface/30">
            <ul className="space-y-1.5 w-full">
              <li className="flex items-center gap-2 text-xs text-text-secondary">
                <CheckCircle2 className="w-3 h-3 text-green-500/60 shrink-0" />
                {t(lang, "passQuizWith80")}
              </li>
            </ul>
          </div>
        </details>
      </section>

      {/* ── Stage Progress — signature section ──────────────────────────── */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-base sm:text-xl font-bold text-text">{t(lang, "stageProgress")}</h2>
          <span className="text-xs text-text-muted">{tf(lang, "nStages", { n: stagesData.length })}</span>
        </div>

        <div className="rounded-2xl border border-border/70 bg-surface overflow-hidden divide-y divide-border/50">
          {stagesData.map((stage) => {
            const pct       = stage.totalCount > 0 ? Math.round((stage.completedCount / stage.totalCount) * 100) : 0;
            const isDone    = stage.completedCount === stage.totalCount && stage.totalCount > 0;
            const isActive  = !isDone && stage.completedCount > 0;
            const _isNext    = !isDone && stage.completedCount === 0 && stagesData.find(
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
                  <span className={`text-xs sm:text-sm font-bold tabular-nums w-9 text-end shrink-0 ${
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
        <h2 className="text-base sm:text-xl font-bold text-text mb-3">{t(lang, "recentlyOpened")}</h2>

        {!hasAnyActivity ? (
          <div className="p-6 rounded-2xl border border-border bg-surface text-center">
            <BookOpen className="w-8 h-8 mx-auto mb-2.5 text-text-muted opacity-40" />
            <p className="font-medium text-text mb-1 text-sm">{t(lang, "noActivityYet")}</p>
            <p className="text-xs text-text-secondary mb-4">{t(lang, "startPart1Prompt")}</p>
            <Link
              href="/seerah/part-1"
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-gold hover:bg-gold/90 text-ink font-semibold rounded-lg text-sm transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              {t(lang, "startPart1")}
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
                  {lang === "ar" ? "جزء مكتمل" : `part${completedLessons !== 1 ? "s" : ""} completed`}
                </p>
                <Link
                  href="/seerah?tab=lessons"
                  className="text-[11px] text-gold/70 hover:text-gold flex items-center gap-0.5 shrink-0 transition-colors"
                >
                  {t(lang, "viewLink")} <NextIcon className="w-3 h-3" />
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
                  <span className="text-[10px] text-amber-500/80 font-medium">{tf(lang, "partN", { n: partNum })}</span>
                  <p className="text-xs font-medium text-text truncate leading-snug">
                    {partTitleMap[partNum] ?? `Part ${partNum}`}
                  </p>
                </div>
                <span className="text-[10px] text-amber-400/80 bg-amber-500/8 border border-amber-500/15 px-1.5 py-0.5 rounded shrink-0 font-medium">
                  {t(lang, "inProgress")}
                </span>
                <NextIcon className="w-3.5 h-3.5 text-zinc-600 group-hover:text-gold transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
