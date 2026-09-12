"use client";

import { ArrowRight } from "lucide-react";
import { planAnalyticsProps, type PlanId } from "@/lib/plan-catalog";

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
  /** @deprecated Ignored — public purchase is lifetime-only. */
  recommendedPlan?: PlanId;
  onCtaClick?: (plan: PlanId, url: string) => void;
  hasAccess?: boolean;
}

/** Public purchase picker — lifetime $49 only. Monthly is no longer sold. */
export function PlanPicker({
  checkoutBaseUrl = "/checkout",
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

  const planId: PlanId = "individual-lifetime";
  const checkoutUrl = buildUrl(checkoutBaseUrl, planId);
  const analytics = planAnalyticsProps(planId);

  return (
    <div className="mx-auto w-full max-w-md">
      <a
        href={checkoutUrl}
        data-track="checkout_clicked"
        data-plan={planId}
        data-plan-type="individual"
        data-billing="lifetime"
        data-price={analytics.price as number}
        onClick={() => onCtaClick?.(planId, checkoutUrl)}
        className={[
          "group relative flex flex-col items-center text-center",
          "rounded-2xl border-2 border-gold",
          "bg-gradient-to-b from-gold/[0.14] to-surface-high",
          "shadow-xl shadow-gold/20 ring-1 ring-gold/15",
          "px-6 py-8 sm:px-8 sm:py-10",
          "transition-all duration-200",
          "hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-gold/25",
          "active:translate-y-0 active:scale-[0.99]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
        ].join(" ")}
      >
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold mb-3">
          One-time purchase
        </p>

        <h3 className="text-xl sm:text-2xl font-bold text-text leading-snug mb-4">
          Complete Seerah Course
        </h3>

        <p className="text-4xl sm:text-5xl font-extrabold text-text leading-none tracking-tight">
          $49
          <span className="ml-2 text-base sm:text-lg font-medium text-text-secondary">
            one-time
          </span>
        </p>

        <p className="mt-4 text-sm sm:text-base text-text-secondary leading-relaxed max-w-xs">
          Lifetime access. No subscription. No recurring charges.
        </p>

        <span
          className={[
            "mt-7 inline-flex items-center justify-center gap-2",
            "w-full max-w-xs rounded-xl",
            "bg-gold hover:bg-gold-light text-ink",
            "px-6 py-3.5",
            "text-sm sm:text-base font-bold",
            "shadow-lg shadow-gold/25",
            "transition-colors",
          ].join(" ")}
        >
          Get Lifetime Access
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </a>

      <p className="text-xs text-text-muted text-center mt-4">
        7-day refund guarantee · Instant access
      </p>
    </div>
  );
}
