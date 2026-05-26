"use client";

import { useState, useEffect, useCallback } from "react";
import { PARTS } from "@/lib/content";
import { ERA_MAP } from "@/lib/types";
import { eraGradient } from "./era-gradient";
import { ResourcePageClient } from "./resource-page-client";
import { Video, Play, CheckCircle2, Clock, X } from "lucide-react";
import { VideoPlayer } from "@/components/part/video-player";
import { getCachedResource, setCachedResource, prefetchResource } from "@/lib/resource-cache";

interface VideoResourceContentProps {
  progressMap: Record<number, { videoWatchPercent: number; videoCompleted: boolean }>;
  completedCount: number;
  inProgressCount: number;
  continueWatching?: { partNumber: number; videoWatchPercent: number };
  thumbnails?: Record<number, string>;
}

export function VideoResourceContent({
  progressMap,
  completedCount,
  inProgressCount,
  continueWatching,
  thumbnails = {},
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
    <div>
      {/* Header */}
      <div className="border-b border-border px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
            <Video className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text">Video Lessons</h1>
            <p className="text-sm text-text-muted mt-0.5">All 100 guided video lessons from the Seerah Masterclass</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-1">Total</p>
            <p className="text-3xl font-bold text-text">{totalVideos}</p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-1">Completed</p>
            <p className="text-3xl font-bold text-gold">{completedCount}</p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-1">In Progress</p>
            <p className="text-3xl font-bold text-gold/70">{inProgressCount}</p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-1">Not Started</p>
            <p className="text-3xl font-bold text-text-muted">{notStartedCount}</p>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Continue Watching */}
        {mounted && continueWatchingPart && (
          <div className="mb-6 p-5 rounded-2xl bg-gold/5 border border-gold/20">
            <p className="text-gold text-xs font-semibold uppercase tracking-wider mb-3">Continue Watching</p>
            <div
              onClick={() => handleOpenVideo(continueWatchingPart)}
              onMouseEnter={() => handlePrefetch(continueWatchingPart.partNumber)}
              className="group block cursor-pointer"
            >
              <div className="flex items-center gap-4 sm:gap-6">
                <div
                  className="relative flex-shrink-0 w-32 sm:w-48 h-20 sm:h-28 rounded-xl flex items-center justify-center overflow-hidden"
                  style={eraGradient(continueWatchingPart.era)}
                >
                  <span className="absolute inset-0 flex items-center justify-center opacity-10 text-7xl font-black text-white select-none pointer-events-none">
                    {continueWatchingPart.partNumber}
                  </span>
                  <Play className="w-8 h-8 text-white/80 group-hover:text-white transition-colors relative z-10" />
                  {continueWatching && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-background/50">
                      <div
                        className="h-full bg-gold"
                        style={{ width: `${continueWatching.videoWatchPercent}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gold font-medium mb-1">Part {continueWatchingPart.partNumber}</p>
                  <h3 className="text-base sm:text-xl font-semibold text-text mb-1 group-hover:text-gold transition-colors line-clamp-2">
                    {continueWatchingPart.title}
                  </h3>
                  {continueWatchingPart.subtitle && (
                    <p className="text-sm text-text-secondary hidden sm:block">{continueWatchingPart.subtitle}</p>
                  )}
                  {continueWatching && (
                    <p className="text-xs text-text-muted mt-1">{continueWatching.videoWatchPercent}% complete</p>
                  )}
                </div>
                <div className="flex-shrink-0 px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-gold text-ink text-sm font-semibold group-hover:bg-gold/90 transition-colors">
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
                    className="group cursor-pointer rounded-xl border border-border bg-surface hover:bg-surface-raised hover:border-gold/30 overflow-hidden transition-all"
                  >
                    {/* Thumbnail */}
                    <div
                      className="aspect-video relative flex items-center justify-center overflow-hidden"
                      style={eraGradient(part.era)}
                    >
                      {/* Slide thumbnail — rendered once batch URLs are loaded */}
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

                      {/* Status badge */}
                      {isCompleted && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center z-10">
                          <CheckCircle2 className="w-4 h-4 text-gold" />
                        </div>
                      )}
                      {!isCompleted && watchPercent > 0 && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 border border-white/20 text-white text-xs font-medium z-10">
                          {watchPercent}%
                        </div>
                      )}

                      {/* Play button */}
                      <div className="relative z-10 w-11 h-11 rounded-full bg-black/40 border border-white/25 flex items-center justify-center group-hover:bg-white/20 group-hover:border-white/40 transition-all">
                        <Play className="w-5 h-5 text-white ml-0.5" />
                      </div>

                      {/* Progress bar */}
                      {watchPercent > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30 z-10">
                          <div
                            className="h-full bg-gold/70"
                            style={{ width: `${watchPercent}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-gold">Part {part.partNumber}</span>
                        {isCompleted && (
                          <span className="px-2 py-0.5 bg-gold/10 border border-gold/20 text-gold text-xs font-medium rounded">
                            Completed
                          </span>
                        )}
                        {!isCompleted && watchPercent > 0 && (
                          <span className="ml-auto flex items-center gap-1 text-xs text-text-muted">
                            <Clock className="w-3 h-3" />
                            {part.duration}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-text mb-1 line-clamp-2 group-hover:text-gold transition-colors">
                        {part.title}
                      </h3>
                      {part.subtitle && (
                        <p className="text-xs text-text-muted line-clamp-1">{part.subtitle}</p>
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
            className="relative w-full max-w-6xl max-h-[90vh] bg-surface border border-gold/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative glow */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent"></div>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
              <div className="min-w-0 flex-1 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <Video className="w-4 h-4 text-gold flex-shrink-0" />
                  <span className="text-sm font-medium text-gold">Part {selectedPart.partNumber}</span>
                </div>
                <h2 className="text-lg sm:text-2xl font-bold text-text line-clamp-2">{selectedPart.title}</h2>
                {selectedPart.subtitle && (
                  <p className="text-sm text-text-secondary mt-1 hidden sm:block">{selectedPart.subtitle}</p>
                )}
              </div>
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-lg hover:bg-surface-raised flex items-center justify-center transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto bg-background p-4 sm:p-6">
              {isLoadingVideo ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="text-text-muted">Loading video...</div>
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
            <div className="flex items-center justify-end p-4 sm:p-6 border-t border-border">
              <button
                onClick={handleClose}
                className="px-5 py-2 rounded-lg bg-gold text-ink hover:bg-gold/90 text-sm font-semibold transition-colors"
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
