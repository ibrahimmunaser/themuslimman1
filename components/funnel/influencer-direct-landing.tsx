"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { nanoid } from "nanoid";
import { CheckCircle, ChevronDown, BookOpen } from "lucide-react";
import { InlinePart1Video } from "@/components/landing/inline-part1-video";

// ── Analytics helpers ──────────────────────────────────────────────────────────

function getVisitorId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    const key = "tmm_vid";
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const id = nanoid();
    localStorage.setItem(key, id);
    return id;
  } catch {
    return nanoid();
  }
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
  } catch {
    return nanoid();
  }
}

async function safeTrack(
  creator: string,
  eventType: string,
  extra: Record<string, unknown> = {}
) {
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
  } catch {
    // analytics must never break the page
  }
}

// ── Config type ────────────────────────────────────────────────────────────────

export interface InfluencerDirectConfig {
  /** creator slug, must match KNOWN_CREATORS in track API */
  creator: string;
  /** Display name, e.g. "The Orthodox Muslim" */
  creatorName: string;
  /** Hero headline, e.g. "You came from The Orthodox Muslim." */
  heroHeadline: string;
  /** Hero subheadline, e.g. "So you probably already know this is important." */
  heroSubheadline: string;
  /** Optional body copy below subheadline. Falls back to universal copy. */
  heroBody?: string;
  /** Discount code shown in checkout section, e.g. "ORTHODOX59" */
  discountCode?: string;
  /** Checkout section body copy, e.g. "The Orthodox Muslim discount is already applied." */
  discountLabel: string;
  /** Full checkout URL with promo pre-applied */
  checkoutUrl: string;
  /** Defaults to "/watch-free" */
  watchFreeUrl?: string;
  /** Used as prefix for analytics event names */
  eventPrefix: string;
  /** Defaults to "Start Now" */
  checkoutButtonLabel?: string;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function InfluencerDirectLanding({ config }: { config: InfluencerDirectConfig }) {
  const checkoutRef = useRef<HTMLDivElement>(null);
  const part1Ref    = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);
  const [checkoutViewed, setCheckoutViewed] = useState(false);

  const checkoutUrl = config.checkoutUrl;
  const btnLabel    = config.checkoutButtonLabel ?? "Start Now";

