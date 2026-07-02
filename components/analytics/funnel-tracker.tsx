"use client";

/**
 * FunnelTracker — universal analytics component.
 *
 * Mount on any marketing page to get:
 *  - landing_page_viewed   on mount (with full attribution)
 *  - pricing_viewed        when the pricing section is ≥50% visible for ≥1s
 *  - part_1_started        when the Part 1 video plays for the first time
 *  - part_1_progress       at 25/50/75/100% playback thresholds
 *  - plan_selected         when a [data-track="plan_selected"] element is clicked
 *  - checkout_clicked      when a [data-track="checkout_clicked"] element is clicked
 *  - Any [data-track]      delegated click events
 *
 * All events include first-touch attribution automatically.
 */

import { useEffect } from "react";
import { captureAttribution, attributionToProps } from "@/lib/attribution";
import { trackEvent } from "@/lib/analytics";

export interface FunnelTrackerProps {
  /**
   * Creator slug for this page. Auto-detected from pathname when omitted.
   * Must match KNOWN_CREATORS in /api/influencer/track.
   */
  creator?: string;
  /** Fire landing_page_viewed on mount. Default true. */
  fireLandingView?: boolean;
  /** id of the pricing section element to observe. Default "pricing". */
  pricingSectionId?: string;
  /** id of the element containing the Part 1 video to track. */
  videoSectionId?: string;
  /** Additional properties merged into landing_page_viewed. */
  pageProps?: Record<string, unknown>;
}

export function FunnelTracker({
  creator,
  fireLandingView = true,
  pricingSectionId = "pricing",
  videoSectionId,
  pageProps = {},
}: FunnelTrackerProps) {
  useEffect(() => {
    const attribution = captureAttribution();
    const attrProps = attributionToProps(attribution);

    // ── landing_page_viewed ────────────────────────────────────────────────
    if (fireLandingView) {
      trackEvent(
        "landing_page_viewed",
        {
          ...attrProps,
          ...pageProps,
          page_path: window.location.pathname,
          referrer: document.referrer || null,
        },
        { creator }
      );
    }

    // ── Click delegation for [data-track] ──────────────────────────────────
    function handleClick(e: MouseEvent) {
      const el = (e.target as HTMLElement).closest("[data-track]") as HTMLElement | null;
      if (!el) return;
      const event = el.dataset.track;
      if (!event) return;

      const plan = el.dataset.plan ?? undefined;
      const planType = el.dataset.planType ?? undefined;
      const billing = el.dataset.billing ?? undefined;
      const price = el.dataset.price ? Number(el.dataset.price) : undefined;

      if (event === "plan_selected" || event === "plan_card_click") {
        trackEvent(
          "plan_selected",
          { plan_id: plan, plan_type: planType, billing_type: billing, price, ...attrProps },
          { creator, allowDuplicates: true }
        );
      } else if (event === "checkout_clicked" || event === "selected_plan_checkout_click" || event === "checkout_start") {
        trackEvent(
          "checkout_clicked",
          { plan_id: plan, ...attrProps },
          { creator, allowDuplicates: true }
        );
      } else {
        trackEvent(event, { plan, ...attrProps }, { creator, allowDuplicates: true });
      }
    }

    document.addEventListener("click", handleClick);

    // ── pricing_viewed — 50% visible for ≥1 second ─────────────────────────
    let pricingTimer: ReturnType<typeof setTimeout> | null = null;
    let pricingFired = false;
    const observers: IntersectionObserver[] = [];

    if (typeof IntersectionObserver !== "undefined") {
      const pricingEl = pricingSectionId ? document.getElementById(pricingSectionId) : null;
      if (pricingEl) {
        const obs = new IntersectionObserver(
          (entries) => {
            const entry = entries[0];
            if (!entry) return;
            if (entry.isIntersecting && !pricingFired) {
              pricingTimer = setTimeout(() => {
                if (pricingFired) return;
                pricingFired = true;
                trackEvent("pricing_viewed", { ...attrProps }, { creator });
              }, 1000);
            } else {
              if (pricingTimer) { clearTimeout(pricingTimer); pricingTimer = null; }
            }
          },
          { threshold: 0.5 }
        );
        obs.observe(pricingEl);
        observers.push(obs);
      }
    }

    // ── Part 1 video — start + progress thresholds ─────────────────────────
    let part1StartFired = false;
    const progressFired = new Set<number>();

    function attachVideo(video: HTMLVideoElement) {
      if ((video as HTMLVideoElement & { _ftTracked?: boolean })._ftTracked) return;
      (video as HTMLVideoElement & { _ftTracked?: boolean })._ftTracked = true;

      video.addEventListener("play", () => {
        if (part1StartFired) return;
        part1StartFired = true;
        trackEvent("part_1_started", { content_id: "part-1", ...attrProps }, { creator });
      });

      video.addEventListener("timeupdate", () => {
        if (!video.duration) return;
        const pct = (video.currentTime / video.duration) * 100;
        for (const t of [25, 50, 75, 100]) {
          if (pct >= t && !progressFired.has(t)) {
            progressFired.add(t);
            trackEvent(
              "part_1_progress",
              { progress_percent: t, content_id: "part-1", ...attrProps },
              { creator, allowDuplicates: true }
            );
          }
        }
      });
    }

    function scanVideos() {
      const container = videoSectionId
        ? document.getElementById(videoSectionId)
        : null;
      // When no videoSectionId is given, don't scan — video tracking is opt-in.
      if (!container) return;
      container.querySelectorAll("video").forEach((v) =>
        attachVideo(v as HTMLVideoElement)
      );
    }

    let videoScanTimer: ReturnType<typeof setTimeout> | null = null;
    if (videoSectionId) {
      scanVideos();
      videoScanTimer = setTimeout(scanVideos, 2000);
    }

    return () => {
      document.removeEventListener("click", handleClick);
      observers.forEach((o) => o.disconnect());
      if (pricingTimer) clearTimeout(pricingTimer);
      if (videoScanTimer) clearTimeout(videoScanTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
