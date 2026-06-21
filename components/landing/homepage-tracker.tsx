"use client";

import { useEffect } from "react";

function send(event: string) {
  try {
    if (typeof window === "undefined") return;
    const payload = JSON.stringify({ creator: "homepage", eventType: event });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/influencer/track", new Blob([payload], { type: "application/json" }));
    } else {
      fetch("/api/influencer/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(() => {});
    }
  } catch { /* never block */ }
}

/**
 * Fires homepage analytics events:
 * - `homepage_view`       — on mount
 * - `homepage_pricing_view` — once when #pricing section enters the viewport
 * - Any `data-track="event_name"` attribute click — via event delegation
 */
export function HomepageTracker() {
  useEffect(() => {
    send("homepage_view");

    // Click delegation: any element with data-track fires its event.
    function handleClick(e: MouseEvent) {
      const el = (e.target as HTMLElement).closest("[data-track]");
      if (!el) return;
      const event = (el as HTMLElement).dataset.track;
      if (event) send(event);
    }
    document.addEventListener("click", handleClick);

    // Intersection: fire once when the pricing section becomes visible.
    const pricingEl = document.getElementById("pricing");
    let observer: IntersectionObserver | undefined;
    if (pricingEl && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            send("homepage_pricing_view");
            observer?.disconnect();
          }
        },
        { threshold: 0.15 },
      );
      observer.observe(pricingEl);
    }

    return () => {
      document.removeEventListener("click", handleClick);
      observer?.disconnect();
    };
  }, []);

  return null;
}
