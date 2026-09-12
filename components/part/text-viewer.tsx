"use client";
import type { CourseLang } from "@/lib/course-lang";
import { loc } from "@/lib/loc";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, Clock, Layers, ClipboardCheck } from "lucide-react";
import { trackBriefingOpened, trackAssetOpened } from "@/app/actions/progress";
import { formatSeerahContent } from "@/lib/text-formatter";
import { PARTS, localizePart } from "@/lib/content";
import { ERA_MAP, eraLabel as eraLabelFor } from "@/lib/types";

const ASSET_META: Record<string, { label: string; labelAr: string; labelFr: string; subtitle: string; subtitleAr: string; subtitleFr: string }> = {
  briefing: {
    label: "LESSON BRIEFING",
    labelAr: "موجز الدرس",
    labelFr: "BRIEFING DE LA LEÇON",
    subtitle: "A structured written summary of this lesson. Best reviewed after watching the video.",
    subtitleAr: "ملخص كتابي منظم لهذا الدرس. يُفضّل مراجعته بعد مشاهدة الفيديو.",
    subtitleFr: "Un résumé écrit structuré de cette leçon. À revoir de préférence après la vidéo.",
  },
  study_guide: {
    label: "STUDY GUIDE",
    labelAr: "دليل الدراسة",
    labelFr: "GUIDE D'ÉTUDE",
    subtitle: "A deeper review of key concepts, names, and events from this lesson.",
    subtitleAr: "مراجعة أعمق للمفاهيم والأسماء والأحداث الأساسية في هذا الدرس.",
    subtitleFr: "Une revue plus approfondie des concepts, noms et événements clés de cette leçon.",
  },
};

/** Estimate reading time from raw HTML string. */
function estimateReadTime(html: string, lang: CourseLang = "en"): string {
  const words = html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).length;
  const minutes = Math.max(2, Math.round(words / 220));
  return loc(lang, `${minutes} min read`, `${minutes} دقيقة قراءة`, `${minutes} min de lecture`);
}

interface TextViewerProps {
  content: string;
  className?: string;
  partNumber?: number;
  /** "briefing" triggers briefingOpened tracking; any other value tracks as optional asset */
  assetId?: string;
  /** When true (free preview), skip all progress tracking — user is not logged in */
  previewMode?: boolean;
  /** Whether a quiz is available for this lesson part */
  hasQuiz?: boolean;
  /** Callback to switch to the quiz mode from the parent tab controller */
  onSwitchToQuiz?: () => void;
  isRtl?: boolean;
  lang?: CourseLang;
}

