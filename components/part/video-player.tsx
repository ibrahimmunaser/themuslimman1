"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, RotateCw, Gauge } from "lucide-react";

const VIDEO_PLAYBACK_SPEEDS = [0.75, 1, 1.25, 1.5, 2];
import { trackVideoProgress } from "@/app/actions/progress";

// Report at these percent thresholds (once each per mount).
// Starting at 10% (not 25%) means a user who watches 10–24% and returns will
// have their furthest position saved, so they can seek back to where they stopped.
const REPORT_THRESHOLDS = [10, 25, 50, 75, 85, 95, 100];

/**
 * Time segments (in seconds) that should be automatically muted for specific parts,
 * with an optional overlay audio file to play instead.
 * Add entries here if a video needs its audio replaced for a time range.
 */
const MUTED_SEGMENTS: Record<number, Array<{ start: number; end: number; overlayAudio?: string }>> = {
  // No active segments — add entries here as needed, e.g.:
  // 7: [{ start: 11, end: 17.4, overlayAudio: "/part7_audio.wav" }],
};

interface VideoPlayerProps {
  src?: string;
  title?: string;
  poster?: string;
  partNumber?: number;
  /** When true (free preview), skip progress tracking — user is not logged in */
  previewMode?: boolean;
  /** Server-fetched watch percent — initialises the max-watched high-water mark
   *  so users can seek within already-watched range on reload */
  initialVideoPercent?: number;
}

// Crop the intro: skip the first N seconds of every video.
// Part 7 has a longer intro; all others use the default.
function getVideoStartOffset(partNumber?: number): number {
  if (partNumber === 7) return 6;
  return 2;
}

