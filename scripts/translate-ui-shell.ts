/**
 * Translate the student dashboard shell (tab labels, page chrome, lesson
 * titles, era names, reference copy, and sidebar facts) into the twelve
 * course languages.
 *
 * Usage: npx tsx scripts/translate-ui-shell.ts [bn fa ...]
 */
import fs from "fs";
import path from "path";
import { getErasForLang, getPartsForLang } from "../lib/content";

const LANGS: { code: string; tl: string }[] = [
  { code: "bn", tl: "bn" },
  { code: "fa", tl: "fa" },
  { code: "ur", tl: "ur" },
  { code: "hi", tl: "hi" },
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

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "data", "i18n", "shell");
const CACHE_DIR = path.join(ROOT, "scripts", "i18n-work", "cache");

const SCAN_DIRS = [
  "components/reference",
  "components/course",
  "components/resources",
  "components/student",
];
const SCAN_FILES = [
  "app/seerah/page.tsx",
  "lib/types.ts",
  "lib/ui-strings.ts",
];

function decodeTs(body: string): string {
  try {
    return JSON.parse(`"${body}"`) as string;
  } catch {
    return body
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  }
}

function isClassList(s: string): boolean {
  return s.split(/\s+/).every((tok) => /^[a-z0-9_:[\]/.%#,()+!-]+$/.test(tok));
}

function isUserText(s: string): boolean {
  const t = s.trim();
  if (t.length < 2 || !/[A-Za-z]/.test(t)) return false;
  if (/^(https?:|\/|@|#|data:)/.test(t)) return false;
  if (/\s/.test(t)) return !isClassList(t);
  return false;
}

function collectFiles(dir: string, out: string[]) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (name === "node_modules" || name === "i18n" || name === ".next") continue;
      collectFiles(full, out);
    } else if (/\.(tsx|ts)$/.test(name) && !name.endsWith(".d.ts")) {
      out.push(full);
    }
  }
}

function addPhrase(bag: Set<string>, value: string) {
  const t = value.replace(/\s+/g, " ").trim();
  if (!t || !/[A-Za-z]/.test(t)) return;
  if (t.length > 4000) return;
  bag.add(value.trim());
}

function extractUi(src: string): Record<string, string> {
  const end = src.indexOf("export type UiStringKey");
  const body = end > 0 ? src.slice(0, end) : src;
  const ui: Record<string, string> = {};
  const re = /^\s{2}(\w+):\s+\{\s*en:\s*"((?:\\.|[^"\\])*)"/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    ui[m[1]] = decodeTs(m[2]);
  }
  return ui;
}

function extractFromSource(src: string, bag: Set<string>) {
  const quoted = /"((?:\\.|[^"\\])*)"/g;
  let m: RegExpExecArray | null;
  while ((m = quoted.exec(src))) {
    const value = decodeTs(m[1]);
    if (isUserText(value)) addPhrase(bag, value);
  }
  const locRe = /loc(?:Opt)?\(\s*[\w.]+\s*,\s*"((?:\\.|[^"\\])*)"/g;
  while ((m = locRe.exec(src))) addPhrase(bag, decodeTs(m[1]));
  const ternRe = /loc(?:Opt)?\([\s\S]{0,180}?\?\s*"((?:\\.|[^"\\])*)"\s*:\s*"((?:\\.|[^"\\])*)"/g;
  while ((m = ternRe.exec(src))) {
    addPhrase(bag, decodeTs(m[1]));
    addPhrase(bag, decodeTs(m[2]));
  }
  const propRe = /(?:name|notes|summary|keyLesson|type|location|relatedParties|description|definition|whyItMatters|category|connection|region|title|subtitle|label|role|relationship|importance|outcome|heading|fact|fulfillment|clean_fact)\s*:\s*"((?:\\.|[^"\\])*)"/g;
  while ((m = propRe.exec(src))) {
    const value = decodeTs(m[1]);
    if (/[A-Za-z]/.test(value) && value.trim().length >= 2 && !value.startsWith("/") && !isClassList(value)) {
      addPhrase(bag, value);
    }
  }
}

function walkJson(node: unknown, bag: Set<string>, key?: string) {
  if (typeof node === "string") {
    if (key === "reference" || key === "id" || key === "transliteration") return;
    addPhrase(bag, node);
    return;
  }
  if (Array.isArray(node)) {
    for (const item of node) walkJson(item, bag);
    return;
  }
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) walkJson(v, bag, k);
  }
}

function protect(s: string): string {
  return s
    .replace(/ﷺ/g, "XSAWSX")
    .replace(/ﷻ/g, "XAZWJX")
    .replace(/عليه السلام/g, "XALAYHISX")
    .replace(/رضي الله عنه/g, "XRADIALLAHX")
    .replace(/رضي الله عنها/g, "XRADIALLAHAHX")
    .replace(/\{(n|m|s|title|name|date|price|part|duration|status)\}/g, (_, k) => `XPH${String(k).toUpperCase()}X`);
}

