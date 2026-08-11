"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { COURSE_LANG_COOKIE, type CourseLang } from "@/lib/course-lang";

/** Reads the course language cookie client-side — this error boundary can't
 *  receive server props, so it detects RTL the same way the language toggle
 *  persists it (a plain cookie, not a Next.js param). */
function readLangCookie(): CourseLang {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(new RegExp(`${COURSE_LANG_COOKIE}=(ar|en)`));
  return match?.[1] === "ar" ? "ar" : "en";
}

export default function StudentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [lang, setLang] = useState<CourseLang>("en");
  const isRtl = lang === "ar";

  useEffect(() => {
    console.error(error);
    setLang(readLangCookie());
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8" dir={isRtl ? "rtl" : undefined}>
      <div className="max-w-sm w-full text-center">
        <div className="w-14 h-14 rounded-2xl bg-error/10 border border-error/20 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7 text-error" />
        </div>
        <h2 className="text-lg font-bold text-text mb-2">{isRtl ? "حدث خطأ ما" : "Something went wrong"}</h2>
        <p className="text-text-secondary text-sm mb-6">
          {error.message || (isRtl ? "حدث خطأ غير متوقع." : "An unexpected error occurred.")}
        </p>
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-xl bg-gold/10 border border-gold/30 text-gold text-sm font-medium hover:bg-gold/20 transition-colors"
        >
          {isRtl ? "حاول مرة أخرى" : "Try again"}
        </button>
      </div>
    </div>
  );
}
