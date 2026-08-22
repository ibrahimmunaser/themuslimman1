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
  /**
   * Larger, labeled control for marketing previews so visitors notice Arabic.
   * Keeps the compact sidebar style unchanged.
   */
  prominent?: boolean;
  className?: string;
  /**
   * When true, set the cookie and call onChange without router.refresh().
   * Use for client-fetched previews that reload their own data.
   */
  clientManaged?: boolean;
  onChange?: (lang: CourseLang) => void;
}

export function LangToggle({
  current,
  partNumber,
  compact,
  prominent,
  className,
  clientManaged,
  onChange,
}: LangToggleProps) {
  const router = useRouter();

  function switchLang(lang: CourseLang) {
    if (lang === current) return;
    // Set the cookie (1 year expiry) then refresh the server component in-place
    document.cookie = `seerah_course_lang=${lang}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    // Clear the client-side asset cache so the new lang's URLs are fetched fresh
    clearPartAssetsCache(partNumber);
    onChange?.(lang);
    if (clientManaged) return;
    // Re-run the server component with the new cookie (no full navigation)
    router.refresh();
  }

  if (prominent) {
    return (
      <div
        className={clsx(
          "flex flex-col items-center gap-1.5",
          className,
        )}
      >
        <span
          className={clsx(
            "font-bold text-gold",
            current === "ar"
              ? "text-lg tracking-normal"
              : "text-[11px] uppercase tracking-[0.16em]",
          )}
        >
          {current === "ar" ? "اللغة" : "Language"}
        </span>
        <div
          className="flex items-center gap-1 rounded-xl p-1 bg-ink/40 border border-gold/35 shadow-sm shadow-gold/10"
          role="group"
          aria-label={current === "ar" ? "لغة الدورة" : "Course language"}
        >
          <button
            type="button"
            onClick={() => switchLang("en")}
            className={clsx(
              "min-h-[40px] min-w-[52px] px-3.5 rounded-lg text-sm font-bold transition-all duration-150",
              current === "en"
                ? "bg-gold text-ink shadow-md shadow-gold/25"
                : "text-text-secondary hover:text-text hover:bg-surface-raised/80",
            )}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => switchLang("ar")}
            className={clsx(
              "min-h-[40px] min-w-[72px] px-3.5 rounded-lg text-base font-bold transition-all duration-150",
              current === "ar"
                ? "bg-gold text-ink shadow-md shadow-gold/25"
                : "text-text-secondary hover:text-text hover:bg-surface-raised/80",
            )}
            dir="rtl"
          >
            عربي
          </button>
        </div>
      </div>
    );
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
