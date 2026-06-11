import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  BookOpen, Smartphone, Users,
  ShieldCheck, Lock, Zap, CheckCircle2, Play,
  GraduationCap, Infinity as InfinityIcon,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { Footer } from "@/components/landing/footer";
import { generateSignedR2Url, VIDEO_URL_EXPIRY } from "@/lib/r2";
import { DeenPromoSetter } from "./deen-promo-setter";
import { R2VideoPlayer } from "./r2-video-player";
import { Part1PreviewCard } from "./part1-preview-card";
import { MobileStickyCta } from "./mobile-sticky-cta";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Complete Seerah — Deen Responds Exclusive Offer",
  description:
    "Learn the life of the Prophet ﷺ in order. 100 lessons, video, audio, quizzes, and more. 20% off lifetime access for Deen Responds viewers.",
  robots: { index: false, follow: false },
};

// ── URL constants ─────────────────────────────────────────────────────────────
const PROMO = "DEEN";
const UTM   = "utm_source=youtube&utm_medium=influencer&utm_campaign=seerah_launch&utm_content=deenresponds";

const INDIVIDUAL_URL  = `/checkout?plan=individual-lifetime&promo=${PROMO}&${UTM}`;
const FAMILY_URL      = `/checkout?plan=family-lifetime&promo=${PROMO}&${UTM}`;
const MONTHLY_URL     = `/checkout?plan=individual-trial&${UTM}`;

const SPONSOR_VIDEO_KEY = "Deen/deenrespondslandingpage.mp4";

// ── Shared button styles ──────────────────────────────────────────────────────
const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold transition-colors shadow-lg shadow-gold/25";
const outlineBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-gold/40 text-gold font-semibold hover:bg-gold/5 transition-colors";

// ── What's Included (6 clear items) ──────────────────────────────────────────
const INCLUDED_ITEMS = [
  { Icon: BookOpen,      label: "100-Part Seerah Course"      },
  { Icon: GraduationCap, label: "Chronological Lessons"       },
  { Icon: CheckCircle2,  label: "Student Dashboard"           },
  { Icon: Smartphone,    label: "Mobile Friendly"             },
  { Icon: Users,         label: "Individual & Family Access"  },
  { Icon: InfinityIcon,  label: "Lifetime Access"             },
];

// ── FAQ ───────────────────────────────────────────────────────────────────────
const FAQ = [
  {
    q: "Can I try it before paying?",
    a: "Yes. Part 1 is completely free — full video, audio, quiz, and flashcards. No signup, no payment.",
  },
  {
    q: "Do I need to enter a promo code?",
    a: "No. The 20% Deen Responds discount is applied automatically at checkout.",
  },
  {
    q: "Is there a refund policy?",
    a: "Yes — 7-Day Clarity Guarantee. If the Seerah isn't becoming clearer and more connected for you within 7 days, email us for a full refund. No questions asked.",
  },
  {
    q: "What happens right after I buy?",
    a: "You create an account (or sign in) and get immediate access to all 100 parts through your student dashboard.",
  },
];

