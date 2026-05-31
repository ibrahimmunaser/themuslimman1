"use client";

import { useEffect, useState } from "react";
import { getMsRemaining, EARLY_ACCESS_PRICE, REGULAR_PRICE } from "@/lib/early-access";

interface TimeLeft {
  days: number;
  expired: boolean;
}

function computeTimeLeft(): TimeLeft {
  const ms = getMsRemaining();
  if (ms === 0) return { days: 0, expired: true };
  return {
    days: Math.floor(ms / (1000 * 60 * 60 * 24)),
    expired: false,
  };
}

/**
 * Early supporter price banner.
 * Reads the deadline from NEXT_PUBLIC_EARLY_ACCESS_END_DATE (via lib/early-access.ts)
 * so every user sees the same remaining days — no per-visitor resets.
 */
export function EarlyAccessBanner() {
  // Initialize from client immediately; null only during SSR to avoid hydration mismatch.
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(
    typeof window === "undefined" ? null : computeTimeLeft()
  );

  useEffect(() => {
    // Set the initial value on mount — intentionally in the effect so the server
    // renders a neutral placeholder (null) without a hydration mismatch.
    setTimeLeft(computeTimeLeft());
    // Update once per minute — days don't need second-level precision.
    const id = setInterval(() => setTimeLeft(computeTimeLeft()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Render placeholder until client mounts (avoids hydration mismatch)
  if (timeLeft === null) {
    return <div className="w-full bg-[#0f0d07] border-b border-gold/20 h-[40px]" />;
  }

  if (timeLeft.expired) {
    return (
      <div className="w-full bg-surface/60 border-b border-border px-4 py-2.5">
        <p className="text-sm text-text-muted text-center">
          Early supporter pricing has ended. Regular price: ${REGULAR_PRICE / 100}
        </p>
      </div>
    );
  }

  const daysLabel = timeLeft.days === 1 ? "1 day remaining" : `${timeLeft.days} days remaining`;

  return (
    <div className="w-full bg-[#0f0d07] border-b border-gold/25 px-4 py-2.5">
      <p className="text-center text-sm text-gold/90 leading-snug">
        <span className="font-semibold">Early Supporter Price:</span>{" "}
        <strong className="text-gold">${EARLY_ACCESS_PRICE / 100} lifetime access</strong>
        {" — "}
        <span className="line-through text-gold/55 font-normal">
          ${REGULAR_PRICE / 100}
        </span>
        <span className="text-gold/60 mx-2 hidden sm:inline">·</span>
        <span className="text-gold/70 block sm:inline mt-0.5 sm:mt-0 text-xs sm:text-sm">
          {daysLabel}
        </span>
      </p>
    </div>
  );
}
