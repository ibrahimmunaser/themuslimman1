"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

interface AnimatedCounterProps {
  /** Target value */
  to: number;
  /** Optional prefix e.g. "$" */
  prefix?: string;
  /** Optional suffix e.g. "+" or "%" */
  suffix?: string;
  /** Animation duration in ms */
  duration?: number;
  className?: string;
}

/**
 * Counts from 0 to `to` when the element enters the viewport.
 * Instantly shows the final value when reduced motion is preferred.
 */
export function AnimatedCounter({
  to,
  prefix = "",
  suffix = "",
  duration = 1400,
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const prefersReduced = useReducedMotion();
  // Always start at 0 so server and client render the same initial HTML.
  // useReducedMotion() returns null on the server and a boolean on the client,
  // so basing useState on it directly causes a hydration mismatch.
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    // Jump to final value immediately if reduced motion is preferred.
    // This runs only on the client, after hydration, so no mismatch occurs.
    if (prefersReduced) {
      setValue(to);
      return;
    }
    if (!isInView || startedRef.current) return;
    startedRef.current = true;
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * to));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, to, duration, prefersReduced]);

  return (
    <span ref={ref} className={className}>
      {prefix}{value.toLocaleString()}{suffix}
    </span>
  );
}
