import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  ShieldCheck, Lock, Zap, CheckCircle2, Play,
  Video, Monitor, LayoutGrid, FileText, ListChecks,
  GitBranch, Layers, HelpCircle,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { Footer } from "@/components/landing/footer";
import { generateSignedR2Url, VIDEO_URL_EXPIRY } from "@/lib/r2";
import { BrowniePromoSetter } from "./brownie-promo-setter";
import { BrownieAnalytics } from "./brownie-analytics";
import BrownieFunnelTracker from "@/components/influencer/brownie-funnel-tracker";
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

const INDIVIDUAL_URL = `/checkout?plan=individual-lifetime&promo=BROWNIE59&source=browniesaadi&${UTM}`;
const FAMILY_URL     = `/checkout?plan=family-lifetime&promo=BROWNIE119&source=browniesaadi&${UTM}`;
const MONTHLY_URL    = `/checkout?plan=individual-trial&source=browniesaadi&${UTM}`;

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
    a: "You create an account and get immediate access to all 100 parts through your student dashboard. Lifetime plans are a one-time payment with no recurring charges.",
  },
  {
    q: "Do I need to verify my email?",
    a: "Yes. After checkout you'll set your password to activate your account — takes about 30 seconds.",
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
      <BrownieFunnelTracker creator="browniesaadi" promoCode="BROWNIE59" />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="py-4 px-4 sm:px-6 border-b border-white/5 bg-ink/95 sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logoicon.png"
              alt="Complete Seerah"
              width={967}
              height={219}
              className="h-9 sm:h-10 w-auto"
              priority
            />
          </Link>
          <Link
            href={INDIVIDUAL_URL}
            data-track="individual_lifetime_cta_clicked"
            data-plan="individual"
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-sm transition-colors shadow-md shadow-gold/20"
          >
            Get Lifetime Access — $59
          </Link>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
          ABOVE THE FOLD — offer is the first thing they see
      ════════════════════════════════════════════════════════════════════════ */}

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-10 md:pt-16 md:pb-12 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 900px 500px at 50% -10%, rgba(200,169,110,0.12) 0%, transparent 70%)" }}
          aria-hidden
        />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          {/* Source badge */}
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            <p className="text-xs text-gold font-semibold uppercase tracking-widest">
              Brownie Saadi Special Offer
            </p>
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.08] mb-4">
            Learn the Life of the{" "}
            <br className="hidden sm:block" />
            Prophet ﷺ{" "}
            <span className="text-gradient-gold">in Order</span>
          </h1>

          <p className="text-base sm:text-lg text-text-secondary max-w-xl mx-auto mb-6 leading-relaxed">
            Most Muslims know scattered stories from the Seerah, but not the Prophet&apos;s ﷺ life as one connected journey. This 100-part course fixes that — step by step, beginning to end.
          </p>

          {/* Price statement */}
          <p className="text-2xl sm:text-3xl font-bold text-gold mb-2">
            Lifetime access from <span className="underline decoration-gold/40 underline-offset-4">$59</span>
          </p>
          <p className="text-sm text-text-muted mb-8">
            One-time payment · No subscription · 7-day refund guarantee
          </p>

          {/* Primary CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 mb-6">
            <Link
              href={INDIVIDUAL_URL}
              data-track="individual_lifetime_cta_clicked"
              data-plan="individual"
              className={`${primaryBtn} px-8 py-4 text-base w-full sm:w-auto`}
            >
              Get Lifetime Access — $59
            </Link>
            <Link
              href={FAMILY_URL}
              data-track="family_lifetime_cta_clicked"
              data-plan="family"
              className={`${outlineBtn} px-8 py-4 text-base w-full sm:w-auto`}
            >
              For My Family — $119
            </Link>
          </div>

          {/* Secondary — free preview */}
          <a
            href="#preview"
            data-track="watch_part1_clicked"
            className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-gold transition-colors"
          >
            <Play className="w-3.5 h-3.5 flex-shrink-0" />
            Not ready yet? Watch Part 1 free first
          </a>
        </div>
      </section>

      {/* ── Pricing cards — immediately below hero ─────────────────────────── */}
      <section id="pricing" className="pb-12 scroll-mt-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* Individual — For Me */}
            <div className="relative rounded-2xl border border-gold/25 bg-surface p-6 flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-surface border border-gold/40 text-gold">
                  Most Popular
                </span>
              </div>

              <p className="text-lg font-bold text-text mb-0.5">For Me</p>
              <p className="text-xs text-text-muted mb-4">Individual Lifetime Access</p>

              <div className="mb-5">
                <span className="text-xs text-text-muted line-through mr-2">$79</span>
                <span className="text-4xl font-bold text-gold">$59</span>
                <p className="text-xs text-gold/60 mt-0.5">one-time · no renewal</p>
              </div>

              <ul className="space-y-1.5 mb-6 flex-1">
                {[
                  "All 100 parts, unlocked immediately",
                  "Videos, quizzes, flashcards, mind maps",
                  "Progress dashboard · Mobile friendly",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-text-secondary">
                    <CheckCircle2 className="w-3.5 h-3.5 text-gold flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={INDIVIDUAL_URL}
                data-track="individual_lifetime_cta_clicked"
                data-plan="individual"
                className="block w-full py-3.5 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-sm text-center transition-colors shadow-md shadow-gold/20"
              >
                Get Lifetime Access — $59
              </Link>
            </div>

            {/* Family — For My Family */}
            <div className="relative rounded-2xl border border-gold/30 bg-gold/5 p-6 flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold text-ink">
                  Best for Families
                </span>
              </div>

              <p className="text-lg font-bold text-text mb-0.5">For My Family</p>
              <p className="text-xs text-text-muted mb-4">Family Lifetime Access · up to 5 learners</p>

              <div className="mb-5">
                <span className="text-xs text-text-muted line-through mr-2">$149</span>
                <span className="text-4xl font-bold text-gold">$119</span>
                <p className="text-xs text-gold/60 mt-0.5">one-time · no renewal</p>
              </div>

              <ul className="space-y-1.5 mb-6 flex-1">
                {[
                  "Everything in Individual",
                  "5 separate learner profiles",
                  "One payment for the whole household",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-text-secondary">
                    <CheckCircle2 className="w-3.5 h-3.5 text-gold flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={FAMILY_URL}
                data-track="family_lifetime_cta_clicked"
                data-plan="family"
                className="block w-full py-3.5 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-sm text-center transition-colors shadow-md shadow-gold/20"
              >
                Get Family Lifetime Access — $119
              </Link>
            </div>
          </div>

          {/* Trust row */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap text-xs text-text-muted mt-5">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-gold/60" />7-day refund guarantee</span>
            <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-gold/60" />Secure checkout</span>
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-gold/60" />Instant access</span>
          </div>

          {/* Trial fallback — very small */}
          <p className="text-xs text-text-muted text-center mt-4">
            Not ready for lifetime?{" "}
            <Link href={MONTHLY_URL} data-track="trial_cta_clicked" className="text-gold/80 hover:text-gold underline underline-offset-2">
              Try 7 days free
            </Link>
            {" "}— then $9/month.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          PROOF SECTIONS — for people who need convincing
      ════════════════════════════════════════════════════════════════════════ */}

      {/* ── Influencer video ───────────────────────────────────────────────── */}
      <section className="py-12 bg-surface/30 border-y border-border/50">
        <div className="max-w-sm mx-auto px-4 sm:px-6">
          <p className="text-center text-sm font-semibold text-text-muted uppercase tracking-wider mb-5">
            Why Browniesaadi recommended this
          </p>
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
          <div className="mt-5 flex flex-col gap-2">
            <Link href={INDIVIDUAL_URL} data-track="individual_lifetime_cta_clicked" data-plan="individual" className={`${primaryBtn} w-full py-3.5 text-sm`}>
              Get Lifetime Access — $59
            </Link>
            <a href="#preview" data-track="watch_part1_clicked" className={`${outlineBtn} w-full py-3 text-sm`}>
              <Play className="w-4 h-4" />
              Watch Part 1 Free
            </a>
          </div>
        </div>
      </section>

      {/* ── Pain statement ─────────────────────────────────────────────────── */}
      <section className="py-12 sm:py-16">
        <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Most Muslims Know the Seerah in Pieces
          </h2>
          <p className="text-text-secondary leading-relaxed mb-6">
            You know Hira, the Hijrah, Badr, Uhud — but not how the Prophet&apos;s ﷺ full life flows from start to finish. This course gives you one clear path, in order.
          </p>
          <div className="flex flex-col gap-2 max-w-sm mx-auto text-left">
            {["Learn in chronological order", "See how every event connects", "Follow one clear unbroken path"].map((line) => (
              <div key={line} className="flex items-center gap-3 py-3 px-4 rounded-xl bg-gold/5 border border-gold/15">
                <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0" />
                <span className="text-sm font-medium text-text">{line}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What You Get Inside ──────────────────────────────────────────── */}
      <section className="py-12 sm:py-16 bg-surface/20 border-y border-border/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-text mb-2">
              Every Part Comes With a Full Set of Learning Tools
            </h2>
            <p className="text-text-secondary text-sm">Not just a video.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {WHAT_YOU_GET.map((card) => (
              <div
                key={card.label}
                className="flex items-center gap-3 p-3 sm:p-4 rounded-xl border border-border bg-surface"
              >
                <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center text-gold flex-shrink-0">
                  {card.icon}
                </div>
                <div>
                  <p className="text-lg font-bold text-gold leading-none">{card.stat}</p>
                  <p className="text-xs text-text-secondary">{card.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Free Part 1 Preview — backup path ─────────────────────────────── */}
      <section id="preview" className="py-12 sm:py-16 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Not ready yet?</p>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Watch Part 1 Free</h2>
            <p className="text-text-secondary text-sm">
              Full first lesson — video, audio, quiz. No signup, no payment.
            </p>
          </div>
          <Suspense fallback={
            <div className="rounded-2xl border border-border bg-surface overflow-hidden" style={{ minHeight: 400 }}>
              <div className="h-12 bg-surface-raised border-b border-border flex items-center gap-2 px-4">
                {[1,2,3,4].map((i) => <div key={i} className="h-7 w-16 rounded-lg bg-surface animate-pulse" />)}
              </div>
              <div className="p-6">
                <div className="aspect-video bg-surface-raised rounded-xl animate-pulse" />
              </div>
            </div>
          }>
            <Part1FullPreview hideCta />
          </Suspense>
          <div className="mt-8 text-center">
            <Link href={INDIVIDUAL_URL} data-track="individual_lifetime_cta_clicked" data-plan="individual" className={`${primaryBtn} px-8 py-4 text-base`}>
              Get Lifetime Access — $59
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="py-12 sm:py-16 bg-surface/20 border-t border-border/50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-8">Quick Questions</h2>
          <div className="space-y-2.5">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="p-4 sm:p-5 rounded-xl bg-surface border border-border">
                <p className="font-semibold text-text text-sm mb-1">{q}</p>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-lg mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Start the Seerah From the Beginning
          </h2>
          <p className="text-text-secondary mb-2">
            This is the Brownie Saadi deal. Lifetime. Discounted. One-time payment.
          </p>
          <p className="text-sm text-text-muted mb-8">
            Prices may return to normal after this promotion ends.
          </p>

          <div className="flex flex-col gap-3 mb-4">
            <Link href={INDIVIDUAL_URL} data-track="individual_lifetime_cta_clicked" data-plan="individual" className={`${primaryBtn} w-full py-4 text-base`}>
              Get Lifetime Access — $59
            </Link>
            <Link href={FAMILY_URL} data-track="family_lifetime_cta_clicked" data-plan="family" className={`${outlineBtn} w-full py-4 text-base`}>
              For My Family — $119
            </Link>
          </div>

          <p className="text-xs text-text-muted mb-6">One-time payment · No subscription · 7-day refund guarantee</p>

          <a href="#preview" data-track="watch_part1_clicked" className="text-sm text-text-muted hover:text-gold transition-colors underline underline-offset-2">
            Or watch Part 1 free first
          </a>
        </div>
      </section>

      <div className="pb-20 sm:pb-0">
        <Footer />
      </div>

      <MobileStickyCta
        href={INDIVIDUAL_URL}
        label="Get Lifetime Access — $59"
        sublabel="One-time · No subscription · Brownie Saadi price"
      />
    </div>
  );
}
