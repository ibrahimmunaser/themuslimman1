"use client";

import { useEffect } from "react";
import { BookOpen, Clock } from "lucide-react";
import { trackBriefingOpened, trackAssetOpened } from "@/app/actions/progress";
import { formatSeerahContent } from "@/lib/text-formatter";
import { PART_CONTENT } from "@/lib/part-content-data";

const ASSET_META: Record<string, { label: string; title: string; subtitle: string }> = {
  briefing: {
    label: "LESSON BRIEFING",
    title: "Lesson Summary",
    subtitle:
      "A structured written version of this lesson. Best reviewed after watching the video.",
  },
  study_guide: {
    label: "STUDY GUIDE",
    title: "Study Guide",
    subtitle:
      "A deeper review of key concepts, names, and events from this lesson.",
  },
};

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
  // Use pre-rendered HTML from hardcoded data if available (faster, no runtime formatting).
  // Falls back to formatting the raw text at render time.
  const preRendered = partNumber && assetId === "briefing"
    ? (PART_CONTENT[partNumber]?.briefingHtml ?? null)
    : null;
  const html = preRendered ?? formatSeerahContent(content);
  const meta = assetId ? ASSET_META[assetId] : undefined;

  useEffect(() => {
    if (!partNumber || previewMode) return;
    if (assetId === "briefing") {
      trackBriefingOpened(partNumber).catch(() => {});
      window.dispatchEvent(new CustomEvent("seerah:progressUpdate", { detail: { briefingOpened: true } }));
    } else if (assetId) {
      trackAssetOpened(partNumber, assetId).catch(() => {});
      window.dispatchEvent(new CustomEvent("seerah:progressUpdate", { detail: { openedAssets: [assetId] } }));
    }
    // Run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`article-shell ${className ?? ""}`}>
      <div className="article-container">

        {/* Article header — label, title, subtitle, meta */}
        {meta && (
          <div className="article-header">
            <p className="article-label">{meta.label}</p>
            <h2 className="article-title">{meta.title}</h2>
            <p className="article-subtitle">{meta.subtitle}</p>
            <div className="article-meta-row">
              <span className="article-meta-item">
                <Clock size={12} strokeWidth={2} />
                5–8 min read
              </span>
              <span className="article-meta-sep" aria-hidden>·</span>
              <span className="article-meta-item">
                <BookOpen size={12} strokeWidth={2} />
                Review after the video
              </span>
            </div>
          </div>
        )}

        {/* Divider between header and body */}
        {meta && <div className="article-divider" />}

        {/* Article body */}
        <div
          className="formatted-text"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
