"use client";

import { useEffect } from "react";
import { setCreatorPromo } from "@/lib/creator-promos";

interface Props {
  promoCode: string;
}

/** Persists the creator promo code to localStorage on mount so it is
 *  automatically applied when the user navigates to checkout from this page. */
export function InfluencerPromoSetter({ promoCode }: Props) {
  useEffect(() => {
    setCreatorPromo(promoCode);
  }, [promoCode]);
  return null;
}
