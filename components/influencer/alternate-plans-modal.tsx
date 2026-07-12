"use client";

import { useEffect, useRef } from "react";
import { X, ArrowRight } from "lucide-react";
import { PLANS, formatPrice } from "@/lib/stripe-config";
import { trackEvent } from "@/lib/analytics";
import type { InfluencerConfig } from "@/lib/influencer-configs";

interface Plan {
  id: string;
  label: string;
  price: string;
  priceSuffix?: string;
  badge?: string;
  description: string;
  checkoutPath: string;
}

function buildCheckoutUrl(plan: string, config: InfluencerConfig): string {
  const base = `/checkout?plan=${plan}&source=${config.slug}`;
  const utm = `utm_source=${config.utmSource}&utm_medium=${config.utmMedium}&utm_campaign=${config.utmCampaign}&utm_content=${config.utmContent}`;
  return `${base}&${utm}`;
}

interface AlternatePlansModalProps {
  config: InfluencerConfig;
  isOpen: boolean;
  onClose: () => void;
}

export function AlternatePlansModal({ config, isOpen, onClose }: AlternatePlansModalProps) {
  const dialogRef  = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const plans: Plan[] = [
    {
      id:           "family-monthly",
      label:        "Family Monthly",
      price:        formatPrice(PLANS.familyMonthly.price),
      priceSuffix:  "/month",
      badge:        "Best for Families",
      description:  "Up to 5 learner profiles · each tracks progress independently · cancel anytime",
      checkoutPath: buildCheckoutUrl("family-monthly", config),
    },
    {
      id:           "individual-lifetime",
      label:        "Individual Lifetime",
      price:        formatPrice(PLANS.complete.price),
      description:  "One-time payment · full access forever · all 100 parts",
      checkoutPath: buildCheckoutUrl("individual-lifetime", config),
    },
    {
      id:           "family-lifetime",
      label:        "Family Lifetime",
      price:        formatPrice(PLANS.family.price),
      badge:        "Best Value",
      description:  "One-time payment · up to 5 profiles · lifetime access for the whole household",
      checkoutPath: buildCheckoutUrl("family-lifetime", config),
    },
  ];

  // Focus the close button when modal opens
  useEffect(() => {
    if (isOpen) closeBtnRef.current?.focus();
  }, [isOpen]);

  // Trap focus inside modal
  useEffect(() => {
    if (!isOpen) return;
    const modal = dialogRef.current;
    if (!modal) return;
    const focusable = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first?.focus(); }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Other course plans"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={dialogRef}
        className="relative w-full sm:max-w-lg bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92dvh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-zinc-950 border-b border-zinc-800 px-5 py-4 flex items-center justify-between z-10">
          <h2 className="text-base font-bold text-text">Other access options</h2>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            aria-label="Close"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Plan cards */}
        <div className="px-5 py-5 space-y-3">
          {plans.map((plan) => (
            <a
              key={plan.id}
              href={plan.checkoutPath}
              onClick={() => {
                trackEvent(
                  "alternate_plan_selected",
                  { plan: plan.id, influencer_slug: config.slug },
                  { creator: config.slug }
                );
              }}
              className="flex items-center gap-4 p-4 rounded-xl border border-zinc-700 hover:border-gold/50 hover:bg-gold/5 transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-sm text-text">{plan.label}</span>
                  {plan.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gold/20 text-gold uppercase tracking-wide">
                      {plan.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 leading-snug">{plan.description}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-right">
                  <span className="font-extrabold text-lg text-text">{plan.price}</span>
                  {plan.priceSuffix && (
                    <span className="text-xs text-zinc-500">{plan.priceSuffix}</span>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-gold transition-colors" aria-hidden="true" />
              </div>
            </a>
          ))}
        </div>

        <p className="px-5 pb-6 text-center text-xs text-zinc-600">
          Clicking a plan takes you to the full checkout page.
        </p>
      </div>
    </div>
  );
}
