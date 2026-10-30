"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  quoteForCountryCode,
  type CountryPriceQuote,
} from "@/lib/request-country-price";
import { useSiteLang } from "@/components/site-lang";
import { siteT } from "@/lib/site-copy";

const CountryPriceContext = createContext<CountryPriceQuote>(quoteForCountryCode(null));

export function CountryPriceProvider({
  quote,
  children,
}: {
  quote: CountryPriceQuote;
  children: ReactNode;
}) {
  return (
    <CountryPriceContext.Provider value={quote}>
      {children}
    </CountryPriceContext.Provider>
  );
}

/** Website lifetime price for this request. The amount follows the visitor's country. */
export function useCountryPrice(): CountryPriceQuote {
  return useContext(CountryPriceContext);
}

/** "Only $99" in the selected language. The dollar amount stays in label. */
export function useLifetimePricePhrase(): string {
  const { label } = useCountryPrice();
  const lang = useSiteLang();
  return `${siteT(lang, "only")} ${label}`;
}

/**
 * Renders the translated "Only" plus the country amount.
 * On a large price, pass prominent so "Only" sits smaller beside the number.
 */
export function LifetimePrice({
  prefix = "",
  suffix = "",
  prominent = false,
}: {
  prefix?: string;
  suffix?: string;
  prominent?: boolean;
}) {
  const { label } = useCountryPrice();
  const lang = useSiteLang();
  const only = siteT(lang, "only");
  return (
    <>
      {prefix}
      {prominent ? (
        <span className="me-2 align-middle text-[0.38em] font-semibold tracking-wide text-text-secondary">
          {only}
        </span>
      ) : (
        <>{only} </>
      )}
      <span dir="ltr">{label}</span>
      {suffix}
    </>
  );
}

/** "Get Lifetime Access — Only $99" with a localized lead-in and a translated "Only". */
export function LifetimeAccessCta({
  leading = "Get Lifetime Access — ",
}: {
  leading?: string;
}) {
  const phrase = useLifetimePricePhrase();
  return (
    <>
      {leading}
      {phrase}
    </>
  );
}
