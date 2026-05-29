/**
 * Motion system — variants, easing presets, and helpers used across the site.
 * Import from here so all animation values stay in one place.
 */
import type { Variants, Transition } from "framer-motion";

// ── Easing presets ────────────────────────────────────────────────────────────

export const ease = {
  /** Smooth deceleration — good for entrances */
  out: [0.0, 0.0, 0.2, 1.0] as [number, number, number, number],
  /** Sharp acceleration — good for exits */
  in: [0.4, 0.0, 1.0, 1.0] as [number, number, number, number],
  /** Standard ease-in-out */
  inOut: [0.4, 0.0, 0.2, 1.0] as [number, number, number, number],
  /** Premium spring feel */
  spring: { type: "spring", stiffness: 260, damping: 28 } as Transition,
};

// ── Duration tokens ───────────────────────────────────────────────────────────

export const dur = {
  fast:   0.18,
  normal: 0.32,
  slow:   0.55,
  slower: 0.8,
};

// ── Shared variants ───────────────────────────────────────────────────────────

/** Fade + slide up — primary entrance variant */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0,  transition: { duration: dur.slow,   ease: ease.out } },
};

/** Pure fade — for overlays and subtle content */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: dur.normal, ease: ease.out } },
};

/** Scale up from slightly small — for cards and modals */
export const scaleUp: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show:   { opacity: 1, scale: 1,   transition: { duration: dur.slow,   ease: ease.out } },
};

/** Stagger container — wraps animated children */
export const staggerContainer = (
  staggerChildren = 0.1,
  delayChildren = 0,
): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren, delayChildren },
  },
});

/** Slide in from the left */
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -32 },
  show:   { opacity: 1, x: 0,  transition: { duration: dur.slow, ease: ease.out } },
};

/** Slide in from the right */
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 32 },
  show:   { opacity: 1, x: 0, transition: { duration: dur.slow, ease: ease.out } },
};

// ── Hover effects ─────────────────────────────────────────────────────────────

/** Card hover lift — use as whileHover prop */
export const hoverLift = { y: -4, transition: { duration: dur.fast, ease: ease.out } };

/** Subtle pulse glow — use as whileHover on icon/badge elements */
export const hoverGlow = { scale: 1.05, transition: { duration: dur.fast } };

// ── Progress animation ────────────────────────────────────────────────────────

/** Animate a bar width from 0 to `pct` */
export function progressBarVariants(pct: number): Variants {
  return {
    hidden: { scaleX: 0, originX: 0 },
    show: {
      scaleX: 1,
      originX: 0,
      transition: { duration: dur.slower * 1.2, ease: ease.out, delay: 0.15 },
    },
    // Use style={{ width: `${pct}%` }} on the element and this variant only toggles opacity
    // For width-based bars, see AnimatedProgressBar component
  };
}

// ── Reduced-motion safe wrapper ───────────────────────────────────────────────

/**
 * Returns motion-safe variants: if reduced motion is preferred, all transitions
 * become instant (opacity only). Pass the result of `useReducedMotion()` here.
 */
export function safeVariants(
  variants: Variants,
  prefersReduced: boolean | null,
): Variants {
  if (!prefersReduced) return variants;
  // Strip transforms and durations — just snap opacity
  const safe: Variants = {};
  for (const key of Object.keys(variants)) {
    const v = variants[key];
    if (typeof v === "object" && v !== null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { x: _x, y: _y, scale: _s, scaleX: _sx, transition: _t, ...rest } = v as any;
      safe[key] = { ...rest, transition: { duration: 0 } };
    }
  }
  return safe;
}
