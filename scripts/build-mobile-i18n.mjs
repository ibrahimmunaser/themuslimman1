/**
 * Build seerah-mobile/seerah_app/assets/i18n/{lang}.json
 * ui: Flutter chrome keys. phrases: lesson titles, era names, reference copy.
 *
 * Reuses data/i18n/shell phrases when the English text matches.
 * Usage: node scripts/build-mobile-i18n.mjs
 */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const CACHE_DIR = path.join(ROOT, "scripts", "i18n-work", "cache");
const OUT_DIR = path.join(ROOT, "seerah-mobile", "seerah_app", "assets", "i18n");
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const LANGS = [
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
  { code: "fr", tl: "fr" },
];

const KEEP = new Set(["Complete Seerah", "Guest", "The Muslim Man"]);

const CONTENT_FILES = [
  "seerah-mobile/seerah_app/lib/core/data/parts_data.dart",
  "seerah-mobile/seerah_app/lib/features/reference/data/reference_data.dart",
  "seerah-mobile/seerah_app/lib/features/reference/screens/reference_detail_screen.dart",
];

function parseString(src, i) {
  const q = src[i];
  if (q !== "'" && q !== '"') return null;
  let out = "";
  let j = i + 1;
  while (j < src.length) {
    if (src[j] === "\\") {
      const n = src[j + 1];
      if (n === "n") out += "\n";
      else if (n === "t") out += "\t";
      else if (n === "r") out += "\r";
      else out += n ?? "";
      j += 2;
      continue;
    }
    if (src[j] === q) return { value: out, end: j + 1 };
    out += src[j];
    j++;
  }
  return null;
}

