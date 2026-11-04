"use client";

import type { ReactNode } from "react";

/**
 * Every "watch the free lesson" control scrolls to and plays the single hero player.
 * It does not mount another video.
 */
export function WatchPreviewButton({
  className,
  children,
  track,
}: {
  className?: string;
  children: ReactNode;
  track?: string;
}) {
  return (
    <a
      href="#hero-player"
      data-track={track}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        // Scroll + play without writing "#hero-player" into the URL — a persisted
        // hash would make the browser jump straight back down to this section on
        // every later refresh or language switch instead of opening at the top.
        document.getElementById("hero-player")?.scrollIntoView({ behavior: "smooth", block: "center" });
        window.dispatchEvent(new Event("seerah-play-preview"));
      }}
    >
      {children}
    </a>
  );
}
