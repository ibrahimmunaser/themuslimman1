import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  CheckCircle2, ShieldCheck, Lock, Zap,
  Video, Monitor, LayoutGrid, FileText, ListChecks,
  GitBranch, Layers, HelpCircle,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { Footer } from "@/components/landing/footer";
import { Part1FullPreview } from "@/components/landing/part1-full-preview";
import { InfluencerPromoSetter } from "@/components/influencer/influencer-promo-setter";
import BrownieFunnelTracker from "@/components/influencer/brownie-funnel-tracker";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ann Arbor Student Special — Complete Seerah",
  description:
    "Learn the life of the Prophet ﷺ in order. Student lifetime access for $29. One-time payment, no subscription.",
  robots: { index: false, follow: false },
};

const UTM = "utm_source=direct&utm_medium=promo&utm_campaign=seerah_launch&utm_content=annarbor";
const CHECKOUT_URL = `/checkout?plan=individual-lifetime&promo=ANNARBOR29&source=annarbor&${UTM}`;
const FAMILY_URL   = `/checkout?plan=family-lifetime&promo=ANNARBOR119&source=annarbor&${UTM}`;

const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold transition-colors shadow-lg shadow-gold/25";

const WHAT_YOU_GET = [
  { icon: <Video className="w-5 h-5" />,       stat: "100", label: "Videos"             },
  { icon: <Monitor className="w-5 h-5" />,     stat: "300", label: "Presentations"      },
  { icon: <LayoutGrid className="w-5 h-5" />,  stat: "300", label: "Explanatory Images" },
  { icon: <FileText className="w-5 h-5" />,    stat: "100", label: "Briefing Documents" },
  { icon: <ListChecks className="w-5 h-5" />,  stat: "100", label: "Statements of Fact" },
  { icon: <GitBranch className="w-5 h-5" />,   stat: "100", label: "Mind Maps"          },
  { icon: <Layers className="w-5 h-5" />,      stat: "100", label: "Flashcards"         },
  { icon: <HelpCircle className="w-5 h-5" />,  stat: "100", label: "Quizzes"            },
];

const FAQ = [
  {
    q: "Is this only for students?",
    a: "This Ann Arbor offer is built for students and young Muslims, but anyone using this page can claim the student/community price while it is available.",
  },
  {
    q: "Is this a subscription?",
    a: "No. This is a one-time payment for lifetime access. No monthly charges, no renewals.",
  },
  {
    q: "Do I need to enter a promo code?",
    a: "No. The Ann Arbor student discount is applied automatically when you use this page.",
  },
  {
    q: "Can I watch on mobile?",
    a: "Yes. The course works on phone, tablet, and desktop. Most students go through lessons during commutes or between classes.",
  },
  {
    q: "What happens after I pay?",
    a: "You get instant access and can start the course from your student dashboard immediately.",
  },
  {
    q: "Is there a refund policy?",
    a: "Yes — 7-Day Clarity Guarantee. If the Seerah isn't becoming clearer for you within 7 days, email us for a full refund. No questions asked.",
  },
];

