"use client";

import { useReducedMotion, motion } from "framer-motion";
import { fadeUp, safeVariants } from "@/lib/motion";

interface FadeUpProps {
  children: React.ReactNode;
  className?: string;
  /** Extra delay in seconds before the entrance begins */
  delay?: number;
  /** Distance in px to slide up from. Default 24 */
  distance?: number;
  /** Use once:false to re-animate on re-entry */
  once?: boolean;
  as?: "div" | "section" | "li" | "article" | "span";
}

/**
 * Wraps children in a fade-up entrance triggered when the element enters
 * the viewport. Respects prefers-reduced-motion automatically.
 */
export function FadeUp({
  children,
  className,
  delay = 0,
  distance = 24,
  once = true,
  as = "div",
}: FadeUpProps) {
  const prefersReduced = useReducedMotion();

  const variants = safeVariants(
    {
      hidden: { opacity: 0, y: prefersReduced ? 0 : distance },
      show:   {
        opacity: 1,
        y: 0,
        transition: { duration: 0.55, ease: [0, 0, 0.2, 1], delay },
      },
    },
    prefersReduced,
  );

  const Tag = motion[as];

  return (
    <Tag
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-60px" }}
      className={className}
    >
      {children}
    </Tag>
  );
}
