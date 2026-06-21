"use client";

import { useEffect, useRef } from "react";
import { nanoid } from "nanoid";

interface CheckoutFunnelTrackerProps {
  creator: string;
  plan: string;
  interval: string;
  price: number;
  promoCode?: string | null;
  source?: string | null;
  influencer?: string | null;
  quizScore?: number | null;
  resultType?: string | null;
  emailPrefilled?: boolean;
  fromQuiz?: boolean;
}

// ── Session helpers ────────────────────────────────────────────────────────────

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

function getDeviceType(): "mobile" | "tablet" | "desktop" {
  try {
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
    if (/mobile|iphone|ipod|android|blackberry|opera mini|opera mobi|skyfire|maemo|windows phone|palm|iemobile/i.test(ua)) return "mobile";
    return "desktop";
  } catch {
    return "desktop";
  }
}

function getOS(): string {
  try {
    const ua = navigator.userAgent;
    if (/iphone|ipad|ipod/i.test(ua)) return "ios";
    if (/android/i.test(ua)) return "android";
    if (/windows/i.test(ua)) return "windows";
    if (/mac/i.test(ua)) return "macos";
    return "other";
  } catch {
    return "unknown";
  }
}

// ── Shared checkout session state (sessionStorage keys) ───────────────────────
// These are written by CheckoutForm helpers below so abandonment can read them.

const SK_PAYMENT_STARTED = "co_payment_started";
const SK_PAYMENT_METHOD  = "co_payment_method";
const SK_LOADED_AT       = "co_loaded_at";

/** Called by CheckoutForm when payment starts. */
export function markPaymentStartedInSession(method?: string) {
  try {
    sessionStorage.setItem(SK_PAYMENT_STARTED, "1");
    if (method) sessionStorage.setItem(SK_PAYMENT_METHOD, method);
  } catch { /* ignore */ }
}

/** Called by CheckoutForm when a payment method is selected. */
export function markPaymentMethodInSession(method: string) {
  try {
    sessionStorage.setItem(SK_PAYMENT_METHOD, method);
  } catch { /* ignore */ }
}

// ── Main send function ─────────────────────────────────────────────────────────

export function sendCheckoutEvent(
  creator: string,
  eventType: string,
  extra?: Record<string, unknown>
) {
  try {
    if (typeof window === "undefined") return;
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

// ── Component ─────────────────────────────────────────────────────────────────

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
  emailPrefilled = false,
  fromQuiz = false,
}: CheckoutFunnelTrackerProps) {
  const purchasedRef = useRef(false);

  // Detect purchase flag set by the success page so abandonment never misfires.
  useEffect(() => {
    try {
      if (sessionStorage.getItem("checkout_purchased") === "1") {
        purchasedRef.current = true;
      }
    } catch { /* storage blocked */ }
  }, []);

  useEffect(() => {
    const device = getDeviceType();
    const os     = getOS();

    // Record load timestamp for time-on-checkout calculation.
    const loadedAt = Date.now();
    try { sessionStorage.setItem(SK_LOADED_AT, String(loadedAt)); } catch { /* ignore */ }

    // Clear any stale payment-started flag from a previous checkout visit.
    try {
      sessionStorage.removeItem(SK_PAYMENT_STARTED);
      sessionStorage.removeItem(SK_PAYMENT_METHOD);
    } catch { /* ignore */ }

    const baseMeta: Record<string, unknown> = {
      selected_plan:      plan,
      plan_type:          plan.startsWith("family") ? "family" : "individual",
      billing_interval:   interval,
      price,
      currency:           "usd",
      promoCode:          promoCode  ?? null,
      source:             source     ?? creator,
      influencer:         influencer ?? creator,
      quiz_score:         quizScore  ?? null,
      result_type:        resultType ?? null,
      email_prefilled:    emailPrefilled,
      from_quiz:          fromQuiz,
      device_type:        device,
      os,
      page_path:          window.location.pathname,
      referrer:           document.referrer || null,
    };

    sendCheckoutEvent(creator, "checkout_loaded", baseMeta);

    // Legacy per-plan events for backwards compat
    if (plan === "individual-lifetime") sendCheckoutEvent(creator, "checkout_loaded_individual_lifetime", baseMeta);
    else if (plan === "family-lifetime") sendCheckoutEvent(creator, "checkout_loaded_family_lifetime", baseMeta);

    // Abandonment: fires when the user navigates away without purchasing.
    const handleLeave = () => {
      if (purchasedRef.current) return;
      try {
        const paymentStarted = sessionStorage.getItem(SK_PAYMENT_STARTED) === "1";
        const paymentMethod  = sessionStorage.getItem(SK_PAYMENT_METHOD) ?? null;
        const loadedAtStr    = sessionStorage.getItem(SK_LOADED_AT);
        const timeOnCheckout = loadedAtStr ? Math.round((Date.now() - Number(loadedAtStr)) / 1000) : null;

        sendCheckoutEvent(creator, "checkout_abandoned", {
          ...baseMeta,
          payment_started:              paymentStarted,
          payment_method_selected:      paymentMethod,
          time_on_checkout_seconds:     timeOnCheckout,
        });
      } catch {
        sendCheckoutEvent(creator, "checkout_abandoned", baseMeta);
      }
    };

    window.addEventListener("pagehide", handleLeave);
    return () => window.removeEventListener("pagehide", handleLeave);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creator]);

  return null;
}
