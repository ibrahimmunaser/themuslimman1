"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { PARTS } from "@/lib/content";
import { ERA_MAP } from "@/lib/types";
import { eraGradient } from "./era-gradient";
import { ResourcePageClient } from "./resource-page-client";
import { ArrowLeft, Headphones, Layers, Image as ImageIcon, Map, Brain, CheckCircle2, X, Maximize2, Minimize2 } from "lucide-react";
import Link from "next/link";
import { SlidesViewer } from "@/components/part/slides-viewer";
import { FlashcardsViewer } from "@/components/part/flashcards-viewer";
import { trackAssetOpened } from "@/app/actions/progress";
import type { FlashcardSet, SlideFile } from "@/lib/types";
import { getCachedResource, setCachedResource, prefetchResource } from "@/lib/resource-cache";

/**
 * Fetch a short-lived signed R2 URL for a paid asset from the server.
 * The browser will load the file directly from Cloudflare R2 using the returned URL.
 */
async function fetchSignedUrl(key: string, partNumber: number): Promise<string> {
  const res = await fetch(
    `/api/assets/signed-url?key=${encodeURIComponent(key)}&partNumber=${partNumber}`
  );
  if (!res.ok) throw new Error(`Failed to sign URL for ${key}: ${res.status}`);
  const data = await res.json();
  return data.url as string;
}

/** Derive the pre-generated WebP URL from an R2 PNG URL (or return null). */
function webpVariant(url: string): string | null {
  if (!url.startsWith("http")) return null;
  // Presigned URLs already contain HMAC signatures — WebP key needs its own signature
  if (url.includes("X-Amz-Signature") || url.includes("X-Amz-Algorithm")) return null;
  // Proxy URL: /api/r2/asset?key=...
  if (url.includes("/api/r2/")) {
    const match = url.match(/key=([^&]+)/);
    if (!match) return url.replace(/\.png$/i, "-medium.webp");
    const key = decodeURIComponent(match[1]);
    return `/api/r2/asset?key=${encodeURIComponent(key.replace(/\.png$/i, "-medium.webp"))}`;
  }
  // Direct public CDN URL
  return url.replace(/\.png$/i, "-medium.webp");
}

/** Fast-loading image component with WebP optimization */
function FastImage({ src, alt, className, style, onClick, title, onLoad, imageRef, isPreloaded }: {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
  title?: string;
  onLoad?: () => void;
  imageRef?: React.RefObject<HTMLImageElement | null>;
  isPreloaded?: boolean;
}) {
  const [loaded, setLoaded] = useState(isPreloaded || false);
  const [useFallback, setUseFallback] = useState(false);
  const webpUrl = webpVariant(src);

  useEffect(() => {
    // If preloaded, consider it loaded immediately
    if (isPreloaded) {
      setLoaded(true);
      return;
    }
    setLoaded(false);
    setUseFallback(false);
  }, [src, isPreloaded]);

  const handleLoad = () => {
    setLoaded(true);
    onLoad?.();
  };

  return (
    <>
      {!loaded && !isPreloaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        </div>
      )}
      <img
        ref={imageRef}
        src={useFallback ? src : (webpUrl || src)}
        alt={alt}
        className={`${className} ${loaded || isPreloaded ? "opacity-100" : "opacity-0"}`}
        style={style}
        onClick={onClick}
        title={title}
        onLoad={handleLoad}
        onError={() => {
          if (!useFallback && webpUrl) {
            setUseFallback(true);
          }
        }}
        draggable={false}
        fetchPriority="high"
      />
    </>
  );
}

interface SimpleResourceContentProps {
  title: string;
  description: string;
  resourceType: "audio" | "slides" | "infographic" | "mindmap" | "flashcard";
  progressMap: Record<number, boolean>;
  completedCount: number;
  actionLabel: string;
  statusLabel: string;
  thumbnails?: Record<number, string>;
}

