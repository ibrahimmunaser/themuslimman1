/**
 * Country → one-time lifetime price (PPP).
 *
 * Rules (product):
 * - One purchase unlocks the full course in ALL languages — never sold per language.
 * - Language groups = which markets we care about (skip JP/KR etc. for now).
 * - Price is always by COUNTRY (billing/storefront), never by selected UI language.
 * - If a country could sit between two tiers → use the LOWER tier.
 * - Unlisted / ambiguous → DEFAULT_TIER (B / $29).
 *
 * Amounts are USD cents for Stripe; stores map to nearest local price points.
 */

export type PriceTier = "A" | "B" | "C" | "D";

export const TIER_PRICE_USD_CENTS: Record<PriceTier, number> = {
  A: 4900, // $49
  B: 2900, // $29
  C: 1500, // $15
  D: 1000, // $10
};

/** Safe global default when country is unknown or unlisted. */
export const DEFAULT_TIER: PriceTier = "B";

export const DEFAULT_PRICE_USD_CENTS = TIER_PRICE_USD_CENTS[DEFAULT_TIER];

/** ISO 3166-1 alpha-2 → tier. */
export const COUNTRY_TIER: Record<string, PriceTier> = {
  // ── Tier A — $49 (high-income / Gulf) ─────────────────────────────────────
  US: "A", // English
  CA: "A", // English / French
  GB: "A", // English
  IE: "A", // English
  AU: "A", // English
  NZ: "A", // English
  SG: "A", // English / Chinese / Malay
  DE: "A", // German
  AT: "A", // German
  CH: "A", // German / French
  LI: "A", // German
  FR: "A", // French
  BE: "A", // French / Dutch / German
  LU: "A", // French / German
  NL: "A", // (near DE/FR markets; high income)
  MC: "A", // French
  ES: "A", // Spanish
  AD: "A", // Spanish / Catalan / French
  IT: "A", // (high income EU)
  PT: "A",
  SE: "A",
  NO: "A",
  DK: "A",
  FI: "A",
  IS: "A",
  AE: "A", // Arabic (Gulf)
  SA: "A", // Arabic
  QA: "A", // Arabic
  KW: "A", // Arabic
  BH: "A", // Arabic
  OM: "A", // Arabic
  HK: "A", // Chinese
  TW: "A", // Chinese
  MO: "A", // Chinese
  JP: "A",
  KR: "A",
  IL: "A",
  BN: "A", // Malay (Brunei)

  // ── Tier B — $29 (mid-income) ─────────────────────────────────────────────
  TR: "B", // Turkish
  MY: "B", // Malay / Chinese / English
  ZA: "B", // English
  BR: "B",
  MX: "B", // Spanish
  AR: "B", // Spanish
  CL: "B", // Spanish
  CO: "B", // Spanish
  PE: "B", // Spanish
  EC: "B", // Spanish
  UY: "B", // Spanish
  PA: "B", // Spanish
  CR: "B", // Spanish
  DO: "B", // Spanish
  PR: "B", // Spanish (if billed separately)
  PL: "B",
  CZ: "B",
  SK: "B",
  HU: "B",
  RO: "B",
  BG: "B",
  HR: "B",
  SI: "B",
  GR: "B",
  CY: "B",
  MT: "B",
  EE: "B",
  LV: "B",
  LT: "B",
  JO: "B", // Arabic
  LB: "B", // Arabic
  TN: "B", // Arabic / French
  BA: "B",
  AL: "B",
  MK: "B",
  XK: "B", // Kosovo
  KZ: "B", // Russian / Kazakh
  AZ: "B", // Russian / Azerbaijani
  GE: "B",
  AM: "B",
  TH: "B",
  VN: "B",
  PH: "B", // English widely used
  RU: "B", // Russian
  BY: "B", // Russian
  RS: "B",
  ME: "B",

  // ── Tier C — $15 (lower-mid) ──────────────────────────────────────────────
  IN: "C", // Hindi / English / Urdu / Bengali regions
  ID: "C", // Indonesian
  EG: "C", // Arabic
  MA: "C", // Arabic / French
  DZ: "C", // Arabic / French
  LK: "C",
  NP: "C",
  KE: "C", // Swahili / English
  TZ: "C", // Swahili / English
  UG: "C", // Swahili / English
  GH: "C", // English
  UA: "C", // Russian / Ukrainian
  MD: "C", // Russian / Romanian
  BO: "C", // Spanish
  PY: "C", // Spanish
  GT: "C", // Spanish
  HN: "C", // Spanish
  SV: "C", // Spanish
  NI: "C", // Spanish
  CU: "C", // Spanish
  VE: "C", // Spanish (prefer lower when uncertain)

  // ── Tier D — $10 (access / low income) ────────────────────────────────────
  PK: "D", // Urdu / English
  BD: "D", // Bengali
  NG: "D", // English
  ET: "D",
  SD: "D", // Arabic
  SO: "D", // Arabic / Somali
  YE: "D", // Arabic
  AF: "D", // Persian / Dari / Pashto
  SN: "D", // French
  ML: "D", // French
  NE: "D", // French
  TD: "D", // French / Arabic
  CM: "D", // French / English
  CI: "D", // French
  BF: "D", // French
  GN: "D", // French
  TG: "D", // French
  BJ: "D", // French
  MZ: "D",
  ZM: "D", // English
  ZW: "D", // English
  MW: "D", // English
  RW: "D", // English / French
  BI: "D", // French
  CD: "D", // French
  CG: "D", // French
  MG: "D", // French
  KH: "D",
  LA: "D",
  MM: "D",
  HT: "D", // French / Haitian Creole
  IR: "D", // Persian — payment often blocked; tier if checkout works
  TJ: "D", // Persian-related / Russian
  IQ: "D", // Arabic (prefer lower)
  LY: "D", // Arabic
  MR: "D", // Arabic / French
  PS: "D", // Arabic
  SY: "D", // Arabic
};

