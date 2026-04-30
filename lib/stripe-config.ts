// Client-safe Stripe configuration
// This can be imported in both client and server components

// Pricing configuration
export const PLANS = {
  essentials: {
    id: "essentials",
    name: "Seerah Essentials",
    price: 4900, // $49.00 in cents
    features: [
      "20–30 core parts",
      "All asset types per part",
      "The essential Seerah timeline",
      "Video, audio, briefings",
      "Mindmaps and infographics",
      "Lifetime access",
    ],
  },
  complete: {
    id: "complete",
    name: "Complete Seerah System",
    price: 7900, // $79.00 in cents
    features: [
      "All 100+ parts — the complete Seerah",
      "Every asset type per part",
      "Full chronological journey",
      "Video, audio, briefings",
      "Mindmaps, infographics, slides",
      "Study guides and reports",
      "Source materials and deep dives",
      "Lifetime access — no limits",
    ],
    recommended: true,
  },
} as const;

export type PlanId = keyof typeof PLANS;

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}
