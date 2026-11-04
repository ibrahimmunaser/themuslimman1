import { describe, expect, it } from "vitest";
import {
  countryFromHeaderBag,
  quoteForCountryCode,
  quoteFromHeaderBag,
} from "@/lib/request-country-price";

// Country/PPP-tiered lifetime pricing is currently disabled
// (COUNTRY_PRICING_ENABLED = false in lib/country-pricing.ts) — every
// visitor, regardless of country, is quoted flat Tier A ($49).
describe("country lifetime pricing (flat worldwide, tiering disabled)", () => {
  it("prices every country at a flat $49", () => {
    expect(quoteForCountryCode("US")).toMatchObject({ tier: "A", amountCents: 4900, label: "$49" });
    expect(quoteForCountryCode("GB")).toMatchObject({ tier: "A", amountCents: 4900, label: "$49" });
    expect(quoteForCountryCode("AE")).toMatchObject({ tier: "A", amountCents: 4900, label: "$49" });
    expect(quoteForCountryCode("JP")).toMatchObject({ tier: "A", amountCents: 4900, label: "$49" });
    expect(quoteForCountryCode("MX")).toMatchObject({ tier: "A", amountCents: 4900, label: "$49" });
    expect(quoteForCountryCode("TR")).toMatchObject({ tier: "A", amountCents: 4900, label: "$49" });
    expect(quoteForCountryCode("IN")).toMatchObject({ tier: "A", amountCents: 4900, label: "$49" });
    expect(quoteForCountryCode("EG")).toMatchObject({ tier: "A", amountCents: 4900, label: "$49" });
    expect(quoteForCountryCode("NG")).toMatchObject({ tier: "A", amountCents: 4900, label: "$49" });
    expect(quoteForCountryCode("PK")).toMatchObject({ tier: "A", amountCents: 4900, label: "$49" });
  });

  it("defaults unknown and unlisted countries to the same flat $49", () => {
    expect(quoteForCountryCode(null)).toMatchObject({ tier: "A", amountCents: 4900, label: "$49", country: null });
    expect(quoteForCountryCode("FJ")).toMatchObject({ tier: "A", amountCents: 4900, label: "$49", country: "FJ" });
  });

  it("reads Vercel or Cloudflare country headers and ignores junk", () => {
    expect(countryFromHeaderBag((n) => (n === "x-vercel-ip-country" ? "ng" : null))).toBe("NG");
    expect(countryFromHeaderBag((n) => (n === "cf-ipcountry" ? "US" : null))).toBe("US");
    expect(countryFromHeaderBag((n) => (n === "x-vercel-ip-country" ? "XX" : null))).toBeNull();
    expect(quoteFromHeaderBag(() => null)).toMatchObject({ amountCents: 4900, label: "$49" });
  });
});
