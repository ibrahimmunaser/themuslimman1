import { describe, expect, it } from "vitest";
import {
  countryFromHeaderBag,
  quoteForCountryCode,
  quoteFromHeaderBag,
} from "@/lib/request-country-price";

// Pricing is flat worldwide (COUNTRY_PRICING_ENABLED = true in
// lib/country-pricing.ts, but all 4 geographic tiers A–D now resolve to the
// SAME price — no PPP discount tier anymore):
//
//   All countries (A–D)   $1.99/mo   $19.99 lifetime
describe("country pricing (monthly + lifetime, flat worldwide)", () => {
  it("prices tier A countries at $1.99/mo and $19.99 lifetime", () => {
    expect(quoteForCountryCode("US")).toMatchObject({ tier: "A", amountCents: 1999, label: "$19.99", monthlyAmountCents: 199, monthlyLabel: "$1.99" });
    expect(quoteForCountryCode("GB")).toMatchObject({ tier: "A", amountCents: 1999, label: "$19.99", monthlyAmountCents: 199, monthlyLabel: "$1.99" });
    expect(quoteForCountryCode("AE")).toMatchObject({ tier: "A", amountCents: 1999, label: "$19.99", monthlyAmountCents: 199, monthlyLabel: "$1.99" });
    expect(quoteForCountryCode("JP")).toMatchObject({ tier: "A", amountCents: 1999, label: "$19.99", monthlyAmountCents: 199, monthlyLabel: "$1.99" });
  });

  it("prices tier B countries the same as tier A — flat worldwide", () => {
    expect(quoteForCountryCode("MX")).toMatchObject({ tier: "B", amountCents: 1999, label: "$19.99", monthlyAmountCents: 199, monthlyLabel: "$1.99" });
    expect(quoteForCountryCode("TR")).toMatchObject({ tier: "B", amountCents: 1999, label: "$19.99", monthlyAmountCents: 199, monthlyLabel: "$1.99" });
    expect(quoteForCountryCode("BR")).toMatchObject({ tier: "B", amountCents: 1999, label: "$19.99", monthlyAmountCents: 199, monthlyLabel: "$1.99" });
  });

  it("prices tier C countries the same as tier A — flat worldwide", () => {
    expect(quoteForCountryCode("IN")).toMatchObject({ tier: "C", amountCents: 1999, label: "$19.99", monthlyAmountCents: 199, monthlyLabel: "$1.99" });
    expect(quoteForCountryCode("EG")).toMatchObject({ tier: "C", amountCents: 1999, label: "$19.99", monthlyAmountCents: 199, monthlyLabel: "$1.99" });
  });

  it("prices tier D countries the same as tier A — flat worldwide", () => {
    expect(quoteForCountryCode("NG")).toMatchObject({ tier: "D", amountCents: 1999, label: "$19.99", monthlyAmountCents: 199, monthlyLabel: "$1.99" });
    expect(quoteForCountryCode("PK")).toMatchObject({ tier: "D", amountCents: 1999, label: "$19.99", monthlyAmountCents: 199, monthlyLabel: "$1.99" });
  });

  it("defaults unknown and unlisted countries to the same flat price", () => {
    expect(quoteForCountryCode(null)).toMatchObject({ tier: "B", amountCents: 1999, label: "$19.99", monthlyAmountCents: 199, country: null });
    expect(quoteForCountryCode("FJ")).toMatchObject({ tier: "B", amountCents: 1999, label: "$19.99", monthlyAmountCents: 199, country: "FJ" });
  });

  it("reads Vercel or Cloudflare country headers and ignores junk", () => {
    expect(countryFromHeaderBag((n) => (n === "x-vercel-ip-country" ? "ng" : null))).toBe("NG");
    expect(countryFromHeaderBag((n) => (n === "cf-ipcountry" ? "US" : null))).toBe("US");
    expect(countryFromHeaderBag((n) => (n === "x-vercel-ip-country" ? "XX" : null))).toBeNull();
    expect(quoteFromHeaderBag(() => null)).toMatchObject({ amountCents: 1999, label: "$19.99", monthlyAmountCents: 199 });
    expect(quoteFromHeaderBag((n) => (n === "x-vercel-ip-country" ? "NG" : null))).toMatchObject({ tier: "D", amountCents: 1999, monthlyAmountCents: 199 });
  });
});
