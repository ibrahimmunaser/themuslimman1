"use client";

import { useState, useEffect } from "react";
import { clsx } from "clsx";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { Maximize2 } from "lucide-react";
import {
  Video,
  BookOpen,
  GraduationCap,
  FileText,
  BarChart2,
  Map,
  Image as ImageIcon,
  Layers,
  HelpCircle,
  Layers2,
  Clock,
} from "lucide-react";
import NextImage from "next/image";
import { LazyVideoPlayer } from "./lazy-video-player";
import { LazyListenOnTheGo } from "./lazy-listen-on-the-go";
import { TextViewer } from "./text-viewer";
import { FactsViewer } from "./facts-viewer";
import { LazyMindmapViewer } from "./lazy-mindmap-viewer";
import { SlidesViewer } from "./slides-viewer";
import { QuizViewer } from "./quiz-viewer";
import { FlashcardsViewer } from "./flashcards-viewer";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import type { Part } from "@/lib/types";
import Link from "next/link";
import { trackAssetOpened } from "@/app/actions/progress";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserPlan = "essentials" | "complete";

type ModeId = "watch" | "read" | "study" | "slides" | "mindmap" | "infographic" | "flashcards" | "quiz";

type SubTabId =
  | "video"
  | "briefing" | "study-guide" | "facts"
  | "flashcards" | "quiz"
  | "slides" | "mindmap" | "infographic";

interface SubTab { id: SubTabId; label: string; icon: React.FC<{ className?: string }>; }
interface Mode {
  id: ModeId;
  label: string;
  hint: string;
  icon: React.FC<{ className?: string }>;
  subTabs: SubTab[];
  primary?: boolean;
}

// ─── Mode definitions ─────────────────────────────────────────────────────────

const MODES: Mode[] = [
  {
    id: "watch",       label: "Watch",       hint: "Video lesson",    icon: Video,        primary: true,
    subTabs: [{ id: "video",       label: "Video",       icon: Video }],
  },
  {
    id: "read",        label: "Read",        hint: "Written content",  icon: BookOpen,
    subTabs: [
      { id: "briefing",    label: "Briefing",    icon: FileText },
      { id: "study-guide", label: "Study Guide", icon: BookOpen },
      { id: "facts",       label: "Facts",       icon: BarChart2 },
    ],
  },
  {
    id: "slides",      label: "Slides",      hint: "Slide decks",     icon: Layers,
    subTabs: [{ id: "slides",      label: "Slides",      icon: Layers }],
  },
  {
    id: "infographic", label: "Infographic", hint: "Visual summary",  icon: ImageIcon,
    subTabs: [{ id: "infographic", label: "Infographic", icon: ImageIcon }],
  },
  {
    id: "mindmap",     label: "Mindmap",     hint: "Visual map",      icon: Map,
    subTabs: [{ id: "mindmap",     label: "Mindmap",     icon: Map }],
  },
  {
    id: "flashcards",  label: "Flashcards",  hint: "Memory cards",    icon: Layers2,
    subTabs: [{ id: "flashcards",  label: "Flashcards",  icon: Layers2 }],
  },
  {
    id: "quiz",        label: "Quiz",        hint: "Test yourself",   icon: HelpCircle,
    subTabs: [{ id: "quiz",        label: "Quiz",        icon: HelpCircle }],
  },
];

// ─── Access Control ───────────────────────────────────────────────────────────

/**
 * All paid users get complete access. previewMode is used only for the
 * homepage Part 1 demo (no purchase required).
 */
function isTabAccessible(_id: SubTabId, _userPlan: UserPlan, _previewMode?: boolean): boolean {
  return true;
}

function isModeAccessible(_mode: Mode, _userPlan: UserPlan, _previewMode?: boolean): boolean {
  return true;
}

// ─── Content availability ─────────────────────────────────────────────────────

function subTabHasContent(id: SubTabId, part: Part): boolean {
  switch (id) {
    case "video":       return part.assets.videoUrl !== undefined ? !!part.assets.videoUrl : true;
    case "briefing":    return !!part.assets.briefingText;
    case "study-guide": return !!part.assets.studyGuideText;
    case "facts":       return !!part.assets.statementOfFactsText;
    case "flashcards":  return !!part.assets.flashcards;
    case "quiz":        return !!part.assets.quiz;
    case "slides":      return !!(
      part.assets.slides?.presented.length ||
      part.assets.slides?.detailed.length ||
      part.assets.slides?.facts.length
    );
    case "mindmap":     return part.assets.mindmapUrl !== undefined ? !!part.assets.mindmapUrl : true;
    case "infographic": return !!(
      part.assets.infographics?.concise ||
      part.assets.infographics?.standard ||
      part.assets.infographics?.bentoGrid
    );
  }
}

