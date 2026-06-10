"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { Maximize2 } from "lucide-react";
import {
  Video,
  BookOpen,
  FileText,
  BarChart2,
  Map,
  Image as ImageIcon,
  Layers,
  HelpCircle,
  Layers2,
  Clock,
  Lock,
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
import type { Part } from "@/lib/types";
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
  shortLabel?: string;
  subtitle: string;
  hint: string;
  icon: React.FC<{ className?: string }>;
  subTabs: SubTab[];
  primary?: boolean;
}

// ─── Mode definitions ─────────────────────────────────────────────────────────

const MODES: Mode[] = [
  {
    id: "watch",       label: "Watch",       subtitle: "Video Lesson",      hint: "Video lesson",   icon: Video,       primary: true,
    subTabs: [{ id: "video",       label: "Video",       icon: Video }],
  },
  {
    id: "read",        label: "Read",        subtitle: "Structured Notes",  hint: "Written content", icon: BookOpen,    primary: true,
    subTabs: [
      { id: "briefing",    label: "Briefing",    icon: FileText },
      { id: "study-guide", label: "Study Guide", icon: BookOpen },
      { id: "facts",       label: "Facts",       icon: BarChart2 },
    ],
  },
  {
    id: "slides",      label: "Slides",      subtitle: "Presentation",      hint: "Slide decks",    icon: Layers,      primary: true,
    subTabs: [{ id: "slides",      label: "Slides",      icon: Layers }],
  },
  {
    id: "infographic", label: "Infographic", shortLabel: "Visual", subtitle: "Visual Summary",    hint: "Visual summary", icon: ImageIcon,
    subTabs: [{ id: "infographic", label: "Infographic", icon: ImageIcon }],
  },
  {
    id: "mindmap",     label: "Mindmap",     shortLabel: "Mindmap", subtitle: "Connected Ideas",   hint: "Visual map",     icon: Map,
    subTabs: [{ id: "mindmap",     label: "Mindmap",     icon: Map }],
  },
  {
    id: "flashcards",  label: "Flashcards",  shortLabel: "Cards",  subtitle: "Memory Review",     hint: "Memory cards",   icon: Layers2,
    subTabs: [{ id: "flashcards",  label: "Flashcards",  icon: Layers2 }],
  },
  {
    id: "quiz",        label: "Quiz",        subtitle: "Test Knowledge",    hint: "Test yourself",  icon: HelpCircle,
    subTabs: [{ id: "quiz",        label: "Quiz",        icon: HelpCircle }],
  },
];

// ─── Access Control ───────────────────────────────────────────────────────────

/**
 * All paid users get complete access. previewMode is used only for the
 * homepage Part 1 demo (no purchase required).
 */
function _isTabAccessible(_id: SubTabId, _userPlan: UserPlan, _previewMode?: boolean): boolean {
  return true;
}

function _isModeAccessible(_mode: Mode, _userPlan: UserPlan, _previewMode?: boolean): boolean {
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
  // Signed URLs have query params after .png — match \.png(\?|$) not \.png$
  return suffix === ""
    ? url.replace(/\.png(\?|$)/i, ".webp$1")
    : url.replace(/\.png(\?|$)/i, `${suffix}.webp$1`);
}

