export type CourseLang = "en" | "ar" | "fr";

export const COURSE_LANG_COOKIE = "seerah_course_lang";

export const COURSE_LANGS: CourseLang[] = ["en", "ar", "fr"];

export function parseLang(v: string | null | undefined): CourseLang {
  if (v === "ar" || v === "fr") return v;
  return "en";
}

/** Arabic is the only RTL course language. */
export function isRtlLang(lang: CourseLang): boolean {
  return lang === "ar";
}
