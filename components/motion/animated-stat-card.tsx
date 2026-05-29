"use client";

import { motion, useReducedMotion } from "framer-motion";
import { AnimatedCounter } from "./animated-counter";

interface AnimatedStatCardProps {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  delay?: number;
  className?: string;
}

/**
 * A stat display card with a counting number and fade-up entrance.
 * Used on homepage and pricing for course statistics.
 */
export function AnimatedStatCard({
  value,
  suffix = "",
  prefix = "",
  label,
  description,
  icon,
  delay = 0,
  className,
}: AnimatedStatCardProps) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReduced ? 0 : 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: [0, 0, 0.2, 1], delay }}
      whileHover={prefersReduced ? undefined : { y: -4, transition: { duration: 0.18 } }}
      className={`relative flex flex-col gap-2 p-6 rounded-2xl border border-border bg-surface-raised transition-shadow hover:shadow-lg hover:shadow-gold/5 hover:border-gold/20 ${className ?? ""}`}
    >
      {icon && (
        <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-1 text-gold">
          {icon}
        </div>
      )}
      <p className="text-3xl sm:text-4xl font-bold text-gold leading-none tabular-nums">
        <AnimatedCounter to={value} prefix={prefix} suffix={suffix} duration={1200} />
      </p>
      <p className="text-sm font-semibold text-text">{label}</p>
      {description && (
        <p className="text-xs text-text-muted leading-relaxed">{description}</p>
      )}
    </motion.div>
  );
}
