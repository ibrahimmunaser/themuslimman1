import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { CheckCircle2, ChevronDown, Play } from "lucide-react";
import {
  FadeUp,
  StaggerChildren,
  AnimatedCard,
  FloatingGlow,
  IslamicPatternBackground,
} from "@/components/motion";
import { PricingSection } from "@/components/pricing/pricing-section";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { Part1FullPreview } from "@/components/landing/part1-full-preview";
import { HomepageTracker } from "@/components/landing/homepage-tracker";
import { getCurrentUser } from "@/lib/auth";
import { hasActiveCourseAccess } from "@/lib/access";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Complete Seerah | Learn the Life of Prophet Muhammad ﷺ",
  description:
    "Learn the life of Prophet Muhammad ﷺ in order — 100 structured lessons with video, reading, quizzes, and flashcards. Start for only $4.99/month.",
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
    if (hasAccess) redirect("/seerah");
  }

  return (
    <div className="flex flex-col min-h-screen bg-ink text-text">
      <HomepageTracker />
      <Navbar />

      {/* ============================================================
          1. HERO
      ============================================================ */}
      <section className="relative pt-10 pb-8 sm:pt-16 sm:pb-14 overflow-hidden">
        <div className="absolute inset-0 geo-pattern opacity-40" />
        <IslamicPatternBackground className="absolute inset-0" opacity={0.025} />
        <FloatingGlow className="absolute -top-20 left-1/2 -translate-x-1/2" width={700} height={400} duration={10} />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 800px 400px at 50% 0%, rgba(200,169,110,0.06) 0%, transparent 70%)" }}
          aria-hidden
        />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <FadeUp delay={0}>
            <h1 className="text-[1.85rem] sm:text-5xl font-bold tracking-tight leading-[1.2] sm:leading-tight mb-4">
              Most Muslims only know fragments of the Seerah.{" "}
              <span className="text-gradient-gold">Learn the life of the Prophet ﷺ in order.</span>
            </h1>
          </FadeUp>

          <FadeUp delay={0.1}>
            <p className="text-base sm:text-xl text-text-secondary max-w-2xl mx-auto mb-2 leading-relaxed">
              A structured 100-part course with videos, readings, quizzes, flashcards,
              summaries, and progress tracking.
            </p>
            <p className="text-base sm:text-lg font-semibold text-gold mb-6">
              Start for only $4.99/month.
            </p>
          </FadeUp>

          <FadeUp delay={0.2}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="/checkout?plan=individual-monthly"
                data-track="hero_cta_checkout_click"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-10 py-4 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-lg transition-colors shadow-xl shadow-gold/25"
              >
                Start for $4.99/month
              </a>
              <a
                href="#preview"
                data-track="hero_watch_free_click"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 rounded-xl bg-surface border border-border hover:border-gold/40 text-text font-semibold text-base transition-colors"
              >
                <Play className="w-4 h-4 text-gold fill-current" />
                Watch Part 1 Free
              </a>
            </div>
            <p className="text-xs sm:text-sm text-text-muted text-center mt-3">
              Cancel anytime · 7-day refund · Part 1 is free — no signup required
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ============================================================
          2. SHORT PROBLEM SECTION
      ============================================================ */}
      <section className="border-t border-border bg-surface/40 px-4 sm:px-6 py-10">
        <div className="max-w-2xl mx-auto space-y-4 text-base sm:text-lg leading-relaxed text-center">
          <p className="text-text-secondary">
            Most of us know Badr, Uhud, and the Hijrah as scattered stories. But if asked to
            explain the Prophet&apos;s ﷺ life from beginning to end,{" "}
            <span className="text-text font-semibold">many of us would struggle.</span>
          </p>
          <p className="text-text-secondary">
            Many of us and our children know entertainment, sports, shows, games, and characters
            better than we know the life of the Prophet ﷺ.{" "}
            <span className="text-gold font-semibold">That should bother us.</span>
          </p>
          <p className="text-text font-semibold">
            This course gives you the full Seerah in order — one structured path from beginning
            to end.
          </p>
        </div>
      </section>

      {/* ============================================================
          3. PRICING  (before Part 1 preview)
      ============================================================ */}
      <PricingSection
        hasLifetime={!!(user?.hasPaid)}
        hasMonthly={false}
        hasFamily={user?.planType === "family"}
      />

      {/* ============================================================
          4. PART 1 FREE PREVIEW  (framed as secondary / proof)
      ============================================================ */}
      <section id="preview" className="pt-8 pb-10 sm:pb-12 border-t border-border bg-surface/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <FadeUp className="text-center mb-8">
            <p className="text-gold text-xs font-bold uppercase tracking-widest mb-2">
              Free · No Account Required
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              Not ready yet? Watch Part 1 free first.
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto text-sm sm:text-base">
              See the full quality of the course before you start — video, reading, slides,
              quiz, and flashcards. This is exactly what every lesson looks like.
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
              ctaLabel="Start for $4.99/month"
            />
          </Suspense>

          <div className="mt-6 text-center">
            <a
              href="/checkout?plan=individual-monthly"
              data-track="homepage_part1_bottom_cta_click"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-base transition-colors shadow-lg shadow-gold/20"
            >
              Start for $4.99/month
            </a>
            <p className="text-xs text-text-muted mt-2">Cancel anytime · 7-day refund guarantee</p>
          </div>
        </div>
      </section>

      {/* ============================================================
          5. WHAT EVERY LESSON INCLUDES
      ============================================================ */}
      <section className="py-12 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              What every lesson includes
            </h2>
            <p className="text-text-secondary text-sm sm:text-base">
              Eight learning tools per lesson — built to make the story stick.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { icon: "▶",  title: "Video lesson"     },
              { icon: "📖", title: "Reading"           },
              { icon: "📝", title: "Quiz"              },
              { icon: "🗂", title: "Flashcards"        },
              { icon: "🖼", title: "Slides"            },
              { icon: "🗺", title: "Mind map"          },
              { icon: "📋", title: "Summary"           },
              { icon: "📊", title: "Progress tracking" },
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
          6. WHAT HAPPENS AFTER YOU BUY
      ============================================================ */}
      <section className="py-12 border-t border-border bg-surface/30">
        <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-1">
            What happens after you buy?
          </h2>
          <p className="text-text-secondary text-sm mb-8">
            Instant access. Under 60 seconds to your first lesson.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch justify-center gap-4">
            {[
              { step: "1", title: "Create your account",       sub: "Set your password from the email we send." },
              { step: "2", title: "Get instant access",        sub: "Start immediately — no waiting." },
              { step: "3", title: "Continue lesson by lesson", sub: "Go at your own pace. Progress saves automatically." },
            ].map((item) => (
              <div
                key={item.step}
                className="flex-1 flex flex-col items-center gap-2 p-5 rounded-xl border border-border bg-surface"
              >
                <div className="w-9 h-9 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center mb-1">
                  <span className="text-gold font-bold text-sm">{item.step}</span>
                </div>
                <p className="text-sm font-bold text-text">{item.title}</p>
                <p className="text-xs text-text-muted leading-relaxed">{item.sub}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-text-muted mt-5">
            Family plan: up to 5 separate learner profiles, each tracking their own progress.
          </p>
        </div>
      </section>

      {/* ============================================================
          7. FAQ  (5 questions)
      ============================================================ */}
      <section id="faq" className="py-12 border-t border-border">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Quick questions</h2>

          <div className="space-y-2">
            {[
              {
                q: "Is Part 1 free?",
                a: "Yes — full video, reading, slides, flashcards, and quiz. No account or payment required.",
                open: true,
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes. Cancel in 2 clicks from your dashboard. No call required. Monthly billing stops immediately.",
              },
              {
                q: "Is there a refund guarantee?",
                a: "Yes — 7-day guarantee. If the course does not feel right, email us within 7 days for a full refund. No questions asked.",
              },
              {
                q: "Is this for families?",
                a: "Yes. The family plan includes up to 5 separate learner profiles, each tracking their own progress independently.",
              },
              {
                q: "Do I get instant access after buying?",
                a: "Yes. You get access immediately. Set your password from the email we send, create your profile, and start Part 1 — all in under 60 seconds.",
              },
            ].map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border border-border bg-surface overflow-hidden"
                open={item.open}
              >
                <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none font-semibold text-text hover:bg-surface-raised transition-colors">
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
          8. FINAL CTA
      ============================================================ */}
      <section className="py-16 sm:py-24 border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 geo-pattern opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gold/5 rounded-full blur-3xl" />

        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-4xl font-bold mb-3 leading-tight">
            Start the Prophet&apos;s ﷺ Life in Order
          </h2>
          <p className="text-sm sm:text-base text-text-secondary mb-2 max-w-lg mx-auto">
            One structured path. 100 lessons. Video, reading, quiz, flashcards — all in order.
          </p>
          <p className="text-gold font-semibold text-base mb-7">$4.99/month · Cancel anytime</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/checkout?plan=individual-monthly"
              data-track="final_checkout_clicked"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-10 py-4 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-lg transition-colors shadow-xl shadow-gold/20"
            >
              Start for $4.99/month
            </Link>
            <a
              href="#preview"
              data-track="final_watch_part1_clicked"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 rounded-xl bg-surface border border-border hover:border-gold/40 text-text font-semibold text-base transition-colors"
            >
              <Play className="w-4 h-4 text-gold fill-current" />
              Watch Part 1 Free
            </a>
          </div>

          <p className="text-xs text-text-muted/50 mt-4">
            7-day refund guarantee · Secure checkout · Instant access
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
