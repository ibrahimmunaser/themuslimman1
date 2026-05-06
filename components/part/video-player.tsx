"use client";

import { useState, useRef, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";
import { trackVideoProgress } from "@/app/actions/progress";

// Report at these percent thresholds (once each per mount)
const REPORT_THRESHOLDS = [25, 50, 75, 85, 95, 100];

interface VideoPlayerProps {
  src?: string;
  title?: string;
  poster?: string;
  partNumber?: number;
}

export function VideoPlayer({ src, title, poster, partNumber }: VideoPlayerProps) {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const reportedRef = useRef<Set<number>>(new Set());

  const [started,  setStarted]  = useState(false);
  const [playing,  setPlaying]  = useState(false);
  const [muted,    setMuted]    = useState(false);
  const [volume,   setVolume]   = useState(0.5); // Default 50%
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!src) {
    return (
      <div className="aspect-video rounded-2xl bg-surface border border-border flex flex-col items-center justify-center gap-3">
        <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
          <Play className="w-7 h-7 text-gold/60 ml-1" />
        </div>
        <div className="text-center">
          <p className="text-text-secondary text-sm font-medium">Video coming soon</p>
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

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    const rounded = isNaN(pct) ? 0 : Math.round(pct);
    setProgress(rounded);

    // Report to server at each threshold (once per session)
    if (partNumber) {
      for (const threshold of REPORT_THRESHOLDS) {
        if (rounded >= threshold && !reportedRef.current.has(threshold)) {
          reportedRef.current.add(threshold);
          // Fire-and-forget — don't block the UI
          trackVideoProgress(partNumber, rounded).catch(() => {});
        }
      }
    }
  }, [partNumber]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pct * videoRef.current.duration;
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

  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-black relative group">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        preload="none"
        className="w-full aspect-video"
        onLoadedMetadata={() => {
          if (videoRef.current) {
            videoRef.current.volume = volume;
          }
        }}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => {
          setPlaying(false);
          setStarted(false);
          // Report 100% on ended
          if (partNumber && !reportedRef.current.has(100)) {
            reportedRef.current.add(100);
            trackVideoProgress(partNumber, 100).catch(() => {});
          }
        }}
        onPlay={() => setPlaying(true)}
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

      {/* Controls */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 transition-all duration-200 ${
        started ? "opacity-0 group-hover:opacity-100" : "opacity-0"
      }`}>
        <div
          className="w-full h-1 bg-white/25 rounded-full mb-3 cursor-pointer"
          onClick={handleSeek}
        >
          <div
            className="h-1 bg-gold rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
          >
            {playing
              ? <Pause className="w-4 h-4 text-white" />
              : <Play  className="w-4 h-4 text-white ml-0.5" />
            }
          </button>

          <div className="relative flex items-center gap-2">
            <button 
              onClick={() => setShowVolumeSlider(!showVolumeSlider)} 
              onDoubleClick={toggleMute}
              className="text-white/70 hover:text-white transition-colors"
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

          <button
            onClick={() => videoRef.current?.requestFullscreen()}
            className="text-white/70 hover:text-white transition-colors"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
