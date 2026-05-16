// Client-safe Stripe configuration
// This can be imported in both client and server components

// ─── Internal plan data (kept for DB compatibility, not exposed publicly) ──────
const _ESSENTIALS_INTERNAL = {
  id: "essentials",
  name: "Essentials Seerah",
  price: 4900, // $49.00 — not for sale during early access
  upgradePrice: 3000,
} as const;

// ─── Active public plans ────────────────────────────────────────────────────────
export const PLANS = {
  free: {
    id: "free",
    name: "Free Preview",
    subtitle: "Try Before You Buy",
    price: 0,
    features: [
      "Part 1 video lesson — no signup required",
      "Part 1 briefing and study guide",
      "Preview of the complete Seerah study system",
    ],
  },
  // Essentials kept for internal DB/legacy reference but not sold publicly
  essentials: _ESSENTIALS_INTERNAL,
  complete: {
    id: "complete",
    name: "Complete Seerah Early Access",
    subtitle: "Full access to the structured 100-part Seerah journey",
    price: 9900, // $99.00 early access price (14-day offer)
    regularPrice: 14900, // $149.00 regular price
    features: [
      "All 100 Seerah parts",
      "Video lessons",
      "Summaries and briefings",
      "Quizzes",
      "Flashcards",
      "Mind maps",
      "Visual learning resources",
      "Guided progress tracking",
      "Lifetime access to current course material",
    ],
    recommended: true,
    badge: "Early Access",
  },
} as const;

export type PlanId = keyof typeof PLANS;

/** The only plan sold publicly during early access launch. */
export const ACTIVE_PLAN_ID = "complete" as const;

/**
 * Normalize an incoming plan ID so only "complete" is ever sold.
 * Any unknown, missing, or non-complete ID falls back to "complete".
 */
export function normalizeToActivePlan(planId: string | null | undefined): "complete" {
  return "complete";
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

export function formatPriceWithCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
