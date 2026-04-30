// Client-safe Stripe configuration
// This can be imported in both client and server components

// Pricing configuration
export const PLANS = {
  essentials: {
    id: "essentials",
    name: "Seerah Starter",
    price: 4900, // $49.00 in cents
    features: [
      "20–30 core Seerah parts",
      "Basic timeline and summaries",
      "Selected videos and visuals",
      "Good for a quick overview",
      "Lifetime access",
    ],
  },
  complete: {
    id: "complete",
    name: "Complete Seerah Academy",
    price: 7900, // $79.00 in cents
    features: [
      "All 100+ Seerah parts in order",
      "Understand every major event with proper context",
      "Videos, audio, slides, summaries, mindmaps, quizzes, and study guides",
      "Qur'an and hadith connections where directly relevant",
      "Built for serious students, families, and teachers",
      "Lifetime access — no subscriptions",
      "Future improvements included during early access",
    ],
    recommended: true,
  },
} as const;

export type PlanId = keyof typeof PLANS;

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}
