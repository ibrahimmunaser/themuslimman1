"use client";

import { ArrowRight } from "lucide-react";
import { FadeUp } from "@/components/motion";
import { useSiteLang } from "@/components/site-lang";
import { siteT } from "@/lib/site-copy";
import { PLANS, formatPrice } from "@/lib/stripe-config";

interface PricingSectionProps {
  hasLifetime: boolean;
  hasMonthly: boolean;
  hasFamily: boolean;
  /** Base checkout URL — preserves source/UTM params when provided. */
  checkoutBaseUrl?: string;
  /**
   * Monthly ($4.99/mo) is the only plan sold going forward, regardless of
   * variant — these values now only affect heading/layout, not which plan
   * is offered. Kept so existing call sites don't need to change their props.
   */
  variant?: "full" | "plans-only" | "lifetime-only" | "comparison";
  /** Skip default intro + trust list when pricing sits after proof sections. */
  compact?: boolean;
  /** Override the "comparison" variant's default heading — used when this section
   *  is merged with the Part 16 continuation callout on the homepage. */
  headingEyebrow?: string;
  headingTitle?: string;
  headingSubtitle?: string;
  /** Skip the outer <section id="pricing"> wrapper — used when the cards are
   *  embedded inside another section (e.g. the homepage final CTA) instead of
   *  standing alone. */
  bare?: boolean;
  /** Skip the comparison variant's own heading — used alongside `bare` when the
   *  surrounding section already has its own title. */
  hideHeading?: boolean;
}

function buildMonthlyUrl(base: string): string {
  try {
    const u = new URL(base, "https://x.com");
    u.searchParams.set("plan", "individual-monthly");
    return u.pathname + u.search;
  } catch {
    return "/checkout?plan=individual-monthly";
  }
}

/** The only plan sold going forward — $4.99/month, cancel anytime. Existing
 *  lifetime/family purchasers keep their access; this is just no longer offered. */
function MonthlyOnlyCard({ checkoutBaseUrl }: { checkoutBaseUrl: string }) {
  const checkoutUrl = buildMonthlyUrl(checkoutBaseUrl);
  const lang = useSiteLang();

  return (
    <div className="mx-auto w-full max-w-md">
      <a
        href={checkoutUrl}
        data-track="checkout_clicked"
        data-plan="individual-monthly"
        data-plan-type="individual"
        data-billing="monthly"
        data-price={PLANS.monthly.price}
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
          {siteT(lang, "mostPopular")}
        </p>

        <h3 className="text-xl sm:text-2xl font-bold text-text leading-snug mb-4">
          {siteT(lang, "courseName")}
        </h3>

        <p className="text-4xl sm:text-5xl font-extrabold text-text leading-none tracking-tight">
          <span dir="ltr">{formatPrice(PLANS.monthly.price)}</span>
          <span className="ms-2 text-base sm:text-lg font-medium text-text-secondary">
            {siteT(lang, "perMonthShort")}
          </span>
        </p>

        <p className="mt-4 text-sm sm:text-base text-text-secondary leading-relaxed max-w-xs">
          {siteT(lang, "cancelAnytimeShort")}
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
          {siteT(lang, "startMonthly")}
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
        </span>
      </a>

      <p className="text-xs text-text-muted text-center mt-4">
        {siteT(lang, "afterSub")}
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
  headingEyebrow,
  headingTitle,
  headingSubtitle,
  bare = false,
  hideHeading = false,
}: PricingSectionProps) {
  const lang = useSiteLang();
  const hasAnyAccess = hasLifetime || hasMonthly || hasFamily;
  const plansOnly = variant === "plans-only";
  const comparison = variant === "comparison";
  const showIntro = !plansOnly && !compact && !comparison;
  const Wrapper = bare ? "div" : "section";

  return (
    <Wrapper
      {...(bare ? {} : { id: "pricing", className: "py-8 sm:py-10 border-t border-border" })}
    >
      <div
        className={
          bare
            ? "mx-auto max-w-3xl"
            : comparison
              ? "max-w-3xl mx-auto px-4 sm:px-6"
              : compact
                ? "max-w-lg md:max-w-xl mx-auto px-4 sm:px-6"
                : "max-w-lg md:max-w-2xl mx-auto px-4 sm:px-6"
        }
      >

        {showIntro && (
          <FadeUp className="text-center mb-5">
            <h2 className="text-2xl sm:text-3xl font-bold text-text mb-1">
              {siteT(lang, "courseName")}
            </h2>
            <p className="text-sm text-text-secondary">
              <span dir="ltr">{formatPrice(PLANS.monthly.price)}</span>
              {siteT(lang, "perMonthShort")} · {siteT(lang, "cancelAnytimeShort")}
            </p>
          </FadeUp>
        )}

        {/* Trust / value block — visible immediately, no animation gate */}
        {showIntro && !hasAnyAccess && (
          <div className="mb-5 rounded-xl border border-gold/20 bg-gold/[0.04] px-4 py-4 sm:px-5">
            <p className="text-xs font-bold text-gold uppercase tracking-widest text-center mb-3">
              {siteT(lang, "recurringBilling")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              {[
                siteT(lang, "stack1b"),
                siteT(lang, "stack2b"),
                siteT(lang, "stack3b"),
                siteT(lang, "planMonthlyInclude1"),
                siteT(lang, "planMonthlyInclude2"),
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
              {siteT(lang, "courseName")}
            </h2>
            <p className="text-sm text-text-secondary max-w-md mx-auto">
              <span dir="ltr">{formatPrice(PLANS.monthly.price)}</span>
              {siteT(lang, "perMonthShort")} · {siteT(lang, "cancelAnytimeShort")}
            </p>
          </div>
        )}

        {comparison && !hasAnyAccess && !hideHeading && (
          <div className="text-center mb-8">
            {headingTitle ? (
              <>
                {headingEyebrow && (
                  <p className="text-xs font-bold uppercase tracking-widest text-gold mb-2">
                    {headingEyebrow}
                  </p>
                )}
                <h2 className="text-2xl sm:text-3xl font-bold text-text mb-2">
                  {headingTitle}
                </h2>
                {headingSubtitle && (
                  <p className="text-sm text-text-secondary max-w-md mx-auto">{headingSubtitle}</p>
                )}
              </>
            ) : (
              <h2 className="text-2xl sm:text-3xl font-bold text-text mb-2">
                {siteT(lang, "courseName")}
              </h2>
            )}
          </div>
        )}

        {hasAnyAccess ? (
          <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-5 text-center">
            <p className="text-base font-semibold text-green-400 mb-1">✓ {siteT(lang, "alreadyAccess")}</p>
            <a href="/seerah" className="text-sm text-gold hover:underline">{siteT(lang, "goCourse")}</a>
          </div>
        ) : (
          <MonthlyOnlyCard checkoutBaseUrl={checkoutBaseUrl} />
        )}

      </div>
    </Wrapper>
  );
}
