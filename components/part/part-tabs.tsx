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
import { QuizViewer, type QuizDraft } from "./quiz-viewer";
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

interface SubTab { id: SubTabId; label: string; labelAr: string; icon: React.FC<{ className?: string }>; }
interface Mode {
  id: ModeId;
  label: string;
  labelAr: string;
  shortLabel?: string;
  shortLabelAr?: string;
  subtitle: string;
  subtitleAr: string;
  hint: string;
  icon: React.FC<{ className?: string }>;
  subTabs: SubTab[];
  primary?: boolean;
}

/** Pick the Arabic or English label depending on the active course language. */
function modeLabel(mode: Mode, isRtl?: boolean): string { return isRtl ? mode.labelAr : mode.label; }
function modeShortLabel(mode: Mode, isRtl?: boolean): string {
  return isRtl ? (mode.shortLabelAr ?? mode.labelAr) : (mode.shortLabel ?? mode.label);
}
function modeSubtitle(mode: Mode, isRtl?: boolean): string { return isRtl ? mode.subtitleAr : mode.subtitle; }
function subTabLabel(tab: SubTab, isRtl?: boolean): string { return isRtl ? tab.labelAr : tab.label; }

// ─── Mode definitions ─────────────────────────────────────────────────────────

const MODES: Mode[] = [
  {
    id: "watch",       label: "Watch",       labelAr: "مشاهدة",   subtitle: "Video Lesson",      subtitleAr: "فيديو الدرس",      hint: "Video lesson",   icon: Video,       primary: true,
    subTabs: [{ id: "video",       label: "Video",       labelAr: "الفيديو",              icon: Video }],
  },
  {
    id: "read",        label: "Read",        labelAr: "قراءة",    subtitle: "Structured Notes",  subtitleAr: "ملاحظات منظمة",     hint: "Written content", icon: BookOpen,    primary: true,
    subTabs: [
      { id: "briefing",    label: "Briefing",    labelAr: "الموجز",       icon: FileText },
      { id: "study-guide", label: "Study Guide", labelAr: "دليل الدراسة", icon: BookOpen },
      { id: "facts",       label: "Facts",       labelAr: "الحقائق",      icon: BarChart2 },
    ],
  },
  {
    id: "slides",      label: "Slides",      labelAr: "الشرائح",  subtitle: "Presentation",      subtitleAr: "عرض تقديمي",       hint: "Slide decks",    icon: Layers,      primary: true,
    subTabs: [{ id: "slides",      label: "Slides",      labelAr: "الشرائح",              icon: Layers }],
  },
  {
    id: "infographic", label: "Infographic", labelAr: "إنفوجرافيك", shortLabel: "Visual", shortLabelAr: "مرئي", subtitle: "Visual Summary",    subtitleAr: "ملخص مرئي",        hint: "Visual summary", icon: ImageIcon,
    subTabs: [{ id: "infographic", label: "Infographic", labelAr: "إنفوجرافيك",           icon: ImageIcon }],
  },
  {
    id: "mindmap",     label: "Mindmap",     labelAr: "الخريطة الذهنية", shortLabel: "Mindmap", shortLabelAr: "خريطة", subtitle: "Connected Ideas",   subtitleAr: "أفكار مرتبطة",     hint: "Visual map",     icon: Map,
    subTabs: [{ id: "mindmap",     label: "Mindmap",     labelAr: "الخريطة الذهنية",       icon: Map }],
  },
  {
    id: "flashcards",  label: "Flashcards",  labelAr: "البطاقات التعليمية", shortLabel: "Cards", shortLabelAr: "بطاقات", subtitle: "Memory Review",     subtitleAr: "مراجعة الحفظ",     hint: "Memory cards",   icon: Layers2,
    subTabs: [{ id: "flashcards",  label: "Flashcards",  labelAr: "البطاقات التعليمية",   icon: Layers2 }],
  },
  {
    id: "quiz",        label: "Quiz",        labelAr: "الاختبار", subtitle: "Test Knowledge",    subtitleAr: "اختبار المعرفة",   hint: "Test yourself",  icon: HelpCircle,
    subTabs: [{ id: "quiz",        label: "Quiz",        labelAr: "الاختبار",             icon: HelpCircle }],
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

function EmptyContent({ label, labelAr, isRtl }: { label: string; labelAr?: string; isRtl?: boolean }) {
  return (
    <div className="py-14 text-center">
      <p className="text-text-secondary text-sm font-medium">
        {isRtl ? `${labelAr ?? label} غير متاح لهذا الجزء` : `${label} not available for this part`}
      </p>
      <p className="text-xs text-text-muted mt-1">
        {isRtl ? "يتم إضافة محتوى جديد تدريجيًا" : "New content is added progressively"}
      </p>
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

export function InfographicPanel({ part, previewMode, isRtl }: { part: Part; previewMode?: boolean; isRtl?: boolean }) {
  const [style, setStyle] = useState<"concise" | "standard" | "bentoGrid">("standard");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const inf = part.assets.infographics;
  const styles = [
    { id: "concise"   as const, label: "Concise",    labelAr: "مختصر" },
    { id: "standard"  as const, label: "Standard",   labelAr: "قياسي" },
    { id: "bentoGrid" as const, label: "Bento Grid", labelAr: "شبكي" },
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
        <p className="text-[10px] font-bold uppercase tracking-widest text-gold/60 leading-none">{isRtl ? "إنفوجرافيك" : "Infographic"}</p>
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
              {isRtl ? s.labelAr : s.label}
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
            title={isRtl ? "انقر للعرض بملء الشاشة" : "Tap to view fullscreen"}
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
              aria-label={isRtl ? "عرض الإنفوجرافيك بملء الشاشة" : "View infographic fullscreen"}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium">{isRtl ? "تكبير" : "Expand"}</span>
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
        <EmptyContent label="Infographic" labelAr="إنفوجرافيك" isRtl={isRtl} />
      )}
    </div>
  );
}

const SLIDE_TYPES = [
  { key: "presented" as const, label: "Presented", labelAr: "المُقدَّمة" },
  { key: "detailed"  as const, label: "Detailed",  labelAr: "التفصيلية" },
  { key: "facts"     as const, label: "Facts",     labelAr: "الحقائق" },
];

export function SlidesPanel({ part, previewMode, isRtl }: { part: Part; previewMode?: boolean; isRtl?: boolean }) {
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
            >{isRtl ? t.labelAr : t.label}</button>
          ))}
        </div>
      )}
      {/* Render each visited slide type once and keep it mounted — switching back is instant */}
      {[...rendered].map((key) => {
        const typeInfo = SLIDE_TYPES.find((t) => t.key === key);
        const title = isRtl
          ? `الجزء ${part.partNumber} — شرائح ${typeInfo?.labelAr}`
          : `Part ${part.partNumber} — ${typeInfo?.label} Slides`;
        return (
          <div key={key} className={type === key ? "" : "hidden"}>
            <SlidesViewer
              slides={slides?.[key as "presented" | "detailed" | "facts"] ?? []}
              title={title}
              type={key === "facts" ? "presented" : key as "presented" | "detailed"}
              partNumber={part.partNumber}
              previewMode={previewMode}
              isRtl={isRtl}
            />
          </div>
        );
      })}
    </div>
  );
}

