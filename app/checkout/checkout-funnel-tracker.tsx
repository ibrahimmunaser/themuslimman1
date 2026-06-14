"use client";

import { useEffect } from "react";
import { nanoid } from "nanoid";

interface CheckoutFunnelTrackerProps {
  creator: string;
  plan: string;
  promoCode?: string | null;
  amount?: number;
  userEmail?: string;
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
    const vidKey = `inf_vid_${creator}`;
    const sidKey = `inf_sid_${creator}`;
    const visitorId = getOrCreate(localStorage, vidKey, 7 * 24 * 60 * 60 * 1000);
    const sessionId = getOrCreate(sessionStorage, sidKey);

    const payload = JSON.stringify({
      creator,
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
  } catch {
    // never block checkout
  }
}

export default function CheckoutFunnelTracker({
  creator,
  plan,
  promoCode,
  amount,
  userEmail,
}: CheckoutFunnelTrackerProps) {
  useEffect(() => {
    sendCheckoutEvent(creator, "checkout_loaded", { plan, promoCode, amount, userEmail });
    // Fire specific v2 events for the influencer funnel
    if (plan === "individual-lifetime") {
      sendCheckoutEvent(creator, "checkout_loaded_individual_lifetime", { plan, promoCode, amount, userEmail });
    } else if (plan === "family-lifetime") {
      sendCheckoutEvent(creator, "checkout_loaded_family_lifetime", { plan, promoCode, amount, userEmail });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creator]);

  return null;
}
