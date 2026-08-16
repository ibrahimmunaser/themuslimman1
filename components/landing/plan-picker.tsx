"use client";

import { ArrowRight } from "lucide-react";
import { planAnalyticsProps, type PlanId } from "@/lib/plan-catalog";

export type { PlanId };

const PLANS = [
  {
    id:             "individual-monthly" as PlanId,
    label:          "Monthly",
    price:          "$9.99",
    period:         "/month",
    tagline:        "Learn the Prophet's life step by step",
    badge:          undefined as string | undefined,
    badgePlacement: undefined as "top" | "inline" | undefined,
    cta:            "Start for $9.99/month",
    billing:        "monthly" as const,
  },
  {
    id:             "individual-lifetime" as PlanId,
    label:          "Lifetime",
    price:          "$49",
    period:         "one-time",
    tagline:        "Own the complete course for life",
    badge:          "Most Popular",
    badgePlacement: "top" as const,
    cta:            "Get Lifetime Access",
    billing:        "lifetime" as const,
  },
];

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
  recommendedPlan?: PlanId;
  onCtaClick?: (plan: PlanId, url: string) => void;
  hasAccess?: boolean;
}

export function PlanPicker({
  checkoutBaseUrl = "/checkout",
  recommendedPlan = "individual-lifetime",
  onCtaClick,
  hasAccess = false,
}: PlanPickerProps) {
  if (hasAccess) {
    return (
      <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-5 text-center">
        <p className="text-base font-semibold text-green-400 mb-1">✓ You already have access</p>
        <a href="/seerah" className="text-sm text-gold hover:underline">Go to the course →</a>
      </div>
    );
  }

  return (
    <div>
      <div className="pt-3 sm:pt-4">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5">
          {PLANS.map((plan) => {
            const isRecommended = plan.id === recommendedPlan;
            const checkoutUrl = buildUrl(checkoutBaseUrl, plan.id);

            return (
              <a
                key={plan.id}
                href={checkoutUrl}
                data-track="checkout_clicked"
                data-plan={plan.id}
                data-plan-type="individual"
                data-billing={plan.billing}
                data-price={planAnalyticsProps(plan.id).price as number}
                onClick={() => onCtaClick?.(plan.id, checkoutUrl)}
                className={[
                  "group relative flex flex-col items-start rounded-xl border-2 text-left",
                  "min-h-[128px] sm:min-h-[172px] md:min-h-[196px]",
                  "p-3.5 sm:p-5 md:p-6",
                  "transition-all duration-200 cursor-pointer w-full",
                  "active:translate-y-0 active:scale-[0.98]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
                  isRecommended
                    ? "bg-gradient-to-b from-gold/[0.14] to-surface-high border-gold shadow-xl shadow-gold/25 ring-2 ring-gold/20"
                    : "bg-gradient-to-b from-surface-high to-surface-raised border-gold/25 shadow-md shadow-black/40 hover:border-gold/50 hover:from-gold/[0.06] hover:-translate-y-0.5",
                ].join(" ")}
              >
                {plan.badge && plan.badgePlacement === "top" && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg whitespace-nowrap bg-gold text-ink shadow-gold/30">
                    {plan.badge}
                  </span>
                )}

                <span className="text-sm sm:text-base font-bold text-text leading-snug mb-1 sm:mb-1.5">
                  {plan.label}
                </span>

                <span className="text-xl sm:text-2xl md:text-3xl font-extrabold text-text leading-none">
                  {plan.price}
                  <span className="text-xs sm:text-sm font-normal text-text-secondary ml-1">{plan.period}</span>
                </span>

                {plan.tagline && (
                  <span className="text-[11px] sm:text-sm text-gold mt-1.5 sm:mt-2 leading-snug">
                    {plan.tagline}
                  </span>
                )}

                {plan.badge && plan.badgePlacement === "inline" && (
                  <span className="mt-1.5 sm:mt-2 self-start px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-gold/50 bg-gold/5 text-gold/90">
                    {plan.badge}
                  </span>
                )}

                <span
                  className={[
                    "mt-auto pt-3 sm:pt-4 md:pt-5 flex items-center gap-1",
                    "text-xs sm:text-sm font-semibold transition-colors",
                    isRecommended ? "text-gold" : "text-text-muted group-hover:text-gold/75",
                  ].join(" ")}
                >
                  {plan.cta}
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </span>
              </a>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-text-muted text-center mt-3">
        Cancel anytime · 7-day refund guarantee · Instant access
      </p>
    </div>
  );
}
