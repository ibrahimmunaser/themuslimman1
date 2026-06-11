"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Volume2, VolumeX, RefreshCw } from "lucide-react";

interface R2VideoPlayerProps {
  url: string;
  title?: string;
  /** Short label shown on the thumbnail */
  label?: string;
  /** Auto-play when video comes into view (muted initially for browser compliance) */
  autoplay?: boolean;
}

export function R2VideoPlayer({
  url,
  title = "Video",
  label,
  autoplay = false,
}: R2VideoPlayerProps) {
  const [playing, setPlaying]   = useState(false);
  const [muted, setMuted]       = useState(true);
  const [errored, setErrored]   = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const videoRef    = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Autoplay when ≥50% visible (muted to comply with browser policies)
  useEffect(() => {
    if (!autoplay || !containerRef.current) return;

    // Respect users who prefer reduced data (e.g. mobile data-saver)
    const connection = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
    if (connection?.saveData) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !playing) {
            setPlaying(true);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [autoplay, playing]);

  // Start playback once the <video> element mounts
  useEffect(() => {
    if (playing && videoRef.current && autoplay) {
      videoRef.current.play().catch(() => {
        // Browser blocked autoplay — user must click play manually; that's fine
      });
    }
  }, [playing, autoplay, retryKey]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  const handleRetry = () => {
    setErrored(false);
    setPlaying(true);
    setRetryKey((k) => k + 1);
  };

  // ── Playing state ──────────────────────────────────────────────────────────
  if (playing) {
    if (errored) {
      return (
        <div
          ref={containerRef}
          className="relative w-full aspect-video rounded-2xl overflow-hidden border border-zinc-700/40 shadow-2xl shadow-black/60 bg-zinc-900 flex flex-col items-center justify-center gap-4"
        >
          <p className="text-sm text-zinc-400">Video failed to load.</p>
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold/90 hover:bg-gold text-ink font-bold text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className="relative w-full aspect-video rounded-2xl overflow-hidden border border-zinc-700/40 shadow-2xl shadow-black/60 bg-zinc-900"
      >
        <video
          key={retryKey}
          ref={videoRef}
          className="absolute inset-0 w-full h-full"
          controls
          playsInline
          preload="auto"
          muted={muted}
          title={title}
          onError={() => setErrored(true)}
        >
          <source src={url} type="video/mp4" />
        </video>

        {muted ? (
          <button
            onClick={toggleMute}
            className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-2 rounded-lg bg-black/70 hover:bg-black/90 text-white text-sm font-medium transition-colors backdrop-blur-sm border border-white/10"
            aria-label="Unmute video"
          >
            <VolumeX className="w-4 h-4" />
            <span className="hidden sm:inline">Tap to unmute</span>
          </button>
        ) : (
          <button
            onClick={toggleMute}
            className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-2 rounded-lg bg-black/50 hover:bg-black/70 text-white text-sm transition-colors backdrop-blur-sm"
            aria-label="Mute video"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  // ── Thumbnail / play state ─────────────────────────────────────────────────
  return (
    <button
      ref={containerRef}
      onClick={() => setPlaying(true)}
      className="group relative w-full aspect-video rounded-2xl overflow-hidden border border-zinc-700/40 shadow-2xl shadow-black/60 cursor-pointer bg-zinc-950"
      aria-label={`Play: ${title}`}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.4) 100%), linear-gradient(135deg, #1a1510 0%, #0f0d0a 50%, #1a1208 100%)",
        }}
      />

      {label && (
        <div className="absolute top-6 left-6 right-6 pointer-events-none">
          <p className="text-white text-lg sm:text-xl font-semibold drop-shadow-lg">{label}</p>
        </div>
      )}

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gold/95 group-hover:bg-gold flex items-center justify-center shadow-2xl shadow-gold/50 group-hover:scale-105 transition-all duration-200">
          <Play className="w-9 h-9 sm:w-11 sm:h-11 text-ink fill-ink ml-1" />
        </div>
      </div>
    </button>
  );
}
