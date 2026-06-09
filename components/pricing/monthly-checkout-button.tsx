"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface MonthlyCheckoutButtonProps {
  className?: string;
}

export function MonthlyCheckoutButton({ className = "" }: MonthlyCheckoutButtonProps) {
  return (
    <Link
      href="/checkout?plan=individual-monthly"
      className={`inline-flex items-center justify-center gap-2 w-full rounded-xl px-6 py-3.5 font-semibold text-base transition-all border border-border bg-surface hover:bg-surface-raised hover:border-gold/30 text-text ${className}`}
    >
      <ArrowRight className="w-4 h-4 text-gold" />
      Start Monthly
    </Link>
  );
}
