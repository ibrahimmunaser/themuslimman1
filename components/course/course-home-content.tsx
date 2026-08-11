"use client";

import Link from "next/link";
import {
  Play, ArrowRight, ArrowLeft,
  Video, Headphones, FileText, Map, Layers, Brain, ClipboardCheck,
  Clock, Milestone, HelpCircle, Mail,
  Image as ImageIcon, Info, CheckCircle2,
} from "lucide-react";
import { PrefetchPartLink } from "@/components/course/prefetch-part-link";
import { FadeUp, StaggerChildren, AnimatedCounter, AnimatedProgressBar, AnimatedCard } from "@/components/motion";
import type { CourseLang } from "@/lib/course-lang";
import { t, tf } from "@/lib/ui-strings";

export interface StageData {
  label: string;
  description: string;
  stageNumber: number;
  totalCount: number;
  completedCount: number;
  firstPartNumber: number;
}

interface CourseHomeContentProps {
  userPlan: "essentials" | "complete";
  completionPercentage: number;
  completedLessons: number;
  totalLessons: number;
  userName: string;
  currentPart: number;
  currentPartTitle: string;
  currentPartSubtitle?: string;
  currentPartVideoProgress: number;
  stagesData: StageData[];
  currentStageNumber: number;
  /** When false, show Part 1 free copy + upgrade banner (mobile parity). */
  hasAccess?: boolean;
  lang?: CourseLang;
}

