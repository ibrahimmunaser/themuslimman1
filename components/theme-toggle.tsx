"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Palette, Check } from "lucide-react";
import { clsx } from "clsx";
import { SITE_THEME_OPTIONS, SITE_THEME_STORAGE_KEY, DEFAULT_SITE_THEME_ID, siteThemeById } from "@/lib/site-theme";
import { loc } from "@/lib/loc";
import type { CourseLang } from "@/lib/course-lang";

interface ThemeToggleProps {
  lang: CourseLang;
  /** Narrow layout for a collapsed sidebar. */
  compact?: boolean;
  /** Icon button for a collapsed sidebar. The menu opens toward the page. */
  iconOnly?: boolean;
  /** Single-row control sized for the site header (mirrors LangToggle's `nav`). */
  nav?: boolean;
  className?: string;
}

function themeLabel(lang: CourseLang, id: string): string {
  const option = siteThemeById(id);
  return loc(lang, option.label, option.labelAr, option.labelFr);
}

function applyTheme(id: string) {
  document.documentElement.setAttribute("data-theme", id);
  try {
    localStorage.setItem(SITE_THEME_STORAGE_KEY, id);
  } catch {
    // Private browsing / storage disabled — the theme still applies for
    // this page view, it just won't persist across visits.
  }
}

/**
 * Site-wide appearance (color theme) switcher. Mirrors LangToggle's API and
 * visual language (compact/iconOnly sidebar variants) so it slots in right
 * next to the language picker. Unlike language, switching theme needs no
 * server round-trip — changing `data-theme` on <html> re-cascades every
 * `--color-*` CSS variable instantly (see globals.css), so this component
 * only tracks which swatch to show as "selected".
 */
export function ThemeToggle({ lang, compact, iconOnly, nav, className }: ThemeToggleProps) {
  const [selected, setSelected] = useState(DEFAULT_SITE_THEME_ID);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  // Read the persisted choice once on mount (the anti-flash <head> script
  // already applied it to the DOM before paint; this just syncs React state
  // for the "which swatch is checked" display).
  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    if (current) setSelected(current);
  }, []);

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

  function select(id: string) {
    setOpen(false);
    if (id === selected) return;
    setSelected(id);
    applyTheme(id);
  }

  const current = siteThemeById(selected);
  const groupLabel = loc(lang, "Appearance", "المظهر", "Apparence");

  return (
    <div ref={rootRef} className={clsx("relative", className)}>
      <button
        type="button"
        aria-label={groupLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        title={current.label}
        className={clsx(
          "flex items-center bg-ink/40 border border-gold/35 font-semibold text-text cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/40",
          iconOnly
            ? "h-9 w-9 justify-center rounded-lg"
            : nav
              ? "h-10 w-full min-w-[12.5rem] max-w-[16rem] ps-3 pe-8 rounded-lg text-sm"
              : compact
                ? "h-9 w-full min-w-0 ps-2 pe-7 rounded-lg text-xs"
                : "h-10 w-full min-w-[12.5rem] ps-3 pe-8 rounded-lg text-sm",
        )}
      >
        {iconOnly ? (
          <Palette className="w-4 h-4 text-gold" aria-hidden />
        ) : (
          <span className="flex items-center gap-2 truncate">
            <span
              className="inline-block w-3.5 h-3.5 rounded-full border border-gold/30 flex-shrink-0"
              style={{ backgroundColor: current.accent }}
              aria-hidden
            />
            <span className="truncate">{themeLabel(lang, current.id)}</span>
          </span>
        )}
      </button>
      {!iconOnly && (
        <ChevronDown
          className={clsx(
            "pointer-events-none absolute top-1/2 -translate-y-1/2 end-2.5 w-4 h-4 text-gold transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      )}
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={groupLabel}
          className={clsx(
            "absolute z-[200] max-h-80 overflow-auto rounded-lg border border-gold/40 bg-surface-high py-1 shadow-2xl shadow-black/70 grid grid-cols-1",
            iconOnly
              ? "start-full top-0 ms-2 w-64"
              : "end-0 top-full mt-1 w-full min-w-[15rem]",
          )}
        >
          {SITE_THEME_OPTIONS.map((option) => {
            const active = option.id === selected;
            return (
              <li key={option.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => select(option.id)}
                  className={clsx(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-start text-sm transition-colors",
                    active
                      ? "bg-gold/20 font-semibold text-gold"
                      : "text-text hover:bg-gold/10 hover:text-gold-light",
                  )}
                >
                  <span
                    className="inline-block w-4 h-4 rounded-full border border-white/15 flex-shrink-0"
                    style={{ backgroundColor: option.accent }}
                    aria-hidden
                  />
                  <span className="truncate flex-1">{themeLabel(lang, option.id)}</span>
                  {active && <Check className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
