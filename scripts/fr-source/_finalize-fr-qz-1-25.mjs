import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "../..");
const en = JSON.parse(
  fs.readFileSync(path.join(__dirname, "en-qz-1-25.json"), "utf8")
);
const fr = JSON.parse(
  fs.readFileSync(path.join(__dirname, "fr-qz-1-25.json"), "utf8")
);

// Fix spacing typo in part 1
fr["1"].questions[0].explanation = fr["1"].questions[0].explanation.replace(
  "arides,peu",
  "arides, peu"
);
fs.writeFileSync(
  path.join(__dirname, "fr-qz-1-25.json"),
  JSON.stringify(fr, null, 2),
  "utf8"
);

function esc(s) {
  return JSON.stringify(s);
}

let out = 'import type { Quiz } from "../types";\n\n';
out += "export const PART_QUIZ_FR_1_25: Record<number, Quiz> = {\n";

for (let i = 1; i <= 25; i++) {
  const quiz = fr[String(i)];
  out += `  ${i}: {\n`;
  out += `    part: ${quiz.part},\n`;
  out += `    question_count: ${quiz.question_count},\n`;
  out += `    questions: [\n`;
  quiz.questions.forEach((q, qi) => {
    out += `      {\n`;
    out += `        question_number: ${q.question_number},\n`;
    out += `        question: ${esc(q.question)},\n`;
    out += `        options: [\n`;
    q.options.forEach((o) => {
      out += `          ${esc(o)},\n`;
    });
    out += `        ],\n`;
    out += `        correct_answer: ${esc(q.correct_answer)},\n`;
    out += `        explanation: ${esc(q.explanation)},\n`;
    out += `        tags: [${q.tags.map((t) => esc(t)).join(", ")}],\n`;
    out += `        id: ${esc(q.id)},\n`;
    out += `      }${qi < quiz.questions.length - 1 ? "," : ""}\n`;
  });
  out += `    ],\n`;
  out += `  }${i < 25 ? "," : ""}\n`;
}
out += "};\n";

const outPath = path.join(root, "lib/fr-quizzes/batch-01-25.ts");
fs.writeFileSync(outPath, out, "utf8");

// Verification
const text = fs.readFileSync(outPath, "utf8");
const m = text.match(
  /export const PART_QUIZ_FR_1_25: Record<number, Quiz> = (\{[\s\S]*\});?\s*$/
);
if (!m) {
  console.error("PARSE FAIL");
  process.exit(1);
}
const data = eval("(" + m[1] + ")");
const fails = [];
let qCount = 0;
for (let i = 1; i <= 25; i++) {
  if (!data[i]) {
    fails.push("missing " + i);
    continue;
  }
  qCount += data[i].questions.length;
  for (const q of data[i].questions) {
    if (!q.options.includes(q.correct_answer)) {
      fails.push(`correct_answer missing ${i}:${q.question_number}`);
    }
    const enQ = en[String(i)].questions.find((x) => x.id === q.id);
    const ei = enQ.options.indexOf(enQ.correct_answer);
    const fi = q.options.indexOf(q.correct_answer);
    if (ei !== fi) fails.push(`index mismatch ${i}:${q.question_number}`);
  }
}

console.log(
  JSON.stringify(
    {
      parts: 25,
      questions: qCount,
      verification: fails.length === 0 ? "OK" : "FAIL",
      fails: fails.slice(0, 10),
      bytes: fs.statSync(outPath).size,
    },
    null,
    2
  )
);
