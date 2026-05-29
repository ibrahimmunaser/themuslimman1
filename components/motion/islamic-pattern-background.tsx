"use client";

import { motion, useReducedMotion } from "framer-motion";

interface IslamicPatternBackgroundProps {
  /** 0–1 opacity for the pattern layer */
  opacity?: number;
  className?: string;
  /** Animate a very slow breathing opacity shift */
  animate?: boolean;
}

/**
 * Subtle Islamic 8-pointed star geometric SVG pattern as a background layer.
 * Designed to be placed absolute/fixed behind content.
 * Accessibility: aria-hidden, pointer-events-none.
 */
export function IslamicPatternBackground({
  opacity = 0.035,
  className,
  animate: shouldAnimate = false,
}: IslamicPatternBackgroundProps) {
  const prefersReduced = useReducedMotion();
  const canAnimate = shouldAnimate && !prefersReduced;

  // SVG 8-pointed star tile (16×16 base, tiled)
  const patternSvg = `
    <svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'>
      <path d='M20 0 L23 17 L40 20 L23 23 L20 40 L17 23 L0 20 L17 17 Z'
            fill='none' stroke='%23c8a96e' stroke-width='0.6' opacity='0.8'/>
      <path d='M20 6 L22 17 L34 20 L22 23 L20 34 L18 23 L6 20 L18 17 Z'
            fill='none' stroke='%23c8a96e' stroke-width='0.4' opacity='0.4'/>
    </svg>
  `.trim();

  const dataUri = `data:image/svg+xml,${encodeURIComponent(patternSvg)}`;

  const inner = (
    <div
      aria-hidden
      className={`pointer-events-none ${className ?? ""}`}
      style={{
        backgroundImage: `url("${dataUri}")`,
        backgroundSize: "40px 40px",
        opacity,
      }}
    />
  );

  if (!canAnimate) return inner;

  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none ${className ?? ""}`}
      style={{
        backgroundImage: `url("${dataUri}")`,
        backgroundSize: "40px 40px",
      }}
      animate={{ opacity: [opacity * 0.7, opacity, opacity * 0.7] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}
