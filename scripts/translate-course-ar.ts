/**
 * Arabic translation pipeline for the Seerah course.
 *
 * Reads English content from R2, translates each piece with Claude (Anthropic API),
 * and uploads the Arabic translations back to R2 under arabic/ prefixes.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... npx tsx scripts/translate-course-ar.ts
 *
 * Options (env vars):
 *   START_PART=1    First part to translate (default: 1)
 *   END_PART=100    Last part to translate (default: 100)
 *   PARTS=1,5,10    Comma-separated part list (overrides START/END_PART)
 *   DRY_RUN=1       Print what would be translated, don't upload
 *   SKIP_EXISTING=1 Skip parts that already have an Arabic briefing in R2 (default: 1)
 *   CONCURRENCY=2   Number of parts to translate in parallel (default: 2)
 *
 * Run while dev server is up (for content access) OR with R2 env vars directly.
 *
 * Output R2 keys:
 *   arabic/briefing/Part N Briefing Document.md
 *   arabic/statement-of-facts/Part N - Statement of Facts.md
 *   arabic/studyguides/Part N - Study Guide.md
 *   arabic/flashcards/Part_NN.json
 *   arabic/quizzes/Part_NN.json
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import path from "path";
import fs from "fs";

// ─── Config ────────────────────────────────────────────────────────────────────

// Load env from .env.local / .env
for (const f of [".env.local", ".env"]) {
  const p = path.join(__dirname, "..", f);
  if (fs.existsSync(p)) {
    const lines = fs.readFileSync(p, "utf-8").split("\n");
    for (const line of lines) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error("❌  ANTHROPIC_API_KEY is required. Set it and re-run.");
  process.exit(1);
}

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_BUCKET = process.env.R2_BUCKET!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;

if (!R2_ACCOUNT_ID || !R2_BUCKET) {
  console.error("❌  R2 credentials required (R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY).");
  process.exit(1);
}

const DRY_RUN = process.env.DRY_RUN === "1";
const SKIP_EXISTING = process.env.SKIP_EXISTING !== "0";
const CONCURRENCY = parseInt(process.env.CONCURRENCY ?? "2", 10);
const TOTAL_PARTS = 100;

let partList: number[];
if (process.env.PARTS) {
  partList = process.env.PARTS.split(",").map(Number).filter((n) => n >= 1 && n <= TOTAL_PARTS);
} else {
  const start = parseInt(process.env.START_PART ?? "1", 10);
  const end = parseInt(process.env.END_PART ?? String(TOTAL_PARTS), 10);
  partList = Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

// ─── Clients ───────────────────────────────────────────────────────────────────

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

// ─── R2 helpers ────────────────────────────────────────────────────────────────

async function r2Get(key: string): Promise<string | null> {
  try {
    const r = await r2.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    if (!r.Body) return null;
    return await r.Body.transformToString("utf-8");
  } catch {
    return null;
  }
}

async function r2GetJson<T>(key: string): Promise<T | null> {
  const txt = await r2Get(key);
  if (!txt) return null;
  try { return JSON.parse(txt) as T; } catch { return null; }
}

async function r2Put(key: string, body: string, contentType = "text/plain; charset=utf-8"): Promise<void> {
  if (DRY_RUN) {
    console.log(`  [DRY_RUN] would PUT ${key} (${body.length} chars)`);
    return;
  }
  await r2.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
}

async function r2Exists(key: string): Promise<boolean> {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

function pad2(n: number) { return String(n).padStart(2, "0"); }

// ─── Translation helpers ────────────────────────────────────────────────────────

const SEERAH_SYSTEM_PROMPT = `You are a highly accurate Arabic translator specializing in Islamic history and the Seerah (biography) of the Prophet Muhammad ﷺ. You produce scholarly, flowing Modern Standard Arabic (فصحى) suitable for an educational course.

Translation rules:
1. Proper names — use the standard Arabic forms: محمد ﷺ, مكة المكرمة, المدينة المنورة, قريش, أبو بكر الصديق, عمر بن الخطاب, عثمان بن عفان, علي بن أبي طالب, خديجة, عائشة, etc.
2. Always write ﷺ after the Prophet's name.
3. Quranic citations — keep the original Arabic ayah text unchanged; translate only surrounding commentary.
4. Hadith citations — keep hadith text in Arabic unchanged; translate only surrounding explanation.
5. Numbers and part references — keep unchanged (e.g. "Part 1" → "الجزء 1").
6. Dates (Hijri/Gregorian) — keep unchanged.
7. Tone — maintain the educational, respectful tone of an Islamic studies course.
8. Do NOT transliterate Arabic names into English within the Arabic output; use full Arabic script.
9. Return ONLY the translated content — no preamble, no metadata, no explanations.`;

async function translate(text: string, context: string): Promise<string> {
  const msg = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 8192,
    system: SEERAH_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Translate the following ${context} into Arabic:\n\n${text}`,
      },
    ],
  });
  const block = msg.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type from Claude");
  return block.text.trim();
}

// ─── Content type translators ──────────────────────────────────────────────────

async function translateBriefing(partNum: number): Promise<void> {
  const outKey = `arabic/briefing/Part ${partNum} Briefing Document.md`;
  if (SKIP_EXISTING && await r2Exists(outKey)) {
    console.log(`  ✓ briefing already exists`);
    return;
  }
  // Try markdown first, fall back to txt
  const text =
    await r2Get(`briefing/Part ${partNum} Briefing Document.md`) ??
    await r2Get(`briefing/Part ${partNum} Briefing Document.txt`);
  if (!text) { console.log(`  — no English briefing found`); return; }

  console.log(`  → translating briefing (${text.length} chars)`);
  const arabic = await translate(text, "Seerah briefing document (structured markdown notes)");
  await r2Put(outKey, arabic, "text/markdown; charset=utf-8");
  console.log(`  ✓ briefing uploaded`);
}

async function translateStatementOfFacts(partNum: number): Promise<void> {
  const outKey = `arabic/statement-of-facts/Part ${partNum} - Statement of Facts.md`;
  if (SKIP_EXISTING && await r2Exists(outKey)) {
    console.log(`  ✓ statement-of-facts already exists`);
    return;
  }
  const text =
    await r2Get(`statement-of-facts/Part ${partNum} - Statement of Facts.md`) ??
    await r2Get(`statement-of-facts/Part ${partNum} - Statement of Facts.txt`);
  if (!text) { console.log(`  — no English statement-of-facts found`); return; }

  console.log(`  → translating statement of facts (${text.length} chars)`);
  const arabic = await translate(text, "Seerah statement of facts (key historical facts in list form)");
  await r2Put(outKey, arabic, "text/markdown; charset=utf-8");
  console.log(`  ✓ statement-of-facts uploaded`);
}

async function translateStudyGuide(partNum: number): Promise<void> {
  const outKey = `arabic/studyguides/Part ${partNum} - Study Guide.md`;
  if (SKIP_EXISTING && await r2Exists(outKey)) {
    console.log(`  ✓ study guide already exists`);
    return;
  }
  const text =
    await r2Get(`studyguides/Part ${partNum} - Study Guide.md`) ??
    await r2Get(`studyguides/Part ${partNum} - Study Guide.txt`);
  if (!text) { console.log(`  — no English study guide found`); return; }

  console.log(`  → translating study guide (${text.length} chars)`);
  const arabic = await translate(text, "Seerah study guide (questions and discussion points)");
  await r2Put(outKey, arabic, "text/markdown; charset=utf-8");
  console.log(`  ✓ study guide uploaded`);
}

interface Flashcard {
  id: string;
  card_number: number;
  side1: string;
  side2: string;
  tags: string[];
  [key: string]: unknown;
}

interface FlashcardSet {
  part: number;
  counts: Record<string, number>;
  easy: Flashcard[];
  medium: Flashcard[];
  full: Flashcard[];
  [key: string]: unknown;
}

async function translateFlashcards(partNum: number): Promise<void> {
  const pad = pad2(partNum);
  const outKey = `arabic/flashcards/Part_${pad}.json`;
  if (SKIP_EXISTING && await r2Exists(outKey)) {
    console.log(`  ✓ flashcards already exist`);
    return;
  }
  const data = await r2GetJson<FlashcardSet>(`flashcards/Part_${pad}.json`);
  if (!data) { console.log(`  — no English flashcards found`); return; }

  const allCards = [...(data.full ?? [])];
  console.log(`  → translating ${allCards.length} flashcards`);

  // Translate in batches to stay within context limits
  const BATCH = 20;
  const translatedMap = new Map<string, { side1: string; side2: string }>();

  for (let i = 0; i < allCards.length; i += BATCH) {
    const batch = allCards.slice(i, i + BATCH);
    // Build a structured prompt so the model returns JSON we can parse reliably
    const prompt = JSON.stringify(
      batch.map((c) => ({ id: c.id, side1: c.side1, side2: c.side2 }))
    );
    const result = await translate(
      prompt,
      `flashcard batch as JSON array with fields id/side1/side2. Return ONLY the JSON array, no prose. Keep id unchanged.`
    );
    try {
      const parsed = JSON.parse(result) as { id: string; side1: string; side2: string }[];
      for (const c of parsed) translatedMap.set(c.id, { side1: c.side1, side2: c.side2 });
    } catch {
      console.warn(`  ⚠ JSON parse failed for flashcard batch ${i}–${i + BATCH - 1}, skipping batch`);
    }
    process.stdout.write(".");
  }
  console.log();

  function applyTranslations(cards: Flashcard[]): Flashcard[] {
    return cards.map((c) => {
      const t = translatedMap.get(c.id);
      return t ? { ...c, side1: t.side1, side2: t.side2 } : c;
    });
  }

  const output: FlashcardSet = {
    ...data,
    easy:   applyTranslations(data.easy   ?? []),
    medium: applyTranslations(data.medium ?? []),
    full:   applyTranslations(data.full   ?? []),
  };

  await r2Put(outKey, JSON.stringify(output, null, 2), "application/json");
  console.log(`  ✓ flashcards uploaded`);
}

interface QuizQuestion {
  id: string;
  question_number: number;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  tags: string[];
  [key: string]: unknown;
}

interface Quiz {
  part: number;
  question_count: number;
  questions: QuizQuestion[];
  [key: string]: unknown;
}

async function translateQuiz(partNum: number): Promise<void> {
  const pad = pad2(partNum);
  const outKey = `arabic/quizzes/Part_${pad}.json`;
  if (SKIP_EXISTING && await r2Exists(outKey)) {
    console.log(`  ✓ quiz already exists`);
    return;
  }
  const data = await r2GetJson<Quiz>(`quizzes/Part_${pad}.json`);
  if (!data) { console.log(`  — no English quiz found`); return; }

  console.log(`  → translating ${data.questions.length} quiz questions`);

  // Translate all questions in one call to preserve option ordering and correct_answer alignment
  const prompt = JSON.stringify(
    data.questions.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
    }))
  );
  const result = await translate(
    prompt,
    `quiz questions as JSON array with fields id/question/options/correct_answer/explanation. ` +
    `CRITICAL: correct_answer MUST be the exact Arabic translation of the original correct option ` +
    `(so it still matches the translated options array). Return ONLY the JSON array.`
  );

  let translatedQuestions: QuizQuestion[] = data.questions;
  try {
    const parsed = JSON.parse(result) as {
      id: string;
      question: string;
      options: string[];
      correct_answer: string;
      explanation: string;
    }[];
    const tMap = new Map(parsed.map((q) => [q.id, q]));
    translatedQuestions = data.questions.map((q) => {
      const t = tMap.get(q.id);
      if (!t) return q;
      return { ...q, question: t.question, options: t.options, correct_answer: t.correct_answer, explanation: t.explanation };
    });
  } catch {
    console.warn(`  ⚠ JSON parse failed for quiz, keeping English`);
  }

  const output: Quiz = { ...data, questions: translatedQuestions };
  await r2Put(outKey, JSON.stringify(output, null, 2), "application/json");
  console.log(`  ✓ quiz uploaded`);
}

// ─── Part runner ────────────────────────────────────────────────────────────────

async function translatePart(partNum: number): Promise<void> {
  console.log(`\n── Part ${partNum} ──────────────────────────────`);
  try {
    await translateBriefing(partNum);
    await translateStatementOfFacts(partNum);
    await translateStudyGuide(partNum);
    await translateFlashcards(partNum);
    await translateQuiz(partNum);
    console.log(`✅  Part ${partNum} done`);
  } catch (err) {
    console.error(`❌  Part ${partNum} failed:`, err);
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`🌙  Seerah Arabic Translation Pipeline`);
  console.log(`   Parts: ${partList.join(", ")}`);
  console.log(`   Concurrency: ${CONCURRENCY} | DRY_RUN: ${DRY_RUN} | SKIP_EXISTING: ${SKIP_EXISTING}`);
  console.log(`   Model: claude-opus-4-5`);
  if (DRY_RUN) console.log("   ⚠  DRY_RUN mode — nothing will be uploaded");

  // Process in controlled concurrency
  const queue = [...partList];
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length > 0) {
      const n = queue.shift()!;
      await translatePart(n);
    }
  });
  await Promise.all(workers);

  console.log(`\n🎉  Translation complete! Run with SKIP_EXISTING=0 to re-translate already-done parts.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
