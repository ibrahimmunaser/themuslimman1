/**
 * Updates ONLY Part 1's briefingText and briefingHtml in lib/part-content-data.ts
 * using the local markdown file at Seerah-data/Briefing/output_md/Part 1 Briefing Document.md
 *
 * Run: npx tsx scripts/update-part1.ts
 */

import fs from "fs";
import path from "path";
import { formatSeerahContent } from "../lib/text-formatter";

const SEERAH_DATA_DIR =
  process.env.SEERAH_DATA_DIR ?? path.resolve(__dirname, "..", "..", "Seerah-data");

const DATA_FILE = path.join(__dirname, "..", "lib", "part-content-data.ts");

const MD_PATH = path.join(
  SEERAH_DATA_DIR,
  "Briefing",
  "output_md",
  "Part 1 Briefing Document.md"
);

function escapeTemplateStr(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${");
}

function main() {
  if (!fs.existsSync(MD_PATH)) {
    console.error(`Markdown file not found: ${MD_PATH}`);
    process.exit(1);
  }

  const markdown = fs.readFileSync(MD_PATH, "utf-8");
  console.log(`Read markdown: ${markdown.length} chars`);

  const html = formatSeerahContent(markdown);
  console.log(`Generated HTML: ${html.length} chars`);

  const newBriefingText = `\`${escapeTemplateStr(markdown)}\``;
  const newBriefingHtml = `\`${escapeTemplateStr(html)}\``;

  // Read the current data file
  let dataFile = fs.readFileSync(DATA_FILE, "utf-8");

  // Replace Part 1's briefingText
  // Pattern: find "  1: {" block and replace briefingText value
  // We use a regex to find the briefingText: `...` within the Part 1 block
  const part1BlockStart = dataFile.indexOf("\n  1: {\n");
  const part1BlockEnd = dataFile.indexOf("\n  2: {\n");

  if (part1BlockStart === -1 || part1BlockEnd === -1) {
    console.error("Could not locate Part 1 block in data file");
    process.exit(1);
  }

  let part1Block = dataFile.slice(part1BlockStart, part1BlockEnd);

  // Replace briefingText value (template literal — find backtick start to backtick end)
  part1Block = part1Block.replace(
    /briefingText: `[\s\S]*?(?<!\\)`,/,
    `briefingText: ${newBriefingText},`
  );

  // Replace briefingHtml value
  part1Block = part1Block.replace(
    /briefingHtml: `[\s\S]*?(?<!\\)`,/,
    `briefingHtml: ${newBriefingHtml},`
  );

  const newDataFile =
    dataFile.slice(0, part1BlockStart) +
    part1Block +
    dataFile.slice(part1BlockEnd);

  fs.writeFileSync(DATA_FILE, newDataFile, "utf-8");
  console.log(`\n✅  Part 1 updated in lib/part-content-data.ts`);

  // Quick sanity: confirm the pipe table renders in the HTML
  if (html.includes("seerah-data-table")) {
    console.log("✅  Pipe table rendered correctly");
  } else {
    console.warn("⚠  No seerah-data-table found — check formatter");
  }
  if (!html.includes("# Briefing")) {
    console.log("✅  H1 title line correctly skipped");
  }
}

main();
