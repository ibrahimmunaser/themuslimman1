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
  currentPart: number;
  totalParts: number;
  initialQuizPassed: boolean;
}

export function PartNavButtons({
  prevPart,
  nextPart,
  currentPart,
  totalParts,
  initialQuizPassed,
}: PartNavButtonsProps) {
  const [quizPassed, setQuizPassed] = useState(initialQuizPassed);

  useEffect(() => {
    // Clear any stale "children" path setting from localStorage
    if (localStorage.getItem(PATH_STORAGE_KEY) === "children") {
      localStorage.removeItem(PATH_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.quizPassed === true) setQuizPassed(true);
    };
    window.addEventListener("seerah:progressUpdate", handler);
    return () => window.removeEventListener("seerah:progressUpdate", handler);
  }, []);

  useEffect(() => {
    if (nextPart) fetch(`/api/part/${nextPart.partNumber}/warm`, { method: "GET" }).catch(() => {});
    if (prevPart) fetch(`/api/part/${prevPart.partNumber}/warm`, { method: "GET" }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextPart?.partNumber, prevPart?.partNumber]);

  return (
    <>
      <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between gap-3">
        {prevPart ? (
          <PrefetchPartLink
            partNumber={prevPart.partNumber}
            className="inline-flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border/60 hover:bg-surface-raised hover:border-border transition-all min-h-[48px]"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <div className="text-left">
              <p className="text-[10px] text-text-muted">Previous</p>
              <p className="text-xs font-medium text-text-secondary">Part {prevPart.partNumber}</p>
            </div>
          </PrefetchPartLink>
        ) : (
          <div />
        )}

        {nextPart && (
          quizPassed ? (
            <PrefetchPartLink
              partNumber={nextPart.partNumber}
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 rounded-xl bg-gold text-ink hover:bg-gold-light transition-all font-bold ml-auto min-h-[52px] shadow-lg shadow-gold/25 text-sm"
            >
              <div className="text-right">
                <p className="text-[10px] text-ink/60 font-normal leading-none mb-0.5">Continue</p>
                <p className="font-bold leading-none">Part {nextPart.partNumber}</p>
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

      <div className="mt-5 pb-2 flex items-center justify-center gap-2 text-[11px] text-text-muted/50 max-w-full">
        <span className="flex-shrink-0">Part {currentPart} of {totalParts}</span>
        {nextPart?.title && (
          <>
            <span className="text-[9px] flex-shrink-0">·</span>
            <span className="truncate min-w-0">Next: {nextPart.title}</span>
          </>
        )}
      </div>
    </>
  );
}
