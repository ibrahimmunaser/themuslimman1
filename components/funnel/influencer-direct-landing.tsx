"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { nanoid } from "nanoid";
import { CheckCircle } from "lucide-react";
import { InlinePart1Video } from "@/components/landing/inline-part1-video";

// ── Analytics ──────────────────────────────────────────────────────────────────

function getVisitorId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    const key = "tmm_vid";
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const id = nanoid();
    localStorage.setItem(key, id);
    return id;
  } catch { return nanoid(); }
}

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    const key = "tmm_sid";
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const id = nanoid();
    sessionStorage.setItem(key, id);
    return id;
  } catch { return nanoid(); }
}

async function safeTrack(creator: string, eventType: string, extra: Record<string, unknown> = {}) {
  try {
    await fetch("/api/influencer/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creator,
        eventType,
        sessionId: getSessionId(),
        visitorId: getVisitorId(),
        route: typeof window !== "undefined" ? window.location.pathname : null,
        ...extra,
      }),
    });
  } catch { /* analytics must never break the page */ }
}

// ── Config ─────────────────────────────────────────────────────────────────────

export interface InfluencerDirectConfig {
  /** creator slug — must match KNOWN_CREATORS in track API */
  creator: string;
  /** Display name, e.g. "The Orthodox Muslim" */
  creatorName: string;
  /** Hero headline, e.g. "You came from The Orthodox Muslim." */
  heroHeadline: string;
  /** Price shown in hero + offer card, e.g. "$4.99/month" or "$59 one-time" */
  price?: string;
  /** Discount/offer label, e.g. "The Orthodox Muslim discount is already applied." */
  discountLabel: string;
  /** Discount code shown in the offer badge, e.g. "ORTHODOX59" */
  discountCode?: string;
  /** Full checkout URL with promo pre-applied */
  checkoutUrl: string;
  /** Defaults to "/watch-free" */
  watchFreeUrl?: string;
  /** Analytics event prefix */
  eventPrefix: string;
  /** Defaults to "Start Now" */
  checkoutButtonLabel?: string;
  // Legacy fields (ignored in new layout — kept for backward compat)
  heroSubheadline?: string;
  heroBody?: string;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function InfluencerDirectLanding({ config }: { config: InfluencerDirectConfig }) {
  const checkoutRef    = useRef<HTMLDivElement>(null);
  const part1Ref       = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky]         = useState(false);
  const [checkoutViewed, setCheckoutViewed] = useState(false);

  const btnLabel = config.checkoutButtonLabel ?? "Start Now";

