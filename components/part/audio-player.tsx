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
  /** Forward button is hidden until the video for this part has been fully watched */
  videoCompleted?: boolean;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const PLAYBACK_SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];

export function AudioPlayer({ src, title, partNumber, compact = false, previewMode = false, videoCompleted = false }: AudioPlayerProps) {
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
      window.dispatchEvent(new CustomEvent("seerah:progressUpdate", { detail: { openedAssets: ["audio"] } }));
      setHasTrackedPlay(true);
    }
  }, [playing, hasTrackedPlay, partNumber, previewMode]);

  // Pause audio when video starts playing elsewhere on the page
  useEffect(() => {
    const handler = () => {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
    };
    window.addEventListener("seerah:videoPlaying", handler);
    return () => window.removeEventListener("seerah:videoPlaying", handler);
  }, []);

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
    const x = Math.max(0, e.clientX - rect.left);
    const pct = x / rect.width;
    const target = pct * audioRef.current.duration;
    // Block forward seeking until the video has been fully watched.
    if (!videoCompleted && target > audioRef.current.currentTime) return;
    audioRef.current.currentTime = target;
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
    <div className={compact
      ? "px-3 py-2.5 rounded-xl border border-border/40 bg-surface/80"
      : "p-4 rounded-2xl border border-border bg-surface"
    }>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setPlaying(false)}
        onPlay={() => { setPlaying(true); window.dispatchEvent(new CustomEvent("seerah:audioPlaying")); }}
        onPause={() => setPlaying(false)}
      />

      {/* Track info row */}
      <div className="flex items-center gap-2.5 mb-2">
        <div className={`rounded-lg bg-gold/8 flex items-center justify-center flex-shrink-0 ${compact ? "w-7 h-7" : "w-9 h-9"}`}>
          <Headphones className={`text-gold/80 ${compact ? "w-3 h-3" : "w-4 h-4"}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`font-medium text-text truncate leading-tight ${compact ? "text-xs" : "text-sm"}`}>
            {title || `Part ${partNumber} — Audio`}
          </p>
          {!compact && <p className="text-[11px] text-text-muted leading-none mt-0.5">Audio Version</p>}
        </div>
        <div className="flex items-center gap-1.5">
          {/* Playback speed */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(!showSpeedMenu); }}
              className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-surface-raised hover:bg-surface-high transition-colors min-h-[44px]"
              aria-label={`Playback speed: ${playbackRate}x`}
            >
              <Gauge className="w-3 h-3 text-text-muted/70" />
              <span className="text-[11px] text-text-muted font-medium">{playbackRate}x</span>
            </button>
            {showSpeedMenu && (
              <div className="absolute right-0 top-full mt-1 py-1 rounded-lg bg-surface border border-border shadow-lg z-10 min-w-[80px]" style={{ maxWidth: "calc(100vw - 1rem)" }}>
                {PLAYBACK_SPEEDS.map((speed) => (
                  <button
                    key={speed}
                    onClick={() => changePlaybackRate(speed)}
                    className={`w-full px-3 min-h-[44px] flex items-center text-sm text-left transition-colors ${
                      playbackRate === speed ? "bg-gold/10 text-gold font-medium" : "text-text-secondary hover:bg-surface-raised"
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
            onClick={() => { if (!audioRef.current) return; audioRef.current.muted = !muted; setMuted(!muted); }}
            className="text-text-muted/60 hover:text-text-secondary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Seek bar — tall invisible hit area */}
      <div
        className="relative w-full h-6 flex items-center mb-0.5 cursor-pointer"
        onClick={handleSeek}
        role="slider"
        aria-label="Audio seek"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (!audioRef.current) return;
          if (e.key === "ArrowRight" && videoCompleted) audioRef.current.currentTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + 5);
          if (e.key === "ArrowLeft") audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
        }}
      >
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-surface-raised rounded-full">
          <div className="bg-gold rounded-full transition-all relative h-1" style={{ width: `${progress}%` }}>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-gold opacity-0 group-hover/bar:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>

      {/* Time */}
      <div className="flex justify-between text-[10px] text-text-muted/70 mb-2">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Controls — all min 44px */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => skip(-10)}
          className="flex flex-col items-center text-text-muted/60 hover:text-text-secondary transition-colors min-h-[44px] min-w-[44px] justify-center"
          aria-label="Rewind 10 seconds"
        >
          <SkipBack className="w-4 h-4" />
          <span className="text-[9px] mt-0.5 leading-none" aria-hidden>−10s</span>
        </button>

        <button
          onClick={togglePlay}
          className={`rounded-full bg-gold text-ink hover:bg-gold-light transition-colors flex items-center justify-center shadow-md shadow-gold/15 min-h-[44px] min-w-[44px] ${compact ? "w-11 h-11" : "w-12 h-12"}`}
          aria-label={playing ? "Pause audio" : "Play audio"}
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        {/* Forward is hidden until the video has been fully watched */}
        {videoCompleted ? (
          <button
            onClick={() => skip(10)}
            className="flex flex-col items-center text-text-muted/60 hover:text-text-secondary transition-colors min-h-[44px] min-w-[44px] justify-center"
            aria-label="Forward 10 seconds"
          >
            <SkipForward className="w-4 h-4" />
            <span className="text-[9px] mt-0.5 leading-none" aria-hidden>+10s</span>
          </button>
        ) : (
          <div className="min-h-[44px] min-w-[44px]" />
        )}
      </div>
    </div>
  );
}
