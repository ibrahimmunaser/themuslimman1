const fs = require("fs");
const en = JSON.parse(
  fs.readFileSync("scripts/fr-source/en-qz-51-75.json", "utf8")
);
const maps = [
  "fr-map-51-55.json",
  "fr-map-56-60.json",
  "fr-map-61-65.json",
  "fr-map-66-70.json",
  "fr-map-71-75.json",
];
const frMap = {};
for (const f of maps) {
  Object.assign(
    frMap,
    JSON.parse(fs.readFileSync("scripts/fr-source/" + f, "utf8"))
  );
}

let ts = fs.readFileSync("lib/fr-quizzes/batch-51-75.ts", "utf8");
ts = ts.replace(/^import[^\n]*\n+/, "");
ts = ts.replace(
  /^export const PART_QUIZ_FR_51_75: Record<number, Quiz> = /,
  "var data = "
);
eval(ts);

const keys = Object.keys(data)
  .map(Number)
  .sort((a, b) => a - b);
let qCount = 0;
const indexMismatches = [];
const missingCorrect = [];
const issues = [];

for (const k of keys) {
  const quiz = data[k];
  if (quiz.part !== k) issues.push("part field " + k);
  if (quiz.question_count !== quiz.questions.length)
    issues.push("count " + k);
  qCount += quiz.questions.length;
  const enQs = en[k].questions;
  if (quiz.questions.length !== enQs.length) issues.push("qlen " + k);
  quiz.questions.forEach((q, i) => {
    const frIdx = q.options.indexOf(q.correct_answer);
    if (frIdx < 0) missingCorrect.push(q.id);
    const enIdx = enQs[i].options.indexOf(enQs[i].correct_answer);
    if (frIdx !== enIdx) indexMismatches.push(q.id);
    if (q.id !== enQs[i].id) issues.push("id " + q.id);
    if (JSON.stringify(q.tags) !== JSON.stringify(enQs[i].tags))
      issues.push("tags " + q.id);
    if (q.question === enQs[i].question)
      issues.push("untranslatedQ " + q.id);
    const m = frMap[q.id];
    if (m.q !== q.question) issues.push("mapQ " + q.id);
    if (JSON.stringify(m.o) !== JSON.stringify(q.options))
      issues.push("mapO " + q.id);
  });
}

const expected = [];
for (let i = 51; i <= 75; i++) expected.push(i);
const missingKeys = expected.filter((n) => !keys.includes(n));
const pass =
  missingKeys.length === 0 &&
  indexMismatches.length === 0 &&
  missingCorrect.length === 0 &&
  issues.length === 0 &&
  keys.length === 25 &&
  qCount === 332;

console.log(
  JSON.stringify(
    {
      parts: keys.length,
      questions: qCount,
      keysOk: missingKeys.length === 0,
      missingKeys,
      indexMismatches: indexMismatches.length,
      missingCorrect: missingCorrect.length,
      issues: issues.slice(0, 15),
      issueCount: issues.length,
      verification: pass ? "PASS" : "FAIL",
    },
    null,
    2
  )
);
process.exit(pass ? 0 : 1);
