"use client";

import { useState, useEffect } from "react";

export interface PartProgressInitial {
  videoWatchPercent: number;
  briefingOpened: boolean;
  quizPassed: boolean;
  quizBestScore: number | null;
  flashcardsReviewed: boolean;
  openedAssets: string[];
}

interface PartProgressBadgesProps {
  initial: PartProgressInitial;
}

export function PartProgressBadges({ initial }: PartProgressBadgesProps) {
  const [state, setState] = useState(initial);

  useEffect(() => {
    // Listen for any asset opened/progress event and merge the update in.
    const handler = (e: Event) => {
      const update = (e as CustomEvent<Partial<PartProgressInitial>>).detail;
      setState((prev) => ({
        ...prev,
        ...update,
        openedAssets: update.openedAssets
          ? Array.from(new Set([...prev.openedAssets, ...update.openedAssets]))
          : prev.openedAssets,
      }));
    };
    window.addEventListener("seerah:progressUpdate", handler);
    return () => window.removeEventListener("seerah:progressUpdate", handler);
  }, []);

  const { videoWatchPercent: vp, briefingOpened, quizPassed, quizBestScore, flashcardsReviewed, openedAssets } = state;

  const assets = [
    { key: "video",       label: vp >= 85 ? "✓ Video" : vp > 0 ? `Video ${vp}%` : "Video",                                                          done: vp >= 85,                              partial: vp > 0 && vp < 85 },
    { key: "briefing",    label: briefingOpened          ? "✓ Briefing"    : "Briefing",                                                              done: briefingOpened,                        partial: false },
    { key: "slides",      label: openedAssets.includes("slides")      ? "✓ Slides"      : "Slides",                                                  done: openedAssets.includes("slides"),       partial: false },
    { key: "audio",       label: openedAssets.includes("audio")       ? "✓ Audio"       : "Audio",                                                   done: openedAssets.includes("audio"),        partial: false },
    { key: "mindmap",     label: openedAssets.includes("mindmap")     ? "✓ Mind Map"    : "Mind Map",                                                done: openedAssets.includes("mindmap"),      partial: false },
    { key: "infographic", label: openedAssets.includes("infographic") ? "✓ Infographic" : "Infographic",                                             done: openedAssets.includes("infographic"),  partial: false },
    { key: "flashcards",  label: flashcardsReviewed      ? "✓ Flashcards"  : "Flashcards",                                                           done: flashcardsReviewed,                    partial: false },
    { key: "quiz",        label: quizPassed ? `✓ Quiz ${quizBestScore}%` : quizBestScore ? `Quiz ${quizBestScore}%` : "Quiz",                         done: quizPassed,                            partial: !!(quizBestScore && !quizPassed) },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-2 text-xs">
      {assets.map((a, i) => (
        <span
          key={a.key}
          className={a.done ? "text-green-400" : a.partial ? "text-amber-400" : "text-text-muted/50"}
        >
          {a.label}
          {i < assets.length - 1 && <span className="ml-3 text-border">·</span>}
        </span>
      ))}
    </div>
  );
}
