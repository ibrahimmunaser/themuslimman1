"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Play, ArrowRight } from "lucide-react";
import { PlanPicker } from "@/components/landing/plan-picker";
import type { PlanId } from "@/components/landing/plan-picker";
import { captureAttribution, attributionToProps } from "@/lib/attribution";
import { trackEvent, captureAndTrack } from "@/lib/analytics";
import { handleCanonicalFunnelClick } from "@/lib/funnel-click-analytics";

// ── Config ─────────────────────────────────────────────────────────────────────

export interface InfluencerDirectConfig {
  /** creator slug — must match KNOWN_CREATORS in track API */
  creator: string;
  /** Display name shown in "Recommended by" badge, e.g. "The Orthodox Muslim" */
  creatorName: string;
  /** Optional circular avatar shown above/n beside the source badge */
  creatorAvatarUrl?: string;
  /** Hero headline, e.g. "Learn the life of the Prophet ﷺ in order." */
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
  /** Optional block rendered in its own section below Part 1 (e.g. embedded Seerah Checkup quiz). */
  afterPart1Preview?: React.ReactNode;
}

// ── Component ──────────────────────────────────────────────────────────────────

/** Merge real landing-page UTMs into the checkout base URL so campaign-level
 *  attribution survives even when the static CHECKOUT URL has placeholder UTMs. */
function mergeRealUtms(checkoutUrl: string): string {
  if (typeof window === "undefined") return checkoutUrl;
  try {
    const landing = new URLSearchParams(window.location.search);
    const dest    = new URL(checkoutUrl, window.location.origin);
    const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const;
    for (const key of UTM_KEYS) {
      const val = landing.get(key);
      if (val) dest.searchParams.set(key, val);
    }
    return dest.pathname + dest.search;
  } catch {
    return checkoutUrl;
  }
}

