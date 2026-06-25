"use client";

import { ArrowRight } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

export type PlanId =
  | "individual-monthly"
  | "family-monthly"
  | "individual-lifetime"
  | "family-lifetime";

const DEFAULT_RECOMMENDED_PLAN: PlanId = "family-monthly";

// ── Plan data ──────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id:     "individual-monthly"  as PlanId,
    group:  "Monthly",
    label:  "Individual Monthly",
    price:  "$4.99",
    period: "/month",
    tagline: "Learn the Prophet's life step by step",
    badge:  undefined as string | undefined,
    cta:    "Start monthly",
  },
  {
    id:     "family-monthly" as PlanId,
    group:  "Monthly",
    label:  "Family Monthly",
    price:  "$9.99",
    period: "/month",
    tagline: "Learn the full story as a family",
    badge:  "Most Popular",
    badgePlacement: "top" as const,
    cta:    "Start with family",
  },
  {
    id:     "individual-lifetime" as PlanId,
    group:  "Lifetime",
    label:  "Individual Lifetime",
    price:  "$49",
    period: "one-time",
    tagline: "Own the complete course for life",
    badge:  undefined as string | undefined,
    cta:    "Get lifetime",
  },
  {
    id:     "family-lifetime" as PlanId,
    group:  "Lifetime",
    label:  "Family Lifetime",
    price:  "$99",
    period: "one-time",
    tagline: "Give your family lifetime access",
    badge:  "Best Value",
    badgePlacement: "inline" as const,
    cta:    "Get family lifetime",
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
  defaultPlan?: PlanId;
  /** Override which plan card is visually highlighted. Defaults to "family-monthly". */
  recommendedPlan?: PlanId;
  /** Called when the user clicks a plan card. Use for analytics. */
  onCtaClick?: (plan: PlanId, url: string) => void;
  /** Show a "you already have access" message for this plan set. */
  hasAccess?: boolean;
}

export function PlanPicker({
  checkoutBaseUrl = "/checkout",
  recommendedPlan = DEFAULT_RECOMMENDED_PLAN,
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
                  const href = buildUrl(checkoutBaseUrl, plan.id);
                  const isRecommended = plan.id === recommendedPlan;

                  return (
                    <a
                      key={plan.id}
                      href={href}
                      onClick={() => onCtaClick?.(plan.id, href)}
                      className={[
                        "group relative flex flex-col items-start rounded-xl border-2 text-left",
                        "min-h-[128px] sm:min-h-[172px] md:min-h-[196px]",
                        "p-3.5 sm:p-5 md:p-6",
                        "transition-all duration-200 cursor-pointer no-underline",
                        "active:translate-y-0 active:scale-[0.98]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
                        isRecommended
                          ? "bg-gradient-to-b from-gold/[0.14] to-surface-high border-gold shadow-xl shadow-gold/25 ring-2 ring-gold/20 hover:from-gold/[0.2] hover:shadow-2xl hover:shadow-gold/35 hover:-translate-y-1"
                          : "bg-gradient-to-b from-surface-high to-surface-raised border-gold/25 shadow-md shadow-black/40 hover:border-gold/50 hover:from-gold/[0.08] hover:-translate-y-0.5",
                      ].join(" ")}
                    >
                      {plan.badge && plan.badgePlacement === "top" && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold text-ink shadow-lg shadow-gold/30 whitespace-nowrap">
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
                          isRecommended
                            ? "text-gold group-hover:text-gold-light"
                            : "text-text-muted group-hover:text-gold/75",
                        ].join(" ")}
                      >
                        {plan.cta}
                        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-text-muted text-center mt-4">
        Cancel anytime · 7-day refund · Instant access
      </p>
    </div>
  );
}
