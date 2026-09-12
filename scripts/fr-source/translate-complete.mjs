#!/usr/bin/env node
/**
 * Complete French translation pipeline for all 100 parts
 * This version processes files directly and outputs TypeScript with translations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to get API key from environment
let API_KEY = process.env.ANTHROPIC_API_KEY;

// If not in env, check if passed as command line argument
if (!API_KEY && process.argv[2] && process.argv[2].startsWith('sk-ant-')) {
  API_KEY = process.argv[2];
}

if (!API_KEY) {
  console.error(`
❌ No Anthropic API key found.

Please either:
1. Set ANTHROPIC_API_KEY in your environment:
   export ANTHROPIC_API_KEY=sk-ant-...
   
2. Or pass it as an argument:
   node translate-complete.mjs sk-ant-...

Get an API key at: https://console.anthropic.com/
`);
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey: API_KEY });

const BATCHES = [
  { input: 'en-fc-1-25-parts.json', output: 'batch-01-25.ts', constant: 'PART_FLASHCARDS_FR_1_25', parts: '1-25' },
  { input: 'en-fc-26-50-parts.json', output: 'batch-26-50.ts', constant: 'PART_FLASHCARDS_FR_26_50', parts: '26-50' },
  { input: 'en-fc-51-75-parts.json', output: 'batch-51-75.ts', constant: 'PART_FLASHCARDS_FR_51_75', parts: '51-75' },
  { input: 'en-fc-76-100-parts.json', output: 'batch-76-100.ts', constant: 'PART_FLASHCARDS_FR_76_100', parts: '76-100' },
];

async function translatePart(partData, partNum) {
  const prompt = `Translate this Islamic education flashcard data from English to French.

CRITICAL REQUIREMENTS:
1. Translate ONLY the "side1" and "side2" fields to scholarly French
2. Keep ALL other fields EXACTLY as they are (id, file, card_number, tags, part, counts, source_file)
3. Preserve the Islamic honorific ﷺ (ṣallā llāhu ʿalayhi wa-sallam) unchanged
4. Use formal, respectful French appropriate for Islamic religious education
5. Use proper Islamic French terminology (e.g., "le Prophète ﷺ", "La Mecque", "Médine")
6. Maintain the exact JSON structure

Part ${partNum} data to translate:

${JSON.stringify(partData, null, 2)}

Return ONLY the complete JSON object with side1 and side2 translated to French. No explanations, just the JSON.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 16384,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].text.trim();
    
    // Extract JSON (handle markdown code blocks)
    let jsonText = responseText;
    const codeMatch = responseText.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
    if (codeMatch) {
      jsonText = codeMatch[1];
    }
    
    const translated = JSON.parse(jsonText);
    return translated;
    
  } catch (error) {
    console.error(`\n❌ Translation error for Part ${partNum}:`);
    console.error(`   ${error.message}`);
    throw error;
  }
}

async function processBatch(batch, batchIndex) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📚 BATCH ${batchIndex + 1}/4: Parts ${batch.parts}`);
  console.log(`${'='.repeat(80)}\n`);

  const inputPath = path.join(__dirname, batch.input);
  const partsArray = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  
  console.log(`📖 Loaded ${partsArray.length} parts from ${batch.input}`);
  console.log(`⏱️  Starting translations...\n`);

  const translatedData = {};
  const startTime = Date.now();
  let successCount = 0;

  for (let i = 0; i < partsArray.length; i++) {
    const partObj = partsArray[i];
    const partNum = partObj.part;
    const progress = `[${i + 1}/${partsArray.length}]`;
    
    process.stdout.write(`  ${progress} Part ${partNum}... `);

    try {
      const translated = await translatePart(partObj.data, partNum);
      translatedData[partNum] = translated;
      successCount++;
      console.log('✅');

      // Rate limiting: small delay between requests
      if (i < partsArray.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
    } catch (error) {
      console.log(`❌ FAILED`);
      console.error(`     Error: ${error.message}`);
      // On failure, keep original English as fallback
      translatedData[partNum] = partObj.data;
    }
  }

  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✅ Batch complete: ${successCount}/${partsArray.length} parts translated successfully`);
  console.log(`⏱️  Time elapsed: ${elapsedSec}s`);

  // Generate TypeScript file
  const tsContent = `import type { FlashcardSet } from "../types";

export const ${batch.constant}: Record<number, FlashcardSet> = ${JSON.stringify(translatedData, null, 2)};
`;

  const outputDir = path.join(__dirname, '..', '..', 'lib', 'fr-flashcards');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`\n📁 Created directory: lib/fr-flashcards/`);
  }

  const outputPath = path.join(outputDir, batch.output);
  fs.writeFileSync(outputPath, tsContent, 'utf8');
  
  const fileSizeKB = (tsContent.length / 1024).toFixed(1);
  console.log(`📝 Created: lib/fr-flashcards/${batch.output} (${fileSizeKB} KB)`);

  return { success: successCount, total: partsArray.length, time: elapsedSec };
}

function createAggregatorFile() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📦 Creating aggregator file...`);
  console.log(`${'='.repeat(80)}\n`);

  const content = `import type { FlashcardSet } from "./types";
import { PART_FLASHCARDS_FR_1_25 } from "./fr-flashcards/batch-01-25";
import { PART_FLASHCARDS_FR_26_50 } from "./fr-flashcards/batch-26-50";
import { PART_FLASHCARDS_FR_51_75 } from "./fr-flashcards/batch-51-75";
import { PART_FLASHCARDS_FR_76_100 } from "./fr-flashcards/batch-76-100";

export const PART_FLASHCARDS_FR: Record<number, FlashcardSet> = {
  ...PART_FLASHCARDS_FR_1_25,
  ...PART_FLASHCARDS_FR_26_50,
  ...PART_FLASHCARDS_FR_51_75,
  ...PART_FLASHCARDS_FR_76_100,
};
`;

  const outputPath = path.join(__dirname, '..', '..', 'lib', 'part-flashcard-data-fr.ts');
  fs.writeFileSync(outputPath, content, 'utf8');
  
  console.log(`✅ Created: lib/part-flashcard-data-fr.ts\n`);
}

async function main() {
  const startTime = Date.now();
  
  console.log(`
${'='.repeat(80)}
🇫🇷  FRENCH FLASHCARD TRANSLATION PIPELINE
${'='.repeat(80)}

📚 Task: Translate 100 parts of Islamic education flashcards to French
🤖 Model: Claude 3.5 Sonnet
🔑 API Key: ${API_KEY.slice(0, 12)}...${API_KEY.slice(-6)}

${'='.repeat(80)}
`);

  const results = [];

  try {
    for (let i = 0; i < BATCHES.length; i++) {
      const result = await processBatch(BATCHES[i], i);
      results.push({ batch: BATCHES[i].parts, ...result });
    }

    // Create aggregator file
    createAggregatorFile();

    // Final summary
    const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    const totalSuccess = results.reduce((sum, r) => sum + r.success, 0);
    const totalParts = results.reduce((sum, r) => sum + r.total, 0);

    console.log(`${'='.repeat(80)}`);
    console.log(`✨ TRANSLATION COMPLETE!`);
    console.log(`${'='.repeat(80)}\n`);

    console.log(`📊 Final Statistics:`);
    results.forEach(r => {
      const status = r.success === r.total ? '✅' : '⚠️ ';
      console.log(`  ${status} Parts ${r.batch}: ${r.success}/${r.total} (${r.time}s)`);
    });
    
    console.log(`\n  🎯 TOTAL: ${totalSuccess}/${totalParts} parts translated`);
    console.log(`  ⏱️  Total time: ${totalTime} minutes`);

    console.log(`\n📁 Files created:`);
    console.log(`  ✅ lib/fr-flashcards/batch-01-25.ts`);
    console.log(`  ✅ lib/fr-flashcards/batch-26-50.ts`);
    console.log(`  ✅ lib/fr-flashcards/batch-51-75.ts`);
    console.log(`  ✅ lib/fr-flashcards/batch-76-100.ts`);
    console.log(`  ✅ lib/part-flashcard-data-fr.ts`);

    if (totalSuccess === totalParts) {
      console.log(`\n🎉 All 100 parts translated successfully!`);
    } else {
      console.log(`\n⚠️  ${totalParts - totalSuccess} parts failed (kept in English as fallback)`);
    }

    console.log(`\n${'='.repeat(80)}\n`);

  } catch (error) {
    console.error(`\n❌ Fatal error:`, error);
    process.exit(1);
  }
}

main().catch(console.error);