export function VideoPlayer({ src, title, poster, partNumber, previewMode, initialVideoPercent }: VideoPlayerProps) {
  const videoRef        = useRef<HTMLVideoElement>(null);
  const overlayAudioRef = useRef<HTMLAudioElement | null>(null);
  const reportedRef     = useRef<Set<number>>(new Set());
  const startOffset     = getVideoStartOffset(partNumber);
  // High-water mark of the furthest position watched (0–100). Prevents
  // forward-seeking beyond what the user has genuinely watched.
  // Tracks whether the player auto-muted due to a MUTED_SEGMENTS rule,
  // so we can restore audio without overriding a manual user mute.
  const autoMutedRef    = useRef<boolean>(false);
  // Track whether the overlay audio has been started for the current segment
  // pass-through, so we don't call .play() on every timeupdate tick.
  const overlayPlayingRef = useRef<boolean>(false);

  // Pre-create overlay audio elements on mount so they are ready to play
  // instantly (avoids browser autoplay blocking on dynamic Audio construction).
  useEffect(() => {
    if (!partNumber) return;
    const segments = MUTED_SEGMENTS[partNumber];
    if (!segments) return;
    const firstOverlay = segments.find((s) => s.overlayAudio)?.overlayAudio;
    if (!firstOverlay) return;

    const audio = new Audio(firstOverlay);
    audio.preload = "auto";
    overlayAudioRef.current = audio;

    return () => {
      audio.pause();
      overlayAudioRef.current = null;
    };
  }, [partNumber]);

  // Pause video when audio starts playing elsewhere on the page
  useEffect(() => {
    const handler = () => {
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    };
    window.addEventListener("seerah:audioPlaying", handler);
    return () => window.removeEventListener("seerah:audioPlaying", handler);
  }, []);

  const [started,      setStarted]      = useState(false);
  const [playing,      setPlaying]      = useState(false);
  const [muted,        setMuted]        = useState(false);
  const [volume,       setVolume]       = useState(0.5);
  const [progress,     setProgress]     = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close speed menu on outside click
  useEffect(() => {
    if (!showSpeedMenu) return;
    const handler = () => setShowSpeedMenu(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showSpeedMenu]);

  const changePlaybackRate = (rate: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  };

  const showControlsTemporarily = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setControlsVisible(false), 3000);
  }, []);

  const handleVideoTap = useCallback(() => {
    if (!started) return; // pre-play overlay handles this
    showControlsTemporarily();
  }, [started, showControlsTemporarily]);

  // Must be declared before any early return to satisfy the Rules of Hooks.
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    const currentTime = videoRef.current.currentTime;

    // Snap back if video somehow drifts before the intro cutoff.
    if (currentTime < startOffset) {
      videoRef.current.currentTime = startOffset;
      return;
    }

    // Progress is relative to the cropped range [startOffset, duration].
    const playable = videoRef.current.duration - startOffset;
    const elapsed  = currentTime - startOffset;
    const pct = playable > 0 ? (elapsed / playable) * 100 : 0;
    const rounded = isNaN(pct) ? 0 : Math.min(100, Math.round(pct));
    setProgress(rounded);


    // ── Auto-mute + overlay audio for defined segments ───────────────────────
    if (partNumber) {
      const segments = MUTED_SEGMENTS[partNumber];
      if (segments) {
        const activeSegment = segments.find(
          (s) => currentTime >= s.start && currentTime <= s.end
        );

        if (activeSegment) {
          // Mute the video track
          if (!videoRef.current.muted) {
            videoRef.current.muted = true;
            autoMutedRef.current = true;
            setMuted(true);
          }

          // Play overlay audio once per segment entry (not on every tick)
          if (activeSegment.overlayAudio && !overlayPlayingRef.current && overlayAudioRef.current) {
            overlayAudioRef.current.volume = videoRef.current.volume || 0.5;
            overlayAudioRef.current.currentTime = 0;
            overlayAudioRef.current.play().catch(() => {});
            overlayPlayingRef.current = true;
          }
        } else {
          // Outside all segments — restore video audio if we auto-muted it
          if (autoMutedRef.current) {
            videoRef.current.muted = false;
            autoMutedRef.current = false;
            setMuted(false);
          }

          // Stop overlay audio and reset the flag so it plays again next entry
          if (overlayPlayingRef.current && overlayAudioRef.current) {
            overlayAudioRef.current.pause();
            overlayPlayingRef.current = false;
          }
        }
      }
    }

    // Report to server at each threshold (once per session)
    if (partNumber && !previewMode) {
      for (const threshold of REPORT_THRESHOLDS) {
        if (rounded >= threshold && !reportedRef.current.has(threshold)) {
          reportedRef.current.add(threshold);
          trackVideoProgress(partNumber, rounded).catch(() => {});
          // Update progress badge in real-time without a page refresh
          window.dispatchEvent(new CustomEvent("seerah:progressUpdate", {
            detail: { videoWatchPercent: rounded },
          }));
        }
      }
    }
  }, [partNumber, previewMode]);

  if (!src) {
    return (
      <div className="aspect-video rounded-2xl bg-surface border border-border flex flex-col items-center justify-center gap-3">
        <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
          <Play className="w-7 h-7 text-gold/60 ml-1" />
        </div>
        <div className="text-center">
          <p className="text-text-secondary text-sm font-medium">No video for this part</p>
          <p className="text-text-muted text-xs mt-1">This content will be available shortly</p>
        </div>
      </div>
    );
  }

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      // Guard: never start before the intro cutoff.
      if (videoRef.current.currentTime < startOffset) {
        videoRef.current.currentTime = startOffset;
      }
      videoRef.current.play();
      setStarted(true);
    }
    setPlaying(!playing);
  };

  const seekToClientX = (clientX: number, rect: DOMRect) => {
    if (!videoRef.current) return;
    const duration = videoRef.current.duration;
    if (!isFinite(duration) || duration <= 0) return;
    const clickedPct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    // Map 0–100% of the seek bar to [startOffset, duration].
    videoRef.current.currentTime = startOffset + clickedPct * (duration - startOffset);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    seekToClientX(e.clientX, e.currentTarget.getBoundingClientRect());
  };

  const handleSeekTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    // Prevent page scroll while scrubbing the seek bar on mobile
    e.preventDefault();
    const touch = e.touches[0] ?? e.changedTouches[0];
    if (!touch) return;
    seekToClientX(touch.clientX, e.currentTarget.getBoundingClientRect());
    showControlsTemporarily();
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    // Clear auto-mute flag whenever the user manually changes mute state
    autoMutedRef.current = false;
    if (muted) {
      // Unmute: restore volume (or set to 50% if it was 0)
      const newVolume = volume === 0 ? 0.5 : volume;
      videoRef.current.volume = newVolume;
      videoRef.current.muted = false;
      setVolume(newVolume);
      setMuted(false);
    } else {
      // Mute
      videoRef.current.muted = true;
      setMuted(true);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (!videoRef.current) return;
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
    videoRef.current.volume = clampedVolume;
    if (overlayAudioRef.current) overlayAudioRef.current.volume = clampedVolume;
    if (clampedVolume === 0) {
      setMuted(true);
      videoRef.current.muted = true;
    } else if (muted) {
      setMuted(false);
      videoRef.current.muted = false;
    }
  };

  if (videoError) {
    return (
      <div className="aspect-video rounded-2xl bg-surface border border-border flex flex-col items-center justify-center gap-3 px-4 text-center">
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <Play className="w-6 h-6 text-red-400/60 ml-0.5" />
        </div>
        <div>
          <p className="text-text-secondary text-sm font-medium">Video unavailable</p>
          <p className="text-text-muted text-xs mt-1">Try refreshing the page or check your connection</p>
        </div>
        <button
          onClick={() => setVideoError(false)}
          className="mt-1 px-4 py-2 rounded-lg bg-surface-raised border border-border text-sm text-text-secondary hover:text-text hover:border-gold/30 transition-colors min-h-[44px]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-black relative group">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        preload="none"
        playsInline
        className="w-full aspect-video"
        onClick={handleVideoTap}
        onTouchEnd={handleVideoTap}
        onLoadedMetadata={() => {
          const vid = videoRef.current;
          if (!vid) return;
          vid.volume = volume;
          // Jump past the intro as soon as metadata is available.
          if (vid.currentTime < startOffset) vid.currentTime = startOffset;
        }}
        onTimeUpdate={handleTimeUpdate}
        onError={() => setVideoError(true)}
        onSeeking={() => {
          // Seeking is unrestricted — users can jump to any position freely.
        }}
        onPause={() => {
          setPlaying(false);
          // Pause overlay audio in sync with the video
          if (overlayAudioRef.current) {
            overlayAudioRef.current.pause();
          }
        }}
        onSeeked={() => {
          // When the user seeks, stop any overlay audio — handleTimeUpdate will
          // restart it if the new position falls inside a segment.
          if (overlayAudioRef.current) {
            overlayAudioRef.current.pause();
          }
          overlayPlayingRef.current = false;
        }}
        onEnded={() => {
          setPlaying(false);
          setStarted(false);
          if (overlayAudioRef.current) {
            overlayAudioRef.current.pause();
          }
          overlayPlayingRef.current = false;
          if (partNumber && !previewMode) {
            if (!reportedRef.current.has(100)) {
              reportedRef.current.add(100);
              trackVideoProgress(partNumber, 100).catch(() => {});
            }
            // Always fire the badge update on end (covers skipping to the end)
            window.dispatchEvent(new CustomEvent("seerah:progressUpdate", {
              detail: { videoWatchPercent: 100 },
            }));
          }
        }}
        onPlay={() => { setPlaying(true); window.dispatchEvent(new CustomEvent("seerah:videoPlaying")); }}
        title={title}
      />

      {/* Pre-play overlay */}
      {!started && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/30"
        >
          <div className="w-20 h-20 rounded-full bg-gold/20 border-2 border-gold/50 backdrop-blur-sm flex items-center justify-center hover:bg-gold/30 hover:scale-105 transition-all duration-200 shadow-2xl shadow-black/50">
            <Play className="w-9 h-9 text-gold ml-1.5" />
          </div>
          {title && (
            <p className="text-white/80 text-sm font-medium max-w-xs text-center px-4 drop-shadow">
              {title}
            </p>
          )}
        </button>
      )}

      {/* Controls — visible on hover (desktop) or tap (mobile) */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 transition-all duration-200 ${
          started ? (controlsVisible ? "opacity-100" : "opacity-0 group-hover:opacity-100") : "opacity-0"
        }`}
        onTouchStart={showControlsTemporarily}
        onMouseMove={showControlsTemporarily}
      >
        {/* Seek bar — tall invisible hit area wraps the thin visual bar; touch-action:none prevents
            page scroll during scrubbing so the touchmove handler fires correctly */}
        <div
          className="relative w-full h-8 flex items-center mb-1 cursor-pointer touch-none"
          onClick={handleSeek}
          onTouchStart={handleSeekTouch}
          onTouchMove={handleSeekTouch}
          aria-label="Video progress"
        >
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-white/25 rounded-full">
            <div
              className="h-1 bg-gold rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Play/Pause — 44px */}
          <button
            onClick={togglePlay}
            className="min-w-[44px] min-h-[44px] rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing
              ? <Pause className="w-5 h-5 text-white" />
              : <Play  className="w-5 h-5 text-white ml-0.5" />
            }
          </button>

          {/* Rewind 10s — 44px */}
          <button
            onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.max(startOffset, videoRef.current.currentTime - 10); }}
            className="relative min-w-[44px] min-h-[44px] flex items-center justify-center text-white/70 hover:text-white transition-colors"
            aria-label="Rewind 10 seconds"
          >
            <RotateCcw className="w-5 h-5" />
            <span className="absolute text-[7px] font-bold leading-none" aria-hidden>10</span>
          </button>

          {/* Forward 10s */}
          <button
            onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 10); }}
            className="relative min-w-[44px] min-h-[44px] flex items-center justify-center text-white/70 hover:text-white transition-colors"
            aria-label="Forward 10 seconds"
          >
            <RotateCw className="w-5 h-5" />
            <span className="absolute text-[7px] font-bold leading-none" aria-hidden>10</span>
          </button>

          <div className="relative flex items-center gap-1">
            {/* Mute toggle — single tap on mobile; on desktop also toggles slider.
                onDoubleClick is removed because it does not fire reliably on iOS Safari. */}
            <button
              onClick={toggleMute}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white/70 hover:text-white transition-colors"
              aria-label={muted || volume === 0 ? "Unmute" : "Mute"}
            >
              {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Volume slider — desktop hover only (hidden on mobile).
                Hardware volume buttons handle audio level on phones. */}
            <div className="hidden sm:flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={muted ? 0 : volume * 100}
                onChange={(e) => handleVolumeChange(parseInt(e.target.value) / 100)}
                className="w-16 h-1 appearance-none bg-white/25 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-gold [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                style={{
                  background: `linear-gradient(to right, rgb(212, 175, 55) 0%, rgb(212, 175, 55) ${muted ? 0 : volume * 100}%, rgba(255, 255, 255, 0.25) ${muted ? 0 : volume * 100}%, rgba(255, 255, 255, 0.25) 100%)`
                }}
                aria-label="Volume"
              />
            </div>
          </div>

          <div className="flex-1" />

          {/* Playback speed */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(!showSpeedMenu); showControlsTemporarily(); }}
              className="flex items-center gap-1 px-2 min-h-[44px] text-white/70 hover:text-white transition-colors"
              aria-label={`Playback speed: ${playbackRate}x`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold tabular-nums">{playbackRate}x</span>
            </button>
            {showSpeedMenu && (
              <div className="absolute right-0 bottom-full mb-1 py-1 rounded-lg bg-black/90 border border-white/10 shadow-xl z-20 min-w-[72px]">
                {VIDEO_PLAYBACK_SPEEDS.map((speed) => (
                  <button
                    key={speed}
                    onClick={() => changePlaybackRate(speed)}
                    className={`w-full px-3 min-h-[40px] flex items-center text-sm transition-colors ${
                      playbackRate === speed
                        ? "bg-gold/20 text-gold font-semibold"
                        : "text-white/80 hover:bg-white/10"
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fullscreen — 44px; iOS Safari requires webkitEnterFullscreen on the <video> element */}
          <button
            onClick={() => {
              const vid = videoRef.current;
              if (!vid) return;
              if (vid.requestFullscreen) {
                vid.requestFullscreen();
              } else if ((vid as HTMLVideoElement & { webkitEnterFullscreen?: () => void }).webkitEnterFullscreen) {
                (vid as HTMLVideoElement & { webkitEnterFullscreen: () => void }).webkitEnterFullscreen();
              }
            }}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white/70 hover:text-white transition-colors"
            aria-label="Fullscreen"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
