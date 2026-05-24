/**
 * Client-safe creator promo configuration.
 * Import this in both client and server code — it has no server-only deps.
 *
 * Creator promo codes apply ONLY to lifetime access.
 * Monthly subscriptions have no promo code UI and no API support for promos.
 */

export interface CreatorPromoConfig {
  code: string;
  discountPercent: number;
  /** Human-readable label shown in the UI banner. */
  displayLabel: string;
  /** Creator name used for Stripe metadata / analytics. */
  creator: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
}

export const CREATOR_PROMO_CODES: Record<string, CreatorPromoConfig> = {
  KORRA20: {
    code: "KORRA20",
    discountPercent: 20,
    displayLabel: "KORRA20 — 20% off lifetime access",
    creator: "korra",
    utm_source: "tiktok",
    utm_medium: "influencer",
    utm_campaign: "seerah_launch",
    utm_content: "korra",
  },
  ITACHI20: {
    code: "ITACHI20",
    discountPercent: 20,
    displayLabel: "ITACHI20 — 20% off lifetime access",
    creator: "itachi",
    utm_source: "tiktok",
    utm_medium: "influencer",
    utm_campaign: "seerah_launch",
    utm_content: "itachi",
  },
};

/** localStorage key used to persist the active creator promo across pages. */
export const CREATOR_PROMO_STORAGE_KEY = "creator_promo";

/** Returns the config for a creator promo code (case-insensitive), or null if not a creator code. */
export function getCreatorPromoConfig(code: string): CreatorPromoConfig | null {
  return CREATOR_PROMO_CODES[code.trim().toUpperCase()] ?? null;
}
