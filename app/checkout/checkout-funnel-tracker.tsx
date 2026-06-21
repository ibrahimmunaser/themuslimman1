"use client";

import { useEffect, useRef } from "react";
import { nanoid } from "nanoid";

interface CheckoutFunnelTrackerProps {
  creator: string;
  plan: string;
  interval: string;      // "lifetime" | "monthly"
  price: number;
  promoCode?: string | null;
  source?: string | null;
  influencer?: string | null;
  quizScore?: number | null;
  resultType?: string | null;
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

export function sendCheckoutEvent(
  creator: string,
  eventType: string,
  extra?: Record<string, unknown>
) {
  try {
    const vidKey    = `inf_vid_${creator}`;
    const sidKey    = `inf_sid_${creator}`;
    const visitorId = getOrCreate(localStorage,   vidKey, 7 * 24 * 60 * 60 * 1000);
    const sessionId = getOrCreate(sessionStorage, sidKey);

    const payload = JSON.stringify({
      creator,
      eventType,
      sessionId,
      visitorId,
      route: window.location.pathname,
      metadata: JSON.stringify({ source: creator, ...extra }),
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
  } catch {
    // never block checkout
  }
}

export default function CheckoutFunnelTracker({
  creator,
  plan,
  interval,
  price,
  promoCode,
  source,
  influencer,
  quizScore,
  resultType,
}: CheckoutFunnelTrackerProps) {
  const purchasedRef = useRef(false);

  // Mark as purchased so the pagehide handler won't fire checkout_abandoned.
  // Called by the parent when a successful payment redirect happens.
  // We detect purchase via a special sessionStorage flag set by the success page.
  useEffect(() => {
    try {
      if (sessionStorage.getItem("checkout_purchased") === "1") {
        purchasedRef.current = true;
      }
    } catch { /* storage blocked */ }
  }, []);

  useEffect(() => {
    const meta: Record<string, unknown> = {
      selected_plan: plan,
      price,
      interval,
      promoCode:   promoCode  ?? null,
      source:      source     ?? creator,
      influencer:  influencer ?? creator,
      quiz_score:  quizScore  ?? null,
      result_type: resultType ?? null,
    };

    sendCheckoutEvent(creator, "checkout_loaded", meta);

    // Legacy per-plan events for backwards compat
    if (plan === "individual-lifetime") sendCheckoutEvent(creator, "checkout_loaded_individual_lifetime", meta);
    else if (plan === "family-lifetime") sendCheckoutEvent(creator, "checkout_loaded_family_lifetime", meta);

    // Abandonment: fires when the user leaves without purchasing
    const handleLeave = () => {
      if (purchasedRef.current) return;
      sendCheckoutEvent(creator, "checkout_abandoned", meta);
    };

    window.addEventListener("pagehide", handleLeave);
    return () => window.removeEventListener("pagehide", handleLeave);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creator]);

  return null;
}
