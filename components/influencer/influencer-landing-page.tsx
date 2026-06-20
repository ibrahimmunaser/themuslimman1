import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck, Lock, Zap, CheckCircle2, Play,
  Video, BookOpen, Monitor, LayoutGrid, FileText, ListChecks,
  GitBranch, Layers, HelpCircle, BarChart2,
} from "lucide-react";
import { Footer } from "@/components/landing/footer";
import { Part1FullPreview } from "@/components/landing/part1-full-preview";
import { InfluencerPromoSetter } from "./influencer-promo-setter";
import BrownieFunnelTracker from "./brownie-funnel-tracker";
import { R2VideoPlayer } from "@/app/deenresponds/r2-video-player";
import { InfluencerPricingToggle } from "./influencer-pricing-toggle";

// ── Config ─────────────────────────────────────────────────────────────────────

export interface InfluencerPageConfig {
  /** Slug used for tracking, e.g. "deenresponds" */
  creator: string;
  /** Human-readable influencer name, e.g. "Deen Responds" */
  displayName: string;
  /** Top badge text, e.g. "As seen on Deen Responds" */
  sourceBadge: string;
  /** Individual promo code stored in localStorage (optional — omit when no discount applies) */
  individualPromoCode?: string;
  /** Checkout URLs */
  individualUrl: string;
  familyUrl: string;
  /** Displayed prices (cents) */
  individualPriceCents: number;
  familyPriceCents: number;
  /** Optional regular (pre-discount) prices. Only shown when different from actual price. */
  regularIndividualPriceCents?: number;
  regularFamilyPriceCents?: number;
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
  /**
   * Monthly checkout URLs. When provided, a Monthly/Lifetime toggle replaces the
   * static pricing cards section. Attribution source + utm params should be included.
   */
  individualMonthlyUrl?: string;
  familyMonthlyUrl?: string;
  /**
   * Optional prefix for all analytics event names, e.g. "orthodox" produces
   * "orthodox_hero_watch_free_click" instead of "watch_part1_clicked".
   * Used by BrownieFunnelTracker's delegated click handler via data-track attributes.
   */
  trackingPrefix?: string;
}

// ── Shared styles ──────────────────────────────────────────────────────────────

const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold transition-colors shadow-lg shadow-gold/25";

// ── Static data ────────────────────────────────────────────────────────────────

const WHAT_YOU_GET = [
  { icon: <Video className="w-4 h-4" />,       label: "Video lesson"      },
  { icon: <BookOpen className="w-4 h-4" />,    label: "Read article"      },
  { icon: <Monitor className="w-4 h-4" />,     label: "Slides"            },
  { icon: <LayoutGrid className="w-4 h-4" />,  label: "Infographic"       },
  { icon: <FileText className="w-4 h-4" />,    label: "Lesson summary"    },
  { icon: <ListChecks className="w-4 h-4" />,  label: "Key facts"         },
  { icon: <GitBranch className="w-4 h-4" />,   label: "Mind map"          },
  { icon: <Layers className="w-4 h-4" />,      label: "Flashcards"        },
  { icon: <HelpCircle className="w-4 h-4" />,  label: "Review quiz"       },
  { icon: <BarChart2 className="w-4 h-4" />,   label: "Progress tracking" },
];

