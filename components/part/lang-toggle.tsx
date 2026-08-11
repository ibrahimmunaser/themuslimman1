"use client";

import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { clearPartAssetsCache } from "@/lib/part-asset-cache";
import type { CourseLang } from "@/lib/course-lang";

interface LangToggleProps {
  current: CourseLang;
  /** When set, only that part's asset cache is cleared; otherwise the full cache is cleared. */
  partNumber?: number;
  /** Narrow layout for a collapsed sidebar. */
  compact?: boolean;
  className?: string;
}

export function LangToggle({ current, partNumber, compact, className }: LangToggleProps) {
  const router = useRouter();

  function switchLang(lang: CourseLang) {
    if (lang === current) return;
    // Set the cookie (1 year expiry) then refresh the server component in-place
    document.cookie = `seerah_course_lang=${lang}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    // Clear the client-side asset cache so the new lang's URLs are fetched fresh
    clearPartAssetsCache(partNumber);
    // Re-run the server component with the new cookie (no full navigation)
    router.refresh();
  }

  return (
    <div
      className={clsx(
        "flex items-center gap-1 rounded-lg p-0.5 bg-surface-raised/60 border border-border/40",
        compact && "flex-col",
        className
      )}
      role="group"
      aria-label={current === "ar" ? "لغة الدورة" : "Course language"}
    >
      <button
        type="button"
        onClick={() => switchLang("en")}
        className={clsx(
          "rounded-md text-xs font-semibold transition-all duration-150",
          compact ? "px-1.5 py-1" : "px-2.5 py-1",
          current === "en"
            ? "bg-gold/15 text-gold shadow-sm"
            : "text-text-muted/70 hover:text-text-secondary"
        )}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => switchLang("ar")}
        className={clsx(
          "rounded-md text-xs font-semibold transition-all duration-150",
          compact ? "px-1.5 py-1" : "px-2.5 py-1",
          current === "ar"
            ? "bg-gold/15 text-gold shadow-sm"
            : "text-text-muted/70 hover:text-text-secondary"
        )}
        dir="rtl"
      >
        {compact ? "ع" : "عربي"}
      </button>
    </div>
  );
}
