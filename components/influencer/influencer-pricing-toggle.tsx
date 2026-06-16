"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Calendar, Infinity, ShieldCheck, Lock, Zap } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface InfluencerPricingToggleProps {
  /** e.g. "Deen Responds" — used in CTAs */
  displayName: string;

  // Monthly checkout URLs (include source + utm params)
  individualMonthlyUrl: string;
  familyMonthlyUrl: string;

  // Lifetime checkout URLs (with promo code already embedded)
  individualLifetimeUrl: string;
  familyLifetimeUrl: string;

  // Lifetime prices in cents
  individualLifetimePriceCents: number;
  familyLifetimePriceCents: number;

  // Optional regular (pre-discount) prices — only shown when higher than actual price
  regularIndividualPriceCents?: number;
  regularFamilyPriceCents?: number;
}

type Tab = "monthly" | "lifetime";

function fmtPrice(cents: number) {
  const dollars = cents / 100;
  return dollars % 1 === 0 ? `$${dollars.toFixed(0)}` : `$${dollars.toFixed(2)}`;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function InfluencerPricingToggle({
  displayName,
  individualMonthlyUrl,
  familyMonthlyUrl,
  individualLifetimeUrl,
  familyLifetimeUrl,
  individualLifetimePriceCents,
  familyLifetimePriceCents,
  regularIndividualPriceCents,
  regularFamilyPriceCents,
}: InfluencerPricingToggleProps) {
  const [tab, setTab] = useState<Tab>("monthly");


  const indLifetime    = fmtPrice(individualLifetimePriceCents);
  const famLifetime    = fmtPrice(familyLifetimePriceCents);
  const regInd         = regularIndividualPriceCents ? fmtPrice(regularIndividualPriceCents) : null;
  const regFam         = regularFamilyPriceCents     ? fmtPrice(regularFamilyPriceCents)     : null;
  const showIndStrike  = !!(regularIndividualPriceCents && regularIndividualPriceCents > individualLifetimePriceCents);
  const showFamStrike  = !!(regularFamilyPriceCents     && regularFamilyPriceCents     > familyLifetimePriceCents);

  return (
    <section id="pricing" className="pb-12 scroll-mt-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">

        {/* ── Toggle ──────────────────────────────────────────────── */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center p-1 rounded-xl bg-surface border border-border gap-1">
            <button
              onClick={() => setTab("monthly")}
              className={`relative px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === "monthly"
                  ? "bg-gold text-ink shadow-sm"
                  : "text-text-muted hover:text-text"
              }`}
            >
              Monthly
              {tab === "monthly" && (
                <span className="absolute -top-2.5 -right-2.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-green-500 text-white leading-none">
                  Popular
                </span>
              )}
            </button>
            <button
              onClick={() => setTab("lifetime")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === "lifetime"
                  ? "bg-gold text-ink shadow-sm"
                  : "text-text-muted hover:text-text"
              }`}
            >
              Lifetime
            </button>
          </div>
        </div>

        {/* ── Monthly cards ───────────────────────────────────────── */}
        {tab === "monthly" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">

              {/* Individual Monthly — primary */}
              <div className="relative rounded-2xl border-2 border-gold/60 bg-surface shadow-lg shadow-gold/10 p-6 flex flex-col">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold text-ink shadow-sm">
                    Most Popular
                  </span>
                </div>
                <p className="text-xl font-bold text-text mb-0.5">For Me</p>
                <p className="text-xs text-text-muted mb-4">Individual Monthly Membership</p>
                <div className="mb-5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-5xl font-bold text-gold">$4.99</span>
                    <span className="text-sm text-text-muted">/month</span>
                  </div>
                  <p className="text-xs text-gold/60 mt-1">cancel anytime</p>
                </div>
                <ul className="space-y-2 mb-7 flex-1">
                  {[
                    "Start today. Continue at your own pace.",
                    "Videos, quizzes, flashcards, mind maps",
                    "Progress dashboard · Mobile friendly",
                    "Cancel anytime — no commitment",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-text-secondary">
                      <CheckCircle2 className="w-3.5 h-3.5 text-gold flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={individualMonthlyUrl}
                  data-track="individual_monthly_cta_clicked"
                  data-plan="individual-monthly"
                  className="block w-full py-4 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-base text-center transition-colors shadow-lg shadow-gold/25"
                >
                  Start Learning
                  <span className="ml-1">→</span>
                </Link>
                <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-text-muted">
                  <Calendar className="w-3.5 h-3.5" />
                  Cancel anytime
                </div>
              </div>

              {/* Family Monthly — secondary */}
              <div className="relative rounded-2xl border border-border bg-surface/50 p-5 flex flex-col">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-surface border border-border text-text-muted">
                    For Households
                  </span>
                </div>
                <p className="text-base font-bold text-text mb-0.5">For My Family</p>
                <p className="text-xs text-text-muted mb-4">Family Monthly · up to 5 profiles</p>
                <div className="mb-4">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold text-gold">$9.99</span>
                    <span className="text-sm text-text-muted">/month</span>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">cancel anytime</p>
                </div>
                <ul className="space-y-1.5 mb-5 flex-1">
                  {[
                    "Everything in Individual",
                    "5 separate learner profiles",
                    "One payment for the whole household",
                    "Cancel anytime",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-text-secondary">
                      <CheckCircle2 className="w-3.5 h-3.5 text-gold/60 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={familyMonthlyUrl}
                  data-track="family_monthly_cta_clicked"
                  data-plan="family-monthly"
                  className="block w-full py-3 rounded-xl border border-gold/30 text-gold font-semibold text-sm text-center hover:bg-gold/5 transition-colors"
                >
                  Start Family Membership
                </Link>
                <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-text-muted">
                  <Calendar className="w-3.5 h-3.5" />
                  Cancel anytime
                </div>
              </div>

            </div>

            {/* Cross-tab footnote */}
            <p className="text-center text-xs text-text-muted/50 mt-4">
              Prefer to pay once?{" "}
              <button
                onClick={() => setTab("lifetime")}
                className="underline underline-offset-2 hover:text-text-muted transition-colors"
              >
                {displayName} lifetime deal — {indLifetime} →
              </button>
            </p>
          </>
        )}

        {/* ── Lifetime cards ──────────────────────────────────────── */}
        {tab === "lifetime" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">

              {/* Individual Lifetime — primary */}
              <div className="relative rounded-2xl border-2 border-gold/60 bg-surface shadow-lg shadow-gold/10 p-6 flex flex-col">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold text-ink shadow-sm">
                    Best Value
                  </span>
                </div>
                <p className="text-xl font-bold text-text mb-0.5">For Me</p>
                <p className="text-xs text-text-muted mb-4">Individual Lifetime Access</p>
                <div className="mb-5">
                  {showIndStrike && <span className="text-xs text-text-muted line-through mr-2">{regInd}</span>}
                  <span className="text-5xl font-bold text-gold">{indLifetime}</span>
                  <p className="text-xs text-gold/60 mt-1">one-time · no renewal ever</p>
                </div>
                <ul className="space-y-2 mb-7 flex-1">
                  {[
                    "Pay once — yours forever",
                    "Full access, start anytime",
                    "Videos, quizzes, flashcards, mind maps",
                    "Progress dashboard · Mobile friendly",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-text-secondary">
                      <CheckCircle2 className="w-3.5 h-3.5 text-gold flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={individualLifetimeUrl}
                  data-track="individual_lifetime_cta_clicked"
                  data-plan="individual"
                  className="block w-full py-4 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-base text-center transition-colors shadow-lg shadow-gold/25"
                >
                  Get Lifetime Access — {indLifetime}
                </Link>
                <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-text-muted">
                  <Infinity className="w-3.5 h-3.5" />
                  One-time payment · yours forever
                </div>
              </div>

              {/* Family Lifetime — secondary */}
              <div className="relative rounded-2xl border border-border bg-surface/50 p-5 flex flex-col">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-surface border border-border text-text-muted">
                    For Households
                  </span>
                </div>
                <p className="text-base font-bold text-text mb-0.5">For My Family</p>
                <p className="text-xs text-text-muted mb-4">Family Lifetime · up to 5 profiles</p>
                <div className="mb-4">
                  {showFamStrike && <span className="text-xs text-text-muted line-through mr-2">{regFam}</span>}
                  <span className="text-3xl font-bold text-gold">{famLifetime}</span>
                  <p className="text-xs text-text-muted mt-0.5">one-time</p>
                </div>
                <ul className="space-y-1.5 mb-5 flex-1">
                  {[
                    "Everything in Individual",
                    "5 separate learner profiles",
                    "One payment for the whole household",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-text-secondary">
                      <CheckCircle2 className="w-3.5 h-3.5 text-gold/60 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={familyLifetimeUrl}
                  data-track="family_lifetime_cta_clicked"
                  data-plan="family"
                  className="block w-full py-3 rounded-xl border border-gold/30 text-gold font-semibold text-sm text-center hover:bg-gold/5 transition-colors"
                >
                  Get Family Access — {famLifetime}
                </Link>
                <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-text-muted">
                  <Infinity className="w-3.5 h-3.5" />
                  One-time payment
                </div>
              </div>

            </div>

            {/* Cross-tab footnote */}
            <p className="text-center text-xs text-text-muted/50 mt-4">
              Want to start smaller?{" "}
              <button
                onClick={() => setTab("monthly")}
                className="underline underline-offset-2 hover:text-text-muted transition-colors"
              >
                Start at $4.99/month →
              </button>
            </p>
          </>
        )}

        {/* ── Trust row ───────────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap text-xs text-text-muted mt-5">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-gold/60" />7-day refund guarantee</span>
          <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-gold/60" />Secure checkout</span>
          <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-gold/60" />Instant access</span>
        </div>

      </div>
    </section>
  );
}