const FAQ = [
  {
    q: "Is Part 1 really free?",
    a: "Yes. Part 1 is completely free — full video, reading, slides, flashcards, and quiz. No signup or payment required. Just start watching.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Monthly plans can be cancelled at any time from your account dashboard. No call required, no hoops.",
  },
  {
    q: "Is there a refund guarantee?",
    a: "Yes — 7-day clarity guarantee. If the course doesn't feel right within 7 days, email us and we'll refund you in full. No questions asked.",
  },
  {
    q: "What happens right after I buy?",
    a: "You get immediate access. Set your password, create your profile, and start Part 1 — the whole process takes under 60 seconds.",
  },
  {
    q: "Can I use this with my family?",
    a: "Yes. The family plan includes up to 5 separate learner profiles. Each person tracks their own progress independently.",
  },
  {
    q: "Can I watch on mobile?",
    a: "Yes. Everything works on phone, tablet, and desktop. Many students go through lessons during commutes or before bed.",
  },
  {
    q: "Is this beginner-friendly?",
    a: "Yes. The course starts from the very beginning and goes step by step. No prior knowledge of Islamic history is required.",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtPrice(cents: number) {
  const dollars = cents / 100;
  return dollars % 1 === 0 ? `$${dollars.toFixed(0)}` : `$${dollars.toFixed(2)}`;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function InfluencerLandingPage({
  creator,
  displayName,
  sourceBadge,
  individualPromoCode = "",
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
  individualMonthlyUrl,
  familyMonthlyUrl,
  trackingPrefix,
}: InfluencerPageConfig) {
  const hasMonthlyPlans = !!(individualMonthlyUrl && familyMonthlyUrl);
  const indPrice    = fmtPrice(individualPriceCents);
  const famPrice    = fmtPrice(familyPriceCents);
  const regIndPrice = regularIndividualPriceCents ? fmtPrice(regularIndividualPriceCents) : null;
  const regFamPrice = regularFamilyPriceCents     ? fmtPrice(regularFamilyPriceCents)     : null;
  const showIndStrike = !!(regularIndividualPriceCents && regularIndividualPriceCents > individualPriceCents);
  const showFamStrike = !!(regularFamilyPriceCents     && regularFamilyPriceCents     > familyPriceCents);
  // Prefix analytics event names when trackingPrefix is set.
  const ev = (name: string) => trackingPrefix ? `${trackingPrefix}_${name}` : name;

  return (
    <div className="flex flex-col min-h-screen bg-ink text-text">
      {individualPromoCode && <InfluencerPromoSetter promoCode={individualPromoCode} />}
      <BrownieFunnelTracker
        creator={creator}
        promoCode={individualPromoCode}
        landingEvent={trackingPrefix ? `${trackingPrefix}_landing_view` : undefined}
      />

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

      {/* ── Hero + Preview side-by-side ──────────────────────────────────── */}
      <section id="preview" className="relative pt-14 pb-12 md:pt-20 md:pb-16 overflow-hidden scroll-mt-16">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 1100px 600px at 50% -10%, rgba(200,169,110,0.13) 0%, transparent 70%)" }}
          aria-hidden
        />
        <div className="relative max-w-[90rem] mx-auto px-6 sm:px-8">

        {/* ── Source badge — trust signal, centered ───────────────────── */}
        <div className="text-center mb-8">
          <p className="text-lg sm:text-xl font-bold text-gold tracking-wide">{sourceBadge}</p>
          <p className="text-sm text-text-muted mt-1">Exclusive community offer</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

        {/* ── Left: hero copy + CTA — sticky so it stays visible as preview scrolls ── */}
        <div className="text-center lg:text-left lg:pt-4 lg:sticky lg:top-24 lg:self-start">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.06] mb-5">
            You Know the Stories —{" "}
            <span className="block text-gradient-gold">But Not the Prophet&apos;s ﷺ Life in Order</span>
          </h1>

          <p className="text-lg sm:text-xl text-text-secondary max-w-xl mx-auto lg:mx-0 mb-5 leading-relaxed">
            Start Part 1 free and follow the full journey step by step — with video, reading, slides, flashcards, quizzes, and review tools.
          </p>

          {showHeroCard ? (
            /* ── Inline pricing card mode ─────────────────────────── */
            <div className="mt-2 w-full max-w-xs mx-auto lg:mx-0 text-left">
              <div className="relative rounded-2xl border-2 border-gold/60 bg-surface shadow-lg shadow-gold/10 p-6 flex flex-col">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold text-ink shadow-sm">
                    Main Offer
                  </span>
                </div>
                <p className="text-xl font-bold text-text mb-0.5">For Me</p>
                <p className="text-xs text-text-muted mb-4">Individual Lifetime Access</p>
                <div className="mb-5">
                  {showIndStrike && <span className="text-xs text-text-muted line-through mr-2">{regIndPrice}</span>}
                  <span className="text-5xl font-bold text-gold">{indPrice}</span>
                  <p className="text-xs text-gold/60 mt-1">one-time · no renewal ever</p>
                </div>
                <ul className="space-y-2 mb-7 flex-1">
                  {[
                    "Full access — yours forever",
                    "Videos, quizzes, flashcards, mind maps",
                    "Progress dashboard · Mobile friendly",
                    "One-time payment — no recurring charges",
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
              <p className="text-xs text-text-muted/50 mt-3 text-center lg:text-left">
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
            </div>
          ) : hasMonthlyPlans ? (
            /* ── Monthly-first mode — one primary action, reduce friction ── */
            <>
              {/* Price line — visible and confident */}
              <p className="text-xl font-bold text-gold mb-1">
                Full access from $4.99/month
              </p>

              {/* Trust bullets */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-3 gap-y-1 text-sm text-text-muted mb-6">
                <span>Cancel anytime</span>
                <span className="text-text-muted/30">·</span>
                <span>Instant access</span>
                <span className="text-text-muted/30">·</span>
                <span>7-day refund guarantee</span>
              </div>

              {/* Primary CTA — dominant, always full-width */}
              <a
                href="#preview"
                data-track={ev("hero_watch_free_click")}
                className={`${primaryBtn} w-full py-5 text-lg flex items-center justify-center gap-2`}
              >
                <Play className="w-5 h-5 fill-current" />
                Watch Part 1 Free
              </a>

              {/* Under-CTA trust micro-copy */}
              <p className="text-xs text-text-muted/70 text-center mb-4 mt-2">
                No signup required · Start in 5 minutes · Full Part 1 included
              </p>

              {/* Secondary CTA — credible, not ghosted */}
              <Link
                href={individualMonthlyUrl!}
                data-track={ev("hero_start_monthly_click")}
                data-plan="individual-monthly"
                className="block w-full py-4 rounded-xl border-2 border-gold/50 text-gold font-bold text-base text-center hover:border-gold hover:bg-gold/5 transition-colors mb-6"
              >
                Start Full Access — $4.99/month
              </Link>

              {/* Religious credibility */}
              <p className="text-sm text-text-muted/60 leading-relaxed text-center lg:text-left">
                Built from reliable Islamic source material and structured for serious learning.
              </p>
            </>
          ) : (
            /* ── Lifetime-only mode ───────────────────────────────── */
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
                data-track={ev("hero_lifetime_individual_click")}
                data-plan="individual"
                className={`${primaryBtn} px-10 py-4 text-base mb-4`}
              >
                Get Lifetime Access — {indPrice}
              </Link>

              <p className="text-xs text-text-muted/50 mb-2">
                Need family access?{" "}
                <Link
                  href={familyUrl}
                  data-track={ev("hero_lifetime_family_click")}
                  data-plan="family"
                  className="underline underline-offset-2 hover:text-text-muted transition-colors"
                >
                  Get Family Access — {famPrice}
                </Link>
              </p>

              <a
                href="#preview"
                data-track={ev("hero_watch_free_click")}
                className="inline-flex items-center gap-1 text-xs text-text-muted/40 hover:text-text-muted/60 transition-colors"
              >
                <Play className="w-3 h-3 flex-shrink-0" />
                Watch Part 1 free first
              </a>
            </>
          )}
        </div>{/* end left column */}

        {/* ── Right: Part 1 preview ─────────────────────────────── */}
        <div className="w-full lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto lg:rounded-2xl">
          <p className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3 text-center lg:text-left">
            Complete Preview — No Signup Required
          </p>
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
              hideCta={hasMonthlyPlans}
              checkoutHref={individualUrl}
              ctaLabel={`Get Lifetime Access — ${indPrice}`}
            />
          </Suspense>
          <p className="mt-3 text-sm text-center text-text-muted/70">
            Every part follows this same structure: video, reading, slides, infographic, mind map, flashcards, and quiz.
          </p>
        </div>{/* end right column */}

        </div>{/* end grid */}
        </div>{/* end max-w-7xl */}
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          PROOF SECTIONS
      ═════════════════════════════════════════════════════════════════════= */}

      {/* ── Sponsor video (optional) ─────────────────────────────────────── */}
      {sponsorVideoUrl && (
        <section className="py-12 bg-surface/30 border-y border-border/50">
          <div className={`mx-auto px-4 sm:px-6 text-center ${videoAspectClass === "aspect-portrait" ? "max-w-sm" : "max-w-2xl"}`}>
            <p className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-5">
              {videoSectionLabel ?? `Why ${displayName} recommended this`}
            </p>
            {videoAspectClass === "aspect-portrait" ? (
              <div className="mx-auto" style={{ maxWidth: "260px", aspectRatio: "9/16" }}>
                <R2VideoPlayer url={sponsorVideoUrl} title={`${displayName} — Complete Seerah`} label={`${displayName} on TheMuslimMan Seerah`} autoplay={false} trackEvent="sponsor_video_played" aspectClass="aspect-portrait" />
              </div>
            ) : (
              <div style={{ aspectRatio: "16/9" }}>
                <R2VideoPlayer url={sponsorVideoUrl} title={`${displayName} — Complete Seerah`} label={`${displayName} on TheMuslimMan Seerah`} autoplay={false} trackEvent="sponsor_video_played" aspectClass="aspect-video" />
              </div>
            )}
            <div className="mt-6 flex flex-col gap-3 max-w-xs mx-auto">
              {hasMonthlyPlans && (
                <Link href={individualMonthlyUrl!} data-track="individual_monthly_cta_clicked" data-plan="individual-monthly" className={`${primaryBtn} w-full py-3.5 text-sm`}>
                  Start Full Access — $4.99/month
                </Link>
              )}
              <a href="#preview" data-track="watch_part1_clicked" className="text-xs text-text-muted/60 hover:text-text-muted text-center underline underline-offset-2 transition-colors">
                Watch Part 1 free first
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ── Pain statement ───────────────────────────────────────────────── */}
      <section className="py-14 sm:py-20">
        <div className="max-w-2xl mx-auto px-6 sm:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-5">
            Most Muslims Know the Seerah in Pieces
          </h2>
          <p className="text-lg text-text-secondary leading-relaxed mb-7">
            You know Hira, the Hijrah, Badr, Uhud — but not how the Prophet&apos;s ﷺ full life flows from start to finish. This course gives you one clear path, in order.
          </p>
          <div className="flex flex-col gap-3 max-w-md mx-auto text-left">
            {["Learn in chronological order", "See how every event connects", "Follow one clear unbroken path"].map((line) => (
              <div key={line} className="flex items-center gap-3 py-3.5 px-5 rounded-xl bg-gold/5 border border-gold/15">
                <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0" />
                <span className="text-base font-medium text-text">{line}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What You Get Inside ──────────────────────────────────────────── */}
      <section className="py-14 sm:py-20 bg-surface/20 border-y border-border/50">
        <div className="max-w-5xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-text mb-3">
              Everything included in every lesson
            </h2>
            <p className="text-lg text-text-secondary">Every part follows the same structure — so every lesson feels familiar and complete.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {WHAT_YOU_GET.map((card) => (
              <div key={card.label} className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-surface">
                <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center text-gold flex-shrink-0">
                  {card.icon}
                </div>
                <p className="text-sm font-medium text-text-secondary leading-tight">{card.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing toggle (monthly + lifetime) ──────────────────────────── */}
      {hasMonthlyPlans && !showHeroCard && (
        <InfluencerPricingToggle
          displayName={displayName}
          individualMonthlyUrl={individualMonthlyUrl!}
          familyMonthlyUrl={familyMonthlyUrl!}
          individualLifetimeUrl={individualUrl}
          familyLifetimeUrl={familyUrl}
          individualLifetimePriceCents={individualPriceCents}
          familyLifetimePriceCents={familyPriceCents}
          regularIndividualPriceCents={regularIndividualPriceCents}
          regularFamilyPriceCents={regularFamilyPriceCents}
          trackingPrefix={trackingPrefix}
        />
      )}

      {/* ── Static pricing cards (lifetime-only pages) ───────────────────── */}
      {!hasMonthlyPlans && showPricingCards && !showHeroCard && <section id="pricing" className="pb-12 scroll-mt-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
            <div className="relative rounded-2xl border-2 border-gold/60 bg-surface shadow-lg shadow-gold/10 p-6 flex flex-col">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold text-ink shadow-sm">Main Offer</span>
              </div>
              <p className="text-xl font-bold text-text mb-0.5">For Me</p>
              <p className="text-xs text-text-muted mb-4">Individual Lifetime Access</p>
              <div className="mb-5">
                {showIndStrike && <span className="text-xs text-text-muted line-through mr-2">{regIndPrice}</span>}
                <span className="text-5xl font-bold text-gold">{indPrice}</span>
                <p className="text-xs text-gold/60 mt-1">one-time · no renewal ever</p>
              </div>
              <ul className="space-y-2 mb-7 flex-1">
                {["Full access — yours forever","Videos, quizzes, flashcards, mind maps","Progress dashboard · Mobile friendly","One-time payment — no recurring charges"].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-text-secondary">
                    <CheckCircle2 className="w-3.5 h-3.5 text-gold flex-shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>
              <Link href={individualUrl} data-track="individual_lifetime_cta_clicked" data-plan="individual" className="block w-full py-4 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-base text-center transition-colors shadow-lg shadow-gold/25">
                Get Lifetime Access — {indPrice}
              </Link>
            </div>
            <div className="relative rounded-2xl border border-border bg-surface/50 p-5 flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-surface border border-border text-text-muted">For Households</span>
              </div>
              <p className="text-base font-bold text-text mb-0.5">For My Family</p>
              <p className="text-xs text-text-muted mb-4">Family Lifetime · up to 5 profiles</p>
              <div className="mb-4">
                {showFamStrike && <span className="text-xs text-text-muted line-through mr-2">{regFamPrice}</span>}
                <span className="text-3xl font-bold text-gold">{famPrice}</span>
                <p className="text-xs text-text-muted mt-0.5">one-time</p>
              </div>
              <ul className="space-y-1.5 mb-5 flex-1">
                {["Everything in Individual","5 separate learner profiles","One payment for the whole household"].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-text-secondary">
                    <CheckCircle2 className="w-3.5 h-3.5 text-gold/60 flex-shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>
              <Link href={familyUrl} data-track="family_lifetime_cta_clicked" data-plan="family" className="block w-full py-3 rounded-xl border border-gold/30 text-gold font-semibold text-sm text-center hover:bg-gold/5 transition-colors">
                Get Family Access — {famPrice}
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap text-xs text-text-muted mt-5">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-gold/60" />7-day refund guarantee</span>
            <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-gold/60" />Secure checkout</span>
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-gold/60" />Instant access</span>
          </div>
        </div>
      </section>}


      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-14 sm:py-20 bg-surface/20 border-t border-border/50">
        <div className="max-w-3xl mx-auto px-6 sm:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">Quick Questions</h2>
          <div className="space-y-3">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="p-5 sm:p-6 rounded-xl bg-surface border border-border">
                <p className="font-semibold text-text text-base mb-1.5">{q}</p>
                <p className="text-sm sm:text-base text-text-secondary leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24">
        <div className="max-w-xl mx-auto px-6 sm:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            Start the Prophet&apos;s ﷺ Life in Order
          </h2>
          <p className="text-lg text-text-secondary mb-8">
            You have seen what the course looks like. Start now and keep going.
          </p>
          <div className="flex flex-col gap-3 mb-5">
            {/* Bottom of page: user is warm — lead with the paid action */}
            {hasMonthlyPlans ? (
              <Link
                href={individualMonthlyUrl!}
                data-track={ev("final_start_full_access_click")}
                data-plan="individual-monthly"
                className={`${primaryBtn} w-full py-5 text-lg`}
              >
                Start Full Access — $4.99/month
              </Link>
            ) : (
              <Link
                href={individualUrl}
                data-track={ev("final_lifetime_individual_click")}
                data-plan="individual"
                className={`${primaryBtn} w-full py-5 text-lg`}
              >
                Get Lifetime Access — {indPrice}
              </Link>
            )}
            <a
              href="#preview"
              data-track={ev("final_watch_free_click")}
              className="inline-flex items-center justify-center rounded-xl border-2 border-gold/40 text-gold font-bold hover:border-gold/70 hover:bg-gold/5 transition-colors w-full py-4 text-base"
            >
              Watch Part 1 Free First
            </a>
          </div>
          <p className="text-sm text-text-muted mb-3">Cancel anytime · 7-day refund guarantee · Instant access</p>
          {hasMonthlyPlans && (
            <Link
              href={individualUrl}
              data-track={ev("final_lifetime_link_click")}
              data-plan="individual"
              className="text-sm text-text-muted/60 hover:text-text-muted transition-colors underline underline-offset-2"
            >
              Prefer one payment? Lifetime access is {indPrice}
            </Link>
          )}
        </div>
      </section>

      <div className="pb-20 sm:pb-0">
        <Footer />
      </div>
    </div>
  );
}
