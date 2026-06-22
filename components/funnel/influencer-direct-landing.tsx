"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { nanoid } from "nanoid";

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
  /** Price shown in hero, e.g. "$4.99/month" */
  price?: string;
  /** Full checkout URL */
  checkoutUrl: string;
  /** Defaults to "/watch-free" */
  watchFreeUrl?: string;
  /** Analytics event prefix */
  eventPrefix: string;
  /** Defaults to "Start the Full Course" */
  checkoutButtonLabel?: string;
  // Legacy fields silently ignored in this layout
  heroSubheadline?: string;
  heroBody?: string;
  discountCode?: string;
  discountLabel?: string;
}

export interface InfluencerDirectLandingProps {
  config: InfluencerDirectConfig;
  /** Server-rendered Part 1 preview (all asset tabs). If omitted, falls back to video-only card. */
  part1Preview?: React.ReactNode;
}

// ── Plan grid data ─────────────────────────────────────────────────────────────

const PLAN_CARDS = [
  { plan: "individual-monthly",  label: "Monthly",         price: "$4.99/mo", detail: "1 person"            },
  { plan: "individual-lifetime", label: "Lifetime",        price: "$49",      detail: "1 person · one-time" },
  { plan: "family-monthly",      label: "Family Monthly",  price: "$9.99/mo", detail: "Up to 5 members"     },
  { plan: "family-lifetime",     label: "Family Lifetime", price: "$99",      detail: "5 members · one-time" },
] as const;

/** Swap the `plan` search param while preserving all other params (source, UTMs…). */
function planUrl(baseUrl: string, plan: string): string {
  try {
    const u = new URL(baseUrl, "https://x.com");
    u.searchParams.set("plan", plan);
    return u.pathname + u.search;
  } catch {
    return baseUrl;
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

export function InfluencerDirectLanding({ config, part1Preview }: InfluencerDirectLandingProps) {
  const heroRef  = useRef<HTMLElement>(null);
  const part1Ref = useRef<HTMLDivElement>(null);

  const [scrolledPast, setScrolledPast] = useState(false);
  const [anyCTAVisible, setAnyCTAVisible] = useState(true);

  const price    = config.price ?? "$4.99/month";
  const btnLabel = config.checkoutButtonLabel ?? "Start the Full Course";

  // Sticky only shown when user has scrolled past hero AND no CTA section is on screen
  const showSticky = scrolledPast && !anyCTAVisible;

  // Page view + scroll detection
  useEffect(() => {
    safeTrack(config.creator, "influencer_page_view");
    const onScroll = () => setScrolledPast(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [config.creator]);

  // Hide sticky whenever hero or Part 1 section is visible
  useEffect(() => {
    const sections = [heroRef.current, part1Ref.current].filter(
      (el): el is HTMLElement => el !== null
    );
    if (sections.length === 0) return;

    const visible = new Map<Element, boolean>(sections.map((el) => [el, false]));
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => visible.set(e.target, e.isIntersecting));
        setAnyCTAVisible(Array.from(visible.values()).some(Boolean));
      },
      { threshold: 0.1 }
    );
    sections.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const scrollToPart1 = useCallback(() => {
    part1Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    safeTrack(config.creator, "influencer_part1_cta_click");
  }, [config.creator]);

  const onCheckoutClick = useCallback(() => {
    safeTrack(config.creator, "influencer_primary_cta_click");
  }, [config.creator]);

  return (
    <div
      className="min-h-screen bg-background text-text"
      style={showSticky ? { paddingBottom: "calc(72px + env(safe-area-inset-bottom))" } : undefined}
    >

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="bg-gradient-to-b from-surface to-background px-5 pt-12 pb-10">
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

          {/* Plan grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {PLAN_CARDS.map(({ plan, label, price: planPrice, detail }) => (
              <a
                key={plan}
                href={planUrl(config.checkoutUrl, plan)}
                onClick={() => safeTrack(config.creator, "influencer_primary_cta_click", { plan })}
                className="flex flex-col justify-between rounded-xl border-2 border-gold bg-surface/60 p-3 hover:bg-surface transition-colors"
              >
                <span className="text-[10px] font-bold text-gold uppercase tracking-widest leading-tight">{label}</span>
                <span className="text-xl font-extrabold text-text mt-1 leading-none">{planPrice}</span>
                <span className="text-[11px] text-text-muted mt-1 leading-tight">{detail}</span>
              </a>
            ))}
          </div>

          {/* Primary CTA */}
          <a
            href={config.checkoutUrl}
            onClick={onCheckoutClick}
            className="block w-full py-4 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-base text-center transition-colors shadow-lg shadow-gold/20 mb-3"
          >
            {btnLabel} — {price}
          </a>

          {/* Secondary link */}
          <div className="text-center mb-4">
            <button
              onClick={scrollToPart1}
              className="text-sm text-text-muted hover:text-gold transition-colors underline underline-offset-2"
            >
              Or watch Part 1 free first
            </button>
          </div>

          {/* Reassurance — replaces the offer card */}
          <p className="text-xs text-text-muted text-center">
            Cancel anytime · 7-day refund · Instant access
          </p>
        </div>
      </section>

      {/* ── PART 1 FREE PREVIEW ───────────────────────────────────────────────── */}
      <section ref={part1Ref} id="part1" className="bg-surface px-5 py-10 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-6">
            <p className="text-xs font-bold text-gold uppercase tracking-widest mb-1.5">
              Free · No Signup Required
            </p>
            <h2 className="text-xl font-bold text-text mb-1">Try the Full Lesson — Part 1</h2>
            <p className="text-sm text-text-secondary">
              Video, reading, slides, mind map, flashcards, and quiz. All free, no signup.
            </p>
          </div>

          {part1Preview}
        </div>
      </section>

      {/* ── Mobile sticky CTA (only when no CTA section is visible) ──────────── */}
      {showSticky && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 px-4 pt-3 bg-background/95 backdrop-blur-sm border-t border-border sm:hidden"
          style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}
        >
          <div className="flex items-center gap-3">
            <p className="flex-1 text-xs text-text-muted truncate min-w-0">{price}</p>
            <a
              href={config.checkoutUrl}
              onClick={onCheckoutClick}
              className="flex-shrink-0 py-3 px-6 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-sm transition-colors"
            >
              Start the Course
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
