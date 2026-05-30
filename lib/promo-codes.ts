/**
 * Promo code validation — server-side only.
 *
 * Built-in codes are always active. Additional codes can be added via the
 * PROMO_CODES environment variable (JSON string):
 *
 *   PROMO_CODES={"WELCOME10":{"type":"percent","value":10,"label":"10% off"}}
 *
 * Code types:
 *   "percent"  – value is 0–100 (percentage discount off base price)
 *   "fixed"    – value is cents off base price (e.g. 1000 = $10 off)
 *   "absolute" – value is the exact final price in cents regardless of base
 *
 * All codes are matched case-insensitively.
 */

export interface PromoCode {
  type: "percent" | "fixed" | "absolute";
  value: number;
  label: string;
  /**
   * When true, this code is reserved for creator/influencer campaigns and
   * must only be applied to lifetime (one-time) purchases — never to monthly
   * subscriptions. The monthly checkout has no promo UI and no API support
   * for promos, so this flag is primarily for documentation and auditing.
   */
  creatorOnly?: boolean;
}

/** Built-in codes that are always active (no env var required). */
const BUILT_IN_CODES: Record<string, PromoCode> = {
  // Creator / influencer codes — lifetime access only. $20 off the $99 base price = $79.
  KORRA20:    { type: "fixed", value: 2000, label: "$20 off (Korra)",               creatorOnly: true },
  ITACHI20:   { type: "fixed", value: 2000, label: "$20 off (Itachi)",              creatorOnly: true },
  DEEN20:     { type: "fixed", value: 2000, label: "$20 off (Deen Responds)",       creatorOnly: true },
  ORTHODOX20: { type: "fixed", value: 2000, label: "$20 off (The Orthodox Muslim)", creatorOnly: true },
  // Free-access codes are NOT hardcoded here. Configure them via two env vars:
  //   FREE_ACCESS_CODE=YOURCODE          (the promo code string — treated as absolute $0)
  //   FREE_ACCESS_PLAN=complete|family   (the plan to grant; defaults to "complete")
  //
  // Additional discount codes can be added via the PROMO_CODES environment variable:
  //   PROMO_CODES={"AMS49":{"type":"absolute","value":4900,"label":"community discount"}}
};

function loadCodes(): Record<string, PromoCode> {
  const codes: Record<string, PromoCode> = { ...BUILT_IN_CODES };

  // Inject the free-access code from env if configured.
  const freeCode = process.env.FREE_ACCESS_CODE?.trim().toUpperCase();
  if (freeCode) {
    codes[freeCode] = { type: "absolute", value: 0, label: "Free Access" };
  }

  const raw = process.env.PROMO_CODES;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      for (const [k, v] of Object.entries(parsed)) {
        codes[k.toUpperCase()] = v as PromoCode;
      }
    } catch {
      console.error("[PROMO] Failed to parse PROMO_CODES env var");
    }
  }

  return codes;
}

/**
 * Returns the plan to grant for a free-access code, or null if the code is
 * not configured as a free-access code in this environment.
 *
 * This is the authoritative server-side source for which plan a $0 promo
 * code should grant. The client is never trusted to supply a planType.
 *
 * Configure via env vars:
 *   FREE_ACCESS_CODE=YOURCODE        (the code string)
 *   FREE_ACCESS_PLAN=complete|family (defaults to "complete")
 */
export function getFreeAccessPlan(code: string): string | null {
  const freeCode = process.env.FREE_ACCESS_CODE?.trim().toUpperCase();
  if (!freeCode) return null;
  if (code.trim().toUpperCase() !== freeCode) return null;
  const plan = process.env.FREE_ACCESS_PLAN?.trim().toLowerCase();
  return plan === "family" ? "family" : "complete";
}

/** Returns the matching promo code or null if invalid / not found. */
export function validatePromoCode(code: string): PromoCode | null {
  const codes = loadCodes();
  return codes[code.trim().toUpperCase()] ?? null;
}

/**
 * Apply a validated promo to a base price (in cents).
 * Returns the final price in cents (minimum 0).
 */
export function applyDiscount(basePrice: number, promo: PromoCode): number {
  if (promo.type === "absolute") return promo.value;
  if (promo.type === "percent") return Math.round(basePrice * (1 - promo.value / 100));
  return Math.max(0, basePrice - promo.value); // "fixed"
}
