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
}

/** Built-in codes that are always active (no env var required). */
const BUILT_IN_CODES: Record<string, PromoCode> = {
  // Local community discount — always charges $49 regardless of early-access state.
  AMS49: { type: "absolute", value: 4900, label: "local community discount" },
};

function loadCodes(): Record<string, PromoCode> {
  const codes: Record<string, PromoCode> = { ...BUILT_IN_CODES };

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
 * Apply a validated promo to a base price (in cents).
 * Returns the final price in cents (minimum 0).
 */
export function applyDiscount(basePrice: number, promo: PromoCode): number {
  if (promo.type === "absolute") return promo.value;
  if (promo.type === "percent") return Math.round(basePrice * (1 - promo.value / 100));
  return Math.max(0, basePrice - promo.value); // "fixed"
}
