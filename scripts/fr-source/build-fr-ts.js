/**
 * Builds lib/fr-quizzes/batch-51-75.ts from scripts/fr-source/fr-51-75.json
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "../..");
const frPath = path.join(__dirname, "fr-51-75.json");
const enPath = path.join(__dirname, "en-qz-51-75.json");
const outPath = path.join(root, "lib/fr-quizzes/batch-51-75.ts");

const fr = JSON.parse(fs.readFileSync(frPath, "utf8"));
const en = JSON.parse(fs.readFileSync(enPath, "utf8"));

function esc(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function qBlock(q, indent) {
  const sp = " ".repeat(indent);
  const opts = q.options.map((o) => `${sp}  "${esc(o)}",`).join("\n");
  const tags = q.tags.map((t) => `"${esc(t)}"`).join(", ");
  return `${sp}{
${sp}  question_number: ${q.question_number},
${sp}  question: "${esc(q.question)}",
${sp}  options: [
${opts}
${sp}  ],
${sp}  correct_answer: "${esc(q.correct_answer)}",
${sp}  explanation: "${esc(q.explanation)}",
${sp}  tags: [${tags}],
${sp}  id: "${esc(q.id)}",
${sp}},`;
}

const issues = [];
let totalQ = 0;
const parts = [];

for (let i = 51; i <= 75; i++) {
  const key = String(i);
  const quiz = fr[key];
  const enQuiz = en[key];
  if (!quiz) {
    issues.push(`Missing FR part ${i}`);
    continue;
  }
  if (quiz.part !== i) issues.push(`Part ${i}: part field ${quiz.part}`);
  if (quiz.question_count !== quiz.questions.length) {
    issues.push(
      `Part ${i}: question_count ${quiz.question_count} != length ${quiz.questions.length}`
    );
  }
  if (enQuiz && quiz.questions.length !== enQuiz.questions.length) {
    issues.push(
      `Part ${i}: FR qs ${quiz.questions.length} != EN qs ${enQuiz.questions.length}`
    );
  }
  for (const q of quiz.questions) {
    totalQ++;
    if (!q.options.includes(q.correct_answer)) {
      issues.push(
        `Part ${i} Q${q.question_number}: correct_answer not in options`
      );
    }
    if (enQuiz) {
      const eq = enQuiz.questions.find(
        (x) => x.question_number === q.question_number
      );
      if (eq) {
        if (JSON.stringify(q.tags) !== JSON.stringify(eq.tags)) {
          issues.push(`Part ${i} Q${q.question_number}: tags mismatch`);
        }
        if (q.id !== eq.id) {
          issues.push(`Part ${i} Q${q.question_number}: id mismatch`);
        }
      }
    }
    // crude English leftover check on question text
    const enHints =
      /\b(the|and|with|from|when|what|who|where|which|about|Messenger of Allah \[pbuh\])\b/i;
    if (enHints.test(q.question) || enHints.test(q.explanation)) {
      // soft warning only for [pbuh] and obvious English articles in questions
      if (
        /\[pbuh\]/i.test(q.question + q.explanation) ||
        /\bMessenger of Allah\b/i.test(q.question + q.explanation)
      ) {
        issues.push(`Part ${i} Q${q.question_number}: possible English leftover`);
      }
    }
  }

  const qs = quiz.questions.map((q) => qBlock(q, 6)).join("\n");
  parts.push(`  ${i}: {
    part: ${i},
    question_count: ${quiz.question_count},
    questions: [
${qs}
    ],
  },`);
}

const ts = `import type { Quiz } from "../types";

export const PART_QUIZ_FR_51_75: Record<number, Quiz> = {
${parts.join("\n")}
};
`;

fs.writeFileSync(outPath, ts);
console.log("Wrote", outPath);
console.log("Parts:", Object.keys(fr).length, "Total questions:", totalQ);
if (issues.length) {
  console.log("ISSUES:");
  issues.forEach((x) => console.log(" -", x));
  process.exitCode = 1;
} else {
  console.log("Verification OK");
}
