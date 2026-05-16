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

function loadCodes(): Record<string, PromoCode> {
  const raw = process.env.PROMO_CODES;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    // Normalise all keys to upper-case
    const normalised: Record<string, PromoCode> = {};
    for (const [k, v] of Object.entries(parsed)) {
      normalised[k.toUpperCase()] = v as PromoCode;
    }
    return normalised;
  } catch {
    console.error("[PROMO] Failed to parse PROMO_CODES env var");
    return {};
  }
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
