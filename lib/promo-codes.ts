/**
 * Promo code validation — server-side only.
 *
 * Codes are loaded from the PROMO_CODES environment variable (JSON string).
 * Example env value:
 *   PROMO_CODES={"WELCOME20":{"type":"percent","value":20,"label":"20% off"},"FRIEND10":{"type":"percent","value":10,"label":"10% off"}}
 *
 * type "percent": value is 0–100 (percentage discount)
 * type "fixed":   value is in cents (e.g. 1000 = $10 off)
 *
 * Codes are matched case-insensitively.
 */

export interface PromoCode {
  type: "percent" | "fixed";
  value: number;
  label: string;
}

/** Built-in codes that are always active (no env var required). */
const BUILT_IN_CODES: Record<string, PromoCode> = {
  // Local community discount — $50 off the $99 early access price → $49
  AMS49: { type: "fixed", value: 5000, label: "local community discount" },
};

function loadCodes(): Record<string, PromoCode> {
  // Start with built-in codes
  const codes: Record<string, PromoCode> = { ...BUILT_IN_CODES };

  // Merge in any extra codes from PROMO_CODES env var (can override built-ins)
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

/** Returns the matching promo code or null if invalid / not found. */
export function validatePromoCode(code: string): PromoCode | null {
  const codes = loadCodes();
  return codes[code.trim().toUpperCase()] ?? null;
}

/**
 * Apply a validated promo code to a base price (in cents).
 * Returns the final price in cents (minimum 0).
 */
export function applyDiscount(basePrice: number, promo: PromoCode): number {
  if (promo.type === "percent") {
    return Math.round(basePrice * (1 - promo.value / 100));
  }
  return Math.max(0, basePrice - promo.value);
}
