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
      <section className="relative pt-10 pb-12 sm:pt-14 sm:pb-16 md:pt-20 md:pb-20 overflow-hidden">
        <div className="absolute inset-0 geo-pattern opacity-40" />
        <IslamicPatternBackground className="absolute inset-0" opacity={0.025} />
        <FloatingGlow className="absolute -top-20 left-1/2 -translate-x-1/2" width={700} height={400} duration={10} />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 800px 400px at 50% 0%, rgba(200,169,110,0.06) 0%, transparent 70%)" }}
          aria-hidden
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="xl:grid xl:grid-cols-[1fr_420px] xl:gap-16 xl:items-center">

            {/* Left: headline + CTAs */}
            <div className="text-center xl:text-left py-4 xl:py-10">
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
                <div className="flex flex-col items-center xl:items-start gap-3 mb-4">
                  <Link
                    href="/watch-free"
                    data-track="homepage_watch_part1_click"
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-10 py-4 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-lg transition-colors shadow-xl shadow-gold/25"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    Watch Part 1 Free
                  </Link>
                  <p className="text-sm sm:text-base text-text-muted/80 text-center xl:text-left font-medium">
                    Part 1 is free · No signup required · Start in minutes
                  </p>
                  <p className="text-sm text-text-muted/50 text-center xl:text-left">
                    Not sure where you stand?{" "}
                    <Link
                      href="/theorthodoxmuslim"
                      data-track="homepage_checkup_click"
                      className="inline-flex items-center gap-1 text-text-muted hover:text-gold transition-colors underline underline-offset-2"
                    >
                      <BarChart2 className="w-3.5 h-3.5" />
                      Take the free Seerah Checkup
                    </Link>
                  </p>
                </div>
              </FadeUp>
            </div>

            {/* Right: product visual — xl+ only */}
            <div className="hidden xl:block">
              <div className="rounded-2xl border border-border/60 bg-surface shadow-2xl shadow-black/50 overflow-hidden">
                <div className="bg-surface-raised border-b border-border px-4 py-2.5 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <span className="text-[10px] text-text-muted bg-surface px-2.5 py-0.5 rounded border border-border/50">
                      themuslimman.com/seerah/part-1
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex gap-1.5 mb-3">
                    {[
                      { label: "Video",      active: true  },
                      { label: "Read",       active: false },
                      { label: "Slides",     active: false },
                      { label: "Quiz",       active: false },
                      { label: "Flashcards", active: false },
                    ].map(({ label, active }) => (
                      <span
                        key={label}
                        className={`text-[10px] px-2 py-1 rounded-md border ${
                          active
                            ? "bg-gold/15 text-gold border-gold/30 font-semibold"
                            : "text-text-muted border-border/30"
                        }`}
                      >
                        {label}
                      </span>
                    ))}
                  </div>

                  <div className="relative aspect-video rounded-xl overflow-hidden mb-3">
                    <div
                      className="absolute inset-0"
                      style={{ background: "radial-gradient(ellipse 80% 60% at 50% 40%, #2a1f0a 0%, #130e04 50%, #0a0804 100%)" }}
                    />
                    <div
                      className="absolute inset-0 opacity-[0.06]"
                      style={{
                        backgroundImage: "repeating-linear-gradient(45deg, #c9a84c 0, #c9a84c 1px, transparent 0, transparent 50%)",
                        backgroundSize: "20px 20px",
                      }}
                    />
                    <div className="absolute top-0 inset-x-0 flex items-center justify-between px-3 pt-2.5 pb-6"
                         style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)" }}>
                      <span className="text-[9px] font-semibold text-gold/80 uppercase tracking-widest">Part 1 of 100</span>
                      <span className="text-[9px] font-bold text-text-muted/70 border border-border/50 px-1 rounded">HD</span>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-gold/20 border-2 border-gold/50 flex items-center justify-center shadow-lg shadow-gold/20 backdrop-blur-sm">
                        <div className="w-0 h-0 ml-1"
                             style={{ borderTop: "8px solid transparent", borderBottom: "8px solid transparent", borderLeft: "14px solid #c9a84c" }} />
                      </div>
                    </div>
                    <div className="absolute bottom-0 inset-x-0 px-3 pb-2.5 pt-6"
                         style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)" }}>
                      <p className="text-[10px] font-semibold text-white/90 mb-1.5 truncate">
                        The World Before the Prophet ﷺ
                      </p>
                      <div className="relative h-[3px] bg-white/20 rounded-full">
                        <div className="absolute left-0 top-0 h-full w-[38%] bg-gold rounded-full" />
                        <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-gold shadow shadow-gold/40"
                             style={{ left: "calc(38% - 5px)" }} />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[9px] text-white/50">4:53</span>
                        <span className="text-[9px] text-white/40">12:47</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3 px-0.5">
                    {[
                      { val: "Free", sub: "Part 1"   },
                      { val: "∞",    sub: "Access"   },
                      { val: "✓",    sub: "Your pace" },
                    ].map(({ val, sub }) => (
                      <div key={sub} className="text-center py-2 rounded-lg bg-surface-raised border border-border/40">
                        <p className="text-sm font-bold text-gold leading-none">{val}</p>
                        <p className="text-[10px] text-text-muted mt-0.5">{sub}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {["Video", "Reading", "Slides", "Quiz", "Flashcards", "Mind maps"].map((f) => (
                      <span key={f} className="flex items-center gap-1 text-[10px] text-text-secondary bg-surface-raised border border-border/40 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-2.5 h-2.5 text-gold/60 flex-shrink-0" aria-hidden />
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          FREE PART 1 PREVIEW
      ============================================================ */}
      <section id="preview" className="py-16 border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <FadeUp className="text-center mb-10">
            <p className="text-gold text-sm font-medium uppercase tracking-widest mb-3">
              Free to watch — no account required
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              Part 1 is completely free
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              The full first lesson — video, reading, slides, quiz, and flashcards.
              This is exactly what every lesson in the course looks like.
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
          PRICING — immediately after preview
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
            <Link
              href="/watch-free"
              data-track="homepage_watch_part1_click"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-10 py-4 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-lg transition-colors shadow-xl shadow-gold/20"
            >
              <Play className="w-5 h-5 fill-current" />
              Watch Part 1 Free
            </Link>
            <Link
              href="/checkout?plan=individual-monthly"
              data-track="homepage_checkout_click"
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
