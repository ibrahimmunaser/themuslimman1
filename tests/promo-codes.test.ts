/**
 * AUTOMATED RISK: Promo code discount calculations — never go below $0.
 *
 * Verifies applyDiscount, validatePromoCode, and edge cases.
 */

import { describe, it, expect } from "vitest";
import { applyDiscount, validatePromoCode } from "@/lib/promo-codes";
import type { PromoCode } from "@/lib/promo-codes";

const LIFETIME_INDIVIDUAL = 9900;  // $99.00 in cents
const LIFETIME_FAMILY      = 19900; // $199.00 in cents

describe("applyDiscount — percent type", () => {
  it("applies 20% off correctly", () => {
    const promo: PromoCode = { type: "percent", value: 20, label: "20% off" };
    expect(applyDiscount(LIFETIME_INDIVIDUAL, promo)).toBe(7920); // $79.20
    expect(applyDiscount(LIFETIME_FAMILY, promo)).toBe(15920);    // $159.20
  });

  it("applies 100% off and returns 0 (not negative)", () => {
    const promo: PromoCode = { type: "percent", value: 100, label: "100% off" };
    expect(applyDiscount(9900, promo)).toBe(0);
  });

  it("clamps result to 0 if percent > 100 (defensive)", () => {
    const promo: PromoCode = { type: "percent", value: 150, label: "150% off" };
    expect(applyDiscount(9900, promo)).toBe(0);
  });
});

describe("applyDiscount — fixed type", () => {
  it("subtracts a fixed amount in cents", () => {
    const promo: PromoCode = { type: "fixed", value: 1000, label: "$10 off" };
    expect(applyDiscount(9900, promo)).toBe(8900);
  });

  it("floors at 0 when discount exceeds price", () => {
    const promo: PromoCode = { type: "fixed", value: 99999, label: "huge off" };
    expect(applyDiscount(9900, promo)).toBe(0);
  });
});

describe("applyDiscount — absolute type", () => {
  it("sets exact price regardless of base", () => {
    const promo: PromoCode = { type: "absolute", value: 4900, label: "$49 flat" };
    expect(applyDiscount(LIFETIME_INDIVIDUAL, promo)).toBe(4900);
    expect(applyDiscount(LIFETIME_FAMILY, promo)).toBe(4900);
  });

  it("absolute 0 (free access code) returns 0", () => {
    const promo: PromoCode = { type: "absolute", value: 0, label: "Free" };
    expect(applyDiscount(9900, promo)).toBe(0);
  });

  it("negative absolute value is floored to 0", () => {
    const promo: PromoCode = { type: "absolute", value: -1, label: "invalid" };
    expect(applyDiscount(9900, promo)).toBe(0);
  });
});

describe("validatePromoCode", () => {
  it("returns null for unknown codes", () => {
    expect(validatePromoCode("NOTACODE")).toBeNull();
    expect(validatePromoCode("")).toBeNull();
  });

  it("finds built-in creator codes case-insensitively", () => {
    const upper = validatePromoCode("KORRA20");
    const lower = validatePromoCode("korra20");
    const mixed = validatePromoCode("Korra20");
    expect(upper).not.toBeNull();
    expect(lower).not.toBeNull();
    expect(mixed).not.toBeNull();
    expect(upper?.type).toBe("percent");
    expect(upper?.value).toBe(20);
    expect(upper?.creatorOnly).toBe(true);
  });

  it("DEEN code gives 20% off", () => {
    const promo = validatePromoCode("DEEN");
    expect(promo).not.toBeNull();
    expect(promo!.value).toBe(20);
    expect(promo!.type).toBe("percent");
    // 20% off $99 individual lifetime
    expect(applyDiscount(9900, promo!)).toBe(7920);
  });

  it("all built-in creator codes are creatorOnly", () => {
    const codes = ["KORRA20", "ITACHI20", "DEEN", "ORTHODOX20", "DEARBORN20", "ANNARBOR20"];
    for (const code of codes) {
      const promo = validatePromoCode(code);
      expect(promo?.creatorOnly, `${code} should be creatorOnly`).toBe(true);
    }
  });
});
