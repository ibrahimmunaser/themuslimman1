import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck, Lock, Zap, CheckCircle2, Play,
  Video, Monitor, LayoutGrid, FileText, ListChecks,
  GitBranch, Layers, HelpCircle,
} from "lucide-react";
import { Footer } from "@/components/landing/footer";
import { Part1FullPreview } from "@/components/landing/part1-full-preview";
import { InfluencerPromoSetter } from "./influencer-promo-setter";
import BrownieFunnelTracker from "./brownie-funnel-tracker";
import { R2VideoPlayer } from "@/app/deenresponds/r2-video-player";

// ── Config ─────────────────────────────────────────────────────────────────────

export interface InfluencerPageConfig {
  /** Slug used for tracking, e.g. "deenresponds" */
  creator: string;
  /** Human-readable influencer name, e.g. "Deen Responds" */
  displayName: string;
  /** Top badge text, e.g. "As seen on Deen Responds" */
  sourceBadge: string;
  /** Individual promo code stored in localStorage, e.g. "DEEN59" */
  individualPromoCode: string;
  /** Checkout URLs */
  individualUrl: string;
  familyUrl: string;
  /** Displayed prices (cents) */
  individualPriceCents: number;
  familyPriceCents: number;
  regularIndividualPriceCents: number;
  regularFamilyPriceCents: number;
  /** Optional signed R2 URL. When provided, a sponsor video section is shown. */
  sponsorVideoUrl?: string | null;
  /** Label above the video section, e.g. "Why Deen Responds recommended this" */
  videoSectionLabel?: string;
  /**
   * Aspect ratio class passed to R2VideoPlayer.
   * "aspect-portrait" (9:16) for vertical reels — default for Brownie-style content.
   * "aspect-video"    (16:9) for landscape YouTube-style videos — use for Deen Responds.
   */
  videoAspectClass?: "aspect-portrait" | "aspect-video";
  /**
   * When false, hides the two-card pricing grid below the hero.
   * Use for single-offer pages where the hero already shows the price + family footnote.
   * Defaults to true.
   */
  showPricingCards?: boolean;
  /**
   * When true, replaces the plain hero CTA button with the full individual pricing card.
   * The separate pricing grid section is automatically hidden when this is enabled.
   * Defaults to false.
   */
  showHeroCard?: boolean;
}

// ── Shared styles ──────────────────────────────────────────────────────────────

const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold transition-colors shadow-lg shadow-gold/25";
const outlineBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-gold/40 text-gold font-semibold hover:bg-gold/5 transition-colors";

