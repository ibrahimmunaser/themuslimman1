"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";

interface AnimatedProgressRingProps {
  /** 0–100 */
  percent: number;
  /** Outer diameter in px */
  size?: number;
  /** Stroke width in px */
  strokeWidth?: number;
  /** Ring track color */
  trackColor?: string;
  /** Ring fill color */
  fillColor?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * SVG circular progress ring that animates its stroke-dashoffset on entry.
 * Place content (e.g. a label) as children and it renders centred.
 */
export function AnimatedProgressRing({
  percent,
  size = 80,
  strokeWidth = 6,
  trackColor = "rgba(200,169,110,0.15)",
  fillColor = "#c8a96e",
  className,
  children,
}: AnimatedProgressRingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const prefersReduced = useReducedMotion();

  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const clampedPct = Math.min(Math.max(percent, 0), 100);
  const offset = circ - (clampedPct / 100) * circ;

  return (
    <div ref={ref} className={`relative inline-flex items-center justify-center ${className ?? ""}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Animated fill */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={fillColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={isInView ? { strokeDashoffset: offset } : { strokeDashoffset: circ }}
          transition={
            prefersReduced
              ? { duration: 0 }
              : { duration: 1.1, ease: [0, 0, 0.2, 1], delay: 0.1 }
          }
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