  // ── mount: page view + sticky scroll ──────────────────────────────────────
  useEffect(() => {
    safeTrack(config.creator, "influencer_page_view");

    const onScroll = () => setShowSticky(window.scrollY > 480);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [config.creator]);

  // ── IntersectionObserver: fire checkout_viewed once ────────────────────────
  useEffect(() => {
    if (!checkoutRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !checkoutViewed) {
          setCheckoutViewed(true);
          safeTrack(config.creator, "influencer_checkout_viewed");
        }
      },
      { threshold: 0.25 }
    );
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
    safeTrack(config.creator, "influencer_checkout_cta_click", { plan: "individual-lifetime" });
  }, [config.creator]);

  return (
    <div className="min-h-screen bg-background text-text">

      {/* ──────────────────────────────────────────────────────────────────────
          1. HERO
      ────────────────────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-b from-surface via-surface/60 to-background px-5 pt-16 pb-14 text-center">
        <div className="max-w-2xl mx-auto">

          {/* Source badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold/10 border border-gold/25 text-gold text-xs font-bold tracking-wide mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            Recommended by {config.creatorName}
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-text leading-tight tracking-tight mb-4">
            {config.heroHeadline}
          </h1>
          <p className="text-lg sm:text-xl text-text-secondary mb-4 leading-relaxed font-medium">
            {config.heroSubheadline}
          </p>
          <p className="text-base text-text-muted leading-relaxed mb-10 max-w-lg mx-auto">
            {config.heroBody ??
              "Every Muslim should know the life of the Prophet ﷺ from beginning to end. But honestly, many of us do not. Not because we do not care — but because most of us are not going to sit down and finish a full Seerah book from beginning to end."}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={scrollToCheckout}
              className="px-8 py-4 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-base transition-colors shadow-lg shadow-gold/20"
            >
              Start the Full Seerah Course
            </button>
            <button
              onClick={scrollToPart1}
              className="px-8 py-4 rounded-xl bg-surface border border-border hover:border-gold/40 text-text font-semibold text-base transition-colors"
            >
              Watch Part 1 Free
            </button>
          </div>

          <div className="mt-12 flex justify-center opacity-30">
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────
          2. PAIN / FRUSTRATION
      ────────────────────────────────────────────────────────────────────── */}
      <section className="bg-surface px-5 py-14">
        <div className="max-w-xl mx-auto space-y-5 text-base leading-relaxed">
          <p className="text-text font-semibold text-lg">So we hear scattered stories.</p>
          <p className="text-text-secondary">
            Badr. Uhud. The Hijrah. Makkah. Madinah.
          </p>
          <p className="text-text-secondary">
            But if someone asked us to explain the life of the Prophet ﷺ in order,{" "}
            many of us would struggle.
          </p>
          <p className="text-text font-semibold text-lg">And that should bother us.</p>
          <p className="text-text-secondary">
            Especially when we look at how much time we and our children spend on entertainment.
          </p>
          <p className="text-text-secondary">
            Shows. Movies. Sports. Anime. Games. Social media.
          </p>
          <p className="text-text-secondary">
            Many kids can explain characters, athletes, teams, episodes, and storylines in detail.
          </p>
          <p className="text-text font-semibold">
            But when it comes to the life of the greatest man to ever live,{" "}
            they only know pieces.
          </p>
          <p className="text-gold font-bold text-xl pt-2">That is not okay.</p>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────
          3. SOLUTION
      ────────────────────────────────────────────────────────────────────── */}
      <section className="bg-background px-5 py-14">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-text mb-4 leading-snug">
            That is why TheMuslimMan.com was made.
          </h2>
          <p className="text-text-secondary text-base leading-relaxed mb-8">
            A complete 100-part Seerah course that teaches the life of the Prophet ﷺ step by step.
            No confusion. No random order. No giant book you never finish.
          </p>

          <p className="text-xs font-bold text-gold uppercase tracking-widest mb-5">
            Each lesson includes
          </p>
          <div className="grid grid-cols-2 gap-3 mb-8">
            {[
              "Video lecture",
              "Study notes",
              "Flashcards",
              "Quiz",
              "Mind map",
              "Key facts",
              "Slides",
              "Progress tracking",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2.5 text-sm text-text-secondary">
                <CheckCircle className="w-4 h-4 text-gold flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>

          <div className="border-l-2 border-gold/40 pl-4 py-1">
            <p className="text-sm text-text-muted leading-relaxed">
              Just a clear path from the beginning of the Seerah to the end.
            </p>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────
          4. PART 1 FREE PREVIEW
      ────────────────────────────────────────────────────────────────────── */}
      <section ref={part1Ref} id="part1" className="bg-surface px-5 py-14">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-bold text-gold uppercase tracking-widest mb-2">
              100% Free — No Signup Required
            </p>
            <h2 className="text-2xl font-bold text-text mb-2">Start with Part 1 Free</h2>
            <p className="text-text-secondary text-base">
              Get a real taste of the course before you start the full program.
            </p>
          </div>

          <InlinePart1Video
            checkoutUrl={checkoutUrl}
            checkoutLabel="Start the Full Seerah Course"
            onVideoStart={onPart1Started}
            onUnlockClick={onCheckoutCta}
          />

          <div className="mt-6 text-center">
            <button
              onClick={scrollToCheckout}
              className="inline-flex items-center justify-center gap-2 py-4 px-8 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-base transition-colors shadow-lg shadow-gold/20"
            >
              Start the Full Seerah Course
            </button>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────
          5. CHECKOUT SECTION
      ────────────────────────────────────────────────────────────────────── */}
      <section ref={checkoutRef} id="checkout" className="bg-background px-5 py-14">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-text mb-3">
              Start the Full Seerah Course Today
            </h2>
            <p className="text-text-secondary text-base">{config.discountLabel}</p>
          </div>

          {/* Offer card */}
          <div className="rounded-2xl border border-gold/30 bg-surface overflow-hidden mb-4 shadow-xl shadow-black/20">

            {/* Discount badge */}
            <div className="bg-gold/10 border-b border-gold/20 px-5 py-3 text-center">
              {config.discountCode ? (
                <span className="text-xs font-bold text-gold uppercase tracking-widest">
                  Code <span className="font-mono">{config.discountCode}</span> — applied automatically at checkout
                </span>
              ) : (
                <span className="text-xs font-bold text-gold uppercase tracking-widest">
                  Special offer — applied at checkout
                </span>
              )}
            </div>

            <div className="px-6 py-7">
              <p className="text-text-secondary text-base leading-relaxed mb-6">
                You get access to the complete 100-part Seerah course with videos, readings,
                quizzes, flashcards, summaries, progress tracking, and family profiles.
              </p>

              {/* Reassurance bullets */}
              <ul className="space-y-2.5 mb-7">
                {[
                  "Cancel anytime",
                  "7-day refund guarantee",
                  "Family profiles included",
                  "Start immediately — instant access",
                ].map((b) => (
                  <li key={b} className="flex items-center gap-2.5 text-sm text-text-secondary">
                    <CheckCircle className="w-4 h-4 text-gold flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>

              {/* Main CTA */}
              <a
                href={checkoutUrl}
                onClick={onCheckoutCta}
                className="flex items-center justify-center w-full py-5 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-lg transition-colors shadow-lg shadow-gold/25 mb-3"
              >
                {btnLabel}
              </a>
              <p className="text-xs text-text-muted text-center">
                Secure checkout · Instant access · Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────
          6. OPTIONAL QUIZ
      ────────────────────────────────────────────────────────────────────── */}
      <section className="bg-surface px-5 py-12 border-t border-border">
        <div className="max-w-md mx-auto text-center">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
            Optional
          </p>
          <h3 className="text-lg font-bold text-text mb-2">Test What You Remember</h3>
          <p className="text-sm text-text-secondary mb-6">
            After watching Part 1, you can take the free Seerah Checkup to see how much you
            already know about the Prophet&apos;s ﷺ life.
          </p>
          <a
            href="/checkup"
            onClick={() => safeTrack(config.creator, "optional_quiz_started")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border bg-background hover:border-gold/40 text-text-secondary hover:text-text text-sm font-semibold transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Take the Free Seerah Checkup
          </a>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────
          7. MOBILE STICKY CTA
      ────────────────────────────────────────────────────────────────────── */}
      {showSticky && (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-safe-bottom pb-4 pt-3 bg-background/95 backdrop-blur-sm border-t border-border sm:hidden">
          <button
            onClick={scrollToCheckout}
            className="w-full py-4 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-base transition-colors shadow-lg shadow-gold/20"
          >
            Start the Course
          </button>
        </div>
      )}
    </div>
  );
}
