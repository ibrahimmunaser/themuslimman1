"use client";

import { useEffect, useState } from "react";
import { getCreatorPromo, getCreatorPromoConfig } from "@/lib/creator-promos";
import { formatPrice } from "@/lib/stripe-config";

interface LifetimePriceDisplayProps {
  basePrice: number; // in cents
}

/**
 * Shows the lifetime price with a strikethrough + discounted price when a
 * creator promo is stored in localStorage. Falls back to the plain base price.
 */
export function LifetimePriceDisplay({ basePrice }: LifetimePriceDisplayProps) {
  const [discount, setDiscount] = useState<{ amount: number; code: string } | null>(null);

  useEffect(() => {
    const stored = getCreatorPromo();
    if (!stored) return;
    const config = getCreatorPromoConfig(stored);
    if (config) {
      setDiscount({ amount: config.discountAmount, code: config.code });
    }
  }, []);

  if (discount) {
    const finalPrice = basePrice - discount.amount;
    return (
      <div className="mb-5">
        <div className="flex items-baseline gap-2.5 mb-1">
          <span className="text-2xl font-medium text-text-muted line-through">
            {formatPrice(basePrice)}
          </span>
          <span className="text-4xl font-bold text-gold">
            {formatPrice(finalPrice)}
          </span>
        </div>
        <p className="text-sm text-gold font-medium">
          One-time payment · Lifetime access
        </p>
      </div>
    );
  }

  return (
    <div className="mb-5">
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-4xl font-bold text-text">{formatPrice(basePrice)}</span>
      </div>
      <p className="text-sm text-gold font-medium">One-time payment · Lifetime access</p>
    </div>
  );
}