export function TextViewer({
  content,
  className,
  partNumber,
  assetId,
  previewMode,
  hasQuiz,
  onSwitchToQuiz,
  isRtl,
  lang: langProp,
}: TextViewerProps) {
  const lang: CourseLang = langProp ?? (isRtl ? "ar" : "en");
  const html = formatSeerahContent(content);
  const meta = assetId ? ASSET_META[assetId] : undefined;
  const readTime = estimateReadTime(html, lang);

  // Look up part metadata for era label and lesson title
  const rawPartData = partNumber ? PARTS.find((p) => p.partNumber === partNumber) : undefined;
  const partData = rawPartData ? localizePart(rawPartData, lang) : undefined;
  const eraLabel = partData ? eraLabelFor(ERA_MAP[partData.era as keyof typeof ERA_MAP], lang === "ar") : "";
  const totalParts = PARTS.length;

  // Reading progress (0–100)
  const [readProgress, setReadProgress] = useState(0);
  const articleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = articleRef.current;
    if (!el) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const windowH = window.innerHeight;
      const total = el.offsetHeight;
      // Require content taller than the viewport so a short article that fits
      // entirely on screen cannot auto-fire "10% read" on mount.
      if (total <= windowH) {
        setReadProgress(0);
        return;
      }
      const scrolled = Math.max(0, windowH - rect.top);
      const pct = Math.min(100, Math.round((scrolled / total) * 100));
      setReadProgress(pct);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // initialise
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Track asset as "opened" only after the user has scrolled at least 10% through
  // the content. This prevents auto-tracking when the tab is opened via a URL
  // param (?mode=read) without actual reading engagement.
  const trackedRef = useRef(false);
  useEffect(() => {
    if (trackedRef.current || !partNumber || previewMode || readProgress < 10) return;
    trackedRef.current = true;
    if (assetId === "briefing") {
      trackBriefingOpened(partNumber).catch(() => {});
      window.dispatchEvent(
        new CustomEvent("seerah:progressUpdate", { detail: { briefingOpened: true } })
      );
    } else if (assetId) {
      trackAssetOpened(partNumber, assetId).catch(() => {});
      window.dispatchEvent(
        new CustomEvent("seerah:progressUpdate", { detail: { openedAssets: [assetId] } })
      );
    }
  }, [readProgress, partNumber, previewMode, assetId]);

  if (previewMode) {
    return (
      <div className="relative max-h-72 overflow-hidden rounded-lg">
        <div className={`article-shell ${className ?? ""}`} ref={articleRef}>
          <div className="article-container">
            <div className="formatted-text" dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        </div>
        {/* Fade-out overlay */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-surface to-transparent" />
        <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-text-muted/60">
          {loc(lang, "Full lesson available after signup", "الدرس الكامل متاح بعد التسجيل", "La leçon complète est disponible après inscription")}
        </p>
      </div>
    );
  }

  return (
    <div className={`article-shell ${className ?? ""}`} ref={articleRef}>
      {/* Fixed reading progress bar — sticks to viewport top as user scrolls through article.
          z-[60] places it above sticky headers; 2px height makes it unobtrusive.
          pointer-events-none ensures it never blocks clicks. */}
      {readProgress > 0 && (
        <div
          aria-hidden
          className="pointer-events-none"
          style={{ position: "fixed", top: 0, left: 0, right: 0, height: 2, zIndex: 60 }}
        >
          <div
            className="article-progress-fill"
            style={{ width: `${readProgress}%` }}
          />
        </div>
      )}

      <div className="article-container">

        {/* Thin reading progress bar — top of article */}
        <div className="article-progress-track">
          <div
            className="article-progress-fill"
            style={{ width: `${readProgress}%` }}
          />
        </div>

        {/* Article header */}
        {meta && (
          <div className="article-header">
            <p className="article-label">{loc(lang, meta.label, meta.labelAr, meta.labelFr)}</p>

            {/* Lesson title from content data */}
            {partData && (
              <h2
                className="article-title"
                style={{ hyphens: "none", overflowWrap: "normal", wordBreak: "normal" }}
              >
                {partData.title}
              </h2>
            )}
            {partData?.subtitle && (
              <p className="article-lesson-subtitle">{partData.subtitle}</p>
            )}

            {/* Metadata row — Part X · Era · Read time */}
            <div className="article-meta-row">
              {partNumber && (
                <>
                  <span className="article-meta-item">
                    <Layers size={11} strokeWidth={2} />
                    {loc(lang, `Part ${partNumber} of ${totalParts}`, `الجزء ${partNumber} من ${totalParts}`, `Partie ${partNumber} sur ${totalParts}`)}
                  </span>
                  <span className="article-meta-sep" aria-hidden>·</span>
                </>
              )}
              {eraLabel && (
                <>
                  <span className="article-meta-item">{eraLabel}</span>
                  <span className="article-meta-sep" aria-hidden>·</span>
                </>
              )}
              <span className="article-meta-item">
                <Clock size={11} strokeWidth={2} />
                {readTime}
              </span>
            </div>

            {/* What this document is */}
            <p className="article-subtitle">{loc(lang, meta.subtitle, meta.subtitleAr, meta.subtitleFr)}</p>

            {/* Reading progress context */}
            <div className="article-progress-context">
              <div className="article-progress-context-bar">
                <div
                  className="article-progress-context-fill"
                  style={{ width: `${readProgress}%` }}
                />
              </div>
              <span className="article-progress-context-label">
                {loc(
                  lang,
                  readProgress < 5 ? "Start reading" : readProgress >= 95 ? "Completed" : `${readProgress}% through`,
                  readProgress < 5 ? "ابدأ القراءة" : readProgress >= 95 ? "اكتمل" : `${readProgress}% تمت القراءة`,
                  readProgress < 5 ? "Commencer la lecture" : readProgress >= 95 ? "Terminé" : `${readProgress} % parcourus`,
                )}
              </span>
            </div>
          </div>
        )}

        {/* Divider */}
        {meta && <div className="article-divider" />}

        {/* Article body */}
        <div
          className="formatted-text"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Bottom reading-complete prompt */}
        {meta && (
          <div className="article-end-marker">
            <div className="article-end-line" />
            <p className="article-end-label">
              <BookOpen size={11} strokeWidth={2} />
              {loc(
                lang,
                `End of ${meta.label.toLowerCase().replace("lesson ", "")}`,
                `نهاية ${meta.labelAr}`,
                `Fin — ${meta.labelFr.toLowerCase()}`,
              )}
            </p>
          </div>
        )}

        {/* End-of-article CTA — shown after reading a briefing or study guide */}
        {meta && (
          <div className="mt-8 flex flex-col items-center gap-3 text-center">
            {onSwitchToQuiz ? (
              <button
                type="button"
                onClick={onSwitchToQuiz}
                className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] bg-gold hover:bg-gold-light text-ink font-semibold rounded-xl text-sm transition-colors shadow-md shadow-gold/20"
              >
                <ClipboardCheck className="w-4 h-4" />
                {loc(lang, "Take the Quiz", "ابدأ الاختبار", "Passer le quiz")}
              </button>
            ) : hasQuiz !== false && partNumber ? (
              <Link
                href="?mode=quiz"
                className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] bg-gold hover:bg-gold-light text-ink font-semibold rounded-xl text-sm transition-colors shadow-md shadow-gold/20"
              >
                <ClipboardCheck className="w-4 h-4" />
                {loc(lang, "Take the Quiz", "ابدأ الاختبار", "Passer le quiz")}
              </Link>
            ) : null}
            {(onSwitchToQuiz || (hasQuiz !== false && partNumber)) && (
              <p className="text-[11px] text-text-muted/60">
                {loc(lang, "Test your understanding of this lesson", "اختبر فهمك لهذا الدرس", "Testez votre compréhension de cette leçon")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