function extractUi(src) {
  const ui = [];
  const re = /['"]en['"]\s*:/g;
  let m;
  while ((m = re.exec(src))) {
    let i = m.index + m[0].length;
    while (i < src.length && /\s/.test(src[i])) i++;
    const parsed = parseString(src, i);
    if (!parsed) continue;
    const before = src.slice(Math.max(0, m.index - 80), m.index);
    const keyMatch = before.match(/['"]([A-Za-z0-9]+)['"]\s*:\s*\{\s*$/);
    if (!keyMatch) continue;
    ui.push({ key: keyMatch[1], en: parsed.value });
  }
  return ui;
}

function extractLiterals(src) {
  const out = [];
  for (let i = 0; i < src.length; i++) {
    if (src[i] === "/" && src[i + 1] === "/") {
      const nl = src.indexOf("\n", i);
      i = nl === -1 ? src.length : nl;
      continue;
    }
    if (src[i] === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      i = end === -1 ? src.length : end + 1;
      continue;
    }
    if (src[i] !== "'" && src[i] !== '"') continue;
    const parsed = parseString(src, i);
    if (!parsed) continue;
    i = parsed.end - 1;
    const value = parsed.value.trim();
    if (!/[A-Za-z]/.test(value)) continue;
    if (value.includes("\n")) continue;
    if (value.length < 3) continue;
    if (/^[a-z0-9_./:-]+$/.test(value)) continue;
    if (value.startsWith("package:") || value.includes("assets/")) continue;
    if (value.startsWith("http://") || value.startsWith("https://")) continue;
    out.push(value);
  }
  return out;
}

function protect(s) {
  return s
    .replace(/Complete Seerah/g, "XBRANDX")
    .replace(/\bGuest\b/g, "XGUESTX")
    .replace(/The Muslim Man/g, "XAPPX")
    .replace(/ﷺ/g, "XSAWSX")
    .replace(/ﷻ/g, "XAZWJX")
    .replace(/ؑ/g, "XALAYHIX")
    .replace(/ؓ/g, "XRADIX")
    .replace(/\{([A-Za-z0-9_]+)\}/g, (_, k) => `XPH${k.toUpperCase()}X`)
    .replace(/https?:\/\/\S+/g, "XURLX")
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "XMAILX");
}

function restore(src, translated) {
  let out = translated
    .replace(/XBRANDX/g, "Complete Seerah")
    .replace(/XGUESTX/g, "Guest")
    .replace(/XAPPX/g, "The Muslim Man")
    .replace(/XSAWSX/g, "ﷺ")
    .replace(/XAZWJX/g, "ﷻ")
    .replace(/XALAYHIX/g, "ؑ")
    .replace(/XRADIX/g, "ؓ")
    .replace(/XURLX/g, (src.match(/https?:\/\/\S+/) || [""])[0])
    .replace(/XMAILX/g, (src.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/) || [""])[0]);
  for (const k of [...src.matchAll(/\{(\w+)\}/g)].map((m) => m[1])) {
    const token = `XPH${k.toUpperCase()}X`;
    if (out.includes(token)) out = out.split(token).join(`{${k}}`);
    else if (!out.includes(`{${k}}`)) out = `${out} {${k}}`.trim();
  }
  return out;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

class Translator {
  constructor(tl, code) {
    this.tl = tl;
    this.code = code;
    this.cache = new Map();
    this.waiters = [];
    this.active = 0;
    this.dirty = 0;
    this.requests = 0;
    this.cachePath = path.join(CACHE_DIR, `flutter-${code}.json`);
    if (fs.existsSync(this.cachePath)) {
      const raw = JSON.parse(fs.readFileSync(this.cachePath, "utf8"));
      for (const [k, v] of Object.entries(raw)) this.cache.set(k, v);
      console.log(`[${code}] cache ${this.cache.size}`);
    }
  }

  text(s) {
    if (!s || KEEP.has(s) || !/[A-Za-z]/.test(s)) return Promise.resolve(s);
    const protectedText = protect(s);
    const hit = this.cache.get(protectedText);
    if (hit != null) return Promise.resolve(restore(s, hit));
    return new Promise((resolve, reject) => {
      this.waiters.push({ text: protectedText, src: s, resolve, reject });
      this.pump();
    });
  }

  pump() {
    if (this.active >= 3 || this.waiters.length === 0) return;
    const batch = [];
    let chars = 0;
    while (this.waiters.length && batch.length < 20 && chars < 4000) {
      const next = this.waiters[0];
      if (batch.length && chars + next.text.length > 4000) break;
      chars += next.text.length;
      batch.push(this.waiters.shift());
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

  async runBatch(batch) {
    let translated = null;
    let lastErr = "";
    for (let attempt = 0; attempt < 4 && !translated; attempt++) {
      try {
        translated = await this.call(batch.map((b) => b.text));
      } catch (e) {
        lastErr = e instanceof Error ? e.message : String(e);
        console.warn(`[${this.code}] retry ${attempt + 1}: ${lastErr.slice(0, 160)}`);
        await sleep(900 * (attempt + 1) * (attempt + 1));
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
      batch[i].resolve(restore(batch[i].src, value));
    }
    if (this.dirty >= 60) this.flush();
  }

  async call(texts) {
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
    const data = await res.json();
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
    const obj = {};
    for (const [k, v] of this.cache) obj[k] = v;
    fs.writeFileSync(this.cachePath, JSON.stringify(obj));
    this.dirty = 0;
  }

  async drain() {
    while (this.waiters.length || this.active) await sleep(40);
    this.flush();
  }
}

function loadShell(code) {
  const file = path.join(ROOT, "data", "i18n", "shell", `${code}.json`);
  if (!fs.existsSync(file)) return {};
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  return json.phrases || {};
}

async function main() {
  const ui = extractUi(fs.readFileSync(path.join(ROOT, "seerah-mobile/seerah_app/lib/l10n/app_strings.dart"), "utf8"));
  const phrases = new Set();
  for (const rel of CONTENT_FILES) {
    for (const value of extractLiterals(fs.readFileSync(path.join(ROOT, rel), "utf8"))) phrases.add(value);
  }
  console.log(`ui ${ui.length}, content phrases ${phrases.size}`);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const lang of LANGS) {
    const shell = loadShell(lang.code);
    const tr = new Translator(lang.tl, lang.code);
    const phraseOut = {};
    const pending = [];
    for (const text of phrases) {
      if (KEEP.has(text)) {
        phraseOut[text] = text;
        continue;
      }
      if (shell[text]) {
        phraseOut[text] = shell[text];
        continue;
      }
      pending.push(text);
    }
    const uiOut = {};
    const uiPending = [];
    for (const row of ui) {
      if (KEEP.has(row.en)) {
        uiOut[row.key] = row.en;
        continue;
      }
      if (shell[row.en]) {
        uiOut[row.key] = shell[row.en];
        continue;
      }
      uiPending.push(row);
    }
    console.log(`[${lang.code}] reuse ${Object.keys(phraseOut).length} phrases, translate ${pending.length} phrases + ${uiPending.length} ui`);
    const jobs = [
      ...pending.map(async (text) => {
        phraseOut[text] = await tr.text(text);
      }),
      ...uiPending.map(async (row) => {
        uiOut[row.key] = await tr.text(row.en);
      }),
    ];
    await Promise.all(jobs);
    await tr.drain();
    const out = { ui: uiOut, phrases: phraseOut };
    fs.writeFileSync(path.join(OUT_DIR, `${lang.code}.json`), JSON.stringify(out));
    console.log(`[${lang.code}] wrote ui ${Object.keys(uiOut).length} phrases ${Object.keys(phraseOut).length} requests ${tr.requests}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
