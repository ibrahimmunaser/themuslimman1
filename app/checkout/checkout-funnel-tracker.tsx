"use client";

import { useEffect, useRef } from "react";
import { getSessionId, getVisitorId } from "@/lib/analytics";
import {
  CHECKOUT_ANALYTICS_SCHEMA,
  checkoutAttemptPayload,
  startCheckoutAttempt,
} from "@/lib/checkout-attempt";

interface CheckoutFunnelTrackerProps {
  creator: string;
  plan: string;
  interval: string;
  price: number;
  source?: string | null;
  influencer?: string | null;
  quizScore?: number | null;
  resultType?: string | null;
  emailPrefilled?: boolean;
  fromQuiz?: boolean;
}

// ── Device helpers ─────────────────────────────────────────────────────────────

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

// ── Attribution helper ─────────────────────────────────────────────────────────

/** Read first-touch attribution from localStorage without importing the full lib. */
function readStoredAttribution(): Record<string, string | null> {
  try {
    if (typeof window === "undefined") return {};
    const raw = localStorage.getItem("tmm_attribution");
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      utm_source:           typeof parsed.utmSource   === "string" ? parsed.utmSource   : null,
      utm_medium:           typeof parsed.utmMedium   === "string" ? parsed.utmMedium   : null,
      utm_campaign:         typeof parsed.utmCampaign === "string" ? parsed.utmCampaign : null,
      utm_content:          typeof parsed.utmContent  === "string" ? parsed.utmContent  : null,
      initial_landing_page: typeof parsed.initialLandingPage === "string" ? parsed.initialLandingPage : null,
      sponsor:              typeof parsed.sponsor  === "string" ? parsed.sponsor  : null,
    };
  } catch { return {}; }
}

// ── Normalized error categories ────────────────────────────────────────────────
// These map Stripe error codes to safe, non-PII category strings.
// Raw Stripe error messages are NEVER forwarded to analytics.

export function normalizePaymentError(code?: string, declineCode?: string): string {
  if (!code && !declineCode) return "unknown";
  const c = code ?? "";
  const d = declineCode ?? "";
  if (c === "payment_intent_authentication_failure" || c === "authentication_required" || c === "card_authentication_required" || d.includes("authentication")) return "authentication_failed";
  if (d === "card_declined" || d === "generic_decline" || d === "do_not_honor") return "card_declined";
  if (d === "insufficient_funds") return "insufficient_funds";
  if (d === "expired_card" || c === "expired_card") return "card_expired";
  if (c === "incorrect_cvc" || d === "incorrect_cvc") return "card_cvc_error";
  if (d === "card_velocity_exceeded") return "rate_limited";
  if (c === "api_connection_error" || c === "api_error") return "network_error";
  if (c === "card_error") return "card_declined";
  return "unknown";
}

// ── Main send function ─────────────────────────────────────────────────────────

export function sendCheckoutEvent(
  creator: string,
  eventType: string,
  extra?: Record<string, unknown>
) {
  try {
    if (typeof window === "undefined") return;
    const visitorId = getVisitorId();
    const sessionId = getSessionId();

    const attr = readStoredAttribution();

    const { userEmail: _discarded, ...restExtra } = extra ?? {};

    const payload = JSON.stringify({
      creator,
      eventType,
      sessionId,
      visitorId,
      route: window.location.pathname,
      metadata: JSON.stringify({
        source: creator,
        analytics_schema_version: CHECKOUT_ANALYTICS_SCHEMA,
        session_id: sessionId,
        device_type: getDeviceType(),
        ...attr,
        ...checkoutAttemptPayload(),
        ...restExtra,
      }),
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

/**
 * Fire checkout_load_failed with a normalized error category.
 * Called when the Stripe element or intent creation fails at initialization.
 * Never includes raw error messages — only safe category strings.
 */
export function sendCheckoutLoadFailed(
  creator: string,
  failureCategory: string,
  extra?: Record<string, unknown>
) {
  sendCheckoutEvent(creator, "checkout_load_failed", {
    failure_category: failureCategory,
    ...extra,
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CheckoutFunnelTracker({
  creator,
  plan,
  interval,
  price,
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

    // First-touch attribution merged into all checkout events.
    const attr = readStoredAttribution();

    const baseMeta: Record<string, unknown> = {
      selected_plan:      plan,
      plan_id:            plan,
      plan_type:          plan.startsWith("family") ? "family" : "individual",
      billing_interval:   interval,
      price,
      currency:           "usd",
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
      ...attr,
    };

    // Ensure attempt exists for direct /checkout URL visits (no prior checkout_clicked).
    startCheckoutAttempt(plan, { source: creator });

    sendCheckoutEvent(creator, "checkout_loaded", baseMeta);

    // Legacy per-plan events for backwards compat
    if (plan === "individual-lifetime") sendCheckoutEvent(creator, "checkout_loaded_individual_lifetime", baseMeta);
    else if (plan === "family-lifetime") sendCheckoutEvent(creator, "checkout_loaded_family_lifetime", baseMeta);

    // Abandonment: fires when the user navigates away without purchasing.
    const handleLeave = () => {
      if (purchasedRef.current) return;
      // Re-check sessionStorage — markPurchased() may have written it after mount
      if (sessionStorage.getItem("checkout_purchased") === "1") return;
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
