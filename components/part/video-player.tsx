"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, RotateCw } from "lucide-react";
import { trackVideoProgress } from "@/app/actions/progress";

// Report at these percent thresholds (once each per mount)
const REPORT_THRESHOLDS = [25, 50, 75, 85, 95, 100];

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

export function VideoPlayer({ src, title, poster, partNumber, previewMode, initialVideoPercent }: VideoPlayerProps) {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const reportedRef = useRef<Set<number>>(new Set());
  // High-water mark of the furthest position watched (0–100). Prevents
  // forward-seeking beyond what the user has genuinely watched.
  const maxWatchedRef = useRef<number>(initialVideoPercent ?? 0);

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

  const [started,  setStarted]  = useState(false);
  const [playing,  setPlaying]  = useState(false);
  const [muted,    setMuted]    = useState(false);
  const [volume,   setVolume]   = useState(0.5);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [progress, setProgress] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [videoError, setVideoError] = useState(false);
  // Once 85 % of the video has been watched the seeking lock is lifted and the
  // forward-10s button is restored so users can re-watch freely.
  const [videoFullyWatched, setVideoFullyWatched] = useState(() => (initialVideoPercent ?? 0) >= 85);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    const rounded = isNaN(pct) ? 0 : Math.round(pct);
    setProgress(rounded);

    // Advance the high-water mark as the user watches further
    maxWatchedRef.current = Math.max(maxWatchedRef.current, rounded);

    // Lift the seek restriction once 85 % is genuinely reached
    if (maxWatchedRef.current >= 85) setVideoFullyWatched(true);

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
      videoRef.current.play();
      setStarted(true);
    }
    setPlaying(!playing);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const duration = videoRef.current.duration;
    // duration is NaN until metadata loads and Infinity on live streams — skip both
    if (!isFinite(duration) || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickedPct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    if (videoFullyWatched) {
      // Seek lock is lifted after the video is fully watched
      videoRef.current.currentTime = clickedPct * duration;
    } else {
      // Clamp to max watched — users cannot seek beyond where they have watched
      const maxPct = maxWatchedRef.current / 100;
      videoRef.current.currentTime = Math.min(clickedPct, maxPct) * duration;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
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
          if (videoRef.current) {
            videoRef.current.volume = volume;
          }
        }}
        onTimeUpdate={handleTimeUpdate}
        onError={() => setVideoError(true)}
        onSeeking={() => {
          // Once the video is fully watched, seeking is unrestricted.
          if (videoFullyWatched) return;
          // Catch native seeks (keyboard shortcuts, touch scrubbing) and clamp
          // them to the max-watched position so users cannot skip ahead.
          if (!videoRef.current) return;
          const duration = videoRef.current.duration;
          if (!isFinite(duration) || duration <= 0) return;
          const maxTime = (maxWatchedRef.current / 100) * duration;
          if (videoRef.current.currentTime > maxTime + 0.5) {
            videoRef.current.currentTime = maxTime;
          }
        }}
        onEnded={() => {
          setPlaying(false);
          setStarted(false);
          setVideoFullyWatched(true);
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
        onPause={() => setPlaying(false)}
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
        {/* Seek bar — tall invisible hit area wraps the thin visual bar */}
        <div
          className="relative w-full h-8 flex items-center mb-1 cursor-pointer"
          onClick={handleSeek}
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
            onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10); }}
            className="relative min-w-[44px] min-h-[44px] flex items-center justify-center text-white/70 hover:text-white transition-colors"
            aria-label="Rewind 10 seconds"
          >
            <RotateCcw className="w-5 h-5" />
            <span className="absolute text-[7px] font-bold leading-none" aria-hidden>10</span>
          </button>

          {/* Forward 10s — shown only after the video has been fully watched */}
          {videoFullyWatched && (
            <button
              onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 10); }}
              className="relative min-w-[44px] min-h-[44px] flex items-center justify-center text-white/70 hover:text-white transition-colors"
              aria-label="Forward 10 seconds"
            >
              <RotateCw className="w-5 h-5" />
              <span className="absolute text-[7px] font-bold leading-none" aria-hidden>10</span>
            </button>
          )}

          <div className="relative flex items-center gap-1">
            {/* Mute — 44px */}
            <button
              onClick={() => setShowVolumeSlider(!showVolumeSlider)}
              onDoubleClick={toggleMute}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white/70 hover:text-white transition-colors"
              aria-label={muted || volume === 0 ? "Unmute" : "Mute"}
            >
              {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            
            {/* Volume Slider - horizontal */}
            {showVolumeSlider && (
              <div className="flex items-center gap-2 bg-black/90 backdrop-blur-sm rounded-lg px-3 py-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={muted ? 0 : volume * 100}
                  onChange={(e) => handleVolumeChange(parseInt(e.target.value) / 100)}
                  className="w-20 h-1 appearance-none bg-white/25 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-gold [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, rgb(212, 175, 55) 0%, rgb(212, 175, 55) ${muted ? 0 : volume * 100}%, rgba(255, 255, 255, 0.25) ${muted ? 0 : volume * 100}%, rgba(255, 255, 255, 0.25) 100%)`
                  }}
                />
                <span className="text-white/70 text-xs font-medium w-8 text-right">{Math.round(muted ? 0 : volume * 100)}%</span>
              </div>
            )}
          </div>

          <div className="flex-1" />

          {/* Fullscreen — 44px */}
          <button
            onClick={() => videoRef.current?.requestFullscreen()}
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
