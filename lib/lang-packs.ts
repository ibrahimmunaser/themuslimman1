import fs from "fs";
import path from "path";
import type { CourseLang } from "./course-lang";
import type { FlashcardSet, Quiz } from "./types";

/** Languages whose Read text, quizzes, and flashcards live in data/i18n. */
export const PACK_LANGS = [
  "id", "ms", "zh", "ru", "sw", "es", "de", "tr", "hi", "ur", "bn", "fa",
] as const;

export type PackLang = (typeof PACK_LANGS)[number];

export interface LangPartPack {
  briefingText: string;
  statementOfFactsText: string;
  studyGuideText: string | null;
  quiz: Quiz | null;
  flashcards: FlashcardSet | null;
}

interface LangPackFile {
  parts: Record<string, LangPartPack>;
}

const mem = new Map<string, { revision: number; pack: LangPackFile }>();

export function isPackLang(lang: CourseLang): lang is PackLang {
  return (PACK_LANGS as readonly string[]).includes(lang);
}

function packPath(lang: PackLang): string {
  return path.join(process.cwd(), "data", "i18n", `${lang}.json`);
}

/** File mtime, or 0 when that language has no pack yet. Used to bust the part cache. */
export function langPackRevision(lang: CourseLang): number {
  if (!isPackLang(lang)) return 0;
  try {
    return fs.statSync(packPath(lang)).mtimeMs;
  } catch {
    return 0;
  }
}

export function readLangPackPart(lang: CourseLang, partNum: number): LangPartPack | null {
  if (!isPackLang(lang)) return null;
  const revision = langPackRevision(lang);
  if (!revision) return null;

  const cached = mem.get(lang);
  let pack = cached?.pack;
  if (!cached || cached.revision !== revision) {
    pack = JSON.parse(fs.readFileSync(packPath(lang), "utf8")) as LangPackFile;
    mem.set(lang, { revision, pack });
  }
  return pack?.parts?.[String(partNum)] ?? null;
}
