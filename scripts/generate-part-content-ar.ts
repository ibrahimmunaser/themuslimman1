/**
 * Translate PART_CONTENT (English) → PART_CONTENT_AR (hardcoded Arabic).
 * Does NOT upload to or read from R2 for the output — English source is
 * lib/part-content-data.ts; output is lib/part-content-data-ar.ts.
 *
 * Requires ANTHROPIC_API_KEY.
 *
 *   ANTHROPIC_API_KEY=... npx tsx scripts/generate-part-content-ar.ts
 *
 * Env options:
 *   PARTS=1,2,3     Specific parts (overrides range)
 *   START_PART=1
 *   END_PART=100
 *   SKIP_EXISTING=1 Skip parts already in tmp/ar-parts (default 1)
 *   CONCURRENCY=2
 *   DRY_RUN=1
 *
 * Then merge shards:
 *   npx tsx scripts/merge-part-content-ar.ts
 */
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { PART_CONTENT } from "../lib/part-content-data";

for (const f of [".env.local", ".env"]) {
  const p = path.join(process.cwd(), f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY is required");
  process.exit(1);
}

const DRY_RUN = process.env.DRY_RUN === "1";
const SKIP_EXISTING = process.env.SKIP_EXISTING !== "0";
const CONCURRENCY = parseInt(process.env.CONCURRENCY ?? "2", 10);
const TOTAL = 100;

let partList: number[];
if (process.env.PARTS) {
  partList = process.env.PARTS.split(",")
    .map(Number)
    .filter((n) => n >= 1 && n <= TOTAL);
} else {
  const start = parseInt(process.env.START_PART ?? "1", 10);
  const end = parseInt(process.env.END_PART ?? String(TOTAL), 10);
  partList = Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

const shardDir = path.join(process.cwd(), "tmp", "ar-parts");
fs.mkdirSync(shardDir, { recursive: true });

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

const SYSTEM = `You are a highly accurate Arabic translator specializing in Islamic history and the Seerah of the Prophet Muhammad ﷺ. Produce scholarly Modern Standard Arabic (فصحى) for an educational course.

Rules:
1. Proper names — standard Arabic forms (محمد ﷺ, مكة, المدينة, قريش, etc.).
2. Always write ﷺ after the Prophet's name.
3. Keep Qur'anic ayah Arabic unchanged; translate only surrounding commentary.
4. Keep hadith Arabic text unchanged when present; translate explanation.
5. Preserve markdown structure EXACTLY (# ## ### - lists > blockquotes | tables **bold** *italic* ---).
6. Return ONLY the translated content — no preamble.`;

async function translate(text: string, context: string): Promise<string> {
  const msg = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 16000,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Translate the following ${context} into Arabic:\n\n${text}`,
      },
    ],
  });
  const block = msg.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type");
  return block.text.trim();
}

async function translatePart(n: number): Promise<void> {
  const out = path.join(shardDir, `${n}.json`);
  if (SKIP_EXISTING && fs.existsSync(out)) {
    console.log(`Part ${n}: skip (exists)`);
    return;
  }
  const en = PART_CONTENT[n];
  if (!en) {
    console.log(`Part ${n}: missing English`);
    return;
  }

  console.log(`Part ${n}: translating…`);
  let briefingText: string | null = null;
  let statementOfFactsText: string | null = null;

  if (en.briefingText) {
    briefingText = await translate(
      en.briefingText,
      "Seerah briefing (structured markdown)",
    );
  }
  if (en.statementOfFactsText) {
    statementOfFactsText = await translate(
      en.statementOfFactsText,
      "Seerah statement of facts (one fact per line)",
    );
  }

  const shard = { part: n, briefingText, statementOfFactsText };
  if (DRY_RUN) {
    console.log(`Part ${n}: DRY_RUN`, {
      briefing: briefingText?.length ?? 0,
      facts: statementOfFactsText?.length ?? 0,
    });
    return;
  }
  fs.writeFileSync(out, JSON.stringify(shard, null, 2), "utf8");
  console.log(`Part ${n}: wrote ${out}`);
}

async function pool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  let i = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx]);
    }
  });
  await Promise.all(workers);
}

async function main() {
  console.log(`Translating ${partList.length} parts → ${shardDir}`);
  await pool(partList, CONCURRENCY, translatePart);
  console.log("Done. Run: npx tsx scripts/merge-part-content-ar.ts");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
