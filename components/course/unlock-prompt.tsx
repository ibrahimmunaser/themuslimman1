"use client";

/**
 * "Unlock the full course" prompt for people who don't have access yet.
 *
 * - <UnlockPromptProvider> wraps the course shell and renders one shared popup.
 * - useUnlockPrompt() returns an `open` function. Locked lesson cards call it
 *   instead of dumping the visitor onto /pricing, so they stay on the dashboard
 *   and can keep browsing if they say "Maybe later".
 * - <UnlockBar> is a slim sticky "Unlock all parts" button for the dashboard.
 *
 * The price comes from the country-aware CountryPriceProvider in the root layout.
 */

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Lock, X, ArrowRight, ArrowLeft } from "lucide-react";
import { type CourseLang, isRtlLang } from "@/lib/course-lang";
import { loc } from "@/lib/loc";
import { tf } from "@/lib/ui-strings";
import { formatCourseNumber } from "@/lib/course-numbers";
import { GUEST_SIGN_IN_HREF } from "@/lib/guest-access";
import { PARTS } from "@/lib/content";
import { PLANS, formatPrice } from "@/lib/stripe-config";

/** Where the popup's buy button goes. `source` tags where the sale came from. */
const MONTHLY_CHECKOUT_HREF = "/checkout?plan=individual-monthly&source=dashboard_locked_part";

export interface LockedPartInfo {
  partNumber: number;
  title: string;
}

/** loc() for strings that mention the number of parts, written with an {n} placeholder. */
function locCount(lang: CourseLang, en: string, ar: string, fr: string): string {
  return loc(lang, en, ar, fr).replaceAll("{n}", formatCourseNumber(lang, PARTS.length));
}

type OpenUnlockPrompt = (part?: LockedPartInfo) => void;

// Outside a provider, fall back to the old behavior (go to pricing) so a locked
// card never becomes a dead click.
const fallbackOpen: OpenUnlockPrompt = () => {
  if (typeof window !== "undefined") window.location.assign("/pricing");
};

const UnlockPromptContext = createContext<OpenUnlockPrompt>(fallbackOpen);

export function useUnlockPrompt(): OpenUnlockPrompt {
  return useContext(UnlockPromptContext);
}

