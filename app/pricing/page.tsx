import Link from "next/link";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { buttonClass } from "@/components/ui/button";
import { 
  CheckCircle2, ArrowRight, Sparkles, Star, BookOpen, Brain, Users, 
  Layers, Target, Play, Clock, Zap, X
} from "lucide-react";
import { PLANS, formatPrice } from "@/lib/stripe-config";

export const metadata = {
  title: "Pricing — Complete Seerah Academy",
  description: "Choose your path: follow the Seerah story with Essentials, or master it with Complete Seerah's full study system.",
};

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-ink text-text">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 geo-pattern opacity-20" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/30 text-gold text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Founding Member Pricing Available
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text mb-5 leading-tight">
            Master the Life of the Prophet ﷺ —<br />
            <span className="text-gradient-gold">From Following to Mastery</span>
          </h1>
          <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed mb-6">
            <strong className="text-text">Essentials helps you follow the Seerah.</strong><br />
            <strong className="text-text">Complete Seerah helps you retain it, review it, and explain it with confidence.</strong>
          </p>
          <p className="text-sm text-text-muted max-w-xl mx-auto">
            Choose Essentials if you want a simple guided path through the Seerah.<br />
            Choose Complete Seerah if you want the full study system built for understanding, review, retention, and teaching.
          </p>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-text mb-3">
              Choose Your Learning Path
            </h2>
            <p className="text-text-secondary max-w-lg mx-auto">
              One-time payment. Lifetime access. No subscriptions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12">
            {/* Essentials Plan */}
            <div className="rounded-2xl border border-border bg-surface relative overflow-hidden p-7 flex flex-col">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                    {PLANS.essentials.name}
                  </p>
                  <span className="px-2 py-0.5 rounded bg-text-muted/10 text-xs text-text-muted">
                    {PLANS.essentials.subtitle}
                  </span>
                </div>
                <p className="text-5xl font-bold text-text mb-2">{formatPrice(PLANS.essentials.price)}</p>
                <p className="text-sm text-text-secondary mb-1">One-time payment · Lifetime access</p>
                <p className="text-xs text-text-muted italic mt-3">
                  Follow the Seerah story clearly from beginning to end
                </p>
              </div>

              <ul className="space-y-3 mb-6 flex-1">
                {PLANS.essentials.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-text-secondary">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-3">
                <p className="text-xs text-gold text-center font-medium">
                  Upgrade to Complete later for just $30
                </p>
                <Link
                  href="/signup-checkout?plan=essentials"
                  className={buttonClass("outline", "lg", "w-full justify-center")}
                >
                  Start Essentials
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <p className="text-xs text-text-muted text-center mt-4">
                Perfect for casual learners
              </p>
            </div>

            {/* Complete Plan */}
            <div className="rounded-2xl border-2 border-gold bg-gradient-to-b from-gold/8 to-surface relative overflow-hidden p-7 flex flex-col gold-glow">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
              <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-gold text-ink text-xs font-bold flex items-center gap-1 shadow-lg">
                <Star className="w-3 h-3 fill-current" />
                {PLANS.complete.badge?.toUpperCase()}
              </div>
              
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gold">
                    {PLANS.complete.name}
                  </p>
                  <span className="px-2 py-0.5 rounded bg-gold/10 text-xs text-gold font-medium">
                    {PLANS.complete.subtitle}
                  </span>
                </div>
                <div className="mb-2">
                  <p className="text-5xl font-bold text-text">{formatPrice(PLANS.complete.price)}</p>
                  <p className="text-sm text-text-muted line-through mt-1">
                    Regular: {formatPrice(PLANS.complete.regularPrice!)}
                  </p>
                </div>
                <p className="text-sm text-gold font-medium mb-1">
                  Founding Member Price · Lifetime access
                </p>
                <p className="text-xs text-text-secondary italic">
                  Available for the first {PLANS.complete.foundingMemberLimit} students
                </p>
                <p className="text-xs text-text-muted italic mt-3">
                  Understand, remember, review, and explain the Seerah with confidence
                </p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {PLANS.complete.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-text">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signup-checkout?plan=complete"
                className={buttonClass("primary", "lg", "w-full justify-center shadow-lg shadow-gold/20")}
              >
                Unlock Complete Seerah
                <ArrowRight className="w-4 h-4" />
              </Link>

              <p className="text-xs text-text-muted text-center mt-4">
                Recommended for parents, teachers, and serious students
              </p>
            </div>
          </div>

          {/* Complete Seerah Positioning */}
          <div className="max-w-3xl mx-auto mb-12 p-6 rounded-xl border border-gold/20 bg-gold-bg">
            <h3 className="text-lg font-semibold text-text mb-3 text-center">
              The Extra Resources Are Not Extra Work
            </h3>
            <p className="text-sm text-text-secondary text-center mb-4">
              They are shortcuts for review, teaching, and remembering.
            </p>
            <p className="text-sm text-text-muted text-center">
              Don't have time to rewatch a full lesson? Use the briefings, mind maps, flashcards, and infographics to review faster and remember more.
            </p>
          </div>

          {/* Urgency Message */}
          <div className="max-w-2xl mx-auto p-5 rounded-xl border border-gold/20 bg-gold-bg text-center">
            <p className="text-sm text-text-secondary leading-relaxed">
              <span className="font-semibold text-text">Founding Member pricing is limited</span> — only available for the first 500 students. After that, Complete Seerah returns to its regular price of $129.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 border-t border-border bg-surface/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-text text-center mb-10">
            Compare Plans
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border border-border rounded-xl overflow-hidden">
              <thead className="bg-surface/50">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-text border-b border-border">
                    Feature
                  </th>
                  <th className="p-4 text-sm font-semibold text-text border-b border-l border-border text-center">
                    Essentials
                  </th>
                  <th className="p-4 text-sm font-semibold text-gold border-b border-l border-border text-center bg-gold/5">
                    Complete Seerah
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Primary Goal", essentials: "Follow the story", complete: "Master and explain the story" },
                  { feature: "Lessons", essentials: "56 core lessons", complete: "100-part full program" },
                  { feature: "Videos", essentials: <CheckCircle2 className="w-5 h-5 text-text-muted mx-auto" />, complete: <CheckCircle2 className="w-5 h-5 text-gold mx-auto" /> },
                  { feature: "Quizzes", essentials: <CheckCircle2 className="w-5 h-5 text-text-muted mx-auto" />, complete: <CheckCircle2 className="w-5 h-5 text-gold mx-auto" /> },
                  { feature: "Progress Tracking", essentials: <CheckCircle2 className="w-5 h-5 text-text-muted mx-auto" />, complete: <CheckCircle2 className="w-5 h-5 text-gold mx-auto" /> },
                  { feature: "Retention Tools", essentials: "Quizzes only", complete: "Mind maps, flashcards, briefings" },
                  { feature: "Teaching Assets", essentials: <X className="w-5 h-5 text-red-500/50 mx-auto" />, complete: "Slides and infographics included" },
                  { feature: "Best For", essentials: "Casual learners", complete: "Parents, teachers, serious students" },
                  { feature: "Outcome", essentials: "Know the Seerah", complete: "Remember, review, and explain the Seerah" },
                ].map((row, idx) => (
                  <tr key={row.feature} className={idx % 2 === 0 ? "bg-surface/30" : ""}>
                    <td className="p-4 text-sm text-text-secondary border-b border-border font-medium">
                      {row.feature}
                    </td>
                    <td className="p-4 text-sm text-text-secondary border-b border-l border-border text-center">
                      {row.essentials}
                    </td>
                    <td className="p-4 text-sm text-text border-b border-l border-border text-center bg-gold/5 font-medium">
                      {row.complete}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-center text-sm text-text-muted mt-6">
            Both plans include lifetime access and no recurring charges
          </p>
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
              More than just content — you'll gain real understanding and confidence.
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

      {/* Trust/Proof Section */}
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
              {
                stat: "100",
                label: "Structured Seerah Parts",
                desc: "The complete chronological journey",
              },
              {
                stat: "8+",
                label: "Asset Types Per Part",
                desc: "Videos, summaries, slides, visuals, quizzes, study materials",
              },
              {
                stat: "Lifetime",
                label: "Access & Updates",
                desc: "One payment — own it forever",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="p-6 rounded-xl border border-border bg-surface text-center"
              >
                <p className="text-4xl font-bold text-gold mb-2">{item.stat}</p>
                <p className="font-semibold text-text text-sm mb-1">{item.label}</p>
                <p className="text-xs text-text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-text text-center mb-10">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-base font-semibold text-text mb-2">Is this a subscription?</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                No. This is a one-time payment. Pay once, own it forever. No recurring charges, no hidden fees, no subscriptions.
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-base font-semibold text-text mb-2">Do I get lifetime access?</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Yes! Once you purchase, you have lifetime access to all current content and all future updates at no extra cost.
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-base font-semibold text-text mb-2">What is the difference between Essentials and Complete?</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                <strong className="text-text">Essentials</strong> gives you 56 core lessons to follow the Seerah story — good for casual learners. <strong className="text-text">Complete</strong> includes all 100 parts PLUS the full mastery system: mind maps, flashcards, briefings, slides, and infographics. Complete is built for retention, review, and teaching.
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-base font-semibold text-text mb-2">Is this suitable for families?</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Absolutely. The content is structured for adults and older students. Many families use it together for family learning sessions or homeschooling.
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-base font-semibold text-text mb-2">Can teachers use this?</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Yes! Teachers use the videos, slides, study guides, and visuals to teach Seerah in classes, weekend schools, and study circles. The Complete plan is ideal for educators.
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-base font-semibold text-text mb-2">Will more content be added?</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Yes. During early access, we're continually improving and expanding the platform. All future content, features, and improvements are included at no extra cost when you purchase now.
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-base font-semibold text-text mb-2">Can I upgrade later?</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Yes! If you start with Essentials, you can upgrade to Complete anytime and only pay the difference ($30).
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-base font-semibold text-text mb-2">What is the Founding Member price?</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                The first 500 students get Complete Seerah for $79 (regular price: $129). This is a one-time opportunity to lock in the lower price forever.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
