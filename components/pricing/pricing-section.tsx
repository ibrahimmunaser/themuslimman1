"use client";

import Link from "next/link";
import { Gift } from "lucide-react";
import { FadeUp } from "@/components/motion";
import { PlanPicker } from "@/components/landing/plan-picker";

interface PricingSectionProps {
  hasLifetime: boolean;
  hasMonthly: boolean;
  hasFamily: boolean;
  /** Base checkout URL — preserves source/UTM params when provided. */
  checkoutBaseUrl?: string;
  /** "full" = heading + trust block + included list (homepage). "plans-only" = plan picker only (pricing page). */
  variant?: "full" | "plans-only";
}

const TRUST_ITEMS = [
  { icon: "📚", text: "100 structured lessons — every major event in order" },
  { icon: "▶",  text: "Video lessons, readings, quizzes, and flashcards" },
  { icon: "📊", text: "Progress tracking dashboard" },
  { icon: "👨‍👩‍👧", text: "Family profiles on family plans (up to 5 learners)" },
  { icon: "↩",  text: "Cancel anytime — monthly plans, no questions asked" },
  { icon: "🛡",  text: "7-day refund guarantee — not happy? Full refund." },
];

export function PricingSection({
  hasLifetime,
  hasMonthly,
  hasFamily,
  checkoutBaseUrl = "/checkout",
  variant = "full",
}: PricingSectionProps) {
  const hasAnyAccess = hasLifetime || hasMonthly || hasFamily;
  const plansOnly = variant === "plans-only";

  return (
    <section
      id="pricing"
      className={plansOnly ? "py-8 sm:py-10" : "py-8 sm:py-10 border-t border-border"}
    >
      <div className="max-w-lg md:max-w-2xl mx-auto px-4 sm:px-6">

        {!plansOnly && (
          <FadeUp className="text-center mb-5">
            <h2 className="text-2xl sm:text-3xl font-bold text-text mb-1">
              Choose your plan
            </h2>
            <p className="text-sm text-text-secondary">
              Start monthly or save with lifetime access. Individual and family options available.
            </p>
          </FadeUp>
        )}

        {/* Trust / value block — visible immediately, no animation gate */}
        {!plansOnly && !hasAnyAccess && (
          <div className="mb-5 rounded-xl border border-gold/20 bg-gold/[0.04] px-4 py-4 sm:px-5">
            <p className="text-xs font-bold text-gold uppercase tracking-widest text-center mb-3">
              Included instantly with every plan
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              {TRUST_ITEMS.map((item) => (
                <div key={item.text} className="flex items-start gap-2.5">
                  <span className="text-base flex-shrink-0 mt-0.5">{item.icon}</span>
                  <span className="text-xs sm:text-sm text-text-secondary leading-snug">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/*
          PlanPicker is NOT wrapped in FadeUp — it is interactive, critical content.
          Wrapping it in a fade-in animation risks leaving it permanently invisible
          if the user scrolls past the section before framer-motion's IntersectionObserver fires.
        */}
        <PlanPicker
          checkoutBaseUrl={checkoutBaseUrl}
          hasAccess={hasAnyAccess}
        />

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
