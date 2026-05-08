"use client";

import { useEffect } from "react";
import { trackBriefingOpened, trackAssetOpened } from "@/app/actions/progress";
import { formatSeerahContent } from "@/lib/text-formatter";

interface TextViewerProps {
  content: string;
  className?: string;
  partNumber?: number;
  /** "briefing" triggers briefingOpened tracking; any other value tracks as optional asset */
  assetId?: string;
  /** When true (free preview), skip all progress tracking — user is not logged in */
  previewMode?: boolean;
}

export function TextViewer({ content, className, partNumber, assetId, previewMode }: TextViewerProps) {
  const html = formatSeerahContent(content);

  useEffect(() => {
    if (!partNumber || previewMode) return;
    if (assetId === "briefing") {
      trackBriefingOpened(partNumber).catch(() => {});
    } else if (assetId) {
      trackAssetOpened(partNumber, assetId).catch(() => {});
    }
  // Run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`formatted-text ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
