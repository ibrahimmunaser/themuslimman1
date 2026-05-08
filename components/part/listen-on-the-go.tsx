"use client";

import { useState } from "react";
import { Headphones, ChevronDown, ChevronUp } from "lucide-react";
import { AudioPlayer } from "./audio-player";

interface ListenOnTheGoProps {
  audioUrl?: string;
  title?: string;
  partNumber?: number;
  previewMode?: boolean;
}

export function ListenOnTheGo({ audioUrl, title, partNumber, previewMode }: ListenOnTheGoProps) {
  const [expanded, setExpanded] = useState(false);

  if (!audioUrl) {
    return null; // Don't show if no audio available
  }

  return (
    <div className="mt-4">
      {/* Trigger button */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="group flex items-center gap-2.5 px-4 py-3 rounded-xl border border-border/50 bg-surface/50 hover:bg-surface hover:border-border transition-all w-full sm:w-auto"
        >
          <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0 group-hover:bg-gold/15 transition-colors">
            <Headphones className="w-4 h-4 text-gold" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-sm font-medium text-text">Prefer audio only?</p>
            <p className="text-xs text-text-muted">Listen on the Go</p>
          </div>
          <ChevronDown className="w-4 h-4 text-text-muted group-hover:text-text-secondary transition-colors flex-shrink-0" />
        </button>
      )}

      {/* Expanded audio player */}
      {expanded && (
        <div className="space-y-3 animate-[fadeIn_0.2s_ease-in-out]">
          {/* Header with collapse button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                <Headphones className="w-4 h-4 text-gold" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text">Listen on the Go</p>
                <p className="text-xs text-text-muted">Same lesson, lighter format</p>
              </div>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="p-1.5 rounded-lg hover:bg-surface-raised transition-colors"
              title="Collapse"
            >
              <ChevronUp className="w-4 h-4 text-text-muted" />
            </button>
          </div>

          {/* Audio player */}
          <AudioPlayer src={audioUrl} title={title} partNumber={partNumber} compact previewMode={previewMode} />

          {/* Helpful description */}
          <p className="text-xs text-text-muted leading-relaxed px-1">
            Same lesson, lighter and easier to review when you do not want to watch the screen.
          </p>
        </div>
      )}
    </div>
  );
}
