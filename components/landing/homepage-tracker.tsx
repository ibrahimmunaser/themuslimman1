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
 * - `landing_page_view`         on mount
 * - `part1_preview_viewed`      once when #preview enters viewport
 * - `pricing_viewed`            once when #pricing enters viewport
 * - `data-track` click events   via event delegation
 * - `plan_selected`             with rich metadata for pricing CTA clicks
 */
export function HomepageTracker() {
  useEffect(() => {
    send("landing_page_view");

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
      } else {
        send(event);
      }
    }
    document.addEventListener("click", handleClick);

    // ── Intersection observers ───────────────────────────────────────────────
    const observers: IntersectionObserver[] = [];
    function observeOnce(id: string, eventType: string) {
      const el = document.getElementById(id);
      if (!el || typeof IntersectionObserver === "undefined") return;
      const obs = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            send(eventType);
            obs.disconnect();
          }
        },
        { threshold: 0.15 },
      );
      obs.observe(el);
      observers.push(obs);
    }

    observeOnce("preview", "part1_preview_viewed");
    observeOnce("pricing", "pricing_viewed");

    // ── Part 1 video play ────────────────────────────────────────────────────
    let part1PlayFired = false;
    function handleVideoPlay() {
      if (part1PlayFired) return;
      part1PlayFired = true;
      send("part1_play_clicked");
    }
    // Attach to any video inside #preview (may mount after Suspense resolves)
    const previewEl = document.getElementById("preview");
    const attachVideoListeners = () => {
      previewEl?.querySelectorAll("video").forEach(v => {
        v.addEventListener("play", handleVideoPlay, { once: true });
      });
    };
    attachVideoListeners();
    // Re-scan after a short delay to catch lazily-rendered videos
    const videoTimer = setTimeout(attachVideoListeners, 2000);

    return () => {
      document.removeEventListener("click", handleClick);
      observers.forEach(o => o.disconnect());
      clearTimeout(videoTimer);
      previewEl?.querySelectorAll("video").forEach(v => {
        v.removeEventListener("play", handleVideoPlay);
      });
    };
  }, []);

  return null;
}