import { fetchPartAssets, type PartAssets as PartAssetUrls } from "@/lib/part-asset-cache";
import type { CourseLang } from "@/lib/course-lang";

function SubTabContent({ id, part, previewMode, assetUrls, onSwitchMode, videoCompleted, initialVideoPercent, initialQuizBestScore, quizDraft, onQuizDraftChange, learnerProfileId, isRtl }: {
  id: SubTabId;
  part: Part;
  previewMode?: boolean;
  assetUrls: PartAssetUrls;
  onSwitchMode?: (mode: ModeId) => void;
  videoCompleted?: boolean;
  initialVideoPercent?: number;
  initialQuizBestScore?: number;
  quizDraft?: QuizDraft | null;
  onQuizDraftChange?: (draft: QuizDraft | null) => void;
  learnerProfileId?: string;
  isRtl?: boolean;
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
            // Companion MP3 only for still-5K Arabic masters. Part 1 is re-encoded to 1440p.
            companionAudioSrc={isRtl && part.partNumber !== 1 ? assetUrls.audioUrl : undefined}
            initialVideoPercent={initialVideoPercent}
            isRtl={isRtl}
          />
          <LazyListenOnTheGo
            partNumber={part.partNumber}
            title={part.title}
            previewMode={previewMode}
            audioUrl={assetUrls.audioUrl}
            videoCompleted={videoCompleted}
            isRtl={isRtl}
          />
        </div>
      );
    case "briefing":
      return part.assets.briefingText
        ? <div dir={isRtl ? "rtl" : undefined}><TextViewer
            content={part.assets.briefingText}
            partNumber={part.partNumber}
            assetId="briefing"
            previewMode={previewMode}
            hasQuiz={hasQuiz}
            onSwitchToQuiz={onSwitchMode && hasQuiz ? () => onSwitchMode("quiz") : undefined}
            isRtl={isRtl}
          /></div>
        : wrap(<EmptyContent label="Briefing" labelAr="الموجز" isRtl={isRtl} />);
    case "study-guide":
      return part.assets.studyGuideText
        ? <div dir={isRtl ? "rtl" : undefined}><TextViewer
            content={part.assets.studyGuideText}
            partNumber={part.partNumber}
            assetId="study_guide"
            previewMode={previewMode}
            hasQuiz={hasQuiz}
            onSwitchToQuiz={onSwitchMode && hasQuiz ? () => onSwitchMode("quiz") : undefined}
            isRtl={isRtl}
          /></div>
        : wrap(<EmptyContent label="Study Guide" labelAr="دليل الدراسة" isRtl={isRtl} />);
    case "facts":
      return wrap(<div dir={isRtl ? "rtl" : undefined}>{part.assets.statementOfFactsText ? <FactsViewer content={part.assets.statementOfFactsText} partNumber={part.partNumber} previewMode={previewMode} isRtl={isRtl} /> : <EmptyContent label="Facts" labelAr="الحقائق" isRtl={isRtl} />}</div>);
    case "flashcards":
      return wrap(<div dir={isRtl ? "rtl" : undefined}>{part.assets.flashcards ? <FlashcardsViewer flashcards={part.assets.flashcards} partNumber={part.partNumber} previewMode={previewMode} isRtl={isRtl} /> : <EmptyContent label="Flashcards" labelAr="البطاقات التعليمية" isRtl={isRtl} />}</div>);
    case "quiz":
      return wrap(<div dir={isRtl ? "rtl" : undefined}>{part.assets.quiz
        ? <QuizViewer
            quiz={part.assets.quiz}
            partNumber={part.partNumber}
            previewMode={previewMode}
            initialBestScore={initialQuizBestScore}
            draft={quizDraft}
            onDraftChange={onQuizDraftChange}
            learnerProfileId={learnerProfileId}
            isRtl={isRtl}
          />
        : <EmptyContent label="Quiz" labelAr="الاختبار" isRtl={isRtl} />}</div>);
    case "slides":      return <SlidesPanel part={part} previewMode={previewMode} isRtl={isRtl} />;
    case "mindmap":     return <LazyMindmapViewer partNumber={part.partNumber} title={`Part ${part.partNumber} — Mindmap`} previewMode={previewMode} mindmapUrl={assetUrls.mindmapUrl} />;
    case "infographic": return <InfographicPanel part={part} previewMode={previewMode} isRtl={isRtl} />;
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
  isRtl,
}: {
  mode: Mode;
  isActive: boolean;
  isAvailable: boolean;
  isLocked: boolean;
  onClick: () => void;
  isRtl?: boolean;
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
            <span className="min-[360px]:hidden">{modeShortLabel(mode, isRtl)}</span>
            <span className="hidden min-[360px]:inline">{modeLabel(mode, isRtl)}</span>
          </>
        ) : modeLabel(mode, isRtl)}
      </span>

      {/* Subtitle — primary on mobile, all on desktop */}
      <span className={clsx(
        "leading-none truncate",
        isPrimary ? "text-[9px] sm:text-[10px]" : "hidden sm:block text-[9px]",
        isActive ? "text-gold/55" : isDisabled ? "opacity-20" : isPrimary ? "text-text-muted/40" : "text-text-muted/55",
      )}>
        {modeSubtitle(mode, isRtl)}
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
  /** Force a specific tab to be active on first render, overriding URL param and default. */
  forcedInitialMode?: ModeId;
  /** Hide the mode/tab navigation row entirely (used in marketing previews to reduce friction). */
  hideTabNav?: boolean;
  /**
   * The learner profile this page was rendered for, snapshotted server-side
   * at page load. Passed through to progress-tracking writes (e.g. quiz
   * submission) so a stale tab's writes aren't silently attributed to a
   * different family profile switched to in another tab. Undefined for
   * contexts without family profiles (e.g. the classroom lesson page).
   */
  learnerProfileId?: string;
  /** Language the page was rendered in — sets initial state for the EN/AR toggle. */
  initialLang?: CourseLang;
}