function getModeSubTabs(mode: Mode, part: Part): SubTab[] {
  return mode.subTabs.filter((t) => subTabHasContent(t.id, part));
}

// ─── Content panels ───────────────────────────────────────────────────────────

function EmptyContent({ label }: { label: string }) {
  return (
    <div className="py-14 text-center">
      <p className="text-text-secondary text-sm font-medium">{label} not available for this part</p>
      <p className="text-xs text-text-muted mt-1">New content is added progressively</p>
    </div>
  );
}


/** Derive a pre-generated WebP URL from an R2 PNG URL. */
function infographicWebp(url: string, suffix: "-medium" | "-large" | ""): string | null {
  if (!url.startsWith("http")) return null;
  return suffix === ""
    ? url.replace(/\.png$/i, ".webp")
    : url.replace(/\.png$/i, `${suffix}.webp`);
}

function InfographicPanel({ part, previewMode }: { part: Part; previewMode?: boolean }) {
  const [style, setStyle] = useState<"concise" | "standard" | "bentoGrid">("standard");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const inf = part.assets.infographics;
  const styles = [
    { id: "concise"   as const, label: "Concise" },
    { id: "standard"  as const, label: "Standard" },
    { id: "bentoGrid" as const, label: "Bento Grid" },
  ].filter((s) => inf?.[s.id]);
  const currentSrc = inf?.[style] ?? inf?.[styles[0]?.id];
  const mediumSrc = currentSrc ? infographicWebp(currentSrc, "-medium") : null;
  // Lightbox uses full-size WebP (same quality, ~95% smaller than PNG)
  const lightboxSrc = currentSrc ? (infographicWebp(currentSrc, "") ?? currentSrc) : currentSrc;
  const altLabel = `Part ${part.partNumber} Infographic — ${style}`;

  // Track when infographic is viewed (loaded)
  useEffect(() => {
    if (loaded && !hasTrackedView && !previewMode && part.partNumber) {
      trackAssetOpened(part.partNumber, "infographic").catch(() => {});
      setHasTrackedView(true);
    }
  }, [loaded, hasTrackedView, previewMode, part.partNumber]);

  // Reset loading state when style changes
  const handleStyleChange = (id: "concise" | "standard" | "bentoGrid") => {
    setStyle(id);
    setLoaded(false);
    setUseFallback(false);
  };

  return (
    <div className="space-y-4">
      {styles.length > 1 && (
        <div className="flex gap-2 mb-4 pl-4">
          {styles.map((s) => (
            <button
              key={s.id} onClick={() => handleStyleChange(s.id)}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                style === s.id
                  ? "bg-gold/12 text-gold border-gold/25"
                  : "bg-surface text-text-muted border-border hover:text-text-secondary hover:border-border-subtle"
              )}
            >{s.label}</button>
          ))}
        </div>
      )}
      {currentSrc ? (
        <>
          <div
            className="relative group rounded-xl border border-border/60 bg-surface overflow-hidden cursor-zoom-in min-h-[200px]"
            onClick={() => setLightboxOpen(true)}
            title="Click to enlarge"
          >
            {/* Spinner while loading */}
            {!loaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-surface">
                <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
              </div>
            )}

            {useFallback || !mediumSrc ? (
              /* Fallback: next/image on the raw URL */
              <NextImage
                key={currentSrc}
                src={currentSrc}
                alt={altLabel}
                width={1200}
                height={675}
                className={`w-full h-auto rounded-lg transition-opacity duration-200 ${loaded ? "opacity-100" : "opacity-0"}`}
                priority
                unoptimized
                onLoad={() => setLoaded(true)}
              />
            ) : (
              /* Pre-generated medium WebP — direct from R2 CDN */
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={mediumSrc}
                src={mediumSrc}
                alt={altLabel}
                // eslint-disable-next-line react/no-unknown-property
                fetchPriority="high"
                className={`w-full h-auto rounded-lg transition-opacity duration-200 ${loaded ? "opacity-100" : "opacity-0"}`}
                onLoad={() => setLoaded(true)}
                onError={() => { setUseFallback(true); setLoaded(false); }}
              />
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center pointer-events-none">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/70 border border-white/15 text-white text-xs font-medium">
                <Maximize2 className="w-3.5 h-3.5" />
                Enlarge
              </div>
            </div>
          </div>
          <ImageLightbox
            src={lightboxSrc ?? currentSrc}
            alt={altLabel}
            isOpen={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
          />
        </>
      ) : (
        <EmptyContent label="Infographic" />
      )}
    </div>
  );
}