export function InfluencerDirectLanding({ config, part1Preview, afterPart1Preview }: InfluencerDirectLandingProps) {
  const heroRef  = useRef<HTMLElement>(null);
  const part1Ref = useRef<HTMLDivElement>(null);
  const plansRef = useRef<HTMLDivElement>(null);

  const [scrolledPast, setScrolledPast] = useState(false);
  const [anyCTAVisible, setAnyCTAVisible] = useState(true);
  // Enriched checkout URL — updated on mount to include real landing-page UTMs
  const [checkoutUrl, setCheckoutUrl] = useState(config.checkoutUrl);

  const price = config.price ?? "$4.99/month";

  // Sticky only shown when user has scrolled past hero AND no CTA section is on screen
  const showSticky = scrolledPast && !anyCTAVisible;

  // Merge real landing UTMs into checkout URL on mount
  useEffect(() => {
    const enriched = mergeRealUtms(config.checkoutUrl);
    if (enriched !== config.checkoutUrl) setCheckoutUrl(enriched);
  }, [config.checkoutUrl]);

  // Page view + scroll detection + canonical analytics
  useEffect(() => {
    const attribution = captureAttribution();
    const attrProps = attributionToProps(attribution);

    // Canonical landing_page_viewed + legacy alias
    captureAndTrack("landing_page_viewed", {
      ...attrProps,
      page_path: window.location.pathname,
      creator_slug: config.creator,
      referrer: document.referrer || null,
    }, { creator: config.creator });
    trackEvent("influencer_page_view", {}, { creator: config.creator });

    // ── Click delegation for data-track on child components ─────────────────
    function handleClick(e: MouseEvent) {
      if (
        handleCanonicalFunnelClick(e, {
          creator: config.creator,
          handlerScope: "InfluencerDirectLanding",
          attrProps,
        })
      ) {
        return;
      }

      const el = (e.target as HTMLElement).closest("[data-track]") as HTMLElement | null;
      if (!el?.dataset.track) return;
      const plan = el.dataset.plan;
      trackEvent(el.dataset.track, { plan, ...attrProps }, { creator: config.creator, allowDuplicates: true });
    }

    document.addEventListener("click", handleClick);

    // ── pricing_viewed — observe #plans section ──────────────────────────────
    let pricingTimer: ReturnType<typeof setTimeout> | null = null;
    let pricingFired = false;
    const observers: IntersectionObserver[] = [];

    if (typeof IntersectionObserver !== "undefined" && plansRef.current) {
      const obs = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry) return;
          if (entry.isIntersecting && !pricingFired) {
            pricingTimer = setTimeout(() => {
              if (pricingFired) return;
              pricingFired = true;
              trackEvent("pricing_viewed", { ...attrProps }, { creator: config.creator });
            }, 1000);
          } else {
            if (pricingTimer) { clearTimeout(pricingTimer); pricingTimer = null; }
          }
        },
        { threshold: 0.5 }
      );
      obs.observe(plansRef.current);
      observers.push(obs);
    }

    // ── Part 1 video tracking ────────────────────────────────────────────────
    let part1StartFired = false;
    const progressFired = new Set<number>();

    function attachVideo(video: HTMLVideoElement) {
      if ((video as HTMLVideoElement & { _ilTracked?: boolean })._ilTracked) return;
      (video as HTMLVideoElement & { _ilTracked?: boolean })._ilTracked = true;

      video.addEventListener("play", () => {
        if (part1StartFired) return;
        part1StartFired = true;
        trackEvent("part_1_started", { content_id: "part-1", ...attrProps }, { creator: config.creator });
        trackEvent("influencer_part1_started", {}, { creator: config.creator });
      });

      video.addEventListener("timeupdate", () => {
        if (!video.duration) return;
        const pct = (video.currentTime / video.duration) * 100;
        for (const t of [25, 50, 75, 100]) {
          if (pct >= t && !progressFired.has(t)) {
            progressFired.add(t);
            trackEvent("part_1_progress", { progress_percent: t, content_id: "part-1", ...attrProps }, { creator: config.creator, allowDuplicates: true });
            if (t === 50) trackEvent("part1_video_50_percent", {}, { creator: config.creator });
            if (t >= 90) trackEvent("part1_video_90_percent", {}, { creator: config.creator });
          }
        }
      });
    }

    function scanVideos() {
      const container = part1Ref.current ?? document;
      container.querySelectorAll("video").forEach((v) => attachVideo(v as HTMLVideoElement));
    }

    scanVideos();
    const videoTimer = setTimeout(scanVideos, 2000);

    const onScroll = () => setScrolledPast(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      document.removeEventListener("click", handleClick);
      observers.forEach((o) => o.disconnect());
      if (pricingTimer) clearTimeout(pricingTimer);
      clearTimeout(videoTimer);
      window.removeEventListener("scroll", onScroll);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.creator]);

  // Hide sticky whenever hero or plans section is visible
  useEffect(() => {
    const sections = [heroRef.current, plansRef.current].filter(
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
    trackEvent("influencer_part1_cta_click", {}, { creator: config.creator, allowDuplicates: true });
  }, [config.creator]);

  const scrollToPlans = useCallback(() => {
    plansRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    trackEvent("influencer_primary_cta_click", { plan: "scroll_to_plans" }, { creator: config.creator, allowDuplicates: true });
  }, [config.creator]);

  // NOTE: checkout_clicked is intentionally NOT fired here.
  // The PlanPicker "Continue to Checkout" button carries data-track="selected_plan_checkout_click"
  // which is caught by the delegated click listener and fires checkout_clicked exactly once.
  // Firing it here too would double-count every PlanPicker checkout click.
  // The sticky CTA below carries data-track="checkout_clicked" so it is also handled by the
  // delegated listener without relying on this callback.
  const onCheckoutClick = useCallback((plan: PlanId) => {
    // Legacy event only — canonical checkout_clicked comes from [data-track] delegation.
    trackEvent("influencer_primary_cta_click", { plan }, { creator: config.creator, allowDuplicates: true });
  }, [config.creator]);

  return (
    <div
      className="min-h-screen bg-background text-text"
      style={showSticky ? { paddingBottom: "calc(72px + env(safe-area-inset-bottom))" } : undefined}
    >

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="bg-gradient-to-b from-surface to-background px-5 pt-14 pb-14">
        <div className="max-w-2xl mx-auto text-center">

          {/* Creator avatar + source badge — single connected pill */}
          <div className="mb-3 sm:mb-4 flex justify-center">
            <div className="inline-flex items-center rounded-full bg-gold/10 border border-gold/25 text-gold text-xs font-bold tracking-wide pl-0.5 pr-3 py-0.5 gap-1.5 sm:gap-2">
              {config.creatorAvatarUrl && (
                <Image
                  src={config.creatorAvatarUrl}
                  alt={config.creatorName}
                  width={64}
                  height={64}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-gold/30 flex-shrink-0"
                />
              )}
              <span className="inline-flex items-center py-1 pr-0.5">
                Recommended by {config.creatorName}
              </span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-text leading-tight mb-4">
            {config.heroHeadline}
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg text-text-secondary leading-relaxed mb-8 max-w-xl mx-auto">
            A structured 100-part Seerah course with videos, quizzes, flashcards, summaries,
            mind maps, and progress tracking for you and your family.
          </p>

          {/* Primary + Secondary CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            <button
              onClick={scrollToPart1}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-base transition-colors shadow-lg shadow-gold/25"
            >
              <Play className="w-4 h-4 fill-current" />
              Watch Part 1 Free
            </button>
            <button
              onClick={scrollToPlans}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-gold/35 text-gold hover:border-gold/60 hover:bg-gold/5 font-bold text-base transition-colors"
            >
              Start Full Course
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Friction reducer */}
          <p className="text-xs text-text-muted">
            Part 1 is free · No app required · Cancel anytime · 7-day refund guarantee
          </p>
        </div>
      </section>

      {/* ── PART 1 FREE PREVIEW ───────────────────────────────────────────────── */}
      <section id="part1" className="bg-surface px-5 py-10 border-t border-border">
        <div ref={part1Ref} className="max-w-3xl mx-auto">
          <div className="text-center mb-6">
            <p className="text-xs font-bold text-gold uppercase tracking-widest mb-1.5">
              Free · No Signup Required
            </p>
            <h2 className="text-xl font-bold text-text mb-1">Start with Part 1 free</h2>
            <p className="text-sm text-text-secondary">
              Watch the first lesson and see how the course works before choosing a plan.
            </p>
          </div>

          {part1Preview}
        </div>
      </section>

      {/* ── SEERAH CHECKUP ────────────────────────────────────────────────────── */}
      {afterPart1Preview && (
        <section id="seerah-checkup" className="bg-background px-5 py-10 border-t border-border">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-6">
              <p className="text-xs font-bold text-gold uppercase tracking-widest mb-1.5">
                Free Seerah Checkup
              </p>
              <h2 className="text-xl font-bold text-text mb-1">Seerah Clarity Checkup</h2>
              <p className="text-sm text-text-secondary">
                10 quick questions. Enter your email to reveal your clarity score.
              </p>
            </div>

            {afterPart1Preview}
          </div>
        </section>
      )}

      {/* ── PLANS ─────────────────────────────────────────────────────────────── */}
      <section id="plans" className="bg-surface px-5 py-12 border-t border-border">
        <div ref={plansRef} className="max-w-xl mx-auto">
          <div className="text-center mb-7">
            <h2 className="text-xl sm:text-2xl font-bold text-text mb-2">
              Ready to continue the full course?
            </h2>
            <p className="text-sm text-text-secondary max-w-md mx-auto leading-relaxed">
              Part 1 is free. The full course includes 100 structured lessons with videos,
              readings, quizzes, flashcards, summaries, mind maps, and progress tracking.
            </p>
          </div>

          <PlanPicker
            checkoutBaseUrl={checkoutUrl}
            recommendedPlan="individual-monthly"
            onCtaClick={onCheckoutClick}
          />
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
            {/* data-track="checkout_clicked" → caught by delegated listener (fires canonical event once) */}
            <a
              href={checkoutUrl}
              data-track="checkout_clicked"
              data-plan="individual-monthly"
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
