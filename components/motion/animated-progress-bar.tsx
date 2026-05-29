"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";

interface AnimatedProgressBarProps {
  /** 0–100 */
  percent: number;
  className?: string;
  /** Track (background) className */
  trackClassName?: string;
  /** Fill className — defaults to gold */
  fillClassName?: string;
  /** Height in pixels */
  height?: number;
  /** Delay before animation starts */
  delay?: number;
  /** Show percentage label */
  showLabel?: boolean;
}

/**
 * A progress bar that animates from 0 to `percent` on viewport entry.
 */
export function AnimatedProgressBar({
  percent,
  className,
  trackClassName = "bg-surface-raised",
  fillClassName = "bg-gold",
  height = 6,
  delay = 0,
  showLabel = false,
}: AnimatedProgressBarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const prefersReduced = useReducedMotion();

  const clampedPct = Math.min(Math.max(percent, 0), 100);

  return (
    <div ref={ref} className={className}>
      {showLabel && (
        <div className="flex justify-end mb-1">
          <span className="text-xs text-text-muted">{clampedPct}%</span>
        </div>
      )}
      <div
        className={`relative w-full rounded-full overflow-hidden ${trackClassName}`}
        style={{ height }}
        role="progressbar"
        aria-valuenow={clampedPct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <motion.div
          className={`absolute left-0 top-0 h-full rounded-full ${fillClassName}`}
          initial={{ width: "0%" }}
          animate={isInView ? { width: `${clampedPct}%` } : { width: "0%" }}
          transition={
            prefersReduced
              ? { duration: 0 }
              : { duration: 0.9, ease: [0, 0, 0.2, 1], delay }
          }
        />
      </div>
    </div>
  );
}
