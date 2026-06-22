"use client";

import { useState } from "react";
import { Check } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

export type PlanId =
  | "individual-monthly"
  | "family-monthly"
  | "individual-lifetime"
  | "family-lifetime";

// ── Plan data ──────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id:     "individual-monthly"  as PlanId,
    group:  "Monthly",
    label:  "Individual",
    price:  "$4.99",
    period: "/month",
    detail: "1 person",
    badge:  undefined as string | undefined,
  },
  {
    id:     "family-monthly" as PlanId,
    group:  "Monthly",
    label:  "Family",
    price:  "$9.99",
    period: "/month",
    detail: "Up to 5 members",
    badge:  "Best for families",
  },
  {
    id:     "individual-lifetime" as PlanId,
    group:  "Lifetime",
    label:  "Individual",
    price:  "$49",
    period: "one-time",
    detail: "1 person",
    badge:  undefined as string | undefined,
  },
  {
    id:     "family-lifetime" as PlanId,
    group:  "Lifetime",
    label:  "Family",
    price:  "$99",
    period: "one-time",
    detail: "Up to 5 members",
    badge:  "Best value",
  },
];

const CTA_TEXT: Record<PlanId, string> = {
  "individual-monthly":  "Start Now — $4.99/month",
  "family-monthly":      "Start Now — $9.99/month",
  "individual-lifetime": "Start Now — $49 one-time",
  "family-lifetime":     "Start Now — $99 one-time",
};

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
  /** Called when the user clicks the main CTA. Use for analytics. */
  onCtaClick?: (plan: PlanId, url: string) => void;
  /** Show a "you already have access" message for this plan set. */
  hasAccess?: boolean;
}

export function PlanPicker({
  checkoutBaseUrl = "/checkout",
  defaultPlan = "individual-monthly",
  onCtaClick,
  hasAccess = false,
}: PlanPickerProps) {
  const [selected, setSelected] = useState<PlanId>(defaultPlan);
  const ctaUrl = buildUrl(checkoutBaseUrl, selected);

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
      {/* ── Two groups: Monthly / Lifetime ──────────────────────────────── */}
      <div className="space-y-3">
        {(["Monthly", "Lifetime"] as const).map((group) => (
          <div key={group}>
            <p className="text-xs font-bold text-gold uppercase tracking-widest text-center mb-1.5">
              {group} Plan
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PLANS.filter((p) => p.group === group).map((plan) => {
                const isSelected = selected === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelected(plan.id)}
                    className={[
                      "relative flex flex-col items-start rounded-xl border-2 p-3 text-left transition-all cursor-pointer",
                      isSelected
                        ? "border-gold bg-gold/10"
                        : "border-border bg-surface/40 hover:border-gold/40",
                    ].join(" ")}
                  >
                    {/* Top row: label + checkmark */}
                    <div className="flex items-center justify-between w-full mb-0.5">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${isSelected ? "text-gold" : "text-text-muted"}`}>
                        {plan.label}
                      </span>
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-gold flex items-center justify-center flex-shrink-0">
                          <Check className="w-2.5 h-2.5 text-ink stroke-[3]" />
                        </span>
                      )}
                    </div>

                    <span className="text-xl font-extrabold text-text leading-none">
                      {plan.price}
                      <span className="text-xs font-normal text-text-muted ml-1">{plan.period}</span>
                    </span>

                    <span className="text-[11px] text-text-muted mt-1 leading-tight">
                      {plan.detail}
                    </span>

                    {/* Badge — inline at the bottom */}
                    {plan.badge && (
                      <span className="mt-2 self-start px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-gold text-gold">
                        {plan.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Single CTA ──────────────────────────────────────────────────── */}
      <a
        href={ctaUrl}
        onClick={() => onCtaClick?.(selected, ctaUrl)}
        className="mt-4 block w-full py-4 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-base text-center transition-colors shadow-lg shadow-gold/20"
      >
        {CTA_TEXT[selected]}
      </a>

      <p className="text-xs text-text-muted text-center mt-2">
        Cancel anytime · 7-day refund · Instant access
      </p>
    </div>
  );
}