/** Human-readable tier labels for admin / docs. */
export const TIER_LABEL: Record<PriceTier, string> = {
  A: "$49 — high-income / Gulf",
  B: "$29 — mid-income",
  C: "$15 — lower-mid",
  D: "$10 — access",
};

/**
 * Language → countries where that language is a major/local language.
 * Used for marketing priority and docs — NOT for checkout price.
 * Checkout always uses {@link tierForCountry}.
 */
export const LANG_PRIORITY_COUNTRIES: Record<
  string,
  { code: string; name: string; tier: PriceTier }[]
> = {
  en: [
    { code: "US", name: "United States", tier: "A" },
    { code: "CA", name: "Canada", tier: "A" },
    { code: "GB", name: "United Kingdom", tier: "A" },
    { code: "IE", name: "Ireland", tier: "A" },
    { code: "AU", name: "Australia", tier: "A" },
    { code: "NZ", name: "New Zealand", tier: "A" },
    { code: "SG", name: "Singapore", tier: "A" },
    { code: "ZA", name: "South Africa", tier: "B" },
    { code: "PH", name: "Philippines", tier: "B" },
    { code: "IN", name: "India", tier: "C" },
    { code: "GH", name: "Ghana", tier: "C" },
    { code: "KE", name: "Kenya", tier: "C" },
    { code: "TZ", name: "Tanzania", tier: "C" },
    { code: "UG", name: "Uganda", tier: "C" },
    { code: "NG", name: "Nigeria", tier: "D" },
    { code: "ZM", name: "Zambia", tier: "D" },
    { code: "ZW", name: "Zimbabwe", tier: "D" },
    { code: "MW", name: "Malawi", tier: "D" },
    { code: "RW", name: "Rwanda", tier: "D" },
  ],
  ar: [
    { code: "AE", name: "United Arab Emirates", tier: "A" },
    { code: "SA", name: "Saudi Arabia", tier: "A" },
    { code: "QA", name: "Qatar", tier: "A" },
    { code: "KW", name: "Kuwait", tier: "A" },
    { code: "BH", name: "Bahrain", tier: "A" },
    { code: "OM", name: "Oman", tier: "A" },
    { code: "JO", name: "Jordan", tier: "B" },
    { code: "LB", name: "Lebanon", tier: "B" },
    { code: "TN", name: "Tunisia", tier: "B" },
    { code: "EG", name: "Egypt", tier: "C" },
    { code: "MA", name: "Morocco", tier: "C" },
    { code: "DZ", name: "Algeria", tier: "C" },
    { code: "SD", name: "Sudan", tier: "D" },
    { code: "YE", name: "Yemen", tier: "D" },
    { code: "SO", name: "Somalia", tier: "D" },
    { code: "IQ", name: "Iraq", tier: "D" },
    { code: "LY", name: "Libya", tier: "D" },
    { code: "MR", name: "Mauritania", tier: "D" },
    { code: "PS", name: "Palestine", tier: "D" },
    { code: "SY", name: "Syria", tier: "D" },
    { code: "TD", name: "Chad", tier: "D" },
  ],
  fr: [
    { code: "FR", name: "France", tier: "A" },
    { code: "BE", name: "Belgium", tier: "A" },
    { code: "LU", name: "Luxembourg", tier: "A" },
    { code: "CH", name: "Switzerland", tier: "A" },
    { code: "CA", name: "Canada", tier: "A" },
    { code: "MC", name: "Monaco", tier: "A" },
    { code: "TN", name: "Tunisia", tier: "B" },
    { code: "MA", name: "Morocco", tier: "C" },
    { code: "DZ", name: "Algeria", tier: "C" },
    { code: "SN", name: "Senegal", tier: "D" },
    { code: "ML", name: "Mali", tier: "D" },
    { code: "NE", name: "Niger", tier: "D" },
    { code: "TD", name: "Chad", tier: "D" },
    { code: "CM", name: "Cameroon", tier: "D" },
    { code: "CI", name: "Côte d'Ivoire", tier: "D" },
    { code: "BF", name: "Burkina Faso", tier: "D" },
    { code: "GN", name: "Guinea", tier: "D" },
    { code: "TG", name: "Togo", tier: "D" },
    { code: "BJ", name: "Benin", tier: "D" },
    { code: "CD", name: "DR Congo", tier: "D" },
    { code: "CG", name: "Congo", tier: "D" },
    { code: "MG", name: "Madagascar", tier: "D" },
    { code: "BI", name: "Burundi", tier: "D" },
    { code: "RW", name: "Rwanda", tier: "D" },
    { code: "HT", name: "Haiti", tier: "D" },
  ],
  es: [
    { code: "ES", name: "Spain", tier: "A" },
    { code: "MX", name: "Mexico", tier: "B" },
    { code: "AR", name: "Argentina", tier: "B" },
    { code: "CL", name: "Chile", tier: "B" },
    { code: "CO", name: "Colombia", tier: "B" },
    { code: "PE", name: "Peru", tier: "B" },
    { code: "EC", name: "Ecuador", tier: "B" },
    { code: "UY", name: "Uruguay", tier: "B" },
    { code: "PA", name: "Panama", tier: "B" },
    { code: "CR", name: "Costa Rica", tier: "B" },
    { code: "DO", name: "Dominican Republic", tier: "B" },
    { code: "BO", name: "Bolivia", tier: "C" },
    { code: "PY", name: "Paraguay", tier: "C" },
    { code: "GT", name: "Guatemala", tier: "C" },
    { code: "HN", name: "Honduras", tier: "C" },
    { code: "SV", name: "El Salvador", tier: "C" },
    { code: "NI", name: "Nicaragua", tier: "C" },
    { code: "CU", name: "Cuba", tier: "C" },
    { code: "VE", name: "Venezuela", tier: "C" },
  ],
  de: [
    { code: "DE", name: "Germany", tier: "A" },
    { code: "AT", name: "Austria", tier: "A" },
    { code: "CH", name: "Switzerland", tier: "A" },
    { code: "LI", name: "Liechtenstein", tier: "A" },
    { code: "LU", name: "Luxembourg", tier: "A" },
    { code: "BE", name: "Belgium", tier: "A" },
  ],
  tr: [{ code: "TR", name: "Turkey", tier: "B" }],
  id: [{ code: "ID", name: "Indonesia", tier: "C" }],
  ms: [
    { code: "MY", name: "Malaysia", tier: "B" },
    { code: "BN", name: "Brunei", tier: "A" },
    { code: "SG", name: "Singapore", tier: "A" },
  ],
  zh: [
    { code: "SG", name: "Singapore", tier: "A" },
    { code: "TW", name: "Taiwan", tier: "A" },
    { code: "HK", name: "Hong Kong", tier: "A" },
    { code: "MO", name: "Macau", tier: "A" },
    { code: "MY", name: "Malaysia", tier: "B" },
  ],
  ru: [
    { code: "RU", name: "Russia", tier: "B" },
    { code: "BY", name: "Belarus", tier: "B" },
    { code: "KZ", name: "Kazakhstan", tier: "B" },
    { code: "AZ", name: "Azerbaijan", tier: "B" },
    { code: "UA", name: "Ukraine", tier: "C" },
    { code: "MD", name: "Moldova", tier: "C" },
    { code: "TJ", name: "Tajikistan", tier: "D" },
  ],
  sw: [
    { code: "KE", name: "Kenya", tier: "C" },
    { code: "TZ", name: "Tanzania", tier: "C" },
    { code: "UG", name: "Uganda", tier: "C" },
  ],
  hi: [{ code: "IN", name: "India", tier: "C" }],
  ur: [
    { code: "PK", name: "Pakistan", tier: "D" },
    { code: "IN", name: "India", tier: "C" },
  ],
  bn: [
    { code: "BD", name: "Bangladesh", tier: "D" },
    { code: "IN", name: "India", tier: "C" },
  ],
  fa: [
    { code: "IR", name: "Iran", tier: "D" },
    { code: "AF", name: "Afghanistan", tier: "D" },
    { code: "TJ", name: "Tajikistan", tier: "D" },
  ],
};

export function normalizeCountryCode(code: string | null | undefined): string | null {
  if (!code) return null;
  const c = code.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(c) ? c : null;
}

export function tierForCountry(countryCode: string | null | undefined): PriceTier {
  const code = normalizeCountryCode(countryCode);
  if (!code) return DEFAULT_TIER;
  return COUNTRY_TIER[code] ?? DEFAULT_TIER;
}

export function priceUsdCentsForCountry(countryCode: string | null | undefined): number {
  return TIER_PRICE_USD_CENTS[tierForCountry(countryCode)];
}

export function formatTierPriceUsd(tier: PriceTier): string {
  return `$${TIER_PRICE_USD_CENTS[tier] / 100}`;
}
