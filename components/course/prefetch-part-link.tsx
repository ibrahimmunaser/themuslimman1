"use client";

import Link from "next/link";
import { useCallback, useRef } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface PrefetchPartLinkProps {
  partNumber: number;
  /** Simple label variant — renders text + ChevronRight icon */
  label?: string;
  className?: string;
  children?: React.ReactNode;
  /** Flips the trailing chevron for RTL (Arabic) contexts. */
  isRtl?: boolean;
  /**
   * Override the destination (e.g. guests: Part 1 → public preview, other
   * parts → /pricing). Skips cache warming, since guests can't load part content.
   */
  href?: string;
}

/**
 * A Next.js Link that warms the server-side R2 cache for a part on hover,
 * so the destination page loads from cache instead of cold R2 fetches.
 *
 * Use `label` for the simple text+chevron style (stage card links).
 * Use `children` for custom content (primary CTA buttons).
 */
export function PrefetchPartLink({ partNumber, label, className, children, isRtl, href }: PrefetchPartLinkProps) {
  const warmed = useRef(false);
  const destination = href ?? `/seerah/part-${partNumber}`;

  const handleMouseEnter = useCallback(() => {
    if (href || warmed.current) return;
    warmed.current = true;
    fetch(`/api/part/${partNumber}/warm`, { method: "GET" }).catch(() => {});
  }, [partNumber, href]);

  const handleClick = useCallback(() => {
    trackEvent("lesson_nav_link_clicked", { part_number: partNumber, destination, is_override_href: !!href }, { allowDuplicates: true });
  }, [partNumber, destination, href]);

  if (label !== undefined) {
    const Chevron = isRtl ? ChevronLeft : ChevronRight;
    return (
      <Link
        href={destination}
        className={className ?? "inline-flex items-center gap-1.5 text-xs font-medium text-gold hover:text-gold-light transition-colors"}
        onMouseEnter={handleMouseEnter}
        onClick={handleClick}
      >
        {label}
        <Chevron className="w-3.5 h-3.5" />
      </Link>
    );
  }

  return (
    <Link
      href={destination}
      className={className}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}
