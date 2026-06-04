"use client";

import Link from "next/link";
import {
  Play, ArrowRight,
  Video, Headphones, FileText, Map, Layers, Brain, ClipboardCheck,
  Clock, Milestone, HelpCircle, Mail,
  Image as ImageIcon, Info, CheckCircle2,
} from "lucide-react";
import { PrefetchPartLink } from "@/components/course/prefetch-part-link";
import { useState, useEffect } from "react";
import { FadeUp, StaggerChildren, AnimatedCounter, AnimatedProgressBar, AnimatedCard } from "@/components/motion";

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
  childrenCompletionPercentage?: number;
  completedLessons: number;
  totalLessons: number;
  userName: string;
  currentPart: number;
  currentPartTitle: string;
  currentPartSubtitle?: string;
  currentPartVideoProgress: number;
  stagesData: StageData[];
  currentStageNumber: number;
}

export function CourseHomeContent({
  completedLessons,
  totalLessons,
  completionPercentage,
  childrenCompletionPercentage,
  userName,
  currentPart,
  currentPartTitle,
  currentPartSubtitle,
  currentPartVideoProgress,
  stagesData,
  currentStageNumber,
}: CourseHomeContentProps) {
  const isNewUser = completedLessons === 0;
  const currentStage = stagesData[currentStageNumber - 1];

  // Read the active path from localStorage to show the right progress %.
  const [displayPercentage, setDisplayPercentage] = useState(completionPercentage);
  useEffect(() => {
    if (localStorage.getItem("seerah:lessons-path") === "children" && childrenCompletionPercentage !== undefined) {
      setDisplayPercentage(childrenCompletionPercentage);
    } else {
      setDisplayPercentage(completionPercentage);
    }
  }, [completionPercentage, childrenCompletionPercentage]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">

      {/* ── Welcome header ─────────────────────────────────────────────────── */}
      <FadeUp>
        <p className="text-text-muted text-sm mb-1">Welcome back</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-text">{userName}</h1>
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
                {isNewUser ? "Start here" : "Continue learning"}
              </p>

              <h2 className="text-xl sm:text-2xl font-bold text-text mb-2 leading-tight">
                Part {currentPart}: {currentPartTitle}
              </h2>

              {isNewUser ? (
                <p className="text-text-secondary text-sm leading-relaxed mb-4">
                  Begin with the world the Prophet ﷺ was sent into, then follow the Seerah as one connected story.
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
                  Stage {currentStageNumber} of {stagesData.length}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gold/60" />
                  15–20 min
                </span>
                {isNewUser && (
                  <span className="px-2 py-0.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-[11px] font-semibold">
                    Best starting point
                  </span>
                )}
              </div>

              {/* Progress bar — only if lesson started */}
              {currentPartVideoProgress > 0 && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-1.5 text-xs text-text-muted">
                    <span>Lesson progress</span>
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
                  {isNewUser ? `Start Part ${currentPart}` : "Continue Lesson"}
                </PrefetchPartLink>
                <a
                  href="#roadmap"
                  className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] border border-border hover:border-gold/40 hover:text-text text-text-secondary font-medium rounded-xl text-sm transition-colors"
                >
                  View Roadmap
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* How to use each lesson — compact sidebar */}
            <div className="shrink-0 sm:w-52 bg-surface/60 border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-text mb-1">How to use each lesson</p>
              <p className="text-[11px] text-text-muted mb-3">All four formats together for best retention</p>
              <div className="space-y-2">
                {[
                  { icon: Video, label: "Watch the video" },
                  { icon: FileText, label: "Read the briefing" },
                  { icon: Brain, label: "Review flashcards" },
                  { icon: ClipboardCheck, label: "Take the quiz" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-xs text-text-secondary">
                    <Icon className="w-3.5 h-3.5 text-gold/70 shrink-0" />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </FadeUp>

      {/* ── Stats Grid ────────────────────────────────────────────────────── */}
      <StaggerChildren className="grid grid-cols-1 sm:grid-cols-3 gap-4" stagger={0.1} as="section">
          {/* Parts completed */}
          <AnimatedCard lift className="p-5 rounded-2xl border border-border bg-surface hover:border-gold/20 transition-colors">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">Completed</p>
            <p className="text-3xl font-bold text-text tabular-nums">
              <AnimatedCounter to={completedLessons} duration={800} />
              <span className="text-text-muted font-normal text-xl"> / {totalLessons}</span>
            </p>
            <p className="text-xs text-text-muted mt-1">Parts fully completed</p>
            <p className="flex items-center gap-1 text-xs text-text-muted/70 mt-1.5">
              <Info className="w-3 h-3 shrink-0" />
              Requires passing the quiz (80%+)
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
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">Current Stage</p>
            <p className="text-3xl font-bold text-text tabular-nums">
              <AnimatedCounter to={currentStageNumber} duration={600} />
              <span className="text-text-muted font-normal text-xl"> of {stagesData.length}</span>
            </p>
            <p className="text-xs text-text-muted mt-1 truncate">{currentStage?.label ?? "Arabia Before Revelation"}</p>
          </AnimatedCard>

          {/* Next Lesson */}
          <AnimatedCard lift className="p-5 rounded-2xl border border-border bg-surface hover:border-gold/20 transition-colors">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">Next Lesson</p>
            <p className="text-sm font-bold text-text">Part {currentPart}</p>
            <p className="text-xs text-text-muted mt-0.5 line-clamp-2 leading-relaxed">{currentPartTitle}</p>
            <PrefetchPartLink
              partNumber={currentPart}
              label={isNewUser ? "Start now" : "Continue"}
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-gold hover:text-gold/80 transition-colors min-h-[44px]"
            />
          </AnimatedCard>
      </StaggerChildren>

      {/* ── Course Roadmap ────────────────────────────────────────────────── */}
      <section id="roadmap">
        <FadeUp className="mb-6">
          <h2 className="text-xl font-bold text-text mb-1.5">Course Roadmap</h2>
          <p className="text-sm text-text-secondary">
            The Seerah in {stagesData.length} stages — from pre-Islamic Arabia to the Prophet&apos;s ﷺ final years.
            Each part unlocks after you complete the previous lesson&apos;s quiz. Follow the order for the full picture.
          </p>
        </FadeUp>

        {/* Desktop: horizontal timeline */}
        <div className="hidden sm:block relative">
          {/* Background connector line */}
          <div className="absolute top-[13px] left-[8%] right-[8%] h-px bg-border/40" aria-hidden />

          {/* Progress overlay line — gold/green gradient from start to current stage */}
          {stagesData.length > 1 && currentStageNumber > 1 && (
            <div
              className="absolute top-[13px] h-px"
              aria-hidden
              style={{
                left: "8%",
                width: `${((currentStageNumber - 1) / (stagesData.length - 1)) * 84}%`,
                background: "linear-gradient(to right, rgba(74,222,128,0.5), rgba(200,169,110,0.6))",
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
                      {isCurrent ? "▸ Current" : `Stage ${stage.stageNumber}`}
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
                      label={isDone ? "Review" : stage.completedCount > 0 ? "Continue" : "Start"}
                      className={`mt-2 inline-flex items-center gap-1 text-[10px] font-medium transition-colors min-h-[44px] ${
                        isCurrent ? "text-gold hover:text-gold/80" : "text-text-muted/50 hover:text-gold/70"
                      }`}
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
                    Stage {stage.stageNumber}
                  </span>
                  {isCurrent && (
                    <span className="px-1 py-0.5 bg-gold/15 border border-gold/30 text-gold text-[9px] font-bold rounded uppercase">
                      Now
                    </span>
                  )}
                  {isDone && <CheckCircle2 className="w-3 h-3 text-green-400 ml-auto" />}
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
                    label={isDone ? "Review" : stage.completedCount > 0 ? "Continue" : "Start"}
                    className="text-[10px] font-medium text-gold/70 hover:text-gold transition-colors min-h-[44px] flex items-center"
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
          <h2 className="text-xl font-bold text-text mb-1.5">Quick Access to Course Tools</h2>
          <p className="text-sm text-text-secondary">
            Every part includes all of these formats. Use them in any order.
          </p>
        </FadeUp>

        <StaggerChildren className="grid grid-cols-2 sm:grid-cols-4 gap-3" stagger={0.06}>
          {[
            { icon: Video, label: "Watch Lessons", href: "/seerah" },
            { icon: FileText, label: "Read Briefings", href: "/seerah/resources" },
            { icon: Headphones, label: "Listen on the Go", href: "/seerah/resources" },
            { icon: Layers, label: "Slides", href: "/seerah/resources" },
            { icon: ImageIcon, label: "Infographics", href: "/seerah/resources" },
            { icon: Map, label: "Mind Maps", href: "/seerah/resources" },
            { icon: Brain, label: "Flashcards", href: "/seerah/resources" },
            { icon: ClipboardCheck, label: "Quizzes", href: "/seerah/resources" },
          ].map(({ icon: Icon, label, href }) => (
            <AnimatedCard key={label} lift className="group">
              <Link
                href={href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-surface hover:border-gold/30 hover:bg-gold/5 transition-all text-center"
              >
                <div className="w-10 h-10 rounded-lg bg-surface-raised border border-border flex items-center justify-center group-hover:border-gold/30 transition-colors">
                  <Icon className="w-[18px] h-[18px] text-text-secondary group-hover:text-gold transition-colors" />
                </div>
                <span className="text-xs font-medium text-text-secondary group-hover:text-text transition-colors leading-tight">
                  {label}
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
              <h3 className="font-semibold text-text text-sm mb-1">Need help getting started?</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                If something does not load, or you are unsure where to begin, contact support.
              </p>
            </div>
          </div>
          <div className="flex gap-3 shrink-0 pl-14 sm:pl-0">
            <Link
              href="/help"
              className="inline-flex items-center gap-2 px-4 py-2 border border-border hover:border-gold/40 text-text-secondary hover:text-text rounded-lg text-sm font-medium transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              Contact Support
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
