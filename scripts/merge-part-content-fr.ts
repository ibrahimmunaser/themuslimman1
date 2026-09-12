/**
 * Merge translated French JSON shards (tmp/fr-parts/{n}.json) into
 * lib/part-content-data-fr.ts with pre-rendered briefingHtml.
 *
 *   npx tsx scripts/merge-part-content-fr.ts
 *
 * Shard shape: { part, briefingText, statementOfFactsText }
 */
import fs from "fs";
import path from "path";
import { formatSeerahContent } from "../lib/text-formatter";
import type { PartTextContent } from "../lib/part-content-data";

const shardDir = path.join(process.cwd(), "tmp", "fr-parts");
const outPath = path.join(process.cwd(), "lib", "part-content-data-fr.ts");

if (!fs.existsSync(shardDir)) {
  console.error("Missing", shardDir);
  process.exit(1);
}

const parts: Record<number, PartTextContent> = {};
const missing: number[] = [];

for (let n = 1; n <= 100; n++) {
  const p = path.join(shardDir, `${n}.json`);
  if (!fs.existsSync(p)) {
    missing.push(n);
    continue;
  }
  const raw = JSON.parse(fs.readFileSync(p, "utf8")) as {
    part?: number;
    briefingText: string | null;
    statementOfFactsText: string | null;
  };
  const briefingText = raw.briefingText ?? null;
  const statementOfFactsText = raw.statementOfFactsText ?? null;
  parts[n] = {
    briefingText,
    statementOfFactsText,
    briefingHtml: briefingText ? formatSeerahContent(briefingText) : null,
  };
}

let body = `// Traductions françaises codées en dur de PART_CONTENT (source anglaise).
// Ne pas charger depuis R2 à l'exécution.
// Généré par scripts/merge-part-content-fr.ts depuis tmp/fr-parts/*.json

import type { PartTextContent } from "./part-content-data";

export const PART_CONTENT_FR: Record<number, PartTextContent> = {
`;

for (const n of Object.keys(parts)
  .map(Number)
  .sort((a, b) => a - b)) {
  const e = parts[n];
  body += `  ${n}: {\n`;
  body += `    briefingText: ${JSON.stringify(e.briefingText)},\n`;
  body += `    statementOfFactsText: ${JSON.stringify(e.statementOfFactsText)},\n`;
  body += `    briefingHtml: ${JSON.stringify(e.briefingHtml)},\n`;
  body += `  },\n`;
}

body += `};\n`;

fs.writeFileSync(outPath, body);

console.log(
  `wrote ${outPath} — ${Object.keys(parts).length}/100 parts, ${(body.length / 1024 / 1024).toFixed(2)} MB`,
);
if (missing.length) {
  console.log(`missing (${missing.length}):`, missing.join(","));
}
