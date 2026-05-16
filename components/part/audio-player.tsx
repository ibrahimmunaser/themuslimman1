"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Headphones, Gauge } from "lucide-react";
import { trackAssetOpened } from "@/app/actions/progress";

interface AudioPlayerProps {
  src?: string;
  title?: string;
  partNumber?: number;
  compact?: boolean;
  previewMode?: boolean;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const PLAYBACK_SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];

export function AudioPlayer({ src, title, partNumber, compact = false, previewMode = false }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [hasTrackedPlay, setHasTrackedPlay] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onLoaded = () => setDuration(audio.duration);
    audio.addEventListener("loadedmetadata", onLoaded);
    return () => audio.removeEventListener("loadedmetadata", onLoaded);
  }, []);

  // Track when audio starts playing for the first time
  useEffect(() => {
    if (playing && !hasTrackedPlay && partNumber && !previewMode) {
      trackAssetOpened(partNumber, "audio").catch(() => {});
      setHasTrackedPlay(true);
    }
  }, [playing, hasTrackedPlay, partNumber, previewMode]);

  // Close speed menu when clicking outside
  useEffect(() => {
    if (!showSpeedMenu) return;
    const handleClick = () => setShowSpeedMenu(false);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [showSpeedMenu]);

  if (!src) {
    return (
      <div className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-surface/50">
        <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
          <Headphones className="w-4 h-4 text-gold/50" />
        </div>
        <div>
          <p className="text-sm font-medium text-text-secondary">No audio for this part</p>
          <p className="text-xs text-text-muted mt-0.5">Audio version will be available shortly</p>
        </div>
      </div>
    );
  }

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
    const pct = (audioRef.current.currentTime / audioRef.current.duration) * 100;
    setProgress(isNaN(pct) ? 0 : pct);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    audioRef.current.currentTime = pct * audioRef.current.duration;
  };

  const skip = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime + seconds);
  };

  const changePlaybackRate = (rate: number) => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  };

  return (
    <div className={compact ? "p-4 rounded-xl border border-border/50 bg-surface" : "p-5 rounded-2xl border border-border bg-surface"}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      {/* Track info */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0 ${compact ? "w-8 h-8" : "w-10 h-10"}`}>
          <Headphones className={`text-gold ${compact ? "w-3.5 h-3.5" : "w-4 h-4"}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`font-medium text-text truncate ${compact ? "text-xs" : "text-sm"}`}>
            {title || `Part ${partNumber} — Audio`}
          </p>
          {!compact && <p className="text-xs text-text-muted">Audio Version</p>}
        </div>
        <div className="flex items-center gap-2">
          {/* Playback speed */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSpeedMenu(!showSpeedMenu);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-raised hover:bg-surface-high border border-border/50 transition-colors"
              title="Playback speed"
            >
              <Gauge className="w-3 h-3 text-text-muted" />
              <span className="text-xs text-text-secondary font-medium">{playbackRate}x</span>
            </button>
            {showSpeedMenu && (
              <div className="absolute right-0 top-full mt-1 py-1 rounded-lg bg-surface border border-border shadow-lg z-10 min-w-[80px]">
                {PLAYBACK_SPEEDS.map((speed) => (
                  <button
                    key={speed}
                    onClick={() => changePlaybackRate(speed)}
                    className={`w-full px-3 py-1.5 text-xs text-left transition-colors ${
                      playbackRate === speed
                        ? "bg-gold/10 text-gold font-medium"
                        : "text-text-secondary hover:bg-surface-raised"
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Volume */}
          <button
            onClick={() => {
              if (!audioRef.current) return;
              audioRef.current.muted = !muted;
              setMuted(!muted);
            }}
            className="text-text-muted hover:text-text-secondary transition-colors"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className={`w-full bg-surface-raised rounded-full mb-2 cursor-pointer group/bar ${compact ? "h-1" : "h-1.5"}`}
        onClick={handleSeek}
      >
        <div
          className={`bg-gold rounded-full transition-all relative ${compact ? "h-1" : "h-1.5"}`}
          style={{ width: `${progress}%` }}
        >
          <div className={`absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-gold opacity-0 group-hover/bar:opacity-100 transition-opacity ${compact ? "w-2.5 h-2.5" : "w-3 h-3"}`} />
        </div>
      </div>

      {/* Time */}
      <div className="flex justify-between text-xs text-text-muted mb-3">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => skip(-15)}
          className="flex flex-col items-center text-text-muted hover:text-text-secondary transition-colors group"
          title="Back 15s"
        >
          <SkipBack className={compact ? "w-4 h-4" : "w-5 h-5"} />
          <span className="text-[10px] mt-0.5 opacity-70 group-hover:opacity-100">-15s</span>
        </button>

        <button
          onClick={togglePlay}
          className={`rounded-full bg-gold text-ink hover:bg-gold-light transition-colors flex items-center justify-center shadow-lg shadow-gold/20 ${compact ? "w-10 h-10" : "w-12 h-12"}`}
        >
          {playing ? (
            <Pause className={compact ? "w-4 h-4" : "w-5 h-5"} />
          ) : (
            <Play className={`${compact ? "w-4 h-4 ml-0.5" : "w-5 h-5 ml-0.5"}`} />
          )}
        </button>

        <button
          onClick={() => skip(15)}
          className="flex flex-col items-center text-text-muted hover:text-text-secondary transition-colors group"
          title="Forward 15s"
        >
          <SkipForward className={compact ? "w-4 h-4" : "w-5 h-5"} />
          <span className="text-[10px] mt-0.5 opacity-70 group-hover:opacity-100">+15s</span>
        </button>
      </div>
    </div>
  );
}