const SLIDE_TYPES = [
  { key: "presented" as const, label: "Presented" },
  { key: "detailed"  as const, label: "Detailed" },
  { key: "facts"     as const, label: "Facts" },
];

function SlidesPanel({ part, previewMode }: { part: Part; previewMode?: boolean }) {
  const slides = part.assets.slides;
  const available = SLIDE_TYPES.filter((t) => (slides?.[t.key]?.length ?? 0) > 0);
  const [type, setType] = useState<"presented" | "detailed" | "facts">(available[0]?.key ?? "presented");

  return (
    <div>
      {available.length > 1 && (
        <div className="flex gap-2 mb-4 flex-wrap pl-4">
          {available.map((t) => (
            <button
              key={t.key} onClick={() => setType(t.key)}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                type === t.key
                  ? "bg-gold/12 text-gold border-gold/25"
                  : "bg-surface text-text-muted border-border hover:text-text-secondary"
              )}
            >{t.label}</button>
          ))}
        </div>
      )}
      <SlidesViewer
        slides={slides?.[type] ?? []}
        title={`Part ${part.partNumber} — ${SLIDE_TYPES.find((t) => t.key === type)?.label} Slides`}
        type={type === "facts" ? "presented" : type}
        partNumber={part.partNumber}
        previewMode={previewMode}
      />
    </div>
  );
}

function SubTabContent({ id, part, previewMode }: { id: SubTabId; part: Part; previewMode?: boolean }) {
  // Generic wrap for non-article content (flashcards, quiz, facts)
  const wrap = (child: React.ReactNode) => (
    <div className="rounded-xl border border-border/60 bg-surface p-5 sm:p-7">{child}</div>
  );

  switch (id) {
    case "video":
      return (
        <div className="space-y-4">
          <LazyVideoPlayer
            partNumber={part.partNumber}
            title={part.title}
            poster={part.assets.slides?.presented[0]}
            previewMode={previewMode}
          />
          <LazyListenOnTheGo
            partNumber={part.partNumber}
            title={part.title}
            previewMode={previewMode}
          />
        </div>
      );
    // Text content — TextViewer owns its own premium article container
    case "briefing":
      return part.assets.briefingText
        ? <TextViewer content={part.assets.briefingText} partNumber={part.partNumber} assetId="briefing" previewMode={previewMode} />
        : wrap(<EmptyContent label="Briefing" />);
    case "study-guide":
      return part.assets.studyGuideText
        ? <TextViewer content={part.assets.studyGuideText} partNumber={part.partNumber} assetId="study_guide" previewMode={previewMode} />
        : wrap(<EmptyContent label="Study Guide" />);
    // Non-article content keeps the generic card wrap
    case "facts":
      return wrap(part.assets.statementOfFactsText ? <FactsViewer content={part.assets.statementOfFactsText} partNumber={part.partNumber} previewMode={previewMode} /> : <EmptyContent label="Facts" />);
    case "flashcards":
      return wrap(part.assets.flashcards ? <FlashcardsViewer flashcards={part.assets.flashcards} /> : <EmptyContent label="Flashcards" />);
    case "quiz":
      return wrap(part.assets.quiz ? <QuizViewer quiz={part.assets.quiz} partNumber={part.partNumber} previewMode={previewMode} /> : <EmptyContent label="Quiz" />);
    case "slides":      return <SlidesPanel part={part} previewMode={previewMode} />;
    case "mindmap":     return <LazyMindmapViewer partNumber={part.partNumber} title={`Part ${part.partNumber} — Mindmap`} previewMode={previewMode} />;
    case "infographic": return <InfographicPanel part={part} previewMode={previewMode} />;
  }
}


// ─── Timeline button ──────────────────────────────────────────────────────────