export function PartTabs({ part, userPlan: _userPlan, previewMode = false, initialAssetUrls, initialVideoCompleted, initialVideoPercent, initialQuizBestScore, forcedInitialMode, hideTabNav = false, learnerProfileId, initialLang = "en" }: PartTabsProps) {
  // Mind maps aren't produced for the Arabic course — hide the tab entirely in AR.
  const modes = initialLang === "ar" ? MODES.filter((m) => m.id !== "mindmap") : MODES;
  const availableModes = modes.filter((m) => getModeSubTabs(m, part).length > 0);
  const defaultMode = availableModes[0] ?? modes[0];

  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialise from ?mode= URL param so deep links and browser back/fwd work.
  // forcedInitialMode takes highest precedence (used by the free preview to default to Watch).
  const modeParam = searchParams.get("mode") as ModeId | null;
  const resolvedInitialMode: ModeId = forcedInitialMode && availableModes.some((m) => m.id === forcedInitialMode)
    ? forcedInitialMode
    : modeParam && availableModes.some((m) => m.id === modeParam) ? modeParam : defaultMode.id;

  const [activeMode, setActiveMode] = useState<ModeId>(resolvedInitialMode);
  const currentMode = modes.find((m) => m.id === activeMode) ?? defaultMode;
  const subTabs = getModeSubTabs(currentMode, part);

  const [activeSubTab, setActiveSubTab] = useState<SubTabId>(subTabs[0]?.id ?? "video");

  // Sync state when browser navigates (back/forward)
  useEffect(() => {
    const incoming = modeParam && availableModes.some((m) => m.id === modeParam) ? modeParam : defaultMode.id;
    if (incoming !== activeMode) {
      setActiveMode(incoming);
      const newSubTabs = getModeSubTabs(modes.find((m) => m.id === incoming)!, part);
      setActiveSubTab(newSubTabs[0]?.id ?? modes.find((m) => m.id === incoming)!.subTabs[0].id as SubTabId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeParam]);

  // Use server-provided URLs immediately; update state whenever the server refreshes
  // (e.g. after a lang switch via router.refresh()). Fall back to a client-side fetch
  // only when the server didn't provide any URLs at all.
  const [assetUrls, setAssetUrls] = useState<PartAssetUrls>(initialAssetUrls ?? {});
  useEffect(() => {
    if (initialAssetUrls?.videoUrl || initialAssetUrls?.audioUrl || initialAssetUrls?.mindmapUrl) {
      // Server gave us valid URLs (initial render or after router.refresh()) — adopt them.
      setAssetUrls(initialAssetUrls);
      return;
    }
    fetchPartAssets(part.partNumber, initialLang).then(setAssetUrls);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [part.partNumber, initialAssetUrls, initialLang]);


  // Keep the video panel mounted once visited so the player state (seek position,
  // buffered data) is preserved when the user switches to Read and back.
  // All other panels unmount when not active to avoid mounting hidden heavy components.
  const [videoMounted, setVideoMounted] = useState(resolvedInitialMode === "watch");

  // Quiz in-progress state — held here so it survives the QuizViewer unmounting
  // when the user switches away from the Quiz tab. Never stores the "done" state.
  const [quizDraft, setQuizDraft] = useState<QuizDraft | null>(null);

  const handleModeChange = useCallback((modeId: ModeId) => {
    setActiveMode(modeId);
    const newSubTabs = getModeSubTabs(modes.find((m) => m.id === modeId)!, part);
    const newSubTabId = newSubTabs[0]?.id ?? modes.find((m) => m.id === modeId)!.subTabs[0].id;
    setActiveSubTab(newSubTabId as SubTabId);
    if (modeId === "watch") setVideoMounted(true);
    // Persist in URL without full navigation
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", modeId);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [part, modes, searchParams, router]);

  const handleSubTabChange = (tabId: SubTabId) => {
    setActiveSubTab(tabId);
    if (tabId === "video") setVideoMounted(true);
  };


  const currentSubTab = subTabs.find((t) => t.id === activeSubTab)?.id ?? subTabs[0]?.id;

  const isVideoActive = activeMode === "watch" && currentSubTab === "video";

  return (
    <div className="space-y-5">

      <div className="space-y-6">

          {/* Mode selector strip — hidden in marketing preview contexts */}
          <div className={`space-y-1.5 sm:space-y-0${hideTabNav ? " hidden" : ""}`}>
            {/* Mobile: two rows — primary (Watch/Read/Slides) then secondary */}
            {/* Desktop: single row with all tabs */}
            <div className="sm:hidden space-y-2">
              {/* LEARN group */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted/35 px-0.5">{initialLang === "ar" ? "تعلّم" : "Learn"}</p>
                <div className="flex gap-1.5">
                  {modes.filter((m) => m.primary).map((mode) => {
                    const available = getModeSubTabs(mode, part).length > 0;
                    return (
                      <ModeButton
                        key={mode.id}
                        mode={mode}
                        isActive={activeMode === mode.id}
                        isAvailable={available}
                        isLocked={false}
                        onClick={() => available ? handleModeChange(mode.id) : undefined}
                        isRtl={initialLang === "ar"}
                      />
                    );
                  })}
                </div>
              </div>
              {/* REVIEW group */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted/35 px-0.5">{initialLang === "ar" ? "مراجعة" : "Review"}</p>
                <div className="flex gap-1">
                  {modes.filter((m) => !m.primary).map((mode) => {
                    const available = getModeSubTabs(mode, part).length > 0;
                    return (
                      <ModeButton
                        key={mode.id}
                        mode={mode}
                        isActive={activeMode === mode.id}
                        isAvailable={available}
                        isLocked={false}
                        onClick={() => available ? handleModeChange(mode.id) : undefined}
                        isRtl={initialLang === "ar"}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
            {/* Desktop: all in one row — lg:justify-center prevents giant buttons at ultrawide */}
            <div className="hidden sm:flex gap-2 lg:justify-center lg:flex-wrap">
              {modes.map((mode) => {
                const available = getModeSubTabs(mode, part).length > 0;
                return (
                  <ModeButton
                    key={mode.id}
                    mode={mode}
                    isActive={activeMode === mode.id}
                    isAvailable={available}
                    isLocked={false}
                    onClick={() => available ? handleModeChange(mode.id) : undefined}
                    isRtl={initialLang === "ar"}
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
                    {subTabLabel(tab, initialLang === "ar")}
                  </button>
                );
              })}
            </div>
          )}

          {/* Content rendering:
              - Video panel: kept mounted once visited so the player state (seek position,
                buffered data) is preserved when the user switches tabs and returns.
              - All other panels: rendered only when active. Quiz in-progress state will
                reset on tab switch (best score from DB is preserved via initialQuizBestScore). */}
          <div className="pt-0.5">
            {/* Video panel — stays in DOM once visited.
                key includes lang so it fully remounts when language switches,
                clearing the browser's buffered stream and loading the new URL. */}
            {videoMounted && (
              <div key={`video-${initialLang}`} className={isVideoActive ? "animate-in fade-in-0 duration-200" : "hidden"}>
                <SubTabContent
                  id="video"
                  part={part}
                  previewMode={previewMode}
                  assetUrls={assetUrls}
                  onSwitchMode={handleModeChange}
                  initialVideoPercent={initialVideoPercent}
                  initialQuizBestScore={initialQuizBestScore}
                  quizDraft={quizDraft}
                  onQuizDraftChange={setQuizDraft}
                  learnerProfileId={learnerProfileId}
                  isRtl={initialLang === "ar"}
                />
              </div>
            )}
            {/* Active non-video panel — rendered only when active */}
            {!isVideoActive && currentSubTab && (
              <div className="animate-in fade-in-0 duration-200">
                <SubTabContent
                  id={currentSubTab}
                  part={part}
                  previewMode={previewMode}
                  assetUrls={assetUrls}
                  onSwitchMode={handleModeChange}
                  initialVideoPercent={initialVideoPercent}
                  initialQuizBestScore={initialQuizBestScore}
                  quizDraft={quizDraft}
                  onQuizDraftChange={setQuizDraft}
                  learnerProfileId={learnerProfileId}
                  isRtl={initialLang === "ar"}
                />
              </div>
            )}
          </div>

        </div>

    </div>
  );
}

