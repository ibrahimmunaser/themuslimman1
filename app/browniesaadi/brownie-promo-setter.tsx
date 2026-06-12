"use client";

import { useEffect } from "react";
import { setCreatorPromo } from "@/lib/creator-promos";

/**
 * Persists the BROWNIE59 promo code to localStorage on mount so it is
 * automatically applied when the user navigates to checkout from this page.
 * Individual → BROWNIE59 ($59), Family → BROWNIE119 ($119) via URL params.
 */
export function BrowniePromoSetter() {
  useEffect(() => {
    setCreatorPromo("BROWNIE59");
  }, []);
  return null;
}
