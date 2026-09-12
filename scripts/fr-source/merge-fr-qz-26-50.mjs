/**
 * Merge FR quiz translation modules + EN metadata → fr-qz-26-50.json → batch-26-50.ts
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import data2630 from "./_fr-qz-data-26-30.mjs";
import data3135 from "./_fr-qz-data-31-35.mjs";
import data3640 from "./_fr-qz-data-36-40.mjs";
import data4145 from "./_fr-qz-data-41-45.mjs";
import data4650 from "./_fr-qz-data-46-50.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "../..");
const en = JSON.parse(
  fs.readFileSync(path.join(__dirname, "en-qz-26-50.json"), "utf8")
);

const frData = { ...data2630, ...data3135, ...data3640, ...data4145, ...data4650 };

function esc(s) {
  return String(s)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");
}

function formatQuestion(q, indent) {
  const sp = " ".repeat(indent);
  const optLines = q.options.map((o) => `${sp}  "${esc(o)}",`).join("\n");
  const tagLines = (q.tags || []).map((t) => `"${esc(t)}"`).join(", ");
  return `${sp}{
${sp}  question_number: ${q.question_number},
${sp}  question: "${esc(q.question)}",
${sp}  options: [
${optLines}
${sp}  ],
${sp}  correct_answer: "${esc(q.correct_answer)}",
${sp}  explanation: "${esc(q.explanation)}",
${sp}  tags: [${tagLines}],
${sp}  id: "${esc(q.id)}",
${sp}}`;
}

const issues = [];
const out = {};
let totalQ = 0;

for (let i = 26; i <= 50; i++) {
  const key = String(i);
  const enQuiz = en[key];
  const frPart = frData[i];
  if (!enQuiz) {
    issues.push(`EN missing part ${i}`);
    continue;
  }
  if (!frPart) {
    issues.push(`FR missing part ${i}`);
    continue;
  }
  if (frPart.length !== enQuiz.questions.length) {
    issues.push(
      `Part ${i}: FR ${frPart.length} qs vs EN ${enQuiz.questions.length}`
    );
  }
  const questions = enQuiz.questions.map((eq, idx) => {
    const ft = frPart[idx];
    if (!ft) {
      issues.push(`Part ${i} Q${eq.question_number}: missing FR`);
      return null;
    }
    if (!ft.options || ft.options.length !== eq.options.length) {
      issues.push(
        `Part ${i} Q${eq.question_number}: option count mismatch`
      );
    }
    const ansIdx = eq.options.indexOf(eq.correct_answer);
    if (ansIdx < 0) {
      issues.push(`Part ${i} Q${eq.question_number}: EN ans not in options`);
    }
    const correct_answer = ft.options[ansIdx];
    if (!ft.options.includes(correct_answer)) {
      issues.push(
        `Part ${i} Q${eq.question_number}: FR correct_answer not in options`
      );
    }
    const blob = [ft.question, ...ft.options, ft.explanation].join(" ");
    if (/\b(Which|What|Who|Where|When|How|According to|The text)\b/.test(blob)) {
      issues.push(`Part ${i} Q${eq.question_number}: possible English left`);
    }
    totalQ++;
    return {
      question_number: eq.question_number,
      question: ft.question,
      options: ft.options,
      correct_answer,
      explanation: ft.explanation,
      tags: eq.tags,
      id: eq.id,
    };
  }).filter(Boolean);

  out[key] = {
    part: i,
    question_count: questions.length,
    questions,
  };
}

const jsonPath = path.join(__dirname, "fr-qz-26-50.json");
fs.writeFileSync(jsonPath, JSON.stringify(out, null, 2), "utf8");

const parts = [];
for (let i = 26; i <= 50; i++) {
  const quiz = out[String(i)];
  if (!quiz) continue;
  const qLines = quiz.questions.map((q) => formatQuestion(q, 6)).join(",\n");
  parts.push(`  ${i}: {
    part: ${i},
    question_count: ${quiz.question_count},
    questions: [
${qLines}
    ],
  }`);
}

const tsPath = path.join(root, "lib/fr-quizzes/batch-26-50.ts");
fs.writeFileSync(
  tsPath,
  `import type { Quiz } from "../types";

export const PART_QUIZ_FR_26_50: Record<number, Quiz> = {
${parts.join(",\n")}
};
`,
  "utf8"
);

const keys = Object.keys(out)
  .map(Number)
  .sort((a, b) => a - b);
const expected = Array.from({ length: 25 }, (_, i) => 26 + i);
const keysOk =
  keys.length === 25 && keys.every((k, i) => k === expected[i]);

console.log("Parts:", keys.length, keysOk ? "(26-50 OK)" : "(KEY MISMATCH)");
console.log("Questions:", totalQ);
console.log("Wrote", jsonPath);
console.log("Wrote", tsPath);
if (issues.length) {
  console.log("ISSUES:", issues.length);
  issues.forEach((x) => console.log(" -", x));
  process.exitCode = 1;
} else {
  console.log("VERIFICATION: PASS — all correct_answer ∈ options, keys 26-50");
}
