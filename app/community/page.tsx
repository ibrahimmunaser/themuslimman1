import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  BookOpen, Smartphone, Users,
  ShieldCheck, Lock, Zap, CheckCircle2,
  GraduationCap, Infinity as InfinityIcon,
} from "lucide-react";
import { Footer } from "@/components/landing/footer";
import { Part1FullPreview } from "@/components/landing/part1-full-preview";
import { CommunityPromoSetter } from "./community-promo-setter";
import { MobileStickyCta } from "./mobile-sticky-cta";

export const metadata: Metadata = {
  title: "Complete Seerah — Community Offer",
  description:
    "Learn the life of the Prophet ﷺ in order. A 100-part Seerah program for Muslims and families. 20% off lifetime access for community members.",
  robots: { index: false, follow: false },
};

// ── URL constants ─────────────────────────────────────────────────────────────
const UTM            = "utm_source=direct&utm_medium=community&utm_campaign=seerah_launch&utm_content=community";

const INDIVIDUAL_URL = `/checkout?plan=individual-lifetime&promo=COMMUNITY49&${UTM}`;
const FAMILY_URL     = `/checkout?plan=family-lifetime&promo=COMMUNITY99&${UTM}`;
const MONTHLY_URL    = `/checkout?plan=individual-trial&${UTM}`;
const FREE_LESSON    = "#preview";

// ── Shared button styles ──────────────────────────────────────────────────────
const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold transition-colors shadow-lg shadow-gold/25";
const outlineBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-gold/40 text-gold font-semibold hover:bg-gold/5 transition-colors";

// ── What's Included items ─────────────────────────────────────────────────────
const INCLUDED_ITEMS = [
  { Icon: BookOpen,      label: "100-Part Seerah Course"     },
  { Icon: GraduationCap, label: "Chronological Lessons"      },
  { Icon: CheckCircle2,  label: "Student Dashboard"          },
  { Icon: Smartphone,    label: "Mobile Friendly"            },
  { Icon: Users,         label: "Individual & Family Access" },
  { Icon: InfinityIcon,  label: "Lifetime Access"            },
];

// ── FAQ ───────────────────────────────────────────────────────────────────────
const FAQ = [
  {
    q: "Can I try it before paying?",
    a: "Yes. Part 1 is fully free — no account, no credit card, no signup required. Watch the complete first lesson right on this page and decide from there.",
  },
  {
    q: "Is this good for families?",
    a: "Yes. The family plan includes 5 separate learner profiles so every member of the household tracks their own progress independently — parents, kids, everyone — with one payment.",
  },
  {
    q: "Can I watch on my phone?",
    a: "Yes. The app works on phone, tablet, and desktop. Many students go through a lesson during their commute or before bed.",
  },
  {
    q: "What happens after I buy?",
    a: "You get immediate access to all 100 parts through your student dashboard — video, audio, quiz, flashcards, and mind maps for every single lesson. Everything is ready the moment you sign up.",
  },
  {
    q: "Do I need to enter a promo code?",
    a: "No. The community discount is automatically applied when you click any purchase link on this page. You'll see the discounted price before you enter any payment details.",
  },
];

