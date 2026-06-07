"use client";

import { useState, useEffect, useCallback } from "react";
import { VideoPlayer } from "./video-player";
import { Play } from "lucide-react";
import { fetchPartAssets } from "@/lib/part-asset-cache";
import { trackVideoProgress } from "@/app/actions/progress";

interface LazyVideoPlayerProps {
  partNumber: number;
  title?: string;
  poster?: string;
  previewMode?: boolean;
  /** Pre-fetched signed URL — skips the /api/part/N/assets call when provided */
  videoUrl?: string;
  /** Server-fetched watch percent forwarded to VideoPlayer for seek clamping */
  initialVideoPercent?: number;
}

export function LazyVideoPlayer({ partNumber, title, poster, previewMode, videoUrl: videoUrlProp, initialVideoPercent }: LazyVideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState<string | undefined>(videoUrlProp);
  const [loading, setLoading] = useState(!videoUrlProp);
  const [error, setError] = useState(false);

  // Stable reference so VideoPlayer's useCallback dep array doesn't re-run on every render
  const handleProgress = useCallback((pNum: number, pct: number) => {
    trackVideoProgress(pNum, pct).catch(() => {});
  }, []);

  useEffect(() => {
    if (videoUrlProp) {
      setVideoUrl(videoUrlProp);
      setLoading(false);
      return;
    }

    let mounted = true;
    fetchPartAssets(partNumber)
      .then((data) => { if (mounted) { setVideoUrl(data.videoUrl); setLoading(false); } })
      .catch(() => { if (mounted) { setError(true); setLoading(false); } });
    return () => { mounted = false; };
  }, [partNumber, videoUrlProp]);

  if (loading) {
    return (
      <div className="aspect-video rounded-2xl bg-surface border border-border flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        <p className="text-text-muted text-sm">Loading video...</p>
      </div>
    );
  }

  if (error || !videoUrl) {
    return (
      <div className="aspect-video rounded-2xl bg-surface border border-border flex flex-col items-center justify-center gap-3">
        <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
          <Play className="w-7 h-7 text-gold/60 ml-1" />
        </div>
        <div className="text-center">
          <p className="text-text-secondary text-sm font-medium">Video unavailable</p>
          <p className="text-text-muted text-xs mt-1">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <VideoPlayer
      src={videoUrl}
      title={title}
      poster={poster}
      partNumber={partNumber}
      previewMode={previewMode}
      initialVideoPercent={initialVideoPercent}
      onProgress={previewMode ? undefined : handleProgress}
    />
  );
}
