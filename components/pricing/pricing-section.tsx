"use client";

import Link from "next/link";
import { CheckCircle2, Gift } from "lucide-react";
import { FadeUp } from "@/components/motion";
import { PlanPicker } from "@/components/landing/plan-picker";

interface PricingSectionProps {
  hasLifetime: boolean;
  hasMonthly: boolean;
  hasFamily: boolean;
  /** Base checkout URL — preserves source/UTM params when provided. */
  checkoutBaseUrl?: string;
  /** "full" = heading + included list (homepage). "plans-only" = plan picker only (pricing page). */
  variant?: "full" | "plans-only";
}

const INCLUDED = [
  "Full 100-part Seerah — every major event in order",
  "Video lessons, quizzes, flashcards, and mind maps",
  "Reading summaries and structured notes",
  "Progress tracking dashboard",
  "Access on any device — phone, tablet, or desktop",
  "All future content included automatically",
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
    <section className={plansOnly ? "py-8 sm:py-10" : "py-10 sm:py-12 md:py-14 border-t border-border"} id="pricing">
      <div className="max-w-lg md:max-w-2xl mx-auto px-4 sm:px-6">

        {!plansOnly && (
          <FadeUp className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-text mb-2">
              Choose your plan
            </h2>
            <p className="text-sm text-text-secondary">
              Start monthly or save with lifetime access. Individual and family options available.
            </p>
          </FadeUp>
        )}

        <FadeUp delay={plansOnly ? 0 : 0.05}>
          <PlanPicker
            checkoutBaseUrl={checkoutBaseUrl}
            hasAccess={hasAnyAccess}
          />
        </FadeUp>

        {/* Gift option */}
        {!hasAnyAccess && (
          <FadeUp delay={plansOnly ? 0.05 : 0.1} className="mt-4 text-center">
            <Link
              href="/gift-checkout"
              className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-gold transition-colors"
            >
              <Gift className="w-3.5 h-3.5" />
              Gift this course to someone
            </Link>
          </FadeUp>
        )}

        {/* What's included — homepage only */}
        {!plansOnly && (
          <FadeUp delay={0.15} className="mt-8 border-t border-border pt-6">
            <p className="text-xs font-bold text-gold uppercase tracking-widest text-center mb-4">
              Everything included in every plan
            </p>
            <ul className="space-y-2.5">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-text-secondary">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-text-muted text-center mt-4">
              Family plans include up to 5 separate learner profiles with independent progress tracking.
            </p>
          </FadeUp>
        )}

      </div>
    </section>
  );
}