export function SimpleResourceContent({
  title,
  description,
  resourceType,
  progressMap,
  completedCount,
  actionLabel,
  statusLabel,
  thumbnails: thumbnailsProp = {},
}: SimpleResourceContentProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedPart, setSelectedPart] = useState<{ partNumber: number; title: string; subtitle?: string; id: string } | null>(null);
  const [slideData, setSlideData] = useState<{ presented: SlideFile[]; detailed: SlideFile[]; facts: SlideFile[] } | null>(null);
  const [slideType, setSlideType] = useState<"presented" | "detailed" | "facts">("presented");
  const [isLoadingSlides, setIsLoadingSlides] = useState(false);
  const [flashcardData, setFlashcardData] = useState<FlashcardSet | null>(null);
  const [isLoadingFlashcards, setIsLoadingFlashcards] = useState(false);
  const [resourceUrl, setResourceUrl] = useState<string | null>(null);
  const [infographicUrls, setInfographicUrls] = useState<{ bentoGrid: string | null; concise: string | null; standard: string | null } | null>(null);
  const [infographicType, setInfographicType] = useState<"bentoGrid" | "concise" | "standard">("bentoGrid");
  const [isLoadingResource, setIsLoadingResource] = useState(false);
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = React.useRef<HTMLImageElement>(null);
  
  // Local state for progress tracking
  const [localProgressMap, setLocalProgressMap] = useState(progressMap);
  const [localCompletedCount, setLocalCompletedCount] = useState(completedCount);

  // Thumbnail URLs passed from the server — no client fetch needed
  const thumbnails = thumbnailsProp;

  // Ensure client-side hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load slides when slides modal opens - with caching
  useEffect(() => {
    if (selectedPart && resourceType === "slides") {
      const cacheKey = `slides-${selectedPart.id}`;
      const cached = getCachedResource<{ presented: SlideFile[]; detailed: SlideFile[]; facts: SlideFile[] }>(cacheKey);
      
      if (cached) {
        // Use cached data immediately
        setSlideData(cached);
        if (cached.presented?.length) setSlideType("presented");
        else if (cached.detailed?.length) setSlideType("detailed");
        else if (cached.facts?.length) setSlideType("facts");
        return;
      }

      setIsLoadingSlides(true);
      fetch(`/api/slides/${selectedPart.id}`)
        .then(res => res.json())
        .then(data => {
          setSlideData(data);
          setCachedResource(cacheKey, data); // Cache for next time
          if (data.presented?.length) setSlideType("presented");
          else if (data.detailed?.length) setSlideType("detailed");
          else if (data.facts?.length) setSlideType("facts");
        })
        .catch(err => console.error("Failed to load slides:", err))
        .finally(() => setIsLoadingSlides(false));
    }
  }, [selectedPart, resourceType]);

  // Load flashcards when flashcards modal opens - with caching
  useEffect(() => {
    if (selectedPart && resourceType === "flashcard") {
      const cacheKey = `flashcards-${selectedPart.id}`;
      const cached = getCachedResource<FlashcardSet>(cacheKey);
      
      if (cached) {
        // Use cached data immediately
        setFlashcardData(cached);
        return;
      }

      setIsLoadingFlashcards(true);
      fetch(`/api/flashcards/${selectedPart.id}`)
        .then(res => res.json())
        .then(data => {
          setFlashcardData(data);
          setCachedResource(cacheKey, data); // Cache for next time
        })
        .catch(err => console.error("Failed to load flashcards:", err))
        .finally(() => setIsLoadingFlashcards(false));
    }
  }, [selectedPart, resourceType]);

  // Load image-based resources (mindmap, infographic)
  useEffect(() => {
    if (selectedPart && resourceType === "mindmap") {
      setIsLoadingResource(true);
      const key = `mindmaps/Part ${selectedPart.partNumber} - Mindmap.webp`;
      fetchSignedUrl(key, selectedPart.partNumber)
        .then((url) => {
          setResourceUrl(url);
          setIsLoadingResource(false);
        })
        .catch((err) => {
          console.error("Failed to load mindmap:", err);
          setIsLoadingResource(false);
        });
    } else if (selectedPart && resourceType === "infographic") {
      setIsLoadingResource(true);
      const n = selectedPart.partNumber;
      fetch(`/api/infographics/${n}`)
        .then((res) => res.json())
        .then((data: { bentoGrid: string | null; concise: string | null; standard: string | null }) => {
          const bentoUrl    = data.bentoGrid ?? null;
          const conciseUrl  = data.concise   ?? null;
          const standardUrl = data.standard  ?? null;

          const urls = { bentoGrid: bentoUrl, concise: conciseUrl, standard: standardUrl };
          setInfographicUrls(urls);

          // Default to first available type
          const firstAvailable = bentoUrl ? "bentoGrid" : conciseUrl ? "concise" : "standard";
          setInfographicType(firstAvailable as "bentoGrid" | "concise" | "standard");
          setResourceUrl(bentoUrl ?? conciseUrl ?? standardUrl);

          // Preload all available types immediately for instant tab-switching
          const preloadImage = (url: string) => {
            const img = new Image();
            img.src = url;
            img.onload = () => setPreloadedImages((prev) => new Set(prev).add(url));
          };
          if (bentoUrl)    preloadImage(bentoUrl);
          if (conciseUrl)  preloadImage(conciseUrl);
          if (standardUrl) preloadImage(standardUrl);

          setIsLoadingResource(false);
        })
        .catch(() => {
          setIsLoadingResource(false);
        });
    }
  }, [selectedPart, resourceType]);

  // Update resource URL when infographic type changes (lazy load)
  useEffect(() => {
    if (infographicUrls && resourceType === "infographic") {
      setResourceUrl(infographicUrls[infographicType] ?? null);
      // Reset zoom when changing type
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [infographicType, infographicUrls, resourceType]);

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

  // Handle keyboard events
  useEffect(() => {
    if (!selectedPart) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isFullscreen) {
          setIsFullscreen(false);
          resetZoom();
        } else {
          handleClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPart, isFullscreen]);

  // Reset zoom when entering/exiting fullscreen
  useEffect(() => {
    if (!isFullscreen) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [isFullscreen]);

  const totalResources = PARTS.length;
  const notCompletedCount = totalResources - localCompletedCount;

  const filterByStatus = (part: any, status: string) => {
    const isCompleted = localProgressMap[part.partNumber] || false;
    if (status === "completed") return isCompleted;
    if (status === "not-started") return !isCompleted;
    return true;
  };

  const IconComponent = {
    audio: Headphones,
    slides: Layers,
    infographic: ImageIcon,
    mindmap: Map,
    flashcard: Brain,
  }[resourceType];

  // Prefetch data on hover for instant loading
  const handlePrefetch = useCallback((partId: string) => {
    if (resourceType === "slides") {
      prefetchResource("slides", partId);
    } else if (resourceType === "flashcard") {
      prefetchResource("flashcards", partId);
    }
  }, [resourceType]);

  // Preload adjacent images for faster navigation
  useEffect(() => {
    if (!selectedPart || !resourceUrl || resourceType === "slides" || resourceType === "flashcard") return;
    
    // Preload next part's image
    const currentIndex = PARTS.findIndex(p => p.partNumber === selectedPart.partNumber);
    if (currentIndex !== -1 && currentIndex < PARTS.length - 1) {
      const nextPart = PARTS[currentIndex + 1];
      const nextUrl = resourceType === "mindmap"
        ? `/api/r2/asset?key=${encodeURIComponent(`mindmaps/Part ${nextPart.partNumber} - Mindmap.webp`)}`
        : `/api/r2/asset?key=${encodeURIComponent(`Infographics-Bento-Grid/Part ${nextPart.partNumber}.webp`)}`;
      
      const webpUrl = webpVariant(nextUrl);
      if (webpUrl) {
        const img = new Image();
        img.src = webpUrl;
      }
    }
  }, [selectedPart, resourceUrl, resourceType]);

  const handleOpenResource = async (part: typeof PARTS[0]) => {
    setSelectedPart({ 
      partNumber: part.partNumber, 
      title: part.title, 
      subtitle: part.subtitle,
      id: part.id 
    });
    
    // Track asset opened and update local progress
    if (resourceType === "mindmap" || resourceType === "infographic" || resourceType === "slides" || resourceType === "flashcard") {
      const wasAlreadyViewed = localProgressMap[part.partNumber];
      
      // Update local state immediately for better UX
      if (!wasAlreadyViewed) {
        setLocalProgressMap(prev => ({
          ...prev,
          [part.partNumber]: true
        }));
        setLocalCompletedCount(prev => prev + 1);
      }
      
      // Track in database (fire and forget)
      trackAssetOpened(part.partNumber, resourceType).catch(err => {
        console.error("Failed to track asset:", err);
        // Revert local state if failed
        if (!wasAlreadyViewed) {
          setLocalProgressMap(prev => ({
            ...prev,
            [part.partNumber]: false
          }));
          setLocalCompletedCount(prev => prev - 1);
        }
      });
    }
  };

  const handleClose = () => {
    setSelectedPart(null);
    setIsFullscreen(false);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setInfographicType("bentoGrid"); // Reset to default
    setInfographicUrls(null);
    setPreloadedImages(new Set()); // Clear preloaded images
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!isFullscreen || !imageRef.current) return;
    
    e.preventDefault();
    
    // Use a fixed zoom step instead of deltaY multiplier for consistent zooming
    const zoomStep = 0.1; // 10% zoom per scroll
    const direction = e.deltaY < 0 ? 1 : -1; // Zoom in if scrolling up, out if scrolling down
    const newZoom = Math.min(Math.max(0.5, zoom + (zoomStep * direction)), 5);
    
    if (newZoom === zoom) return;
    
    // Get the container's bounding rect (where the transform happens)
    const container = e.currentTarget as HTMLElement;
    const containerRect = container.getBoundingClientRect();
    
    // Get mouse position relative to the container
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;
    
    // Calculate the center of the container
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;
    
    // The current position of the point under the mouse (in unzoomed coordinates)
    // We need to work backwards from the current transform
    const currentPointX = (mouseX - centerX - pan.x) / zoom;
    const currentPointY = (mouseY - centerY - pan.y) / zoom;
    
    // Calculate new pan so the same point stays under the mouse
    const newPanX = mouseX - centerX - currentPointX * newZoom;
    const newPanY = mouseY - centerY - currentPointY * newZoom;
    
    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isFullscreen || zoom <= 1) return;
    
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero Section */}
      <div className="border-b border-zinc-800 bg-gradient-to-b from-zinc-900 to-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <IconComponent className="w-7 h-7 text-amber-500" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">{title}</h1>
              <p className="text-zinc-400 mt-1">{description}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-1">Total</p>
              <p className="text-3xl font-bold text-white">{totalResources}</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-1">{statusLabel}</p>
              <p className={`text-3xl font-bold ${localCompletedCount > 0 ? "text-green-400" : "text-zinc-400"}`}>{localCompletedCount}</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-1">Not {statusLabel}</p>
              <p className="text-3xl font-bold text-zinc-400">{notCompletedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {mounted && selectedPart && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm ${
            isFullscreen ? 'p-0' : 'p-4'
          }`}
          onClick={handleClose}
          onWheel={(e) => e.stopPropagation()}
        >
          <div 
            className={`relative flex flex-col overflow-hidden ${
              isFullscreen 
                ? "w-full h-full bg-black"
                : "w-full max-w-6xl h-[90vh] bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border-2 border-amber-500/20 rounded-2xl shadow-2xl"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative glow */}
            {!isFullscreen && (
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
            )}
            
            {/* Modal Header */}
            {!isFullscreen && (
              <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <IconComponent className="w-5 h-5 text-amber-500" />
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
            )}

            {/* Modal Content */}
            <div className={`flex-1 overflow-hidden bg-zinc-950 ${isFullscreen ? 'p-0' : 'p-6'}`}>
              {(() => {
                // Handle slides
                if (resourceType === "slides") {
                  return isLoadingSlides ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="w-12 h-12 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                    </div>
                  ) : slideData ? (
                    <div className="h-full flex flex-col gap-4">
                      {/* Slide type selector */}
                      <div className="flex gap-2">
                        {slideData.presented.length > 0 && (
                          <button
                            onClick={() => setSlideType("presented")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                              slideType === "presented"
                                ? "bg-amber-500/12 text-amber-400 border-amber-500/25"
                                : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-300"
                            }`}
                          >
                            Presented
                          </button>
                        )}
                        {slideData.detailed.length > 0 && (
                          <button
                            onClick={() => setSlideType("detailed")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                              slideType === "detailed"
                                ? "bg-amber-500/12 text-amber-400 border-amber-500/25"
                                : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-300"
                            }`}
                          >
                            Detailed
                          </button>
                        )}
                        {slideData.facts.length > 0 && (
                          <button
                            onClick={() => setSlideType("facts")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                              slideType === "facts"
                                ? "bg-amber-500/12 text-amber-400 border-amber-500/25"
                                : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-300"
                            }`}
                          >
                            Facts
                          </button>
                        )}
                      </div>
                      {/* Slides viewer */}
                      <div className="flex-1 min-h-0">
                        <SlidesViewer
                          slides={slideData[slideType]}
                          title={`Part ${selectedPart.partNumber} — ${slideType === "presented" ? "Presented" : slideType === "detailed" ? "Detailed" : "Facts"} Slides`}
                          type={slideType === "facts" ? "presented" : slideType}
                          partNumber={selectedPart.partNumber}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-zinc-400">
                      <p>No slides available</p>
                    </div>
                  );
                }
                
                // Handle image-based resources (mindmap, infographic)
                if (resourceType === "mindmap" || resourceType === "infographic") {
                  return isLoadingResource ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="w-12 h-12 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                    </div>
                  ) : resourceUrl ? (
                    <div className="h-full flex flex-col gap-4">
                      {/* Infographic type selector (only for infographics, not mindmaps) */}
                      {resourceType === "infographic" && !isFullscreen && infographicUrls && (
                        <div className="flex gap-2">
                          {infographicUrls.bentoGrid && (
                            <button
                              onClick={() => setInfographicType("bentoGrid")}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                infographicType === "bentoGrid"
                                  ? "bg-amber-500/12 text-amber-400 border-amber-500/25"
                                  : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-300"
                              }`}
                            >
                              Bento Grid
                            </button>
                          )}
                          {infographicUrls.concise && (
                            <button
                              onClick={() => setInfographicType("concise")}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                infographicType === "concise"
                                  ? "bg-amber-500/12 text-amber-400 border-amber-500/25"
                                  : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-300"
                              }`}
                            >
                              Concise
                            </button>
                          )}
                          {infographicUrls.standard && (
                            <button
                              onClick={() => setInfographicType("standard")}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                infographicType === "standard"
                                  ? "bg-amber-500/12 text-amber-400 border-amber-500/25"
                                  : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-300"
                              }`}
                            >
                              Standard
                            </button>
                          )}
                        </div>
                      )}
                      
                      {/* Image container */}
                      <div 
                        className={`relative ${resourceType === "infographic" && !isFullscreen ? 'flex-1' : 'h-full'} flex items-center justify-center overflow-hidden ${
                          isFullscreen ? 'bg-black' : 'bg-zinc-900/30 rounded-lg'
                        }`}
                        onWheel={handleWheel}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        style={{ cursor: isFullscreen && zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'pointer' }}
                      >
                      <FastImage
                        imageRef={imageRef}
                        src={resourceUrl} 
                        alt={`${selectedPart.title} - ${title}`}
                        className="max-w-full max-h-full object-contain transition-transform duration-100"
                        onClick={(e) => {
                          if (zoom <= 1) {
                            setIsFullscreen(!isFullscreen);
                          }
                        }}
                        title={isFullscreen ? (zoom > 1 ? "Scroll to zoom, drag to pan" : "Click to exit fullscreen") : "Click to view fullscreen"}
                        style={{
                          transform: isFullscreen ? `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` : 'none',
                          pointerEvents: zoom > 1 ? 'none' : 'auto'
                        }}
                        isPreloaded={preloadedImages.has(resourceUrl)}
                      />
                      
                      {/* Zoom controls */}
                      {isFullscreen && (
                        <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-10">
                          <div className="px-3 py-2 rounded-lg bg-zinc-900/90 border border-zinc-700 text-white text-sm">
                            {Math.round(zoom * 100)}%
                          </div>
                          {zoom > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                resetZoom();
                              }}
                              className="px-3 py-2 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-white text-sm transition-colors"
                            >
                              Reset Zoom
                            </button>
                          )}
                        </div>
                      )}
                      
                      {/* Fullscreen toggle button */}
                      {isFullscreen && (
                        <div className="absolute top-4 right-4 flex gap-2 z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsFullscreen(false);
                              resetZoom();
                            }}
                            className="px-4 py-2 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-white transition-colors flex items-center gap-2"
                          >
                            <Minimize2 className="w-4 h-4" />
                            <span className="text-sm">Exit Fullscreen</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClose();
                            }}
                            className="w-10 h-10 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 flex items-center justify-center transition-colors"
                          >
                            <X className="w-5 h-5 text-zinc-400" />
                          </button>
                        </div>
                      )}
                      
                      {/* Fullscreen hint (only when not in fullscreen) */}
                      {!isFullscreen && (
                        <div className="absolute bottom-4 right-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsFullscreen(true);
                            }}
                            className="px-3 py-2 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white transition-colors flex items-center gap-2"
                          >
                            <Maximize2 className="w-4 h-4" />
                            <span className="text-xs">Fullscreen</span>
                          </button>
                        </div>
                      )}
                    </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-zinc-400">
                      <p>Resource not available</p>
                    </div>
                  );
                }
                
                // Handle flashcards
                if (resourceType === "flashcard") {
                  return isLoadingFlashcards ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="w-12 h-12 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                    </div>
                  ) : flashcardData ? (
                    <div className="h-full overflow-y-auto">
                      <FlashcardsViewer flashcards={flashcardData} partNumber={selectedPart?.partNumber} />
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-zinc-400">
                      <p>No flashcards available</p>
                    </div>
                  );
                }
                
                // Default: iframe for other resource types (audio, etc.)
                return (
                  <iframe
                    src={`/seerah/${selectedPart.id}?embedded=true`}
                    className="w-full h-full border-0 rounded-lg"
                    title={`${selectedPart.title} - ${title}`}
                  />
                );
              })()}
            </div>

            {/* Modal Footer */}
            {!isFullscreen && (
              <div className="flex items-center justify-end p-6 border-t border-zinc-800 bg-zinc-900/50 backdrop-blur">
                <button
                  onClick={handleClose}
                  className="px-6 py-2 rounded-lg bg-amber-500 text-black hover:bg-amber-400 text-sm font-semibold transition-all hover:scale-105 shadow-lg shadow-amber-500/20"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ResourcePageClient
          showStatusFilter
          filterByStatus={filterByStatus}
        >
          {(parts) => (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {mounted && parts.map((part) => {
                const isCompleted = localProgressMap[part.partNumber] || false;

                return (
                  <div
                    key={part.id}
                    onClick={() => handleOpenResource(part)}
                    onMouseEnter={() => handlePrefetch(part.id)}
                    className="group cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-amber-500/30 transition-all overflow-hidden"
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

                      {isCompleted && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500/30 border border-green-500/50 flex items-center justify-center z-10">
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        </div>
                      )}

                      <div className="relative z-10 w-14 h-14 rounded-full bg-black/40 border border-white/25 flex items-center justify-center group-hover:bg-white/20 group-hover:border-white/40 transition-all">
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3 sm:p-4">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-xs font-medium text-amber-500">Part {part.partNumber}</span>
                        {isCompleted && (
                          <span className="px-1.5 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-medium rounded">
                            {statusLabel}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xs sm:text-sm font-semibold text-white mb-1 line-clamp-2 group-hover:text-amber-400 transition-colors">
                        {part.title}
                      </h3>
                      {part.subtitle && (
                        <p className="text-[10px] sm:text-xs text-zinc-500 line-clamp-1">{part.subtitle}</p>
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
