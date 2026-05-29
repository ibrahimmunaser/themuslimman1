"use client";

import { motion, useReducedMotion } from "framer-motion";

interface StaggerChildrenProps {
  children: React.ReactNode;
  className?: string;
  /** Seconds between each child animation */
  stagger?: number;
  /** Initial delay before first child */
  delay?: number;
  once?: boolean;
  as?: "div" | "ul" | "ol" | "section";
}

/**
 * Container that staggers the entrance of its direct children.
 * Children should use FadeUp or similar motion.div components.
 * If they're plain elements, wrap each in a <FadeUp> inside this.
 */
export function StaggerChildren({
  children,
  className,
  stagger = 0.1,
  delay = 0,
  once = true,
  as = "div",
}: StaggerChildrenProps) {
  const prefersReduced = useReducedMotion();
  const Tag = motion[as];

  return (
    <Tag
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-60px" }}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: prefersReduced ? 0 : stagger,
            delayChildren: prefersReduced ? 0 : delay,
          },
        },
      }}
      className={className}
    >
      {children}
    </Tag>
  );
}
