"use client";

import { useState, useEffect } from "react";
import { MindmapViewer } from "./mindmap-viewer";
import { trackAssetOpened } from "@/app/actions/progress";
import { fetchPartAssets } from "@/lib/part-asset-cache";

interface LazyMindmapViewerProps {
  partNumber: number;
  title: string;
  previewMode?: boolean;
  /** Pre-fetched signed URL — skips the /api/part/N/assets call when provided */
  mindmapUrl?: string;
}

export function LazyMindmapViewer({ partNumber, title, previewMode, mindmapUrl: mindmapUrlProp }: LazyMindmapViewerProps) {
  const [mindmapUrl, setMindmapUrl] = useState<string | undefined>(mindmapUrlProp);
  const [loading, setLoading] = useState(!mindmapUrlProp);

  useEffect(() => {
    if (mindmapUrlProp) {
      setMindmapUrl(mindmapUrlProp);
      setLoading(false);
      if (!previewMode) trackAssetOpened(partNumber, "mindmap").catch(() => {});
      return;
    }

    let mounted = true;
    fetchPartAssets(partNumber)
      .then((data) => {
        if (mounted) {
          setMindmapUrl(data.mindmapUrl);
          setLoading(false);
          if (!previewMode && data.mindmapUrl) trackAssetOpened(partNumber, "mindmap").catch(() => {});
        }
      })
      .catch(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [partNumber, previewMode, mindmapUrlProp]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!mindmapUrl) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">Mindmap not available</p>
      </div>
    );
  }

  return <MindmapViewer src={mindmapUrl} title={title} />;
}
