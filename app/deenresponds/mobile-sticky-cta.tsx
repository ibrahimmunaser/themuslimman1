"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface MobileStickyCtaProps {
  href?: string;
}

/**
 * Fixed bottom bar shown only on mobile (hidden on sm+).
 * Dismissible with an X so it doesn't cover content permanently.
 * Defaults to scrolling to #pricing; accepts an explicit href to go direct to checkout.
 */
export function MobileStickyCta({ href = "#pricing" }: MobileStickyCtaProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-[#150f04]/95 border-t border-gold/25 backdrop-blur-md px-4 py-3 safe-area-pb">
      <div className="flex items-center gap-3">
        <a
          href={href}
          className="flex-1 flex items-center justify-center py-3.5 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-sm transition-colors shadow-lg shadow-gold/20"
        >
          Get Access — 20% Off
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
