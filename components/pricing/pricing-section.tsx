"use client";

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

export function PricingSection({ hasLifetime, hasMonthly, hasFamily }: PricingSectionProps) {
  const hasAnyAccess = hasLifetime || hasMonthly || hasFamily;

  return (
    <section className="py-10 border-t border-border" id="pricing">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        <FadeUp className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-text mb-2">
            Start learning for less than $5/month
          </h2>
          <p className="text-sm text-text-secondary">
            Cancel anytime · Start with the Seerah
          </p>
        </FadeUp>

        {/* ── Monthly plans — main offer ──────────────────────────────── */}
        <div className="grid sm:grid-cols-2 gap-5 max-w-3xl mx-auto mb-10 sm:items-start">

          {/* Individual Monthly — dominant primary card */}
          <div className="relative p-6 rounded-2xl border-2 border-gold bg-gradient-to-b from-gold/8 to-surface flex flex-col gold-glow">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold text-ink shadow-sm">
                Most Popular
              </span>
            </div>

            <div className="flex items-center gap-2 mb-3 mt-1">
              <div className="w-8 h-8 rounded-lg bg-gold/15 border border-gold/25 flex items-center justify-center">
                <User className="w-4 h-4 text-gold" />
              </div>
              <div>
                <p className="text-base font-bold text-text leading-tight">Individual Membership</p>
                <p className="text-xs text-text-muted">For you · cancel anytime</p>
              </div>
            </div>

            <div className="mb-5">
              <div className="flex items-baseline gap-1.5 mb-0.5">
                <span className="text-4xl font-bold text-text">$4.99</span>
                <span className="text-sm text-text-muted">/month</span>
              </div>
              <p className="text-xs text-gold/70">Start learning today</p>
            </div>

            <ul className="space-y-2 mb-6 flex-1">
              {[
                "All 100 Seerah parts, unlocked immediately",
                "Videos, quizzes, flashcards, mind maps",
                "Progress dashboard · Mobile friendly",
                "Cancel anytime — no commitment",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-gold flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-text">{f}</span>
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
                className={buttonClass("primary", "lg", "w-full justify-center shadow-lg shadow-gold/20")}
              >
                Start for $4.99/month
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}

            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-text-muted">
              <Calendar className="w-3.5 h-3.5" />
              <span>Cancel anytime · No commitment</span>
            </div>
          </div>

          {/* Family Monthly — secondary card */}
          <div className="relative p-6 rounded-2xl border border-border bg-surface flex flex-col">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-surface border border-border text-text-muted">
                For Households
              </span>
            </div>

            <div className="flex items-center gap-2 mb-3 mt-1">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/15 flex items-center justify-center">
                <Users className="w-4 h-4 text-gold/80" />
              </div>
              <div>
                <p className="text-base font-bold text-text leading-tight">Family Membership</p>
                <p className="text-xs text-text-muted">For parents, spouse, and children</p>
              </div>
            </div>

            <div className="mb-5">
              <div className="flex items-baseline gap-1.5 mb-0.5">
                <span className="text-4xl font-bold text-text">$9.99</span>
                <span className="text-sm text-text-muted">/month</span>
              </div>
              <p className="text-xs text-text-muted">Up to 5 learner profiles</p>
            </div>

            <ul className="space-y-2 mb-6 flex-1">
              {[
                "Everything in Individual Membership",
                "Up to 5 separate learner profiles",
                "Each profile tracks progress independently",
                "Cancel anytime",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-gold/60 flex-shrink-0 mt-0.5" />
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
              <Link
                href="/checkout?plan=family-monthly"
                className={buttonClass("ghost", "lg", "w-full justify-center border border-gold/30 text-gold hover:bg-gold/5")}
              >
                Start Family Membership
              </Link>
            )}

            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-text-muted">
              <Calendar className="w-3.5 h-3.5" />
              <span>Cancel anytime</span>
            </div>
          </div>

        </div>

        {/* ── Lifetime — "prefer to pay once?" section ─────────────────── */}
        <div className="max-w-3xl mx-auto">
          <div className="border border-border/60 rounded-2xl p-5 bg-surface/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-text mb-0.5 flex items-center gap-2">
                  <Infinity className="w-4 h-4 text-gold/70" />
                  Prefer to pay once?
                </p>
                <p className="text-xs text-text-muted">
                  Lifetime access — own it forever with no recurring charges.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                {hasAnyAccess ? (
                  <Link href="/seerah" className="text-xs text-gold hover:underline">
                    Go to course →
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/checkout?plan=individual-lifetime"
                      className={buttonClass("ghost", "sm", "border border-gold/25 text-gold/80 hover:bg-gold/5 hover:text-gold whitespace-nowrap")}
                    >
                      Individual Lifetime — $79
                    </Link>
                    <Link
                      href="/checkout?plan=family-lifetime"
                      className={buttonClass("ghost", "sm", "border border-border text-text-muted hover:border-gold/25 hover:text-gold whitespace-nowrap")}
                    >
                      Family Lifetime — $149
                    </Link>
                  </>
                )}
              </div>
            </div>
            {!hasAnyAccess && (
              <div className="mt-4 pt-4 border-t border-border/50 flex flex-wrap gap-4">
                <Link
                  href="/gift-checkout"
                  className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-gold transition-colors"
                >
                  <Gift className="w-3.5 h-3.5" />
                  Gift This Course
                </Link>
                <span className="flex items-center gap-1.5 text-xs text-text-muted">
                  <Lock className="w-3.5 h-3.5" />
                  7-Day Clarity Guarantee
                </span>
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
