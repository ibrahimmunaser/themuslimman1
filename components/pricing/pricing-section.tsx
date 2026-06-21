"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2, ArrowRight, Lock, Gift, Users, User, Calendar, Infinity,
} from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { FadeUp } from "@/components/motion";

interface PricingSectionProps {
  hasLifetime: boolean;
  hasMonthly: boolean;
  hasFamily: boolean;
}

type Tab = "monthly" | "lifetime";

export function PricingSection({ hasLifetime, hasMonthly, hasFamily }: PricingSectionProps) {
  const hasAnyAccess = hasLifetime || hasMonthly || hasFamily;
  const [tab, setTab] = useState<Tab>("monthly");

  return (
    <section className="py-10 border-t border-border" id="pricing">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        <FadeUp className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-text mb-5">
            {tab === "monthly" ? "Start learning for less than $5/month" : "Own it forever — pay once"}
          </h2>

          {/* ── Tab toggle ───────────────────────────────────────────── */}
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

          <p className="text-xs text-text-muted mt-3">
            {tab === "monthly"
              ? "Cancel anytime · Start with the Seerah"
              : "One-time payment · No recurring charges · 7-day guarantee"}
          </p>
        </FadeUp>

        {/* ── Monthly cards ─────────────────────────────────────────── */}
        {tab === "monthly" && (
          <div className="grid sm:grid-cols-2 gap-5 max-w-3xl mx-auto">

            {/* Individual Monthly */}
            <div className="relative pt-8 pb-6 px-6 rounded-2xl border-2 border-gold bg-gradient-to-b from-gold/8 to-surface flex flex-col gold-glow">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold text-ink shadow-sm">
                  Most Popular
                </span>
              </div>

              {/* Header */}
              <p className="text-lg font-bold text-text mb-1">Individual</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-text">$4.99</span>
                <span className="text-sm text-text-muted">/month</span>
              </div>
              <p className="text-sm text-text-muted mb-5">For one learner · cancel anytime</p>

              {/* Features */}
              <ul className="space-y-2.5 mb-6 flex-1">
                {[
                  "Full 100-part path",
                  "Video, quiz, flashcards",
                  "Progress tracking",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0" />
                    <span className="text-sm font-medium text-text">{f}</span>
                  </li>
                ))}
              </ul>

              {hasLifetime || hasMonthly ? (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                  <p className="text-sm text-green-400 font-medium">✓ Access Active</p>
                  <Link href="/seerah" className="text-xs text-gold mt-1 hover:underline block">Go to course →</Link>
                </div>
              ) : (
                <Link
                  href="/checkout?plan=individual-monthly"
                  data-track="homepage_individual_click"
                  className={buttonClass("primary", "xl", "w-full justify-center shadow-lg shadow-gold/20")}
                >
                  Start Learning
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              <p className="text-xs text-text-muted/60 text-center mt-2.5">Cancel anytime · No commitment</p>
            </div>

            {/* Family Monthly */}
            <div className="relative pt-8 pb-6 px-6 rounded-2xl border border-border bg-surface flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-surface border border-border text-text-muted">
                  For Households
                </span>
              </div>

              {/* Header */}
              <p className="text-lg font-bold text-text mb-1">Family</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-text">$9.99</span>
                <span className="text-sm text-text-muted">/month</span>
              </div>
              <p className="text-sm font-semibold text-gold/75 mb-5">Up to 5 profiles · separate progress</p>

              {/* Features */}
              <ul className="space-y-2.5 mb-6 flex-1">
                {[
                  "Separate progress per profile",
                  "One plan for your household",
                  "Everything in Individual",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gold/70 flex-shrink-0" />
                    <span className="text-sm font-medium text-text-secondary">{f}</span>
                  </li>
                ))}
              </ul>

              {hasFamily ? (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                  <p className="text-sm text-green-400 font-medium">✓ Family Access Active</p>
                  <Link href="/student/profiles" className="text-xs text-gold mt-1 hover:underline block">Manage profiles →</Link>
                </div>
              ) : (
                <Link
                  href="/checkout?plan=family-monthly"
                  data-track="homepage_family_click"
                  className={buttonClass("ghost", "xl", "w-full justify-center border border-gold/30 text-gold hover:bg-gold/5")}
                >
                  Start Family Membership
                </Link>
              )}
              <p className="text-xs text-text-muted/60 text-center mt-2.5">Cancel anytime</p>
            </div>

          </div>
        )}

        {/* ── Lifetime cards ────────────────────────────────────────── */}
        {tab === "lifetime" && (
          <div className="grid sm:grid-cols-2 gap-5 max-w-3xl mx-auto">

            {/* Individual Lifetime */}
            <div className="relative p-6 rounded-2xl border border-border bg-gradient-to-b from-gold/5 to-surface flex flex-col sm:scale-[1.03] sm:origin-center">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gold/15 border border-gold/25 flex items-center justify-center">
                  <User className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <p className="text-base font-bold text-text leading-tight">For Me</p>
                  <p className="text-xs text-text-muted">Individual lifetime access</p>
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold/10 border border-gold/20 mb-4 self-start">
                <User className="w-3.5 h-3.5 text-gold" />
                <span className="text-sm font-semibold text-gold">1 person</span>
              </div>

              <div className="mb-5">
                <div className="flex items-baseline gap-1.5 mb-0.5">
                  <span className="text-4xl font-bold text-text">$49</span>
                  <span className="text-sm text-text-muted">one-time</span>
                </div>
                <p className="text-xs text-text-secondary">Pay once · access forever</p>
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {[
                  "Pay once — yours forever",
                  "Full access — video, quiz, flashcards, mind maps",
                  "Progress tracking dashboard",
                  "No recurring charges",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-text">{f}</span>
                  </li>
                ))}
              </ul>

              {hasAnyAccess ? (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                  <p className="text-sm text-green-400 font-medium">✓ Access Active</p>
                  <Link href="/seerah" className="text-xs text-gold mt-1 hover:underline block">Go to course →</Link>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/checkout?plan=individual-lifetime"
                    data-track="homepage_lifetime_click"
                    className={buttonClass("primary", "lg", "w-full justify-center shadow-lg shadow-gold/20")}
                  >
                    Get Lifetime Access — $49
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/gift-checkout"
                    className={buttonClass("ghost", "sm", "w-full justify-center border border-gold/20 text-gold/70 hover:bg-gold/5 text-xs min-h-[40px]")}
                  >
                    <Gift className="w-3.5 h-3.5" />
                    Gift This Course
                  </Link>
                </div>
              )}

              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-text-muted">
                <Infinity className="w-3.5 h-3.5" />
                <span>Lifetime access · 7-day guarantee</span>
              </div>
            </div>

            {/* Family Lifetime */}
            <div className="relative p-6 rounded-2xl border-2 border-gold bg-surface flex flex-col gold-glow">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold text-ink shadow-sm">
                  Best for Families
                </span>
              </div>

              <div className="flex items-center gap-2 mb-3 mt-1">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <Users className="w-4 h-4 text-gold/80" />
                </div>
                <div>
                  <p className="text-base font-bold text-text leading-tight">For My Family</p>
                  <p className="text-xs text-text-muted">Up to 5 learner profiles</p>
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold/10 border border-gold/20 mb-4 self-start">
                <Users className="w-3.5 h-3.5 text-gold/80" />
                <span className="text-sm font-semibold text-gold/90">Up to 5 members</span>
              </div>

              <div className="mb-5">
                <div className="flex items-baseline gap-1.5 mb-0.5">
                  <span className="text-4xl font-bold text-text">$99</span>
                  <span className="text-sm text-text-muted">one-time</span>
                </div>
                <p className="text-xs text-text-secondary">One payment for the whole household</p>
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {[
                  "Everything in the Individual plan",
                  "Up to 5 separate learner profiles",
                  "Each profile tracks progress independently",
                  "Full access for every family member",
                  "One payment — no recurring charges",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-gold/70 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-text-secondary">{f}</span>
                  </li>
                ))}
              </ul>

              {hasFamily ? (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                  <p className="text-sm text-green-400 font-medium">✓ Family Access Active</p>
                  <Link href="/student/profiles" className="text-xs text-gold mt-1 hover:underline block">Manage profiles →</Link>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/checkout?plan=family-lifetime"
                    data-track="homepage_lifetime_click"
                    className={buttonClass("primary", "lg", "w-full justify-center shadow-lg shadow-gold/20")}
                  >
                    Get Family Lifetime — $99
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/gift-checkout"
                    className={buttonClass("ghost", "sm", "w-full justify-center border border-gold/20 text-gold/70 hover:bg-gold/5 text-xs min-h-[40px]")}
                  >
                    <Gift className="w-3.5 h-3.5" />
                    Gift This Course
                  </Link>
                </div>
              )}

              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-text-muted">
                <Lock className="w-3.5 h-3.5" />
                <span>Secure payment · 7-day guarantee</span>
              </div>
            </div>

          </div>
        )}

        {/* ── Cross-tab footnote ────────────────────────────────────── */}
        <p className="text-center text-xs text-text-muted/50 mt-6">
          {tab === "monthly" ? (
            <>
              Prefer to pay once?{" "}
              <button
                onClick={() => setTab("lifetime")}
                className="underline underline-offset-2 hover:text-text-muted transition-colors"
              >
                View lifetime options →
              </button>
            </>
          ) : (
            <>
              Want to start smaller?{" "}
              <button
                onClick={() => setTab("monthly")}
                className="underline underline-offset-2 hover:text-text-muted transition-colors"
              >
                Start at $4.99/month →
              </button>
            </>

          )}
        </p>

      </div>
    </section>
  );
}
