import { Play } from "lucide-react";

// Era → tailwind-compatible inline gradient colours
const ERA_STYLES: Record<string, { from: string; to: string; accent: string }> = {
  "pre-islamic":       { from: "#3d2e1a", to: "#1a1208", accent: "#8B6F45" },
  "birth-early-life":  { from: "#2a2040", to: "#110d1e", accent: "#7A6B9E" },
  "early-revelation":  { from: "#0e2d21", to: "#061510", accent: "#4A8C6E" },
  "makkah-persecution":{ from: "#2d1212", to: "#150808", accent: "#8C4A4A" },
  "hijrah":            { from: "#0f2030", to: "#060e18", accent: "#4A6E8C" },
  "madinah":           { from: "#182d0e", to: "#0a1506", accent: "#6E8C4A" },
  "campaigns":         { from: "#2d1e0e", to: "#150e06", accent: "#8C6E4A" },
  "final-years":       { from: "#2d2210", to: "#150f04", accent: "#C8A96E" },
};

const DEFAULT_STYLE = { from: "#1a1a1a", to: "#0a0a0a", accent: "#d4af37" };

interface PartThumbnailProps {
  partNumber: number;
  era: string;
  eraLabel: string;
  watchPercent?: number;
  isCompleted?: boolean;
}

export function PartThumbnail({
  partNumber,
  era,
  eraLabel,
  watchPercent = 0,
  isCompleted = false,
}: PartThumbnailProps) {
  const style = ERA_STYLES[era] ?? DEFAULT_STYLE;

  return (
    <div
      className="aspect-video relative overflow-hidden flex items-center justify-center"
      style={{
        background: `linear-gradient(135deg, ${style.from} 0%, ${style.to} 100%)`,
      }}
    >
      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 24px, ${style.accent}33 24px, ${style.accent}33 25px),
            repeating-linear-gradient(90deg, transparent, transparent 24px, ${style.accent}33 24px, ${style.accent}33 25px)`,
        }}
      />

      {/* Accent glow behind number */}
      <div
        className="absolute w-24 h-24 rounded-full blur-2xl opacity-30"
        style={{ background: style.accent }}
      />

      {/* Part number */}
      <div className="relative z-10 text-center select-none">
        <p
          className="text-5xl font-black tabular-nums leading-none"
          style={{ color: style.accent, textShadow: `0 0 40px ${style.accent}66` }}
        >
          {String(partNumber).padStart(2, "0")}
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-widest mt-1.5 text-white/40">
          {eraLabel}
        </p>
      </div>

      {/* Play button — visible on hover via group */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center border"
          style={{ background: `${style.accent}33`, borderColor: `${style.accent}88` }}
        >
          <Play className="w-5 h-5 ml-0.5" style={{ color: style.accent }} />
        </div>
      </div>

      {/* Completion badge */}
      {isCompleted && (
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
          ✓ Done
        </div>
      )}

      {/* In-progress % badge */}
      {!isCompleted && watchPercent > 0 && (
        <div
          className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold border"
          style={{
            background: `${style.accent}22`,
            borderColor: `${style.accent}55`,
            color: style.accent,
          }}
        >
          {watchPercent}%
        </div>
      )}

      {/* Progress bar */}
      {watchPercent > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
          <div
            className="h-full transition-all"
            style={{ width: `${watchPercent}%`, background: style.accent }}
          />
        </div>
      )}
    </div>
  );
}
