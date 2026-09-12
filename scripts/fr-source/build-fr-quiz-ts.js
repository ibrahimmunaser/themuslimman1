/**
 * Builds lib/fr-quizzes/batch-01-25.ts from fr-qz-1-25.json
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "../..");
const frPath = path.join(__dirname, "fr-qz-1-25.json");
const enPath = path.join(__dirname, "en-qz-1-25.json");
const outPath = path.join(root, "lib/fr-quizzes/batch-01-25.ts");

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
  const tagLines = q.tags.map((t) => `"${esc(t)}"`).join(", ");
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

function main() {
  if (!fs.existsSync(frPath)) {
    console.error("Missing", frPath);
    process.exit(1);
  }
  const fr = JSON.parse(fs.readFileSync(frPath, "utf8"));
  const en = JSON.parse(fs.readFileSync(enPath, "utf8"));

  const issues = [];
  let total = 0;
  const parts = [];

  for (let i = 1; i <= 25; i++) {
    const key = String(i);
    const quiz = fr[key];
    if (!quiz) {
      issues.push(`Missing part ${i}`);
      continue;
    }
    if (quiz.part !== i) issues.push(`Part ${i}: part field is ${quiz.part}`);
    if (quiz.question_count !== quiz.questions.length) {
      issues.push(
        `Part ${i}: question_count ${quiz.question_count} != length ${quiz.questions.length}`
      );
    }
    const enQuiz = en[key];
    if (enQuiz && quiz.questions.length !== enQuiz.questions.length) {
      issues.push(
        `Part ${i}: FR has ${quiz.questions.length} qs, EN has ${enQuiz.questions.length}`
      );
    }
    for (const q of quiz.questions) {
      if (!q.options.includes(q.correct_answer)) {
        issues.push(
          `Part ${i} Q${q.question_number}: correct_answer not in options`
        );
      }
      // Detect leftover English (heuristic: common English quiz words)
      const blob = [q.question, ...q.options, q.correct_answer, q.explanation].join(
        " "
      );
      if (/\b(Which|What|Who|Where|When|How|According to|The text)\b/.test(blob)) {
        issues.push(`Part ${i} Q${q.question_number}: possible English left`);
      }
    }
    total += quiz.questions.length;

    const qBlocks = quiz.questions
      .map((q) => formatQuestion(q, 4))
      .join(",\n");
    parts.push(`  ${i}: {
    part: ${quiz.part},
    question_count: ${quiz.question_count},
    questions: [
${qBlocks},
    ],
  }`);
  }

  const ts = `import type { Quiz } from "../types";

export const PART_QUIZ_FR_1_25: Record<number, Quiz> = {
${parts.join(",\n")}
};
`;

  fs.writeFileSync(outPath, ts, "utf8");
  console.log("Wrote", outPath);
  console.log("Parts:", Object.keys(fr).length, "Total questions:", total);
  if (issues.length) {
    console.log("ISSUES:");
    issues.forEach((x) => console.log(" -", x));
    process.exitCode = 1;
  } else {
    console.log("Verification OK");
  }
}

main();
