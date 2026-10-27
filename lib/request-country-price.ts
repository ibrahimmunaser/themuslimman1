import {
  DEFAULT_TIER,
  priceUsdCentsForCountry,
  tierForCountry,
  type PriceTier,
} from "@/lib/country-pricing";

/** One-time lifetime quote. Language never changes this — country does. */
export type CountryPriceQuote = {
  /** ISO country, or null when geo is missing (then tier B / $29). */
  country: string | null;
  tier: PriceTier;
  amountCents: number;
  /** Display string, e.g. "$49". */
  label: string;
};

const UNKNOWN_CODES = new Set(["XX", "T1", "ZZ"]);

/** Read country from Vercel, Cloudflare, or an explicit dev header. */
export function countryFromHeaderBag(
  get: (name: string) => string | null,
): string | null {
  const raw =
    get("x-vercel-ip-country") ||
    get("cf-ipcountry") ||
    get("x-country-code");
  if (!raw) return null;
  const code = raw.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code) || UNKNOWN_CODES.has(code)) return null;
  return code;
}

export function quoteForCountryCode(code: string | null | undefined): CountryPriceQuote {
  const country = code && /^[A-Z]{2}$/.test(code) ? code : null;
  const tier = country ? tierForCountry(country) : DEFAULT_TIER;
  const amountCents = country ? priceUsdCentsForCountry(country) : priceUsdCentsForCountry(null);
  return {
    country,
    tier,
    amountCents,
    label: `$${amountCents / 100}`,
  };
}

export function quoteFromHeaderBag(
  get: (name: string) => string | null,
): CountryPriceQuote {
  return quoteForCountryCode(countryFromHeaderBag(get));
}

/** Stripe metadata shared by lifetime PaymentIntents. */
export function lifetimePriceMetadata(quote: CountryPriceQuote): Record<string, string> {
  return {
    priceCountry: quote.country ?? "unknown",
    priceTier: quote.tier,
    baseAmount: String(quote.amountCents),
    finalAmount: String(quote.amountCents),
  };
}
