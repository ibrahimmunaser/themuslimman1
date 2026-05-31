"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PARTS } from "@/lib/content";
import type { Part } from "@/lib/types";
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
  const [selectedPart, setSelectedPart] = useState<{
    partNumber: number;
    title: string;
    subtitle?: string;
    id: string;
  } | null>(null);
  const [videoUrl, setVideoUrl]           = useState<string>("");
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);

  // Focus management for video modal
  const prevFocusRef = useRef<Element | null>(null);
  const modalRef     = useRef<HTMLDivElement>(null);

  const totalVideos    = PARTS.length;
  const notStartedCount = totalVideos - completedCount - inProgressCount;

  useEffect(() => { setMounted(true); }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!selectedPart) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [selectedPart]);

  const filterByStatus = (part: Part, status: string) => {
    const p = progressMap[part.partNumber];
    if (status === "completed")  return p?.videoCompleted || false;
    if (status === "in-progress") return !!(p && p.videoWatchPercent > 0 && !p.videoCompleted);
    if (status === "not-started") return !p || p.videoWatchPercent === 0;
    return true;
  };

  const handlePrefetch = useCallback((partNumber: number) => {
    prefetchResource("video", partNumber.toString());
  }, []);

  const handleOpenVideo = async (part: typeof PARTS[0]) => {
    setSelectedPart({ partNumber: part.partNumber, title: part.title, subtitle: part.subtitle, id: part.id });

    const cacheKey = `video-${part.partNumber}`;
    const cached = getCachedResource<{ videoUrl: string }>(cacheKey);
    if (cached?.videoUrl) { setVideoUrl(cached.videoUrl); return; }

    setIsLoadingVideo(true);
    try {
      const res  = await fetch(`/api/part/${part.partNumber}/assets`);
      if (!res.ok) throw new Error("Failed to fetch video");
      const data = await res.json();
      setVideoUrl(data.videoUrl || "");
      if (data.videoUrl) setCachedResource(cacheKey, data);
    } catch {
      setVideoUrl("");
    } finally {
      setIsLoadingVideo(false);
    }
  };

  const handleClose = useCallback(() => {
    setSelectedPart(null);
    setVideoUrl("");
  }, []);

  // Store previously focused element when modal opens; restore on close
  useEffect(() => {
    if (selectedPart) {
      prevFocusRef.current = document.activeElement;
      // Move focus to close button after paint so the DOM is ready
      requestAnimationFrame(() => {
        modalRef.current?.querySelector<HTMLElement>('[aria-label="Close video"]')?.focus();
      });
    } else if (prevFocusRef.current instanceof HTMLElement) {
      prevFocusRef.current.focus();
      prevFocusRef.current = null;
    }
  }, [selectedPart]);

  // Focus trap + Escape key while modal is open — listener exists only during open state
  useEffect(() => {
    if (!selectedPart || !modalRef.current) return;
    const modal = modalRef.current;
    const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = Array.from(modal.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!focusable.length) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selectedPart, handleClose]);

  const continueWatchingPart = continueWatching
    ? PARTS.find((p) => p.partNumber === continueWatching.partNumber)
    : null;

  // Stats config — meaningful stats brighter, reference stats quieter
  const stats = [
    {
      label: "Total",
      value: totalVideos,
      color: "text-zinc-400",
      dim: true,
    },
    {
      label: "Completed",
      value: completedCount,
      color: completedCount > 0 ? "text-green-400" : "text-zinc-500",
      dim: false,
    },
    {
      label: "In Progress",
      value: inProgressCount,
      color: inProgressCount > 0 ? "text-amber-400" : "text-zinc-500",
      dim: false,
    },
    {
      label: "Not Started",
      value: notStartedCount,
      color: "text-zinc-500",
      dim: true,
    },
  ];

  return (
    <div className="min-h-screen bg-ink">

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <div className="border-b border-zinc-800 bg-gradient-to-b from-zinc-900 to-ink">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">

          {/* Title row — compact on mobile */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Video className="w-5 h-5 sm:w-7 sm:h-7 text-amber-500" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-3xl font-bold text-white leading-tight">Video Lessons</h1>
              <p className="text-zinc-500 text-xs sm:text-sm mt-0.5 leading-snug">
                All {totalVideos} guided lessons from the Seerah Masterclass
              </p>
            </div>
          </div>

          {/* Subtle progress context */}
          {completedCount > 0 && (
            <p className="text-xs text-zinc-600 mb-3">
              {completedCount} of {totalVideos} video lessons completed · continue building your Seerah timeline
            </p>
          )}

          {/* Stats grid — differentiated hierarchy */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className={`px-2.5 py-3 sm:px-4 sm:py-4 rounded-xl border flex flex-col ${
                  s.dim
                    ? "bg-zinc-900/25 border-zinc-800/40"
                    : "bg-zinc-900/65 border-zinc-700/50"
                }`}
              >
                {/* Label — fixed min-height keeps numbers baseline-aligned across all cards */}
                <p className={`text-[10px] font-semibold uppercase leading-tight min-h-[24px] flex items-start ${
                  s.dim
                    ? "tracking-[0.12em] text-zinc-600"
                    : "tracking-[0.12em] text-zinc-400"
                }`}
                  style={{ letterSpacing: "0.11em" }}
                >
                  {s.label}
                </p>
                {/* Number — premium typographic treatment */}
                <p className={`text-[1.75rem] sm:text-[2.25rem] font-bold leading-none tracking-tight tabular-nums mt-2 ${s.color}`}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">

        {/* Continue Watching — elevated as primary CTA */}
        {mounted && continueWatchingPart && (
          <div className="mb-5 rounded-2xl bg-gold/6 border border-gold/22 overflow-hidden">
            <div className="px-4 pt-3 pb-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gold/80">Continue Watching</p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenVideo(continueWatchingPart)}
              onMouseEnter={() => handlePrefetch(continueWatchingPart.partNumber)}
              className="group w-full text-left cursor-pointer px-4 pb-3"
              aria-label={`Resume Part ${continueWatchingPart.partNumber}: ${continueWatchingPart.title}`}
            >
              <div className="flex items-center gap-3 sm:gap-5">
                {/* Thumbnail */}
                <div
                  className="relative flex-shrink-0 w-28 sm:w-44 rounded-xl overflow-hidden"
                  style={{ ...eraGradient(continueWatchingPart.era), aspectRatio: "16/9" }}
                >
                  {thumbnails[continueWatchingPart.partNumber] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbnails[continueWatchingPart.partNumber]}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center opacity-10 text-5xl font-black text-white select-none">
                      {continueWatchingPart.partNumber}
                    </span>
                  )}
                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-black/50 border border-white/30 flex items-center justify-center">
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    </div>
                  </div>
                  {/* Progress bar */}
                  {continueWatching && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                      <div className="h-full bg-gold" style={{ width: `${continueWatching.videoWatchPercent}%` }} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-gold/80 font-medium mb-0.5">
                    Part {continueWatchingPart.partNumber}
                  </p>
                  <h3 className="text-sm sm:text-base font-semibold text-text group-hover:text-gold transition-colors line-clamp-2 leading-snug">
                    {continueWatchingPart.title}
                  </h3>
                  {continueWatching && (
                    <p className="text-xs text-zinc-500 mt-1">{continueWatching.videoWatchPercent}% watched</p>
                  )}
                </div>

                {/* Resume — 44px */}
                <div className="flex-shrink-0 inline-flex items-center justify-center min-h-[44px] px-4 sm:px-5 rounded-xl bg-gold text-ink text-sm font-bold group-hover:bg-gold/90 transition-colors shadow-sm shadow-gold/20">
                  Resume
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Filters + Video Grid */}
        <ResourcePageClient
          showStatusFilter
          filterByStatus={filterByStatus}
        >
          {(parts) => (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {mounted && parts.map((part) => {
                const progress    = progressMap[part.partNumber];
                const watchPct    = progress?.videoWatchPercent || 0;
                const isCompleted = progress?.videoCompleted || watchPct >= 85;

                return (
                  <div
                    key={part.id}
                    onClick={() => handleOpenVideo(part)}
                    onMouseEnter={() => handlePrefetch(part.partNumber)}
                    className="group cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-amber-500/25 transition-all overflow-hidden"
                  >
                    {/* Thumbnail */}
                    <div
                      className="aspect-video relative overflow-hidden"
                      style={eraGradient(part.era)}
                    >
                      {thumbnails[part.partNumber] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumbnails[part.partNumber]}
                          alt=""
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500"
                          onLoad={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "1"; }}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                      )}

                      {/* Bottom gradient — keeps text/controls readable */}
                      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

                      {/* Status badge — top-right, doesn't cover title area */}
                      {isCompleted && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/50 border border-gold/40 flex items-center justify-center z-10">
                          <CheckCircle2 className="w-3 h-3 text-gold" />
                        </div>
                      )}
                      {!isCompleted && watchPct > 0 && (
                        <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70 border border-white/15 text-white text-[10px] font-medium z-10">
                          {watchPct}%
                        </div>
                      )}

                      {/* Play button — centered, safe zone */}
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="w-9 h-9 rounded-full bg-black/45 border border-white/25 flex items-center justify-center group-hover:bg-white/20 group-hover:border-white/40 transition-all">
                          <Play className="w-4 h-4 text-white ml-0.5" />
                        </div>
                      </div>

                      {/* Part number — bottom-left, inside gradient safe zone */}
                      <span className="absolute bottom-1.5 left-2 text-[10px] font-bold text-white/60 z-10">
                        {part.partNumber}
                      </span>

                      {/* Progress bar */}
                      {watchPct > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/30 z-10">
                          <div className="h-full bg-gold/80" style={{ width: `${watchPct}%` }} />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-2.5 sm:p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        {isCompleted && (
                          <span className="px-1.5 py-0.5 bg-green-500/10 border border-green-500/15 text-green-400 text-[10px] font-medium rounded">
                            Done
                          </span>
                        )}
                        {!isCompleted && watchPct > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] text-zinc-500 ml-auto">
                            <Clock className="w-2.5 h-2.5" />
                            {part.duration}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xs sm:text-sm font-semibold text-white line-clamp-2 group-hover:text-amber-400 transition-colors leading-snug">
                        {part.title}
                      </h3>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ResourcePageClient>
      </div>

      {/* ── Video Modal ───────────────────────────────────────────────────── */}
      {mounted && selectedPart && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 sm:p-4 backdrop-blur-sm"
          onClick={handleClose}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="video-modal-title"
            className="relative w-full max-w-5xl sm:max-h-[90vh] bg-surface border border-gold/15 sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gold top line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 sm:p-5 border-b border-border flex-shrink-0">
              <div className="min-w-0 flex-1 pr-3">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Video className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                  <span className="text-xs font-medium text-gold">Part {selectedPart.partNumber}</span>
                </div>
                <h2 id="video-modal-title" className="text-base sm:text-xl font-bold text-text line-clamp-2 leading-snug">
                  {selectedPart.title}
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="min-w-[44px] min-h-[44px] rounded-lg hover:bg-surface-raised flex items-center justify-center transition-colors flex-shrink-0"
                aria-label="Close video"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            {/* Modal Content — capped at 55vh on desktop to prevent overflow on short screens */}
            <div className="flex-1 overflow-y-auto bg-black p-3 sm:p-5 sm:max-h-[55vh]">
              {isLoadingVideo ? (
                <div className="aspect-video flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                </div>
              ) : (
                <VideoPlayer
                  src={videoUrl}
                  partNumber={selectedPart.partNumber}
                  title={selectedPart.title}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
