# Store country pricing (lifetime individual)

Website charges by visitor country via `lib/country-pricing.ts` (Stripe one-time).  
App Store + Play must mirror the same USD targets with **nearest local price**, preferring slightly **under** when exact match is unavailable.

Product ID (both stores): `seerah_lifetime_individual`  
(legacy fallback: `com.themuslimman.seerah.lifetime.individual`)

## Tiers

| Tier | USD target | Rule |
|------|------------|------|
| A | **$99** on the website, Play, and the App Store | High-income / Gulf |
| B | **$29** | Mid-income |
| C | **$15** | Lower-mid |
| D | **$10** | Access |
| Default | **$29** | Unlisted countries |

Languages are **not** priced. One unlock = full course, all languages.

## Country → USD (set these on Play + App Store)

### Tier A — $99
US, CA, GB, IE, AU, NZ, SG, DE, AT, CH, LI, FR, BE, LU, NL, MC, ES, AD, IT, PT, SE, NO, DK, FI, IS, AE, SA, QA, KW, BH, OM, HK, TW, MO, JP, KR, IL, BN

### Tier B — $29
TR, MY, ZA, BR, MX, AR, CL, CO, PE, EC, UY, PA, CR, DO, PR, PL, CZ, SK, HU, RO, BG, HR, SI, GR, CY, MT, EE, LV, LT, JO, LB, TN, BA, AL, MK, XK, KZ, AZ, GE, AM, TH, VN, PH, RU, BY, RS, ME

### Tier C — $15
IN, ID, EG, MA, DZ, LK, NP, KE, TZ, UG, GH, UA, MD, BO, PY, GT, HN, SV, NI, CU, VE

### Tier D — $10
PK, BD, NG, ET, SD, SO, YE, AF, SN, ML, NE, TD, CM, CI, BF, GN, TG, BJ, MZ, ZM, ZW, MW, RW, BI, CD, CG, MG, KH, LA, MM, HT, IR, TJ, IQ, LY, MR, PS, SY

## Console checklist

### Google Play Console
1. Monetize → One-time products → `seerah_lifetime_individual`
2. Tier A countries are **$99**. Tiers B, C, and D stay **$29 / $15 / $10**
3. Use **Country / region prices** (or CSV import) to apply the map above
4. Prefer the nearest Play price point when an exact match is missing
5. Save the purchase option

### App Store Connect
1. Your app → Monetization → In-App Purchases → lifetime individual (non-consumable)
2. Price Schedule → base country is the United States at **$99**
3. Every storefront is set manually: Tier A **$99**, B **$29**, C **$15**, D **$10**, using Apple’s equalized price point
4. Prefer the lower Apple price tier when a country sits between two options
5. Save the price schedule

## Spot-check after save
| Country | Expect |
|---------|--------|
| US | ~$99 |
| UK | ~$99 |
| UAE | ~$99 |
| Turkey | ~$29 |
| India | ~$15 |
| Indonesia | ~$15 |
| Egypt | ~$15 |
| Pakistan | ~$10 |
| Nigeria | ~$10 |
