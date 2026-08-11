"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Languages, X } from "lucide-react";
import { clearPartAssetsCache } from "@/lib/part-asset-cache";
import { COURSE_LANG_COOKIE, type CourseLang } from "@/lib/course-lang";
import { markArabicAnnouncementSeen } from "@/app/actions/onboarding";

interface ArabicAnnouncementBannerProps {
  show: boolean;
  lang?: CourseLang;
}

/**
 * One-time dashboard banner telling existing students the full course is now
 * available in Arabic. Shown once per account — gated by `show` (derived
 * server-side for pre-Arabic-launch accounts that have not yet dismissed it,
 * so brand-new signups aren't hit with two onboarding messages at once).
 */
export function ArabicAnnouncementBanner({ show, lang = "en" }: ArabicAnnouncementBannerProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [switching, setSwitching] = useState(false);
  const isRtl = lang === "ar";

  if (!show || dismissed) return null;

  function dismiss() {
    setDismissed(true);
    markArabicAnnouncementSeen().catch(() => {});
  }

  function switchToArabic() {
    setSwitching(true);
    document.cookie = `${COURSE_LANG_COOKIE}=ar; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    clearPartAssetsCache();
    markArabicAnnouncementSeen().catch(() => {});
    router.refresh();
  }

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="bg-gradient-to-r from-emerald-600/20 to-gold/20 border-b border-emerald-500/30"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
            <Languages className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-text">
              <span className="font-semibold">
                {isRtl ? "🎉 الدورة الآن متاحة بالكامل باللغة العربية!" : "🎉 The full course is now available in Arabic!"}
              </span>{" "}
              <span className="text-text-secondary hidden sm:inline">
                {isRtl
                  ? "جميع الأجزاء المئة — فيديو، موجز، بطاقات تعليمية، واختبارات — مترجمة بالكامل."
                  : "All 100 parts — video, briefings, flashcards, and quizzes — fully translated."}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {!isRtl && (
            <button
              onClick={switchToArabic}
              disabled={switching}
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gold hover:bg-gold-light text-ink rounded-lg px-3 py-1.5 transition-colors disabled:opacity-60 min-h-[32px]"
            >
              {switching ? "Switching…" : "Switch to Arabic"}
            </button>
          )}
          <button
            onClick={dismiss}
            className="text-text-muted hover:text-text transition-colors p-1"
            aria-label={isRtl ? "إغلاق" : "Dismiss"}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
