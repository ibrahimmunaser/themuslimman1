"use client";

import { useEffect, useRef } from "react";
import { nanoid } from "nanoid";

interface FunnelTrackerProps {
  creator: string;
  promoCode?: string;
  userEmail?: string;
  /** Custom v2 landing event name. Defaults to "brownie_landing_page_view". */
  landingEvent?: string;
}

function getOrCreate(storage: Storage, key: string, ttlMs?: number): string {
  try {
    const raw = storage.getItem(key);
    if (raw) {
      if (ttlMs) {
        const parsed = JSON.parse(raw) as { v: string; exp: number };
        if (parsed.exp > Date.now()) return parsed.v;
      } else {
        return raw;
      }
    }
    const id = nanoid();
    if (ttlMs) {
      storage.setItem(key, JSON.stringify({ v: id, exp: Date.now() + ttlMs }));
    } else {
      storage.setItem(key, id);
    }
    return id;
  } catch {
    return nanoid();
  }
}

function sendEvent(
  creator: string,
  eventType: string,
  sessionId: string,
  visitorId: string,
  extra?: Record<string, unknown>
) {
  const payload = JSON.stringify({ creator, eventType, sessionId, visitorId, ...extra });
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon("/api/influencer/track", new Blob([payload], { type: "application/json" }));
    } else {
      fetch("/api/influencer/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // never block rendering
  }
}

export default function BrownieFunnelTracker({ creator, promoCode, userEmail, landingEvent = "brownie_landing_page_view" }: FunnelTrackerProps) {
  const firedLandingView = useRef(false);

  useEffect(() => {
    const vidKey = `inf_vid_${creator}`;
    const sidKey = `inf_sid_${creator}`;
    const svKey = `inf_sv_${creator}`;

    const visitorId = getOrCreate(localStorage, vidKey, 7 * 24 * 60 * 60 * 1000);
    const sessionId = getOrCreate(sessionStorage, sidKey);

    const common = {
      creator,
      sessionId,
      visitorId,
      promoCode,
      userEmail,
      route: window.location.pathname,
    };

    // Fire landing_view once per session (v1 + v2 event)
    if (!firedLandingView.current && !sessionStorage.getItem(svKey)) {
      firedLandingView.current = true;
      sessionStorage.setItem(svKey, "1");
      sendEvent(creator, "landing_view", sessionId, visitorId, { ...common });
      sendEvent(creator, landingEvent, sessionId, visitorId, { ...common });
    }

    // IntersectionObserver for pricing section
    const pricingEl = document.getElementById("pricing");
    const svPricingKey = `inf_pv_${creator}`;
    let observer: IntersectionObserver | null = null;

    if (pricingEl && !sessionStorage.getItem(svPricingKey)) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              sessionStorage.setItem(svPricingKey, "1");
              sendEvent(creator, "pricing_viewed", sessionId, visitorId, { ...common });
              observer?.disconnect();
            }
          }
        },
        { threshold: 0.3 }
      );
      observer.observe(pricingEl);
    }

    // Delegated click listener for [data-track] elements
    function handleClick(e: MouseEvent) {
      const target = (e.target as Element)?.closest("[data-track]") as HTMLElement | null;
      if (!target) return;
      const eventType = target.dataset.track;
      const plan = target.dataset.plan;
      if (!eventType) return;
      sendEvent(creator, eventType, sessionId, visitorId, { ...common, plan });
    }

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
      observer?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creator]);

  return null;
}
