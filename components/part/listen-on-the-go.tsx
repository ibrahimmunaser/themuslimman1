"use client";

import { Headphones } from "lucide-react";
import { AudioPlayer } from "./audio-player";

interface ListenOnTheGoProps {
  audioUrl?: string;
  title?: string;
  partNumber?: number;
  previewMode?: boolean;
}

export function ListenOnTheGo({ audioUrl, title, partNumber, previewMode }: ListenOnTheGoProps) {
  if (!audioUrl) return null;

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
          <Headphones className="w-4 h-4 text-gold" />
        </div>
        <div>
          <p className="text-sm font-semibold text-text">Listen on the Go</p>
          <p className="text-xs text-text-muted">Same lesson, lighter format</p>
        </div>
      </div>

      <AudioPlayer src={audioUrl} title={title} partNumber={partNumber} compact previewMode={previewMode} />

      <p className="text-xs text-text-muted leading-relaxed px-1">
        Same lesson, lighter and easier to review when you do not want to watch the screen.
      </p>
    </div>
  );
}
