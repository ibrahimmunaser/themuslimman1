/**
 * Bulk EN→FR via google-translate-api-x for content shards + quizzes.
 *
 *   node scripts/fr-source/bulk-translate-fr.mjs content
 *   node scripts/fr-source/bulk-translate-fr.mjs quizzes
 *   node scripts/fr-source/bulk-translate-fr.mjs all
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { translate } from "google-translate-api-x";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const shardDir = path.join(root, "tmp", "fr-parts");
const cachePath = path.join(__dirname, "gt-cache.json");
const cache = fs.existsSync(cachePath)
  ? JSON.parse(fs.readFileSync(cachePath, "utf8"))
  : {};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function saveCache() {
  fs.writeFileSync(cachePath, JSON.stringify(cache));
}

async function tr(text) {
  if (text == null) return text;
  if (!String(text).trim()) return text;
  if (cache[text]) return cache[text];

  // Hard-split long strings into ~3000-char chunks on line boundaries
  if (text.length > 3000) {
    const chunks = [];
    let start = 0;
    while (start < text.length) {
      let end = Math.min(start + 3000, text.length);
      if (end < text.length) {
        const nl = text.lastIndexOf("\n", end);
        if (nl > start + 500) end = nl + 1;
      }
      chunks.push(text.slice(start, end));
      start = end;
    }
    const out = [];
    for (const chunk of chunks) {
      out.push(await trChunk(chunk));
    }
    const joined = out.join("");
    cache[text] = joined;
    return joined;
  }
  return trChunk(text);
}

async function trChunk(text) {
  if (cache[text]) return cache[text];
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const res = await translate(text, { from: "en", to: "fr", forceBatch: false });
      const translated = typeof res.text === "string" ? res.text : String(res);
      if (translated && translated.trim()) {
        cache[text] = translated;
        await sleep(80);
        return translated;
      }
    } catch (e) {
      console.warn(`retry ${attempt + 1}:`, e?.message || e);
      await sleep(500 * (attempt + 1));
    }
  }
  console.warn("FAILED, keeping EN:", text.slice(0, 60));
  cache[text] = text;
  return text;
}

function looksFrench(s) {
  if (!s) return true;
  if (/Lesson Overview|Lesson Purpose|Key Takeaways|Important Terms/.test(s)) return false;
  return /[àâäéèêëïîôùûüçœÀÉÈÊ]/i.test(s) || s.length < 40;
}

async function translateContent() {
  fs.mkdirSync(shardDir, { recursive: true });
  let done = 0;
  let skipped = 0;
  for (let n = 1; n <= 100; n++) {
    const outPath = path.join(shardDir, `${n}.json`);
    const enPath = path.join(shardDir, `en-${n}.json`);
    if (!fs.existsSync(enPath)) {
      console.warn("missing EN", n);
      continue;
    }
    if (fs.existsSync(outPath)) {
      const existing = JSON.parse(fs.readFileSync(outPath, "utf8"));
      if (
        existing.briefingText &&
        existing.statementOfFactsText &&
        looksFrench(existing.briefingText)
      ) {
        skipped++;
        continue;
      }
    }
    const en = JSON.parse(fs.readFileSync(enPath, "utf8"));
    console.log(`content part ${n}…`);
    const briefingText = en.briefingText ? await tr(en.briefingText) : null;
    const statementOfFactsText = en.statementOfFactsText
      ? await tr(en.statementOfFactsText)
      : null;
    fs.writeFileSync(
      outPath,
      JSON.stringify({ part: n, briefingText, statementOfFactsText }, null, 2),
    );
    done++;
    if (done % 3 === 0) saveCache();
  }
  saveCache();
  console.log(`content done: translated=${done} skipped=${skipped}`);
}

function quizToTs(exportName, quizzes) {
  const parts = Object.keys(quizzes)
    .map(Number)
    .sort((a, b) => a - b);
  let body = `import type { Quiz } from "../types";\n\nexport const ${exportName}: Record<number, Quiz> = ${JSON.stringify(
    Object.fromEntries(parts.map((n) => [n, quizzes[n]])),
    null,
    2,
  )};\n`;
  // JSON uses string keys — convert "1": to 1:
  body = body.replace(/"(\d+)":/g, "$1:");
  return body;
}

async function translateQuizBatch(enFile, outTs, exportName) {
  const en = JSON.parse(fs.readFileSync(enFile, "utf8"));
  const out = {};
  for (const key of Object.keys(en).sort((a, b) => +a - +b)) {
    const quiz = en[key];
    console.log(`quiz part ${key}…`);
    const questions = [];
    for (const q of quiz.questions) {
      const options = [];
      for (const opt of q.options) options.push(await tr(opt));
      // Map correct_answer via index when possible
      const idx = q.options.indexOf(q.correct_answer);
      let correct_answer;
      if (idx >= 0) correct_answer = options[idx];
      else correct_answer = await tr(q.correct_answer);
      questions.push({
        question_number: q.question_number,
        question: await tr(q.question),
        options,
        correct_answer,
        explanation: await tr(q.explanation),
        tags: q.tags,
        id: q.id,
      });
    }
    out[+key] = {
      part: quiz.part,
      question_count: quiz.question_count,
      questions,
    };
    if (+key % 5 === 0) saveCache();
  }
  fs.writeFileSync(outTs, quizToTs(exportName, out));
  console.log(`wrote ${outTs} (${Object.keys(out).length} parts)`);
}

async function translateQuizzes() {
  const batches = [
    ["en-qz-1-25.json", "batch-01-25.ts", "PART_QUIZ_FR_1_25"],
    ["en-qz-26-50.json", "batch-26-50.ts", "PART_QUIZ_FR_26_50"],
    ["en-qz-51-75.json", "batch-51-75.ts", "PART_QUIZ_FR_51_75"],
    ["en-qz-76-100.json", "batch-76-100.ts", "PART_QUIZ_FR_76_100"],
  ];
  const outDir = path.join(root, "lib", "fr-quizzes");
  for (const [enName, outName, exportName] of batches) {
    const outTs = path.join(outDir, outName);
    // Skip if already substantial
    if (fs.existsSync(outTs) && fs.statSync(outTs).size > 50_000) {
      console.log(`skip quizzes ${outName} (already large)`);
      continue;
    }
    await translateQuizBatch(path.join(__dirname, enName), outTs, exportName);
    saveCache();
  }
}

const mode = process.argv[2] || "all";
async function main() {
  if (mode === "content" || mode === "all") await translateContent();
  if (mode === "quizzes" || mode === "all") await translateQuizzes();
  saveCache();
  console.log("ALL DONE");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
