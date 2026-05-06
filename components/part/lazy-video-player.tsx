"use client";

import { useState, useEffect } from "react";
import { VideoPlayer } from "./video-player";
import { Play } from "lucide-react";

interface LazyVideoPlayerProps {
  partNumber: number;
  title?: string;
  poster?: string;
}

export function LazyVideoPlayer({ partNumber, title, poster }: LazyVideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchVideoUrl() {
      try {
        const response = await fetch(`/api/part/${partNumber}/assets`);
        if (!response.ok) throw new Error("Failed to fetch video");
        
        const data = await response.json();
        
        if (mounted) {
          setVideoUrl(data.videoUrl);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching video URL:", err);
        if (mounted) {
          setError(true);
          setLoading(false);
        }
      }
    }

    fetchVideoUrl();

    return () => {
      mounted = false;
    };
  }, [partNumber]);

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
    />
  );
}
