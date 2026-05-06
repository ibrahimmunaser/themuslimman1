// Client-safe Stripe configuration
// This can be imported in both client and server components

// Pricing configuration
export const PLANS = {
  free: {
    id: "free",
    name: "Free Preview",
    subtitle: "Try Before You Buy",
    price: 0,
    features: [
      "3–5 preview lessons",
      "Sample video lesson",
      "Sample quiz",
      "Preview of the Complete Seerah study system",
      "No credit card required",
    ],
  },
  essentials: {
    id: "essentials",
    name: "Essentials Seerah",
    subtitle: "Core learning path",
    price: 4900, // $49.00 in cents
    features: [
      "All 100 video lessons",
      "Listen on the Go",
      "Briefings for every part",
      "Progress tracking",
      "Parent progress reports",
      "Lifetime access",
    ],
    upgradePrice: 3000, // $30 to upgrade to Complete
  },
  complete: {
    id: "complete",
    name: "Complete Seerah",
    subtitle: "Full mastery system",
    price: 7900, // $79.00 early access price
    regularPrice: 12900, // $129.00 planned regular price
    features: [
      "Everything in Essentials",
      "All 100 parts with full resources",
      "Slides (3 formats per part)",
      "Infographics (3 formats per part)",
      "Mind maps",
      "Flashcards (Easy / Medium / Hard)",
      "Quizzes",
      "Study guides",
      "Reports and deep dives",
      "Statement of Facts",
      "Teaching and review tools",
      "Advanced parent reports",
      "Lifetime access + all updates",
    ],
    recommended: true,
    badge: "Best Value",
  },
} as const;

export type PlanId = keyof typeof PLANS;

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

export function formatPriceWithCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
