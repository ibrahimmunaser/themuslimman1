"use client";

import { FadeUp } from "@/components/motion";
import { PlanPicker } from "@/components/landing/plan-picker";
import { useSiteLang } from "@/components/site-lang";
import { siteT } from "@/lib/site-copy";
import { formatPrice } from "@/lib/stripe-config";
import { useCountryPrice } from "@/components/pricing/country-price";

interface PricingSectionProps {
  hasLifetime: boolean;
  hasMonthly: boolean;
  hasFamily: boolean;
  /** Base checkout URL — preserves source/UTM params when provided. */
  checkoutBaseUrl?: string;
  /**
   * Both Individual Monthly ($4.99/mo) and Individual Lifetime (one-time,
   * country-priced) are sold going forward — these values now only affect
   * heading/layout, not which plans are offered.
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
  const countryPrice = useCountryPrice();
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
              <span dir="ltr">{formatPrice(countryPrice.monthlyAmountCents)}</span>
              {siteT(lang, "perMonthShort")} {siteT(lang, "orLifetimeShort")}
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
              <span dir="ltr">{formatPrice(countryPrice.monthlyAmountCents)}</span>
              {siteT(lang, "perMonthShort")} {siteT(lang, "orLifetimeShort")}
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
          <PlanPicker checkoutBaseUrl={checkoutBaseUrl} hasAccess={hasAnyAccess} />
        )}

      </div>
    </Wrapper>
  );
}
