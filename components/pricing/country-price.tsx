"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  quoteForCountryCode,
  type CountryPriceQuote,
} from "@/lib/request-country-price";

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

/** Country lifetime price for this request. Defaults to $29 when geo is unknown. */
export function useCountryPrice(): CountryPriceQuote {
  return useContext(CountryPriceContext);
}

/** Renders "$49" / "$29" / "$15" / "$10" for the visitor's country. */
export function LifetimePrice({
  prefix = "",
  suffix = "",
}: {
  prefix?: string;
  suffix?: string;
}) {
  const { label } = useCountryPrice();
  return (
    <>
      {prefix}
      {label}
      {suffix}
    </>
  );
}

/** "Get Lifetime Access — $29" with a localized lead-in. */
export function LifetimeAccessCta({
  leading = "Get Lifetime Access — ",
}: {
  leading?: string;
}) {
  const { label } = useCountryPrice();
  return (
    <>
      {leading}
      {label}
    </>
  );
}
