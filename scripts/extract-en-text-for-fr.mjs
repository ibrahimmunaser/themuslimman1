/**
 * Extract briefingText + statementOfFactsText from part-content-data.ts
 * into tmp/fr-parts/en-{n}.json for translation.
 *
 *   node scripts/extract-en-text-for-fr.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const srcPath = path.join(rootDir, "lib", "part-content-data.ts");
const outDir = path.join(rootDir, "tmp", "fr-parts");

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Read the large file in chunks
const content = fs.readFileSync(srcPath, "utf8");

// Extract the PART_CONTENT object
const match = content.match(/export const PART_CONTENT.*?= \{([\s\S]*)\};/);
if (!match) {
  console.error("Could not find PART_CONTENT export");
  process.exit(1);
}

const dataStr = "{" + match[1] + "}";

// Parse it carefully - we'll extract parts one by one
for (let n = 1; n <= 100; n++) {
  // Find the part entry with backtick strings
  const partRegex = new RegExp(
    `${n}:\\s*\\{[\\s\\S]*?briefingText:\\s*(\`[\\s\\S]*?\`|null)[\\s\\S]*?statementOfFactsText:\\s*(\`[\\s\\S]*?\`|null)`,
    "m"
  );
  
  const partMatch = content.match(partRegex);
  if (!partMatch) {
    console.warn(`Could not extract part ${n}`);
    continue;
  }

  let briefingText = null;
  let statementOfFactsText = null;

  try {
    if (partMatch[1] !== "null") {
      // Remove backticks and unescape
      briefingText = partMatch[1].slice(1, -1);
    }
    if (partMatch[2] !== "null") {
      statementOfFactsText = partMatch[2].slice(1, -1);
    }
  } catch (e) {
    console.error(`Error parsing part ${n}:`, e.message);
    continue;
  }

  const shard = {
    part: n,
    briefingText,
    statementOfFactsText,
  };

  const outPath = path.join(outDir, `en-${n}.json`);
  fs.writeFileSync(outPath, JSON.stringify(shard, null, 2));
  console.log(`Extracted part ${n}`);
}

console.log("Extraction complete!");
