/**
 * Extract English briefing + facts from PART_CONTENT into per-part JSON
 * for offline / agent translation.
 *
 *   npx tsx scripts/extract-part-content-en.ts
 */
import fs from "fs";
import path from "path";
import { PART_CONTENT } from "../lib/part-content-data";

const outDir = path.join(process.cwd(), "tmp", "en-parts");
fs.mkdirSync(outDir, { recursive: true });

for (let n = 1; n <= 100; n++) {
  const entry = PART_CONTENT[n];
  if (!entry) {
    console.warn("missing part", n);
    continue;
  }
  fs.writeFileSync(
    path.join(outDir, `${n}.json`),
    JSON.stringify(
      {
        part: n,
        briefingText: entry.briefingText,
        statementOfFactsText: entry.statementOfFactsText,
      },
      null,
      2,
    ),
  );
}

console.log("wrote", outDir);
