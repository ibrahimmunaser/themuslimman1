export type CourseLang = "en" | "ar";

export const COURSE_LANG_COOKIE = "seerah_course_lang";

export function parseLang(v: string | null | undefined): CourseLang {
  return v === "ar" ? "ar" : "en";
}
