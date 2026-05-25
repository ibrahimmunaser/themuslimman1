import Link from "next/link";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { buttonClass } from "@/components/ui/button";
import {
  CheckCircle2, ArrowRight, Sparkles, Star, BookOpen, Brain, Users,
  Layers, Target, Lock, Gift, RefreshCw, Infinity,
} from "lucide-react";
import { PLANS, formatPrice } from "@/lib/stripe-config";
import { getCurrentUser } from "@/lib/auth";
import { getUserAccessInfo } from "@/lib/access";
import { MonthlyCheckoutButton } from "@/components/pricing/monthly-checkout-button";
import { CreatorPromoTracker } from "@/components/promo/creator-promo-tracker";
import { LifetimePriceDisplay } from "@/components/pricing/lifetime-price-display";

export const metadata = {
  title: "Pricing — Complete Seerah",
  description:
    "Get full lifetime access to the structured 100-part Seerah journey. One-time payment or flexible monthly access.",
};

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const user = await getCurrentUser();

  let accessInfo: Awaited<ReturnType<typeof getUserAccessInfo>> | null = null;
  if (user) {
    accessInfo = await getUserAccessInfo(user.id);
  }

  const hasLifetime = accessInfo?.hasLifetime ?? false;
  const hasMonthly = !hasLifetime && (accessInfo?.hasActiveSubscription ?? false);
  const isLoggedIn = !!user;

  const monthly = PLANS.monthly;
  const lifetime = PLANS.complete;

  return (
    <div className="flex flex-col min-h-screen bg-ink text-text">
      <Navbar />

      {/* Capture ?promo= URL param and persist; show banner if creator promo active */}
      <CreatorPromoTracker showBanner />

      {/* Hero */}
      <section className="relative pt-16 pb-12 overflow-hidden">
        <div className="absolute inset-0 geo-pattern opacity-20" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/30 text-gold text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Simple Pricing
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text mb-5 leading-tight">
            Choose Your Path
          </h1>
          <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Full access to the complete 100-part Seerah journey — choose monthly or own it forever.
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="py-8 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">

            {/* ── Monthly ──────────────────────────────────────────────── */}
            <div className="relative p-7 rounded-2xl border border-border bg-surface flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-lg bg-surface-raised border border-border flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 text-text-secondary" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                  {monthly.name}
                </p>
              </div>

              <div className="mb-5">
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-4xl font-bold text-text">{formatPrice(monthly.price)}</span>
                  <span className="text-text-muted text-sm">/month</span>
                </div>
                <p className="text-sm text-text-secondary">Full access while subscribed · Cancel anytime</p>
              </div>

              <ul className="space-y-2.5 mb-7 flex-1">
                {monthly.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-text-secondary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-text-secondary">{f}</span>
                  </li>
                ))}
              </ul>

              {hasMonthly ? (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                  <p className="text-sm text-green-400 font-medium">✓ Monthly Access Active</p>
                  <Link href="/seerah" className="text-xs text-gold mt-1 hover:underline block">Go to course →</Link>
                </div>
              ) : hasLifetime ? (
                <div className="p-3 rounded-lg bg-gold/5 border border-gold/15 text-center">
                  <p className="text-xs text-gold">You have lifetime access</p>
                </div>
              ) : (
                <MonthlyCheckoutButton isLoggedIn={isLoggedIn} />
              )}
            </div>

            {/* ── Lifetime (Best Value) ─────────────────────────────────── */}
            <div className="relative p-7 rounded-2xl border-2 border-gold bg-gradient-to-b from-gold/8 to-surface flex flex-col gold-glow">
              <div className="absolute -top-3 right-5 px-3 py-1 rounded-full bg-gold text-ink text-xs font-bold flex items-center gap-1 shadow-lg z-10">
                <Star className="w-3 h-3 fill-current" />
                BEST VALUE
              </div>

              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-lg bg-gold/15 border border-gold/25 flex items-center justify-center">
                  <Infinity className="w-4 h-4 text-gold" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gold">
                  {lifetime.name}
                </p>
              </div>

              <LifetimePriceDisplay basePrice={lifetime.price} />

              <ul className="space-y-2.5 mb-7 flex-1">
                {lifetime.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-text">{f}</span>
                  </li>
                ))}
              </ul>

              {hasLifetime ? (
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
                    href="/signup-checkout?plan=complete"
                    className={buttonClass("primary", "lg", "w-full justify-center shadow-lg shadow-gold/20")}
                  >
                    Get Lifetime Access
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/gift-checkout"
                    className={buttonClass("ghost", "sm", "w-full justify-center border border-gold/20 text-gold/80 hover:bg-gold/5 text-xs")}
                  >
                    <Gift className="w-3.5 h-3.5" />
                    Gift This Course
                  </Link>
                </div>
              )}

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-text-muted">
                <Lock className="w-3.5 h-3.5" />
                <span>Secure payment · Instant access · 7-Day Guarantee</span>
              </div>
            </div>
          </div>

          {/* Monthly vs Lifetime comparison note */}
          <p className="text-center text-xs text-text-muted mt-6">
            At $9/month, lifetime access pays for itself in 11 months.
          </p>
        </div>
      </section>

      {/* What You'll Walk Away With */}
      <section className="py-16 border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-text mb-3">
              What You&apos;ll Walk Away With
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              More than just content — you&apos;ll gain real understanding of the Prophet&apos;s ﷺ life.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              {
                icon: <Target className="w-5 h-5" />,
                title: "A clear timeline of the Prophet's ﷺ life",
                desc: "Every event in order, so you can finally see the full picture from beginning to end.",
              },
              {
                icon: <BookOpen className="w-5 h-5" />,
                title: "Context behind every major event",
                desc: "Understand why things happened, what led to them, and their lasting impact.",
              },
              {
                icon: <Brain className="w-5 h-5" />,
                title: "Lessons that connect Seerah to real life",
                desc: "Not just history — practical wisdom you can apply today.",
              },
              {
                icon: <Layers className="w-5 h-5" />,
                title: "A structured system instead of scattered lectures",
                desc: "No more hunting for content — everything is organized for you.",
              },
              {
                icon: <Users className="w-5 h-5" />,
                title: "Confidence explaining Seerah to family",
                desc: "Feel prepared to teach, share, and discuss the Prophet's ﷺ life with clarity.",
              },
              {
                icon: <CheckCircle2 className="w-5 h-5" />,
                title: "The complete story — nothing missing",
                desc: "From pre-Islamic Arabia to the Prophet's ﷺ final days, with no gaps.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex flex-col gap-3 p-5 rounded-xl border border-border bg-surface hover:border-gold/20 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/15 flex items-center justify-center text-gold">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-text text-sm mb-1.5">{item.title}</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust stats */}
      <section className="py-16 border-t border-border bg-surface/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { stat: "100", label: "Structured Seerah Parts", desc: "The complete chronological journey" },
              { stat: "8+", label: "Asset Types Per Part", desc: "Videos, summaries, slides, visuals, quizzes, study materials" },
              { stat: "Lifetime", label: "Access Option", desc: "Pay once — own it forever" },
            ].map((item) => (
              <div key={item.label} className="p-6 rounded-xl border border-border bg-surface text-center">
                <p className="text-4xl font-bold text-gold mb-2">{item.stat}</p>
                <p className="font-semibold text-text text-sm mb-1">{item.label}</p>
                <p className="text-xs text-text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-text text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "What is the difference between monthly and lifetime?",
                a: "Monthly gives you full access for $9/month — cancel anytime and access stops at the end of your billing period. Lifetime is a one-time $49 payment that gives you permanent access, no recurring charges ever.",
              },
              {
                q: "What happens if I cancel monthly?",
                a: "You keep full access until the end of your current billing period. After that, access stops. You can resubscribe anytime.",
              },
              {
                q: "Can I upgrade from monthly to lifetime?",
                a: "Yes — contact support and we'll help you make the switch. We can credit your recent monthly payment toward the lifetime price.",
              },
              {
                q: "What does Complete Seerah include?",
                a: "You get the full 100-part Seerah journey: video lessons, briefings, quizzes, flashcards, mind maps, visual resources, study guides, and guided progress tracking.",
              },
              {
                q: "Is there a free option?",
                a: "Yes — Part 1 is completely free with no account required. Visit /part-1 to access it.",
              },
              {
                q: "What is the 7-Day Clarity Guarantee?",
                a: "If you start the course and feel it isn't what you expected, contact us within 7 days for a full refund — no questions asked.",
              },
              {
                q: "Will more content be added?",
                a: "Yes. All future content and improvements are included at no extra cost for both monthly and lifetime members.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="bg-surface border border-border rounded-xl p-6">
                <h3 className="text-base font-semibold text-text mb-2">{q}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      {!accessInfo?.hasAccess && (
        <section className="py-16 border-t border-border bg-surface/30">
          <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to start?</h2>
            <p className="text-text-secondary mb-8">
              $9/month or $49 lifetime. Full access. 7-Day Clarity Guarantee.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/signup-checkout?plan=complete"
                className={buttonClass("primary", "xl", "shadow-lg shadow-gold/25")}
              >
                Get Lifetime Access
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/gift-checkout"
                className={buttonClass("ghost", "xl", "border border-gold/30 text-gold hover:bg-gold/5")}
              >
                <Gift className="w-5 h-5" />
                Gift This Course
              </Link>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
