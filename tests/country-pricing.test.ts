import { describe, expect, it } from "vitest";
import {
  countryFromHeaderBag,
  quoteForCountryCode,
  quoteFromHeaderBag,
} from "@/lib/request-country-price";

// Country-tiered pricing is live (COUNTRY_PRICING_ENABLED = true in
// lib/country-pricing.ts). 3 effective price points, even though 4
// geographic tiers (A-D) are tracked for country classification:
//
//   Country group      Monthly   Lifetime
//   Standard (A + B)    $4.99      $49
//   Tier C               $2.99      $29
//   Tier D               $1.99      $19
describe("country pricing (monthly + lifetime, tiered)", () => {
  it("prices Standard (tier A) countries at $4.99/mo and $49 lifetime", () => {
    expect(quoteForCountryCode("US")).toMatchObject({ tier: "A", amountCents: 4900, label: "$49", monthlyAmountCents: 499, monthlyLabel: "$4.99" });
    expect(quoteForCountryCode("GB")).toMatchObject({ tier: "A", amountCents: 4900, label: "$49", monthlyAmountCents: 499, monthlyLabel: "$4.99" });
    expect(quoteForCountryCode("AE")).toMatchObject({ tier: "A", amountCents: 4900, label: "$49", monthlyAmountCents: 499, monthlyLabel: "$4.99" });
    expect(quoteForCountryCode("JP")).toMatchObject({ tier: "A", amountCents: 4900, label: "$49", monthlyAmountCents: 499, monthlyLabel: "$4.99" });
  });

  it("prices Standard (tier B) countries the same as tier A — merged Standard group", () => {
    expect(quoteForCountryCode("MX")).toMatchObject({ tier: "B", amountCents: 4900, label: "$49", monthlyAmountCents: 499, monthlyLabel: "$4.99" });
    expect(quoteForCountryCode("TR")).toMatchObject({ tier: "B", amountCents: 4900, label: "$49", monthlyAmountCents: 499, monthlyLabel: "$4.99" });
    expect(quoteForCountryCode("BR")).toMatchObject({ tier: "B", amountCents: 4900, label: "$49", monthlyAmountCents: 499, monthlyLabel: "$4.99" });
  });

  it("prices tier C countries at $2.99/mo and $29 lifetime", () => {
    expect(quoteForCountryCode("IN")).toMatchObject({ tier: "C", amountCents: 2900, label: "$29", monthlyAmountCents: 299, monthlyLabel: "$2.99" });
    expect(quoteForCountryCode("EG")).toMatchObject({ tier: "C", amountCents: 2900, label: "$29", monthlyAmountCents: 299, monthlyLabel: "$2.99" });
  });

  it("prices tier D countries at $1.99/mo and $19 lifetime", () => {
    expect(quoteForCountryCode("NG")).toMatchObject({ tier: "D", amountCents: 1900, label: "$19", monthlyAmountCents: 199, monthlyLabel: "$1.99" });
    expect(quoteForCountryCode("PK")).toMatchObject({ tier: "D", amountCents: 1900, label: "$19", monthlyAmountCents: 199, monthlyLabel: "$1.99" });
  });

  it("defaults unknown and unlisted countries to the Standard (B) tier", () => {
    expect(quoteForCountryCode(null)).toMatchObject({ tier: "B", amountCents: 4900, label: "$49", monthlyAmountCents: 499, country: null });
    expect(quoteForCountryCode("FJ")).toMatchObject({ tier: "B", amountCents: 4900, label: "$49", monthlyAmountCents: 499, country: "FJ" });
  });

  it("reads Vercel or Cloudflare country headers and ignores junk", () => {
    expect(countryFromHeaderBag((n) => (n === "x-vercel-ip-country" ? "ng" : null))).toBe("NG");
    expect(countryFromHeaderBag((n) => (n === "cf-ipcountry" ? "US" : null))).toBe("US");
    expect(countryFromHeaderBag((n) => (n === "x-vercel-ip-country" ? "XX" : null))).toBeNull();
    expect(quoteFromHeaderBag(() => null)).toMatchObject({ amountCents: 4900, label: "$49", monthlyAmountCents: 499 });
    expect(quoteFromHeaderBag((n) => (n === "x-vercel-ip-country" ? "NG" : null))).toMatchObject({ tier: "D", amountCents: 1900, monthlyAmountCents: 199 });
  });
});
