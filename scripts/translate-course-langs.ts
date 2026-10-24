/**
 * Translate Read (briefing, facts, study guide), flashcards, and quizzes
 * into the twelve course languages that already have video/slides/infographics.
 *
 * Resumable. Writes data/i18n/{code}.json only after all 100 parts succeed.
 * Chunk cache: scripts/i18n-work/cache/{code}.json
 *
 * Usage: npx tsx scripts/translate-course-langs.ts [fa id ...]
 */
import { config } from "dotenv";
import fs from "fs";
import path from "path";

config({ path: path.join(process.cwd(), ".env") });
config({ path: path.join(process.cwd(), ".env.local"), override: true });

const LANGS: { code: string; tl: string }[] = [
  { code: "fa", tl: "fa" },
  { code: "ur", tl: "ur" },
  { code: "hi", tl: "hi" },
  { code: "bn", tl: "bn" },
  { code: "zh", tl: "zh-CN" },
  { code: "id", tl: "id" },
  { code: "ms", tl: "ms" },
  { code: "ru", tl: "ru" },
  { code: "sw", tl: "sw" },
  { code: "es", tl: "es" },
  { code: "de", tl: "de" },
  { code: "tr", tl: "tr" },
];

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const WORK = path.join(process.cwd(), "scripts", "i18n-work");
const OUT_DIR = path.join(process.cwd(), "data", "i18n");

interface QuizQuestion {
  id: string;
  question_number: number;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  tags: string[];
}
interface Quiz {
  part: number;
  question_count: number;
  questions: QuizQuestion[];
}
interface Flashcard {
  id: string;
  card_number: number;
  side1: string;
  side2: string;
  tags: string[];
}
interface FlashcardSet {
  part: number;
  counts: { easy: number; medium: number; full: number };
  easy: Flashcard[];
  medium: Flashcard[];
  full: Flashcard[];
}
interface SourcePart {
  briefingText: string;
  statementOfFactsText: string;
  studyGuideText: string | null;
  quiz: Quiz | null;
  flashcards: FlashcardSet | null;
}

function protect(s: string): string {
  return s.replace(/ﷺ/g, "XSAWSX").replace(/ﷻ/g, "XAZWJX");
}
function restore(s: string): string {
  return s.replace(/XSAWSX/g, "ﷺ").replace(/XAZWJX/g, "ﷻ");
}

function isPassthrough(s: string): boolean {
  return !/[A-Za-z]/.test(s);
}

/** Split into translatable pieces, keeping separators so they can be joined back. */
function segment(text: string, max = 800): string[] {
  if (text.length <= max) return [text];
  const paras = text.split(/(\n\n+)/);
  const pieces: string[] = [];
  for (const part of paras) {
    if (part.length <= max) {
      pieces.push(part);
      continue;
    }
    const lines = part.split(/(\n)/);
    let buf = "";
    for (const line of lines) {
      if (buf && (buf + line).length > max) {
        pieces.push(buf);
        buf = line;
      } else {
        buf += line;
      }
    }
    if (buf) pieces.push(buf);
  }
  return pieces;
}

class Translator {
  private cache = new Map<string, string>();
  private waiters: { text: string; resolve: (s: string) => void; reject: (e: Error) => void }[] = [];
  private active = 0;
  private dirty = 0;
  private cachePath: string;
  requests = 0;

  constructor(private tl: string, private code: string) {
    this.cachePath = path.join(WORK, "cache", `${code}.json`);
    if (fs.existsSync(this.cachePath)) {
      const raw = JSON.parse(fs.readFileSync(this.cachePath, "utf8")) as Record<string, string>;
      for (const [k, v] of Object.entries(raw)) this.cache.set(k, v);
      console.log(`[${code}] cache ${this.cache.size} chunks`);
    }
  }

  async text(s: string): Promise<string> {
    if (!s) return s;
    const protectedText = protect(s);
    const parts = segment(protectedText);
    const out = await Promise.all(parts.map((p) => this.one(p)));
    return restore(out.join(""));
  }

  private one(text: string): Promise<string> {
    if (isPassthrough(text)) return Promise.resolve(text);
    const hit = this.cache.get(text);
    if (hit != null) return Promise.resolve(hit);
    return new Promise((resolve, reject) => {
      this.waiters.push({ text, resolve, reject });
      this.pump();
    });
  }