  useEffect(() => {
    safeTrack(config.creator, "influencer_page_view");
    const onScroll = () => setShowSticky(window.scrollY > 320);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [config.creator]);

  useEffect(() => {
    if (!checkoutRef.current) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !checkoutViewed) {
        setCheckoutViewed(true);
        safeTrack(config.creator, "influencer_checkout_viewed");
      }
    }, { threshold: 0.2 });
    obs.observe(checkoutRef.current);
    return () => obs.disconnect();
  }, [config.creator, checkoutViewed]);

  const scrollToCheckout = useCallback(() => {
    checkoutRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    safeTrack(config.creator, "influencer_primary_cta_click");
  }, [config.creator]);

  const scrollToPart1 = useCallback(() => {
    part1Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    safeTrack(config.creator, "influencer_part1_cta_click");
  }, [config.creator]);

  const onPart1Started = useCallback(() => {
    safeTrack(config.creator, "influencer_part1_started");
  }, [config.creator]);

  const onCheckoutCta = useCallback(() => {
    safeTrack(config.creator, "influencer_checkout_cta_click");
  }, [config.creator]);

  return (
    <div className="min-h-screen bg-background text-text">

      {/* ── 1. HERO (compact — pain, solution, price, CTAs all in one) ─────── */}
      <section className="bg-gradient-to-b from-surface to-background px-5 pt-12 pb-10">
        <div className="max-w-xl mx-auto">

          {/* Source badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/25 text-gold text-xs font-bold tracking-wide mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            Recommended by {config.creatorName}
          </div>

          {/* Headline */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text leading-tight mb-5">
            {config.heroHeadline}
          </h1>

          {/* Pain + solution copy — compact, all inline */}
          <div className="space-y-2 text-base text-text-secondary leading-relaxed mb-5">
            <p>
              Most Muslims know scattered stories from the life of the Prophet ﷺ.
              But if we had to explain his life from beginning to end, many of us would struggle.
            </p>
            <p>
              Meanwhile, we and our children spend hours on shows, sports, anime, games, and social media.{" "}
              <span className="text-text font-semibold">That should bother us.</span>
            </p>
          </div>

          {/* Course pitch — two lines */}
          <p className="text-sm font-semibold text-text mb-1">
            TheMuslimMan.com gives you the full Seerah in 100 structured lessons.
          </p>
          <p className="text-xs text-text-muted mb-6">
            Video · Reading · Quiz · Flashcards · Summaries · Progress tracking · Family profiles
          </p>

          {/* Discount label + price */}
          <div className="mb-5">
            <p className="text-xs text-gold font-semibold mb-1">{config.discountLabel}</p>
            {config.price && (
              <p className="text-3xl font-extrabold text-text tracking-tight">
                {config.price}
              </p>
            )}
          </div>

          {/* CTAs */}
          <button
            onClick={scrollToCheckout}
            className="w-full py-4 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-base transition-colors shadow-lg shadow-gold/20 mb-3"
          >
            Start the Full Course
          </button>
          <div className="text-center">
            <button
              onClick={scrollToPart1}
              className="text-sm text-text-muted hover:text-gold transition-colors underline underline-offset-2"
            >
              Or watch Part 1 free first
            </button>
          </div>
        </div>
      </section>

      {/* ── 2. OFFER CARD ──────────────────────────────────────────────────── */}
      <section ref={checkoutRef} id="checkout" className="bg-background px-5 py-8">
        <div className="max-w-md mx-auto">
          <div className="rounded-2xl border border-gold/30 bg-surface overflow-hidden shadow-xl shadow-black/20">

            {/* Badge */}
            <div className="bg-gold/10 border-b border-gold/20 px-5 py-2.5 text-center">
              <span className="text-xs font-bold text-gold uppercase tracking-widest">
                {config.discountCode
                  ? `Code ${config.discountCode} — applied automatically`
                  : config.discountLabel}
              </span>
            </div>

            <div className="px-5 py-6">
              <h2 className="text-lg font-bold text-text mb-1">
                Start the Full Seerah Course Today
              </h2>
              <p className="text-sm text-text-secondary mb-4">
                {config.discountLabel}
              </p>

              <p className="text-sm text-text-secondary leading-relaxed mb-4">
                Complete 100-part Seerah course — videos, readings, quizzes, flashcards,
                summaries, progress tracking, and family profiles.
              </p>

              {/* Price */}
              {config.price && (
                <p className="text-2xl font-extrabold text-text mb-2">{config.price}</p>
              )}

              {/* Reassurance — single line */}
              <p className="text-xs text-text-muted mb-5">
                Cancel anytime · 7-day refund · Start immediately
              </p>

              {/* CTA */}
              <a
                href={config.checkoutUrl}
                onClick={onCheckoutCta}
                className="flex items-center justify-center w-full py-4 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-base transition-colors shadow-lg shadow-gold/25 mb-2"
              >
                {btnLabel}
              </a>
              <p className="text-xs text-text-muted text-center">
                Secure checkout · Instant access
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. PART 1 FREE PREVIEW ─────────────────────────────────────────── */}
      <section ref={part1Ref} id="part1" className="bg-surface px-5 py-10 border-t border-border">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-6">
            <p className="text-xs font-bold text-gold uppercase tracking-widest mb-1.5">
              Free — No Signup Required
            </p>
            <h2 className="text-xl font-bold text-text mb-1">Watch Part 1 Free</h2>
            <p className="text-sm text-text-secondary">
              Get a real taste of the course before you start the full program.
            </p>
          </div>

          <InlinePart1Video
            checkoutUrl={config.checkoutUrl}
            checkoutLabel="Start the Full Course"
            onVideoStart={onPart1Started}
            onUnlockClick={onCheckoutCta}
          />

          <div className="mt-5 text-center">
            <button
              onClick={scrollToCheckout}
              className="inline-flex items-center justify-center py-3.5 px-7 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-sm transition-colors shadow-md shadow-gold/20"
            >
              Start the Full Course
            </button>
          </div>
        </div>
      </section>

      {/* ── Mobile sticky CTA ──────────────────────────────────────────────── */}
      {showSticky && (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-3 bg-background/95 backdrop-blur-sm border-t border-border sm:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              {config.price && (
                <p className="text-xs text-text-muted truncate">{config.price}</p>
              )}
            </div>
            <button
              onClick={scrollToCheckout}
              className="flex-shrink-0 py-3 px-6 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-sm transition-colors"
            >
              Start the Course
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