export function UnlockPromptProvider({
  lang,
  isGuest,
  children,
}: {
  lang: CourseLang;
  isGuest: boolean;
  children: ReactNode;
}) {
  const [part, setPart] = useState<LockedPartInfo | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback<OpenUnlockPrompt>((p) => {
    setPart(p ?? null);
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);

  // Stable value so consumers don't re-render when the popup toggles.
  const value = useMemo(() => open, [open]);

  return (
    <UnlockPromptContext.Provider value={value}>
      {children}
      {isOpen && <UnlockDialog part={part} lang={lang} isGuest={isGuest} onClose={close} />}
    </UnlockPromptContext.Provider>
  );
}

function UnlockDialog({
  part,
  lang,
  isGuest,
  onClose,
}: {
  part: LockedPartInfo | null;
  lang: CourseLang;
  isGuest: boolean;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const isRtl = isRtlLang(lang);
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  // Lock page scroll, close on Escape, keep Tab focus inside, restore focus on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  const partLabel = part ? tf(lang, "partN", { n: part.partNumber }) : null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="unlock-prompt-title"
        className="relative w-full max-w-md rounded-2xl border border-gold/30 bg-surface p-6 sm:p-7 shadow-2xl"
      >
        <button
          ref={closeRef}
          onClick={onClose}
          className="absolute top-3 end-3 flex h-10 w-10 items-center justify-center rounded-lg text-text-muted hover:bg-surface-raised hover:text-text transition-colors"
          aria-label={loc(lang, "Close", "إغلاق", "Fermer")}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 bg-gold/10">
          <Lock className="h-5 w-5 text-gold" />
        </div>

        {part && (
          <p className="mb-1 text-center text-xs font-semibold uppercase tracking-widest text-gold">
            {partLabel}
          </p>
        )}
        <h2
          id="unlock-prompt-title"
          className="text-center text-xl font-bold leading-snug text-text"
        >
          {part
            ? part.title
            : loc(lang, "Unlock the full Seerah course", "افتح دورة السيرة النبوية كاملة", "Débloquez le cours complet de Sîra")}
        </h2>

        <p className="mt-3 text-center text-sm leading-relaxed text-text-secondary">
          {locCount(
            lang,
            "Unlock all {n} parts — videos, briefings, flashcards and quizzes for every lesson.",
            "افتح جميع الأجزاء الـ{n} — فيديوهات وملخصات وبطاقات تعليمية واختبارات لكل درس.",
            "Débloquez les {n} parties — vidéos, briefings, flashcards et quiz pour chaque leçon.",
          )}
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <div className="flex flex-col items-stretch gap-1">
            <Link
              href={MONTHLY_CHECKOUT_HREF}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gold px-5 py-3 text-sm font-bold text-ink shadow-lg shadow-gold/20 transition-colors hover:bg-gold-light"
            >
              {loc(lang, "Subscribe — ", "اشترك — ", "S'abonner — ")}
              <span dir="ltr">{formatPrice(PLANS.monthly.price)}/month</span>
              <Arrow className="h-4 w-4 shrink-0" />
            </Link>
            <p className="text-center text-[11px] text-text-muted">
              {loc(lang, "Renews monthly. Cancel anytime.", "يتجدد شهريًا. يمكن الإلغاء في أي وقت.", "Renouvellement mensuel. Annulez à tout moment.")}
            </p>
          </div>

          <button
            onClick={onClose}
            className="min-h-[44px] rounded-xl text-sm font-medium text-text-secondary transition-colors hover:text-text"
          >
            {loc(lang, "Maybe later", "ربما لاحقًا", "Plus tard")}
          </button>
        </div>

        <p className="mt-4 text-center text-sm text-text-muted">
          {loc(lang, "7-day refund guarantee", "ضمان استرداد خلال ٧ أيام", "Garantie de remboursement de 7 jours")}
        </p>
        {isGuest && (
          <p className="mt-1.5 text-center text-sm">
            <Link
              href={GUEST_SIGN_IN_HREF}
              className="underline underline-offset-2 text-text-muted hover:text-gold"
            >
              {loc(lang, "Already purchased? Sign in", "اشتريت الدورة؟ سجّل الدخول", "Déjà acheté ? Connectez-vous")}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Slim "unlock everything" strip that sticks to the bottom of the dashboard.
 * Rendered only for people without access. Dismissible for the current visit.
 */
export function UnlockBar({ lang }: { lang: CourseLang }) {
  const [dismissed, setDismissed] = useState(false);
  const isRtl = isRtlLang(lang);
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  if (dismissed) return null;

  return (
    <div className="sticky bottom-0 z-40 border-t border-gold/30 bg-surface/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
        <p className="hidden min-w-0 flex-1 truncate text-sm text-text-secondary sm:block">
          {locCount(
            lang,
            "The First Revelation is free. Unlock all {n} parts with a monthly subscription.",
            "الوحي الأول مجاني. افتح جميع الأجزاء الـ{n} باشتراك شهري.",
            "La Première Révélation est gratuite. Débloquez les {n} parties avec un abonnement mensuel.",
          )}
        </p>
        <Link
          href={MONTHLY_CHECKOUT_HREF.replace("dashboard_locked_part", "dashboard_unlock_bar")}
          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-bold text-ink transition-colors hover:bg-gold-light sm:flex-none"
        >
          <span>
            {loc(lang, "Unlock all parts — ", "افتح جميع الأجزاء — ", "Débloquer toutes les parties — ")}
            <span dir="ltr">{formatPrice(PLANS.monthly.price)}/month</span>
          </span>
          <Arrow className="h-4 w-4 shrink-0" />
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-raised hover:text-text"
          aria-label={loc(lang, "Dismiss", "إغلاق", "Fermer")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
