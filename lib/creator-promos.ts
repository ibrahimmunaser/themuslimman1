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
  DEEN20: {
    code: "DEEN20",
    discountPercent: 20,
    displayLabel: "DEEN20 — 20% off lifetime access",
    creator: "deenresponds",
    utm_source: "youtube",
    utm_medium: "influencer",
    utm_campaign: "seerah_launch",
    utm_content: "deenresponds",
  },
  ORTHODOX20: {
    code: "ORTHODOX20",
    discountPercent: 20,
    displayLabel: "ORTHODOX20 — 20% off lifetime access",
    creator: "theorthodoxmuslim",
    utm_source: "youtube",
    utm_medium: "influencer",
    utm_campaign: "seerah_launch",
    utm_content: "theorthodoxmuslim",
  },
};

/** localStorage key used to persist the active creator promo across pages. */
export const CREATOR_PROMO_STORAGE_KEY = "creator_promo";

/** Returns the config for a creator promo code (case-insensitive), or null if not a creator code. */
export function getCreatorPromoConfig(code: string): CreatorPromoConfig | null {
  return CREATOR_PROMO_CODES[code.trim().toUpperCase()] ?? null;
}

// ── localStorage utilities ────────────────────────────────────────────────────
// All reads/writes go through these helpers so the key is never duplicated
// across files and clearing is guaranteed to be complete.

/** Read the active creator promo code from localStorage. Returns null if none stored or on server. */
export function getCreatorPromo(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CREATOR_PROMO_STORAGE_KEY);
}

/** Persist a creator promo code to localStorage. */
export function setCreatorPromo(code: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CREATOR_PROMO_STORAGE_KEY, code);
}

/**
 * Fully remove the creator promo from localStorage.
 * Call this whenever the user explicitly dismisses or removes the promo —
 * e.g. clicking the X in the banner or the Remove button in checkout.
 * After calling this, refreshing or returning to checkout will NOT re-apply the promo.
 */
export function clearCreatorPromo(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CREATOR_PROMO_STORAGE_KEY);
}