function TimelineButton({
  partNumber,
  era,
  previewMode,
}: {
  partNumber: number;
  era: string;
  previewMode?: boolean;
}) {
  return null;

  return (
    <Link
      href={`/seerah/part-${partNumber}/timeline`}
      className="group relative flex items-center gap-3 px-4 py-3.5 rounded-xl border flex-shrink-0 transition-all duration-200 text-left min-w-0 border-border bg-surface text-text-muted hover:border-gold/30 hover:bg-surface-raised hover:text-gold"
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors bg-surface-raised group-hover:bg-gold/10"
      >
        <Clock className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold leading-none">Timeline</p>
        <p className="text-[10px] mt-0.5 leading-none opacity-55 hidden sm:block">
          Where this fits
        </p>
      </div>
    </Link>
  );
}

// ─── Mode button ──────────────────────────────────────────────────────────────

function ModeButton({
  mode,
  isActive,
  isAvailable,
  isLocked,
  onClick,
}: {
  mode: Mode;
  isActive: boolean;
  isAvailable: boolean;
  isLocked: boolean;
  onClick: () => void;
}) {
  const Icon = mode.icon;

  return (
    <button
      onClick={onClick}
      disabled={!isAvailable && !isLocked}
      className={clsx(
        "flex items-center justify-center gap-2 px-3 py-3 rounded-xl border text-sm font-medium flex-1 min-w-max whitespace-nowrap transition-all duration-150",
        isActive
          ? "border-gold/35 bg-gold/10 text-gold"
          : isLocked
          ? "border-border/50 bg-surface/80 text-text-muted/60 hover:border-gold/20 hover:bg-surface-raised/80 cursor-pointer"
          : isAvailable
          ? "border-border bg-surface text-text-muted hover:border-border-subtle hover:bg-surface-raised hover:text-text-secondary cursor-pointer"
          : "border-border/30 bg-surface/50 text-text-muted/25 cursor-not-allowed opacity-40 pointer-events-none"
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {mode.label}
      {isLocked && (
        <span className="text-[9px] font-semibold uppercase tracking-wider opacity-60 flex-shrink-0">
          Locked
        </span>
      )}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface PartTabsProps {
  part: Part;
  userPlan: UserPlan;
  previewMode?: boolean;
}

export function PartTabs({ part, userPlan, previewMode = false }: PartTabsProps) {
  const availableModes = MODES.filter((m) => getModeSubTabs(m, part).length > 0);
  const defaultMode = availableModes[0] ?? MODES[0];

  const [activeMode, setActiveMode] = useState<ModeId>(defaultMode.id);
  const currentMode = MODES.find((m) => m.id === activeMode) ?? defaultMode;
  const subTabs = getModeSubTabs(currentMode, part);

  const [activeSubTab, setActiveSubTab] = useState<SubTabId>(subTabs[0]?.id ?? "video");

  const handleModeChange = (modeId: ModeId) => {
    setActiveMode(modeId);
    const newSubTabs = getModeSubTabs(MODES.find((m) => m.id === modeId)!, part);
    setActiveSubTab(newSubTabs[0]?.id ?? MODES.find((m) => m.id === modeId)!.subTabs[0].id);
  };

  const currentSubTab = subTabs.find((t) => t.id === activeSubTab)?.id ?? subTabs[0]?.id;

  return (
    <div className="space-y-6">

      {/* ── Mode selector strip ─────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {MODES.map((mode) => {
          const available = getModeSubTabs(mode, part).length > 0;
          return (
            <ModeButton
              key={mode.id}
              mode={mode}
              isActive={activeMode === mode.id}
              isAvailable={available}
              isLocked={false}
              onClick={() => available ? handleModeChange(mode.id) : undefined}
            />
          );
        })}
        {/* Timeline — hidden in free preview (requires login) */}
        <TimelineButton partNumber={part.partNumber} era={part.era} previewMode={previewMode} />
        {/* Trailing spacer — prevents the last button from hitting the scroll container edge */}
        <div className="flex-shrink-0 w-4" aria-hidden="true" />
      </div>

      {/* ── Sub-tab bar (only when mode has multiple content items) ────── */}
      {subTabs.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pl-4">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 flex-shrink-0 whitespace-nowrap",
                  isActive
                    ? "bg-gold/10 text-gold border-gold/25"
                    : "bg-surface text-text-muted border-border hover:text-text-secondary hover:border-border-subtle hover:bg-surface-raised"
                )}
              >
                <Icon className="w-3 h-3" />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {currentSubTab && (
        <div className="pt-1">
          <SubTabContent
            key={`${activeMode}-${currentSubTab}`}
            id={currentSubTab}
            part={part}
            previewMode={previewMode}
          />
        </div>
      )}

    </div>
  );
}
