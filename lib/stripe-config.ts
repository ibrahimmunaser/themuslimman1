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
    name: "Essentials",
    subtitle: "The Path",
    price: 4900, // $49.00 in cents
    features: [
      "56 core lessons",
      "Video lessons",
      "Quizzes",
      "Progress tracking",
      "Follow the Seerah story clearly from beginning to end",
      "Lifetime access",
    ],
    upgradePrice: 3000, // $30 to upgrade to Complete
  },
  complete: {
    id: "complete",
    name: "Complete Seerah",
    subtitle: "The Mastery System",
    price: 7900, // $79.00 Founding Member Price
    regularPrice: 12900, // $129.00 regular price
    foundingMemberLimit: 500,
    features: [
      "100-part full Seerah program",
      "Video lessons",
      "3 slide formats",
      "3 infographic formats",
      "Briefing + Facts",
      "Mind maps",
      "Easy / Medium / Hard flashcards",
      "Quizzes",
      "Full study system for review and teaching",
      "Lifetime access + all future updates",
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
