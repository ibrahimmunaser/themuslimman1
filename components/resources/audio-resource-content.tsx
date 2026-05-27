"use client";

import { useState, useEffect } from "react";
import { PARTS } from "@/lib/content";
import { ERA_MAP } from "@/lib/types";
import { eraGradient } from "./era-gradient";
import { ResourcePageClient } from "./resource-page-client";
import { ArrowLeft, Headphones, CheckCircle2, Play, Pause, X, Volume2, VolumeX, SkipBack, SkipForward } from "lucide-react";
import Link from "next/link";
import { trackAssetOpened } from "@/app/actions/progress";

interface AudioResourceContentProps {
  progressMap: Record<number, boolean>;
  completedCount: number;
  thumbnails?: Record<number, string>;
}

export function AudioResourceContent({
  progressMap,
  completedCount,
  thumbnails = {},
}: AudioResourceContentProps) {
  const [mounted, setMounted] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<{ partNumber: number; title: string; subtitle?: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [volume, setVolume] = useState(1);
  const [localProgressMap, setLocalProgressMap] = useState(progressMap);
  const [localCompletedCount, setLocalCompletedCount] = useState(completedCount);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const totalResources = PARTS.length;
  const notCompletedCount = totalResources - localCompletedCount;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = "";
        audioElement.remove();
      }
    };
  }, [audioElement]);

  const filterByStatus = (part: any, status: string) => {
    const isCompleted = localProgressMap[part.partNumber] || false;
    if (status === "completed") return isCompleted;
    if (status === "not-started") return !isCompleted;
    return true;
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioElement) {
      audioElement.volume = newVolume;
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioElement || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    audioElement.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handlePrevious = () => {
    if (!currentAudio) return;
    const currentIndex = PARTS.findIndex(p => p.partNumber === currentAudio.partNumber);
    if (currentIndex > 0) {
      const prevPart = PARTS[currentIndex - 1];
      handlePlayAudio(prevPart.partNumber, prevPart.title, prevPart.subtitle);
    }
  };

  const handleNext = () => {
    if (!currentAudio) return;
    const currentIndex = PARTS.findIndex(p => p.partNumber === currentAudio.partNumber);
    if (currentIndex < PARTS.length - 1) {
      const nextPart = PARTS[currentIndex + 1];
      handlePlayAudio(nextPart.partNumber, nextPart.title, nextPart.subtitle);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayAudio = async (partNumber: number, title: string, subtitle?: string) => {
    // If clicking the same audio, toggle play/pause
    if (currentAudio?.partNumber === partNumber) {
      if (audioElement) {
        if (isPlaying) {
          audioElement.pause();
          setIsPlaying(false);
        } else {
          audioElement.play();
          setIsPlaying(true);
        }
      }
      return;
    }

    // Track asset opened and update local progress
    const wasAlreadyViewed = localProgressMap[partNumber];
    
    // Update local state immediately for better UX
    if (!wasAlreadyViewed) {
      setLocalProgressMap(prev => ({
        ...prev,
        [partNumber]: true
      }));
      setLocalCompletedCount(prev => prev + 1);
    }
    
    // Track in database (fire and forget)
    trackAssetOpened(partNumber, "audio").catch(err => {
      console.error("Failed to track asset:", err);
      // Revert local state if failed
      if (!wasAlreadyViewed) {
        setLocalProgressMap(prev => ({
          ...prev,
          [partNumber]: false
        }));
        setLocalCompletedCount(prev => prev - 1);
      }
    });

    // Load new audio
    try {
      const response = await fetch(`/api/part/${partNumber}/assets`);
      if (!response.ok) throw new Error("Failed to fetch audio");
      const data = await response.json();
      
      if (data.audioUrl) {
        // Clean up old audio
        if (audioElement) {
          audioElement.pause();
          audioElement.src = "";
        }

        // Create new audio element
        const audio = new Audio(data.audioUrl);
        audio.volume = volume;
        audio.addEventListener("play", () => setIsPlaying(true));
        audio.addEventListener("pause", () => setIsPlaying(false));
        audio.addEventListener("ended", () => {
          setIsPlaying(false);
          // Auto-play next track if available
          const currentIndex = PARTS.findIndex(p => p.partNumber === partNumber);
          if (currentIndex < PARTS.length - 1) {
            const nextPart = PARTS[currentIndex + 1];
            handlePlayAudio(nextPart.partNumber, nextPart.title, nextPart.subtitle);
          }
        });
        audio.addEventListener("timeupdate", () => {
          setCurrentTime(audio.currentTime);
        });
        audio.addEventListener("loadedmetadata", () => {
          setDuration(audio.duration);
        });
        
        setAudioElement(audio);
        setCurrentAudio({ partNumber, title, subtitle });
        audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error loading audio:", error);
    }
  };

  const handleClosePlayer = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.src = "";
    }
    setAudioElement(null);
    setCurrentAudio(null);
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero Section */}
      <div className="border-b border-zinc-800 bg-gradient-to-b from-zinc-900 to-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Headphones className="w-7 h-7 text-amber-500" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Listen on the Go</h1>
              <p className="text-zinc-400 mt-1">Audio-only versions of every lesson for studying on the go</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-1">Total</p>
              <p className="text-3xl font-bold text-white">{totalResources}</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-1">Listened</p>
              <p className={`text-3xl font-bold ${localCompletedCount > 0 ? "text-green-400" : "text-zinc-400"}`}>{localCompletedCount}</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-1">Not Listened</p>
              <p className="text-3xl font-bold text-zinc-400">{notCompletedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Audio Player at Bottom */}
      {mounted && currentAudio && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 to-amber-600 border-t-2 border-amber-400 shadow-2xl"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {/* Progress Bar */}
            <div className="mb-3">
              <div 
                className="w-full h-1 bg-black/20 rounded-full cursor-pointer relative group"
                onClick={handleSeek}
              >
                <div 
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`, transform: 'translate(-50%, -50%)' }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-white/80">{formatTime(currentTime)}</span>
                <span className="text-xs text-white/80">{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Previous Button */}
              {currentAudio && PARTS.findIndex(p => p.partNumber === currentAudio.partNumber) > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevious();
                  }}
                  className="w-10 h-10 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center transition-colors flex-shrink-0"
                  title="Previous track"
                >
                  <SkipBack className="w-5 h-5 text-white" />
                </button>
              )}

              {/* Play/Pause */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (audioElement) {
                    if (isPlaying) {
                      audioElement.pause();
                    } else {
                      audioElement.play();
                    }
                  }
                }}
                className="w-12 h-12 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center transition-colors flex-shrink-0"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-white" fill="white" />
                ) : (
                  <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                )}
              </button>

              {/* Next Button */}
              {currentAudio && PARTS.findIndex(p => p.partNumber === currentAudio.partNumber) < PARTS.length - 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="w-10 h-10 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center transition-colors flex-shrink-0"
                  title="Next track"
                >
                  <SkipForward className="w-5 h-5 text-white" />
                </button>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Volume2 className="w-4 h-4 text-white/90" />
                  <span className="text-xs font-medium text-white/90">Part {currentAudio.partNumber}</span>
                </div>
                <h3 className="text-base font-semibold text-white truncate">
                  {currentAudio.title}
                </h3>
                {currentAudio.subtitle && (
                  <p className="text-xs text-white/80 truncate">{currentAudio.subtitle}</p>
                )}
              </div>

              {/* Volume Control */}
              <div className="hidden md:flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVolumeChange(volume === 0 ? 1 : 0);
                  }}
                  className="w-8 h-8 rounded-lg hover:bg-black/20 flex items-center justify-center transition-colors"
                >
                  {volume === 0 ? (
                    <VolumeX className="w-5 h-5 text-white" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-white" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-24 h-1 bg-black/20 rounded-lg appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-3
                    [&::-webkit-slider-thumb]:h-3
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-white
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:shadow-lg
                    [&::-moz-range-thumb]:w-3
                    [&::-moz-range-thumb]:h-3
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-white
                    [&::-moz-range-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:border-0
                    [&::-moz-range-thumb]:shadow-lg"
                  style={{
                    background: `linear-gradient(to right, white ${volume * 100}%, rgba(0,0,0,0.2) ${volume * 100}%)`
                  }}
                />
              </div>

              {/* Close */}
              <button
                onClick={handleClosePlayer}
                className="w-10 h-10 rounded-lg hover:bg-black/20 flex items-center justify-center transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ paddingBottom: mounted && currentAudio ? '8rem' : '2rem' }}>
        <ResourcePageClient
          showStatusFilter
          filterByStatus={filterByStatus}
        >
          {(parts) => (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {parts.map((part) => {
                const isCompleted = localProgressMap[part.partNumber] || false;
                const isCurrentlyPlaying = currentAudio?.partNumber === part.partNumber && isPlaying;

                return (
                  <div
                    key={part.id}
                    onClick={() => handlePlayAudio(part.partNumber, part.title, part.subtitle)}
                    className={`group cursor-pointer rounded-xl border transition-all overflow-hidden ${
                      currentAudio?.partNumber === part.partNumber
                        ? "border-amber-500 bg-amber-500/5"
                        : "border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-amber-500/30"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div
                      className="aspect-video relative flex items-center justify-center overflow-hidden"
                      style={eraGradient(part.era)}
                    >
                      {thumbnails[part.partNumber] && (
                        <img
                          src={thumbnails[part.partNumber]}
                          alt=""
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500"
                          onLoad={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "1"; }}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                      )}
                      {/* Large part number watermark */}
                      <span className="absolute inset-0 flex items-center justify-center opacity-[0.12] text-[5rem] font-black text-white select-none pointer-events-none leading-none">
                        {part.partNumber}
                      </span>
                      {/* Era label */}
                      <span className="absolute bottom-8 left-0 right-0 text-center text-[10px] font-semibold uppercase tracking-widest text-white/40 select-none">
                        {ERA_MAP[part.era as keyof typeof ERA_MAP]?.label ?? part.era}
                      </span>

                      {isCompleted && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500/30 border border-green-500/50 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        </div>
                      )}
                      {isCurrentlyPlaying && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/40 border border-white/20 text-white text-xs font-medium">
                          Playing
                        </div>
                      )}

                      <div className={`relative z-10 w-14 h-14 rounded-full border flex items-center justify-center transition-all ${
                        currentAudio?.partNumber === part.partNumber
                          ? "bg-white/20 border-white/40"
                          : "bg-black/40 border-white/25 group-hover:bg-white/20 group-hover:border-white/40"
                      }`}>
                        {isCurrentlyPlaying ? (
                          <Volume2 className="w-6 h-6 text-white" />
                        ) : (
                          <Headphones className="w-6 h-6 text-white" />
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-amber-500">Part {part.partNumber}</span>
                        {isCompleted && (
                          <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium rounded">
                            Listened
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2 group-hover:text-amber-400 transition-colors">
                        {part.title}
                      </h3>
                      {part.subtitle && (
                        <p className="text-xs text-zinc-500 line-clamp-1">{part.subtitle}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ResourcePageClient>
      </div>
    </div>
  );
}
