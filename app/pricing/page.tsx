import Link from "next/link";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { buttonClass } from "@/components/ui/button";
import {
  CheckCircle2, ArrowRight, Sparkles, Star, BookOpen, Brain, Users,
  Layers, Target, Lock,
} from "lucide-react";
import { PLANS, formatPrice } from "@/lib/stripe-config";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata = {
  title: "Pricing — Complete Seerah Early Access",
  description:
    "Get full lifetime access to the structured 100-part Seerah journey. One-time payment. $99 early access price — regular price $149.",
};

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const user = await getCurrentUser();
  let hasPurchase = false;

  if (user) {
    const purchases = await prisma.purchase.findMany({
      where: { userId: user.id, status: "succeeded" },
    });
    hasPurchase = purchases.length > 0;
  }

  const plan = PLANS.complete;

  return (
    <div className="flex flex-col min-h-screen bg-ink text-text">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-16 pb-16 overflow-hidden">
        <div className="absolute inset-0 geo-pattern opacity-20" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/30 text-gold text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Early Access Now Open
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text mb-5 leading-tight">
            Complete Seerah Early Access
          </h1>
          <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            One complete package. The full structured 100-part Seerah — everything you need to learn, review, and retain it.
          </p>
        </div>
      </section>

      {/* Single pricing card */}
      <section className="py-12 border-t border-border">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="relative p-8 rounded-2xl border-2 border-gold bg-gradient-to-b from-gold/8 to-surface flex flex-col gold-glow">
            <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-gold text-ink text-xs font-bold flex items-center gap-1 shadow-lg z-10">
              <Star className="w-3 h-3 fill-current" />
              EARLY ACCESS
            </div>

            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-gold mb-3">
                {plan.name}
              </p>
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-5xl font-bold text-text">{formatPrice(plan.price)}</span>
                <div>
                  <p className="text-text-muted text-sm line-through">
                    {formatPrice(plan.regularPrice!)}
                  </p>
                  <p className="text-xs text-gold">Early access price · 14-day offer</p>
                </div>
              </div>
              <p className="text-sm text-gold font-medium mb-1">
                One-time payment · Lifetime access
              </p>
              <p className="text-xs text-text-secondary italic">
                {plan.subtitle}
              </p>
            </div>

            <ul className="space-y-3 mb-8 grid sm:grid-cols-2 gap-x-6">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-text">{feature}</span>
                </li>
              ))}
            </ul>

            {hasPurchase ? (
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center mb-3">
                <p className="text-sm text-green-400 font-medium">✓ You have Complete Access</p>
                <Link href="/seerah" className="text-xs text-gold mt-1 hover:underline block">
                  Go to your course →
                </Link>
              </div>
            ) : (
              <Link
                href="/signup-checkout?plan=complete"
                className={buttonClass("primary", "lg", "w-full justify-center shadow-lg shadow-gold/20")}
              >
                Get Complete Access
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-text-muted">
              <Lock className="w-3.5 h-3.5" />
              <span>Secure payment · Instant access · 7-Day Clarity Guarantee</span>
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Walk Away With */}
      <section className="py-16 border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-text mb-3">
              What You'll Walk Away With
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              More than just content — you'll gain real understanding and confidence about the Prophet's ﷺ life.
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
                desc: "Not just history — practical wisdom you can apply to your own life today.",
              },
              {
                icon: <Layers className="w-5 h-5" />,
                title: "A structured system instead of scattered lectures",
                desc: "No more hunting for content or losing your place — everything is organized for you.",
              },
              {
                icon: <Users className="w-5 h-5" />,
                title: "Confidence explaining Seerah to family or students",
                desc: "Feel prepared to teach, share, and discuss the Prophet's ﷺ life with clarity.",
              },
              {
                icon: <CheckCircle2 className="w-5 h-5" />,
                title: "The complete story — nothing missing",
                desc: "From pre-Islamic Arabia to the Prophet's ﷺ final days, with no gaps in between.",
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
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-text mb-3">
              Built as a Complete Study System
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              Not random content — a professionally structured curriculum designed for real learning.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { stat: "100", label: "Structured Seerah Parts", desc: "The complete chronological journey" },
              { stat: "8+", label: "Asset Types Per Part", desc: "Videos, summaries, slides, visuals, quizzes, study materials" },
              { stat: "Lifetime", label: "Access & Updates", desc: "One payment — own it forever" },
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
                q: "Is this a subscription?",
                a: "No. This is a one-time payment. Pay once, own it forever. No recurring charges, no hidden fees, no subscriptions.",
              },
              {
                q: "Do I get lifetime access?",
                a: "Yes. Once you purchase, you have lifetime access to all current content and all future updates at no extra cost.",
              },
              {
                q: "What does Complete Seerah Early Access include?",
                a: "You get the full 100-part Seerah journey: video lessons, briefings, quizzes, flashcards, mind maps, visual resources, study guides, reports, and guided progress tracking.",
              },
              {
                q: "Is this suitable for families?",
                a: "Absolutely. The content is structured for adults and older students. Many families use it together for family learning sessions or homeschooling.",
              },
              {
                q: "Can teachers use this?",
                a: "Yes. Teachers use the videos, slides, study guides, and visuals to teach Seerah in classes, weekend schools, and study circles.",
              },
              {
                q: "Will more content be added?",
                a: "Yes. During early access, we are continually improving and expanding the platform. All future content and improvements are included at no extra cost.",
              },
              {
                q: "What is the early access price?",
                a: "During the 14-day early access window, Complete Seerah is available for $99. The regular price is $149. Early access students lock in the lower price permanently with lifetime access.",
              },
              {
                q: "What if I'm not satisfied?",
                a: "We offer a 7-Day Clarity Guarantee. If you start the course and feel it isn't what you expected, contact us within 7 days for a full refund.",
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
      {!hasPurchase && (
        <section className="py-16 border-t border-border bg-surface/30">
          <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to start?</h2>
            <p className="text-text-secondary mb-8">
              $99 one-time early access price. Lifetime access. 7-Day Clarity Guarantee.
            </p>
            <Link
              href="/signup-checkout?plan=complete"
              className={buttonClass("primary", "xl", "shadow-lg shadow-gold/25")}
            >
              Get Complete Access
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
