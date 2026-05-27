import Link from "next/link";
import {
  Play, ArrowRight,
  Video, Headphones, FileText, Map, Layers, Brain, ClipboardCheck, BarChart2,
  BookOpen, Clock, Milestone, HelpCircle, Mail,
  Image as ImageIcon, Info,
} from "lucide-react";
import { PrefetchPartLink } from "@/components/course/prefetch-part-link";

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
}

export function CourseHomeContent({
  completedLessons,
  totalLessons,
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">

      {/* ── Welcome + Stats ──────────────────────────────────────────────── */}
      <section>
        <div className="mb-6">
          <p className="text-text-muted text-sm mb-1">Welcome back</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-text">{userName}</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Parts completed */}
          <div className="p-5 rounded-2xl border border-border bg-surface">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">Completed</p>
            <p className="text-3xl font-bold text-text tabular-nums">
              {completedLessons}
              <span className="text-text-muted font-normal text-xl"> / {totalLessons}</span>
            </p>
            <p className="text-xs text-text-muted mt-1">Parts fully completed</p>
            <p className="flex items-center gap-1 text-xs text-text-muted/70 mt-1.5">
              <Info className="w-3 h-3 shrink-0" />
              Requires video + briefing + quiz (80%+)
            </p>
            {completedLessons > 0 && (
              <div className="mt-3 h-1.5 bg-surface-raised rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-gold to-amber-400 rounded-full"
                  style={{ width: `${Math.round((completedLessons / totalLessons) * 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Current stage */}
          <div className="p-5 rounded-2xl border border-border bg-surface">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">Current Stage</p>
            <p className="text-3xl font-bold text-text tabular-nums">
              {currentStageNumber}
              <span className="text-text-muted font-normal text-xl"> of {stagesData.length}</span>
            </p>
            <p className="text-xs text-text-muted mt-1 truncate">{currentStage?.label ?? "Arabia Before Revelation"}</p>
          </div>

          {/* Next Lesson */}
          <div className="p-5 rounded-2xl border border-border bg-surface">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">Next Lesson</p>
            <p className="text-sm font-bold text-text">Part {currentPart}</p>
            <p className="text-xs text-text-muted mt-0.5 line-clamp-2 leading-relaxed">{currentPartTitle}</p>
            <PrefetchPartLink
              partNumber={currentPart}
              label={isNewUser ? "Start now" : "Continue"}
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-gold hover:text-gold/80 transition-colors min-h-[44px]"
            />
          </div>
        </div>
      </section>

      {/* ── Start Here / Continue ─────────────────────────────────────────── */}
      <section id="start-here">
        <div className="relative rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/10 via-gold/5 to-transparent overflow-hidden">
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
                  <div className="h-2 bg-surface-raised rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-gold to-amber-400 rounded-full transition-all"
                      style={{ width: `${currentPartVideoProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-wrap gap-3">
                <PrefetchPartLink
                  partNumber={currentPart}
                  className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] bg-gold hover:bg-gold-light text-ink font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-gold/20"
                >
                  <Play className="w-4 h-4" />
                  {isNewUser ? "Start Part 1" : "Continue Lesson"}
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
      </section>

      {/* ── Course Roadmap ────────────────────────────────────────────────── */}
      <section id="roadmap">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-text mb-1.5">Course Roadmap</h2>
          <p className="text-sm text-text-secondary">
            The Seerah in {stagesData.length} stages — from pre-Islamic Arabia to the Prophet's ﷺ final years.
            All parts are unlocked; follow the order for the full picture.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {stagesData.map((stage) => {
            const pct = stage.totalCount > 0 ? Math.round((stage.completedCount / stage.totalCount) * 100) : 0;
            const isCurrent = stage.stageNumber === currentStageNumber;
            const isDone = stage.completedCount === stage.totalCount && stage.totalCount > 0;

            return (
              <div
                key={stage.stageNumber}
                className={`p-5 rounded-2xl border transition-all ${
                  isCurrent
                    ? "border-gold/40 bg-gold/5"
                    : isDone
                    ? "border-green-500/25 bg-green-500/5"
                    : "border-border bg-surface hover:border-border-subtle"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold uppercase tracking-wider ${isCurrent ? "text-gold" : isDone ? "text-green-400" : "text-text-muted"}`}>
                        Stage {stage.stageNumber}
                      </span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.5 bg-gold/15 border border-gold/30 text-gold text-[10px] font-bold rounded uppercase tracking-wide">
                          Current
                        </span>
                      )}
                      {isDone && (
                        <span className="px-1.5 py-0.5 bg-green-500/10 border border-green-500/25 text-green-400 text-[10px] font-bold rounded uppercase tracking-wide">
                          Done
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-text text-sm leading-snug">{stage.label}</h3>
                  </div>
                  <span className="text-xs text-text-muted tabular-nums shrink-0">
                    {stage.completedCount}/{stage.totalCount}
                  </span>
                </div>

                <p className="text-xs text-text-muted leading-relaxed mb-3">{stage.description}</p>

                {/* Progress bar */}
                <div className="h-1.5 bg-surface-raised rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isDone ? "bg-green-500" : "bg-gradient-to-r from-gold to-amber-400"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <PrefetchPartLink
                  partNumber={stage.firstPartNumber}
                  label={isDone ? "Review stage" : stage.completedCount > 0 ? "Continue stage" : "Start stage"}
                />
              </div>
            );
          })}
        </div>
      </section>


      {/* ── Quick Access Resources ────────────────────────────────────────── */}
      <section>
        <div className="mb-5">
          <h2 className="text-xl font-bold text-text mb-1.5">Quick Access to Course Tools</h2>
          <p className="text-sm text-text-secondary">
            Every part includes all of these formats. Use them in any order.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
            <Link
              key={label}
              href={href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-surface hover:border-gold/30 hover:bg-gold/5 transition-all group text-center"
            >
              <div className="w-10 h-10 rounded-lg bg-surface-raised border border-border flex items-center justify-center group-hover:border-gold/30 transition-colors">
                <Icon className="w-4.5 h-4.5 text-text-secondary group-hover:text-gold transition-colors" />
              </div>
              <span className="text-xs font-medium text-text-secondary group-hover:text-text transition-colors leading-tight">
                {label}
              </span>
            </Link>
          ))}
        </div>
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
