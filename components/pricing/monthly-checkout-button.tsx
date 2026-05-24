"use client";

import { ArrowRight } from "lucide-react";

interface MonthlyCheckoutButtonProps {
  isLoggedIn: boolean;
  className?: string;
}

export function MonthlyCheckoutButton({ isLoggedIn, className = "" }: MonthlyCheckoutButtonProps) {
  const handleClick = () => {
    if (isLoggedIn) {
      window.location.href = "/checkout?plan=monthly";
    } else {
      window.location.href = "/signup-checkout?plan=monthly";
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center justify-center gap-2 w-full rounded-xl px-6 py-3.5 font-semibold text-base transition-all border border-border bg-surface hover:bg-surface-raised hover:border-gold/30 text-text ${className}`}
    >
      <ArrowRight className="w-4 h-4 text-gold" />
      Start Monthly
    </button>
  );
}
