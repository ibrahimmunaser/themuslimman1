"use client";

import { useState, useEffect, useCallback } from "react";
import { PARTS } from "@/lib/content";
import { ResourcePageClient } from "./resource-page-client";
import { ArrowLeft, Video, Play, CheckCircle2, Clock, X } from "lucide-react";
import Link from "next/link";
import { VideoPlayer } from "@/components/part/video-player";
import { getCachedResource, setCachedResource, prefetchResource } from "@/lib/resource-cache";

interface VideoResourceContentProps {
  progressMap: Record<number, { videoWatchPercent: number; videoCompleted: boolean }>;
  completedCount: number;
  inProgressCount: number;
  continueWatching?: { partNumber: number; videoWatchPercent: number };
}

export function VideoResourceContent({
  progressMap,
  completedCount,
  inProgressCount,
  continueWatching,
}: VideoResourceContentProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedPart, setSelectedPart] = useState<{ partNumber: number; title: string; subtitle?: string; id: string } | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  
  const totalVideos = PARTS.length;
  const notStartedCount = totalVideos - completedCount - inProgressCount;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedPart) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [selectedPart]);

  const filterByStatus = (part: any, status: string) => {
    const progress = progressMap[part.partNumber];
    if (status === "completed") return progress?.videoCompleted || false;
    if (status === "in-progress") return progress && progress.videoWatchPercent > 0 && !progress.videoCompleted;
    if (status === "not-started") return !progress || progress.videoWatchPercent === 0;
    return true;
  };

  // Prefetch video data on hover
  const handlePrefetch = useCallback((partNumber: number) => {
    prefetchResource("video", partNumber.toString());
  }, []);

  const handleOpenVideo = async (part: typeof PARTS[0]) => {
    setSelectedPart({ 
      partNumber: part.partNumber, 
      title: part.title, 
      subtitle: part.subtitle,
      id: part.id
    });
    
    // Check cache first
    const cacheKey = `video-${part.partNumber}`;
    const cached = getCachedResource<{ videoUrl: string }>(cacheKey);
    
    if (cached && cached.videoUrl) {
      setVideoUrl(cached.videoUrl);
      return;
    }
    
    setIsLoadingVideo(true);
    
    try {
      const response = await fetch(`/api/part/${part.partNumber}/assets`);
      if (!response.ok) throw new Error("Failed to fetch video");
      const data = await response.json();
      
      if (data.videoUrl) {
        setVideoUrl(data.videoUrl);
        setCachedResource(cacheKey, data); // Cache for next time
      } else {
        setVideoUrl("");
      }
    } catch (error) {
      console.error("Error loading video:", error);
      setVideoUrl("");
    } finally {
      setIsLoadingVideo(false);
    }
  };

  const handleClose = () => {
    setSelectedPart(null);
    setVideoUrl("");
  };

  const continueWatchingPart = continueWatching
    ? PARTS.find((p) => p.partNumber === continueWatching.partNumber)
    : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero Section */}
      <div className="border-b border-zinc-800 bg-gradient-to-b from-zinc-900 to-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Video className="w-7 h-7 text-amber-500" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Video Lessons</h1>
              <p className="text-zinc-400 mt-1">All 100 guided video lessons from the Seerah Masterclass</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-1">Total</p>
              <p className="text-3xl font-bold text-white">{totalVideos}</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-1">Completed</p>
              <p className="text-3xl font-bold text-green-400">{completedCount}</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-1">In Progress</p>
              <p className="text-3xl font-bold text-amber-400">{inProgressCount}</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-1">Not Started</p>
              <p className="text-3xl font-bold text-zinc-400">{notStartedCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Continue Watching */}
        {mounted && continueWatchingPart && (
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20">
            <p className="text-amber-400 text-sm font-medium uppercase tracking-wider mb-3">Continue Watching</p>
            <div
              onClick={() => handleOpenVideo(continueWatchingPart)}
              onMouseEnter={() => handlePrefetch(continueWatchingPart.partNumber)}
              className="group block cursor-pointer"
            >
              <div className="flex items-center gap-6">
                <div className="relative flex-shrink-0 w-48 h-28 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center overflow-hidden">
                  <Play className="w-8 h-8 text-white/70 group-hover:text-white transition-colors" />
                  {continueWatching && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
                      <div
                        className="h-full bg-amber-500"
                        style={{ width: `${continueWatching.videoWatchPercent}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-amber-500 font-medium mb-1">Part {continueWatchingPart.partNumber}</p>
                  <h3 className="text-xl font-semibold text-white mb-1 group-hover:text-amber-400 transition-colors">
                    {continueWatchingPart.title}
                  </h3>
                  {continueWatchingPart.subtitle && (
                    <p className="text-sm text-zinc-400">{continueWatchingPart.subtitle}</p>
                  )}
                  {continueWatching && (
                    <p className="text-xs text-zinc-500 mt-2">{continueWatching.videoWatchPercent}% complete</p>
                  )}
                </div>
                <div className="flex-shrink-0 px-6 py-3 rounded-xl bg-amber-500 text-black font-semibold group-hover:bg-amber-400 transition-colors">
                  Resume
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Videos */}
        <ResourcePageClient
          showStatusFilter
          filterByStatus={filterByStatus}
        >
          {(parts) => (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {mounted && parts.map((part) => {
                const progress = progressMap[part.partNumber];
                const watchPercent = progress?.videoWatchPercent || 0;
                const isCompleted = progress?.videoCompleted || watchPercent >= 85;

                return (
                  <div
                    key={part.id}
                    onClick={() => handleOpenVideo(part)}
                    onMouseEnter={() => handlePrefetch(part.partNumber)}
                    className="group cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-amber-500/30 overflow-hidden transition-all"
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video bg-gradient-to-br from-zinc-800 to-zinc-900 relative flex items-center justify-center">
                      {isCompleted && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        </div>
                      )}
                      {!isCompleted && watchPercent > 0 && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-medium">
                          {watchPercent}%
                        </div>
                      )}

                      <div className="w-12 h-12 rounded-full bg-black/40 border border-white/20 flex items-center justify-center group-hover:bg-amber-500/20 group-hover:border-amber-500/40 transition-all">
                        <Play className="w-5 h-5 text-white ml-0.5" />
                      </div>

                      {/* Progress bar */}
                      {watchPercent > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
                          <div
                            className="h-full bg-amber-500"
                            style={{ width: `${watchPercent}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-amber-500">Part {part.partNumber}</span>
                        {isCompleted && (
                          <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium rounded">
                            Completed
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2 group-hover:text-amber-400 transition-colors">
                        {part.title}
                      </h3>
                      {part.subtitle && (
                        <p className="text-xs text-zinc-500 line-clamp-1 mb-2">{part.subtitle}</p>
                      )}
                      {part.duration && (
                        <div className="flex items-center gap-1 text-xs text-zinc-500">
                          <Clock className="w-3 h-3" />
                          {part.duration}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ResourcePageClient>
      </div>

      {/* Video Modal */}
      {mounted && selectedPart && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={handleClose}
        >
          <div 
            className="relative w-full max-w-6xl max-h-[90vh] bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border-2 border-amber-500/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative glow */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Video className="w-5 h-5 text-amber-500" />
                  <span className="text-sm font-medium text-amber-500">Part {selectedPart.partNumber}</span>
                </div>
                <h2 className="text-2xl font-bold text-white">{selectedPart.title}</h2>
                {selectedPart.subtitle && (
                  <p className="text-sm text-zinc-400 mt-1">{selectedPart.subtitle}</p>
                )}
              </div>
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-lg hover:bg-zinc-800 flex items-center justify-center transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-hidden bg-zinc-950 p-6">
              {isLoadingVideo ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-zinc-400">Loading video...</div>
                </div>
              ) : (
                <VideoPlayer 
                  src={videoUrl} 
                  partNumber={selectedPart.partNumber}
                  title={selectedPart.title}
                />
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end p-6 border-t border-zinc-800 bg-zinc-900/50 backdrop-blur">
              <button
                onClick={handleClose}
                className="px-6 py-2 rounded-lg bg-amber-500 text-black hover:bg-amber-400 text-sm font-semibold transition-all hover:scale-105 shadow-lg shadow-amber-500/20"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
