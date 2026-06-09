// Client-safe Stripe configuration
// This can be imported in both client and server components

// ─── Internal plan data (kept for DB compatibility, not exposed publicly) ──────
const _ESSENTIALS_INTERNAL = {
  id: "essentials",
  name: "Essentials Seerah",
  price: 4900, // $49.00 — internal only, not for sale
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

  // ── Trial plans (Stripe Checkout Session: $1 setup fee + monthly + 7-day trial) ──
  individualTrial: {
    id: "individualTrial",
    name: "Individual Trial",
    subtitle: "7 days of full access",
    trialFeeAmount: 100,  // $1.00 setup fee charged at checkout
    price: 900,           // $9.00/month after trial
    trialDays: 7,
    features: [
      "Unlock all 100 Seerah lessons",
      "Watch, read, review, and take quizzes",
      "Cancel anytime",
    ],
  },
  familyTrial: {
    id: "familyTrial",
    name: "Family Trial",
    subtitle: "7 days of family access",
    trialFeeAmount: 100,  // $1.00 setup fee charged at checkout
    price: 1900,          // $19.00/month after trial
    trialDays: 7,
    features: [
      "Access for the household",
      "Structured Seerah learning for the family",
      "Cancel anytime",
    ],
  },

  // ── Monthly subscriptions (legacy direct subscription, no trial) ──
  monthly: {
    id: "monthly",
    name: "Monthly Access",
    subtitle: "Full access while subscribed",
    price: 900, // $9.00/month
    interval: "month" as const,
    features: [
      "All 100 Seerah parts",
      "Video lessons",
      "Audio lessons",
      "Summaries and briefings",
      "Quizzes",
      "Flashcards",
      "Mind maps",
      "Progress tracking",
      "Cancel anytime",
    ],
  },

  // Essentials kept for internal DB/legacy reference but not sold publicly
  essentials: _ESSENTIALS_INTERNAL,

  // ── Lifetime plans ──────────────────────────────────────────────────────────
  complete: {
    id: "complete",
    name: "Complete Seerah",
    subtitle: "Full access to the structured 100-part Seerah journey",
    price: 7900, // $79.00 lifetime access
    features: [
      "All 100 Seerah parts",
      "Video lessons",
      "Audio lessons",
      "Summaries and briefings",
      "Quizzes",
      "Flashcards",
      "Mind maps",
      "Visual learning resources",
      "Progress tracking",
      "Lifetime access to the full course",
    ],
    recommended: true,
    badge: "Best Value",
  },
  family: {
    id: "family",
    name: "Family Access",
    subtitle: "One household account with up to 5 learner profiles",
    price: 14900, // $149.00 lifetime family access
    upgradeFromLifetimePrice: 7000, // $70.00 — Individual Lifetime → Family Lifetime upgrade ($149 - $79)
    stripeProductId: "prod_UbM83Q8KLI4HX0", // env: STRIPE_PRICE_FAMILY_LIFETIME
    features: [
      "One household account",
      "Up to 5 learner profiles",
      "Separate progress for every course asset",
      "All 100 Seerah parts",
      "Video, audio, briefings, slides, infographics",
      "Quizzes, flashcards, and mind maps",
      "Parent progress dashboard",
      "Easy profile switching",
      "Lifetime access to the full course",
    ],
    recommended: false,
    badge: "Best for Families",
    profileLimit: 5,
  },
  familyMonthly: {
    id: "familyMonthly",
    name: "Family Access Monthly",
    subtitle: "One household account with up to 5 learner profiles",
    price: 1900, // $19.00/month
    interval: "month" as const,
    stripeProductId: "prod_UbM4rARx0wZTAI", // env: STRIPE_PRICE_FAMILY_MONTHLY
    features: [
      "One household account",
      "Up to 5 learner profiles",
      "Separate progress for every course asset",
      "All 100 Seerah parts",
      "Video, audio, briefings, slides, infographics",
      "Quizzes, flashcards, and mind maps",
      "Parent progress dashboard",
      "Easy profile switching",
      "Cancel anytime",
    ],
    recommended: false,
    badge: "Best for Families",
    profileLimit: 5,
  },
} as const;

export type PlanId = keyof typeof PLANS;

/** The default lifetime plan sold to individuals. */
export const ACTIVE_PLAN_ID = "complete" as const;

/**
 * Normalize an incoming plan ID so only "complete" is ever sold as individual lifetime.
 * Any unknown, missing, or non-complete ID falls back to "complete".
 */
export function normalizeToActivePlan(_planId: string | null | undefined): "complete" {
  return "complete";
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

export function formatPriceWithCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