export function InfographicPanel({ part, previewMode }: { part: Part; previewMode?: boolean }) {
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
  // Lightbox uses the original signed URL — avoids invalid-signature from client-side URL rewriting
  const lightboxSrc = currentSrc;
  const altLabel = `Part ${part.partNumber} Infographic — ${style}`;

  // Track when infographic is viewed — require 1.5s dwell after image loads
  // so that a URL-param (?mode=infographic) auto-open does not count unless
  // the user actually stays on the tab long enough to view it.
  useEffect(() => {
    if (!loaded || hasTrackedView || previewMode || !part.partNumber) return;
    const timer = setTimeout(() => {
      trackAssetOpened(part.partNumber, "infographic").catch(() => {});
      window.dispatchEvent(new CustomEvent("seerah:progressUpdate", { detail: { openedAssets: ["infographic"] } }));
      setHasTrackedView(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, [loaded, hasTrackedView, previewMode, part.partNumber]);

  // Reset loading state when style changes
  const handleStyleChange = (id: "concise" | "standard" | "bentoGrid") => {
    setStyle(id);
    setLoaded(false);
    setUseFallback(false);
  };

  return (
    <div className="space-y-3">
      {/* Contextual framing header */}
      <div className="mb-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gold/60 leading-none">Infographic</p>
        <p className="text-xs text-text-muted/50 mt-0.5 leading-snug" style={{ hyphens: "none" }}>{part.title}</p>
      </div>

      {/* Style selector row — only when multiple styles available */}
      {styles.length > 1 && (
        <div className="flex gap-1.5">
          {styles.map((s) => (
            <button
              key={s.id}
              onClick={() => handleStyleChange(s.id)}
              className={clsx(
                "px-3 rounded-lg text-xs font-medium transition-all duration-150 min-h-[44px] active:scale-95",
                style === s.id
                  ? "bg-gold/12 text-gold ring-1 ring-gold/25"
                  : "bg-surface-raised/50 text-text-muted/60 hover:text-text-secondary hover:bg-surface-raised"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {currentSrc ? (
        <>
          {/* Image container — warm elevation, embedded fullscreen */}
          <div
            className="relative group rounded-2xl overflow-hidden cursor-zoom-in min-h-[200px]"
            style={{
              border: "1px solid rgba(200, 169, 110, 0.18)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.45), 0 0 0 1px rgba(200,169,110,0.06), inset 0 1px 0 rgba(200,169,110,0.08)",
            }}
            onClick={() => setLightboxOpen(true)}
            onTouchEnd={() => setLightboxOpen(true)}
            title="Tap to view fullscreen"
          >
            {/* Loading spinner */}
            {!loaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-surface/80">
                <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
              </div>
            )}

            {useFallback || !mediumSrc ? (
              <NextImage
                key={currentSrc}
                src={currentSrc}
                alt={altLabel}
                width={1200}
                height={675}
                className={`w-full h-auto transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
                priority
                unoptimized
                onLoad={() => setLoaded(true)}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={mediumSrc}
                src={mediumSrc}
                alt={altLabel}
                 
                fetchPriority="high"
                className={`w-full h-auto transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
                onLoad={() => setLoaded(true)}
                onError={() => { setUseFallback(true); setLoaded(false); }}
              />
            )}

            {/* Fullscreen button — always visible in corner on mobile, hover-reveal on desktop */}
            <button
              className={clsx(
                "absolute bottom-2.5 right-2.5 flex items-center gap-1 px-2.5 rounded-lg",
                "bg-black/65 backdrop-blur-sm border border-white/10",
                "text-white/70 hover:text-white transition-all duration-150",
                "sm:opacity-0 sm:group-hover:opacity-100 opacity-80",
                "min-h-[44px]"
              )}
              onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}
              aria-label="View infographic fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium ml-1">Expand</span>
            </button>
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

export function SlidesPanel({ part, previewMode }: { part: Part; previewMode?: boolean }) {
  const slides = part.assets.slides;
  const available = SLIDE_TYPES.filter((t) => (slides?.[t.key]?.length ?? 0) > 0);
  const [type, setType] = useState<"presented" | "detailed" | "facts">(available[0]?.key ?? "presented");
  // Track which slide types have been visited — keep them mounted to preserve loaded images
  const [rendered, setRendered] = useState<Set<string>>(() => new Set([available[0]?.key ?? "presented"]));

  const handleTypeChange = (key: "presented" | "detailed" | "facts") => {
    setType(key);
    setRendered((prev) => new Set([...prev, key]));
  };

  return (
    <div>
      {available.length > 1 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {available.map((t) => (
            <button
              key={t.key} onClick={() => handleTypeChange(t.key)}
              className={clsx(
                "px-3 min-h-[44px] rounded-lg text-xs font-medium border transition-colors",
                type === t.key
                  ? "bg-gold/12 text-gold border-gold/25"
                  : "bg-surface text-text-muted border-border hover:text-text-secondary"
              )}
            >{t.label}</button>
          ))}
        </div>
      )}
      {/* Render each visited slide type once and keep it mounted — switching back is instant */}
      {[...rendered].map((key) => (
        <div key={key} className={type === key ? "" : "hidden"}>
          <SlidesViewer
            slides={slides?.[key as "presented" | "detailed" | "facts"] ?? []}
            title={`Part ${part.partNumber} — ${SLIDE_TYPES.find((t) => t.key === key)?.label} Slides`}
            type={key === "facts" ? "presented" : key as "presented" | "detailed"}
            partNumber={part.partNumber}
            previewMode={previewMode}
          />
        </div>
      ))}
    </div>
  );
}

import { fetchPartAssets, type PartAssets as PartAssetUrls } from "@/lib/part-asset-cache";

function SubTabContent({ id, part, previewMode, assetUrls, onSwitchMode, videoCompleted, initialVideoPercent, initialQuizBestScore }: {
  id: SubTabId;
  part: Part;
  previewMode?: boolean;
  assetUrls: PartAssetUrls;
  onSwitchMode?: (mode: ModeId) => void;
  videoCompleted?: boolean;
  initialVideoPercent?: number;
  initialQuizBestScore?: number;
}) {
  const wrap = (child: React.ReactNode) => (
    <div className="rounded-xl bg-surface/60 p-4 sm:p-6">{child}</div>
  );

  const hasQuiz = !!part.assets.quiz;

  switch (id) {
    case "video":
      return (
        <div className="space-y-4">
          <LazyVideoPlayer
            partNumber={part.partNumber}
            title={part.title}
            poster={assetUrls.thumbnailUrl ?? part.assets.slides?.presented[0]?.medium}
            previewMode={previewMode}
            videoUrl={assetUrls.videoUrl}
            initialVideoPercent={initialVideoPercent}
          />
          <LazyListenOnTheGo
            partNumber={part.partNumber}
            title={part.title}
            previewMode={previewMode}
            audioUrl={assetUrls.audioUrl}
            videoCompleted={videoCompleted}
          />
        </div>
      );
    case "briefing":
      return part.assets.briefingText
        ? <TextViewer
            content={part.assets.briefingText}
            partNumber={part.partNumber}
            assetId="briefing"
            previewMode={previewMode}
            hasQuiz={hasQuiz}
            onSwitchToQuiz={onSwitchMode && hasQuiz ? () => onSwitchMode("quiz") : undefined}
          />
        : wrap(<EmptyContent label="Briefing" />);
    case "study-guide":
      return part.assets.studyGuideText
        ? <TextViewer
            content={part.assets.studyGuideText}
            partNumber={part.partNumber}
            assetId="study_guide"
            previewMode={previewMode}
            hasQuiz={hasQuiz}
            onSwitchToQuiz={onSwitchMode && hasQuiz ? () => onSwitchMode("quiz") : undefined}
          />
        : wrap(<EmptyContent label="Study Guide" />);
    case "facts":
      return wrap(part.assets.statementOfFactsText ? <FactsViewer content={part.assets.statementOfFactsText} partNumber={part.partNumber} previewMode={previewMode} /> : <EmptyContent label="Facts" />);
    case "flashcards":
      return wrap(part.assets.flashcards ? <FlashcardsViewer flashcards={part.assets.flashcards} partNumber={part.partNumber} previewMode={previewMode} /> : <EmptyContent label="Flashcards" />);
    case "quiz":
      return wrap(part.assets.quiz ? <QuizViewer quiz={part.assets.quiz} partNumber={part.partNumber} previewMode={previewMode} initialBestScore={initialQuizBestScore} /> : <EmptyContent label="Quiz" />);
    case "slides":      return <SlidesPanel part={part} previewMode={previewMode} />;
    case "mindmap":     return <LazyMindmapViewer partNumber={part.partNumber} title={`Part ${part.partNumber} — Mindmap`} previewMode={previewMode} mindmapUrl={assetUrls.mindmapUrl} />;
    case "infographic": return <InfographicPanel part={part} previewMode={previewMode} />;
  }
}



// ─── Timeline button ──────────────────────────────────────────────────────────

function TimelineButton({
  partNumber,
  era: _era,
  previewMode: _previewMode,
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
  const isPrimary = !!mode.primary;
  const isDisabled = !isAvailable && !isLocked;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      aria-disabled={isDisabled ? "true" : undefined}
      aria-pressed={isActive}
      className={clsx(
        "relative flex flex-col items-center justify-center flex-1 lg:flex-none lg:max-w-[150px] 2xl:max-w-[160px] rounded-xl border",
        "transition-all duration-200 active:scale-[0.96]",
        "min-h-[52px] sm:min-h-[56px]",
        isPrimary
          ? "px-1.5 sm:px-4 py-2.5 sm:py-3 gap-0.5"
          : "px-1 sm:px-3 py-2 sm:py-2.5 gap-0.5",
        // Active — softer gold so media stays dominant
        isActive
          ? "border-gold/30 bg-gold/8 text-gold shadow-sm shadow-gold/10"
          : isDisabled
          ? "border-border/15 bg-surface/20 text-text-muted/25 cursor-not-allowed pointer-events-none"
          : isAvailable
          ? isPrimary
            // Primary inactive — clearer, more prominent
            ? "border-border/60 bg-surface-raised/70 text-text-secondary hover:border-gold/20 hover:bg-surface-high hover:text-text cursor-pointer"
            // Secondary inactive — brighter than before, still quieter than primary
            : "border-border/50 bg-surface-raised/50 text-text-secondary/75 hover:border-border/70 hover:bg-surface-raised hover:text-text-secondary cursor-pointer"
          : "border-border/30 bg-surface/40 text-text-muted/60 hover:border-gold/15 hover:bg-surface-raised/50 cursor-pointer"
      )}
    >
      {/* Icon */}
      <Icon className={clsx(
        "flex-shrink-0 transition-all duration-200",
        isPrimary ? "w-4 h-4" : "w-3.5 h-3.5",
        isActive ? "opacity-100" : isDisabled ? "opacity-20" : isPrimary ? "opacity-65" : "opacity-75"
      )} />

      {/* Label — use shortLabel on narrow screens when available */}
      <span className={clsx(
        "truncate leading-none font-semibold",
        isPrimary ? "text-[11px] sm:text-[13px]" : "text-[10px] sm:text-xs",
        isActive ? "opacity-100" : isDisabled ? "opacity-25" : "opacity-90"
      )}>
        {mode.shortLabel ? (
          <>
            <span className="min-[360px]:hidden">{mode.shortLabel}</span>
            <span className="hidden min-[360px]:inline">{mode.label}</span>
          </>
        ) : mode.label}
      </span>

      {/* Subtitle — primary on mobile, all on desktop */}
      <span className={clsx(
        "leading-none truncate",
        isPrimary ? "text-[9px] sm:text-[10px]" : "hidden sm:block text-[9px]",
        isActive ? "text-gold/55" : isDisabled ? "opacity-20" : isPrimary ? "text-text-muted/40" : "text-text-muted/55",
      )}>
        {mode.subtitle}
      </span>

      {/* Active underline accent */}
      {isActive && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-gold/60 rounded-full" />
      )}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface PartTabsProps {
  part: Part;
  userPlan: UserPlan;
  previewMode?: boolean;
  initialAssetUrls?: PartAssetUrls;
  initialVideoCompleted?: boolean;
  initialVideoPercent?: number;
  initialQuizBestScore?: number;
}

export function PartTabs({ part, userPlan: _userPlan, previewMode = false, initialAssetUrls, initialVideoCompleted, initialVideoPercent, initialQuizBestScore }: PartTabsProps) {
  const availableModes = MODES.filter((m) => getModeSubTabs(m, part).length > 0);
  const defaultMode = availableModes[0] ?? MODES[0];

  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialise from ?mode= URL param so deep links and browser back/fwd work
  const modeParam = searchParams.get("mode") as ModeId | null;
  const resolvedInitialMode: ModeId =
    modeParam && availableModes.some((m) => m.id === modeParam) ? modeParam : defaultMode.id;

  const [activeMode, setActiveMode] = useState<ModeId>(resolvedInitialMode);
  const currentMode = MODES.find((m) => m.id === activeMode) ?? defaultMode;
  const subTabs = getModeSubTabs(currentMode, part);

  const [activeSubTab, setActiveSubTab] = useState<SubTabId>(subTabs[0]?.id ?? "video");

  // Sync state when browser navigates (back/forward)
  useEffect(() => {
    const incoming = modeParam && availableModes.some((m) => m.id === modeParam) ? modeParam : defaultMode.id;
    if (incoming !== activeMode) {
      setActiveMode(incoming);
      const newSubTabs = getModeSubTabs(MODES.find((m) => m.id === incoming)!, part);
      setActiveSubTab(newSubTabs[0]?.id ?? MODES.find((m) => m.id === incoming)!.subTabs[0].id as SubTabId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeParam]);

  // Use server-provided URLs immediately; fall back to client-side fetch only if not provided
  const [assetUrls, setAssetUrls] = useState<PartAssetUrls>(initialAssetUrls ?? {});
  useEffect(() => {
    if (initialAssetUrls?.videoUrl || initialAssetUrls?.audioUrl || initialAssetUrls?.mindmapUrl) return;
    fetchPartAssets(part.partNumber).then(setAssetUrls);
  }, [part.partNumber, initialAssetUrls]);

  // Track video completion — unlocks the quiz tab
  const [videoCompleted, setVideoCompleted] = useState(initialVideoCompleted ?? false);
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if ((detail.videoWatchPercent ?? 0) >= 85) setVideoCompleted(true);
    };
    window.addEventListener("seerah:progressUpdate", handler);
    return () => window.removeEventListener("seerah:progressUpdate", handler);
  }, []);

  // Track which panels have been rendered at least once — never unmount after first visit
  const [renderedPanels, setRenderedPanels] = useState<Set<string>>(
    () => new Set([`${resolvedInitialMode}::${getModeSubTabs(MODES.find((m) => m.id === resolvedInitialMode)!, part)[0]?.id ?? MODES.find((m) => m.id === resolvedInitialMode)!.subTabs[0].id}`])
  );

  const handleModeChange = useCallback((modeId: ModeId) => {
    setActiveMode(modeId);
    const newSubTabs = getModeSubTabs(MODES.find((m) => m.id === modeId)!, part);
    const newSubTabId = newSubTabs[0]?.id ?? MODES.find((m) => m.id === modeId)!.subTabs[0].id;
    setActiveSubTab(newSubTabId as SubTabId);
    setRenderedPanels((prev) => new Set([...prev, `${modeId}::${newSubTabId}`]));
    // Persist in URL without full navigation
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", modeId);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [part, searchParams, router]);

  const handleSubTabChange = (tabId: SubTabId) => {
    setActiveSubTab(tabId);
    setRenderedPanels((prev) => new Set([...prev, `${activeMode}::${tabId}`]));
  };


  const currentSubTab = subTabs.find((t) => t.id === activeSubTab)?.id ?? subTabs[0]?.id;

  // All panels that should ever be rendered (visited at least once)
  const allPanels = [...renderedPanels];

  return (
    <div className="space-y-5">

      <div className="space-y-6">

          {/* Mode selector strip */}
          <div className="space-y-1.5 sm:space-y-0">
            {/* Mobile: two rows — primary (Watch/Read/Slides) then secondary */}
            {/* Desktop: single row with all tabs */}
            <div className="sm:hidden space-y-2">
              {/* LEARN group */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted/35 px-0.5">Learn</p>
                <div className="flex gap-1.5">
                  {MODES.filter((m) => m.primary).map((mode) => {
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
                </div>
              </div>
              {/* REVIEW group */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted/35 px-0.5">Review</p>
                <div className="flex gap-1">
                  {MODES.filter((m) => !m.primary).map((mode) => {
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
                </div>
              </div>
            </div>
            {/* Desktop: all in one row — lg:justify-center prevents giant buttons at ultrawide */}
            <div className="hidden sm:flex gap-2 lg:justify-center lg:flex-wrap">
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
              <TimelineButton partNumber={part.partNumber} era={part.era} previewMode={previewMode} />
            </div>
          </div>

          {/* Sub-tab bar (only when mode has multiple content items) */}
          {subTabs.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              {subTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleSubTabChange(tab.id)}
                    className={clsx(
                      "flex items-center gap-1.5 px-3 rounded-lg text-xs font-medium",
                      "transition-all duration-150 active:scale-95 flex-shrink-0 whitespace-nowrap",
                      "min-h-[44px]",
                      isActive
                        ? "bg-gold/12 text-gold ring-1 ring-gold/20"
                        : "bg-surface-raised/50 text-text-muted/75 hover:text-text-secondary hover:bg-surface-raised"
                    )}
                  >
                    <Icon className={clsx("w-3 h-3 transition-opacity", isActive ? "opacity-100" : "opacity-55")} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Content — panels stay mounted after first visit, hidden via CSS */}
          <div className="pt-0.5">
            {allPanels.map((panelKey) => {
              const [modeId, subTabId] = panelKey.split("::");
              const isVisible = activeMode === modeId && currentSubTab === subTabId;
              return (
                <div
                  key={panelKey}
                  className={isVisible ? "animate-in fade-in-0 duration-200" : "hidden"}
                >
                  <SubTabContent
                    id={subTabId as SubTabId}
                    part={part}
                    previewMode={previewMode}
                    assetUrls={assetUrls}
                    onSwitchMode={handleModeChange}
                    videoCompleted={videoCompleted}
                    initialVideoPercent={initialVideoPercent}
                    initialQuizBestScore={initialQuizBestScore}
                  />
                </div>
              );
            })}
          </div>

        </div>

    </div>
  );
}

