"use client";

import { useState, useEffect, useCallback, useLayoutEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { X } from "lucide-react";
import type { CourseLang } from "@/lib/course-lang";
import { t, tf, type UiStringKey } from "@/lib/ui-strings";
import { markWelcomeTourSeen } from "@/app/actions/onboarding";

interface TourStep {
  /** DOM id of the element to spotlight. Omitted for the intro/outro cards, which are centered. */
  targetId?: string;
  titleKey: UiStringKey;
  bodyKey: UiStringKey;
}

const STEPS: TourStep[] = [
  { titleKey: "tourWelcomeTitle", bodyKey: "tourWelcomeBody" },
  { targetId: "tab-home", titleKey: "tourHomeTitle", bodyKey: "tourHomeBody" },
  { targetId: "tab-lessons", titleKey: "tourLessonsTitle", bodyKey: "tourLessonsBody" },
  { targetId: "tab-resources", titleKey: "tourResourcesTitle", bodyKey: "tourResourcesBody" },
  { targetId: "tab-reference", titleKey: "tourReferenceTitle", bodyKey: "tourReferenceBody" },
  { targetId: "tab-progress", titleKey: "tourProgressTitle", bodyKey: "tourProgressBody" },
  { titleKey: "tourOutroTitle", bodyKey: "tourOutroBody" },
];

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const SPOTLIGHT_PAD = 8;
const CARD_WIDTH = 320;
const VIEWPORT_MARGIN = 12;

/**
 * First-run coachmark tour of the course dashboard (/seerah). Spotlights the
 * Dashboard / Lessons / Resources / Reference / Progress tabs one at a time,
 * bookended by a centered welcome + outro card. Shown once per account —
 * gated by `show` (derived server-side from User.hasSeenWelcomeTour).
 */
export function WelcomeTour({ show, lang = "en" }: { show: boolean; lang?: CourseLang }) {
  const isRtl = lang === "ar";
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const finishedRef = useRef(false);

  // Delay start slightly so the dashboard has finished its own entrance
  // animations and the tab bar has settled into its sticky position.
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => setActive(true), 900);
    return () => clearTimeout(timer);
  }, [show]);

  const step = STEPS[stepIndex];

  const measure = useCallback(() => {
    if (!step.targetId) {
      setRect(null);
      return;
    }
    const el = document.getElementById(step.targetId);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step]);

  useLayoutEffect(() => {
    if (!active) return;
    measure();
    window.addEventListener("resize", measure);
    // Tab bar is sticky (stays put while scrolling), but capture scroll too
    // in case a step ever targets a non-sticky element in the future.
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [active, measure]);

  const finish = useCallback(() => {
    setActive(false);
    if (finishedRef.current) return;
    finishedRef.current = true;
    markWelcomeTourSeen().catch(() => {});
  }, []);

  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [active, finish]);

  if (!active) return null;

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;

  const next = () => {
    if (isLast) {
      finish();
      return;
    }
    setStepIndex((i) => i + 1);
  };
  const back = () => setStepIndex((i) => Math.max(0, i - 1));

  const spotlight: Rect | null = rect
    ? {
        top: rect.top - SPOTLIGHT_PAD,
        left: rect.left - SPOTLIGHT_PAD,
        width: rect.width + SPOTLIGHT_PAD * 2,
        height: rect.height + SPOTLIGHT_PAD * 2,
      }
    : null;

  // Position the card below the spotlighted element (flipping above it when
  // there isn't enough room below), or dead-center for intro/outro steps.
  // Raw getBoundingClientRect() coordinates are direction-agnostic, so this
  // math needs no RTL-specific mirroring.
  let cardStyle: React.CSSProperties;
  if (spotlight && typeof window !== "undefined") {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const idealLeft = spotlight.left + spotlight.width / 2 - CARD_WIDTH / 2;
    const left = Math.min(Math.max(idealLeft, VIEWPORT_MARGIN), vw - CARD_WIDTH - VIEWPORT_MARGIN);
    const spaceBelow = vh - (spotlight.top + spotlight.height);
    const placeBelow = spaceBelow > 240 || spotlight.top < 240;
    cardStyle = placeBelow
      ? { position: "fixed", left, width: CARD_WIDTH, top: spotlight.top + spotlight.height + 16 }
      : { position: "fixed", left, width: CARD_WIDTH, top: Math.max(VIEWPORT_MARGIN, spotlight.top - 16), transform: "translateY(-100%)" };
  } else {
    cardStyle = { position: "fixed", top: "50%", left: "50%", width: CARD_WIDTH, transform: "translate(-50%, -50%)" };
  }

  return (
    <div
      className="fixed inset-0 z-[200]"
      role="dialog"
      aria-modal="true"
      aria-label={t(lang, "tourWelcomeTitle")}
    >
      {/* Click-blocker — the tour is modal; clicks on the page underneath do nothing */}
      <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} aria-hidden="true" />

      {/* Dark backdrop with a spotlight cutout around the current target, via the
          classic box-shadow trick (a 9999px shadow around a small box == everything
          outside that box gets darkened, with no scroll/RTL math required). */}
      {spotlight ? (
        <motion.div
          key={`ring-${stepIndex}`}
          className="fixed rounded-xl border-2 border-gold pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
            boxShadow: "0 0 0 9999px rgba(8,8,14,0.72)",
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-black/72" />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          dir={isRtl ? "rtl" : "ltr"}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={cardStyle}
          className="z-[210] bg-surface border border-border rounded-2xl shadow-2xl p-5"
        >
          <button
            onClick={finish}
            className="absolute top-3 end-3 p-1 rounded-lg text-text-muted hover:text-text hover:bg-white/5 transition-colors"
            aria-label={isRtl ? "إغلاق" : "Close"}
          >
            <X className="w-4 h-4" />
          </button>

          <h3 className="text-base font-bold text-text mb-1.5 pe-6">{t(lang, step.titleKey)}</h3>
          <p className="text-sm text-text-secondary leading-relaxed mb-4">{t(lang, step.bodyKey)}</p>

          <div className="flex items-center gap-1.5 mb-4" aria-hidden="true">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={clsx(
                  "h-1.5 rounded-full transition-all",
                  i === stepIndex ? "w-5 bg-gold" : "w-1.5 bg-border"
                )}
              />
            ))}
          </div>

          <div className="sr-only">{tf(lang, "tourStepOfN", { n: stepIndex + 1, m: STEPS.length })}</div>

          <div className="flex items-center justify-between gap-2">
            <button
              onClick={finish}
              className="text-xs font-medium text-text-muted hover:text-text-secondary transition-colors px-1"
            >
              {t(lang, "tourSkip")}
            </button>
            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  onClick={back}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-text-secondary hover:text-text hover:bg-surface-raised border border-border transition-colors"
                >
                  {t(lang, "tourBack")}
                </button>
              )}
              <button
                onClick={next}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gold hover:bg-gold-light text-ink transition-colors"
              >
                {isFirst ? t(lang, "tourStart") : isLast ? t(lang, "tourGetStarted") : t(lang, "tourNext")}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
