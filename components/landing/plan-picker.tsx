"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { planAnalyticsProps, type PlanId } from "@/lib/plan-catalog";

// ── Types ──────────────────────────────────────────────────────────────────────

export type { PlanId };

// ── Plan data ──────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id:             "individual-monthly" as PlanId,
    group:          "Monthly",
    label:          "Individual Monthly",
    price:          "$4.99",
    period:         "/month",
    periodDisplay:  "$4.99/month",
    tagline:        "Learn the Prophet's life step by step",
    badge:          "Best Starter",
    badgePlacement: "top" as const,
    cta:            "Start for $4.99/month",
  },
  {
    id:             "family-monthly" as PlanId,
    group:          "Monthly",
    label:          "Family Monthly",
    price:          "$9.99",
    period:         "/month",
    periodDisplay:  "$9.99/month",
    tagline:        "Learn the full story as a family",
    badge:          "Best for Families",
    badgePlacement: "inline" as const,
    cta:            "Start Family Plan",
  },
  {
    id:             "individual-lifetime" as PlanId,
    group:          "Lifetime",
    label:          "Individual Lifetime",
    price:          "$49",
    period:         "one-time",
    periodDisplay:  "$49 one-time",
    tagline:        "Own the complete course for life",
    badge:          undefined,
    badgePlacement: undefined,
    cta:            "Get Lifetime Access",
  },
  {
    id:             "family-lifetime" as PlanId,
    group:          "Lifetime",
    label:          "Family Lifetime",
    price:          "$99",
    period:         "one-time",
    periodDisplay:  "$99 one-time",
    tagline:        "Give your family lifetime access",
    badge:          "Best Value",
    badgePlacement: "inline" as const,
    cta:            "Get Family Lifetime",
  },
];

// ── URL helper ─────────────────────────────────────────────────────────────────

