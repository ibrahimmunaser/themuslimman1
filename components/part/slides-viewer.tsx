"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Layers, Maximize2, X } from "lucide-react";
import { trackAssetOpened } from "@/app/actions/progress";
import type { SlideFile } from "@/lib/types";

/** Main slide image. Shows a spinner while loading, re-triggers on src change. */
function SlideImg({ src, alt, priority }: { src: string; alt: string; priority?: boolean }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { setLoaded(false); }, [src]);

  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        // eslint-disable-next-line react/no-unknown-property
        fetchPriority={priority ? "high" : "auto"}
        className={`max-w-full max-h-full object-contain transition-opacity duration-200 ${loaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setLoaded(true)}
      />
    </>
  );
}

interface SlidesViewerProps {
  slides: SlideFile[];
  title?: string;
  type?: "presented" | "detailed";
  partNumber?: number;
  previewMode?: boolean;
}

export function SlidesViewer({ slides, title, type = "presented", partNumber, previewMode }: SlidesViewerProps) {
  const [current, setCurrent] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const prev = useCallback(() => setCurrent((c) => Math.max(0, c - 1)), []);
  const next = useCallback(
    () => setCurrent((c) => Math.min(slides.length - 1, c + 1)),
    [slides.length]
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 50) return; // ignore small taps
    if (delta < 0) next(); else prev();
  }, [next, prev]);

  useEffect(() => {
    // Keep CSS state in sync when native fullscreen is toggled (e.g. Esc key)
    const handler = () => {
      if (!document.fullscreenElement) setFullscreen(false);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const enterFullscreen = useCallback(async () => {
    // Set CSS overlay immediately — reliable across all browsers
    setFullscreen(true);
    // Also attempt native fullscreen as an enhancement (browser chrome disappears)
    if (containerRef.current?.requestFullscreen) {
      try {
        await containerRef.current.requestFullscreen();
      } catch {
        // Native fullscreen denied — CSS overlay is already shown, nothing to do
      }
    }
  }, []);

  const exitFullscreenMode = useCallback(() => {
    setFullscreen(false);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!partNumber || previewMode || !slides.length) return;
    trackAssetOpened(partNumber, "slides").catch(() => {});
    window.dispatchEvent(new CustomEvent("seerah:progressUpdate", { detail: { openedAssets: ["slides"] } }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const thumb = strip.querySelectorAll("button")[current] as HTMLElement | undefined;
    thumb?.scrollIntoView({ behavior: "auto", block: "nearest", inline: "nearest" });
  }, [current]);

  useEffect(() => {
    if (!fullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") exitFullscreenMode();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [fullscreen, prev, next, exitFullscreenMode]);

  if (!slides.length) {
    return (
      <div className="aspect-video rounded-2xl border border-border bg-surface flex flex-col items-center justify-center gap-3">
        <div className="w-14 h-14 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
          <Layers className="w-6 h-6 text-gold/50" />
        </div>
        <div className="text-center">
          <p className="text-text-secondary text-sm font-medium">No slides for this part</p>
          <p className="text-xs text-text-muted mt-1">
            {type === "presented" ? "Presented" : "Detailed"} slides will be available shortly
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={
        fullscreen
          ? "fixed inset-0 z-50 bg-black flex flex-col"
          : "rounded-2xl border border-border overflow-hidden bg-black flex flex-col"
      }
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-ink/80 border-b border-border/50 flex-shrink-0">
        <Layers className="w-4 h-4 text-gold flex-shrink-0" />
        <p className="text-sm text-text-secondary flex-1 truncate">
          {title || (type === "presented" ? "Presented Slides" : "Detailed Slides")}
        </p>
        <span className="text-xs text-text-muted tabular-nums">
          {current + 1} / {slides.length}
        </span>
        <button
          onClick={() => fullscreen ? exitFullscreenMode() : enterFullscreen()}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-text-muted hover:text-text transition-colors -mr-2"
          aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {fullscreen ? <X className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Slide area — swipe left/right to navigate on mobile */}
      <div
        className={`relative flex-1 bg-black ${!fullscreen ? "group cursor-zoom-in" : ""}`}
        style={{ minHeight: fullscreen ? undefined : "min(420px, 55vw)" }}
        onClick={!fullscreen ? () => enterFullscreen() : undefined}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        title={!fullscreen ? "Tap for fullscreen · Swipe to navigate" : undefined}
      >
        {/* Render current ±2 slides; hidden ones are pre-loaded but invisible */}
        {slides.map((slide, idx) => {
          const distance = Math.abs(idx - current);
          if (distance > 2) return null;
          return (
            <div
              key={idx}
              className="absolute inset-0 flex items-center justify-center transition-opacity duration-150"
              style={{
                opacity: idx === current ? 1 : 0,
                pointerEvents: idx === current ? "auto" : "none",
                zIndex: idx === current ? 1 : 0,
              }}
            >
              <SlideImg src={slide.medium} alt={`Slide ${idx + 1}`} priority={idx === current} />
            </div>
          );
        })}

        {/* Fullscreen hint — always visible at low opacity on mobile */}
        {!fullscreen && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 border border-white/10 text-white/50 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-[10px] font-medium">
              <Maximize2 className="w-3 h-3" />
              <span>Tap · Swipe to navigate</span>
            </div>
          </div>
        )}

        {/* Prev — 44px */}
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          disabled={current === 0}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 min-w-[44px] min-h-[44px] rounded-full bg-black/60 border border-white/15 flex items-center justify-center text-white/70 hover:text-white hover:border-white/40 disabled:opacity-20 transition-all"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        {/* Next — 44px */}
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          disabled={current === slides.length - 1}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 min-w-[44px] min-h-[44px] rounded-full bg-black/60 border border-white/15 flex items-center justify-center text-white/70 hover:text-white hover:border-white/40 disabled:opacity-20 transition-all"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Thumbnail strip — fade hint at right edge indicates more content */}
      {slides.length > 1 && (
        <div className="relative bg-ink/80 border-t border-border/50 flex-shrink-0">
          {/* Fade overlay at right edge */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-ink/80 to-transparent z-10" aria-hidden />
        <div ref={stripRef} className="pl-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
          {slides.map((slide, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === current ? "true" : undefined}
              className={`flex-shrink-0 w-20 h-11 rounded border overflow-hidden transition-all ${
                i === current
                  ? "border-gold ring-1 ring-gold/30"
                  : "border-border/50 opacity-50 hover:opacity-100"
              }`}
            >
              <img src={slide.thumb} alt={`Slide ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
          <div className="flex-shrink-0 w-8" aria-hidden />
        </div>
        </div>
      )}
    </div>
  );
}
