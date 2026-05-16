"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { getMsRemaining, EARLY_ACCESS_PRICE, REGULAR_PRICE } from "@/lib/early-access";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

function computeTimeLeft(): TimeLeft {
  const ms = getMsRemaining();
  if (ms === 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  const s = Math.floor(ms / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    expired: false,
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function TimerUnit({
  value,
  label,
  hideOnMobile,
}: {
  value: number;
  label: string;
  hideOnMobile?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center${hideOnMobile ? " hidden sm:flex" : ""}`}>
      <div className="bg-gold/15 border border-gold/30 rounded px-2 py-0.5 min-w-[2rem] text-center">
        <span className="text-gold font-bold text-sm tabular-nums leading-none">
          {pad(value)}
        </span>
      </div>
      <span className="text-gold/50 text-[9px] uppercase tracking-wider mt-0.5 leading-none">
        {label}
      </span>
    </div>
  );
}

function Colon({ hideOnMobile }: { hideOnMobile?: boolean }) {
  return (
    <span
      className={`text-gold/50 font-bold text-sm pb-3 select-none${hideOnMobile ? " hidden sm:block" : ""}`}
    >
      :
    </span>
  );
}

/**
 * Live early-access countdown banner.
 * Reads the deadline from NEXT_PUBLIC_EARLY_ACCESS_END_DATE (via lib/early-access.ts)
 * so every user sees the same countdown — no per-visitor resets.
 */
export function EarlyAccessBanner() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    setTimeLeft(computeTimeLeft());
    const id = setInterval(() => setTimeLeft(computeTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  // Render placeholder until client mounts (avoids hydration mismatch)
  if (timeLeft === null) {
    return (
      <div className="w-full bg-gold/10 border-b border-gold/20 px-4 py-2.5 h-[44px]" />
    );
  }

  if (timeLeft.expired) {
    return (
      <div className="w-full bg-surface/60 border-b border-border px-4 py-2.5">
        <p className="text-sm text-text-muted text-center">
          Early access has ended. Regular price: ${REGULAR_PRICE / 100}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-gold/10 border-b border-gold/20 px-4 py-2.5">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
        {/* Pricing text */}
        <div className="flex items-center gap-2 text-sm text-gold font-medium flex-wrap justify-center">
          <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            Early access:{" "}
            <strong>${EARLY_ACCESS_PRICE / 100} lifetime access</strong>
            {" — "}
            <span className="line-through text-gold/60 font-normal">
              ${REGULAR_PRICE / 100}
            </span>
          </span>
        </div>

        {/* Divider */}
        <span className="hidden sm:block text-gold/30 text-xs">|</span>

        {/* Live countdown */}
        <div className="flex items-center gap-1">
          <span className="text-gold/70 text-xs mr-1 hidden sm:block">Ends in</span>
          <div className="flex items-end gap-1">
            <TimerUnit value={timeLeft.days} label="days" />
            <Colon />
            <TimerUnit value={timeLeft.hours} label="hrs" />
            <Colon />
            <TimerUnit value={timeLeft.minutes} label="min" />
            <Colon hideOnMobile />
            <TimerUnit value={timeLeft.seconds} label="sec" hideOnMobile />
          </div>
        </div>
      </div>
    </div>
  );
}
