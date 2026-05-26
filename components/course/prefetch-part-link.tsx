"use client";

import Link from "next/link";
import { useCallback, useRef } from "react";
import { ChevronRight } from "lucide-react";

interface PrefetchPartLinkProps {
  partNumber: number;
  /** Simple label variant — renders text + ChevronRight icon */
  label?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * A Next.js Link that warms the server-side R2 cache for a part on hover,
 * so the destination page loads from cache instead of cold R2 fetches.
 *
 * Use `label` for the simple text+chevron style (stage card links).
 * Use `children` for custom content (primary CTA buttons).
 */
export function PrefetchPartLink({ partNumber, label, className, children }: PrefetchPartLinkProps) {
  const warmed = useRef(false);

  const handleMouseEnter = useCallback(() => {
    if (warmed.current) return;
    warmed.current = true;
    fetch(`/api/part/${partNumber}/warm`, { method: "GET" }).catch(() => {});
  }, [partNumber]);

  if (label !== undefined) {
    return (
      <Link
        href={`/seerah/part-${partNumber}`}
        className={className ?? "inline-flex items-center gap-1.5 text-xs font-medium text-gold hover:text-gold-light transition-colors"}
        onMouseEnter={handleMouseEnter}
      >
        {label}
        <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    );
  }

  return (
    <Link
      href={`/seerah/part-${partNumber}`}
      className={className}
      onMouseEnter={handleMouseEnter}
    >
      {children}
    </Link>
  );
}