export function CourseHomeContent({
  completedLessons,
  totalLessons,
  completionPercentage,
  userName,
  currentPart,
  currentPartTitle,
  currentPartSubtitle,
  currentPartVideoProgress,
  stagesData,
  currentStageNumber,
  hasAccess = true,
  lang = "en",
}: CourseHomeContentProps) {
  const isNewUser = completedLessons === 0;
  const isRtl = lang === "ar";
  const currentStage = stagesData[currentStageNumber - 1];

  // Read the active path from localStorage to show the right progress %.
  const displayPercentage = completionPercentage;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">

      {/* ── Welcome header ─────────────────────────────────────────────────── */}
      <FadeUp>
        <p className="text-text-muted text-sm mb-1">{t(lang, "welcomeBack")}</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-text">{userName}</h1>
        {!hasAccess && (
          <p className="text-text-secondary text-sm mt-2">
            {t(lang, "part1Free")}
          </p>
        )}
      </FadeUp>

      {/* ── Start Here / Continue ─────────────────────────────────────────── */}
      <FadeUp delay={0.05} as="section">
        <div id="start-here" className="relative rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/10 via-gold/5 to-transparent overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

          <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 sm:gap-8">
            {/* Main content */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-gold mb-3">
                {!hasAccess
                  ? t(lang, "freeStartHere")
                  : isNewUser
                    ? t(lang, "startHere")
                    : t(lang, "continueLearning")}
              </p>

              <h2 className="text-xl sm:text-2xl font-bold text-text mb-2 leading-tight">
                {tf(lang, "partN", { n: currentPart })}: {currentPartTitle}
              </h2>

              {isNewUser ? (
                <p className="text-text-secondary text-sm leading-relaxed mb-4">
                  {isRtl
                    ? "ابدأ بفهم العالم الذي بُعث فيه النبي ﷺ، ثم تابع السيرة النبوية كقصة متكاملة."
                    : "Begin with the world the Prophet ﷺ was sent into, then follow the Seerah as one connected story."}
                </p>
              ) : (
                currentPartSubtitle && (
                  <p className="text-text-secondary text-sm leading-relaxed mb-4">
                    {currentPartSubtitle}
                  </p>
                )
              )}

              {/* Metadata row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted mb-5">
                <span className="flex items-center gap-1.5">
                  <Milestone className="w-3.5 h-3.5 text-gold/60" />
                  {tf(lang, "stageNofM", { n: currentStageNumber, m: stagesData.length })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gold/60" />
                  {t(lang, "minRead")}
                </span>
                {isNewUser && (
                  <span className="px-2 py-0.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-[11px] font-semibold">
                    {t(lang, "bestStartingPoint")}
                  </span>
                )}
              </div>

              {/* Progress bar — only if lesson started */}
              {currentPartVideoProgress > 0 && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-1.5 text-xs text-text-muted">
                    <span>{t(lang, "lessonProgress")}</span>
                    <span className="text-gold font-medium">{currentPartVideoProgress}%</span>
                  </div>
                  <AnimatedProgressBar
                    percent={currentPartVideoProgress}
                    height={8}
                    fillClassName="bg-gradient-to-r from-gold to-amber-400"
                    trackClassName="bg-surface-raised"
                  />
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-wrap gap-3">
                <PrefetchPartLink
                  partNumber={currentPart}
                  className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] bg-gold hover:bg-gold-light text-ink font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-gold/20"
                >
                  <Play className="w-4 h-4" />
                  {isNewUser ? tf(lang, "startPartN", { n: currentPart }) : t(lang, "continuLesson")}
                </PrefetchPartLink>
                <a
                  href="#roadmap"
                  className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] border border-border hover:border-gold/40 hover:text-text text-text-secondary font-medium rounded-xl text-sm transition-colors"
                >
                  {t(lang, "viewRoadmap")}
                  {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </a>
              </div>
            </div>

            {/* How to use each lesson — compact sidebar */}
            <div className="shrink-0 sm:w-52 bg-surface/60 border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-text mb-1">{t(lang, "howToUseLesson")}</p>
              <p className="text-[11px] text-text-muted mb-3">{t(lang, "allFormatsRetention")}</p>
              <div className="space-y-2">
                {[
                  { icon: Video, labelKey: "watchTheVideo" as const },
                  { icon: FileText, labelKey: "readTheBriefing" as const },
                  { icon: Brain, labelKey: "reviewFlashcards" as const },
                  { icon: ClipboardCheck, labelKey: "takeTheQuiz" as const },
                ].map(({ icon: Icon, labelKey }) => (
                  <div key={labelKey} className="flex items-center gap-2 text-xs text-text-secondary">
                    <Icon className="w-3.5 h-3.5 text-gold/70 shrink-0" />
                    {t(lang, labelKey)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </FadeUp>

      {/* ── Upgrade prompt (unpaid — mobile parity) ───────────────────────── */}
      {!hasAccess && (
        <FadeUp delay={0.08}>
          <div className="rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/10 via-gold/5 to-transparent p-6 sm:p-7">
            <h2 className="text-lg font-bold text-text mb-2">
              {tf(lang, "unlockAllN", { n: totalLessons })}
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed mb-4 max-w-xl">
              {t(lang, "unlockDesc")}
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] bg-gold hover:bg-gold-light text-ink font-semibold rounded-xl text-sm transition-colors"
            >
              {t(lang, "viewPlans")}
              {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </Link>
          </div>
        </FadeUp>
      )}

      {/* ── Stats Grid ────────────────────────────────────────────────────── */}
      <StaggerChildren className="grid grid-cols-1 sm:grid-cols-3 gap-4" stagger={0.1} as="section">
          {/* Parts completed */}
          <AnimatedCard lift className="p-5 rounded-2xl border border-border bg-surface hover:border-gold/20 transition-colors">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">{t(lang, "completedStat")}</p>
            <p className="text-3xl font-bold text-text tabular-nums">
              <AnimatedCounter to={completedLessons} duration={800} />
              <span className="text-text-muted font-normal text-xl"> / {totalLessons}</span>
            </p>
            <p className="text-xs text-text-muted mt-1">{t(lang, "partsFullyCompleted")}</p>
            <p className="flex items-center gap-1 text-xs text-text-muted/70 mt-1.5">
              <Info className="w-3 h-3 shrink-0" />
              {t(lang, "requiresQuiz")}
            </p>
            {completedLessons > 0 && (
              <AnimatedProgressBar
                percent={displayPercentage}
                height={6}
                fillClassName="bg-gradient-to-r from-gold to-amber-400"
                trackClassName="bg-surface-raised"
                className="mt-3"
                delay={0.2}
              />
            )}
          </AnimatedCard>

          {/* Current stage */}
          <AnimatedCard lift className="p-5 rounded-2xl border border-border bg-surface hover:border-gold/20 transition-colors">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">{t(lang, "currentStage")}</p>
            <p className="text-3xl font-bold text-text tabular-nums">
              <AnimatedCounter to={currentStageNumber} duration={600} />
              <span className="text-text-muted font-normal text-xl"> {isRtl ? "من" : "of"} {stagesData.length}</span>
            </p>
            <p className="text-xs text-text-muted mt-1 truncate">{currentStage?.label ?? (isRtl ? "جزيرة العرب قبل الإسلام" : "Arabia Before Revelation")}</p>
          </AnimatedCard>

          {/* Next Lesson */}
          <AnimatedCard lift className="p-5 rounded-2xl border border-border bg-surface hover:border-gold/20 transition-colors">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">{t(lang, "nextLesson")}</p>
            <p className="text-sm font-bold text-text">{tf(lang, "partN", { n: currentPart })}</p>
            <p className="text-xs text-text-muted mt-0.5 line-clamp-2 leading-relaxed">{currentPartTitle}</p>
            <PrefetchPartLink
              partNumber={currentPart}
              label={isNewUser ? t(lang, "startNow") : t(lang, "continue")}
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-gold hover:text-gold/80 transition-colors min-h-[44px]"
              isRtl={isRtl}
            />
          </AnimatedCard>
      </StaggerChildren>

      {/* ── Course Roadmap ────────────────────────────────────────────────── */}
      <section id="roadmap">
        <FadeUp className="mb-6">
          <h2 className="text-xl font-bold text-text mb-1.5">{t(lang, "courseRoadmap")}</h2>
          <p className="text-sm text-text-secondary">
            {tf(lang, "seerahInStages", { n: stagesData.length })}
          </p>
        </FadeUp>

        {/* Desktop: horizontal timeline */}
        <div className="hidden sm:block relative">
          {/* Background connector line */}
          <div className="absolute top-[13px] left-[8%] right-[8%] h-px bg-border/40" aria-hidden />

          {/* Progress overlay line — gold/green gradient from start to current stage.
              Anchored with insetInlineStart (not left) so it grows from wherever
              Stage 1 visually sits — the right edge in RTL, since the stage nodes
              themselves reverse order under the ambient dir="rtl". */}
          {stagesData.length > 1 && currentStageNumber > 1 && (
            <div
              className="absolute top-[13px] h-px"
              aria-hidden
              style={{
                insetInlineStart: "8%",
                width: `${((currentStageNumber - 1) / (stagesData.length - 1)) * 84}%`,
                background: isRtl
                  ? "linear-gradient(to left, rgba(74,222,128,0.5), rgba(200,169,110,0.6))"
                  : "linear-gradient(to right, rgba(74,222,128,0.5), rgba(200,169,110,0.6))",
              }}
            />
          )}

          <div className="flex overflow-x-auto pb-6">
            {stagesData.map((stage) => {
              const pct = stage.totalCount > 0 ? Math.round((stage.completedCount / stage.totalCount) * 100) : 0;
              const isCurrent = stage.stageNumber === currentStageNumber;
              const isDone = stage.completedCount === stage.totalCount && stage.totalCount > 0;

              return (
                <div
                  key={stage.stageNumber}
                  className="flex-1 flex flex-col items-center gap-2 min-w-[80px] px-1.5"
                >
                  {/* Circle node */}
                  <div
                    className={`relative z-10 w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-shadow ${
                      isDone
                        ? "border-green-500/60 bg-green-500/10 text-green-400"
                        : isCurrent
                        ? "border-gold bg-gold/15 text-gold shadow-[0_0_0_3px_rgba(200,169,110,0.15)]"
                        : "border-border/50 bg-surface-raised text-text-muted/40"
                    }`}
                  >
                    {isDone
                      ? <CheckCircle2 className="w-3.5 h-3.5" />
                      : <span className="text-[11px] font-bold">{stage.stageNumber}</span>}
                  </div>

                  {/* Stage info */}
                  <div className="text-center w-full">
                    <p className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${
                      isCurrent ? "text-gold" : isDone ? "text-green-400/70" : "text-text-muted/40"
                    }`}>
                      {isCurrent ? t(lang, "currentStageLabel") : tf(lang, "stageN", { n: stage.stageNumber })}
                    </p>
                    <p className={`text-[11px] font-medium leading-tight line-clamp-2 ${
                      isCurrent ? "text-text" : isDone ? "text-text-secondary" : "text-text-muted/60"
                    }`}>
                      {stage.label}
                    </p>
                    <p className="text-[10px] text-text-muted/50 mt-0.5 tabular-nums">
                      {stage.completedCount}/{stage.totalCount}
                    </p>
                    {/* Mini progress bar */}
                    <AnimatedProgressBar
                      percent={pct}
                      height={3}
                      fillClassName={isDone ? "bg-green-500/70" : isCurrent ? "bg-gold/70" : "bg-gold/30"}
                      trackClassName="bg-surface-raised"
                      className="mt-1.5 w-full"
                    />
                    <PrefetchPartLink
                      partNumber={stage.firstPartNumber}
                      label={isDone ? t(lang, "review") : stage.completedCount > 0 ? t(lang, "continue") : t(lang, "start")}
                      className={`mt-2 inline-flex items-center gap-1 text-[10px] font-medium transition-colors min-h-[44px] ${
                        isCurrent ? "text-gold hover:text-gold/80" : "text-text-muted/50 hover:text-gold/70"
                      }`}
                      isRtl={isRtl}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile: 2-column card grid */}
        <div className="sm:hidden grid grid-cols-2 gap-3">
          {stagesData.map((stage) => {
            const pct = stage.totalCount > 0 ? Math.round((stage.completedCount / stage.totalCount) * 100) : 0;
            const isCurrent = stage.stageNumber === currentStageNumber;
            const isDone = stage.completedCount === stage.totalCount && stage.totalCount > 0;

            return (
              <div
                key={stage.stageNumber}
                className={`p-4 rounded-2xl border transition-all ${
                  isCurrent
                    ? "border-gold/40 bg-gold/5"
                    : isDone
                    ? "border-green-500/25 bg-green-500/5"
                    : "border-border bg-surface"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isCurrent ? "text-gold" : isDone ? "text-green-400" : "text-text-muted"}`}>
                    {tf(lang, "stageN", { n: stage.stageNumber })}
                  </span>
                  {isCurrent && (
                    <span className="px-1 py-0.5 bg-gold/15 border border-gold/30 text-gold text-[9px] font-bold rounded uppercase">
                      {isRtl ? "الآن" : "Now"}
                    </span>
                  )}
                  {isDone && <CheckCircle2 className="w-3 h-3 text-green-400 ms-auto" />}
                </div>
                <h3 className="font-semibold text-text text-xs leading-snug line-clamp-2 mb-2">{stage.label}</h3>
                <AnimatedProgressBar
                  percent={pct}
                  height={6}
                  fillClassName={isDone ? "bg-green-500" : "bg-gradient-to-r from-gold to-amber-400"}
                  trackClassName="bg-surface-raised"
                  className="mb-2"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-muted tabular-nums">{stage.completedCount}/{stage.totalCount}</span>
                  <PrefetchPartLink
                    partNumber={stage.firstPartNumber}
                    label={isDone ? t(lang, "review") : stage.completedCount > 0 ? t(lang, "continue") : t(lang, "start")}
                    className="text-[10px] font-medium text-gold/70 hover:text-gold transition-colors min-h-[44px] flex items-center"
                    isRtl={isRtl}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>


      {/* ── Quick Access Resources ────────────────────────────────────────── */}
      <section>
        <FadeUp className="mb-5">
          <h2 className="text-xl font-bold text-text mb-1.5">{t(lang, "quickAccessTools")}</h2>
          <p className="text-sm text-text-secondary">
            {t(lang, "everyPartIncludes")}
          </p>
        </FadeUp>

        <StaggerChildren className="grid grid-cols-2 sm:grid-cols-4 gap-3" stagger={0.06}>
          {([
            { icon: Video,          labelKey: "watchLessons",   href: "/seerah"           },
            { icon: FileText,       labelKey: "readBriefings",  href: "/seerah/resources" },
            { icon: Headphones,     labelKey: "listenOnTheGo",  href: "/seerah/resources" },
            { icon: Layers,         labelKey: "slides",         href: "/seerah/resources" },
            { icon: ImageIcon,      labelKey: "infographics",   href: "/seerah/resources" },
            ...(isRtl ? [] : [{ icon: Map, labelKey: "mindMaps", href: "/seerah/resources" }]),
            { icon: Brain,          labelKey: "flashcards",     href: "/seerah/resources" },
            { icon: ClipboardCheck, labelKey: "quizzes",        href: "/seerah/resources" },
          ] as { icon: React.ComponentType<{ className?: string }>; labelKey: import("@/lib/ui-strings").UiStringKey; href: string }[]).map(({ icon: Icon, labelKey, href }) => (
            <AnimatedCard key={labelKey} lift className="group">
              <Link
                href={href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-surface hover:border-gold/30 hover:bg-gold/5 transition-all text-center"
              >
                <div className="w-10 h-10 rounded-lg bg-surface-raised border border-border flex items-center justify-center group-hover:border-gold/30 transition-colors">
                  <Icon className="w-[18px] h-[18px] text-text-secondary group-hover:text-gold transition-colors" />
                </div>
                <span className="text-xs font-medium text-text-secondary group-hover:text-text transition-colors leading-tight">
                  {t(lang, labelKey)}
                </span>
              </Link>
            </AnimatedCard>
          ))}
        </StaggerChildren>
      </section>

      {/* ── Support Card ──────────────────────────────────────────────────── */}
      <section>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl border border-border bg-surface">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/25 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h3 className="font-semibold text-text text-sm mb-1">{t(lang, "needHelp")}</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                {t(lang, "helpDesc")}
              </p>
            </div>
          </div>
          <div className="flex gap-3 shrink-0 ps-14 sm:ps-0">
            <Link
              href="/help"
              className="inline-flex items-center gap-2 px-4 py-2 border border-border hover:border-gold/40 text-text-secondary hover:text-text rounded-lg text-sm font-medium transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              {t(lang, "contactSupport")}
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
