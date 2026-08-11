/**
 * Dump all English quizzes + flashcards from R2 into local JSON
 * for offline Arabic hardcoding. Does NOT upload anything.
 *
 * Usage: npx tsx scripts/dump-en-quizzes-flashcards.ts
 */
import { config } from "dotenv";
import path from "path";
import fs from "fs";

config({ path: path.join(process.cwd(), ".env") });
config({ path: path.join(process.cwd(), ".env.local"), override: true });

import { readQuiz, readFlashcards } from "../lib/files";
import type { Quiz, FlashcardSet } from "../lib/types";

async function main() {
  const outDir = path.join(process.cwd(), "scripts", "ar-source");
  fs.mkdirSync(outDir, { recursive: true });

  const quizzes: Record<number, Quiz> = {};
  const flashcards: Record<number, FlashcardSet> = {};

  for (let n = 1; n <= 100; n++) {
    const [q, f] = await Promise.all([readQuiz(n), readFlashcards(n)]);
    if (q) quizzes[n] = q;
    if (f) flashcards[n] = f;
    if (n % 25 === 0) console.log(`… dumped through part ${n}`);
  }

  fs.writeFileSync(path.join(outDir, "en-quizzes.json"), JSON.stringify(quizzes, null, 2), "utf-8");
  fs.writeFileSync(path.join(outDir, "en-flashcards.json"), JSON.stringify(flashcards, null, 2), "utf-8");

  console.log(`Wrote ${Object.keys(quizzes).length} quizzes, ${Object.keys(flashcards).length} flashcard sets`);
  console.log(`→ ${path.join(outDir, "en-quizzes.json")}`);
  console.log(`→ ${path.join(outDir, "en-flashcards.json")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
