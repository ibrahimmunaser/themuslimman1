import type { CourseLang } from "./course-lang";
import { phrase } from "./phrases";

/** Pick the string for the active course language. */
export function loc(lang: CourseLang, en: string, ar: string, fr: string): string {
  if (lang === "ar") return ar;
  if (lang === "fr") return fr;
  if (lang === "en") return en;
  return phrase(lang, en);
}

/** Like loc but FR falls back to EN when missing (optional FR). */
export function locOpt(
  lang: CourseLang,
  en: string,
  ar?: string | null,
  fr?: string | null,
): string {
  if (lang === "ar") return ar || en;
  if (lang === "fr") return fr || en;
  if (lang === "en") return en;
  return phrase(lang, en);
}
