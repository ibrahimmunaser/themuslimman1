"use client";

/**
 * HomepageTracker — analytics for the / (homepage) route.
 *
 * Fires canonical funnel events via the centralized analytics helper.
 * Older event names are kept as aliases for backward compatibility with
 * existing admin dashboard queries.
 */

import { useEffect } from "react";
import { captureAndTrack, trackEvent } from "@/lib/analytics";
import { captureAttribution, attributionToProps } from "@/lib/attribution";

export function HomepageTracker() {
  useEffect(() => {
    // Capture first-touch attribution from URL params
    const attribution = captureAttribution();
    const attrProps = attributionToProps(attribution);

    // ── Page view ────────────────────────────────────────────────────────────
    captureAndTrack("landing_page_viewed", {
      ...attrProps,
      page_path: window.location.pathname,
      referrer: document.referrer || null,
    }, { creator: "homepage" });

    // Legacy aliases
    trackEvent("homepage_view", {}, { creator: "homepage" });

    // ── Click delegation ────────────────────────────────────────────────────
    function handleClick(e: MouseEvent) {
      const el = (e.target as HTMLElement).closest("[data-track]") as HTMLElement | null;
      if (!el) return;
      const event = el.dataset.track;
      if (!event) return;

      const plan = el.dataset.plan;
      const planType = el.dataset.planType;
      const billing = el.dataset.billing;
      const price = el.dataset.price ? Number(el.dataset.price) : undefined;

      if (event === "plan_selected") {
        trackEvent("plan_selected", {
          plan_id: plan,
          plan_type: planType,
          billing_type: billing,
          price,
          ...attrProps,
        }, { creator: "homepage", allowDuplicates: true });
      } else if (event === "plan_card_click") {
        trackEvent("plan_selected", { plan_id: plan, ...attrProps }, { creator: "homepage", allowDuplicates: true });
        trackEvent("plan_card_click", { plan }, { creator: "homepage", allowDuplicates: true });
      } else if (event === "selected_plan_checkout_click") {
        trackEvent("checkout_clicked", { plan_id: plan, ...attrProps }, { creator: "homepage", allowDuplicates: true });
        // Legacy aliases
        trackEvent("selected_plan_checkout_click", { plan }, { creator: "homepage", allowDuplicates: true });
        trackEvent("checkout_start", { plan }, { creator: "homepage", allowDuplicates: true });
      } else if (event === "hero_cta_checkout_click") {
        trackEvent("checkout_clicked", { ...attrProps, trigger: "hero_cta" }, { creator: "homepage", allowDuplicates: true });
        trackEvent("hero_cta_checkout_click", {}, { creator: "homepage", allowDuplicates: true });
        trackEvent("homepage_primary_cta_click", {}, { creator: "homepage", allowDuplicates: true });
      } else if (event === "hero_watch_free_click") {
        trackEvent("hero_watch_free_click", {}, { creator: "homepage", allowDuplicates: true });
        trackEvent("homepage_part1_cta_click", {}, { creator: "homepage", allowDuplicates: true });
      } else {
        trackEvent(event, { plan, ...attrProps }, { creator: "homepage", allowDuplicates: true });
      }
    }

    document.addEventListener("click", handleClick);

    // ── Intersection observers ───────────────────────────────────────────────
    const observers: IntersectionObserver[] = [];
    let pricingTimer: ReturnType<typeof setTimeout> | null = null;
    let pricingFired = false;

    function observeOnce(id: string, ...eventTypes: string[]) {
      const el = document.getElementById(id);
      if (!el || typeof IntersectionObserver === "undefined") return;
      const obs = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            eventTypes.forEach((et) =>
              trackEvent(et, { ...attrProps }, { creator: "homepage", allowDuplicates: true })
            );
            obs.disconnect();
          }
        },
        { threshold: 0.15 },
      );
      obs.observe(el);
      observers.push(obs);
    }

    observeOnce("preview", "part1_preview_viewed");

    // pricing_viewed: 50% visible for ≥1 second (canonical)
    if (typeof IntersectionObserver !== "undefined") {
      const pricingEl = document.getElementById("pricing");
      if (pricingEl) {
        const obs = new IntersectionObserver(
          (entries) => {
            const entry = entries[0];
            if (!entry) return;
            if (entry.isIntersecting && !pricingFired) {
              pricingTimer = setTimeout(() => {
                if (pricingFired) return;
                pricingFired = true;
                trackEvent("pricing_viewed", { ...attrProps }, { creator: "homepage" });
                // Legacy aliases
                trackEvent("pricing_view", {}, { creator: "homepage" });
                trackEvent("homepage_pricing_viewed", {}, { creator: "homepage" });
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

    // ── Part 1 video ─────────────────────────────────────────────────────────
    // progressFired is the authoritative per-threshold guard — allowDuplicates:true
    // in trackEvent only bypasses the global session dedup (needed because all four
    // thresholds share the same eventName). The Set ensures each threshold fires once.
    let part1StartFired = false;
    const progressFired = new Set<number>(); // [25, 50, 75, 100]

    function attachVideoListeners(video: HTMLVideoElement) {
      video.addEventListener("play", () => {
        if (part1StartFired) return;
        part1StartFired = true;
        trackEvent("part_1_started", { content_id: "part-1", ...attrProps }, { creator: "homepage" });
        // Legacy aliases (kept for existing dashboard queries)
        trackEvent("part1_video_start", {}, { creator: "homepage" });
        trackEvent("part1_play_clicked", {}, { creator: "homepage" });
      }, { once: true });

      video.addEventListener("timeupdate", () => {
        if (!video.duration || video.duration === 0) return;
        const pct = (video.currentTime / video.duration) * 100;
        for (const t of [25, 50, 75, 100]) {
          if (pct >= t && !progressFired.has(t)) {
            progressFired.add(t);
            trackEvent("part_1_progress", { progress_percent: t, content_id: "part-1", ...attrProps }, { creator: "homepage", allowDuplicates: true });
            // Legacy aliases for existing 50/90 dashboard queries
            if (t === 50) trackEvent("part1_video_50_percent", {}, { creator: "homepage" });
            if (t === 90 || t === 100) trackEvent("part1_video_90_percent", {}, { creator: "homepage" });
          }
        }
      });
    }

    const previewEl = document.getElementById("preview");

    function scanForVideos() {
      previewEl?.querySelectorAll("video").forEach((v) => {
        const vEl = v as HTMLVideoElement & { _hpTracked?: boolean };
        if (vEl._hpTracked) return;
        vEl._hpTracked = true;
        attachVideoListeners(vEl);
      });
    }

    scanForVideos();
    const videoTimer = setTimeout(scanForVideos, 2000);

    return () => {
      document.removeEventListener("click", handleClick);
      observers.forEach((o) => o.disconnect());
      if (pricingTimer) clearTimeout(pricingTimer);
      clearTimeout(videoTimer);
    };
  }, []);

  return null;
}
