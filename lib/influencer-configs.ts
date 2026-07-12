/**
 * Canonical configuration for every influencer quick-checkout page.
 *
 * Each entry maps a URL slug to the configuration rendered by InfluencerQuickCheckout.
 * The quick-checkout flow is enabled globally via NEXT_PUBLIC_INFLUENCER_QUICK_CHECKOUT=true
 * or per-creator via quickCheckoutEnabled: true.
 */

export interface InfluencerConfig {
  /** URL slug, e.g. "theorthodoxmuslim" */
  slug: string;
  /** Display name shown in the badge and success copy */
  displayName: string;
  /** Full badge text, e.g. "Recommended by The Orthodox Muslim" */
  badgeText: string;
  /** Optional circular avatar URL */
  avatarUrl?: string;
  /** H1 headline on the offer screen */
  headline: string;
  /** Supporting paragraph below the headline (defaults to a shared copy) */
  supportingCopy?: string;
  /** Optional testimonial quote attributed to the influencer */
  testimonial?: { quote: string; attribution: string };
  /** Optional hero image path shown on the offer screen */
  landingImageUrl?: string;
  /** UTM tracking values */
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  /**
   * Enable the quick-checkout flow for this creator independently of the
   * global flag.  If omitted, falls back to isQuickCheckoutEnabled().
   */
  quickCheckoutEnabled?: boolean;
}

export const INFLUENCER_CONFIGS: Record<string, InfluencerConfig> = {
  theorthodoxmuslim: {
    slug:        "theorthodoxmuslim",
    displayName: "The Orthodox Muslim",
    badgeText:   "Recommended by The Orthodox Muslim",
    avatarUrl:   "/images/libyano.png",
    headline:    "Learn the life of the Prophet (PBUH) in order.",
    utmSource:   "youtube",
    utmMedium:   "influencer",
    utmCampaign: "seerah_launch",
    utmContent:  "theorthodoxmuslim",
  },
  korra: {
    slug:        "korra",
    displayName: "Korra",
    badgeText:   "Recommended by Korra",
    headline:    "Learn the life of the Prophet (PBUH) in order.",
    utmSource:   "tiktok",
    utmMedium:   "influencer",
    utmCampaign: "seerah_launch",
    utmContent:  "korra",
  },
  itachi: {
    slug:        "itachi",
    displayName: "Itachi",
    badgeText:   "Recommended by Itachi",
    headline:    "Learn the life of the Prophet (PBUH) in order.",
    utmSource:   "tiktok",
    utmMedium:   "influencer",
    utmCampaign: "seerah_launch",
    utmContent:  "itachi",
  },
  deenresponds: {
    slug:        "deenresponds",
    displayName: "Deen Responds",
    badgeText:   "Recommended by Deen Responds",
    avatarUrl:   "/images/deenresponds.png",
    headline:    "Learn the life of the Prophet (PBUH) in order.",
    utmSource:   "youtube",
    utmMedium:   "influencer",
    utmCampaign: "seerah_launch",
    utmContent:  "deenresponds",
  },
  browniesaadi: {
    slug:        "browniesaadi",
    displayName: "Brownie Saadi",
    badgeText:   "Recommended by Brownie Saadi",
    headline:    "Learn the life of the Prophet (PBUH) in order.",
    utmSource:   "youtube",
    utmMedium:   "influencer",
    utmCampaign: "seerah_launch",
    utmContent:  "browniesaadi",
  },
};

export function getInfluencerConfig(slug: string): InfluencerConfig | null {
  return INFLUENCER_CONFIGS[slug] ?? null;
}

/**
 * Whether the quick-checkout flow is active globally.
 * Set NEXT_PUBLIC_INFLUENCER_QUICK_CHECKOUT=true in .env.local to enable.
 */
export function isQuickCheckoutEnabled(config?: InfluencerConfig): boolean {
  if (config?.quickCheckoutEnabled === true) return true;
  if (config?.quickCheckoutEnabled === false) return false;
  return process.env.NEXT_PUBLIC_INFLUENCER_QUICK_CHECKOUT === "true";
}

/** Build the checkout URL for an influencer (falls back to /checkout if quick checkout disabled). */
export function influencerCheckoutUrl(slug: string, plan = "individual-monthly"): string {
  const src = `source=${slug}`;
  const cfg = INFLUENCER_CONFIGS[slug];
  if (!cfg) return `/checkout?plan=${plan}&${src}`;
  const utm = `utm_source=${cfg.utmSource}&utm_medium=${cfg.utmMedium}&utm_campaign=${cfg.utmCampaign}&utm_content=${cfg.utmContent}`;
  return `/checkout?plan=${plan}&${src}&${utm}`;
}
