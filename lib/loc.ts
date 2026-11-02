import type { CourseLang } from "./course-lang";
import { phrase } from "./phrases";
import { localizeNumerals } from "./course-numbers";

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

/**
 * loc() with `{placeholder}` substitution. English keys in shell phrase packs
 * should use the same placeholders (e.g. "Cancels {date}") so all 15 languages work.
 */
export function locf(
  lang: CourseLang,
  en: string,
  ar: string,
  fr: string,
  vars: Record<string, string | number>,
): string {
  let result = loc(lang, en, ar, fr);
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{${key}}`, String(value));
  }
  return localizeNumerals(lang, result);
}
