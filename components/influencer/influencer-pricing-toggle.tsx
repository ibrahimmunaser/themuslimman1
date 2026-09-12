"use client";

import Link from "next/link";
import { CheckCircle2, Infinity, ShieldCheck, Lock, Zap, User } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface InfluencerPricingToggleProps {
  /** e.g. "Deen Responds" — used in CTAs */
  displayName: string;

  // Lifetime checkout URLs (with creator/source attribution embedded)
  individualLifetimeUrl: string;
  familyLifetimeUrl: string;

  // Lifetime prices in cents
  individualLifetimePriceCents: number;
  familyLifetimePriceCents: number;

  // Optional regular (pre-discount) prices — only shown when higher than actual price
  regularIndividualPriceCents?: number;
  regularFamilyPriceCents?: number;
  /** When set, prefixes all data-track values, e.g. "orthodox" → "orthodox_lifetime_individual_click" */
  trackingPrefix?: string;

  /** @deprecated Legacy monthly URLs — no longer shown in public purchase UI */
  individualMonthlyUrl?: string;
  familyMonthlyUrl?: string;
}

function fmtPrice(cents: number) {
  const dollars = cents / 100;
  return dollars % 1 === 0 ? `$${dollars.toFixed(0)}` : `$${dollars.toFixed(2)}`;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function InfluencerPricingToggle({
  displayName,
  individualLifetimeUrl,
  familyLifetimeUrl,
  individualLifetimePriceCents,
  familyLifetimePriceCents,
  regularIndividualPriceCents,
  regularFamilyPriceCents,
  trackingPrefix,
}: InfluencerPricingToggleProps) {
  const ev = (name: string) => trackingPrefix ? `${trackingPrefix}_${name}` : name;

  const indLifetime    = fmtPrice(individualLifetimePriceCents);
  const famLifetime    = fmtPrice(familyLifetimePriceCents);
  const regInd         = regularIndividualPriceCents ? fmtPrice(regularIndividualPriceCents) : null;
  const regFam         = regularFamilyPriceCents     ? fmtPrice(regularFamilyPriceCents)     : null;
  const showIndStrike  = !!(regularIndividualPriceCents && regularIndividualPriceCents > individualLifetimePriceCents);
  const showFamStrike  = !!(regularFamilyPriceCents     && regularFamilyPriceCents     > familyLifetimePriceCents);

  return (
    <section id="pricing" className="pb-14 scroll-mt-16">
      <div className="max-w-5xl mx-auto px-6 sm:px-8">

        <div className="text-center mb-6">
          <p className="text-3xl sm:text-4xl font-extrabold text-gold tracking-tight">
            Lifetime access from {indLifetime}
          </p>
          <p className="text-sm text-text-muted mt-1">Pay once. No renewal ever.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-7 items-stretch">

          {/* Individual Lifetime — primary / hero */}
          <div className="relative min-h-[520px] sm:min-h-[640px] rounded-3xl border-2 border-gold bg-gradient-to-b from-gold/8 to-surface shadow-2xl shadow-gold/10 p-6 sm:p-9 flex flex-col gold-glow">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold text-ink shadow-sm">
                Most Popular
              </span>
            </div>
            <p className="text-2xl font-bold text-text mb-1">For Me</p>
            <p className="text-sm text-text-muted mb-4">Individual Lifetime Access</p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold/10 border border-gold/20 mb-4 self-start">
              <User className="w-3.5 h-3.5 text-gold" />
              <span className="text-sm font-semibold text-gold">1 person</span>
            </div>
            <div className="mb-7">
              {showIndStrike && <span className="text-xs text-text-muted line-through mr-2">{regInd}</span>}
              <span className="text-8xl font-extrabold tracking-tight text-gold">{indLifetime}</span>
              <p className="text-sm font-medium text-gold/70 mt-2">one-time · no renewal ever</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                "Pay once — yours forever",
                "Full access, start anytime",
                "Videos, quizzes, flashcards, mind maps",
                "Structured 100-part Seerah path",
                "Progress dashboard · Mobile friendly",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-text-secondary">
                  <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={individualLifetimeUrl}
              data-track={ev("lifetime_individual_click")}
              data-plan="individual-lifetime"
              className="block w-full py-5 rounded-2xl bg-gold hover:bg-gold-light text-ink font-extrabold text-base text-center transition-colors shadow-lg shadow-gold/25"
            >
              Get Lifetime Access — {indLifetime} →
            </Link>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-text-muted">
              <Infinity className="w-3.5 h-3.5" />
              One-time payment · yours forever
            </div>
          </div>

          {/* Family Lifetime */}
          <div className="relative min-h-[520px] sm:min-h-[640px] rounded-3xl border border-border bg-surface/70 p-6 sm:p-9 flex flex-col">
            <p className="text-xl font-bold text-text mb-1">For My Family</p>
            <p className="text-sm text-text-muted mb-4">Family Lifetime Access</p>
            <div className="mb-7">
              {showFamStrike && <span className="text-xs text-text-muted line-through mr-2">{regFam}</span>}
              <span className="text-8xl font-extrabold tracking-tight text-gold">{famLifetime}</span>
              <p className="text-sm font-medium text-gold/70 mt-2">one-time · up to 5 profiles</p>
            </div>
            <Link
              href={familyLifetimeUrl}
              data-track={ev("lifetime_family_click")}
              data-plan="family-lifetime"
              className="block w-full py-4 rounded-2xl border-2 border-gold/50 text-gold font-bold text-base text-center hover:border-gold hover:bg-gold/5 transition-colors mt-auto"
            >
              Get Family Lifetime — {famLifetime} →
            </Link>
          </div>

        </div>

        <p className="text-center text-sm font-medium text-text-muted mt-6">
          Secure checkout · Instant access after payment · 7-day refund guarantee
        </p>
        <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap text-xs text-text-muted mt-3">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-gold/60" />No card needed for Part 1</span>
          <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-gold/60" />One-time payment</span>
          <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-gold/60" />Start in under 60 seconds</span>
        </div>

        <p className="text-center text-xs text-text-muted/50 mt-4">
          Recommended by {displayName}
        </p>

      </div>
    </section>
  );
}
