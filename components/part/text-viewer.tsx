"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, Clock, Layers } from "lucide-react";
import { trackBriefingOpened, trackAssetOpened } from "@/app/actions/progress";
import { formatSeerahContent } from "@/lib/text-formatter";
import { PART_CONTENT } from "@/lib/part-content-data";
import { PARTS } from "@/lib/content";
import { ERA_MAP } from "@/lib/types";

const ASSET_META: Record<string, { label: string; subtitle: string }> = {
  briefing: {
    label: "LESSON BRIEFING",
    subtitle: "A structured written summary of this lesson. Best reviewed after watching the video.",
  },
  study_guide: {
    label: "STUDY GUIDE",
    subtitle: "A deeper review of key concepts, names, and events from this lesson.",
  },
};

/** Estimate reading time from raw HTML string. */
function estimateReadTime(html: string): string {
  const words = html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).length;
  const minutes = Math.max(2, Math.round(words / 220));
  return `${minutes} min read`;
}

interface TextViewerProps {
  content: string;
  className?: string;
  partNumber?: number;
  /** "briefing" triggers briefingOpened tracking; any other value tracks as optional asset */
  assetId?: string;
  /** When true (free preview), skip all progress tracking — user is not logged in */
  previewMode?: boolean;
}

export function TextViewer({
  content,
  className,
  partNumber,
  assetId,
  previewMode,
}: TextViewerProps) {
  const preRendered =
    partNumber && assetId === "briefing"
      ? (PART_CONTENT[partNumber]?.briefingHtml ?? null)
      : null;
  const html = preRendered ?? formatSeerahContent(content);
  const meta = assetId ? ASSET_META[assetId] : undefined;
  const readTime = estimateReadTime(html);

  // Look up part metadata for era label and lesson title
  const partData = partNumber ? PARTS.find((p) => p.partNumber === partNumber) : undefined;
  const eraLabel = partData ? (ERA_MAP[partData.era as keyof typeof ERA_MAP]?.label ?? "") : "";
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
      // How far the user has scrolled through the article
      const scrolled = Math.max(0, windowH - rect.top);
      const total = el.offsetHeight;
      const pct = Math.min(100, Math.round((scrolled / total) * 100));
      setReadProgress(pct);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // initialise
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!partNumber || previewMode) return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`article-shell ${className ?? ""}`} ref={articleRef}>
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
            <p className="article-label">{meta.label}</p>

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
                    Part {partNumber} of {totalParts}
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
            <p className="article-subtitle">{meta.subtitle}</p>

            {/* Reading progress context */}
            <div className="article-progress-context">
              <div className="article-progress-context-bar">
                <div
                  className="article-progress-context-fill"
                  style={{ width: `${readProgress}%` }}
                />
              </div>
              <span className="article-progress-context-label">
                {readProgress < 5 ? "Start reading" : readProgress >= 95 ? "Completed" : `${readProgress}% through`}
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
              End of {meta.label.toLowerCase().replace("lesson ", "")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
