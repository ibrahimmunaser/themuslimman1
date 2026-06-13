import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  Smartphone, Users, ShieldCheck, Lock, Zap, CheckCircle2, Play,
  Video, Monitor, LayoutGrid, FileText, ListChecks,
  GitBranch, Layers, HelpCircle,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { Footer } from "@/components/landing/footer";
import { generateSignedR2Url, VIDEO_URL_EXPIRY } from "@/lib/r2";
import { BrowniePromoSetter } from "./brownie-promo-setter";
import { BrownieAnalytics } from "./brownie-analytics";
import { R2VideoPlayer } from "@/app/deenresponds/r2-video-player";
import { Part1FullPreview } from "@/components/landing/part1-full-preview";
import { MobileStickyCta } from "@/app/deenresponds/mobile-sticky-cta";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Complete Seerah — Browniesaadi Exclusive Offer",
  description:
    "Learn the life of the Prophet ﷺ in order. 100 lessons, video, audio, quizzes, and more. Exclusive pricing for Browniesaadi viewers.",
  robots: { index: false, follow: false },
};

// ── URL constants ──────────────────────────────────────────────────────────────
const UTM = "utm_source=youtube&utm_medium=influencer&utm_campaign=seerah_launch&utm_content=browniesaadi";

const INDIVIDUAL_URL = `/checkout?plan=individual-lifetime&promo=BROWNIE59&${UTM}`;
const FAMILY_URL     = `/checkout?plan=family-lifetime&promo=BROWNIE119&${UTM}`;
const MONTHLY_URL    = `/checkout?plan=individual-trial&${UTM}`;

const SPONSOR_VIDEO_KEY = "Brownie/Brownie.mp4";

// ── Shared button styles ───────────────────────────────────────────────────────
const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold transition-colors shadow-lg shadow-gold/25";
const outlineBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-gold/40 text-gold font-semibold hover:bg-gold/5 transition-colors";

// ── What You Get Inside ───────────────────────────────────────────────────────
const WHAT_YOU_GET = [
  { icon: <Video className="w-5 h-5" />,       stat: "100", label: "Videos",              desc: "Follow the Seerah step by step, in chronological order." },
  { icon: <Monitor className="w-5 h-5" />,     stat: "300", label: "Presentations",       desc: "Visual slides that make every lesson easy to follow." },
  { icon: <LayoutGrid className="w-5 h-5" />,  stat: "300", label: "Explanatory Images",  desc: "Infographics that show what words alone cannot fully explain." },
  { icon: <FileText className="w-5 h-5" />,    stat: "100", label: "Briefing Documents",  desc: "Concise written summaries for every part of the Seerah." },
  { icon: <ListChecks className="w-5 h-5" />,  stat: "100", label: "Statements of Fact",  desc: "Key facts distilled — clear, memorable, and verifiable." },
  { icon: <GitBranch className="w-5 h-5" />,   stat: "100", label: "Mind Maps",           desc: "See how events, people, and themes connect at a glance." },
  { icon: <Layers className="w-5 h-5" />,      stat: "100", label: "Flashcards",          desc: "Reinforce what you learned through active recall." },
  { icon: <HelpCircle className="w-5 h-5" />,  stat: "100", label: "Quizzes",             desc: "Test what you actually retained after each part." },
];

const FAQ = [
  {
    q: "Is this beginner-friendly?",
    a: "Yes. The course starts from the very beginning and goes step by step. No prior knowledge of Islamic history is required.",
  },
  {
    q: "Can I use this with my family?",
    a: "Yes. The family plan is built for households — up to 5 separate learner profiles, each tracking their own progress independently.",
  },
  {
    q: "Is Part 1 free?",
    a: "Yes. Part 1 is completely free — full video, audio, quiz, and flashcards. No signup, no payment required to watch it.",
  },
  {
    q: "Can I watch on mobile?",
    a: "Yes. The course works on phone, tablet, and desktop. Many students go through lessons during commutes or before bed.",
  },
  {
    q: "Do I need to enter a promo code?",
    a: "No. The Browniesaadi discount is applied automatically at checkout when you use any link on this page.",
  },
  {
    q: "What happens right after I buy?",
    a: "You create an account (or sign in) and get immediate access to all 100 parts through your student dashboard. Lifetime plans are a one-time payment with no recurring charges.",
  },
  {
    q: "Do I need to verify my email?",
    a: "Yes. After checkout you'll set your password to activate your account — takes about 30 seconds.",
  },
  {
    q: "Can I cancel?",
    a: "Monthly plans can be cancelled anytime before the next billing date and you won't be charged again. Lifetime plans are a one-time payment — there's nothing to cancel.",
  },
  {
    q: "Is there a refund policy?",
    a: "Yes — 7-Day Clarity Guarantee. If the Seerah isn't becoming clearer and more connected for you within 7 days, email us for a full refund. No questions asked.",
  },
];

