#!/usr/bin/env node
/**
 * Generate French TypeScript flashcard files from English JSON
 * Run with: node translate-batch.mjs [batch-number]
 * Example: node translate-batch.mjs 1  (for batch 1-25)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BATCHES = {
  1: { input: 'en-fc-1-25-parts.json', output: 'batch-01-25.ts', constant: 'PART_FLASHCARDS_FR_1_25', range: [1, 25] },
  2: { input: 'en-fc-26-50-parts.json', output: 'batch-26-50.ts', constant: 'PART_FLASHCARDS_FR_26_50', range: [26, 50] },
  3: { input: 'en-fc-51-75-parts.json', output: 'batch-51-75.ts', constant: 'PART_FLASHCARDS_FR_51_75', range: [51, 75] },
  4: { input: 'en-fc-76-100-parts.json', output: 'batch-76-100.ts', constant: 'PART_FLASHCARDS_FR_76_100', range: [76, 100] },
};

/**
 * French translations mapping for common terms
 */
const COMMON_TRANSLATIONS = {
  // Question starters
  "What": "Quel(le)",
  "Who": "Qui",
  "Where": "Où",
  "When": "Quand",
  "Why": "Pourquoi",
  "How": "Comment",
  "Which": "Quel(le)",
  
  // Geography
  "Arabian Peninsula": "la péninsule arabique",
  "Arabian Gulf": "le golfe Arabique",
  "Arabian Sea": "la mer d'Arabie",
  "Red Sea": "la mer Rouge",
  "Indian Ocean": "l'océan Indien",
  "desert": "désert",
  "deserts": "déserts",
  
  // Islamic terms
  "the Prophet": "le Prophète",
  "Prophet Muhammad": "le Prophète Muhammad",
  "Mecca": "La Mecque",
  "Medina": "Médine",
  "Quraysh": "Quraysh",
  "seerah": "sîrah",
};

/**
 * Write batch file with placeholder for manual translation
 */
function createBatchFile(batchNum) {
  const batch = BATCHES[batchNum];
  if (!batch) {
    console.error(`❌ Invalid batch number. Use 1-4.`);
    return;
  }

  console.log(`\n📚 Creating French flashcard batch ${batchNum} (Parts ${batch.range[0]}-${batch.range[1]})`);
  console.log(`${'='.repeat(70)}\n`);

  const inputPath = path.join(__dirname, batch.input);
  const partsData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

  console.log(`📖 Loaded ${partsData.length} parts`);
  console.log(`\n⚠️  Note: This creates the structure. Translations need to be added manually.`);
  console.log(`    Use Claude/AI to translate side1 and side2 fields to French.\n`);

  // Output structure with English (to be translated)
  const outputData = {};
  
  partsData.forEach(partObj => {
    outputData[partObj.part] = partObj.data;
  });

  // Generate TypeScript file
  const tsContent = `import type { FlashcardSet } from "../types";

export const ${batch.constant}: Record<number, FlashcardSet> = ${JSON.stringify(outputData, null, 2)};
`;

  const outputDir = path.join(__dirname, '..', '..', 'lib', 'fr-flashcards');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, batch.output);
  fs.writeFileSync(outputPath, tsContent, 'utf8');

  console.log(`✅ Created: lib/fr-flashcards/${batch.output}`);
  console.log(`📝 File size: ${(tsContent.length / 1024).toFixed(1)} KB`);
  console.log(`\n🔄 Next: Translate all side1/side2 fields in this file to French`);
}

/**
 * Show statistics about what needs translation
 */
function showStats(batchNum) {
  const batch = BATCHES[batchNum];
  const inputPath = path.join(__dirname, batch.input);
  const partsData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

  let totalCards = 0;
  partsData.forEach(p => {
    totalCards += (p.data.easy?.length || 0) + (p.data.medium?.length || 0) + (p.data.full?.length || 0);
  });

  console.log(`\n📊 Batch ${batchNum} Statistics:`);
  console.log(`   Parts: ${partsData.length}`);
  console.log(`   Total flashcards: ${totalCards}`);
  console.log(`   Fields to translate: ${totalCards * 2} (side1 + side2)\n`);
}

// Main
const batchNum = parseInt(process.argv[2]);

if (!batchNum || batchNum < 1 || batchNum > 4) {
  console.log(`
📚 French Flashcard Batch Generator

Usage: node translate-batch.mjs [1|2|3|4]

Batches:
  1 - Parts 1-25    (batch-01-25.ts)
  2 - Parts 26-50   (batch-26-50.ts)
  3 - Parts 51-75   (batch-51-75.ts)
  4 - Parts 76-100  (batch-76-100.ts)

This generates the TypeScript structure.
Translations must be added separately.
`);
  process.exit(1);
}

showStats(batchNum);
createBatchFile(batchNum);

console.log(`\n${'='.repeat(70)}`);
console.log(`✨ Batch ${batchNum} structure created!`);
console.log(`${'='.repeat(70)}\n`);
