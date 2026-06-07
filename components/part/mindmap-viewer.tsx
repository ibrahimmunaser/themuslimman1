"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ZoomIn, ZoomOut, Crosshair, Maximize2, Map } from "lucide-react";

interface MindmapViewerProps {
  src?: string;
  title?: string;
}

interface Transform { scale: number; x: number; y: number; }

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val));
}

export function MindmapViewer({ src, title }: MindmapViewerProps) {
  const [t, setT] = useState<Transform>({ scale: 1, x: 0, y: 0 });
  const [fullscreen, setFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [ready, setReady] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const lastTouchDist = useRef<number | null>(null);
  const imgLoadedRef = useRef(false);

  // ── Fit image to container, centered ────────────────────────────────────
  // Guards: skip if the image hasn't loaded yet or if the container has no
  // real dimensions (e.g. the tab is hidden / display:none).
  const fitToContainer = useCallback(() => {
    const container = containerRef.current;
    const img = imageRef.current;
    if (!container || !img) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    // Container not visible yet — ResizeObserver will call us when it gets size.
    if (cw === 0 || ch === 0) return;
    const iw = img.naturalWidth || img.clientWidth || 1;
    const ih = img.naturalHeight || img.clientHeight || 1;
    const scale = clamp(Math.min(cw / iw, ch / ih) * 0.92, 0.05, 10);
    setT({ scale, x: (cw - iw * scale) / 2, y: (ch - ih * scale) / 2 });
    setReady(true);
  }, []);

  // ── ResizeObserver: re-fit whenever the container gets real dimensions ───
  // This fires when a hidden tab becomes visible (clientWidth 0 → actual px).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => {
      if (imgLoadedRef.current) fitToContainer();
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [fitToContainer]);

  // ── Atomic zoom toward a container-space point (cx, cy) ─────────────────
  // Single setT call → scale and pan always in sync, no stale-closure drift.
  const zoomAt = useCallback((cx: number, cy: number, factor: number) => {
    setT((prev) => {
      const scale = clamp(prev.scale * factor, 0.05, 10);
      const ratio = scale / prev.scale;
      return {
        scale,
        x: cx - ratio * (cx - prev.x),
        y: cy - ratio * (cy - prev.y),
      };
    });
  }, []);

  // ── Wheel: zoom toward cursor ────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      zoomAt(e.clientX - rect.left, e.clientY - rect.top, e.deltaY < 0 ? 1.12 : 1 / 1.12);
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [zoomAt]);

  // ── Mouse drag — delta-based ─────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - lastPosRef.current.x;
      const dy = e.clientY - lastPosRef.current.y;
      lastPosRef.current = { x: e.clientX, y: e.clientY };
      setT((p) => ({ ...p, x: p.x + dx * 0.65, y: p.y + dy * 0.65 }));
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging]);

  // ── Touch: pinch zoom + single-finger pan ────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDist.current = Math.hypot(dx, dy);
      } else if (e.touches.length === 1) {
        lastPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 2 && lastTouchDist.current !== null) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const factor = dist / lastTouchDist.current;
        lastTouchDist.current = dist;
        const rect = el.getBoundingClientRect();
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
        zoomAt(midX, midY, factor);
      } else if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - lastPosRef.current.x;
        const dy = e.touches[0].clientY - lastPosRef.current.y;
        lastPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        setT((p) => ({ ...p, x: p.x + dx * 0.65, y: p.y + dy * 0.65 }));
      }
    };

    const onTouchEnd = () => { lastTouchDist.current = null; };

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [zoomAt]);

  // ── Native fullscreen ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => {
      setFullscreen(!!document.fullscreenElement);
      requestAnimationFrame(fitToContainer);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, [fitToContainer]);

  const enterFullscreen = useCallback(async () => {
    if (wrapperRef.current?.requestFullscreen) {
      try { await wrapperRef.current.requestFullscreen(); }
      catch { setFullscreen(true); fitToContainer(); }
    } else { setFullscreen(true); fitToContainer(); }
  }, [fitToContainer]);

  const exitFullscreenMode = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen();
    else { setFullscreen(false); requestAnimationFrame(fitToContainer); }
  }, [fitToContainer]);

  const getCenter = useCallback(() => ({
    x: (containerRef.current?.clientWidth ?? 0) / 2,
    y: (containerRef.current?.clientHeight ?? 0) / 2,
  }), []);

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!src) {
    return (
      <div className="aspect-[4/3] rounded-2xl border border-border bg-surface flex flex-col items-center justify-center gap-3">
        <div className="w-14 h-14 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
          <Map className="w-6 h-6 text-gold/50" />
        </div>
        <div className="text-center">
          <p className="text-text-secondary text-sm font-medium">No mindmap for this part</p>
          <p className="text-xs text-text-muted mt-1">Check back as new visual aids are added over time</p>
        </div>
      </div>
    );
  }

  const toolbar = (
    <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 border-b border-border bg-surface flex-shrink-0">
      <p className="text-sm font-medium text-text-secondary flex-1 truncate">{title || "Mindmap"}</p>
      <button
        onClick={() => { const c = getCenter(); zoomAt(c.x, c.y, 1 / 1.25); }}
        className="min-w-[44px] min-h-[44px] rounded-lg bg-surface-raised border border-border flex items-center justify-center text-text-muted hover:text-text transition-colors"
        aria-label="Zoom out"
      >
        <ZoomOut className="w-3.5 h-3.5" />
      </button>
      <span className="text-xs text-text-muted w-10 text-center tabular-nums">
        {Math.round(t.scale * 100)}%
      </span>
      <button
        onClick={() => { const c = getCenter(); zoomAt(c.x, c.y, 1.25); }}
        className="min-w-[44px] min-h-[44px] rounded-lg bg-surface-raised border border-border flex items-center justify-center text-text-muted hover:text-text transition-colors"
        aria-label="Zoom in"
      >
        <ZoomIn className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={fitToContainer}
        className="min-w-[44px] min-h-[44px] rounded-lg bg-surface-raised border border-border flex items-center justify-center text-text-muted hover:text-text transition-colors"
        aria-label="Center and fit to view"
      >
        <Crosshair className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => fullscreen ? exitFullscreenMode() : enterFullscreen()}
        className="min-w-[44px] min-h-[44px] rounded-lg bg-surface-raised border border-border flex items-center justify-center text-text-muted hover:text-text transition-colors"
        aria-label={fullscreen ? "Exit fullscreen" : "View fullscreen"}
      >
        <Maximize2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  return (
    <>
      <div
        ref={wrapperRef}
        className={
          fullscreen
            ? "fixed inset-0 z-[80] bg-ink flex flex-col"
            : "rounded-2xl border border-border bg-surface overflow-hidden flex flex-col"
        }
        style={fullscreen ? undefined : { height: "70vh" }}
      >
        {toolbar}

        <div
          ref={containerRef}
          className="overflow-hidden flex-1 relative select-none"
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
          onMouseDown={handleMouseDown}
          onDoubleClick={fitToContainer}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={src}
            alt={title || "Mindmap"}
            draggable={false}
            onLoad={() => {
              imgLoadedRef.current = true;
              // Defer one frame so the container has painted and clientWidth is real.
              requestAnimationFrame(fitToContainer);
            }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              maxWidth: "none",
              width: "auto",
              height: "auto",
              display: "block",
              transform: `translate(${t.x}px, ${t.y}px) scale(${t.scale})`,
              transformOrigin: "0 0",
              willChange: "transform",
              opacity: ready ? 1 : 0,
              transition: ready ? "none" : "opacity 0.2s",
              userSelect: "none",
              pointerEvents: "none",
            }}
          />

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none select-none">
            {/* Show touch hint on mobile, mouse hint on desktop */}
            <span className="md:hidden text-xs text-text-muted/40 whitespace-nowrap">
              Pinch to zoom · Drag to pan · Double-tap to fit
            </span>
            <span className="hidden md:block text-xs text-text-muted/40 whitespace-nowrap">
              Scroll to zoom · Drag to pan · Double-click to fit
            </span>
          </div>
        </div>
      </div>

      {/* Mobile hint — only visible on small screens when mindmap exists */}
      {!fullscreen && (
        <p className="md:hidden mt-2 text-xs text-text-muted text-center px-2">
          Mind maps are easier to view on a larger screen. Pinch or scroll to explore.
        </p>
      )}
    </>
  );
}
