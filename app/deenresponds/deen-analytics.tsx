"use client";

import { useEffect } from "react";
import { track } from "@vercel/analytics";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function fireEvent(name: string, props?: Record<string, string>) {
  const payload = { creator: "deenresponds", ...props };
  track(name, payload);
  window.fbq?.("trackCustom", name, payload);
}

/**
 * Attaches delegated click analytics to all elements with a [data-track] attribute.
 * Also exposes a global `deenTrack` helper for programmatic calls from other
 * client components on this page (R2VideoPlayer, MobileStickyCta).
 */
export function DeenAnalytics() {
  useEffect(() => {
    // Expose a lightweight global so sibling client components can fire events
    // without needing to prop-drill or import this module a second time.
    (window as unknown as Record<string, unknown>).deenTrack = fireEvent;

    function handleClick(e: MouseEvent) {
      const el = (e.target as Element).closest("[data-track]") as HTMLElement | null;
      if (!el) return;
      const eventName = el.dataset.track;
      if (!eventName) return;
      const plan = el.dataset.plan;
      fireEvent(eventName, plan ? { plan } : undefined);
    }

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
      delete (window as unknown as Record<string, unknown>).deenTrack;
    };
  }, []);

  return null;
}
