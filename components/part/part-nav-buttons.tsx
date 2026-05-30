"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface PartNavButtonsProps {
  prevPart: { id: string; partNumber: number } | null;
  nextPart: {
    id: string;
    partNumber: number;
    title: string;
    subtitle?: string | null;
  } | null;
  currentPart: number;
  totalParts: number;
}

export function PartNavButtons({
  prevPart,
  nextPart,
  currentPart,
  totalParts,
}: PartNavButtonsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function navigate(id: string) {
    startTransition(() => {
      router.push(`/seerah/${id}`);
    });
  }

  return (
    <>
      {/* Navigation row */}
      <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between gap-3">
        {prevPart ? (
          <button
            onClick={() => navigate(prevPart.id)}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border/60 hover:bg-surface-raised hover:border-border transition-all min-h-[48px] disabled:opacity-60 disabled:cursor-wait"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <div className="text-left">
              <p className="text-[10px] text-text-muted">Previous</p>
              <p className="text-xs font-medium text-text-secondary">
                Part {prevPart.partNumber}
              </p>
            </div>
          </button>
        ) : (
          <div />
        )}

        {nextPart && (
          <button
            onClick={() => navigate(nextPart.id)}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 rounded-xl bg-gold text-ink hover:bg-gold-light transition-all font-bold ml-auto min-h-[52px] shadow-lg shadow-gold/25 text-sm disabled:opacity-70 disabled:cursor-wait"
          >
            <div className="text-right">
              <p className="text-[10px] text-ink/60 font-normal leading-none mb-0.5">
                Continue
              </p>
              <p className="font-bold leading-none">Part {nextPart.partNumber}</p>
            </div>
            {isPending ? (
              <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
            ) : (
              <ChevronRight className="w-4 h-4 shrink-0" />
            )}
          </button>
        )}
      </div>

      {/* Bottom progression */}
      <div className="mt-5 pb-2 flex items-center justify-center gap-2 text-[11px] text-text-muted/50 max-w-full">
        <span className="flex-shrink-0">
          Part {currentPart} of {totalParts}
        </span>
        {nextPart && (
          <>
            <span className="text-[9px] flex-shrink-0">·</span>
            <span className="truncate min-w-0">Next: {nextPart.title}</span>
          </>
        )}
      </div>
    </>
  );
}
