/**
 * Reads all 100 markdown briefing files from Seerah-data/Briefing/output_md/,
 * renders each one to HTML with formatSeerahContent, and writes the result
 * directly into lib/part-content-data.ts without hitting the dev server.
 *
 * Run: npx tsx scripts/update-all-briefings-from-md.ts
 */

import fs from "fs";
import path from "path";
import { formatSeerahContent } from "../lib/text-formatter";

const SEERAH_DATA_DIR =
  process.env.SEERAH_DATA_DIR ?? path.resolve(__dirname, "..", "..", "Seerah-data");

const MD_DIR = path.join(SEERAH_DATA_DIR, "Briefing", "output_md");
const OUT_FILE = path.join(__dirname, "..", "lib", "part-content-data.ts");

const TOTAL_PARTS = 100;

function escapeTemplateStr(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${");
}

function main() {
  if (!fs.existsSync(MD_DIR)) {
    console.error(`Markdown directory not found: ${MD_DIR}`);
    process.exit(1);
  }

  console.log(`\nReading markdown files from:\n  ${MD_DIR}\n`);

  // Build a map of partNum → { markdownText, html }
  const updates: Map<number, { markdownText: string; html: string }> = new Map();

  for (let partNum = 1; partNum <= TOTAL_PARTS; partNum++) {
    const mdPath = path.join(MD_DIR, `Part ${partNum} Briefing Document.md`);
    if (!fs.existsSync(mdPath)) {
      console.warn(`  Part ${String(partNum).padStart(3)} — ⚠ markdown file not found, skipping`);
      continue;
    }
    const markdownText = fs.readFileSync(mdPath, "utf-8");
    const html = formatSeerahContent(markdownText);
    updates.set(partNum, { markdownText, html });
    console.log(`  Part ${String(partNum).padStart(3)} — ${markdownText.length} chars → ${html.length} chars HTML`);
  }

  console.log(`\nUpdating ${updates.size} parts in lib/part-content-data.ts …`);

  let dataFile = fs.readFileSync(OUT_FILE, "utf-8");

  for (const [partNum, { markdownText, html }] of updates) {
    const blockStart = dataFile.indexOf(`\n  ${partNum}: {\n`);
    // End marker: next part entry or end of object
    const nextPartNum = partNum + 1;
    let blockEnd = dataFile.indexOf(`\n  ${nextPartNum}: {\n`);
    if (blockEnd === -1) blockEnd = dataFile.lastIndexOf("\n};");

    if (blockStart === -1 || blockEnd === -1) {
      console.warn(`  Part ${partNum} — could not locate block in data file, skipping`);
      continue;
    }

    let block = dataFile.slice(blockStart, blockEnd);

    // Replace briefingText
    block = block.replace(
      /briefingText: `[\s\S]*?(?<!\\)`,/,
      `briefingText: \`${escapeTemplateStr(markdownText)}\`,`
    );

    // Replace briefingHtml
    block = block.replace(
      /briefingHtml: `[\s\S]*?(?<!\\)`,/,
      `briefingHtml: \`${escapeTemplateStr(html)}\`,`
    );

    dataFile = dataFile.slice(0, blockStart) + block + dataFile.slice(blockEnd);
  }

  fs.writeFileSync(OUT_FILE, dataFile, "utf-8");

  const finalSize = (fs.statSync(OUT_FILE).size / 1024).toFixed(1);
  console.log(`\n✅  Done — ${updates.size}/${TOTAL_PARTS} parts updated`);
  console.log(`   lib/part-content-data.ts is now ${finalSize} KB\n`);
}

main();
