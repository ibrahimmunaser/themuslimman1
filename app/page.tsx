import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Play,
  BarChart2,
} from "lucide-react";
import { FadeUp, StaggerChildren, AnimatedCard, FloatingGlow, IslamicPatternBackground } from "@/components/motion";
import { PricingSection } from "@/components/pricing/pricing-section";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { Part1FullPreview } from "@/components/landing/part1-full-preview";
import { HomepageTracker } from "@/components/landing/homepage-tracker";
import { getCurrentUser } from "@/lib/auth";
import { hasActiveCourseAccess } from "@/lib/access";
import { CreatorPromoTracker } from "@/components/promo/creator-promo-tracker";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Complete Seerah | Learn the Life of Prophet Muhammad ﷺ",
  description:
    "Learn the life of Prophet Muhammad ﷺ in order — 100 structured lessons with video, reading, quizzes, and flashcards. Start with Part 1 free.",
  openGraph: {
    title: "Complete Seerah | Learn the Life of Prophet Muhammad ﷺ",
    description:
      "Learn the life of Prophet Muhammad ﷺ in order — 100 lessons, one connected story.",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "https://themuslimman.com",
    siteName: "Complete Seerah",
  },
};

export default async function LandingPage() {
  let user = null;

  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }

  if (user) {
    const hasAccess = await hasActiveCourseAccess(user.id, user.hasPaid);
    if (hasAccess) {
      redirect("/seerah");
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-ink text-text">
      <HomepageTracker />
      <Navbar />
      <CreatorPromoTracker />

      {/* ============================================================
          HERO
      ============================================================ */}
      <section className="relative pt-10 pb-4 sm:pt-14 sm:pb-16 md:pt-20 md:pb-20 overflow-hidden">
        <div className="absolute inset-0 geo-pattern opacity-40" />
        <IslamicPatternBackground className="absolute inset-0" opacity={0.025} />
        <FloatingGlow className="absolute -top-20 left-1/2 -translate-x-1/2" width={700} height={400} duration={10} />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 800px 400px at 50% 0%, rgba(200,169,110,0.06) 0%, transparent 70%)" }}
          aria-hidden
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="xl:grid xl:grid-cols-[1fr_400px] xl:gap-16 xl:items-center">

            {/* Left: headline + CTAs */}
            <div className="text-center xl:text-left xl:py-10">
              <FadeUp delay={0}>
                <h1 className="text-[1.85rem] sm:text-5xl md:text-6xl xl:text-5xl 2xl:text-6xl font-bold tracking-tight leading-[1.2] sm:leading-tight mb-5">
                  Most Muslims only know fragments of the Seerah.{" "}
                  <span className="text-gradient-gold">Learn it as one connected story.</span>
                </h1>
              </FadeUp>

              <FadeUp delay={0.1}>
                <p className="text-base sm:text-xl text-text-secondary max-w-2xl mx-auto xl:mx-0 mb-6 leading-relaxed">
                  Start with Part 1 free, then continue through a structured 100-part path
                  with video, reading, quizzes, flashcards, and progress tracking.
                </p>
              </FadeUp>

              <FadeUp delay={0.2}>
                <div className="flex flex-col items-center xl:items-start gap-3">
                  {/* Primary CTA — scrolls to Part 1 preview */}
                  <a
                    href="#preview"
                    data-track="hero_watch_part1_clicked"
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-10 py-4 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-lg transition-colors shadow-xl shadow-gold/25"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    Watch Part 1 Free
                  </a>
                  {/* Secondary CTA — smaller, clearly secondary */}
                  <a
                    href="/checkup"
                    data-track="hero_score_clicked"
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 rounded-xl bg-surface border border-border hover:border-gold/40 text-text-secondary hover:text-text font-semibold text-base transition-colors"
                  >
                    <BarChart2 className="w-4 h-4 text-gold" />
                    See My Seerah Score
                  </a>
                  <p className="text-sm sm:text-base text-text-muted text-center xl:text-left font-medium">
                    Part 1 is free · Score takes 2 minutes · No payment required
                  </p>
                </div>
              </FadeUp>
            </div>

            {/* Right: static course structure preview — desktop only */}
            <div className="hidden xl:block">
              <div className="rounded-2xl border border-border/60 bg-surface shadow-2xl shadow-black/50 overflow-hidden">

                {/* Header */}
                <div className="px-5 py-4 bg-surface-raised border-b border-border flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gold uppercase tracking-widest mb-0.5">Complete Seerah Path</p>
                    <p className="text-sm font-semibold text-text">100 structured lessons · one connected story</p>
                  </div>
                  <span className="text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full flex-shrink-0">
                    Part 1 Free
                  </span>
                </div>

                {/* Progress visual */}
                <div className="px-5 pt-4 pb-3 border-b border-border/40">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-text-muted">Your progress</span>
                    <span className="text-xs font-semibold text-gold">Part 1 of 100</span>
                  </div>
                  <div className="h-2 bg-surface-raised rounded-full overflow-hidden">
                    <div className="h-full w-[1%] bg-gold rounded-full" />
                  </div>
                  <div className="flex gap-1.5 mt-2.5 flex-wrap">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full ${i === 0 ? "bg-gold" : "bg-surface-raised"}`}
                      />
                    ))}
                    <span className="text-[10px] text-text-muted ml-1 self-center">···</span>
                  </div>
                </div>

                {/* What's in each lesson */}
                <div className="px-5 py-4">
                  <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-3">Every lesson includes</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {[
                      "Video lesson",
                      "Reading",
                      "Slides",
                      "Quiz",
                      "Flashcards",
                      "Mind map",
                      "Summary",
                      "Progress tracking",
                    ].map((f) => (
                      <div key={f} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-gold/70 flex-shrink-0" />
                        <span className="text-sm text-text-secondary">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Free badge footer */}
                <div className="px-5 pb-4 border-t border-border/30 pt-3 flex items-center justify-between">
                  <p className="text-xs text-text-muted">
                    <span className="text-gold font-semibold">Part 1 is free.</span> No account, no payment.
                  </p>
                  <a
                    href="#preview"
                    data-track="hero_card_watch_clicked"
                    className="text-xs font-semibold text-gold hover:text-gold-light transition-colors flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Watch now
                  </a>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          FREE PART 1 PREVIEW
      ============================================================ */}
      <section id="preview" className="pt-8 pb-12 sm:py-16 border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <FadeUp className="text-center mb-8" data-track="part1_preview_viewed">
            <p className="text-gold text-sm font-medium uppercase tracking-widest mb-3">
              Free to watch — no account required
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              Part 1 is completely free
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto mb-2">
              The full first lesson — video, reading, slides, quiz, and flashcards.
              This is exactly what every lesson in the course looks like.
            </p>
            <p className="text-sm font-medium">
              <span className="text-gold">Part 1 is free.</span>{" "}
              <span className="text-text-muted">Full access unlocks the complete 100-part path.</span>
            </p>
          </FadeUp>

          <Suspense fallback={
            <div className="rounded-2xl border border-border bg-surface overflow-hidden p-8">
              <div className="space-y-4">
                <div className="h-6 bg-surface-raised rounded w-1/3" />
                <div className="h-4 bg-surface-raised rounded w-1/2" />
                <div className="mt-6 aspect-video bg-surface-raised rounded-xl" />
              </div>
            </div>
          }>
            <Part1FullPreview
              checkoutHref="/checkout?plan=individual-monthly"
              ctaLabel="Continue the full 100-part path"
            />
          </Suspense>
        </div>
      </section>

      {/* ============================================================
          COMPACT CHECKUP BRIDGE — before pricing
      ============================================================ */}
      <div className="border-t border-border bg-surface/40 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="font-semibold text-text">Not sure how much Seerah you actually know?</p>
              <p className="text-sm text-text-muted mt-0.5">See your clarity score in 2 minutes · free · no account needed</p>
            </div>
            <a
              href="/checkup"
              data-track="homepage_checkup_preprice_click"
              className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-surface border border-gold/30 hover:border-gold/60 hover:bg-gold/5 text-text font-semibold text-sm transition-all whitespace-nowrap"
            >
              <BarChart2 className="w-4 h-4 text-gold" />
              See My Seerah Score
            </a>
          </div>
        </div>
      </div>

      {/* ============================================================
          PRICING
      ============================================================ */}
      <PricingSection
        hasLifetime={!!(user?.hasPaid)}
        hasMonthly={false}
        hasFamily={user?.planType === "family"}
      />

      {/* ============================================================
          WHY SCATTERED VIDEOS DO NOT WORK
      ============================================================ */}
      <section className="py-16 border-t border-border bg-surface/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Why scattered videos do not work
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Most people watch random clips about the Prophet ﷺ but never build the full
              timeline. The issue is not interest. The issue is structure.
              This course solves that — one path, in order, from Part 1 to Part 100.
            </p>
          </div>

          <StaggerChildren className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto" stagger={0.07}>
            {[
              { label: "100 lessons in chronological order" },
              { label: "Each part builds on the one before" },
              { label: "Quizzes reinforce what you just learned" },
              { label: "Flashcards help you retain key events" },
              { label: "Mind maps show the full picture" },
              { label: "Your own pace — no deadlines" },
            ].map(({ label }) => (
              <AnimatedCard key={label} lift className="flex items-center gap-3 p-4 rounded-xl border border-border bg-surface hover:border-gold/20 transition-colors">
                <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0" />
                <span className="text-sm text-text">{label}</span>
              </AnimatedCard>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ============================================================
          WHAT EVERY LESSON INCLUDES
      ============================================================ */}
      <section className="py-16 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              What every lesson includes
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Eight learning tools per lesson — not to add more work, but to make the story stick.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 max-w-4xl mx-auto">
            {[
              { icon: "▶",  title: "Video lesson"      },
              { icon: "📖", title: "Reading"            },
              { icon: "🖼", title: "Slides"             },
              { icon: "📝", title: "Quiz"               },
              { icon: "🗂", title: "Flashcards"         },
              { icon: "🗺", title: "Mind map"           },
              { icon: "📋", title: "Summary"            },
              { icon: "📊", title: "Progress tracking"  },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-surface hover:border-gold/20 transition-colors"
              >
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <span className="text-sm font-medium text-text leading-tight">{item.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          WHAT HAPPENS AFTER YOU BUY
      ============================================================ */}
      <section className="py-16 border-t border-border bg-surface/30">
        <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-2">
            What happens after you buy?
          </h2>
          <p className="text-text-secondary mb-10">Instant access. Under 60 seconds to your first lesson.</p>

          <div className="flex flex-col sm:flex-row items-stretch justify-center gap-4">
            {[
              { step: "1", title: "Create your account",    sub: "Set your password from the email we send." },
              { step: "2", title: "Get instant access",     sub: "Start immediately — no waiting." },
              { step: "3", title: "Continue lesson by lesson", sub: "Go at your own pace. Progress saves automatically." },
            ].map((item) => (
              <div
                key={item.step}
                className="flex-1 flex flex-col items-center gap-2 p-5 rounded-xl border border-border bg-surface"
              >
                <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center mb-1">
                  <span className="text-gold font-bold">{item.step}</span>
                </div>
                <p className="text-sm font-bold text-text">{item.title}</p>
                <p className="text-xs text-text-muted leading-relaxed">{item.sub}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-text-muted mt-6">
            Family plan: up to 5 separate learner profiles, each tracking their own progress.
          </p>
        </div>
      </section>

      {/* ============================================================
          FAQ
      ============================================================ */}
      <section id="faq" className="py-16 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              Quick questions
            </h2>
          </div>

          <div className="space-y-2">
            {[
              {
                q: "Is Part 1 free?",
                a: "Yes — full video, reading, slides, flashcards, and quiz. No account or payment required.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes. Cancel in 2 clicks from your dashboard. No call required. Monthly billing stops immediately.",
              },
              {
                q: "Is there a refund?",
                a: "Yes — 7-day clarity guarantee. If the course does not feel right, email us within 7 days for a full refund. No questions asked.",
              },
              {
                q: "Can my family use it?",
                a: "Yes. The family plan includes up to 5 separate learner profiles, each tracking their own progress independently.",
              },
              {
                q: "Can I use it on mobile?",
                a: "Yes. Works on phone, tablet, and desktop. Many students learn during commutes or before bed.",
              },
              {
                q: "What happens after I buy?",
                a: "You get instant access. Set your password from the email we send, create your profile, and start Part 1 — all in under 60 seconds.",
              },
            ].map((item, i) => (
              <details
                key={item.q}
                className="group rounded-xl border border-border bg-surface overflow-hidden"
                open={i === 0}
              >
                <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none rounded-xl font-semibold text-text hover:bg-surface-raised transition-colors">
                  <span>{item.q}</span>
                  <ChevronDown
                    className="w-4 h-4 text-text-muted flex-shrink-0 transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <div className="px-5 pb-5 pt-1 text-sm text-text-secondary leading-relaxed border-t border-border/50">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          FINAL CTA
      ============================================================ */}
      <section className="py-20 md:py-28 border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 geo-pattern opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gold/5 rounded-full blur-3xl" />

        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 leading-tight">
            Start the Prophet&apos;s ﷺ Life in Order
          </h2>
          <p className="text-base text-text-secondary mb-8 max-w-lg mx-auto">
            Part 1 is free and starts immediately — no account, no payment.
            When you&apos;re ready, unlock the full 100-part path.
          </p>

          <div className="flex flex-col items-center gap-3 mb-5">
            <a
              href="#preview"
              data-track="final_watch_part1_clicked"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-10 py-4 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-lg transition-colors shadow-xl shadow-gold/20"
            >
              <Play className="w-5 h-5 fill-current" />
              Watch Part 1 Free
            </a>
            <Link
              href="/checkout?plan=individual-monthly"
              data-track="final_checkout_clicked"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-10 py-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-bold text-base transition-colors"
            >
              Start Full Access — $4.99/month
            </Link>
          </div>

          <p className="text-xs text-text-muted/50">
            Cancel anytime · 7-day refund guarantee · Secure checkout
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
