/**
 * Build FR quiz TS from EN source + FR field maps (by question id).
 * FR map entry: { q, o: string[4], e }
 * correct_answer is taken from o[enCorrectIndex]
 *
 * Usage: node scripts/fr-source/_build-fr-qz-51-75.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const en = JSON.parse(
  fs.readFileSync(path.join(__dirname, "en-qz-51-75.json"), "utf8")
);

const mapFiles = [
  "fr-map-51-55.json",
  "fr-map-56-60.json",
  "fr-map-61-65.json",
  "fr-map-66-70.json",
  "fr-map-71-75.json",
];

const frMap = {};
for (const f of mapFiles) {
  const p = path.join(__dirname, f);
  if (!fs.existsSync(p)) {
    console.error("Missing", f);
    process.exit(1);
  }
  Object.assign(frMap, JSON.parse(fs.readFileSync(p, "utf8")));
}

function esc(s) {
  return JSON.stringify(s);
}

const errors = [];
let totalQ = 0;
const keys = [];
for (let i = 51; i <= 75; i++) keys.push(i);

let body = 'import type { Quiz } from "../types";\n\n';
body += "export const PART_QUIZ_FR_51_75: Record<number, Quiz> = {\n";

for (const k of keys) {
  const enQuiz = en[k];
  if (!enQuiz) {
    errors.push(`EN missing part ${k}`);
    continue;
  }
  const qs = enQuiz.questions;
  totalQ += qs.length;

  body += `  ${k}: {\n`;
  body += `    part: ${k},\n`;
  body += `    question_count: ${qs.length},\n`;
  body += `    questions: [\n`;

  for (const enQ of qs) {
    const fr = frMap[enQ.id];
    if (!fr) {
      errors.push(`Missing FR map for ${enQ.id}`);
      continue;
    }
    if (!Array.isArray(fr.o) || fr.o.length !== enQ.options.length) {
      errors.push(`${enQ.id}: option count mismatch`);
      continue;
    }
    if (typeof fr.q !== "string" || typeof fr.e !== "string") {
      errors.push(`${enQ.id}: missing q or e`);
      continue;
    }
    const enIdx = enQ.options.indexOf(enQ.correct_answer);
    if (enIdx < 0) {
      errors.push(`${enQ.id}: EN correct not in options`);
      continue;
    }
    const correct = fr.o[enIdx];

    body += `      {\n`;
    body += `        question_number: ${enQ.question_number},\n`;
    body += `        question: ${esc(fr.q)},\n`;
    body += `        options: [\n`;
    for (const o of fr.o) body += `          ${esc(o)},\n`;
    body += `        ],\n`;
    body += `        correct_answer: ${esc(correct)},\n`;
    body += `        explanation: ${esc(fr.e)},\n`;
    body += `        tags: ${esc(enQ.tags)},\n`;
    body += `        id: ${esc(enQ.id)},\n`;
    body += `      },\n`;
  }

  body += `    ],\n`;
  body += `  },\n`;
}

body += "};\n";

const outPath = path.join(root, "lib", "fr-quizzes", "batch-51-75.ts");
fs.writeFileSync(outPath, body, "utf8");

const mapped = Object.keys(frMap).length;
console.log(
  JSON.stringify(
    {
      parts: keys.length,
      questions: totalQ,
      mappedIds: mapped,
      errors: errors.length,
      errorSample: errors.slice(0, 30),
      outBytes: body.length,
      outPath,
    },
    null,
    2
  )
);

if (errors.length) process.exit(1);
