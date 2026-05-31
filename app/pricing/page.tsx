import Link from "next/link";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { buttonClass } from "@/components/ui/button";
import {
  ArrowRight, Sparkles, BookOpen, Brain, Users,
  Layers, Target, Gift, CheckCircle2, ChevronDown,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getUserAccessInfo } from "@/lib/access";
import { CreatorPromoTracker } from "@/components/promo/creator-promo-tracker";
import { PricingSection } from "@/components/pricing/pricing-section";

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
    accessInfo = await getUserAccessInfo(user.id, user.hasPaid);
  }

  const hasLifetime = accessInfo?.hasLifetime ?? false;
  const hasMonthly  = !hasLifetime && (accessInfo?.hasActiveSubscription ?? false);
  const hasFamily   = user?.planType === "family";
  const isLoggedIn  = !!user;

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

      <PricingSection
        hasLifetime={hasLifetime}
        hasMonthly={hasMonthly}
        hasFamily={hasFamily}
        isLoggedIn={isLoggedIn}
      />

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
          <div className="space-y-3">
            {[
              {
                q: "What is the difference between monthly and lifetime?",
                a: "Monthly gives you full access for $9/month — cancel anytime and access stops at the end of your billing period. Lifetime is a one-time $99 payment that gives you permanent access, no recurring charges ever.",
              },
              {
                q: "What happens if I cancel monthly?",
                a: "You keep full access until the end of your current billing period. After that, access stops. You can resubscribe anytime.",
              },
              {
                q: "Can I upgrade from monthly to lifetime?",
                a: "Yes — contact support and we&apos;ll help you make the switch. We can credit your recent monthly payment toward the lifetime price.",
              },
              {
                q: "What does Complete Seerah include?",
                a: "You get the full 100-part Seerah journey: video lessons, briefings, quizzes, flashcards, mind maps, visual resources, study guides, and guided progress tracking.",
              },
              {
                q: "Is there a free option?",
                a: "Yes — Part 1 is completely free with no account required. You can access it from the homepage.",
              },
              {
                q: "What is the 7-Day Clarity Guarantee?",
                a: "If you start the course and feel it isn&apos;t what you expected, contact us within 7 days for a full refund — no questions asked.",
              },
              {
                q: "Will more content be added?",
                a: "Yes. All future content and improvements are included at no extra cost for both monthly and lifetime members.",
              },
            ].map(({ q, a }, i) => (
              <details
                key={q}
                className="group rounded-xl border border-border bg-surface overflow-hidden"
                open={i === 0}
              >
                <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none font-semibold text-text hover:bg-surface-raised transition-colors">
                  <span>{q}</span>
                  <ChevronDown
                    className="w-4 h-4 text-text-muted flex-shrink-0 transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <div className="px-5 pb-5 pt-1 text-sm text-text-secondary leading-relaxed border-t border-border/50">
                  {a}
                </div>
              </details>
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
              Individual from $9/month or $99 lifetime. Family from $19/month or $199 lifetime. 7-Day Clarity Guarantee.
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
