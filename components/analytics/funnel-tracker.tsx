"use client";

/**
 * FunnelTracker — universal analytics component.
 */

import { useEffect } from "react";
import { captureAttribution, attributionToProps } from "@/lib/attribution";
import { trackEvent } from "@/lib/analytics";
import { handleCanonicalFunnelClick } from "@/lib/funnel-click-analytics";

export interface FunnelTrackerProps {
  creator?: string;
  fireLandingView?: boolean;
  pricingSectionId?: string;
  videoSectionId?: string;
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

    function handleClick(e: MouseEvent) {
      if (
        handleCanonicalFunnelClick(e, {
          creator: creator ?? "homepage",
          handlerScope: "FunnelTracker",
          attrProps,
        })
      ) {
        return;
      }

      const el = (e.target as HTMLElement).closest("[data-track]") as HTMLElement | null;
      if (!el?.dataset.track) return;
      trackEvent(el.dataset.track, { plan: el.dataset.plan, ...attrProps }, { creator, allowDuplicates: true });
    }

    document.addEventListener("click", handleClick);

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
      const container = videoSectionId ? document.getElementById(videoSectionId) : null;
      if (!container) return;
      container.querySelectorAll("video").forEach((v) => attachVideo(v as HTMLVideoElement));
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
