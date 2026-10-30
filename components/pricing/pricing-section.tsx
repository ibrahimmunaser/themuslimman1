"use client";

import Link from "next/link";
import { Gift, ArrowRight } from "lucide-react";
import { FadeUp } from "@/components/motion";
import { PlanPicker } from "@/components/landing/plan-picker";
import { LifetimePrice, useCountryPrice, useLifetimePricePhrase } from "@/components/pricing/country-price";
import { useSiteLang } from "@/components/site-lang";
import { siteT } from "@/lib/site-copy";

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
  /** Skip default intro + trust list when pricing sits after proof sections. */
  compact?: boolean;
}

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
  const countryPrice = useCountryPrice();
  const lang = useSiteLang();

  return (
    <div className="mx-auto w-full max-w-md">
      <a
        href={checkoutUrl}
        data-track="checkout_clicked"
        data-plan="individual-lifetime"
        data-plan-type="individual"
        data-billing="lifetime"
        data-price={countryPrice.amountCents}
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
          {siteT(lang, "oneTimePurchase")}
        </p>

        <h3 className="text-xl sm:text-2xl font-bold text-text leading-snug mb-4">
          {siteT(lang, "courseName")}
        </h3>

        <p className="text-4xl sm:text-5xl font-extrabold text-text leading-none tracking-tight">
          <LifetimePrice prominent />
          <span className="ms-2 text-base sm:text-lg font-medium text-text-secondary">
            {siteT(lang, "oneTime")}
          </span>
        </p>

        <p className="mt-4 text-sm sm:text-base text-text-secondary leading-relaxed max-w-xs">
          {siteT(lang, "noSub")}
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
          {siteT(lang, "getLifetime")}
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
        </span>
      </a>

      <p className="text-xs text-text-muted text-center mt-4">
        {siteT(lang, "refundInstant")}
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
  compact = false,
}: PricingSectionProps) {
  const countryPrice = useCountryPrice();
  const pricePhrase = useLifetimePricePhrase();
  const lang = useSiteLang();
  const hasAnyAccess = hasLifetime || hasMonthly || hasFamily;
  const plansOnly = variant === "plans-only";
  const lifetimeOnly = variant === "lifetime-only";
  const showIntro = !plansOnly && !compact;

  return (
    <section
      id="pricing"
      className="py-8 sm:py-10 border-t border-border"
    >
      <div
        className={
          lifetimeOnly || compact
            ? "max-w-lg md:max-w-xl mx-auto px-4 sm:px-6"
            : "max-w-lg md:max-w-2xl mx-auto px-4 sm:px-6"
        }
      >

        {showIntro && (
          <FadeUp className="text-center mb-5">
            <h2 className="text-2xl sm:text-3xl font-bold text-text mb-1">
              {siteT(lang, "getLifetime")}
            </h2>
            <p className="text-sm text-text-secondary">
              {siteT(lang, "onePayment")}
            </p>
          </FadeUp>
        )}

        {/* Trust / value block — visible immediately, no animation gate */}
        {showIntro && !hasAnyAccess && (
          <div className="mb-5 rounded-xl border border-gold/20 bg-gold/[0.04] px-4 py-4 sm:px-5">
            <p className="text-xs font-bold text-gold uppercase tracking-widest text-center mb-3">
              {siteT(lang, "lifetimeAccess")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              {[
                siteT(lang, "stack1b"),
                siteT(lang, "stack2b"),
                siteT(lang, "stack3b"),
                siteT(lang, "stack4b"),
                siteT(lang, "stack5b"),
              ].map((text, index) => (
                <div key={text} className="flex items-start gap-2.5">
                  <span className="text-base flex-shrink-0 mt-0.5">{index + 1}</span>
                  <span className="text-xs sm:text-sm text-text-secondary leading-snug">{text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {compact && !hasAnyAccess && (
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-text mb-2">
              {siteT(lang, "lifetimeHeading")} {pricePhrase}
            </h2>
            <p className="text-sm text-text-secondary max-w-md mx-auto">
              {siteT(lang, "onePayment")}
            </p>
          </div>
        )}

        {hasAnyAccess ? (
          <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-5 text-center">
            <p className="text-base font-semibold text-green-400 mb-1">✓ {siteT(lang, "alreadyAccess")}</p>
            <a href="/seerah" className="text-sm text-gold hover:underline">{siteT(lang, "goCourse")}</a>
          </div>
        ) : lifetimeOnly || compact ? (
          <LifetimeOnlyCard checkoutBaseUrl={checkoutBaseUrl} />
        ) : (
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
              {siteT(lang, "giftCourse")}
            </Link>
          </div>
        )}

      </div>
    </section>
  );
}
