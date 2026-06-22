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
  /** Display name shown in "Recommended by" badge, e.g. "The Orthodox Muslim" */
  creatorName: string;
  /** Hero headline, e.g. "You came from The Orthodox Muslim." */
  heroHeadline: string;
  /** Price shown in hero + offer card, e.g. "$4.99/month" */
  price?: string;
  /** Full checkout URL */
  checkoutUrl: string;
  /** Defaults to "/watch-free" */
  watchFreeUrl?: string;
  /** Analytics event prefix */
  eventPrefix: string;
  /** Defaults to "Start Now" */
  checkoutButtonLabel?: string;
  // Legacy fields silently ignored in this layout
  heroSubheadline?: string;
  heroBody?: string;
  discountCode?: string;
  discountLabel?: string;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function InfluencerDirectLanding({ config }: { config: InfluencerDirectConfig }) {
  const offerRef  = useRef<HTMLDivElement>(null);
  const part1Ref  = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky]       = useState(false);
  const [offerViewed, setOfferViewed]     = useState(false);

  const price    = config.price ?? "$4.99/month";
  const btnLabel = config.checkoutButtonLabel ?? "Start Now";

  // Page view + sticky scroll listener
  useEffect(() => {
    safeTrack(config.creator, "influencer_page_view");
    const onScroll = () => setShowSticky(window.scrollY > 280);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [config.creator]);

  // Fire influencer_offer_viewed once
  useEffect(() => {
    if (!offerRef.current) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !offerViewed) {
        setOfferViewed(true);
        safeTrack(config.creator, "influencer_offer_viewed");
      }
    }, { threshold: 0.2 });
    obs.observe(offerRef.current);
    return () => obs.disconnect();
  }, [config.creator, offerViewed]);

  const scrollToOffer = useCallback(() => {
    offerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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

      {/* ── 1. HERO ────────────────────────────────────────────────────────── */}
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

          {/* Compact pain + solution */}
          <div className="space-y-3 text-base text-text-secondary leading-relaxed mb-5">
            <p>
              Most Muslims know scattered stories from the life of the Prophet ﷺ. But if we had
              to explain his life from beginning to end, many of us would struggle.
            </p>
            <p>
              Meanwhile, we and our children spend hours on shows, sports, anime, games, and
              social media.{" "}
              <span className="text-text font-semibold">That should bother us.</span>
            </p>
            <p>
              TheMuslimMan.com gives you the full Seerah in 100 structured lessons — video,
              reading, quiz, flashcards, summaries, progress tracking, and family profiles.
            </p>
          </div>

          {/* Price */}
          <p className="text-3xl font-extrabold text-text tracking-tight mb-5">{price}</p>

          {/* CTAs */}
          <button
            onClick={scrollToOffer}
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
      <section ref={offerRef} id="offer" className="bg-background px-5 py-8">
        <div className="max-w-md mx-auto">
          <div className="rounded-2xl border border-gold/30 bg-surface overflow-hidden shadow-xl shadow-black/20">
            <div className="px-5 py-6">
              <h2 className="text-lg font-bold text-text mb-3">
                Start the Full Seerah Course Today
              </h2>

              <p className="text-sm text-text-secondary leading-relaxed mb-4">
                Complete 100-part Seerah course — videos, readings, quizzes, flashcards,
                summaries, progress tracking, and family profiles.
              </p>

              <ul className="space-y-2 mb-5">
                {[
                  "Full 100-part structured Seerah path",
                  "Video, reading, quiz, flashcards per lesson",
                  "Progress tracking + family profiles",
                  "Start immediately — instant access",
                ].map((b) => (
                  <li key={b} className="flex items-center gap-2.5 text-sm text-text-secondary">
                    <CheckCircle className="w-4 h-4 text-gold flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>

              <p className="text-2xl font-extrabold text-text mb-1">{price}</p>
              <p className="text-xs text-text-muted mb-5">
                Cancel anytime · 7-day refund · Start immediately
              </p>

              <a
                href={config.checkoutUrl}
                onClick={onCheckoutCta}
                className="flex items-center justify-center w-full py-4 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-base transition-colors shadow-lg shadow-gold/25 mb-2"
              >
                {btnLabel}
              </a>
              <p className="text-xs text-text-muted text-center">Secure checkout · Instant access</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. PART 1 FREE PREVIEW ─────────────────────────────────────────── */}
      <section ref={part1Ref} id="part1" className="bg-surface px-5 py-10 border-t border-border">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-6">
            <p className="text-xs font-bold text-gold uppercase tracking-widest mb-1.5">
              Free · No Signup Required
            </p>
            <h2 className="text-xl font-bold text-text mb-1">Watch Part 1 Free</h2>
            <p className="text-sm text-text-secondary">
              Not ready yet? Get a real taste of the course before you start the full program.
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
              onClick={scrollToOffer}
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
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-muted truncate">{price}</p>
            </div>
            <button
              onClick={scrollToOffer}
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
