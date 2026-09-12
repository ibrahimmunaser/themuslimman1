import type { CourseLang } from "./course-lang";

/** Pick EN / AR / FR string for the active course language. */
export function loc(lang: CourseLang, en: string, ar: string, fr: string): string {
  if (lang === "ar") return ar;
  if (lang === "fr") return fr;
  return en;
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
  return en;
}
