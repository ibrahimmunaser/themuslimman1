"use client";

import { useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface ImageLightboxProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageLightbox({ src, alt, isOpen, onClose }: ImageLightboxProps) {
  const [zoom, setZoom] = useState(1);

  const resetZoom = useCallback(() => setZoom(1), []);
  const zoomIn = useCallback(() => setZoom((z) => Math.min(3, parseFloat((z + 0.25).toFixed(2)))), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(0.25, parseFloat((z - 0.25).toFixed(2)))), []);

  useEffect(() => {
    if (!isOpen) return;
    setZoom(1);
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") zoomIn();
      if (e.key === "-") zoomOut();
      if (e.key === "0") resetZoom();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, zoomIn, zoomOut, resetZoom]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={`Image viewer: ${alt}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/92 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Toolbar */}
      <div className="relative z-10 flex items-center justify-between px-3 py-1.5 flex-shrink-0">
        <p className="text-xs text-white/50 truncate max-w-[50vw]">{alt}</p>
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            className="min-w-[44px] min-h-[44px] rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetZoom}
            className="px-2 min-h-[44px] rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-xs text-white/70 hover:text-white transition-all tabular-nums min-w-[3.5rem] text-center"
            aria-label={`Reset zoom, currently ${Math.round(zoom * 100)}%`}
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={zoomIn}
            className="min-w-[44px] min-h-[44px] rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-white/15 mx-1" />
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] rounded-lg bg-white/10 hover:bg-red-500/30 border border-white/10 hover:border-red-500/30 flex items-center justify-center text-white/70 hover:text-white transition-all"
            aria-label="Close image viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Image scroll area */}
      <div
        className="relative flex-1 overflow-auto"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          className="flex items-start justify-center min-h-full p-4 pb-8"
          style={{ minWidth: zoom > 1 ? `${zoom * 100}%` : undefined }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            style={{
              maxWidth: zoom <= 1 ? "100%" : undefined,
              width: zoom > 1 ? `${zoom * 100}%` : "auto",
              maxHeight: zoom <= 1 ? "calc(100vh - 8rem)" : undefined,
              objectFit: "contain",
              display: "block",
              borderRadius: "0.5rem",
              boxShadow: "0 25px 60px rgba(0,0,0,0.7)",
            }}
            draggable={false}
          />
        </div>
      </div>

      {/* Hint bar */}
      <div className="relative z-10 flex-shrink-0 py-2 text-center">
        <p className="text-[11px] text-white/25">Tap outside to close · Esc · +/− to zoom</p>
      </div>
    </div>,
    document.body
  );
}
