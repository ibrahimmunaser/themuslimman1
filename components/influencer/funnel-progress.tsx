"use client";

import { Check } from "lucide-react";
import type { FlowStep } from "@/components/influencer/influencer-quick-checkout";

const PROGRESS_STEPS: { id: FlowStep; label: string }[] = [
  { id: "offer",    label: "Overview" },
  { id: "preview",  label: "Free Lesson" },
  { id: "checkout", label: "Choose Plan" },
];

interface FunnelProgressProps {
  current: FlowStep;
  onNavigate: (step: FlowStep) => void;
}

/**
 * Subtle three-step progress indicator shown above every screen of the
 * influencer quick-checkout funnel. Completed steps are real, clickable
 * buttons; the active step is visually distinct via `aria-current="step"`.
 */
export function FunnelProgress({ current, onNavigate }: FunnelProgressProps) {
  const currentIndex = PROGRESS_STEPS.findIndex((s) => s.id === current);

  return (
    <nav
      aria-label="Checkout progress"
      className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-zinc-800/70"
    >
      <ol className="flex items-center max-w-lg mx-auto px-4 sm:px-5 py-2.5">
        {PROGRESS_STEPS.map((step, index) => {
          const isActive    = index === currentIndex;
          const isCompleted = index < currentIndex;

          return (
            <li key={step.id} className="flex items-center flex-1 last:flex-none">
              <button
                type="button"
                onClick={() => { if (isCompleted) onNavigate(step.id); }}
                disabled={!isCompleted}
                aria-current={isActive ? "step" : undefined}
                aria-label={
                  isActive
                    ? `Current step: ${step.label}`
                    : isCompleted
                      ? `Go back to ${step.label}`
                      : `${step.label} — not yet available`
                }
                className={[
                  "flex items-center gap-1.5 rounded-full py-1 pr-1.5 text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                  isActive    ? "text-gold" :
                  isCompleted ? "text-zinc-300 hover:text-gold cursor-pointer" :
                                "text-zinc-600 cursor-default",
                ].join(" ")}
              >
                <span
                  aria-hidden="true"
                  className={[
                    "flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold flex-shrink-0 border transition-colors",
                    isActive    ? "bg-gold text-ink border-gold" :
                    isCompleted ? "bg-gold/15 text-gold border-gold/40" :
                                  "bg-transparent text-zinc-600 border-zinc-700",
                  ].join(" ")}
                >
                  {isCompleted ? <Check className="w-3 h-3" aria-hidden="true" /> : index + 1}
                </span>
                <span className="hidden sm:inline">{step.label}</span>
              </button>

              {index < PROGRESS_STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className={[
                    "h-px flex-1 min-w-[10px] sm:min-w-[20px] mx-1",
                    isCompleted ? "bg-gold/40" : "bg-zinc-800",
                  ].join(" ")}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