export default async function DeenRespondsPage() {
  // Track page visit for influencer analytics — fire-and-forget.
  prisma.influencerClick
    .create({ data: { id: crypto.randomUUID(), creator: "deenresponds" } })
    .catch(() => {});

  // Pre-sign the sponsor video URL (4-hour expiry).
  let sponsorVideoUrl: string | null = null;
  try {
    sponsorVideoUrl = await generateSignedR2Url(SPONSOR_VIDEO_KEY, VIDEO_URL_EXPIRY);
  } catch {
    // Page still renders; video section shows graceful fallback.
  }

  return (
    <div className="flex flex-col min-h-screen bg-ink text-text">
      {/* Persist DEEN promo to localStorage so it auto-applies at checkout */}
      <DeenPromoSetter />

      {/* ── Sticky promo bar ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-50 bg-[#1a150a]/95 border-b border-gold/20 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          <p className="text-sm text-gold font-medium">
            <span className="hidden sm:inline">🎁 </span>
            Deen Responds viewers:{" "}
            <span className="font-bold">20% off lifetime access</span>
          </p>
          <a
            href="#pricing"
            className="shrink-0 text-xs font-bold text-ink bg-gold hover:bg-gold-light px-4 py-1.5 rounded-lg transition-colors"
          >
            Get Access
          </a>
        </div>
      </div>

      {/* ── Minimal landing header (no nav leaks) ─────────────────────────── */}
      <header className="py-3 px-4 sm:px-6 border-b border-white/5 bg-ink">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logoicon.png"
              alt="Complete Seerah"
              width={967}
              height={219}
              className="h-9 sm:h-11 w-auto"
              priority
            />
          </Link>
          <a
            href="#pricing"
            className={`${primaryBtn} hidden sm:inline-flex px-5 py-2.5 text-sm`}
          >
            Get Access — 20% Off
          </a>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-14 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 1000px 600px at 50% -5%, rgba(200,169,110,0.10) 0%, transparent 70%)" }}
          aria-hidden
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          {/* Two-column: text left, phone mockup right (desktop only) */}
          <div className="xl:grid xl:grid-cols-[1fr_340px] xl:gap-16 xl:items-center">

            {/* ── Text column ── */}
            <div className="text-center xl:text-left">
              <div className="inline-flex items-center gap-2 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                <p className="text-sm text-gold font-semibold uppercase tracking-widest">
                  As seen on Deen Responds
                </p>
                <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              </div>

              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-7">
                Learn the Life of the{" "}
                <br className="hidden sm:block" />
                Prophet ﷺ{" "}
                <span className="text-gradient-gold">in Order</span>
              </h1>

              <p className="text-xl sm:text-2xl text-text-secondary max-w-2xl mx-auto xl:mx-0 mb-12 leading-relaxed">
                A 100-part Seerah program — step by step, beginning to end — so the Prophet&apos;s ﷺ life finally makes sense as one connected story.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center xl:justify-start gap-4 mb-10">
                <a href="#preview" className={`${outlineBtn} w-full sm:w-auto px-8 py-4 text-base`}>
                  Watch Part 1 Free
                </a>
                <a href="#pricing" className={`${primaryBtn} w-full sm:w-auto px-8 py-4 text-base`}>
                  Get Lifetime Access — 20% Off
                </a>
              </div>

              <div className="flex items-center justify-center xl:justify-start gap-4 sm:gap-6 text-xs text-text-muted flex-wrap">
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-gold/60" />7-day guarantee</span>
                <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-gold/60" />Instant access</span>
                <span className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5 text-gold/60" />Mobile friendly</span>
                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-gold/60" />Individual &amp; family plans</span>
              </div>
            </div>

            {/* ── Phone mockup (desktop only) ── */}
            <div className="hidden xl:flex justify-center items-center">
              <div className="relative">
                {/* Ambient glow */}
                <div className="absolute -inset-8 bg-gold/8 rounded-full blur-3xl" />
                {/* Phone frame */}
                <div className="relative w-[300px] bg-zinc-900 rounded-[44px] border-2 border-zinc-700/60 shadow-2xl shadow-black/60 p-2 overflow-hidden">
                  {/* Screen */}
                  <div className="bg-zinc-950 rounded-[36px] overflow-hidden">
                    {/* Notch */}
                    <div className="h-7 bg-zinc-900 flex items-center justify-center">
                      <div className="w-16 h-3.5 bg-zinc-800 rounded-full" />
                    </div>
                    {/* App header */}
                    <div className="px-4 pt-3 pb-1.5 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-gold/20 flex items-center justify-center">
                        <span className="text-[8px] text-gold font-bold">CS</span>
                      </div>
                      <span className="text-xs text-gold font-semibold">Complete Seerah</span>
                    </div>
                    {/* Video thumbnail */}
                    <div className="mx-4 aspect-video bg-zinc-800 rounded-xl relative overflow-hidden mb-3">
                      <div
                        className="absolute inset-0"
                        style={{ background: "linear-gradient(135deg, #2a1f08 0%, #1a1208 100%)" }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-gold/80 flex items-center justify-center shadow-lg shadow-gold/30">
                          <Play className="w-4 h-4 text-ink fill-ink ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute bottom-1.5 left-3 text-[9px] text-white/50">Part 1 of 100</div>
                    </div>
                    {/* Part info */}
                    <div className="px-4 mb-3">
                      <div className="text-[9px] text-zinc-500 uppercase tracking-wider mb-0.5">Part 1</div>
                      <div className="text-[11px] text-white font-semibold leading-snug">The Pre-Islamic Arabian Context</div>
                    </div>
                    {/* Resource type pills */}
                    <div className="px-4 flex gap-1.5 mb-4 flex-wrap">
                      {["Video", "Audio", "Quiz", "Cards"].map((r) => (
                        <span key={r} className="text-[9px] text-gold/70 bg-gold/8 border border-gold/20 rounded-md px-2 py-0.5">
                          {r}
                        </span>
                      ))}
                    </div>
                    {/* Progress */}
                    <div className="px-4 pb-4">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-[9px] text-zinc-500">Progress</span>
                        <span className="text-[9px] text-gold">1 / 100</span>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full">
                        <div className="h-full w-[1%] bg-gold rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Sponsor Video ─────────────────────────────────────────────────── */}
      <section className="py-16 bg-surface/30 border-y border-border/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              Heard about us from Deen Responds?
            </h2>
            <p className="text-text-secondary text-sm">
              Watch what they said — then try Part 1 for free before you buy anything.
            </p>
          </div>

          {sponsorVideoUrl ? (
            <R2VideoPlayer
              url={sponsorVideoUrl}
              title="Deen Responds — Complete Seerah"
              label="Deen Responds on TheMuslimMan Seerah Program"
            />
          ) : (
            <div className="relative w-full aspect-video rounded-2xl border border-border bg-surface flex items-center justify-center">
              <p className="text-sm text-text-muted">Video temporarily unavailable.</p>
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#preview" className={`${outlineBtn} px-6 py-3 text-sm`}>
              Watch Part 1 Free
            </a>
            <a href="#pricing" className={`${primaryBtn} px-6 py-3 text-sm`}>
              Get Access — 20% Off
            </a>
          </div>
        </div>
      </section>

      {/* ── Problem ──────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-5">
            Most Muslims Know Seerah in Pieces
          </h2>
          <p className="text-text-secondary mb-8 leading-relaxed text-lg">
            You know the famous events — Hira, the Hijrah, Badr, Uhud — but not how the full life of the Prophet ﷺ flows from beginning to end.
          </p>

          <div className="flex flex-col gap-2 mb-8 max-w-md mx-auto text-left">
            {["Not random clips.", "Not scattered lectures.", "Not isolated stories without the full timeline."].map((line) => (
              <div key={line} className="flex items-center gap-3 py-3 px-4 rounded-xl bg-red-500/5 border border-red-500/15">
                <span className="text-red-400/70 font-bold text-base leading-none flex-shrink-0">×</span>
                <span className="text-sm text-red-400/80">{line}</span>
              </div>
            ))}
          </div>

          <p className="text-gold font-semibold text-lg">
            This course gives you a clear path through the Prophet&apos;s ﷺ life, in order.
          </p>
        </div>
      </section>

      {/* ── Free Preview ─────────────────────────────────────────────────── */}
      <section id="preview" className="py-16 sm:py-20 bg-surface/20 border-y border-border/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Start With Part 1 — Free</h2>
            <p className="text-text-secondary">
              Watch the full first lesson before you buy anything. No signup, no payment.
            </p>
          </div>

          <Part1PreviewCard />

          {/* Post-preview purchase hook */}
          <div className="mt-8 p-6 rounded-2xl bg-gold/5 border border-gold/20 text-center">
            <p className="font-semibold text-text mb-1">That was Part 1 of 100.</p>
            <p className="text-sm text-text-secondary mb-6">
              If that felt right, get the full course today — 20% off for Deen Responds viewers.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={INDIVIDUAL_URL}
                className={`${primaryBtn} px-6 py-3.5 text-sm`}
              >
                Individual Access — $63.20
              </Link>
              <Link
                href={FAMILY_URL}
                className={`${outlineBtn} px-6 py-3.5 text-sm`}
              >
                Family Access — $119.20
              </Link>
            </div>
            <p className="text-xs text-text-muted mt-4">
              🛡️ 7-day clarity guarantee · Instant access · Cancel anytime (monthly)
            </p>
          </div>
        </div>
      </section>

      {/* ── What's Included ──────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">What&apos;s Included</h2>
          <p className="text-text-secondary text-sm mb-10">
            Everything you need to learn the full Seerah — in one plan, at one price.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
            {INCLUDED_ITEMS.map(({ Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 p-4 rounded-xl border border-border bg-surface hover:border-gold/30 transition-colors text-left"
              >
                <Icon className="w-5 h-5 text-gold flex-shrink-0" />
                <span className="text-sm font-medium text-text leading-tight">{label}</span>
              </div>
            ))}
          </div>

          <a href="#pricing" className={`${primaryBtn} px-8 py-4 text-base`}>
            See Pricing Options
          </a>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-16 sm:py-24 bg-surface/20 border-y border-border/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/25 text-gold text-xs font-bold uppercase tracking-wider mb-5">
            Exclusive for Deen Responds Viewers
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
            Deen Responds Lifetime Offer
          </h2>
          <p className="text-text-secondary text-base mb-12">
            20% off lifetime access — automatically applied at checkout. No code needed.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">

            {/* Individual */}
            <div className="relative rounded-2xl border border-border bg-surface p-8 flex flex-col text-center">
              {/* Most popular badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-surface border border-gold/40 text-gold">
                  Most Popular
                </span>
              </div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                Individual Lifetime
              </p>
              <p className="text-sm text-text-secondary mb-6">For one learner</p>

              <div className="mb-6">
                <p className="text-sm text-text-muted line-through">$79</p>
                <p className="text-5xl sm:text-6xl font-bold text-gold leading-none mt-1">$63.20</p>
                <p className="text-xs text-emerald-400 mt-2 font-medium">You save $15.80</p>
              </div>

              <ul className="space-y-1.5 text-left mb-8">
                {["All 100 parts, unlocked immediately", "Video, audio, quiz, flashcards, mind maps", "Progress tracking dashboard", "Mobile app access"].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-text-secondary">
                    <CheckCircle2 className="w-3.5 h-3.5 text-gold flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <Link
                  href={INDIVIDUAL_URL}
                  className="block w-full py-4 px-5 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-sm text-center transition-colors shadow-lg shadow-gold/20"
                >
                  Get Individual Access — $63.20
                </Link>
              </div>
            </div>

            {/* Family */}
            <div className="relative rounded-2xl border border-gold/30 bg-gold/5 p-8 flex flex-col text-center">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold text-ink">
                  Best Value for Families
                </span>
              </div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                Family Lifetime
              </p>
              <p className="text-sm text-text-secondary mb-6">
                Parents &amp; households — up to 5 learners
              </p>

              <div className="mb-6">
                <p className="text-sm text-text-muted line-through">$149</p>
                <p className="text-5xl sm:text-6xl font-bold text-gold leading-none mt-1">$119.20</p>
                <p className="text-xs text-emerald-400 mt-2 font-medium">You save $29.80</p>
              </div>

              <ul className="space-y-1.5 text-left mb-8">
                {["Everything in Individual", "5 separate learner profiles", "Each profile tracks progress independently", "One payment for the whole household"].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-text-secondary">
                    <CheckCircle2 className="w-3.5 h-3.5 text-gold flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <Link
                  href={FAMILY_URL}
                  className="block w-full py-4 px-5 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-sm text-center transition-colors shadow-lg shadow-gold/20"
                >
                  Get Family Access — $119.20
                </Link>
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 flex-wrap text-xs text-text-muted mb-6">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-gold/70" />
              7-Day Clarity Guarantee
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-gold/70" />
              Secure Payment
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-gold/70" />
              Instant Access
            </span>
          </div>

          <p className="text-sm text-text-muted">
            Not ready to commit?{" "}
            <Link href={MONTHLY_URL} className="text-gold hover:text-gold-light underline underline-offset-2">
              Start with 7 days for $1
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">Quick Questions</h2>

          <div className="space-y-3">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="p-5 rounded-xl bg-surface border border-border">
                <p className="font-semibold text-text mb-1.5">{q}</p>
                <p className="text-sm text-text-secondary leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-surface/20 border-t border-border/50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            Begin the Seerah From the First Lesson
          </h2>
          <p className="text-text-secondary text-lg mb-10">
            Watch Part 1 free, or get lifetime access with the Deen Responds discount.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <a href="#preview" className={`${outlineBtn} w-full sm:w-auto px-8 py-4 text-base`}>
              Watch Part 1 Free
            </a>
            <a
              href="#pricing"
              className={`${primaryBtn} w-full sm:w-auto px-8 py-4 text-base`}
            >
              Choose Lifetime Access
            </a>
          </div>

          <div className="mt-8 pt-8 border-t border-border/50 flex items-center justify-center gap-6 flex-wrap text-xs text-text-muted">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-gold/60" />7-Day Clarity Guarantee</span>
            <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-gold/60" />Secure Payment</span>
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-gold/60" />Instant Access</span>
          </div>
        </div>
      </section>

      {/* pb-20 accounts for the mobile sticky CTA bar so footer text isn't hidden */}
      <div className="pb-20 sm:pb-0">
        <Footer />
      </div>

      {/* ── Sticky mobile CTA (fixed bottom, mobile only) ─────────────────── */}
      <MobileStickyCta />
    </div>
  );
}
