"use client";

import { useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  isRtl?: boolean;
}

export function PartNavButtons({
  prevPart,
  nextPart,
  currentPart,
  totalParts,
  isRtl,
}: PartNavButtonsProps) {
  useEffect(() => {
    // Clear any stale "children" path setting from localStorage
    if (localStorage.getItem(PATH_STORAGE_KEY) === "children") {
      localStorage.removeItem(PATH_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (nextPart) fetch(`/api/part/${nextPart.partNumber}/warm`, { method: "GET" }).catch(() => {});
    if (prevPart) fetch(`/api/part/${prevPart.partNumber}/warm`, { method: "GET" }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextPart?.partNumber, prevPart?.partNumber]);

  const BackIcon = isRtl ? ChevronRight : ChevronLeft;
  const ForwardIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <>
      <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between gap-3" dir={isRtl ? "rtl" : undefined}>
        {prevPart ? (
          <PrefetchPartLink
            partNumber={prevPart.partNumber}
            className="inline-flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border/60 hover:bg-surface-raised hover:border-border transition-all min-h-[48px]"
          >
            <BackIcon className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <div className={isRtl ? "text-right" : "text-left"}>
              <p className="text-[10px] text-text-muted">{isRtl ? "السابق" : "Previous"}</p>
              <p className="text-xs font-medium text-text-secondary">{isRtl ? `الجزء ${prevPart.partNumber}` : `Part ${prevPart.partNumber}`}</p>
            </div>
          </PrefetchPartLink>
        ) : (
          <div />
        )}

        {nextPart && (
          <PrefetchPartLink
            partNumber={nextPart.partNumber}
            className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 rounded-xl bg-gold text-ink hover:bg-gold-light transition-all font-bold ms-auto min-h-[52px] shadow-lg shadow-gold/25 text-sm"
          >
            <div className={isRtl ? "text-left" : "text-right"}>
              <p className="text-[10px] text-ink/60 font-normal leading-none mb-0.5">{isRtl ? "استمرار" : "Continue"}</p>
              <p className="font-bold leading-none">{isRtl ? `الجزء ${nextPart.partNumber}` : `Part ${nextPart.partNumber}`}</p>
            </div>
            <ForwardIcon className="w-4 h-4 shrink-0" />
          </PrefetchPartLink>
        )}
      </div>

      <div className="mt-5 pb-2 flex items-center justify-center gap-2 text-[11px] text-text-muted/50 max-w-full" dir={isRtl ? "rtl" : undefined}>
        <span className="flex-shrink-0">{isRtl ? `الجزء ${currentPart} من ${totalParts}` : `Part ${currentPart} of ${totalParts}`}</span>
        {nextPart?.title && (
          <>
            <span className="text-[9px] flex-shrink-0">·</span>
            <span className="truncate min-w-0">{isRtl ? `التالي: ${nextPart.title}` : `Next: ${nextPart.title}`}</span>
          </>
        )}
      </div>
    </>
  );
}
