import fs from "fs";
import path from "path";

const dir = path.join(process.cwd(), "scripts", "ar-source");
const quizzes = JSON.parse(fs.readFileSync(path.join(dir, "en-quizzes.json"), "utf8"));
const flashes = JSON.parse(fs.readFileSync(path.join(dir, "en-flashcards.json"), "utf8"));
const ranges = [[1, 25], [26, 50], [51, 75], [76, 100]] as const;

for (const [a, b] of ranges) {
  const q: Record<string, unknown> = {};
  const f: Record<string, unknown> = {};
  for (let n = a; n <= b; n++) {
    if (quizzes[n]) q[n] = quizzes[n];
    if (flashes[n]) f[n] = flashes[n];
  }
  fs.writeFileSync(path.join(dir, `en-quizzes-${a}-${b}.json`), JSON.stringify(q, null, 2));
  fs.writeFileSync(path.join(dir, `en-flashcards-${a}-${b}.json`), JSON.stringify(f, null, 2));
  console.log(`${a}-${b}: quizzes=${Object.keys(q).length} flashcards=${Object.keys(f).length}`);
}
