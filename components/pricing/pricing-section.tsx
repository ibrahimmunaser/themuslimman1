"use client";

import Link from "next/link";
import { Gift, ArrowRight } from "lucide-react";
import { FadeUp } from "@/components/motion";
import { PlanPicker } from "@/components/landing/plan-picker";
import { planAnalyticsProps } from "@/lib/plan-catalog";

interface PricingSectionProps {
  hasLifetime: boolean;
  hasMonthly: boolean;
  hasFamily: boolean;
  /** Base checkout URL — preserves source/UTM params when provided. */
  checkoutBaseUrl?: string;
  /**
   * "full" = heading + trust block + dual plan picker (legacy homepage layout).
   * "plans-only" = plan picker only (pricing page).
   * "lifetime-only" = homepage single lifetime card (no monthly option).
   */
  variant?: "full" | "plans-only" | "lifetime-only";
}

const TRUST_ITEMS = [
  { icon: "📚", text: "100 structured lessons — every major event in order" },
  { icon: "▶",  text: "Video lessons, readings, quizzes, and flashcards" },
  { icon: "📊", text: "Progress tracking dashboard" },
  { icon: "↩",  text: "Cancel anytime — monthly plans, no questions asked" },
  { icon: "🛡",  text: "7-day refund guarantee — not happy? Full refund." },
];

const LIFETIME_TRUST_ITEMS = [
  { icon: "📚", text: "100 structured lessons — every major event in order" },
  { icon: "▶",  text: "Video lessons, readings, quizzes, and flashcards" },
  { icon: "📊", text: "Progress tracking dashboard" },
  { icon: "∞",  text: "Lifetime access — one payment, yours forever" },
  { icon: "🛡",  text: "7-day refund guarantee — not happy? Full refund." },
];

function buildLifetimeUrl(base: string): string {
  try {
    const u = new URL(base, "https://x.com");
    u.searchParams.set("plan", "individual-lifetime");
    return u.pathname + u.search;
  } catch {
    return "/checkout?plan=individual-lifetime";
  }
}

function LifetimeOnlyCard({ checkoutBaseUrl }: { checkoutBaseUrl: string }) {
  const checkoutUrl = buildLifetimeUrl(checkoutBaseUrl);
  const analytics = planAnalyticsProps("individual-lifetime");

  return (
    <div className="mx-auto w-full max-w-md">
      <a
        href={checkoutUrl}
        data-track="checkout_clicked"
        data-plan="individual-lifetime"
        data-plan-type="individual"
        data-billing="lifetime"
        data-price={analytics.price as number}
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

export function PricingSection({
  hasLifetime,
  hasMonthly,
  hasFamily,
  checkoutBaseUrl = "/checkout",
  variant = "full",
}: PricingSectionProps) {
  const hasAnyAccess = hasLifetime || hasMonthly || hasFamily;
  const plansOnly = variant === "plans-only";
  const lifetimeOnly = variant === "lifetime-only";
  const trustItems = lifetimeOnly ? LIFETIME_TRUST_ITEMS : TRUST_ITEMS;

  return (
    <section
      id="pricing"
      className={plansOnly ? "py-8 sm:py-10" : "py-8 sm:py-10 border-t border-border"}
    >
      <div
        className={
          lifetimeOnly
            ? "max-w-lg md:max-w-xl mx-auto px-4 sm:px-6"
            : "max-w-lg md:max-w-2xl mx-auto px-4 sm:px-6"
        }
      >

        {!plansOnly && (
          <FadeUp className="text-center mb-5">
            <h2 className="text-2xl sm:text-3xl font-bold text-text mb-1">
              {lifetimeOnly ? "Get lifetime access" : "Choose your plan"}
            </h2>
            <p className="text-sm text-text-secondary">
              {lifetimeOnly
                ? "Own the complete 100-part Seerah course forever."
                : "Start monthly or save with lifetime access."}
            </p>
          </FadeUp>
        )}

        {/* Trust / value block — visible immediately, no animation gate */}
        {!plansOnly && !hasAnyAccess && (
          <div className="mb-5 rounded-xl border border-gold/20 bg-gold/[0.04] px-4 py-4 sm:px-5">
            <p className="text-xs font-bold text-gold uppercase tracking-widest text-center mb-3">
              {lifetimeOnly ? "Included with lifetime access" : "Included instantly with every plan"}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              {trustItems.map((item) => (
                <div key={item.text} className="flex items-start gap-2.5">
                  <span className="text-base flex-shrink-0 mt-0.5">{item.icon}</span>
                  <span className="text-xs sm:text-sm text-text-secondary leading-snug">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasAnyAccess ? (
          <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-5 text-center">
            <p className="text-base font-semibold text-green-400 mb-1">✓ You already have access</p>
            <a href="/seerah" className="text-sm text-gold hover:underline">Go to the course →</a>
          </div>
        ) : lifetimeOnly ? (
          <LifetimeOnlyCard checkoutBaseUrl={checkoutBaseUrl} />
        ) : (
          /*
            PlanPicker is NOT wrapped in FadeUp — it is interactive, critical content.
            Wrapping it in a fade-in animation risks leaving it permanently invisible
            if the user scrolls past the section before framer-motion's IntersectionObserver fires.
          */
          <PlanPicker
            checkoutBaseUrl={checkoutBaseUrl}
            hasAccess={hasAnyAccess}
          />
        )}

        {/* Gift option */}
        {!hasAnyAccess && (
          <div className="mt-4 text-center">
            <Link
              href="/gift-checkout"
              className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-gold transition-colors"
            >
              <Gift className="w-3.5 h-3.5" />
              Gift this course to someone
            </Link>
          </div>
        )}

      </div>
    </section>
  );
}