export default async function AnnArborPage() {
  await prisma.influencerClick
    .create({ data: { id: crypto.randomUUID(), creator: "annarbor" } })
    .catch(() => {});

  return (
    <div className="flex flex-col min-h-screen bg-ink text-text">
      <InfluencerPromoSetter promoCode="ANNARBOR29" />
      <BrownieFunnelTracker
        creator="annarbor"
        promoCode="ANNARBOR29"
        landingEvent="annarbor_landing_page_view"
      />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="py-4 px-4 sm:px-6 border-b border-border/30 bg-ink sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center">
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
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-10 md:pt-16 md:pb-12 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 900px 500px at 50% -10%, rgba(200,169,110,0.12) 0%, transparent 70%)" }}
          aria-hidden
        />
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            <p className="text-xs text-gold font-semibold uppercase tracking-widest">Ann Arbor Student Special</p>
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.08] mb-3">
            Learn the Prophet&apos;s ﷺ Life{" "}
            <span className="text-gradient-gold">in Order</span>
          </h1>

          <p className="text-base sm:text-lg text-text-secondary max-w-lg mx-auto mb-5 leading-relaxed">
            Most Muslims know scattered stories from the Seerah, but not the Prophet&apos;s ﷺ life as one connected journey. This 100-part course helps you learn it step by step.
          </p>

          <div className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-0.5 mb-1">
            <p className="text-3xl sm:text-4xl font-bold text-gold">$29</p>
            <p className="text-lg sm:text-xl text-text-muted/50 line-through">$79</p>
            <span className="px-2 py-0.5 rounded-md bg-gold/15 text-gold text-xs font-bold uppercase tracking-wide">Save $50</span>
          </div>
          <p className="text-sm text-text-secondary mb-1">
            Student lifetime access — one-time payment
          </p>
          <p className="text-xs text-gold/60 mb-1">
            Ann Arbor student discount applied automatically.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-text-muted mb-7">
            <span>One-time payment</span>
            <span className="hidden sm:inline text-text-muted/30">·</span>
            <span>No subscription</span>
            <span className="hidden sm:inline text-text-muted/30">·</span>
            <span>Keep access forever</span>
          </div>

          <Link
            href={CHECKOUT_URL}
            data-track="student_lifetime_cta_clicked"
            data-plan="individual"
            className={`${primaryBtn} px-10 py-4 text-base mb-4`}
          >
            Get Student Lifetime Access — $29
          </Link>

          <p className="text-xs text-text-muted/40 mt-3">
            <a href="#preview" data-track="watch_part1_clicked" className="hover:text-text-muted/60 transition-colors">
              Watch Part 1 free first
            </a>
          </p>
        </div>
      </section>

      {/* ── Offer card ────────────────────────────────────────────────────── */}
      <section id="pricing" className="pb-12 scroll-mt-16">
        <div className="max-w-sm mx-auto px-4 sm:px-6">
          {/* Main student card — dominant */}
          <div className="relative rounded-2xl border-2 border-gold/60 bg-surface shadow-lg shadow-gold/10 p-6 flex flex-col">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold text-ink shadow-sm">
                Student Offer
              </span>
            </div>
            <p className="text-xl font-bold text-text mb-0.5">For Students</p>
            <p className="text-xs text-text-muted mb-4">Individual Lifetime Access</p>
            <div className="mb-5">
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-5xl font-bold text-gold">$29</span>
                <span className="text-lg text-text-muted/50 line-through">$79</span>
                <span className="px-2 py-0.5 rounded-md bg-gold/15 text-gold text-[10px] font-bold uppercase tracking-wide">Save $50</span>
              </div>
              <p className="text-xs text-gold/60">one-time · keep forever</p>
            </div>
            <ul className="space-y-2 mb-7 flex-1">
              {[
                "All 100 Seerah parts, unlocked immediately",
                "Videos, quizzes, flashcards, mind maps",
                "Summaries and presentations per lesson",
                "Progress tracking dashboard",
                "Mobile friendly — learn anywhere",
                "No subscription — pay once, keep forever",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-text-secondary">
                  <CheckCircle2 className="w-3.5 h-3.5 text-gold flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={CHECKOUT_URL}
              data-track="student_lifetime_cta_clicked"
              data-plan="individual"
              className="block w-full py-4 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-base text-center transition-colors shadow-lg shadow-gold/25"
            >
              Get Student Lifetime Access — $29
            </Link>
          </div>

          {/* Trust row */}
          <div className="flex items-center justify-center gap-4 flex-wrap text-xs text-text-muted mt-4">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-gold/60" />7-day refund guarantee</span>
            <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-gold/60" />Secure checkout</span>
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-gold/60" />Instant access</span>
          </div>

          {/* Family secondary link */}
          <p className="text-xs text-text-muted/50 text-center mt-4">
            Buying for your family?{" "}
            <Link
              href={FAMILY_URL}
              data-track="family_lifetime_cta_clicked"
              data-plan="family"
              className="underline underline-offset-2 hover:text-text-muted/70 transition-colors"
            >
              View family option — $119
            </Link>
          </p>

          {/* trial option removed */}
        </div>
      </section>

      {/* ── Proof / value ─────────────────────────────────────────────────── */}
      <section className="py-12 sm:py-16">
        <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            The Seerah as One Connected Story
          </h2>
          <p className="text-text-secondary leading-relaxed mb-6">
            You know bits of the Seerah — but not how it all fits together in order. This course changes that.
          </p>
          <div className="flex flex-col gap-2 max-w-sm mx-auto text-left">
            {[
              "Learn in chronological order from start to finish",
              "See how every event connects to the next",
              "Follow one clear, unbroken structured path",
            ].map((line) => (
              <div key={line} className="flex items-center gap-3 py-3 px-4 rounded-xl bg-gold/5 border border-gold/15">
                <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0" />
                <span className="text-sm font-medium text-text">{line}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What You Get Inside ───────────────────────────────────────────── */}
      <section className="py-12 sm:py-16 bg-surface/20 border-y border-border/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-text mb-2">
              Every Part Has a Full Set of Learning Tools
            </h2>
            <p className="text-text-secondary text-sm">Not just a video.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {WHAT_YOU_GET.map((card) => (
              <div key={card.label} className="flex items-center gap-3 p-3 sm:p-4 rounded-xl border border-border bg-surface">
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

      {/* ── Free Part 1 Preview ───────────────────────────────────────────── */}
      <section id="preview" className="py-12 sm:py-16 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Not ready yet?</p>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Watch Part 1 Free</h2>
            <p className="text-text-secondary text-sm">
              Full first lesson — video, slides, quiz. No account required.
            </p>
          </div>
          <Suspense fallback={
            <div className="rounded-2xl border border-border bg-surface overflow-hidden p-8">
              <div className="space-y-4">
                <div className="h-6 bg-surface-raised rounded w-1/3" />
                <div className="h-4 bg-surface-raised rounded w-1/2" />
                <div className="h-4 bg-surface-raised rounded w-3/4" />
                <div className="mt-6 aspect-video bg-surface-raised rounded-xl" />
              </div>
            </div>
          }>
            <Part1FullPreview
              checkoutHref={CHECKOUT_URL}
              ctaLabel="Get Student Lifetime Access — $29"
            />
          </Suspense>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
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
        <div className="max-w-md mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Start the Seerah From the Beginning
          </h2>
          <p className="text-text-secondary mb-1">
            Student price. One-time. Yours forever.
          </p>
          <p className="text-sm text-text-muted mb-8">
            This offer is available while the Ann Arbor student campaign is active.
          </p>
          <Link
            href={CHECKOUT_URL}
            data-track="student_lifetime_cta_clicked"
            data-plan="individual"
            className={`${primaryBtn} w-full py-4 text-base mb-3`}
          >
            Get Student Lifetime Access — $29
          </Link>
          <p className="text-xs text-text-muted">
            One-time payment · No subscription · 7-day refund guarantee
          </p>
          <p className="text-xs text-text-muted/40 mt-3">
            <a href="#preview" data-track="watch_part1_clicked" className="hover:text-text-muted/60 transition-colors">
              Or watch Part 1 free first
            </a>
          </p>
        </div>
      </section>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-ink/95 border-t border-gold/20 backdrop-blur-sm px-4 py-3">
        <Link
          href={CHECKOUT_URL}
          data-track="student_lifetime_cta_clicked"
          data-plan="individual"
          className="flex flex-col items-center justify-center w-full py-3.5 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-sm transition-colors shadow-lg shadow-gold/20"
        >
          <span>Ann Arbor Student Special — $29</span>
          <span className="text-[10px] font-normal mt-0.5 opacity-70">One-time payment · Keep forever</span>
        </Link>
      </div>

      <div className="pb-20 sm:pb-0">
        <Footer />
      </div>
    </div>
  );
}
