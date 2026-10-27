import { describe, expect, it } from "vitest";
import {
  countryFromHeaderBag,
  quoteForCountryCode,
  quoteFromHeaderBag,
} from "@/lib/request-country-price";

describe("country lifetime pricing", () => {
  it("prices high-income, mid, and access countries", () => {
    expect(quoteForCountryCode("US")).toMatchObject({ tier: "A", amountCents: 4900, label: "$49" });
    expect(quoteForCountryCode("GB")).toMatchObject({ tier: "A", amountCents: 4900 });
    expect(quoteForCountryCode("AE")).toMatchObject({ tier: "A", amountCents: 4900 });
    expect(quoteForCountryCode("ES")).toMatchObject({ tier: "A", amountCents: 4900 });
    expect(quoteForCountryCode("JP")).toMatchObject({ tier: "A", amountCents: 4900 });
    expect(quoteForCountryCode("KR")).toMatchObject({ tier: "A", amountCents: 4900 });
    expect(quoteForCountryCode("MX")).toMatchObject({ tier: "B", amountCents: 2900, label: "$29" });
    expect(quoteForCountryCode("TR")).toMatchObject({ tier: "B", amountCents: 2900 });
    expect(quoteForCountryCode("IN")).toMatchObject({ tier: "C", amountCents: 1500, label: "$15" });
    expect(quoteForCountryCode("EG")).toMatchObject({ tier: "C", amountCents: 1500 });
    expect(quoteForCountryCode("ID")).toMatchObject({ tier: "C", amountCents: 1500 });
    expect(quoteForCountryCode("NG")).toMatchObject({ tier: "D", amountCents: 1000, label: "$10" });
    expect(quoteForCountryCode("PK")).toMatchObject({ tier: "D", amountCents: 1000 });
  });

  it("defaults unknown and unlisted countries to $29", () => {
    expect(quoteForCountryCode(null)).toMatchObject({ tier: "B", amountCents: 2900, country: null });
    // Unlisted country → default Tier B ($29)
    expect(quoteForCountryCode("FJ")).toMatchObject({ tier: "B", amountCents: 2900, country: "FJ" });
  });

  it("reads Vercel or Cloudflare country headers and ignores junk", () => {
    expect(countryFromHeaderBag((n) => (n === "x-vercel-ip-country" ? "ng" : null))).toBe("NG");
    expect(countryFromHeaderBag((n) => (n === "cf-ipcountry" ? "US" : null))).toBe("US");
    expect(countryFromHeaderBag((n) => (n === "x-vercel-ip-country" ? "XX" : null))).toBeNull();
    expect(quoteFromHeaderBag(() => null)).toMatchObject({ amountCents: 2900 });
  });
});
