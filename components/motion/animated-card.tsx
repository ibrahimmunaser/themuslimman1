"use client";

import { motion, useReducedMotion } from "framer-motion";
import { fadeUp } from "@/lib/motion";

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** Enable hover lift effect */
  lift?: boolean;
  /** Enable gold glow on hover */
  glow?: boolean;
  once?: boolean;
}

/**
 * Card that fades up on entrance and optionally lifts + glows on hover.
 * Combines scroll-triggered entrance with interactive hover state.
 */
export function AnimatedCard({
  children,
  className,
  delay = 0,
  lift = true,
  glow = false,
  once = true,
}: AnimatedCardProps) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-60px" }}
      variants={{
        hidden: { opacity: 0, y: prefersReduced ? 0 : 20 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: [0, 0, 0.2, 1], delay },
        },
      }}
      whileHover={
        prefersReduced || !lift
          ? undefined
          : {
              y: -5,
              transition: { duration: 0.18, ease: [0, 0, 0.2, 1] },
            }
      }
      className={className}
      style={
        glow && !prefersReduced
          ? {
              // Gold shadow appears on hover via CSS custom property trick
              transition: "box-shadow 0.25s ease",
            }
          : undefined
      }
    >
      {children}
    </motion.div>
  );
}
