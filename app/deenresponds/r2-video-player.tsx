"use client";

import { useState } from "react";
import { Play } from "lucide-react";

interface R2VideoPlayerProps {
  url: string;
  title?: string;
  /** Short label shown on the thumbnail, e.g. "Deen Responds on TheMuslimMan Seerah Program" */
  label?: string;
}

/**
 * Shows a branded static thumbnail with a play button overlay.
 * The <video> element — and the network request to R2 — is only created
 * when the user clicks play, keeping initial page load fast.
 */
export function R2VideoPlayer({
  url,
  title = "Video",
  label,
}: R2VideoPlayerProps) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-border shadow-2xl bg-zinc-900">
        <video
          className="absolute inset-0 w-full h-full"
          controls
          autoPlay
          playsInline
          preload="auto"
          title={title}
        >
          <source src={url} type="video/mp4" />
        </video>
      </div>
    );
  }

  return (
    <button
      onClick={() => setPlaying(true)}
      className="group relative w-full aspect-video rounded-2xl overflow-hidden border border-gold/20 shadow-2xl shadow-gold/10 cursor-pointer bg-zinc-950"
      aria-label={`Play: ${title}`}
    >
      {/* Dark gradient background with subtle grid pattern */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 50% 110%, rgba(200,169,110,0.15) 0%, transparent 65%), linear-gradient(135deg, #1a1208 0%, #0d0d0d 60%, #111008 100%)",
        }}
      />
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(circle, #c8a96e 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Label pill — top center */}
      {label && (
        <div className="absolute top-5 left-0 right-0 flex justify-center px-6 pointer-events-none">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/15 border border-gold/35 text-gold text-sm font-medium text-center leading-snug max-w-sm">
            {label}
          </span>
        </div>
      )}

      {/* Center play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gold/90 group-hover:bg-gold flex items-center justify-center shadow-2xl shadow-gold/40 group-hover:scale-110 transition-all duration-200">
          <Play className="w-7 h-7 sm:w-9 sm:h-9 text-ink fill-ink ml-0.5" />
        </div>
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
        <p className="text-white/40 text-xs tracking-wide">Click to play</p>
      </div>
    </button>
  );
}
