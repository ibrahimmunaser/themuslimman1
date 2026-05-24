"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Tag, X } from "lucide-react";
import {
  getCreatorPromoConfig,
  getCreatorPromo,
  setCreatorPromo,
  clearCreatorPromo,
} from "@/lib/creator-promos";

interface CreatorPromoTrackerProps {
  /** When true, renders a dismissible banner below the component. */
  showBanner?: boolean;
}

function CreatorPromoTrackerInner({ showBanner = false }: CreatorPromoTrackerProps) {
  const searchParams = useSearchParams();
  const [activePromo, setActivePromo] = useState<{ code: string; displayLabel: string } | null>(null);

  useEffect(() => {
    // Capture ?promo= from URL and persist it
    const urlPromo = searchParams.get("promo");
    if (urlPromo) {
      const config = getCreatorPromoConfig(urlPromo);
      if (config) {
        setCreatorPromo(config.code);
      }
    }

    // Read whatever is currently stored (either just set or from a previous visit)
    const stored = getCreatorPromo();
    if (stored) {
      const config = getCreatorPromoConfig(stored);
      if (config) {
        setActivePromo({ code: config.code, displayLabel: config.displayLabel });
      } else {
        // Stored code is no longer valid — clean it up
        clearCreatorPromo();
      }
    }
  }, [searchParams]);

  const handleDismiss = () => {
    // Full removal — not just hiding. Refreshing or returning will not re-apply.
    clearCreatorPromo();
    setActivePromo(null);
  };

  if (!showBanner || !activePromo) return null;

  return (
    <div className="w-full bg-gold/10 border-b border-gold/20 px-4 py-2.5">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Tag className="w-3.5 h-3.5 text-gold flex-shrink-0" />
          <span className="text-gold font-medium">Creator offer applied:</span>
          <span className="text-text-secondary">{activePromo.displayLabel}</span>
        </div>
        <button
          onClick={handleDismiss}
          className="text-text-muted hover:text-text transition-colors flex-shrink-0"
          aria-label="Remove promo code"
          title="Remove this promo code"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Tracks creator promo codes from URL params (?promo=KORRA20) and persists them
 * to localStorage so they survive navigation and can be auto-applied at checkout.
 *
 * - Pass `showBanner` to display a subtle dismissible strip announcing the offer.
 * - Clicking the X fully clears the promo from localStorage (not just hides it).
 * - Monthly checkout is unaffected — it has no promo code support at all.
 */
export function CreatorPromoTracker(props: CreatorPromoTrackerProps) {
  return (
    <Suspense fallback={null}>
      <CreatorPromoTrackerInner {...props} />
    </Suspense>
  );
}