function restore(src: string, translated: string): string {
  let out = translated
    .replace(/XSAWSX/g, "ﷺ")
    .replace(/XAZWJX/g, "ﷻ")
    .replace(/XALAYHISX/g, "عليه السلام")
    .replace(/XRADIALLAHX/g, "رضي الله عنه")
    .replace(/XRADIALLAHAHX/g, "رضي الله عنها");
  const keys = [...src.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
  for (const k of keys) {
    const token = `XPH${k.toUpperCase()}X`;
    if (out.includes(token)) out = out.split(token).join(`{${k}}`);
    else if (!out.includes(`{${k}}`)) out = `${out} {${k}}`.trim();
  }
  return out;
}

class Translator {
  private cache = new Map<string, string>();
  private waiters: { text: string; resolve: (s: string) => void; reject: (e: Error) => void }[] = [];
  private active = 0;
  private dirty = 0;
  private cachePath: string;
  requests = 0;

  constructor(private tl: string, private code: string) {
    this.cachePath = path.join(CACHE_DIR, `shell-${code}.json`);
    if (fs.existsSync(this.cachePath)) {
      const raw = JSON.parse(fs.readFileSync(this.cachePath, "utf8")) as Record<string, string>;
      for (const [k, v] of Object.entries(raw)) this.cache.set(k, v);
      console.log(`[${code}] cache ${this.cache.size}`);
    }
  }

  async text(s: string): Promise<string> {
    if (!s) return s;
    if (!/[A-Za-z]/.test(s)) return s;
    const protectedText = protect(s);
    const hit = this.cache.get(protectedText);
    if (hit != null) return restore(s, hit);
    const translated = await new Promise<string>((resolve, reject) => {
      this.waiters.push({ text: protectedText, resolve, reject });
      this.pump();
    });
    return restore(s, translated);
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
        console.warn(`[${this.code}] retry ${attempt + 1}: ${lastErr.slice(0, 140)}`);
        await sleep(800 * (attempt + 1) * (attempt + 1));
      }
    }
    if (!translated) {
      console.warn(`[${this.code}] keeping English for ${batch.length} strings`);
      translated = batch.map((b) => b.text);
    }
    for (let i = 0; i < batch.length; i++) {
      const value = translated[i] ?? batch[i].text;
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
    fs.mkdirSync(CACHE_DIR, { recursive: true });
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

async function main() {
  const ui = extractUi(fs.readFileSync(path.join(ROOT, "lib", "ui-strings.ts"), "utf8"));
  const phrases = new Set<string>();
  for (const value of Object.values(ui)) addPhrase(phrases, value);

  for (const part of getPartsForLang("en")) {
    addPhrase(phrases, part.title);
    if (part.subtitle) addPhrase(phrases, part.subtitle);
  }
  for (const era of getErasForLang("en")) {
    addPhrase(phrases, era.label);
    if (era.description) addPhrase(phrases, era.description);
  }

  const files: string[] = SCAN_FILES.map((file) => path.join(ROOT, file));
  for (const dir of SCAN_DIRS) collectFiles(path.join(ROOT, dir), files);
  for (const file of files) extractFromSource(fs.readFileSync(file, "utf8"), phrases);

  for (const name of ["prophet-facts.json", "prophet-miracles.json", "prophet-prophecies.json"]) {
    walkJson(JSON.parse(fs.readFileSync(path.join(ROOT, "lib", name), "utf8")), phrases);
  }

  const phraseList = [...phrases];
  console.log(`ui keys ${Object.keys(ui).length}, phrases ${phraseList.length}, files ${files.length}`);

  const wanted = process.argv.slice(2);
  const langs = wanted.length ? LANGS.filter((l) => wanted.includes(l.code)) : LANGS;

  for (const lang of langs) {
    const started = Date.now();
    const tr = new Translator(lang.tl, lang.code);
    const uiOut: Record<string, string> = {};
    const phraseOut: Record<string, string> = {};
    const uiEntries = Object.entries(ui);
    await Promise.all(uiEntries.map(async ([key, value]) => {
      uiOut[key] = await tr.text(value);
    }));
    await Promise.all(phraseList.map(async (value) => {
      phraseOut[value] = await tr.text(value);
    }));
    await tr.drain();
    const payload = JSON.stringify({ ui: uiOut, phrases: phraseOut });
    const dest = path.join(OUT_DIR, `${lang.code}.json`);
    const tmp = dest + ".tmp";
    fs.writeFileSync(tmp, payload);
    fs.renameSync(tmp, dest);
    console.log(`[${lang.code}] wrote ${Math.round(payload.length / 1024)}KB in ${Math.round((Date.now() - started) / 1000)}s (${tr.requests} requests)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
