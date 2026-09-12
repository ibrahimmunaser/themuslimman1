/**
 * Translate EN flashcards + quizzes → French TypeScript modules via MyMemory.
 * Usage: node scripts/fr-source/translate-fc-qz-mymemory.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");

const cachePath = path.join(__dirname, "mt-cache.json");
const cache = fs.existsSync(cachePath)
  ? JSON.parse(fs.readFileSync(cachePath, "utf8"))
  : {};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function translate(text) {
  if (!text || !String(text).trim()) return text;
  const key = text;
  if (cache[key]) return cache[key];

  // Chunk long strings
  if (text.length > 450) {
    const parts = text.split(/(?<=[.!?])\s+/);
    const out = [];
    let buf = "";
    for (const p of parts) {
      if ((buf + " " + p).trim().length > 400) {
        if (buf) out.push(await translate(buf.trim()));
        buf = p;
      } else {
        buf = buf ? `${buf} ${p}` : p;
      }
    }
    if (buf) out.push(await translate(buf.trim()));
    const joined = out.join(" ");
    cache[key] = joined;
    return joined;
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const url =
        "https://api.mymemory.translated.net/get?q=" +
        encodeURIComponent(text) +
        "&langpair=en|fr";
      const res = await fetch(url);
      const json = await res.json();
      const translated = json?.responseData?.translatedText;
      if (translated && !translated.includes("MYMEMORY WARNING")) {
        cache[key] = translated;
        if (Object.keys(cache).length % 25 === 0) {
          fs.writeFileSync(cachePath, JSON.stringify(cache));
        }
        await sleep(120);
        return translated;
      }
      await sleep(800 * (attempt + 1));
    } catch {
      await sleep(1000 * (attempt + 1));
    }
  }
  console.warn("MT failed, keeping EN:", text.slice(0, 60));
  cache[key] = text;
  return text;
}

function tsString(s) {
  return JSON.stringify(s);
}

async function translateFlashcardSet(set) {
  const out = {
    part: set.part,
    counts: set.counts,
    easy: [],
    medium: [],
    full: [],
  };
  // Drop source_file if present
  for (const tier of ["easy", "medium", "full"]) {
    for (const card of set[tier] || []) {
      out[tier].push({
        id: card.id,
        card_number: card.card_number,
        side1: await translate(card.side1),
        side2: await translate(card.side2),
        tags: card.tags,
      });
    }
  }
  return out;
}

async function translateQuiz(quiz) {
  const questions = [];
  for (const q of quiz.questions || []) {
    const options = [];
    for (const opt of q.options) {
      options.push(await translate(opt));
    }
    // Map correct_answer by index
    const idx = q.options.indexOf(q.correct_answer);
    const correct =
      idx >= 0 ? options[idx] : await translate(q.correct_answer);
    questions.push({
      question_number: q.question_number,
      question: await translate(q.question),
      options,
      correct_answer: correct,
    });
  }
  return {
    part: quiz.part,
    question_count: quiz.question_count,
    questions,
  };
}

function emitFlashcardsTs(varName, record) {
  let body = `import type { FlashcardSet } from "../types";\n\nexport const ${varName}: Record<number, FlashcardSet> = {\n`;
  for (const n of Object.keys(record)
    .map(Number)
    .sort((a, b) => a - b)) {
    body += `  ${n}: ${JSON.stringify(record[n], null, 2).replace(/\n/g, "\n  ")},\n`;
  }
  body += `};\n`;
  return body;
}

function emitQuizTs(varName, record) {
  let body = `import type { Quiz } from "../types";\n\nexport const ${varName}: Record<number, Quiz> = {\n`;
  for (const n of Object.keys(record)
    .map(Number)
    .sort((a, b) => a - b)) {
    body += `  ${n}: ${JSON.stringify(record[n], null, 2).replace(/\n/g, "\n  ")},\n`;
  }
  body += `};\n`;
  return body;
}

async function main() {
  const fcAll = JSON.parse(
    fs.readFileSync(path.join(root, "scripts/ar-source/en-flashcards.json"), "utf8"),
  );
  const qzAll = JSON.parse(
    fs.readFileSync(path.join(root, "scripts/ar-source/en-quizzes.json"), "utf8"),
  );

  const batches = [
    [1, 25, "01-25", "1_25"],
    [26, 50, "26-50", "26_50"],
    [51, 75, "51-75", "51_75"],
    [76, 100, "76-100", "76_100"],
  ];

  fs.mkdirSync(path.join(root, "lib/fr-flashcards"), { recursive: true });
  fs.mkdirSync(path.join(root, "lib/fr-quizzes"), { recursive: true });

  for (const [a, b, fileTag, varTag] of batches) {
    console.log(`\n=== Flashcards ${a}-${b} ===`);
    const fcRec = {};
    for (let n = a; n <= b; n++) {
      if (!fcAll[n]) continue;
      console.log(`  FC part ${n}`);
      fcRec[n] = await translateFlashcardSet(fcAll[n]);
    }
    const fcPath = path.join(root, `lib/fr-flashcards/batch-${fileTag}.ts`);
    fs.writeFileSync(
      fcPath,
      emitFlashcardsTs(`PART_FLASHCARDS_FR_${varTag}`, fcRec),
    );
    console.log("wrote", fcPath);

    console.log(`=== Quizzes ${a}-${b} ===`);
    const qzRec = {};
    for (let n = a; n <= b; n++) {
      if (!qzAll[n]) continue;
      console.log(`  QZ part ${n}`);
      qzRec[n] = await translateQuiz(qzAll[n]);
    }
    const qzPath = path.join(root, `lib/fr-quizzes/batch-${fileTag}.ts`);
    fs.writeFileSync(qzPath, emitQuizTs(`PART_QUIZ_FR_${varTag}`, qzRec));
    console.log("wrote", qzPath);
    fs.writeFileSync(cachePath, JSON.stringify(cache));
  }

  fs.writeFileSync(
    path.join(root, "lib/part-flashcard-data-fr.ts"),
    `import type { FlashcardSet } from "./types";
import { PART_FLASHCARDS_FR_1_25 } from "./fr-flashcards/batch-01-25";
import { PART_FLASHCARDS_FR_26_50 } from "./fr-flashcards/batch-26-50";
import { PART_FLASHCARDS_FR_51_75 } from "./fr-flashcards/batch-51-75";
import { PART_FLASHCARDS_FR_76_100 } from "./fr-flashcards/batch-76-100";

/** Hardcoded French flashcards for all 100 parts. */
export const PART_FLASHCARDS_FR: Record<number, FlashcardSet> = {
  ...PART_FLASHCARDS_FR_1_25,
  ...PART_FLASHCARDS_FR_26_50,
  ...PART_FLASHCARDS_FR_51_75,
  ...PART_FLASHCARDS_FR_76_100,
};
`,
  );

  fs.writeFileSync(
    path.join(root, "lib/part-quiz-data-fr.ts"),
    `import type { Quiz } from "./types";
import { PART_QUIZ_FR_1_25 } from "./fr-quizzes/batch-01-25";
import { PART_QUIZ_FR_26_50 } from "./fr-quizzes/batch-26-50";
import { PART_QUIZ_FR_51_75 } from "./fr-quizzes/batch-51-75";
import { PART_QUIZ_FR_76_100 } from "./fr-quizzes/batch-76-100";

/** Hardcoded French quizzes for all 100 parts. */
export const PART_QUIZ_FR: Record<number, Quiz> = {
  ...PART_QUIZ_FR_1_25,
  ...PART_QUIZ_FR_26_50,
  ...PART_QUIZ_FR_51_75,
  ...PART_QUIZ_FR_76_100,
};
`,
  );

  fs.writeFileSync(cachePath, JSON.stringify(cache));
  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
