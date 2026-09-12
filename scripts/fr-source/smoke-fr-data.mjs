/**
 * Data-layer smoke test for French course content.
 *   node scripts/fr-source/smoke-fr-data.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const require = createRequire(import.meta.url);

function loadTsExport(rel, exportName) {
  // Use dynamic import via tsx isn't available here — parse key counts from source.
  const src = fs.readFileSync(path.join(root, rel), "utf8");
  const keys = [...src.matchAll(/\n  (\d+): \{/g)].map((m) => +m[1]);
  const uniq = [...new Set(keys)].sort((a, b) => a - b);
  return { uniq, src, exportName };
}

function assertParts(label, uniq, expect = 100) {
  const missing = [...Array(expect).keys()]
    .map((i) => i + 1)
    .filter((n) => !uniq.includes(n));
  const ok = missing.length === 0 && uniq.length >= expect;
  console.log(
    `${ok ? "OK" : "FAIL"} ${label}: ${uniq.length}/${expect}` +
      (missing.length ? ` missing=${missing.slice(0, 20).join(",")}` : ""),
  );
  return ok;
}

let allOk = true;

const content = loadTsExport("lib/part-content-data-fr.ts", "PART_CONTENT_FR");
allOk &= assertParts("PART_CONTENT_FR", content.uniq);
allOk &= !/Lesson Overview|Lesson Purpose/.test(content.src);
console.log(
  `${!/Lesson Overview/.test(content.src) ? "OK" : "FAIL"} content has no EN Lesson Overview`,
);
allOk &= /Aperçu|Leçon|Objectif|Contexte/.test(content.src);
console.log(
  `${/Aperçu|Leçon|Objectif|Contexte/.test(content.src) ? "OK" : "FAIL"} content has FR markers`,
);

const fcBatches = [
  ["lib/fr-flashcards/batch-01-25.ts", 1, 25],
  ["lib/fr-flashcards/batch-26-50.ts", 26, 50],
  ["lib/fr-flashcards/batch-51-75.ts", 51, 75],
  ["lib/fr-flashcards/batch-76-100.ts", 76, 100],
];
for (const [rel, lo, hi] of fcBatches) {
  const { uniq, src } = loadTsExport(rel, rel);
  const expected = [...Array(hi - lo + 1).keys()].map((i) => lo + i);
  const missing = expected.filter((n) => !uniq.includes(n));
  const ok = missing.length === 0;
  allOk &= ok;
  console.log(
    `${ok ? "OK" : "FAIL"} flashcards ${lo}-${hi}: ${uniq.filter((n) => n >= lo && n <= hi).length}/25` +
      (missing.length ? ` missing=${missing.join(",")}` : ""),
  );
  // sample french
  const hasFr = /[àâäéèêëïîôùûüç]/i.test(src);
  console.log(`${hasFr ? "OK" : "FAIL"} flashcards ${lo}-${hi} accents`);
  allOk &= hasFr;
}

const qzBatches = [
  ["lib/fr-quizzes/batch-01-25.ts", 1, 25],
  ["lib/fr-quizzes/batch-26-50.ts", 26, 50],
  ["lib/fr-quizzes/batch-51-75.ts", 51, 75],
  ["lib/fr-quizzes/batch-76-100.ts", 76, 100],
];
for (const [rel, lo, hi] of qzBatches) {
  const src = fs.readFileSync(path.join(root, rel), "utf8");
  const body = src
    .replace(/^import[^;]+;/m, "")
    .replace(/export const \w+[^=]*=/, "return ");
  let data;
  try {
    data = Function(body)();
  } catch (e) {
    console.log(`FAIL parse ${rel}: ${e.message}`);
    allOk = false;
    continue;
  }
  const keys = Object.keys(data)
    .map(Number)
    .sort((a, b) => a - b);
  const expected = [...Array(hi - lo + 1).keys()].map((i) => lo + i);
  const missing = expected.filter((n) => !keys.includes(n));
  let issues = 0;
  let qs = 0;
  for (const n of keys) {
    for (const q of data[n].questions || []) {
      qs++;
      if (!q.options?.includes(q.correct_answer)) issues++;
      if (/In classical Arabic|According to the text, what/.test(q.question || ""))
        issues++;
    }
  }
  const ok = missing.length === 0 && issues === 0;
  allOk &= ok;
  console.log(
    `${ok ? "OK" : "FAIL"} quizzes ${lo}-${hi}: parts=${keys.length} qs=${qs} issues=${issues}` +
      (missing.length ? ` missing=${missing.join(",")}` : ""),
  );
}

// Aggregators exist
for (const f of [
  "lib/part-flashcard-data-fr.ts",
  "lib/part-quiz-data-fr.ts",
  "lib/part-content-data-fr.ts",
]) {
  const ok = fs.existsSync(path.join(root, f));
  allOk &= ok;
  console.log(`${ok ? "OK" : "FAIL"} exists ${f}`);
}

// files.ts wires FR
const filesTs = fs.readFileSync(path.join(root, "lib/files.ts"), "utf8");
for (const needle of [
  "PART_CONTENT_FR",
  "PART_QUIZ_FR",
  "PART_FLASHCARDS_FR",
  'lang === "fr"',
]) {
  const ok = filesTs.includes(needle);
  allOk &= ok;
  console.log(`${ok ? "OK" : "FAIL"} files.ts has ${needle}`);
}

console.log(allOk ? "\nSMOKE DATA: PASS" : "\nSMOKE DATA: FAIL");
process.exit(allOk ? 0 : 1);
