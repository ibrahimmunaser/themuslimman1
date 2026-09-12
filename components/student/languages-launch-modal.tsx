"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Languages, X } from "lucide-react";
import type { CourseLang } from "@/lib/course-lang";
import { loc } from "@/lib/loc";
import { markLanguagesAnnouncementSeen } from "@/app/actions/onboarding";

const SHARE_URL = "https://themuslimman.com";
const SHARE_TEXT =
  "Complete Seerah is now available in English, Arabic, and French — with more languages coming. Learn the life of the Prophet ﷺ in order: https://themuslimman.com";

interface LanguagesLaunchModalProps {
  show: boolean;
  lang?: CourseLang;
}

/** Lightweight CSS confetti pieces — no extra dependency. */
function ConfettiBurst({ active }: { active: boolean }) {
  if (!active) return null;
  const pieces = Array.from({ length: 48 }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <style>{`
        @keyframes languages-confetti-fall {
          0% { opacity: 1; transform: translateY(-12px) rotate(0deg); }
          100% { opacity: 0; transform: translateY(110vh) rotate(720deg); }
        }
      `}</style>
      {pieces.map((i) => {
        const left = (i * 17 + 7) % 100;
        const delay = (i % 12) * 0.05;
        const duration = 2.2 + (i % 5) * 0.25;
        const colors = ["#C8A96E", "#25D366", "#60A5FA", "#F472B6", "#FBBF24", "#A78BFA"];
        const color = colors[i % colors.length];
        const size = 6 + (i % 4);
        return (
          <span
            key={i}
            className="absolute top-0 rounded-sm"
            style={{
              left: `${left}%`,
              width: size,
              height: size * (0.6 + (i % 3) * 0.3),
              backgroundColor: color,
              animation: `languages-confetti-fall ${duration}s ${delay}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
            }}
          />
        );
      })}
    </div>
  );
}

export function LanguagesLaunchModal({ show, lang = "en" }: LanguagesLaunchModalProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => {
      setVisible(true);
      setBurst(true);
    }, 600);
    return () => clearTimeout(t);
  }, [show]);

  function dismiss() {
    setVisible(false);
    markLanguagesAnnouncementSeen()
      .catch(() => {})
      .finally(() => router.refresh());
  }

  function shareWhatsApp() {
    markLanguagesAnnouncementSeen().catch(() => {});
    setVisible(false);
    window.open(
      `https://wa.me/?text=${encodeURIComponent(SHARE_TEXT)}`,
      "_blank",
      "noopener,noreferrer",
    );
    router.refresh();
  }

  if (!show || !visible) return null;

  const title = loc(
    lang,
    "Now in 3 languages!",
    "الآن بثلاث لغات!",
    "Désormais en 3 langues !",
  );
  const body = loc(
    lang,
    "Complete Seerah is available in English, Arabic, and French — lessons, quizzes, flashcards, and more. We plan to add more languages next.",
    "دورة السيرة الكاملة متاحة الآن بالإنجليزية والعربية والفرنسية — دروس واختبارات وبطاقات تعليمية والمزيد. ونخطط لإضافة المزيد من اللغات قريبًا.",
    "Complete Seerah est disponible en anglais, arabe et français — leçons, quiz, flashcards et plus. Nous prévoyons d'ajouter d'autres langues ensuite.",
  );
  const tip = loc(
    lang,
    "Switch anytime with the EN / عربي / FR toggle in the sidebar.",
    "بدّل اللغة في أي وقت من زر EN / عربي / FR في الشريط الجانبي.",
    "Changez à tout moment avec le basculeur EN / عربي / FR dans la barre latérale.",
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="languages-launch-title"
    >
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={dismiss} aria-hidden />
      <ConfettiBurst active={burst} />

      <div className="relative w-full max-w-md bg-surface border border-gold/30 rounded-2xl p-6 shadow-2xl overflow-hidden">
        <button
          onClick={dismiss}
          className="absolute top-4 end-4 p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-white/5 transition-colors"
          aria-label={loc(lang, "Close", "إغلاق", "Fermer")}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center mx-auto mb-4">
          <Languages className="w-7 h-7 text-gold" />
        </div>

        <h2 id="languages-launch-title" className="text-xl font-bold text-text text-center mb-2">
          {title}
        </h2>
        <p className="text-sm text-text-secondary text-center mb-3 leading-relaxed">{body}</p>
        <p className="text-xs text-text-muted text-center mb-5">{tip}</p>

        <div className="flex items-center justify-center gap-2 mb-5 text-xs font-semibold">
          <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-border text-text">EN</span>
          <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-border text-text">عربي</span>
          <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-border text-text">FR</span>
        </div>

        <a
          href={`https://wa.me/?text=${encodeURIComponent(SHARE_TEXT)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.preventDefault();
            shareWhatsApp();
          }}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20 transition-colors text-sm font-semibold mb-2"
        >
          <WhatsAppIcon />
          {loc(lang, "Share on WhatsApp", "شارك عبر واتساب", "Partager sur WhatsApp")}
        </a>

        <button
          onClick={dismiss}
          className="w-full text-xs text-text-muted hover:text-text-secondary transition-colors py-2"
        >
          {loc(lang, "Continue learning", "متابعة التعلم", "Continuer à apprendre")}
        </button>
      </div>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
