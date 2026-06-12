"use client";

import { useEffect } from "react";
import { setCreatorPromo } from "@/lib/creator-promos";

/**
 * Persists the COMMUNITY49 promo code to localStorage on mount so it is
 * automatically applied when the user navigates to checkout — even without
 * a ?promo= query parameter in the checkout URL.
 * Individual → COMMUNITY49 ($49), Family → COMMUNITY99 ($99) via URL params.
 */
export function CommunityPromoSetter() {
  useEffect(() => {
    setCreatorPromo("COMMUNITY49");
  }, []);
  return null;
}
