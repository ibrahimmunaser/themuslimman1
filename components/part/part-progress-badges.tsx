"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, CircleDashed } from "lucide-react";

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
    const handler = (e: Event) => {
      const update = (e as CustomEvent<Partial<PartProgressInitial>>).detail;
      setState((prev) => ({
        ...prev,
        ...update,
        // Never allow the displayed watch percent to go backwards; events from
        // seek/scrub can arrive out of order and a lower value must not overwrite
        // a higher one that was already shown.
        videoWatchPercent:
          update.videoWatchPercent !== undefined
            ? Math.max(prev.videoWatchPercent, update.videoWatchPercent)
            : prev.videoWatchPercent,
        openedAssets: update.openedAssets
          ? Array.from(new Set([...prev.openedAssets, ...update.openedAssets]))
          : prev.openedAssets,
      }));
    };
    window.addEventListener("seerah:progressUpdate", handler);
    return () => window.removeEventListener("seerah:progressUpdate", handler);
  }, []);

  const { videoWatchPercent: vp, briefingOpened, quizPassed, quizBestScore, flashcardsReviewed, openedAssets } = state;

  const resources = [
    { key: "video",       label: "Video",       done: vp >= 85,                              partial: vp > 0 && vp < 85 },
    { key: "briefing",    label: "Briefing",     done: briefingOpened,                        partial: false },
    { key: "slides",      label: "Slides",       done: openedAssets.includes("slides"),       partial: false },
    { key: "audio",       label: "Audio",        done: openedAssets.includes("audio"),        partial: false },
    { key: "mindmap",     label: "Mind Map",     done: openedAssets.includes("mindmap"),      partial: false },
    { key: "infographic", label: "Infographic",  done: openedAssets.includes("infographic"),  partial: false },
    { key: "flashcards",  label: "Flashcards",   done: flashcardsReviewed,                    partial: false },
    { key: "quiz",        label: "Quiz",         done: quizPassed,                            partial: !!(quizBestScore && !quizPassed) },
  ];

  const completedCount = resources.filter((r) => r.done).length;
  const total = resources.length;

  return (
    <div className="mt-2">
      {/* Mobile: compact summary + dots */}
      <div className="sm:hidden">
        <p className="text-[11px] text-text-muted mb-1.5">
          Completed:{" "}
          <span className={completedCount === total ? "text-green-400 font-semibold" : "text-text-secondary font-semibold"}>
            {completedCount}/{total} Resources
          </span>
        </p>
        <div className="flex items-center gap-1.5 flex-wrap" role="list" aria-label="Resource progress">
          {resources.map((r) => (
            <span
              key={r.key}
              role="listitem"
              aria-label={`${r.label}: ${r.done ? "completed" : r.partial ? "in progress" : "not started"}`}
              className={
                r.done
                  ? "w-5 h-5 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-400"
                  : r.partial
                  ? "w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400"
                  : "w-5 h-5 rounded-full bg-surface-raised border border-dashed border-border/70"
              }
            >
              {r.done
                ? <CheckCircle2 aria-hidden className="w-3 h-3" />
                : r.partial
                ? <CircleDashed aria-hidden className="w-3 h-3" />
                : null}
            </span>
          ))}
        </div>
      </div>

      {/* Desktop: original inline text badges */}
      <div className="hidden sm:flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
        {resources.map((a, i) => (
          <span
            key={a.key}
            className={a.done ? "text-green-400" : a.partial ? "text-amber-400" : "text-text-muted/50"}
          >
            {a.done ? `✓ ${a.label}` : a.partial ? `~ ${a.label}` : a.label}
            {i < resources.length - 1 && <span className="ml-3 text-border">·</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