function buildUrl(base: string, plan: PlanId): string {
  try {
    const u = new URL(base, "https://x.com");
    u.searchParams.set("plan", plan);
    return u.pathname + u.search;
  } catch {
    return `/checkout?plan=${plan}`;
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

interface PlanPickerProps {
  /** Base checkout URL — all existing params (source, UTMs) are preserved. */
  checkoutBaseUrl?: string;
  /** Override which plan is shown as recommended / highlighted. Defaults to "individual-monthly". */
  recommendedPlan?: PlanId;
  /** Called when the user clicks "Continue to Checkout". */
  onCtaClick?: (plan: PlanId, url: string) => void;
  /** Show a "you already have access" message for this plan set. */
  hasAccess?: boolean;
}

export function PlanPicker({
  checkoutBaseUrl = "/checkout",
  recommendedPlan = "individual-monthly",
  onCtaClick,
  hasAccess = false,
}: PlanPickerProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(recommendedPlan);

  if (hasAccess) {
    return (
      <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-5 text-center">
        <p className="text-base font-semibold text-green-400 mb-1">✓ You already have access</p>
        <a href="/seerah" className="text-sm text-gold hover:underline">Go to the course →</a>
      </div>
    );
  }

  const selectedPlanData = PLANS.find((p) => p.id === selectedPlan)!;
  const checkoutUrl = buildUrl(checkoutBaseUrl, selectedPlan);

  return (
    <div>
      <div className="space-y-4 sm:space-y-6">
        {(["Monthly", "Lifetime"] as const).map((group) => {
          const groupPlans = PLANS.filter((p) => p.group === group);
          const hasTopBadge = groupPlans.some((p) => p.badgePlacement === "top");

          return (
            <div key={group}>
              <p className="text-xs font-bold text-gold uppercase tracking-widest text-center mb-2 sm:mb-3">
                {group} Plan
              </p>
              <div className={["grid grid-cols-2 gap-3 sm:gap-4 md:gap-5", hasTopBadge ? "pt-3 sm:pt-4" : ""].join(" ")}>
                {groupPlans.map((plan) => {
                  const isRecommended = plan.id === recommendedPlan;
                  const isSelected = plan.id === selectedPlan;

                  return (
                    <button
                      key={plan.id}
                      type="button"
                      data-track="plan_selected"
                      data-plan={plan.id}
                      data-plan-type={plan.id.startsWith("family") ? "family" : "individual"}
                      data-billing={plan.group === "Monthly" ? "monthly" : "lifetime"}
                      data-price={planAnalyticsProps(plan.id).price as number}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={[
                        "group relative flex flex-col items-start rounded-xl border-2 text-left",
                        "min-h-[128px] sm:min-h-[172px] md:min-h-[196px]",
                        "p-3.5 sm:p-5 md:p-6",
                        "transition-all duration-200 cursor-pointer w-full",
                        "active:translate-y-0 active:scale-[0.98]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
                        isSelected
                          ? "bg-gradient-to-b from-gold/[0.14] to-surface-high border-gold shadow-xl shadow-gold/25 ring-2 ring-gold/20"
                          : isRecommended
                            ? "bg-gradient-to-b from-gold/[0.08] to-surface-high border-gold/40 shadow-md hover:border-gold/70 hover:from-gold/[0.12]"
                            : "bg-gradient-to-b from-surface-high to-surface-raised border-gold/25 shadow-md shadow-black/40 hover:border-gold/50 hover:from-gold/[0.06] hover:-translate-y-0.5",
                      ].join(" ")}
                    >
                      {/* Top badge (Best Starter) */}
                      {plan.badge && plan.badgePlacement === "top" && (
                        <span className={[
                          "absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg whitespace-nowrap",
                          isSelected ? "bg-gold text-ink shadow-gold/30" : "bg-gold/80 text-ink shadow-gold/20",
                        ].join(" ")}>
                          {plan.badge}
                        </span>
                      )}

                      {/* Selected checkmark */}
                      {isSelected && (
                        <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-gold flex items-center justify-center">
                          <Check className="w-3 h-3 text-ink" strokeWidth={3} />
                        </span>
                      )}

                      <span className="text-sm sm:text-base font-bold text-text leading-snug mb-1 sm:mb-1.5 pr-6">
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

                      {/* Inline badge (Best for Families, Best Value) */}
                      {plan.badge && plan.badgePlacement === "inline" && (
                        <span className="mt-1.5 sm:mt-2 self-start px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-gold/50 bg-gold/5 text-gold/90">
                          {plan.badge}
                        </span>
                      )}

                      <span
                        className={[
                          "mt-auto pt-3 sm:pt-4 md:pt-5 flex items-center gap-1",
                          "text-xs sm:text-sm font-semibold transition-colors",
                          isSelected
                            ? "text-gold"
                            : "text-text-muted group-hover:text-gold/75",
                        ].join(" ")}
                      >
                        {plan.cta}
                        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Selected-plan checkout bar ──────────────────────────────────────── */}
      <div className="mt-5 sm:mt-6 rounded-xl bg-surface-raised border border-gold/30 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] text-text-muted uppercase tracking-wider font-medium mb-0.5">Selected plan</p>
          <p className="text-sm sm:text-base font-bold text-text truncate">
            {selectedPlanData.label}
            <span className="font-normal text-text-secondary ml-1.5">— {selectedPlanData.periodDisplay}</span>
          </p>
        </div>
        <a
          href={checkoutUrl}
          data-track="checkout_clicked"
          data-plan={selectedPlan}
          data-plan-type={selectedPlan.startsWith("family") ? "family" : "individual"}
          data-billing={selectedPlan.includes("monthly") ? "monthly" : "lifetime"}
          data-price={planAnalyticsProps(selectedPlan).price as number}
          onClick={() => onCtaClick?.(selectedPlan, checkoutUrl)}
          className="flex-shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gold hover:bg-gold-light text-ink font-bold text-sm sm:text-base transition-colors shadow-lg shadow-gold/25 hover:shadow-gold/40"
        >
          Continue to Checkout
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>

      <p className="text-xs text-text-muted text-center mt-3">
        Cancel anytime · 7-day refund guarantee · Instant access
      </p>
    </div>
  );
}
