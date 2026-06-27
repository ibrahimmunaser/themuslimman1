"use client";

import { useEffect } from "react";

function getOrCreateVisitorId() {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("hp_visitor_id");
  if (!id) {
    id = crypto.randomUUID();
    try { localStorage.setItem("hp_visitor_id", id); } catch { /* ignore */ }
  }
  return id;
}

function getOrCreateSessionId() {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem("hp_session_id");
  if (!id) {
    id = crypto.randomUUID();
    try { sessionStorage.setItem("hp_session_id", id); } catch { /* ignore */ }
  }
  return id;
}

function send(eventType: string, extra?: Record<string, unknown>) {
  try {
    if (typeof window === "undefined") return;
    const sessionId = getOrCreateSessionId();
    const visitorId = getOrCreateVisitorId();
    const payload = JSON.stringify({
      creator: "homepage",
      eventType,
      sessionId,
      visitorId,
      route: window.location.pathname,
      ...extra,
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/influencer/track", new Blob([payload], { type: "application/json" }));
    } else {
      fetch("/api/influencer/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch { /* never block */ }
}

/**
 * Fires homepage analytics events:
 *
 * Page-level:
 *   landing_page_view              on mount
 *   pricing_view                   once when #pricing enters viewport
 *   part1_preview_viewed           once when #preview enters viewport
 *
 * Hero:
 *   hero_cta_checkout_click        primary CTA ("Start Learning Today")
 *   hero_watch_free_click          secondary CTA ("Watch Part 1 Free")
 *
 * Plan picker:
 *   plan_card_click                when a plan card is clicked (data-plan=planId)
 *   selected_plan_checkout_click   "Continue to Checkout" bar click (data-plan=planId)
 *   checkout_start                 alias fired alongside selected_plan_checkout_click
 *
 * Part 1 video:
 *   part1_video_start              first play
 *   part1_video_50_percent         50% playback milestone (once)
 *   part1_video_90_percent         90% playback milestone (once)
 *
 * Post-preview:
 *   after_part1_checkout_click     CTA inside the Part 1 preview block
 *   homepage_part1_bottom_cta_click  "Start the Full Course" link below preview
 *
 * Final CTA:
 *   final_checkout_clicked
 *   final_watch_part1_clicked
 *
 * Legacy / compat:
 *   homepage_primary_cta_click, homepage_part1_cta_click
 *   part1_play_clicked, part1_continue_clicked
 *   plan_selected (rich metadata variant)
 *   homepage_pricing_viewed, homepage_view
 */
export function HomepageTracker() {
  useEffect(() => {
    send("landing_page_view");
    send("homepage_view");

    // ── Click delegation ────────────────────────────────────────────────────
    function handleClick(e: MouseEvent) {
      const el = (e.target as HTMLElement).closest("[data-track]") as HTMLElement | null;
      if (!el) return;
      const event = el.dataset.track;
      if (!event) return;

      if (event === "plan_selected") {
        send("plan_selected", {
          plan: el.dataset.plan,
          plan_type: el.dataset.planType,
          billing_interval: el.dataset.billing,
          price: el.dataset.price ? Number(el.dataset.price) : undefined,
          source: "homepage",
          page_path: window.location.pathname,
        });
      } else if (event === "plan_card_click") {
        send("plan_card_click", { plan: el.dataset.plan });
      } else if (event === "selected_plan_checkout_click") {
        send("selected_plan_checkout_click", { plan: el.dataset.plan });
        send("checkout_start", { plan: el.dataset.plan });
      } else if (event === "hero_cta_checkout_click") {
        send("hero_cta_checkout_click");
        // Legacy compat
        send("homepage_primary_cta_click");
      } else if (event === "hero_watch_free_click") {
        send("hero_watch_free_click");
        // Legacy compat
        send("homepage_part1_cta_click");
      } else {
        send(event);
      }
    }
    document.addEventListener("click", handleClick);

    // ── Intersection observers ───────────────────────────────────────────────
    const observers: IntersectionObserver[] = [];
    function observeOnce(id: string, ...eventTypes: string[]) {
      const el = document.getElementById(id);
      if (!el || typeof IntersectionObserver === "undefined") return;
      const obs = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            eventTypes.forEach((et) => send(et));
            obs.disconnect();
          }
        },
        { threshold: 0.15 },
      );
      obs.observe(el);
      observers.push(obs);
    }

    observeOnce("preview", "part1_preview_viewed");
    observeOnce("pricing", "pricing_view", "pricing_viewed", "homepage_pricing_viewed");

    // ── Part 1 video tracking ────────────────────────────────────────────────
    let part1StartFired  = false;
    let part1At50Fired   = false;
    let part1At90Fired   = false;

    function attachVideoListeners(video: HTMLVideoElement) {
      video.addEventListener("play", () => {
        if (part1StartFired) return;
        part1StartFired = true;
        send("part1_video_start");
        send("part1_play_clicked"); // legacy compat
      }, { once: true });

      video.addEventListener("timeupdate", () => {
        if (!video.duration || video.duration === 0) return;
        const pct = video.currentTime / video.duration;
        if (!part1At50Fired && pct >= 0.5) {
          part1At50Fired = true;
          send("part1_video_50_percent");
        }
        if (!part1At90Fired && pct >= 0.9) {
          part1At90Fired = true;
          send("part1_video_90_percent");
        }
      });
    }

    const previewEl = document.getElementById("preview");

    function scanForVideos() {
      previewEl?.querySelectorAll("video").forEach((v) => {
        // Avoid double-attaching by marking the element
        if ((v as HTMLVideoElement & { _hpTracked?: boolean })._hpTracked) return;
        (v as HTMLVideoElement & { _hpTracked?: boolean })._hpTracked = true;
        attachVideoListeners(v);
      });
    }

    scanForVideos();
    // Re-scan after Suspense resolves lazy content
    const videoTimer = setTimeout(scanForVideos, 2000);

    return () => {
      document.removeEventListener("click", handleClick);
      observers.forEach(o => o.disconnect());
      clearTimeout(videoTimer);
    };
  }, []);

  return null;
}
