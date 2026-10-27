"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import { clearPartAssetsCache } from "@/lib/part-asset-cache";
import { COURSE_LANG_OPTIONS, type CourseLang } from "@/lib/course-lang";
import { t } from "@/lib/ui-strings";

interface LangToggleProps {
  current: CourseLang;
  /** When set, only that part's asset cache is cleared; otherwise the full cache is cleared. */
  partNumber?: number;
  /** Narrow layout for a collapsed sidebar. */
  compact?: boolean;
  /** Single-row control sized for the site header. */
  nav?: boolean;
  /**
   * Larger, labeled control for marketing previews so visitors notice language options.
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

function languageLabel(lang: CourseLang): string {
  return t(lang, "languageWord");
}

function groupAriaLabel(lang: CourseLang): string {
  return t(lang, "courseLanguage");
}

function LanguageMenu({
  selected,
  onSelect,
  nav,
  compact,
  className,
}: {
  selected: CourseLang;
  onSelect: (lang: CourseLang) => void;
  nav?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const currentLabel = COURSE_LANG_OPTIONS.find((option) => option.code === selected)?.label ?? selected;

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={clsx("relative", className)}>
      <button
        type="button"
        aria-label={groupAriaLabel(selected)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        className={clsx(
          "flex w-full items-center bg-ink/40 border border-gold/35 font-semibold text-text cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/40",
          nav
            ? "h-10 min-w-[12.5rem] max-w-[16rem] ps-3 pe-8 rounded-lg text-sm"
            : compact
              ? "h-9 min-w-0 ps-2 pe-7 rounded-lg text-xs"
              : "min-h-[44px] min-w-[12.5rem] ps-3.5 pe-8 rounded-xl text-sm shadow-sm shadow-gold/10",
        )}
      >
        <span className="truncate">{currentLabel}</span>
      </button>
      <ChevronDown
        className={clsx(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 end-2.5 w-4 h-4 text-gold transition-transform",
          open && "rotate-180",
        )}
        aria-hidden
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={groupAriaLabel(selected)}
          className="absolute end-0 top-full z-[200] mt-1 max-h-72 w-full min-w-[12.5rem] overflow-auto rounded-lg border border-gold/40 bg-surface-high py-1 shadow-2xl shadow-black/70"
        >
          {COURSE_LANG_OPTIONS.map((option) => {
            const active = option.code === selected;
            return (
              <li key={option.code} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    setOpen(false);
                    onSelect(option.code);
                  }}
                  className={clsx(
                    "flex w-full items-center px-3 py-2 text-start text-sm transition-colors",
                    active
                      ? "bg-gold/20 font-semibold text-gold"
                      : "text-text hover:bg-gold/10 hover:text-gold-light",
                  )}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function LangToggle({
  current,
  partNumber,
  compact,
  nav,
  prominent,
  className,
  clientManaged,
  onChange,
}: LangToggleProps) {
  const router = useRouter();
  // Show the choice immediately. The server prop catches up after refresh.
  const [selected, setSelected] = useState(current);
  useEffect(() => {
    setSelected(current);
  }, [current]);

  function switchLang(lang: CourseLang) {
    if (lang === selected) return;
    setSelected(lang);
    // Set the cookie (1 year expiry) then refresh the server component in-place
    document.cookie = `seerah_course_lang=${lang}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    // Clear the client-side asset cache so the new lang's URLs are fetched fresh
    clearPartAssetsCache(partNumber);
    onChange?.(lang);
    if (clientManaged) return;
    // Re-run the server component with the new cookie (no full navigation)
    router.refresh();
  }

  const select = (
    <LanguageMenu
      selected={selected}
      onSelect={switchLang}
      nav={nav}
      compact={compact}
      className={prominent ? undefined : className}
    />
  );

  if (nav) return select;

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
            selected === "ar"
              ? "text-lg tracking-normal"
              : "text-[11px] uppercase tracking-[0.16em]",
          )}
        >
          {languageLabel(selected)}
        </span>
        {select}
      </div>
    );
  }

  return select;
}
