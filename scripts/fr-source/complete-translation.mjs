#!/usr/bin/env node
/**
 * Complete French flashcard translation using Anthropic API
 * This script will translate all 100 parts systematically
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get API key - try multiple sources
const API_KEY = 
  process.env.ANTHROPIC_API_KEY || 
  process.argv[2] ||
  'YOUR_API_KEY_HERE';

if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
  console.error(`
❌ No Anthropic API key provided.

Get a free API key at: https://console.anthropic.com/

Then run:
  export ANTHROPIC_API_KEY=sk-ant-...
  node complete-translation.mjs

Or pass directly:
  node complete-translation.mjs sk-ant-...
`);
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey: API_KEY });

async function translatePart(partData, partNum) {
  const prompt = `Translate this Islamic education flashcard data from English to French.

CRITICAL REQUIREMENTS:
1. Translate ONLY "side1" and "side2" fields to scholarly French
2. Keep ALL other fields EXACTLY unchanged (id, file, card_number, tags, part, counts, source_file)
3. Preserve the Islamic honorific ﷺ unchanged wherever it appears
4. Use formal, respectful French for Islamic religious education
5. Use proper Islamic French terminology:
   - "le Prophète ﷺ" (not just "Mohammed")
   - "La Mecque" (for Makkah)
   - "Médine" (for Madinah)
   - "Quraysh" remains "Quraysh"
6. Maintain exact JSON structure

Part ${partNum} data:

${JSON.stringify(partData, null, 2)}

Return ONLY the complete JSON object with side1/side2 in French. No explanations.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 16384,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].text.trim();
    let jsonText = responseText;
    
    // Extract JSON from markdown blocks if present
    const codeMatch = responseText.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
    if (codeMatch) {
      jsonText = codeMatch[1];
    }
    
    return JSON.parse(jsonText);
  } catch (error) {
    console.error(`\n  ❌ Error translating Part ${partNum}: ${error.message}`);
    throw error;
  }
}

async function main() {
  const startTime = Date.now();
  
  console.log(`
${'='.repeat(80)}
🇫🇷  FRENCH FLASHCARD TRANSLATION - ALL 100 PARTS
${'='.repeat(80)}

🤖 Model: Claude 3.5 Sonnet
🔑 API Key: ${API_KEY.slice(0, 12)}...
📚 Task: Translate 100 parts of Islamic Seerah flashcards to French

${'='.repeat(80)}
`);

  // Load all job files
  const jobsDir = path.join(__dirname, 'jobs');
  const jobFiles = fs.readdirSync(jobsDir)
    .filter(f => f.startsWith('translate-job-') && f.endsWith('.json'))
    .sort((a, b) => {
      const aNum = parseInt(a.match(/\d+/)[0]);
      const bNum = parseInt(b.match(/\d+/)[0]);
      return aNum - bNum;
    });

  console.log(`📦 Found ${jobFiles.length} job files\n`);

  const allTranslated = {};
  let totalSuccess = 0;
  let totalFailed = 0;

  for (let i = 0; i < jobFiles.length; i++) {
    const jobFile = jobFiles[i];
    const jobPath = path.join(jobsDir, jobFile);
    const partsArray = JSON.parse(fs.readFileSync(jobPath, 'utf8'));
    
    const firstPart = partsArray[0].part;
    const lastPart = partsArray[partsArray.length - 1].part;
    
    console.log(`\n[${ i + 1}/${jobFiles.length}] Processing Parts ${firstPart}-${lastPart}...`);
    console.log(`${'─'.repeat(80)}`);

    for (const partObj of partsArray) {
      const partNum = partObj.part;
      process.stdout.write(`  Part ${partNum}... `);

      try {
        const translated = await translatePart(partObj.data, partNum);
        allTranslated[partNum] = translated;
        totalSuccess++;
        console.log('✅');

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 600));
      } catch (error) {
        totalFailed++;
        console.log(`❌`);
        // Use original as fallback
        allTranslated[partNum] = partObj.data;
      }
    }

    // Progress update
    const progress = ((i + 1) / jobFiles.length * 100).toFixed(1);
    console.log(`  Progress: ${progress}% | Success: ${totalSuccess} | Failed: ${totalFailed}`);
  }

  // Generate batch files
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('📝 Generating TypeScript batch files...');
  console.log(`${'='.repeat(80)}\n`);

  const batches = [
    { range: [1, 25], output: 'batch-01-25.ts', constant: 'PART_FLASHCARDS_FR_1_25' },
    { range: [26, 50], output: 'batch-26-50.ts', constant: 'PART_FLASHCARDS_FR_26_50' },
    { range: [51, 75], output: 'batch-51-75.ts', constant: 'PART_FLASHCARDS_FR_51_75' },
    { range: [76, 100], output: 'batch-76-100.ts', constant: 'PART_FLASHCARDS_FR_76_100' },
  ];

  const outputDir = path.join(__dirname, '..', '..', 'lib', 'fr-flashcards');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const batch of batches) {
    const batchData = {};
    for (let i = batch.range[0]; i <= batch.range[1]; i++) {
      if (allTranslated[i]) {
        batchData[i] = allTranslated[i];
      }
    }

    const tsContent = `import type { FlashcardSet } from "../types";

export const ${batch.constant}: Record<number, FlashcardSet> = ${JSON.stringify(batchData, null, 2)};
`;

    const outputPath = path.join(outputDir, batch.output);
    fs.writeFileSync(outputPath, tsContent, 'utf8');
    
    const fileSizeKB = (tsContent.length / 1024).toFixed(1);
    console.log(`  ✅ ${batch.output} (${fileSizeKB} KB)`);
  }

  // Create aggregator file
  const aggregatorContent = `import type { FlashcardSet } from "./types";
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

  const aggregatorPath = path.join(__dirname, '..', '..', 'lib', 'part-flashcard-data-fr.ts');
  fs.writeFileSync(aggregatorPath, aggregatorContent, 'utf8');
  console.log(`  ✅ part-flashcard-data-fr.ts\n`);

  // Final summary
  const elapsedMin = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  
  console.log(`${'='.repeat(80)}`);
  console.log('✨ TRANSLATION COMPLETE!');
  console.log(`${'='.repeat(80)}\n`);

  console.log(`📊 Final Statistics:`);
  console.log(`  ✅ Successfully translated: ${totalSuccess}/100 parts`);
  if (totalFailed > 0) {
    console.log(`  ❌ Failed (using English fallback): ${totalFailed} parts`);
  }
  console.log(`  ⏱️  Total time: ${elapsedMin} minutes`);

  console.log(`\n📁 Files created:`);
  console.log(`  ✅ lib/fr-flashcards/batch-01-25.ts`);
  console.log(`  ✅ lib/fr-flashcards/batch-26-50.ts`);
  console.log(`  ✅ lib/fr-flashcards/batch-51-75.ts`);
  console.log(`  ✅ lib/fr-flashcards/batch-76-100.ts`);
  console.log(`  ✅ lib/part-flashcard-data-fr.ts`);

  if (totalSuccess === 100) {
    console.log(`\n🎉 Perfect! All 100 parts translated to French!`);
  }

  console.log(`\n${'='.repeat(80)}\n`);
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
