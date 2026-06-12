"use client";

import { useEffect } from "react";
import { track } from "@vercel/analytics";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function fireEvent(name: string, props?: Record<string, string>) {
  const payload = { creator: "browniesaadi", ...props };
  track(name, payload);
  window.fbq?.("trackCustom", name, payload);
}

/**
 * Attaches delegated click analytics to all [data-track] elements.
 * Exposes window.brownieTrack for programmatic calls from sibling components.
 */
export function BrownieAnalytics() {
  useEffect(() => {
    (window as unknown as Record<string, unknown>).brownieTrack = fireEvent;

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
      delete (window as unknown as Record<string, unknown>).brownieTrack;
    };
  }, []);

  return null;
}