// ── Static data ────────────────────────────────────────────────────────────────

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
    a: "No. The discount is applied automatically at checkout when you use any link on this page.",
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

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtPrice(cents: number) {
  return `$${Math.round(cents / 100)}`;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function InfluencerLandingPage({
  creator,
  displayName,
  sourceBadge,
  individualPromoCode,
  individualUrl,
  familyUrl,
  individualPriceCents,
  familyPriceCents,
  regularIndividualPriceCents,
  regularFamilyPriceCents,
  sponsorVideoUrl,
  videoSectionLabel,
  videoAspectClass = "aspect-portrait",
  showPricingCards = true,
  showHeroCard = false,
  // monthlyUrl intentionally unused — monthly/trial plans removed from UI
}: InfluencerPageConfig) {
  const indPrice    = fmtPrice(individualPriceCents);
  const famPrice    = fmtPrice(familyPriceCents);
  const regIndPrice = fmtPrice(regularIndividualPriceCents);
  const regFamPrice = fmtPrice(regularFamilyPriceCents);

  return (
    <div className="flex flex-col min-h-screen bg-ink text-text">
      <InfluencerPromoSetter promoCode={individualPromoCode} />
      <BrownieFunnelTracker creator={creator} promoCode={individualPromoCode} />

      {/* ── Header — logo only, no competing CTA ────────────────────────── */}
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

      {/* ══════════════════════════════════════════════════════════════════════
          ABOVE THE FOLD — offer is the first thing they see
      ═════════════════════════════════════════════════════════════════════= */}

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-10 md:pt-16 md:pb-12 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 900px 500px at 50% -10%, rgba(200,169,110,0.12) 0%, transparent 70%)" }}
          aria-hidden
        />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            <p className="text-xs text-gold font-semibold uppercase tracking-widest">{sourceBadge}</p>
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.08] mb-3">
            Learn the Prophet&apos;s ﷺ Life{" "}
            <span className="text-gradient-gold">in Order</span>
          </h1>

          <p className="text-base sm:text-lg text-text-secondary max-w-lg mx-auto mb-5 leading-relaxed">
            Most Muslims know scattered stories from the Seerah, but not the Prophet&apos;s ﷺ life as one connected journey. This 100-part course helps you learn it step by step.
          </p>

          {showHeroCard ? (
            /* ── Inline pricing card mode ─────────────────────────── */
            <div className="mt-2 w-full max-w-xs mx-auto text-left">
              <div className="relative rounded-2xl border-2 border-gold/60 bg-surface shadow-lg shadow-gold/10 p-6 flex flex-col">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold text-ink shadow-sm">
                    Main Offer
                  </span>
                </div>
                <p className="text-xl font-bold text-text mb-0.5">For Me</p>
                <p className="text-xs text-text-muted mb-4">Individual Lifetime Access</p>
                <div className="mb-5">
                  <span className="text-xs text-text-muted line-through mr-2">{regIndPrice}</span>
                  <span className="text-5xl font-bold text-gold">{indPrice}</span>
                  <p className="text-xs text-gold/60 mt-1">one-time · no renewal ever</p>
                </div>
                <ul className="space-y-2 mb-7 flex-1">
                  {[
                    "All 100 parts, unlocked immediately",
                    "Videos, quizzes, flashcards, mind maps",
                    "Progress dashboard · Mobile friendly",
                    "One-time payment — yours for life",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-text-secondary">
                      <CheckCircle2 className="w-3.5 h-3.5 text-gold flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={individualUrl}
                  data-track="individual_lifetime_cta_clicked"
                  data-plan="individual"
                  className="block w-full py-4 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-base text-center transition-colors shadow-lg shadow-gold/25"
                >
                  Get Lifetime Access — {indPrice}
                </Link>
              </div>
              <p className="text-xs text-text-muted/50 mt-3 text-center">
                Need family access?{" "}
                <Link
                  href={familyUrl}
                  data-track="family_lifetime_cta_clicked"
                  data-plan="family"
                  className="underline underline-offset-2 hover:text-text-muted transition-colors"
                >
                  Get Family Access — {famPrice}
                </Link>
              </p>
              <div className="flex justify-center mt-2">
                <a
                  href="#preview"
                  data-track="watch_part1_clicked"
                  className="inline-flex items-center gap-1 text-xs text-text-muted/40 hover:text-text-muted/60 transition-colors"
                >
                  <Play className="w-3 h-3 flex-shrink-0" />
                  Watch Part 1 free first
                </a>
              </div>
            </div>
          ) : (
            /* ── Standard button mode ─────────────────────────────── */
            <>
              <p className="text-3xl sm:text-4xl font-bold text-gold mb-1">
                Lifetime access from {indPrice}
              </p>
              <p className="text-xs text-gold/60 mb-1">
                {displayName} campaign discount applied — pricing may return to normal after launch.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-text-muted mb-7">
                <span>One-time payment</span>
                <span className="hidden sm:inline text-text-muted/30">·</span>
                <span>No subscription</span>
                <span className="hidden sm:inline text-text-muted/30">·</span>
                <span>7-day refund guarantee</span>
              </div>

              <Link
                href={individualUrl}
                data-track="individual_lifetime_cta_clicked"
                data-plan="individual"
                className={`${primaryBtn} px-10 py-4 text-base mb-4`}
              >
                Get Lifetime Access — {indPrice}
              </Link>

              <p className="text-xs text-text-muted/50 mb-2">
                Need family access?{" "}
                <Link
                  href={familyUrl}
                  data-track="family_lifetime_cta_clicked"
                  data-plan="family"
                  className="underline underline-offset-2 hover:text-text-muted transition-colors"
                >
                  Get Family Access — {famPrice}
                </Link>
              </p>

              <a
                href="#preview"
                data-track="watch_part1_clicked"
                className="inline-flex items-center gap-1 text-xs text-text-muted/40 hover:text-text-muted/60 transition-colors"
              >
                <Play className="w-3 h-3 flex-shrink-0" />
                Watch Part 1 free first
              </a>
            </>
          )}
        </div>
      </section>

      {/* ── Pricing cards — shown only when showPricingCards is true and hero card is not shown ── */}
      {showPricingCards && !showHeroCard && <section id="pricing" className="pb-12 scroll-mt-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">

            {/* For Me — dominant primary card */}
            <div className="relative rounded-2xl border-2 border-gold/60 bg-surface shadow-lg shadow-gold/10 p-6 flex flex-col">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold text-ink shadow-sm">
                  Main Offer
                </span>
              </div>
              <p className="text-xl font-bold text-text mb-0.5">For Me</p>
              <p className="text-xs text-text-muted mb-4">Individual Lifetime Access</p>
              <div className="mb-5">
                <span className="text-xs text-text-muted line-through mr-2">{regIndPrice}</span>
                <span className="text-5xl font-bold text-gold">{indPrice}</span>
                <p className="text-xs text-gold/60 mt-1">one-time · no renewal ever</p>
              </div>
              <ul className="space-y-2 mb-7 flex-1">
                {[
                  "All 100 parts, unlocked immediately",
                  "Videos, quizzes, flashcards, mind maps",
                  "Progress dashboard · Mobile friendly",
                  "One-time payment — yours for life",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-text-secondary">
                    <CheckCircle2 className="w-3.5 h-3.5 text-gold flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={individualUrl}
                data-track="individual_lifetime_cta_clicked"
                data-plan="individual"
                className="block w-full py-4 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-base text-center transition-colors shadow-lg shadow-gold/25"
              >
                Get Lifetime Access — {indPrice}
              </Link>
            </div>

            {/* For My Family — secondary card, visually quieter */}
            <div className="relative rounded-2xl border border-border bg-surface/50 p-5 flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-surface border border-border text-text-muted">
                  For Households
                </span>
              </div>
              <p className="text-base font-bold text-text mb-0.5">For My Family</p>
              <p className="text-xs text-text-muted mb-4">Family Lifetime · up to 5 profiles</p>
              <div className="mb-4">
                <span className="text-xs text-text-muted line-through mr-2">{regFamPrice}</span>
                <span className="text-3xl font-bold text-gold">{famPrice}</span>
                <p className="text-xs text-text-muted mt-0.5">one-time</p>
              </div>
              <ul className="space-y-1.5 mb-5 flex-1">
                {[
                  "Everything in Individual",
                  "5 separate learner profiles",
                  "One payment for the whole household",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-text-secondary">
                    <CheckCircle2 className="w-3.5 h-3.5 text-gold/60 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={familyUrl}
                data-track="family_lifetime_cta_clicked"
                data-plan="family"
                className="block w-full py-3 rounded-xl border border-gold/30 text-gold font-semibold text-sm text-center hover:bg-gold/5 transition-colors"
              >
                Get Family Access — {famPrice}
              </Link>
            </div>
          </div>

          {/* Trust row */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap text-xs text-text-muted mt-5">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-gold/60" />7-day refund guarantee</span>
            <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-gold/60" />Secure checkout</span>
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-gold/60" />Instant access</span>
          </div>

        </div>
      </section>}

      {/* ══════════════════════════════════════════════════════════════════════
          PROOF SECTIONS
      ═════════════════════════════════════════════════════════════════════= */}

      {/* ── Sponsor video (optional) — portrait reel style ──────────────── */}
      {sponsorVideoUrl && (
        <section className="py-12 bg-surface/30 border-y border-border/50">
          <div className={`mx-auto px-4 sm:px-6 text-center ${videoAspectClass === "aspect-portrait" ? "max-w-sm" : "max-w-2xl"}`}>
            <p className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-5">
              {videoSectionLabel ?? `Why ${displayName} recommended this`}
            </p>
            {videoAspectClass === "aspect-portrait" ? (
              /* Portrait — narrow centered column like an Instagram reel */
              <div className="mx-auto" style={{ maxWidth: "260px", aspectRatio: "9/16" }}>
                <R2VideoPlayer
                  url={sponsorVideoUrl}
                  title={`${displayName} — Complete Seerah`}
                  label={`${displayName} on TheMuslimMan Seerah`}
                  autoplay={false}
                  trackEvent="sponsor_video_played"
                  aspectClass="aspect-portrait"
                />
              </div>
            ) : (
              /* Landscape — full width 16:9 */
              <div style={{ aspectRatio: "16/9" }}>
                <R2VideoPlayer
                  url={sponsorVideoUrl}
                  title={`${displayName} — Complete Seerah`}
                  label={`${displayName} on TheMuslimMan Seerah`}
                  autoplay={false}
                  trackEvent="sponsor_video_played"
                  aspectClass="aspect-video"
                />
              </div>
            )}
            <div className="mt-6">
              <Link
                href={individualUrl}
                data-track="individual_lifetime_cta_clicked"
                data-plan="individual"
                className={`${primaryBtn} w-full py-3.5 text-sm`}
              >
                Get Lifetime Access — {indPrice}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Pain statement ───────────────────────────────────────────────── */}
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

      {/* ── Free Part 1 Preview — backup path ───────────────────────────── */}
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
              checkoutHref={individualUrl}
              ctaLabel={`Get Lifetime Access — ${indPrice}`}
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
        <div className="max-w-lg mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Start the Seerah From the Beginning
          </h2>
          <p className="text-text-secondary mb-2">
            {displayName} deal. Lifetime. Discounted. One-time payment.
          </p>
          <p className="text-sm text-text-muted mb-8">
            Prices may return to normal after this promotion ends.
          </p>
          <div className="flex flex-col gap-3 mb-4">
            <Link href={individualUrl} data-track="individual_lifetime_cta_clicked" data-plan="individual" className={`${primaryBtn} w-full py-4 text-base`}>
              Get Lifetime Access — {indPrice}
            </Link>
            <Link href={familyUrl} data-track="family_lifetime_cta_clicked" data-plan="family" className="inline-flex items-center justify-center gap-2 rounded-xl border border-gold/30 text-gold/70 font-medium hover:text-gold hover:border-gold/50 transition-colors w-full py-3.5 text-sm">
              Get Family Access — {famPrice}
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
    </div>
  );
}
