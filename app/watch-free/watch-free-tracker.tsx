"use client";

/**
 * WatchFreeTracker — analytics for /watch-free.
 * Fires landing_page_viewed + Part 1 video milestones + CTA clicks.
 */

import { useEffect } from "react";
import { captureAttribution, attributionToProps } from "@/lib/attribution";
import { captureAndTrack, trackEvent } from "@/lib/analytics";

export function WatchFreeTracker() {
  useEffect(() => {
    const attribution = captureAttribution();
    const attrProps = attributionToProps(attribution);

    captureAndTrack("landing_page_viewed", {
      ...attrProps,
      page: "watch_free",
      page_path: window.location.pathname,
      referrer: document.referrer || null,
    }, { creator: "homepage" });

    // ── Click delegation ──────────────────────────────────────────────────────
    function handleClick(e: MouseEvent) {
      const el = (e.target as HTMLElement).closest("[data-track]") as HTMLElement | null;
      // Also catch raw anchor clicks that navigate to checkout
      const anchor = (e.target as HTMLElement).closest("a[href*='/checkout']") as HTMLAnchorElement | null;

      if (el) {
        const event = el.dataset.track;
        if (!event) return;
        if (event === "checkout_clicked" || event === "after_part1_checkout_click") {
          trackEvent("checkout_clicked", { trigger: event, ...attrProps }, { creator: "homepage", allowDuplicates: true });
        } else {
          trackEvent(event, { ...attrProps }, { creator: "homepage", allowDuplicates: true });
        }
      } else if (anchor) {
        trackEvent("checkout_clicked", { trigger: "watch_free_cta", ...attrProps }, { creator: "homepage", allowDuplicates: true });
      }
    }

    document.addEventListener("click", handleClick);

    // ── Part 1 video tracking ─────────────────────────────────────────────────
    let startFired = false;
    const progressFired = new Set<number>();

    function attachVideo(video: HTMLVideoElement) {
      if ((video as HTMLVideoElement & { _wfTracked?: boolean })._wfTracked) return;
      (video as HTMLVideoElement & { _wfTracked?: boolean })._wfTracked = true;

      video.addEventListener("play", () => {
        if (startFired) return;
        startFired = true;
        trackEvent("part_1_started", { content_id: "part-1", ...attrProps }, { creator: "homepage" });
      });

      video.addEventListener("timeupdate", () => {
        if (!video.duration) return;
        const pct = (video.currentTime / video.duration) * 100;
        for (const t of [25, 50, 75, 100]) {
          if (pct >= t && !progressFired.has(t)) {
            progressFired.add(t);
            trackEvent("part_1_progress", { progress_percent: t, content_id: "part-1", ...attrProps }, { creator: "homepage", allowDuplicates: true });
          }
        }
      });
    }

    function scanVideos() {
      document.querySelectorAll("video").forEach((v) => attachVideo(v as HTMLVideoElement));
    }

    scanVideos();
    const timer = setTimeout(scanVideos, 2000);

    return () => {
      document.removeEventListener("click", handleClick);
      clearTimeout(timer);
    };
  }, []);

  return null;
}
