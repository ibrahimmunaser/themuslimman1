"use client";

import { motion, useReducedMotion } from "framer-motion";

interface FloatingGlowProps {
  /** Color — defaults to gold */
  color?: string;
  /** Width in px or CSS string */
  width?: number | string;
  /** Height in px or CSS string */
  height?: number | string;
  className?: string;
  /** Slow floating animation cycle in seconds */
  duration?: number;
}

/**
 * Soft ambient glow orb. Place it absolute/fixed behind content sections.
 * Animates a gentle breathing + drift on loop. Disabled for reduced motion.
 */
export function FloatingGlow({
  color = "rgba(200,169,110,0.07)",
  width = 600,
  height = 400,
  className,
  duration = 9,
}: FloatingGlowProps) {
  const prefersReduced = useReducedMotion();

  const style = {
    width,
    height,
    background: `radial-gradient(ellipse at center, ${color} 0%, transparent 70%)`,
    borderRadius: "50%",
    filter: "blur(40px)",
  };

  if (prefersReduced) {
    return (
      <div
        aria-hidden
        className={`pointer-events-none ${className ?? ""}`}
        style={style}
      />
    );
  }

  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none ${className ?? ""}`}
      style={style}
      animate={{
        scale:   [1, 1.08, 1],
        opacity: [0.8, 1, 0.8],
        y:       [0, -12, 0],
      }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}
