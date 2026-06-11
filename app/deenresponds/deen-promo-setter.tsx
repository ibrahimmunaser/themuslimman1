"use client";

import { useEffect } from "react";
import { setCreatorPromo } from "@/lib/creator-promos";

/**
 * Persists the DEEN promo code to localStorage on mount so it is automatically
 * applied when the user navigates to checkout from this landing page —
 * even without a ?promo= query parameter in the checkout URL.
 */
export function DeenPromoSetter() {
  useEffect(() => {
    setCreatorPromo("DEEN");
  }, []);
  return null;
}
