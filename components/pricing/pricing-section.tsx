"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2, ArrowRight, Star, Lock, Gift, RefreshCw, Infinity, Users,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { buttonClass } from "@/components/ui/button";
import { PLANS, formatPrice } from "@/lib/stripe-config";
import { LifetimePriceDisplay } from "@/components/pricing/lifetime-price-display";
import { FadeUp } from "@/components/motion";

type PlanType = "individual" | "family";

interface PricingSectionProps {
  hasLifetime: boolean;
  hasMonthly: boolean;
  hasFamily: boolean;
}

// ── Individual monthly button ──────────────────────────────────────────────────
// /checkout/monthly handles both guests and logged-in users with an inline auth form,
// so we always go there directly — no login redirect needed.
function IndividualMonthlyButton() {
  return (
    <Link
      href="/checkout/monthly"
      className="inline-flex items-center justify-center gap-2 w-full rounded-xl px-6 py-3.5 font-semibold text-base transition-all border border-border bg-surface hover:bg-surface-raised hover:border-gold/30 text-text cursor-pointer"
    >
      <ArrowRight className="w-4 h-4 text-gold" />
      Start Monthly
    </Link>
  );
}

// ── Main section ───────────────────────────────────────────────────────────────
export function PricingSection({ hasLifetime, hasMonthly, hasFamily }: PricingSectionProps) {
  const [tab, setTab] = useState<PlanType>("individual");
  const prefersReduced = useReducedMotion();

  // All checkout pages handle inline auth for guests, so always link directly.
  const individualLifetimeHref = "/checkout";
  const familyMonthlyHref  = "/checkout?plan=family&billing=monthly";
  const familyLifetimeHref = "/checkout?plan=family&billing=lifetime";

  return (
    <section className="py-8 border-t border-border" id="pricing">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* ── Section title ───────────────────────────────────────────── */}
        <FadeUp className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-text mb-2">
            Choose Your Access
          </h2>
          <p className="text-sm text-text-secondary">
            Individual or family · monthly or lifetime · cancel anytime.
          </p>
        </FadeUp>

        {/* ── Individual / Family toggle ──────────────────────────────── */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-surface border border-border">
            <button
              onClick={() => setTab("individual")}
              className={`px-5 py-2 min-h-[44px] rounded-lg text-sm font-semibold transition-all duration-150 ${
                tab === "individual"
                  ? "bg-gold text-ink shadow-sm"
                  : "text-text-secondary hover:text-text"
              }`}
            >
              Individual
            </button>
            <button
              onClick={() => setTab("family")}
              className={`px-5 py-2 min-h-[44px] rounded-lg text-sm font-semibold transition-all duration-150 flex items-center gap-1.5 ${
                tab === "family"
                  ? "bg-gold text-ink shadow-sm"
                  : "text-text-secondary hover:text-text"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Family
            </button>
          </div>
        </div>

        {/* ── Plan description ─────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.p
            key={tab}
            initial={{ opacity: 0, y: prefersReduced ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: prefersReduced ? 0 : -6 }}
            transition={{ duration: 0.22, ease: [0, 0, 0.2, 1] }}
            className="text-sm text-text-secondary text-center mb-8"
          >
            {tab === "individual"
              ? "Full access to all 100 Seerah parts for one learner."
              : "One household account with up to 5 learner profiles."}
          </motion.p>
        </AnimatePresence>

        {/* ── Cards ───────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: prefersReduced ? 0 : 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: prefersReduced ? 0 : -14 }}
            transition={{ duration: 0.28, ease: [0, 0, 0.2, 1] }}
            className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto sm:items-start"
          >

          {/* ── Monthly card ──────────────────────────────────────────── */}
          <motion.div
            whileHover={prefersReduced ? undefined : { y: -4, transition: { duration: 0.18 } }}
            className="relative p-7 rounded-2xl border border-border bg-surface flex flex-col hover:border-gold/20 hover:shadow-lg hover:shadow-gold/5 transition-shadow"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-surface-raised border border-border flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-text-secondary" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                {tab === "individual" ? "Monthly Access" : "Family Monthly"}
              </p>
            </div>

            <div className="mb-5">
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-4xl font-bold text-text">
                  {tab === "individual" ? formatPrice(PLANS.monthly.price) : formatPrice(PLANS.familyMonthly.price)}
                </span>
                <span className="text-text-muted text-sm">/month</span>
              </div>
              <p className="text-sm text-text-secondary">
                {tab === "individual"
                  ? "Full access while subscribed · Cancel anytime"
                  : "Family access while subscribed · Cancel anytime"}
              </p>
            </div>

            <ul className="space-y-2.5 mb-7 flex-1">
              {(tab === "individual"
                ? [
                    "All 100 Seerah parts",
                    "Videos, briefings, flashcards, quizzes",
                    "Progress tracking",
                    "Cancel anytime",
                  ]
                : [
                    "Up to 5 learner profiles",
                    "Separate progress for every family member",
                    "All 100 Seerah parts",
                    "Videos, briefings, flashcards, quizzes",
                    "Cancel anytime",
                  ]
              ).map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-text-secondary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-text-secondary">{f}</span>
                </li>
              ))}
            </ul>

            {/* Monthly CTA */}
            {tab === "individual" ? (
              hasMonthly ? (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                  <p className="text-sm text-green-400 font-medium">✓ Monthly Access Active</p>
                  <Link href="/seerah" className="text-xs text-gold mt-1 hover:underline block">Go to course →</Link>
                </div>
              ) : hasLifetime ? (
                <div className="p-3 rounded-lg bg-gold/5 border border-gold/15 text-center">
                  <p className="text-xs text-gold">You have lifetime access</p>
                </div>
              ) : (
                <>
                  <IndividualMonthlyButton />
                  <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-text-muted/60">
                    <Lock className="w-3 h-3 flex-shrink-0" />
                    <span>Secure checkout · Cancel anytime</span>
                  </div>
                </>
              )
            ) : (
              hasFamily ? (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                  <p className="text-sm text-green-400 font-medium">✓ Family Access Active</p>
                  <Link href="/seerah" className="text-xs text-gold mt-1 hover:underline block">Go to course →</Link>
                </div>
              ) : (
                <>
                  <Link
                    href={familyMonthlyHref}
                    className="inline-flex items-center justify-center gap-2 w-full rounded-xl px-6 py-3.5 font-semibold text-base transition-all border border-border bg-surface hover:bg-surface-raised hover:border-gold/30 text-text cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4 text-gold" />
                    Start Family Monthly
                  </Link>
                  <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-text-muted/60">
                    <Lock className="w-3 h-3 flex-shrink-0" />
                    <span>Secure checkout · Cancel anytime</span>
                  </div>
                </>
              )
            )}
          </motion.div>

          {/* ── Lifetime card ─────────────────────────────────────────── */}
          <motion.div
            whileHover={prefersReduced ? undefined : { y: -5, transition: { duration: 0.18 } }}
            className="relative p-7 rounded-2xl border-2 border-gold bg-gradient-to-b from-gold/8 to-surface flex flex-col gold-glow sm:scale-[1.03] sm:origin-center"
          >
            <div className="absolute -top-3 right-5 px-3 py-1 rounded-full bg-gold text-ink text-xs font-bold flex items-center gap-1 shadow-lg z-10">
              <Star className="w-3 h-3 fill-current" />
              {tab === "individual" ? "BEST VALUE" : "BEST VALUE FOR FAMILIES"}
            </div>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gold/15 border border-gold/25 flex items-center justify-center">
                <Infinity className="w-4 h-4 text-gold" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gold">
                {tab === "individual" ? "Lifetime Access" : "Family Lifetime"}
              </p>
            </div>

            {tab === "individual" ? (
              <LifetimePriceDisplay basePrice={PLANS.complete.price} />
            ) : (
              <div className="mb-5">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl font-bold text-text">{formatPrice(PLANS.family.price)}</span>
                </div>
                <p className="text-sm text-gold font-medium">One-time payment · Lifetime access</p>
              </div>
            )}

            <ul className="space-y-2.5 mb-7 flex-1">
              {(tab === "individual"
                ? [
                    "Pay once. Keep it forever.",
                    "All 100 Seerah parts",
                    "Videos, briefings, flashcards, quizzes",
                    "Progress tracking",
                    "Lifetime access, no recurring charges",
                    "7-Day Clarity Guarantee",
                  ]
                : [
                    "Pay once. Your household keeps access forever.",
                    "Up to 5 learner profiles",
                    "Separate progress for every course asset",
                    "Parent progress dashboard",
                    "All 100 Seerah parts",
                    "Lifetime access, no recurring charges",
                    "7-Day Clarity Guarantee",
                  ]
              ).map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-text">{f}</span>
                </li>
              ))}
            </ul>

            {/* Lifetime CTA */}
            {tab === "individual" ? (
              hasLifetime ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                    <p className="text-sm text-green-400 font-medium">✓ Lifetime Access Active</p>
                    <Link href="/seerah" className="text-xs text-gold mt-1 hover:underline block">Go to course →</Link>
                  </div>
                  <Link
                    href="/gift-checkout"
                    className={buttonClass("ghost", "md", "w-full justify-center border border-gold/30 text-gold hover:bg-gold/5")}
                  >
                    <Gift className="w-4 h-4" />
                    Gift Lifetime Access
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link
                    href={individualLifetimeHref}
                    className={buttonClass("primary", "lg", "w-full justify-center shadow-lg shadow-gold/20")}
                  >
                    Get Lifetime Access
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/gift-checkout"
                    className={buttonClass("ghost", "sm", "w-full justify-center border border-gold/20 text-gold/80 hover:bg-gold/5 text-xs min-h-[44px]")}
                  >
                    <Gift className="w-3.5 h-3.5" />
                    Gift This Course
                  </Link>
                </div>
              )
            ) : (
              hasFamily ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                    <p className="text-sm text-green-400 font-medium">✓ Family Access Active</p>
                    <Link href="/student/profiles" className="text-xs text-gold mt-1 hover:underline block">Manage profiles →</Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link
                    href={familyLifetimeHref}
                    className={buttonClass("primary", "lg", "w-full justify-center shadow-lg shadow-gold/20")}
                  >
                    Get Family Lifetime Access
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )
            )}

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-text-muted">
              <Lock className="w-3.5 h-3.5" />
              <span>Secure payment · Instant access · 7-day guarantee</span>
            </div>
          </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* ── Comparison note ─────────────────────────────────────────── */}
        <p className="text-center text-xs text-text-muted mt-6">
          {tab === "individual"
            ? "At $9/month, lifetime access pays for itself in 11 months."
            : "At $19/month, family lifetime access pays for itself in about 11 months."}
        </p>
      </div>
    </section>
  );
}
