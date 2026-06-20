"use client";

import { Headphones } from "lucide-react";
import { AudioPlayer } from "./audio-player";

interface ListenOnTheGoProps {
  audioUrl?: string;
  title?: string;
  partNumber?: number;
  previewMode?: boolean;
  videoCompleted?: boolean;
}

export function ListenOnTheGo({ audioUrl, title, partNumber, previewMode, videoCompleted }: ListenOnTheGoProps) {
  if (!audioUrl) return null;
  if (previewMode) return null;

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center gap-2">
        <Headphones className="w-3.5 h-3.5 text-gold/70 flex-shrink-0" />
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Listen on the Go</p>
        <span className="text-[10px] text-text-muted/60">· Perfect for commutes and repetition</span>
      </div>
      <AudioPlayer src={audioUrl} title={title} partNumber={partNumber} compact previewMode={previewMode} videoCompleted={videoCompleted} />
    </div>
  );
}
