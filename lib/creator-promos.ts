/**
 * Client-safe creator promo configuration.
 * Import this in both client and server code — it has no server-only deps.
 *
 * Creator promo codes apply ONLY to lifetime access.
 * Monthly subscriptions have no promo code UI and no API support for promos.
 */

export interface CreatorPromoConfig {
  code: string;
  /** Percentage discount (e.g. 20 = 20% off). Applied to both lifetime packages. */
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
  DEEN: {
    code: "DEEN",
    discountPercent: 20,
    displayLabel: "DEEN — 20% off lifetime access",
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
  DEARBORN20: {
    code: "DEARBORN20",
    discountPercent: 20,
    displayLabel: "DEARBORN20 — 20% off lifetime access",
    creator: "dearborn",
    utm_source: "direct",
    utm_medium: "promo",
    utm_campaign: "seerah_launch",
    utm_content: "dearborn",
  },
  ANNARBOR20: {
    code: "ANNARBOR20",
    discountPercent: 20,
    displayLabel: "ANNARBOR20 — 20% off lifetime access",
    creator: "annarbor",
    utm_source: "direct",
    utm_medium: "promo",
    utm_campaign: "seerah_launch",
    utm_content: "annarbor",
  },
};

/** localStorage key used to persist the active creator promo across pages. */
export const CREATOR_PROMO_STORAGE_KEY = "creator_promo";

/**
 * Promos expire after 30 minutes. This prevents codes stored during a previous
 * browser session (e.g. a test visit to ?promo=X) from bleeding into a new
 * user's signup flow on the same device.
 */
const PROMO_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface StoredPromo {
  code: string;
  storedAt: number;
}

/** Returns the config for a creator promo code (case-insensitive), or null if not a creator code. */
export function getCreatorPromoConfig(code: string): CreatorPromoConfig | null {
  return CREATOR_PROMO_CODES[code.trim().toUpperCase()] ?? null;
}

// ── localStorage utilities ────────────────────────────────────────────────────
// All reads/writes go through these helpers so the key is never duplicated
// across files and clearing is guaranteed to be complete.

/** Read the active creator promo code from localStorage. Returns null if none stored, expired, or on server. */
export function getCreatorPromo(): string | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(CREATOR_PROMO_STORAGE_KEY);
  if (!raw) return null;
  try {
    const { code, storedAt } = JSON.parse(raw) as StoredPromo;
    if (Date.now() - storedAt > PROMO_TTL_MS) {
      localStorage.removeItem(CREATOR_PROMO_STORAGE_KEY);
      return null;
    }
    return code;
  } catch {
    // Legacy plain-string entry — treat as expired and remove it
    localStorage.removeItem(CREATOR_PROMO_STORAGE_KEY);
    return null;
  }
}

/** Persist a creator promo code to localStorage with a timestamp for expiry checks. */
export function setCreatorPromo(code: string): void {
  if (typeof window === "undefined") return;
  const entry: StoredPromo = { code, storedAt: Date.now() };
  localStorage.setItem(CREATOR_PROMO_STORAGE_KEY, JSON.stringify(entry));
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
