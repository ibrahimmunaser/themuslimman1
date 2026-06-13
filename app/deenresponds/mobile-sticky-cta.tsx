"use client";

import { useState } from "react";
import { X } from "lucide-react";

declare global {
  interface Window {
    deenTrack?: (event: string, props?: Record<string, string>) => void;
  }
}

interface MobileStickyCtaProps {
  href?: string;
  onCtaClick?: () => void;
  label?: string;
  sublabel?: string;
}

/**
 * Fixed bottom bar shown only on mobile (hidden on sm+).
 * Dismissible with an X so it doesn't cover content permanently.
 * Defaults to scrolling to #pricing; accepts an explicit href to go direct to checkout.
 */
export function MobileStickyCta({
  href = "#pricing",
  onCtaClick,
  label = "Claim Sponsor Offer",
  sublabel = "Sponsor discount applied",
}: MobileStickyCtaProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-[#150f04]/95 border-t border-gold/25 backdrop-blur-md px-4 py-3 safe-area-pb">
      <div className="flex items-center gap-3">
        <a
          href={href}
          onClick={() => { onCtaClick?.(); window.deenTrack?.("sticky_cta_clicked"); }}
          className="flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl bg-gold hover:bg-gold-light text-ink transition-colors shadow-lg shadow-gold/20"
        >
          <span className="font-bold text-sm leading-tight">{label}</span>
          <span className="text-[10px] font-medium opacity-80 leading-tight">{sublabel}</span>
        </a>
        <button
          onClick={() => setDismissed(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-text-muted hover:text-text hover:bg-surface transition-colors flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
