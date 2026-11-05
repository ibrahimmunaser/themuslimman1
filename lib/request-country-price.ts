import {
  priceUsdCentsForCountry,
  monthlyPriceUsdCentsForCountry,
  tierForCountry,
  type PriceTier,
} from "@/lib/country-pricing";

/**
 * Price quote for a visitor's country — covers BOTH billing options (the
 * one-time lifetime price and the recurring monthly price), since both are
 * derived from the same country → tier lookup. Language never changes the
 * amount — country does.
 */
export type CountryPriceQuote = {
  /** ISO country, or null when geo is missing (flat Standard tier either way). */
  country: string | null;
  tier: PriceTier;
  /** One-time lifetime price, in USD cents. */
  amountCents: number;
  /** Lifetime dollar amount only, e.g. "$49". The word "Only" is added in the visitor's language. */
  label: string;
  /** Recurring monthly price, in USD cents. */
  monthlyAmountCents: number;
  /** Monthly dollar amount only, e.g. "$4.99". */
  monthlyLabel: string;
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
  // Always route through tierForCountry (respects COUNTRY_PRICING_ENABLED)
  // instead of special-casing "no country" to DEFAULT_TIER directly.
  const tier = tierForCountry(country);
  const amountCents = priceUsdCentsForCountry(country);
  const monthlyAmountCents = monthlyPriceUsdCentsForCountry(country);
  return {
    country,
    tier,
    amountCents,
    label: `$${amountCents / 100}`,
    monthlyAmountCents,
    monthlyLabel: `$${(monthlyAmountCents / 100).toFixed(2)}`,
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
