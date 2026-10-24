import type { CourseLang } from "./course-lang";
import { localizeNumerals } from "./course-numbers";
import id from "../data/i18n/shell/id.json";
import ms from "../data/i18n/shell/ms.json";
import zh from "../data/i18n/shell/zh.json";
import ru from "../data/i18n/shell/ru.json";
import sw from "../data/i18n/shell/sw.json";
import es from "../data/i18n/shell/es.json";
import de from "../data/i18n/shell/de.json";
import tr from "../data/i18n/shell/tr.json";
import hi from "../data/i18n/shell/hi.json";
import ur from "../data/i18n/shell/ur.json";
import bn from "../data/i18n/shell/bn.json";
import fa from "../data/i18n/shell/fa.json";

type ShellPack = { ui?: Record<string, string>; phrases?: Record<string, string> };

const PACKS: Partial<Record<CourseLang, ShellPack>> = {
  id, ms, zh, ru, sw, es, de, tr, hi, ur, bn, fa,
};

/** UI dictionary entry for a course language that is not English, Arabic, or French. */
export function shellUi(lang: CourseLang, key: string): string | undefined {
  const value = PACKS[lang]?.ui?.[key];
  return value && value.trim() ? value : undefined;
}

/** Exact English sentence translated for the selected course language. */
export function phrase(lang: CourseLang, english: string): string {
  if (!english || lang === "en" || lang === "ar" || lang === "fr") return english;
  const value = PACKS[lang]?.phrases?.[english];
  const text = value && value.trim() ? value : english;
  return localizeNumerals(lang, text);
}
