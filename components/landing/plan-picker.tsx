"use client";

import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { type PlanId } from "@/lib/plan-catalog";
import { PLANS, formatPrice } from "@/lib/stripe-config";
import { useCountryPrice } from "@/components/pricing/country-price";
import { useSiteLang } from "@/components/site-lang";
import { siteT } from "@/lib/site-copy";

export type { PlanId };

function buildUrl(base: string, plan: PlanId): string {
  try {
    const u = new URL(base, "https://x.com");
    u.searchParams.set("plan", plan);
    return u.pathname + u.search;
  } catch {
    return `/checkout?plan=${plan}`;
  }
}

interface PlanPickerProps {
  checkoutBaseUrl?: string;
  /** Which plan gets the "Best Value" / highlighted treatment. Defaults to lifetime. */
  recommendedPlan?: PlanId;
  onCtaClick?: (plan: PlanId, url: string) => void;
  hasAccess?: boolean;
}

/** Public purchase picker — Individual Monthly ($4.99/mo) and Individual
 *  Lifetime (one-time, priced by country) shown side by side. Family and the
 *  free trial are no longer sold (existing purchasers keep their access as-is). */
export function PlanPicker({
  checkoutBaseUrl = "/checkout",
  recommendedPlan = "individual-lifetime",
  onCtaClick,
  hasAccess = false,
}: PlanPickerProps) {
  const lang = useSiteLang();
  const countryPrice = useCountryPrice();

  if (hasAccess) {
    return (
      <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-5 text-center">
        <p className="text-base font-semibold text-green-400 mb-1">✓ {siteT(lang, "alreadyAccess")}</p>
        <a href="/seerah" className="text-sm text-gold hover:underline">{siteT(lang, "goCourse")}</a>
      </div>
    );
  }

  const monthlyId: PlanId  = "individual-monthly";
  const lifetimeId: PlanId = "individual-lifetime";
  const monthlyUrl  = buildUrl(checkoutBaseUrl, monthlyId);
  const lifetimeUrl = buildUrl(checkoutBaseUrl, lifetimeId);

  const plans: {
    id: PlanId;
    url: string;
    billing: "monthly" | "lifetime";
    price: number;
    priceLabel: ReactNode;
    periodLabel: string;
    tagline: string;
    cta: string;
    recommended: boolean;
  }[] = [
    {
      id: monthlyId,
      url: monthlyUrl,
      billing: "monthly",
      price: PLANS.monthly.price,
      priceLabel: <span dir="ltr">{formatPrice(PLANS.monthly.price)}</span>,
      periodLabel: siteT(lang, "perMonthShort"),
      tagline: siteT(lang, "cancelAnytimeShort"),
      cta: siteT(lang, "startMonthly"),
      recommended: recommendedPlan === monthlyId,
    },
    {
      id: lifetimeId,
      url: lifetimeUrl,
      billing: "lifetime",
      price: countryPrice.amountCents,
      priceLabel: <span dir="ltr">{formatPrice(countryPrice.amountCents)}</span>,
      periodLabel: siteT(lang, "oneTime"),
      tagline: siteT(lang, "noSub"),
      cta: siteT(lang, "getLifetime"),
      recommended: recommendedPlan === lifetimeId,
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5">
        {plans.map((plan) => (
          <a
            key={plan.id}
            href={plan.url}
            data-track="checkout_clicked"
            data-plan={plan.id}
            data-plan-type="individual"
            data-billing={plan.billing}
            data-price={plan.price}
            onClick={() => onCtaClick?.(plan.id, plan.url)}
            className={[
              "group relative flex flex-col items-start rounded-xl border-2 text-left",
              "min-h-[128px] sm:min-h-[172px] md:min-h-[196px]",
              "p-3.5 sm:p-5 md:p-6",
              "transition-all duration-200 cursor-pointer w-full",
              "active:translate-y-0 active:scale-[0.98]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
              plan.recommended
                ? "bg-gradient-to-b from-gold/[0.14] to-surface-high border-gold shadow-xl shadow-gold/25 ring-2 ring-gold/20"
                : "bg-gradient-to-b from-surface-high to-surface-raised border-gold/25 shadow-md shadow-black/40 hover:border-gold/50 hover:from-gold/[0.06] hover:-translate-y-0.5",
            ].join(" ")}
          >
            {plan.recommended && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg whitespace-nowrap bg-gold text-ink shadow-gold/30">
                {siteT(lang, "bestValue")}
              </span>
            )}

            <span className="text-sm sm:text-base font-bold text-text leading-snug mb-1 sm:mb-1.5">
              {plan.billing === "monthly" ? siteT(lang, "monthlyPlanLabel") : siteT(lang, "lifetimePlanLabel")}
            </span>

            <span className="text-xl sm:text-2xl md:text-3xl font-extrabold text-text leading-none">
              {plan.priceLabel}
              <span className="text-xs sm:text-sm font-normal text-text-secondary ml-1">{plan.periodLabel}</span>
            </span>

            <span className="text-[11px] sm:text-sm text-gold mt-1.5 sm:mt-2 leading-snug">
              {plan.tagline}
            </span>

            <span
              className={[
                "mt-auto pt-3 sm:pt-4 md:pt-5 flex items-center gap-1",
                "text-xs sm:text-sm font-semibold transition-colors",
                plan.recommended ? "text-gold" : "text-text-muted group-hover:text-gold/75",
              ].join(" ")}
            >
              {plan.cta}
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 rtl:rotate-180" />
            </span>
          </a>
        ))}
      </div>

      <p className="text-xs text-text-muted text-center mt-3">
        {siteT(lang, "refundInstant")}
      </p>
    </div>
  );
}
