/**
 * Translate EN briefing + SoF → French shards via MyMemory, then merge.
 * Prioritizes statementOfFacts (shorter); briefings translated in chunks.
 * Usage: node scripts/fr-source/translate-content-mymemory.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const require = createRequire(import.meta.url);

// Load PART_CONTENT via dynamic import of generated JSON extract
const extractScript = path.join(root, "scripts/extract-en-text-for-fr.mjs");

const cachePath = path.join(__dirname, "mt-content-cache.json");
const cache = fs.existsSync(cachePath)
  ? JSON.parse(fs.readFileSync(cachePath, "utf8"))
  : {};
const shardDir = path.join(root, "tmp", "fr-parts");
fs.mkdirSync(shardDir, { recursive: true });

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function translate(text) {
  if (!text || !String(text).trim()) return text;
  if (cache[text]) return cache[text];

  // Split by paragraphs for long content
  if (text.length > 400) {
    const paras = text.split(/\n\n+/);
    const out = [];
    for (const para of paras) {
      if (!para.trim()) {
        out.push("");
        continue;
      }
      if (para.length <= 400) {
        out.push(await translateChunk(para));
      } else {
        // Split by lines
        const lines = para.split("\n");
        const bufs = [];
        let buf = "";
        for (const line of lines) {
          if ((buf + "\n" + line).length > 380) {
            if (buf) bufs.push(await translateChunk(buf));
            buf = line;
          } else {
            buf = buf ? `${buf}\n${line}` : line;
          }
        }
        if (buf) bufs.push(await translateChunk(buf));
        out.push(bufs.join("\n"));
      }
    }
    const joined = out.join("\n\n");
    cache[text] = joined;
    return joined;
  }
  return translateChunk(text);
}

async function translateChunk(text) {
  if (cache[text]) return cache[text];
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const url =
        "https://api.mymemory.translated.net/get?q=" +
        encodeURIComponent(text) +
        "&langpair=en|fr";
      const res = await fetch(url);
      const json = await res.json();
      const translated = json?.responseData?.translatedText;
      if (translated && !String(translated).includes("MYMEMORY WARNING")) {
        cache[text] = translated;
        await sleep(150);
        return translated;
      }
      await sleep(900 * (attempt + 1));
    } catch {
      await sleep(1000 * (attempt + 1));
    }
  }
  cache[text] = text;
  return text;
}

async function extractEn() {
  // Parse part-content-data.ts lightly by requiring via tsx isn't available;
  // use existing extract script if present, else regex-parse.
  if (fs.existsSync(extractScript)) {
    const { spawnSync } = await import("child_process");
    spawnSync("node", [extractScript], { cwd: root, stdio: "inherit" });
  }

  // Fallback: read en shards if extract created them
  const enShards = {};
  for (let n = 1; n <= 100; n++) {
    const p = path.join(shardDir, `en-${n}.json`);
    if (fs.existsSync(p)) {
      enShards[n] = JSON.parse(fs.readFileSync(p, "utf8"));
    }
  }
  if (Object.keys(enShards).length > 0) return enShards;

  // Last resort: spawn tsx extract inline
  console.log("No en shards; running inline extract via regex on part-content-data.ts…");
  // Too heavy — create minimal SoF-only from a dump if needed
  return {};
}

async function main() {
  let enShards = await extractEn();
  if (Object.keys(enShards).length === 0) {
    console.error("No English shards found. Run: node scripts/extract-en-text-for-fr.mjs");
    process.exit(1);
  }

  console.log(`Translating ${Object.keys(enShards).length} parts…`);
  for (let n = 1; n <= 100; n++) {
    const outPath = path.join(shardDir, `${n}.json`);
    if (fs.existsSync(outPath) && process.env.SKIP_EXISTING !== "0") {
      const existing = JSON.parse(fs.readFileSync(outPath, "utf8"));
      if (existing.briefingText && existing.statementOfFactsText) {
        console.log(`skip ${n}`);
        continue;
      }
    }
    const en = enShards[n];
    if (!en) continue;
    console.log(`part ${n}…`);
    const statementOfFactsText = en.statementOfFactsText
      ? await translate(en.statementOfFactsText)
      : null;
    const briefingText = en.briefingText ? await translate(en.briefingText) : null;
    fs.writeFileSync(
      outPath,
      JSON.stringify({ part: n, briefingText, statementOfFactsText }, null, 2),
    );
    if (n % 5 === 0) fs.writeFileSync(cachePath, JSON.stringify(cache));
  }
  fs.writeFileSync(cachePath, JSON.stringify(cache));
  console.log("Done shards. Run: npx tsx scripts/merge-part-content-fr.ts");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
