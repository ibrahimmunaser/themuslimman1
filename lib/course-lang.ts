export type CourseLang =
  | "en"
  | "ar"
  | "fr"
  | "id"
  | "ms"
  | "zh"
  | "ru"
  | "sw"
  | "es"
  | "de"
  | "tr"
  | "hi"
  | "ur"
  | "bn"
  | "fa";

export const COURSE_LANG_COOKIE = "seerah_course_lang";

export const COURSE_LANG_OPTIONS: { code: CourseLang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "fr", label: "Français" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "ms", label: "Bahasa Melayu" },
  { code: "zh", label: "中文" },
  { code: "ru", label: "Русский" },
  { code: "sw", label: "Kiswahili" },
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
  { code: "tr", label: "Türkçe" },
  { code: "hi", label: "हिन्दी" },
  { code: "ur", label: "اردو" },
  { code: "bn", label: "বাংলা" },
  { code: "fa", label: "فارسی" },
];

export const COURSE_LANGS: CourseLang[] = COURSE_LANG_OPTIONS.map((o) => o.code);

const LANG_SET = new Set<string>(COURSE_LANGS);

export function parseLang(v: string | null | undefined): CourseLang {
  if (v && LANG_SET.has(v)) return v as CourseLang;
  return "en";
}

/** Arabic, Urdu, and Persian are read right to left. */
export function isRtlLang(lang: CourseLang): boolean {
  return lang === "ar" || lang === "ur" || lang === "fa";
}

/** Mind maps exist only for the English course. */
export function courseHasMindmaps(lang: CourseLang): boolean {
  return lang === "en";
}

export interface LocalizedMedia {
  /** Top-level R2 folder for this language. */
  folder: string;
  /** Slide images live in this subfolder (`slides` for French, `slidedecks` otherwise). */
  slides: "slides" | "slidedecks";
}

/** Languages that have video, slides, and one infographic per part on R2. */
export const LOCALIZED_MEDIA: Record<Exclude<CourseLang, "en" | "ar">, LocalizedMedia> = {
  fr: { folder: "french", slides: "slides" },
  id: { folder: "Indonesian", slides: "slidedecks" },
  ms: { folder: "Malaysian", slides: "slidedecks" },
  zh: { folder: "chinese", slides: "slidedecks" },
  ru: { folder: "russian", slides: "slidedecks" },
  sw: { folder: "Kiswahili", slides: "slidedecks" },
  es: { folder: "spanish", slides: "slidedecks" },
  de: { folder: "german", slides: "slidedecks" },
  tr: { folder: "Turkish", slides: "slidedecks" },
  hi: { folder: "hindi", slides: "slidedecks" },
  ur: { folder: "urdu", slides: "slidedecks" },
  bn: { folder: "bengali", slides: "slidedecks" },
  fa: { folder: "Persian", slides: "slidedecks" },
};

export function localizedMedia(lang: CourseLang): LocalizedMedia | null {
  if (lang === "en" || lang === "ar") return null;
  return LOCALIZED_MEDIA[lang];
}

/** R2 prefixes the signed-url routes are allowed to serve for translated media. */
export function localizedMediaPrefixes(): string[] {
  return Object.values(LOCALIZED_MEDIA).flatMap((m) => [
    `${m.folder}/videos/`,
    `${m.folder}/audio/`,
    `${m.folder}/infographics/`,
    `${m.folder}/${m.slides}/`,
  ]);
}
