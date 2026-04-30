import Link from "next/link";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { buttonClass } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, Sparkles, Star } from "lucide-react";
import { PLANS, formatPrice } from "@/lib/stripe-config";

export const metadata = {
  title: "Pricing — Seerah LMS",
};

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-ink text-text">
      <Navbar />

      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 geo-pattern opacity-20" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/30 text-gold text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Launch Special Pricing
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-text mb-4">Master the complete Seerah</h1>
          <p className="text-lg text-text-secondary max-w-xl mx-auto">
            One-time payment. Lifetime access. Start learning today.
          </p>
        </div>
      </section>

      <section className="py-12 pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Essentials Plan */}
            <div className="rounded-2xl border border-border bg-surface relative overflow-hidden p-8">
              <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">
                  {PLANS.essentials.name}
                </p>
                <p className="text-5xl font-bold text-text mb-2">{formatPrice(PLANS.essentials.price)}</p>
                <p className="text-sm text-text-secondary">One-time payment · Lifetime access</p>
              </div>

              <ul className="space-y-3 mb-8 min-h-[280px]">
                {PLANS.essentials.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-text">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signup-checkout?plan=essentials"
                className={buttonClass("outline", "lg", "w-full justify-center")}
              >
                Get Essentials
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Complete Plan */}
            <div className="rounded-2xl border border-gold/40 bg-gradient-to-b from-gold/8 to-surface relative overflow-hidden p-8">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-gold text-ink text-xs font-bold flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" />
                RECOMMENDED
              </div>
              
              <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">
                  {PLANS.complete.name}
                </p>
                <p className="text-5xl font-bold text-text mb-2">{formatPrice(PLANS.complete.price)}</p>
                <p className="text-sm text-gold font-medium">One-time payment · Lifetime access</p>
              </div>

              <ul className="space-y-3 mb-8 min-h-[280px]">
                {PLANS.complete.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-text">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signup-checkout?plan=complete"
                className={buttonClass("primary", "lg", "w-full justify-center")}
              >
                Get Complete Access
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* FAQ section */}
          <div className="mt-16 space-y-6 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-text text-center mb-8">Frequently Asked Questions</h2>
            
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-text mb-2">What's the difference between plans?</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Essentials includes 20-30 core parts covering the essential Seerah timeline. Complete includes all 100+ parts with the full chronological journey and additional study materials.
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-text mb-2">Is this a one-time payment?</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Yes! Pay once, own forever. No subscriptions, no recurring charges, no hidden fees.
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-text mb-2">Can I upgrade later?</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Yes, you can upgrade from Essentials to Complete at any time and only pay the difference.
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-text mb-2">Do I get all future updates?</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Yes! Your purchase includes all future content updates, improvements, and new features at no extra cost.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