export default function CommunityPage() {
  return (
    <div className="flex flex-col min-h-screen bg-ink text-text">
      {/* Persist COMMUNITY49 promo to localStorage so it auto-applies at checkout */}
      <CommunityPromoSetter />

      {/* ── Sticky promo bar ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-50 bg-[#1a150a]/95 border-b border-gold/20 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          <p className="text-sm text-gold font-medium">
            Community offer:{" "}
            <span className="font-bold">Lifetime access from $49</span>
          </p>
          <a
            href="#pricing"
            className="shrink-0 text-xs font-bold text-ink bg-gold hover:bg-gold-light px-4 py-1.5 rounded-lg transition-colors"
          >
            Get Access — From $49
          </a>
        </div>
      </div>

      {/* ── Minimal header (logo only) ─────────────────────────────────────── */}
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

      {/* ── 1. Hero ───────────────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-24 md:pt-24 md:pb-32 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 1000px 600px at 50% -5%, rgba(200,169,110,0.10) 0%, transparent 70%)" }}
          aria-hidden
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            <p className="text-sm text-gold font-semibold uppercase tracking-widest">
              For my Muslim community
            </p>
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-7">
            Learn the Life of the{" "}
            <br className="hidden sm:block" />
            Prophet ﷺ{" "}
            <span className="text-gradient-gold">in Order</span>
          </h1>

          <p className="text-xl sm:text-2xl text-text-secondary max-w-2xl mx-auto mb-12 leading-relaxed">
            Most Muslims know pieces of the Seerah. This 100-part program takes you through
            the full life of the Prophet ﷺ — from birth to his final days — so you can finally
            say you know his life, start to finish.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <a href={FREE_LESSON} className={`${outlineBtn} w-full sm:w-auto px-10 py-5 text-lg`}>
              Watch Part 1 Free
            </a>
            <Link href={INDIVIDUAL_URL} className={`${primaryBtn} w-full sm:w-auto px-10 py-5 text-lg`}>
              Get Lifetime Access
            </Link>
          </div>

          <div className="flex items-center justify-center gap-4 sm:gap-6 text-xs text-text-muted flex-wrap">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-gold/60" />7-day guarantee</span>
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-gold/60" />Instant access</span>
            <span className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5 text-gold/60" />Mobile friendly</span>
            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-gold/60" />Individual &amp; family plans</span>
          </div>
        </div>
      </section>

      {/* ── 2. Personal message ───────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-surface/20 border-y border-border/50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="space-y-5 text-text-secondary text-lg leading-relaxed bg-surface border border-border/60 rounded-2xl p-6 sm:p-8">
            <p className="text-text font-semibold text-xl">As-salāmu ʿalaykum.</p>
            <p>
              I built this because many of us know parts of the Seerah, but we never went through
              the life of the Prophet ﷺ in order from beginning to end.
            </p>
            <p>
              I wanted to make something simple, structured, and easy for Muslims and families to
              go through at home.
            </p>
            <p className="text-text-muted text-base">— Ibrahim</p>
          </div>

          <div className="mt-8 text-center">
            <a href={FREE_LESSON} className={`${outlineBtn} px-8 py-4 text-base`}>
              Start With Part 1 Free
            </a>
          </div>
        </div>
      </section>

      {/* ── 3. Free Preview ───────────────────────────────────────────────── */}
      <section id="preview" className="py-16 sm:py-20 scroll-mt-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Start With Part 1 — Free</h2>
            <p className="text-text-secondary">
              Before you buy anything, watch the first lesson and see if the course is right for you.
            </p>
          </div>

          <Part1FullPreview hideCta />

        </div>
      </section>

      {/* ── 5. Problem → Benefit ──────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-surface/20 border-y border-border/50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-5">
            Most of Us Know Seerah in Pieces
          </h2>
          <p className="text-text-secondary mb-6 leading-relaxed text-lg">
            You may know stories like Hira, the Hijrah, Badr, Uhud, and the conquest of Makkah —
            but not how the full life of the Prophet ﷺ connects from beginning to end.
          </p>
          <p className="text-text-secondary mb-10 leading-relaxed text-lg">
            This course gives you that structure.
          </p>

          <div className="flex flex-col gap-3 mb-10 max-w-md mx-auto">
            {["Learn in order", "See how events connect", "Follow one clear path"].map((line) => (
              <div key={line} className="flex items-center gap-3 py-4 px-5 rounded-xl bg-gold/5 border border-gold/20">
                <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0" />
                <span className="text-base font-medium text-text">{line}</span>
              </div>
            ))}
          </div>

          <Link href={INDIVIDUAL_URL} className={`${primaryBtn} px-8 py-4 text-base`}>
            Get Lifetime Access — From $49
          </Link>
        </div>
      </section>

      {/* ── 6. What's Included ────────────────────────────────────────────── */}
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

      {/* ── 7. Pricing ────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-16 sm:py-24 bg-surface/20 border-y border-border/50 scroll-mt-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
            Community Lifetime Offer
          </h2>
          <p className="text-text-secondary text-base mb-3">
            Special pricing for my community — applied at checkout. No code needed.
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
              <p className="text-sm text-text-secondary mb-6">For one learner</p>

              <div className="mb-6">
                <p className="text-sm text-text-muted line-through">$79</p>
                <p className="text-5xl sm:text-6xl font-bold text-gold leading-none mt-1">$49</p>
                <p className="text-xs text-emerald-400 mt-2 font-medium">You save $30</p>
              </div>

              <ul className="space-y-1.5 text-left mb-8">
                {[
                  "All 100 parts, unlocked immediately",
                  "Video, audio, quiz, flashcards, mind maps",
                  "Progress tracking dashboard",
                  "Mobile app access",
                ].map((f) => (
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
                  Get Individual Lifetime — $49
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
                Best for parents and households learning together
              </p>

              <div className="mb-6">
                <p className="text-sm text-text-muted line-through">$149</p>
                <p className="text-5xl sm:text-6xl font-bold text-gold leading-none mt-1">$99</p>
                <p className="text-xs text-emerald-400 mt-2 font-medium">You save $50</p>
              </div>

              <ul className="space-y-1.5 text-left mb-8">
                {[
                  "Everything in Individual",
                  "5 separate learner profiles",
                  "Each profile tracks progress independently",
                  "One payment for the whole household",
                ].map((f) => (
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
                  Get Family Lifetime — $99
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
            Prefer monthly?{" "}
            <Link href={MONTHLY_URL} className="text-gold hover:text-gold-light underline underline-offset-2">
              Start with a free 7-day trial
            </Link>
            {" "}— then $9/month. Cancel anytime.
          </p>
        </div>
      </section>

      {/* ── 8. FAQ ────────────────────────────────────────────────────────── */}
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


      {/* pb-20 prevents the mobile sticky CTA from obscuring footer content */}
      <div className="pb-20 sm:pb-0">
        <Footer />
      </div>

      {/* ── Sticky mobile CTA (mobile only, z-40) ─────────────────────────── */}
      <MobileStickyCta href="#pricing" />
    </div>
  );
}
