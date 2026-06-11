"use client";

import { useState } from "react";
import { Play } from "lucide-react";

interface YoutubeEmbedProps {
  /** YouTube video ID — the part after youtu.be/ or ?v= */
  videoId: string;
  title?: string;
}

/**
 * Loads a lightweight thumbnail+play-button initially.
 * Replaces itself with the real iframe only when the user clicks play,
 * avoiding the heavy YouTube JS bundle on initial page load.
 */
export function YoutubeEmbed({ videoId, title = "Watch video" }: YoutubeEmbedProps) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-border shadow-2xl">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setPlaying(true)}
      className="group relative w-full aspect-video rounded-2xl overflow-hidden border border-border shadow-2xl cursor-pointer bg-zinc-900"
      aria-label={`Play: ${title}`}
    >
      {/* YouTube maxres thumbnail */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
        loading="lazy"
      />
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 transition-colors duration-300" />
      {/* Red YouTube-style play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#ff0000] flex items-center justify-center shadow-2xl shadow-black/60 group-hover:scale-110 group-hover:bg-[#cc0000] transition-all duration-200">
          <Play className="w-7 h-7 sm:w-9 sm:h-9 text-white fill-white ml-0.5" />
        </div>
      </div>
    </button>
  );
}
