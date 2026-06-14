"use client";

import Link from "next/link";
import {
  CheckCircle2, ArrowRight, Lock, Gift, Infinity, Users, User,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { buttonClass } from "@/components/ui/button";
import { FadeUp } from "@/components/motion";

interface PricingSectionProps {
  hasLifetime: boolean;
  hasMonthly: boolean;
  hasFamily: boolean;
}

export function PricingSection({ hasLifetime, hasMonthly: _hasMonthly, hasFamily }: PricingSectionProps) {
  const prefersReduced = useReducedMotion();

  const individualHref = "/checkout?plan=individual-lifetime";
  const familyHref     = "/checkout?plan=family-lifetime";

  const hasAnyAccess = hasLifetime;

  return (
    <section className="py-8 border-t border-border" id="pricing">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        <FadeUp className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-text mb-2">
            Choose Your Access
          </h2>
          <p className="text-sm text-text-secondary">
            One-time payment · Lifetime access · 7-day refund guarantee
          </p>
        </FadeUp>

        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto sm:items-start">

          {/* ── Individual Lifetime ────────────────────────────────────────── */}
          <motion.div
            whileHover={prefersReduced ? undefined : { y: -5, transition: { duration: 0.18 } }}
            className="relative p-7 rounded-2xl border border-border bg-gradient-to-b from-gold/5 to-surface flex flex-col sm:scale-[1.03] sm:origin-center"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gold/15 border border-gold/25 flex items-center justify-center">
                <Infinity className="w-4 h-4 text-gold" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gold">Lifetime Access</p>
            </div>

            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-text-secondary" />
              <p className="text-base font-bold text-text">For Me</p>
            </div>
            <p className="text-xs text-text-muted mb-4">Individual lifetime access</p>

            <div className="mb-5">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl font-bold text-text">$79</span>
                <span className="text-sm text-text-muted">one-time</span>
              </div>
              <p className="text-sm text-text-secondary">Pay once · Access forever</p>
            </div>

            <ul className="space-y-2.5 mb-7 flex-1">
              {[
                "Pay once, own it forever",
                "All 100 parts — video, quiz, flashcards, mind maps",
                "Progress tracking dashboard",
                "No recurring charges",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-text">{f}</span>
                </li>
              ))}
            </ul>

            {hasAnyAccess ? (
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
                  href={individualHref}
                  className={buttonClass("primary", "lg", "w-full justify-center shadow-lg shadow-gold/20")}
                >
                  Get Lifetime Access — $79
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
            )}

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-text-muted">
              <Lock className="w-3.5 h-3.5" />
              <span>Secure payment · 7-day guarantee</span>
            </div>
          </motion.div>

          {/* ── Family Lifetime ────────────────────────────────────────────── */}
          <motion.div
            whileHover={prefersReduced ? undefined : { y: -4, transition: { duration: 0.18 } }}
            className="relative p-7 rounded-2xl border-2 border-gold bg-surface flex flex-col gold-glow"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
                <Infinity className="w-4 h-4 text-gold/80" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gold/80">Family Lifetime</p>
            </div>

            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-text-secondary" />
              <p className="text-base font-bold text-text">For My Family</p>
            </div>
            <p className="text-xs text-text-muted mb-4">For parents, spouse, and children — up to 5 profiles</p>

            <div className="mb-5">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl font-bold text-text">$149</span>
                <span className="text-sm text-text-muted">one-time</span>
              </div>
              <p className="text-sm text-text-secondary">One payment for the household</p>
            </div>

            <ul className="space-y-2.5 mb-7 flex-1">
              {[
                "Everything in the Individual plan",
                "Up to 5 separate learner profiles",
                "Each profile tracks progress independently",
                "All 100 parts unlocked for every member",
                "Weekly parent progress reports",
                "One payment — no recurring charges",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-gold/70 flex-shrink-0 mt-0.5" />
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
              <div className="space-y-3">
                <Link
                  href={familyHref}
                  className={buttonClass("primary", "lg", "w-full justify-center shadow-lg shadow-gold/20")}
                >
                  Get Family Lifetime — $149
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
            )}

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-text-muted">
              <Lock className="w-3.5 h-3.5" />
              <span>Secure payment · 7-day guarantee</span>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
