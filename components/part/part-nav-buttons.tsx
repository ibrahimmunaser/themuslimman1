"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { PrefetchPartLink } from "@/components/course/prefetch-part-link";

const PATH_STORAGE_KEY = "seerah:lessons-path";

interface NavPart {
  id: string;
  partNumber: number;
  title?: string;
  subtitle?: string | null;
}

interface PartNavButtonsProps {
  prevPart: { id: string; partNumber: number } | null;
  nextPart: NavPart | null;
  /** Children's-path predecessor — used when the active path is "children" */
  childrenPrevPart?: { id: string; partNumber: number } | null;
  /** Children's-path successor — used when the active path is "children" */
  childrenNextPart?: NavPart | null;
  currentPart: number;
  totalParts: number;
  /** Total parts in the Children's path (for "Part X of Y" display) */
  childrenTotalParts?: number;
  /** 1-based index of the current part within the Children's path */
  childrenCurrentIndex?: number;
  initialQuizPassed: boolean;
}

export function PartNavButtons({
  prevPart,
  nextPart,
  childrenPrevPart,
  childrenNextPart,
  currentPart,
  totalParts,
  childrenTotalParts,
  childrenCurrentIndex,
  initialQuizPassed,
}: PartNavButtonsProps) {
  // Track quiz pass state live — unlocks the Continue button without a page reload
  const [quizPassed, setQuizPassed] = useState(initialQuizPassed);
  // Read the active path from localStorage to decide which nav to show
  const [activePath, setActivePath] = useState<"complete" | "children">("complete");

  useEffect(() => {
    const stored = localStorage.getItem(PATH_STORAGE_KEY);
    if (stored === "children") {
      // Children's Seerah path has been removed — clear the stale setting and
      // always show the complete 100-part path so users see the correct count.
      localStorage.removeItem(PATH_STORAGE_KEY);
    }
    // activePath stays "complete" (the default) — no setActivePath call needed.
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.quizPassed === true) setQuizPassed(true);
    };
    window.addEventListener("seerah:progressUpdate", handler);
    return () => window.removeEventListener("seerah:progressUpdate", handler);
  }, []);

  // Pick the appropriate nav parts based on active path.
  // Fall back to complete-path nav if children's nav is not available for this part.
  const useChildrenNav = activePath === "children" && (childrenNextPart !== undefined || childrenPrevPart !== undefined);
  const displayPrev = useChildrenNav ? (childrenPrevPart ?? null) : prevPart;
  const displayNext = useChildrenNav ? (childrenNextPart ?? null) : nextPart;
  const displayTotal = useChildrenNav && childrenTotalParts ? childrenTotalParts : totalParts;

  useEffect(() => {
    if (displayNext) {
      fetch(`/api/part/${displayNext.partNumber}/warm`, { method: "GET" }).catch(() => {});
    }
    if (displayPrev) {
      fetch(`/api/part/${displayPrev.partNumber}/warm`, { method: "GET" }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayNext?.partNumber, displayPrev?.partNumber]);

  return (
    <>
      {/* Navigation row */}
      <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between gap-3">
        {displayPrev ? (
          <PrefetchPartLink
            partNumber={displayPrev.partNumber}
            className="inline-flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border/60 hover:bg-surface-raised hover:border-border transition-all min-h-[48px]"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <div className="text-left">
              <p className="text-[10px] text-text-muted">Previous</p>
              <p className="text-xs font-medium text-text-secondary">
                Part {displayPrev.partNumber}
              </p>
            </div>
          </PrefetchPartLink>
        ) : (
          <div />
        )}

        {displayNext && (
          quizPassed ? (
            <PrefetchPartLink
              partNumber={displayNext.partNumber}
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 rounded-xl bg-gold text-ink hover:bg-gold-light transition-all font-bold ml-auto min-h-[52px] shadow-lg shadow-gold/25 text-sm"
            >
              <div className="text-right">
                <p className="text-[10px] text-ink/60 font-normal leading-none mb-0.5">
                  Continue
                </p>
                <p className="font-bold leading-none">Part {displayNext.partNumber}</p>
              </div>
              <ChevronRight className="w-4 h-4 shrink-0" />
            </PrefetchPartLink>
          ) : (
            <div className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 rounded-xl bg-surface border border-border text-text-muted ml-auto min-h-[52px] cursor-not-allowed opacity-60">
              <div className="text-right">
                <p className="text-[10px] font-normal leading-none mb-0.5">Pass the quiz</p>
                <p className="font-bold leading-none text-sm">to continue</p>
              </div>
              <Lock className="w-4 h-4 shrink-0" />
            </div>
          )
        )}
      </div>

      {/* Bottom progression */}
      <div className="mt-5 pb-2 flex items-center justify-center gap-2 text-[11px] text-text-muted/50 max-w-full">
        <span className="flex-shrink-0">
          Part {useChildrenNav && childrenCurrentIndex ? childrenCurrentIndex : currentPart} of {displayTotal}
        </span>
        {displayNext?.title && (
          <>
            <span className="text-[9px] flex-shrink-0">·</span>
            <span className="truncate min-w-0">Next: {displayNext.title}</span>
          </>
        )}
      </div>
    </>
  );
}