export default async function BrowniesaadiPage() {
  prisma.influencerClick
    .create({ data: { id: crypto.randomUUID(), creator: "browniesaadi" } })
    .catch((err) => console.error("[browniesaadi] Failed to record click:", err));

  let sponsorVideoUrl: string | null = null;
  try {
    sponsorVideoUrl = await generateSignedR2Url(SPONSOR_VIDEO_KEY, VIDEO_URL_EXPIRY);
  } catch {
    // Page still renders; video section shows graceful fallback.
  }

  return (
    <div className="flex flex-col min-h-screen bg-ink text-text">
      <BrowniePromoSetter />
      <BrownieAnalytics />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="py-4 px-4 sm:px-6 border-b border-white/5 bg-ink">
        <div className="max-w-6xl mx-auto flex items-center justify-center">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logoicon.png"
              alt="Complete Seerah"
              width={967}
              height={219}
              className="h-10 sm:h-12 w-auto"
              priority
            />
          </Link>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-24 md:pt-24 md:pb-32 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 1000px 600px at 50% -5%, rgba(200,169,110,0.10) 0%, transparent 70%)" }}
          aria-hidden
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              <p className="text-sm text-gold font-semibold uppercase tracking-widest">
                As seen on Browniesaadi
              </p>
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-semibold">
              Limited-time Browniesaadi campaign price
            </div>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-7">
            Learn the Life of the{" "}
            <br className="hidden sm:block" />
            Prophet ﷺ{" "}
            <span className="text-gradient-gold">in Order</span>
          </h1>

          <p className="text-xl sm:text-2xl text-text-secondary max-w-2xl mx-auto mb-12 leading-relaxed">
            A 100-part Seerah program — step by step, beginning to end — so the Prophet&apos;s ﷺ life finally makes sense as one connected story.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-5">
            <a href="#preview" data-track="hero_preview_clicked" className={`${outlineBtn} w-full sm:w-auto px-10 py-5 text-lg`}>
              Watch Part 1 Free
            </a>
            <Link href={INDIVIDUAL_URL} data-track="hero_cta_clicked" data-plan="individual" className={`${primaryBtn} w-full sm:w-auto px-10 py-5 text-lg`}>
              Claim Lifetime Offer
            </Link>
          </div>

          <p className="text-xs text-text-muted mb-8 max-w-sm mx-auto">
            The $59/$119 lifetime pricing is campaign-only and may not be available later.
          </p>

          <div className="flex items-center justify-center gap-4 sm:gap-6 text-xs text-text-muted flex-wrap">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-gold/60" />7-day guarantee</span>
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-gold/60" />Instant access</span>
            <span className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5 text-gold/60" />Mobile friendly</span>
            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-gold/60" />Individual &amp; family plans</span>
          </div>
        </div>
      </section>

      {/* ── Sponsor Video ──────────────────────────────────────────────────── */}
      <section className="py-16 bg-surface/30 border-y border-border/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              Watch why Browniesaadi recommended this course
            </h2>
            <p className="text-text-secondary text-sm">
              Then try Part 1 for free before you buy anything.
            </p>
          </div>

          {/* Portrait video (9:16) — narrow centered container */}
          <div className="max-w-xs mx-auto">
            {sponsorVideoUrl ? (
              <R2VideoPlayer
                url={sponsorVideoUrl}
                title="Browniesaadi — Complete Seerah"
                label="Browniesaadi on TheMuslimMan Seerah Program"
                autoplay={false}
                trackEvent="sponsor_video_played"
                aspectClass="aspect-[9/16]"
              />
            ) : (
              <div className="relative w-full aspect-[9/16] rounded-2xl border border-border bg-surface flex items-center justify-center">
                <p className="text-sm text-text-muted">Video temporarily unavailable.</p>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#preview" data-track="sponsor_section_preview_clicked" className={`${outlineBtn} px-6 py-3 text-sm`}>
              Watch Part 1 Free
            </a>
            <Link href={INDIVIDUAL_URL} data-track="sponsor_section_cta_clicked" data-plan="individual" className={`${primaryBtn} px-6 py-3 text-sm`}>
              Get Access
            </Link>
          </div>
        </div>
      </section>

      {/* ── Problem → Solution ────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-5">
            Most Muslims Know Seerah in Pieces
          </h2>
          <p className="text-text-secondary mb-10 leading-relaxed text-lg">
            You know the famous events — Hira, the Hijrah, Badr, Uhud — but not how the full life of the Prophet ﷺ flows from beginning to end.
          </p>

          <div className="flex flex-col gap-3 mb-10 max-w-md mx-auto">
            {[
              "Learn in order",
              "See how events connect",
              "Follow one clear path",
            ].map((line) => (
              <div key={line} className="flex items-center gap-3 py-4 px-5 rounded-xl bg-gold/5 border border-gold/20">
                <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0" />
                <span className="text-base font-medium text-text">{line}</span>
              </div>
            ))}
          </div>

          <p className="text-gold font-semibold text-lg">
            This course gives you a clear path through the Prophet&apos;s ﷺ life, in order.
          </p>
        </div>
      </section>

      {/* ── Who this is for ───────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-surface/20 border-y border-border/50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">Who This Is For</h2>
          <div className="space-y-3">
            {[
              "You want to finally learn the Seerah in order — beginning to end.",
              "You want your family to learn the Prophet's ﷺ life step by step, together.",
              "You're tired of random clips and scattered stories with no structure.",
              "You want something simple and clear enough to actually continue.",
            ].map((line) => (
              <div key={line} className="flex items-start gap-3 py-4 px-5 rounded-xl bg-gold/5 border border-gold/20">
                <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                <span className="text-base text-text leading-snug">{line}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Free Preview ──────────────────────────────────────────────────── */}
      <section id="preview" className="py-16 sm:py-20 scroll-mt-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Start With Part 1 — Free</h2>
            <p className="text-text-secondary">
              Watch the full first lesson before you buy anything. No signup, no payment.
            </p>
          </div>
          <Suspense fallback={
            <div className="rounded-2xl border border-border bg-surface overflow-hidden" style={{ minHeight: 480 }}>
              <div className="h-14 bg-surface-raised border-b border-border flex items-center gap-2 px-4">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="h-8 w-20 rounded-lg bg-surface animate-pulse" />
                ))}
              </div>
              <div className="p-6 space-y-4">
                <div className="h-5 bg-surface-raised rounded w-2/3 animate-pulse" />
                <div className="h-4 bg-surface-raised rounded w-1/2 animate-pulse" />
                <div className="mt-6 aspect-video bg-surface-raised rounded-xl animate-pulse" />
              </div>
            </div>
          }>
            <Part1FullPreview hideCta />
          </Suspense>
        </div>
      </section>

      {/* ── What You Get Inside ──────────────────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-text mb-3">
              What You Get Inside
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto text-sm sm:text-base">
              Every part of the Seerah comes with a full set of learning tools — not just a video.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-12">
            {WHAT_YOU_GET.map((card) => (
              <div
                key={card.label}
                className="flex flex-col gap-3 p-4 sm:p-5 rounded-xl border border-border bg-surface hover:border-gold/25 hover:bg-surface-raised transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-gold/10 border border-gold/15 flex items-center justify-center text-gold flex-shrink-0">
                  {card.icon}
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-gold leading-none mb-1">
                    {card.stat}
                  </p>
                  <p className="font-semibold text-text text-sm">{card.label}</p>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <a href="#pricing" className={`${primaryBtn} px-8 py-4 text-base`}>
              See Pricing Options
            </a>
          </div>
        </div>
      </section>

      {/* ── Urgency strip ─────────────────────────────────────────────────── */}
      <div className="bg-gold/8 border-y border-gold/20 px-4 py-4 text-center">
        <p className="text-sm text-gold/90 max-w-2xl mx-auto leading-snug">
          <span className="font-semibold">Browniesaadi campaign pricing is active now:</span>{" "}
          Individual lifetime $59 · Family lifetime $119.{" "}
          <span className="text-gold/70">Prices may return to normal after this promotion.</span>
        </p>
      </div>

      {/* ── Pricing ───────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-16 sm:py-24 bg-surface/20 border-b border-border/50 scroll-mt-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/25 text-gold text-xs font-bold uppercase tracking-wider mb-5">
            Exclusive for Browniesaadi Viewers
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
            Limited-Time Browniesaadi Lifetime Offer
          </h2>
          <p className="text-text-secondary text-base mb-3">
            Lock in lifetime access before this campaign ends. Applied automatically — no code needed.
          </p>
          <p className="text-xs text-text-muted mb-12">
            Regular pricing may return after the promotion.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">

            {/* Individual */}
            <div className="relative rounded-2xl border border-border bg-surface p-8 flex flex-col text-center">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-surface border border-gold/40 text-gold">
                  Most Popular
                </span>
              </div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                Individual Lifetime
              </p>
              <p className="text-sm text-text-secondary mb-4">For one learner</p>
              <span className="inline-flex self-center items-center px-2.5 py-0.5 rounded-full bg-gold/10 border border-gold/25 text-gold text-[10px] font-semibold uppercase tracking-wide mb-4">
                Campaign Price
              </span>

              <div className="mb-6">
                <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Regular price</p>
                <p className="text-base text-text-muted line-through font-medium">$79</p>
                <p className="text-xs text-gold/70 uppercase tracking-wide mt-3 mb-1">Browniesaadi campaign price</p>
                <p className="text-5xl sm:text-6xl font-bold text-gold leading-none">$59</p>
                <p className="text-xs text-emerald-400 mt-2 font-medium">$20 off — campaign pricing only</p>
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
                  data-track="checkout_started"
                  data-plan="individual"
                  className="block w-full py-4 px-5 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-sm text-center transition-colors shadow-lg shadow-gold/20"
                >
                  Get Individual Access — $59
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
              <p className="text-sm text-text-secondary mb-4">
                Parents &amp; households — up to 5 learners
              </p>
              <span className="inline-flex self-center items-center px-2.5 py-0.5 rounded-full bg-gold/10 border border-gold/25 text-gold text-[10px] font-semibold uppercase tracking-wide mb-4">
                Campaign Price
              </span>

              <div className="mb-6">
                <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Regular price</p>
                <p className="text-base text-text-muted line-through font-medium">$149</p>
                <p className="text-xs text-gold/70 uppercase tracking-wide mt-3 mb-1">Browniesaadi campaign price</p>
                <p className="text-5xl sm:text-6xl font-bold text-gold leading-none">$119</p>
                <p className="text-xs text-emerald-400 mt-2 font-medium">$30 off — campaign pricing only</p>
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
                  data-track="checkout_started"
                  data-plan="family"
                  className="block w-full py-4 px-5 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-sm text-center transition-colors shadow-lg shadow-gold/20"
                >
                  Get Family Access — $119
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
              Start with a free 7-day trial
            </Link>
            {" "}— then $9/month. Cancel anytime.
          </p>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
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

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-surface/20 border-t border-border/50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            Begin the Seerah From the First Lesson
          </h2>
          <p className="text-text-secondary text-lg mb-10">
            Start free, or lock in the Browniesaadi lifetime price before campaign pricing ends.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <a href="#preview" data-track="final_cta_preview_clicked" className={`${outlineBtn} w-full sm:w-auto px-8 py-4 text-base`}>
              Watch Part 1 Free
            </a>
            <a href="#pricing" data-track="final_cta_pricing_clicked" className={`${primaryBtn} w-full sm:w-auto px-8 py-4 text-base`}>
              Lock In Lifetime Offer
            </a>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4 text-sm">
            <Link href={INDIVIDUAL_URL} data-track="checkout_started" data-plan="individual" className="text-gold underline underline-offset-2 hover:text-gold-light transition-colors">
              Individual — $59
            </Link>
            <span className="hidden sm:inline text-text-muted">·</span>
            <Link href={FAMILY_URL} data-track="checkout_started" data-plan="family" className="text-gold underline underline-offset-2 hover:text-gold-light transition-colors">
              Family — $119
            </Link>
          </div>

          <div className="mt-8 pt-8 border-t border-border/50 flex items-center justify-center gap-6 flex-wrap text-xs text-text-muted">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-gold/60" />7-Day Clarity Guarantee</span>
            <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-gold/60" />Secure Payment</span>
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-gold/60" />Instant Access</span>
          </div>
        </div>
      </section>

      <div className="pb-20 sm:pb-0">
        <Footer />
      </div>

      <MobileStickyCta
        href={INDIVIDUAL_URL}
        label="Claim Offer"
        sublabel="Browniesaadi lifetime offer from $59"
      />
    </div>
  );
}
