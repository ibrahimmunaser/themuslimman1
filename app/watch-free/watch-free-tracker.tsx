"use client";

import { useEffect } from "react";
import { captureAttribution, attributionToProps } from "@/lib/attribution";
import { captureAndTrack, trackEvent } from "@/lib/analytics";
import { handleCanonicalFunnelClick, trackCheckoutClickedFromClick } from "@/lib/funnel-click-analytics";

export function WatchFreeTracker() {
  useEffect(() => {
    const attribution = captureAttribution();
    const attrProps = attributionToProps(attribution);

    captureAndTrack(
      "landing_page_viewed",
      {
        ...attrProps,
        page: "watch_free",
        page_path: window.location.pathname,
        referrer: document.referrer || null,
      },
      { creator: "homepage" }
    );

    function handleClick(e: MouseEvent) {
      if (
        handleCanonicalFunnelClick(e, {
          creator: "homepage",
          handlerScope: "WatchFreeTracker",
          attrProps,
        })
      ) {
        return;
      }

      const el = (e.target as HTMLElement).closest("[data-track]") as HTMLElement | null;
      if (el?.dataset.track) {
        trackEvent(el.dataset.track, { ...attrProps }, { creator: "homepage", allowDuplicates: true });
        return;
      }

      const anchor = (e.target as HTMLElement).closest("a[href*='/checkout']") as HTMLAnchorElement | null;
      if (anchor && e.isTrusted && !anchor.dataset.track) {
        trackCheckoutClickedFromClick(e, anchor as unknown as HTMLElement, {
          creator: "homepage",
          handlerScope: "WatchFreeTracker:fallback",
          attrProps,
          trigger: "watch_free_cta",
        });
      }
    }

    document.addEventListener("click", handleClick);

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
            trackEvent(
              "part_1_progress",
              { progress_percent: t, content_id: "part-1", ...attrProps },
              { creator: "homepage", allowDuplicates: true }
            );
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
