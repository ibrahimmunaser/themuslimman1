/**
 * Centralized analytics helper for themuslimman.com.
 *
 * All funnel events flow through trackEvent() so transport, dedup, and
 * attribution are consistent across every page and component.
 *
 * Transport: navigator.sendBeacon → /api/influencer/track
 * Fallback:  fetch with keepalive:true
 *
 * No sensitive payment data is ever included. Card fields, full PAN, CVV,
 * and expiry are never captured.
 */

import { captureAttribution, getAttribution, attributionToProps } from "./attribution";

// ── ID helpers ────────────────────────────────────────────────────────────────

/** Persistent visitor ID (localStorage, survives sessions). */
export function getVisitorId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    const key = "tmm_vid";
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(key, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

/** Session ID (sessionStorage, resets on new tab/session). */
export function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    const key = "tmm_sid";
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function getDeviceType(): "mobile" | "tablet" | "desktop" {
  try {
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
    if (/mobile|iphone|ipod|android|blackberry|opera mini|opera mobi|skyfire|maemo|windows phone|palm|iemobile/i.test(ua))
      return "mobile";
    return "desktop";
  } catch {
    return "desktop";
  }
}

// ── Creator resolution ────────────────────────────────────────────────────────

const KNOWN_CREATORS = new Set([
  "browniesaadi",
  "community",
  "deenresponds",
  "annarbor",
  "dearborn",
  "theorthodoxmuslim",
  "homepage",
  "korra",
  "itachi",
]);

/** Resolves a creator slug from hint or current pathname. Falls back to "homepage". */
export function resolveCreator(hint?: string | null): string {
  if (hint && KNOWN_CREATORS.has(hint)) return hint;
  if (typeof window !== "undefined") {
    const segment = window.location.pathname.slice(1).split("/")[0];
    if (KNOWN_CREATORS.has(segment)) return segment;
  }
  return "homepage";
}

// ── Dedup guard ───────────────────────────────────────────────────────────────
// Prevents double-firing from React StrictMode double-effects or rerenders.
// Keys are session-scoped (cleared on new session).

const _firedKeys = new Set<string>();

function getDedupKey(eventName: string): string {
  if (typeof window === "undefined") return eventName;
  const sid = sessionStorage.getItem("tmm_sid") ?? "no-sid";
  return `${eventName}::${window.location.pathname}::${sid}`;
}

// ── Transport ─────────────────────────────────────────────────────────────────

function send(payload: string): void {
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/influencer/track",
        new Blob([payload], { type: "application/json" })
      );
    } else {
      fetch("/api/influencer/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch { /* never block navigation */ }
}

// ── Dev logging ───────────────────────────────────────────────────────────────

function devLog(eventName: string, props: Record<string, unknown>): void {
  if (process.env.NODE_ENV !== "development") return;
  // eslint-disable-next-line no-console
  console.groupCollapsed(`[Analytics] ${eventName}`);
  // eslint-disable-next-line no-console
  console.table(
    Object.fromEntries(Object.entries(props).filter(([, v]) => v !== null && v !== undefined))
  );
  // eslint-disable-next-line no-console
  console.groupEnd();
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface TrackOptions {
  /** Allow the same event to fire multiple times (e.g. progress events). Default false. */
  allowDuplicates?: boolean;
  /** Creator slug override. Auto-detected from pathname when omitted. */
  creator?: string | null;
}

/**
 * Track a funnel event. This is the single entry-point for all analytics calls.
 *
 * - Attaches sessionId, visitorId, deviceType, and attribution automatically.
 * - Deduplicates page-level events within a session (unless allowDuplicates).
 * - Never throws or blocks navigation.
 * - Logs to console in development.
 */
export function trackEvent(
  eventName: string,
  properties: Record<string, unknown> = {},
  options: TrackOptions = {}
): void {
  try {
    if (typeof window === "undefined") return;

    if (!options.allowDuplicates) {
      const key = getDedupKey(eventName);
      if (_firedKeys.has(key)) return;
      _firedKeys.add(key);
    }

    const attribution = getAttribution();
    const sessionId = getSessionId();
    const visitorId = getVisitorId();
    const deviceType = getDeviceType();
    const creator = resolveCreator(options.creator);

    const meta: Record<string, unknown> = {
      ...attributionToProps(attribution),
      device_type: deviceType,
      page_path: window.location.pathname,
      ...properties,
    };

    devLog(eventName, meta);

    const payload = JSON.stringify({
      creator,
      eventType: eventName,
      sessionId,
      visitorId,
      route: window.location.pathname,
      metadata: JSON.stringify(meta),
    });

    send(payload);
  } catch { /* analytics must never break the page */ }
}

/**
 * Capture first-touch attribution from the current URL, then track an event.
 * Call this on page mount for landing / sponsor pages.
 */
export function captureAndTrack(
  eventName: string,
  properties: Record<string, unknown> = {},
  options: TrackOptions = {}
): void {
  captureAttribution();
  trackEvent(eventName, properties, options);
}

/**
 * Fire a tracking event and navigate. Uses sendBeacon so the event survives
 * the page unload. Falls back to a 150 ms timeout to avoid blocking the user.
 *
 * Use this for CTA clicks that immediately navigate to checkout.
 */
export function trackThenNavigate(
  eventName: string,
  properties: Record<string, unknown>,
  navigate: () => void,
  creatorHint?: string | null
): void {
  try {
    const attribution = getAttribution();
    const sessionId = getSessionId();
    const visitorId = getVisitorId();

    const payload = JSON.stringify({
      creator: resolveCreator(creatorHint),
      eventType: eventName,
      sessionId,
      visitorId,
      route: typeof window !== "undefined" ? window.location.pathname : null,
      metadata: JSON.stringify({
        ...attributionToProps(attribution),
        device_type: getDeviceType(),
        ...properties,
      }),
    });

    devLog(eventName, properties);

    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon("/api/influencer/track", new Blob([payload], { type: "application/json" }));
      navigate();
    } else {
      let navigated = false;
      const timer = setTimeout(() => { if (!navigated) { navigated = true; navigate(); } }, 150);
      fetch("/api/influencer/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      })
        .catch(() => {})
        .finally(() => {
          clearTimeout(timer);
          if (!navigated) { navigated = true; navigate(); }
        });
    }
  } catch {
    navigate();
  }
}
