/**
 * Builds lib/fr-quizzes/batch-26-50.ts from fr-qz-26-50.json
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "../..");
const frPath = path.join(__dirname, "fr-qz-26-50.json");
const enPath = path.join(__dirname, "en-qz-26-50.json");
const outPath = path.join(root, "lib/fr-quizzes/batch-26-50.ts");

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

function main() {
  const fr = JSON.parse(fs.readFileSync(frPath, "utf8"));
  const en = JSON.parse(fs.readFileSync(enPath, "utf8"));
  const issues = [];
  let total = 0;
  const parts = [];

  for (let i = 26; i <= 50; i++) {
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
      total++;
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
          const ei = eq.options.indexOf(eq.correct_answer);
          const fi = q.options.indexOf(q.correct_answer);
          if (ei !== fi) {
            issues.push(
              `Part ${i} Q${q.question_number}: answer index mismatch EN=${ei} FR=${fi}`
            );
          }
          if (q.id !== eq.id) {
            issues.push(`Part ${i} Q${q.question_number}: id mismatch`);
          }
        }
      }
      const blob = [q.question, ...q.options, q.correct_answer, q.explanation].join(
        " "
      );
      if (/\b(Which|What|Who|Where|When|How|According to|The text)\b/.test(blob)) {
        issues.push(`Part ${i} Q${q.question_number}: possible English left`);
      }
    }
    const qLines = quiz.questions.map((q) => formatQuestion(q, 6)).join(",\n");
    parts.push(`  ${i}: {
    part: ${i},
    question_count: ${quiz.question_count},
    questions: [
${qLines}
    ],
  }`);
  }

  const body = `import type { Quiz } from "../types";

export const PART_QUIZ_FR_26_50: Record<number, Quiz> = {
${parts.join(",\n")}
};
`;

  fs.writeFileSync(outPath, body, "utf8");
  console.log("Wrote", outPath);
  console.log("Parts:", Object.keys(fr).length, "Questions:", total);
  if (issues.length) {
    console.log("ISSUES:", issues.length);
    issues.slice(0, 50).forEach((x) => console.log(" -", x));
    process.exitCode = 1;
  } else {
    console.log("VERIFICATION: PASS");
  }
}

main();
