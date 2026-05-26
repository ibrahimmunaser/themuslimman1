"use client";

import { useState, useEffect } from "react";
import { ListenOnTheGo } from "./listen-on-the-go";
import { Headphones } from "lucide-react";

interface LazyListenOnTheGoProps {
  partNumber: number;
  title?: string;
  previewMode?: boolean;
  /** Pre-fetched signed URL — skips the /api/part/N/assets call when provided */
  audioUrl?: string;
}

export function LazyListenOnTheGo({ partNumber, title, previewMode, audioUrl: audioUrlProp }: LazyListenOnTheGoProps) {
  const [audioUrl, setAudioUrl] = useState<string | undefined>(audioUrlProp);
  const [loading, setLoading] = useState(!audioUrlProp);

  useEffect(() => {
    if (audioUrlProp) {
      setAudioUrl(audioUrlProp);
      setLoading(false);
      return;
    }

    let mounted = true;

    async function fetchAudioUrl() {
      try {
        const response = await fetch(`/api/part/${partNumber}/assets`);
        if (!response.ok) throw new Error("Failed to fetch audio");
        
        const data = await response.json();
        
        if (mounted) {
          setAudioUrl(data.audioUrl);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching audio URL:", err);
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchAudioUrl();

    return () => {
      mounted = false;
    };
  }, [partNumber, audioUrlProp]);

  // Don't show anything while loading or if no audio available
  if (loading || !audioUrl) {
    return null;
  }

  return <ListenOnTheGo audioUrl={audioUrl} title={title} partNumber={partNumber} previewMode={previewMode} />;
}
