import { Sparkles } from "lucide-react";

const FROZEN_TIME = { days: 14, hours: 0, minutes: 0, seconds: 0 };

function TimerUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-gold/15 border border-gold/30 rounded px-2 py-0.5 min-w-[2rem] text-center">
        <span className="text-gold font-bold text-sm tabular-nums leading-none">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-gold/50 text-[9px] uppercase tracking-wider mt-0.5 leading-none">
        {label}
      </span>
    </div>
  );
}

function Colon() {
  return (
    <span className="text-gold/50 font-bold text-sm pb-3 select-none">:</span>
  );
}

/**
 * Slim early-access banner with a frozen timer display.
 * The timer is static — it is not a live countdown.
 */
export function EarlyAccessBanner() {
  const { days, hours, minutes, seconds } = FROZEN_TIME;

  return (
    <div className="w-full bg-gold/10 border-b border-gold/20 px-4 py-2.5">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
        {/* Left: text */}
        <div className="flex items-center gap-2 text-sm text-gold font-medium flex-wrap justify-center">
          <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            Early access:{" "}
            <strong>$99 lifetime access</strong>
            {" — "}
            <span className="line-through text-gold/60 font-normal">$149</span>
          </span>
        </div>

        {/* Divider */}
        <span className="hidden sm:block text-gold/30 text-xs">|</span>

        {/* Frozen timer */}
        <div className="flex items-end gap-1">
          <TimerUnit value={days} label="days" />
          <Colon />
          <TimerUnit value={hours} label="hrs" />
          <Colon />
          <TimerUnit value={minutes} label="min" />
          <Colon />
          <TimerUnit value={seconds} label="sec" />
        </div>
      </div>
    </div>
  );
}