  private pump() {
    if (this.active >= 4 || this.waiters.length === 0) return;
    const batch: typeof this.waiters = [];
    let chars = 0;
    while (this.waiters.length && batch.length < 24 && chars < 4500) {
      const next = this.waiters[0];
      if (batch.length && chars + next.text.length > 4500) break;
      chars += next.text.length;
      batch.push(this.waiters.shift()!);
    }
    if (!batch.length) return;
    this.active++;
    this.runBatch(batch)
      .catch((err) => {
        for (const w of batch) w.reject(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        this.active--;
        this.pump();
      });
    if (this.waiters.length) this.pump();
  }

  private async runBatch(batch: { text: string; resolve: (s: string) => void; reject: (e: Error) => void }[]) {
    let translated: string[] | null = null;
    let lastErr = "";
    for (let attempt = 0; attempt < 4 && !translated; attempt++) {
      try {
        translated = await this.call(batch.map((b) => b.text));
      } catch (e) {
        lastErr = e instanceof Error ? e.message : String(e);
        const wait = 800 * (attempt + 1) * (attempt + 1);
        console.warn(`[${this.code}] batch retry ${attempt + 1}: ${lastErr.slice(0, 160)}`);
        await sleep(wait);
      }
    }
    if (!translated) {
      // Give up on this batch but keep the English so one failure does not stop the language.
      console.warn(`[${this.code}] batch failed, keeping English for ${batch.length} chunks`);
      translated = batch.map((b) => b.text);
    }
    for (let i = 0; i < batch.length; i++) {
      let value = translated[i] ?? batch[i].text;
      if (value.trim() === batch[i].text.trim() && /[A-Za-z]{12,}/.test(batch[i].text)) {
        try {
          const again = await this.call([batch[i].text]);
          if (again[0]) value = again[0];
        } catch {
          /* keep first result */
        }
      }
      this.cache.set(batch[i].text, value);
      this.dirty++;
      batch[i].resolve(value);
    }
    if (this.dirty >= 80) this.flush();
  }

  private async call(texts: string[]): Promise<string[]> {
    const body = texts.map((t) => "q=" + encodeURIComponent(t)).join("&");
    const res = await fetch(
      `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=en&tl=${this.tl}`,
      {
        method: "POST",
        headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded" },
        body,
      },
    );
    this.requests++;
    if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 120)}`);
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data) || data.length !== texts.length) {
      throw new Error(`shape ${JSON.stringify(data).slice(0, 180)}`);
    }
    return data.map((item, i) => {
      if (typeof item === "string") return item;
      if (Array.isArray(item) && typeof item[0] === "string") return item[0];
      return texts[i];
    });
  }

  flush() {
    if (!this.dirty) return;
    fs.mkdirSync(path.dirname(this.cachePath), { recursive: true });
    const obj: Record<string, string> = {};
    for (const [k, v] of this.cache) obj[k] = v;
    fs.writeFileSync(this.cachePath, JSON.stringify(obj));
    this.dirty = 0;
  }

  async drain() {
    while (this.waiters.length || this.active) await sleep(40);
    this.flush();
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function translateCard(card: Flashcard, tr: Translator): Promise<Flashcard> {
  const [side1, side2] = await Promise.all([tr.text(card.side1), tr.text(card.side2)]);
  return { ...card, side1, side2 };
}

async function translateCards(cards: Flashcard[] | undefined, tr: Translator): Promise<Flashcard[]> {
  if (!cards?.length) return [];
  return Promise.all(cards.map((c) => translateCard(c, tr)));
}

async function translateQuiz(quiz: Quiz | null, tr: Translator): Promise<Quiz | null> {
  if (!quiz) return null;
  const questions = await Promise.all(
    quiz.questions.map(async (q) => {
      const idx = q.options.findIndex((o) => o === q.correct_answer);
      const [question, explanation, ...options] = await Promise.all([
        tr.text(q.question),
        tr.text(q.explanation),
        ...q.options.map((o) => tr.text(o)),
      ]);
      const correct_answer = idx >= 0 ? options[idx] : await tr.text(q.correct_answer);
      return { ...q, question, options, correct_answer, explanation };
    }),
  );
  return { ...quiz, questions };
}

async function translatePart(part: SourcePart, tr: Translator): Promise<SourcePart> {
  const [briefingText, statementOfFactsText, studyGuideText, quiz, easy, medium, full] = await Promise.all([
    tr.text(part.briefingText || ""),
    tr.text(part.statementOfFactsText || ""),
    part.studyGuideText ? tr.text(part.studyGuideText) : Promise.resolve(null),
    translateQuiz(part.quiz, tr),
    translateCards(part.flashcards?.easy, tr),
    translateCards(part.flashcards?.medium, tr),
    translateCards(part.flashcards?.full, tr),
  ]);
  await tr.drain();
  const flashcards = part.flashcards
    ? { ...part.flashcards, easy, medium, full }
    : null;
  return { briefingText, statementOfFactsText, studyGuideText, quiz, flashcards };
}

function loadPartial(code: string): Record<string, SourcePart> {
  const file = path.join(WORK, `${code}.partial.json`);
  if (!fs.existsSync(file)) return {};
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as { parts?: Record<string, SourcePart> };
    return parsed.parts ?? {};
  } catch {
    return {};
  }
}

function savePartial(code: string, parts: Record<string, SourcePart>) {
  fs.mkdirSync(WORK, { recursive: true });
  const file = path.join(WORK, `${code}.partial.json`);
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify({ parts }));
  fs.renameSync(tmp, file);
}

function publish(code: string, parts: Record<string, SourcePart>) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const file = path.join(OUT_DIR, `${code}.json`);
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify({ parts }));
  fs.renameSync(tmp, file);
}

async function mapPool<T>(items: T[], limit: number, fn: (item: T, index: number) => Promise<void>) {
  let cursor = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (cursor < items.length) {
        const index = cursor++;
        await fn(items[index], index);
      }
    }),
  );
}

async function main() {
  const only = process.argv.slice(2);
  const langs = only.length ? LANGS.filter((l) => only.includes(l.code)) : LANGS;
  if (!langs.length) throw new Error("No matching language codes");

  console.log("Loading English lessons, quizzes, and flashcards…");
  const { PART_CONTENT } = await import("../lib/part-content-data");
  const { r2ReadStudyGuide } = await import("../lib/r2");
  const quizzes = JSON.parse(fs.readFileSync(path.join("scripts", "ar-source", "en-quizzes.json"), "utf8")) as Record<string, Quiz>;
  const cards = JSON.parse(fs.readFileSync(path.join("scripts", "ar-source", "en-flashcards.json"), "utf8")) as Record<string, FlashcardSet>;

  const source: Record<string, SourcePart> = {};
  let chars = 0;
  const guideMissing: number[] = [];
  await mapPool(
    Array.from({ length: 100 }, (_, i) => i + 1),
    8,
    async (n) => {
      let studyGuideText: string | null = null;
      try {
        studyGuideText = await r2ReadStudyGuide(n);
      } catch {
        studyGuideText = null;
      }
      if (!studyGuideText) guideMissing.push(n);
      const content = PART_CONTENT[n];
      const part: SourcePart = {
        briefingText: content?.briefingText ?? "",
        statementOfFactsText: content?.statementOfFactsText ?? "",
        studyGuideText,
        quiz: quizzes[String(n)] ?? quizzes[n as unknown as string] ?? null,
        flashcards: cards[String(n)] ?? cards[n as unknown as string] ?? null,
      };
      source[String(n)] = part;
      chars += part.briefingText.length + part.statementOfFactsText.length + (part.studyGuideText?.length ?? 0);
    },
  );
  console.log(
    `English source ~${Math.round(chars / 1000)}k chars of Read text. Study guides missing: ${guideMissing.length ? guideMissing.join(",") : "none"}`,
  );

  for (const lang of langs) {
    const doneFile = path.join(OUT_DIR, `${lang.code}.json`);
    if (fs.existsSync(doneFile) && !process.env.FORCE) {
      console.log(`[${lang.code}] already published, skipping`);
      continue;
    }
    const tr = new Translator(lang.tl, lang.code);
    const parts = loadPartial(lang.code);
    const pending = Array.from({ length: 100 }, (_, i) => i + 1).filter((n) => !parts[String(n)]?.briefingText);
    console.log(`[${lang.code}] ${100 - pending.length} parts already done, ${pending.length} to translate`);
    let finished = 100 - pending.length;
    await mapPool(pending, 3, async (n) => {
      const translated = await translatePart(source[String(n)], tr);
      parts[String(n)] = translated;
      finished++;
      if (finished % 5 === 0 || n === pending[0]) {
        savePartial(lang.code, parts);
        console.log(`[${lang.code}] ${finished}/100 (last part ${n}, requests ${tr.requests})`);
      }
    });
    await tr.drain();
    savePartial(lang.code, parts);
    const missing = Array.from({ length: 100 }, (_, i) => String(i + 1)).filter((k) => !parts[k]?.briefingText);
    if (missing.length) {
      console.error(`[${lang.code}] incomplete, missing parts ${missing.join(",")}`);
      continue;
    }
    publish(lang.code, parts);
    const sample = parts["1"].briefingText.slice(0, 140).replace(/\s+/g, " ");
    console.log(`[${lang.code}] published. Part 1: ${sample}`);
  }
  console.log("DONE");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
