import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronDown, Play } from "lucide-react";
import {
  FadeUp,
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
    "Learn the life of Prophet Muhammad ﷺ in order — 100 structured lessons with video, reading, quizzes, and flashcards. Lifetime access for $49.",
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
          1. HERO — what it is, price, CTAs
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
              Learn the life of the Prophet ﷺ{" "}
              <span className="text-gradient-gold">in order — beginning to end.</span>
            </h1>
          </FadeUp>

          <FadeUp delay={0.1}>
            <p className="text-base sm:text-xl text-text-secondary max-w-2xl mx-auto mb-2 leading-relaxed">
              A structured 100-part course with videos, readings, quizzes, flashcards,
              and progress tracking — one connected story.
            </p>
            <p className="text-sm sm:text-base text-text-secondary max-w-xl mx-auto mb-2">
              Available in <span className="text-text font-semibold">English</span>,{" "}
              <span className="text-text font-semibold">Arabic</span>, and{" "}
              <span className="text-text font-semibold">French</span>
              {" "}— with more languages planned.
            </p>
            <p className="text-base sm:text-lg font-semibold text-gold mb-6">
              $49 one-time · Lifetime access
            </p>
          </FadeUp>

          <FadeUp delay={0.2}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="/checkout?plan=individual-lifetime"
                data-track="hero_cta_checkout_click"
                data-plan="individual-lifetime"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-10 py-4 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-lg transition-colors shadow-xl shadow-gold/25"
              >
                Get Lifetime Access
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
              One-time payment · 7-day refund · Part 1 is free — no signup required
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ============================================================
          2. SHORT PROBLEM — trimmed, non-judgmental
      ============================================================ */}
      <section className="border-t border-border bg-surface/40 px-4 sm:px-6 py-10">
        <div className="max-w-2xl mx-auto space-y-4 text-base sm:text-lg leading-relaxed text-center">
          <p className="text-text-secondary">
            Most of us know Badr, Uhud, and the Hijrah as{" "}
            <span className="text-text font-semibold">scattered stories</span>
            {" "}— memorable moments, but not one continuous path.
          </p>
          <p className="text-text font-semibold">
            This course gives you the full Seerah in order — from beginning to end.
          </p>
        </div>
      </section>

      {/* ============================================================
          3. PART 1 FREE PREVIEW — proof early
      ============================================================ */}
      <section id="preview" className="pt-8 pb-10 sm:pb-12 border-t border-border bg-surface/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <FadeUp className="text-center mb-8">
            <p className="text-gold text-xs font-bold uppercase tracking-widest mb-2">
              Free · No Account Required · EN · عربي · FR
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              Experience Part 1 free
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto text-sm sm:text-base">
              See the real lesson format — video, reading, slides, quiz, and flashcards —
              before you buy. Switch languages anytime.
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
            <Part1FullPreview hideCta />
          </Suspense>
        </div>
      </section>

      {/* ============================================================
          4. WHAT EVERY LESSON INCLUDES — real examples, not icons only
      ============================================================ */}
      <section className="py-12 border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              What every lesson includes
            </h2>
            <p className="text-text-secondary text-sm sm:text-base max-w-xl mx-auto">
              Each of the 100 parts uses the same tools — so you learn, review, and retain
              the story in order.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-5">
            {/* Slide example */}
            <div className="rounded-2xl border border-border bg-surface overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gold">Slides</p>
                <p className="text-[10px] text-text-muted">Part 1 · sample</p>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-center bg-gradient-to-b from-surface-raised/80 to-surface min-h-[180px]">
                <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Key idea</p>
                <p className="text-base sm:text-lg font-bold text-text leading-snug mb-3">
                  Pre-Islamic Arabia was not a blank slate
                </p>
                <ul className="space-y-1.5 text-xs sm:text-sm text-text-secondary">
                  <li className="flex gap-2"><span className="text-gold">•</span> Trade routes shaped Makkah&apos;s power</li>
                  <li className="flex gap-2"><span className="text-gold">•</span> Tribal loyalty defined justice</li>
                  <li className="flex gap-2"><span className="text-gold">•</span> The Kaʿbah was already central</li>
                </ul>
              </div>
            </div>

            {/* Flashcard example */}
            <div className="rounded-2xl border border-border bg-surface overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gold">Flashcards</p>
                <p className="text-[10px] text-text-muted">Flip to review</p>
              </div>
              <div className="p-4 flex-1 flex flex-col gap-3 min-h-[180px]">
                <div className="rounded-xl border border-gold/25 bg-gold/[0.06] p-4 text-center">
                  <p className="text-[10px] text-gold font-semibold uppercase tracking-wider mb-2">Front</p>
                  <p className="text-sm font-semibold text-text leading-snug">
                    What was the main religious practice in Makkah before Islam?
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-surface-raised p-4 text-center">
                  <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider mb-2">Back</p>
                  <p className="text-sm text-text-secondary leading-snug">
                    Idol worship centered on the Kaʿbah, alongside remnants of monotheistic traditions.
                  </p>
                </div>
              </div>
            </div>

            {/* Quiz example */}
            <div className="rounded-2xl border border-border bg-surface overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gold">Quiz</p>
                <p className="text-[10px] text-text-muted">Check understanding</p>
              </div>
              <div className="p-4 flex-1 flex flex-col min-h-[180px]">
                <p className="text-sm font-semibold text-text leading-snug mb-3">
                  Why was Makkah important before the Prophet ﷺ was born?
                </p>
                <div className="space-y-2">
                  {[
                    { label: "A", text: "It controlled key trade routes", active: true },
                    { label: "B", text: "It had a large standing army", active: false },
                    { label: "C", text: "It was the capital of an empire", active: false },
                  ].map((opt) => (
                    <div
                      key={opt.label}
                      className={[
                        "flex items-start gap-2.5 rounded-lg border px-3 py-2 text-xs sm:text-sm",
                        opt.active
                          ? "border-gold/40 bg-gold/10 text-text"
                          : "border-border bg-surface-raised/50 text-text-secondary",
                      ].join(" ")}
                    >
                      <span className={`font-bold ${opt.active ? "text-gold" : "text-text-muted"}`}>
                        {opt.label}
                      </span>
                      <span>{opt.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-text-muted mt-5">
            Plus video lessons, readings, summaries, mind maps, and progress tracking in every part.
          </p>
        </div>
      </section>

      {/* ============================================================
          5. TRUST — sources & methodology
      ============================================================ */}
      <section className="py-10 border-t border-border bg-surface/30">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-3">Built with care for accuracy</h2>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-4">
            The course follows classical Seerah sources in a clear, structured path —
            teaching the life of the Prophet ﷺ as one connected story, not isolated anecdotes.
            We document our approach, sources, and limits so you know what you&apos;re learning.
          </p>
          <Link
            href="/methodology"
            className="inline-flex text-sm font-semibold text-gold hover:text-gold-light transition-colors"
          >
            Read our sources &amp; methodology →
          </Link>
        </div>
      </section>

      {/* ============================================================
          6. PRICING — after proof
      ============================================================ */}
      <PricingSection
        hasLifetime={!!(user?.hasPaid)}
        hasMonthly={false}
        hasFamily={user?.planType === "family"}
        variant="lifetime-only"
        compact
      />

      {/* ============================================================
          7. WHAT HAPPENS AFTER YOU BUY — brief
      ============================================================ */}
      <section className="py-10 border-t border-border bg-surface/30">
        <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-1">
            After you buy
          </h2>
          <p className="text-text-secondary text-sm mb-6">
            Instant access — usually under a minute to your first lesson.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3">
            {[
              { step: "1", title: "Create your account", sub: "Set your password from our email." },
              { step: "2", title: "Start learning", sub: "Open Part 1 immediately." },
              { step: "3", title: "Continue in order", sub: "Progress saves as you go." },
            ].map((item) => (
              <div
                key={item.step}
                className="flex-1 flex flex-col items-center gap-1.5 p-4 rounded-xl border border-border bg-surface"
              >
                <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center mb-0.5">
                  <span className="text-gold font-bold text-sm">{item.step}</span>
                </div>
                <p className="text-sm font-bold text-text">{item.title}</p>
                <p className="text-xs text-text-muted leading-relaxed">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          8. FAQ
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
                q: "What sources does the course use?",
                a: "The course is prepared from classical Seerah material with a clear Sunni presentation. See our Methodology page for sources, approach, and what this course is — and is not.",
              },
              {
                q: "What languages is the course available in?",
                a: "Complete Seerah is available in English, Arabic, and French — including lessons, quizzes, flashcards, and reference guides. More languages are planned.",
              },
              {
                q: "Is there a refund guarantee?",
                a: "Yes — 7-day guarantee. If the course does not feel right, email us within 7 days for a full refund. No questions asked.",
              },
              {
                q: "Is this a subscription?",
                a: "No. Complete Seerah is $49 one-time for lifetime access — no subscription and no recurring charges.",
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
                  {item.q === "What sources does the course use?" && (
                    <>
                      {" "}
                      <Link href="/methodology" className="text-gold hover:underline">
                        Read the methodology →
                      </Link>
                    </>
                  )}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          9. FINAL CTA
      ============================================================ */}
      <section className="py-16 sm:py-24 border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 geo-pattern opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gold/5 rounded-full blur-3xl" />

        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-4xl font-bold mb-3 leading-tight">
            Start the Prophet&apos;s ﷺ life in order
          </h2>
          <p className="text-sm sm:text-base text-text-secondary mb-2 max-w-lg mx-auto">
            One structured path. 100 lessons. Video, reading, quiz, flashcards — all in order.
          </p>
          <p className="text-gold font-semibold text-base mb-7">$49 one-time · Lifetime access</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/checkout?plan=individual-lifetime"
              data-track="final_checkout_clicked"
              data-plan="individual-lifetime"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-10 py-4 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-lg transition-colors shadow-xl shadow-gold/20"
            >
              Get Lifetime Access
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
