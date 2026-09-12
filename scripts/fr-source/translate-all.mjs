#!/usr/bin/env node
/**
 * Translate English flashcards to French TypeScript files
 * Processes each batch systematically
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get API key from environment or Cursor
const API_KEY = process.env.ANTHROPIC_API_KEY || process.env.CURSOR_API_KEY;

if (!API_KEY) {
  console.error('❌ No API key found. Set ANTHROPIC_API_KEY environment variable.');
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey: API_KEY });

const TRANSLATION_PROMPT = `You are translating Islamic education flashcards from English to French.

Instructions:
- Translate ONLY "side1" and "side2" fields to scholarly French appropriate for Islamic education
- Keep the Islamic honorific ﷺ (ṣallā llāhu ʿalayhi wa-sallam) unchanged wherever it appears
- Maintain formal, respectful tone suitable for religious education
- Keep ALL other fields identical (id, file, card_number, tags, part, counts)
- Preserve the exact JSON structure
- Use appropriate Islamic terminology in French (e.g., "le Prophète ﷺ" not "Mohammed")

Return ONLY valid JSON matching the input structure exactly, with side1 and side2 translated to French.`;

/**
 * Translate a single part's flashcards
 */
async function translatePart(partData, partNumber) {
  const prompt = `${TRANSLATION_PROMPT}

Translate this flashcard data for Part ${partNumber}:

${JSON.stringify(partData, null, 2)}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 16000,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].text;
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonText = responseText.trim();
    const codeBlockMatch = jsonText.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1];
    }
    
    return JSON.parse(jsonText);
  } catch (error) {
    console.error(`  ❌ Translation error for Part ${partNumber}:`, error.message);
    throw error;
  }
}

/**
 * Process a batch file
 */
async function processBatch(config) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📚 Processing batch ${config.range}`);
  console.log(`${'='.repeat(70)}\n`);

  const inputPath = path.join(__dirname, config.input);
  const outputDir = path.join(__dirname, '..', '..', 'lib', 'fr-flashcards');
  const outputPath = path.join(outputDir, config.output);

  // Create output directory if needed
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Read parts JSON
  const partsData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  console.log(`📖 Loaded ${partsData.length} parts from ${config.input}`);

  const translatedParts = {};
  let successCount = 0;
  let failCount = 0;

  for (const partObj of partsData) {
    const partNum = partObj.part;
    process.stdout.write(`  Part ${partNum}... `);

    try {
      const translated = await translatePart(partObj.data, partNum);
      translatedParts[partNum] = translated;
      successCount++;
      console.log('✅');

      // Small delay to respect rate limits (if any)
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      failCount++;
      console.log(`❌ ${error.message}`);
      
      // On failure, copy original structure as fallback
      console.log(`  ⚠️  Using original (untranslated) as fallback`);
      translatedParts[partNum] = partObj.data;
    }
  }

  // Generate TypeScript file
  console.log(`\n📝 Generating ${config.output}...`);
  const tsContent = generateTypeScript(translatedParts, config.constant);
  fs.writeFileSync(outputPath, tsContent, 'utf8');

  console.log(`✅ Created ${config.output}`);
  console.log(`📊 Success: ${successCount}/${partsData.length} parts`);
  
  if (failCount > 0) {
    console.log(`⚠️  Failed: ${failCount} parts (using fallback)`);
  }

  return { success: successCount, failed: failCount };
}

/**
 * Generate TypeScript file content
 */
function generateTypeScript(data, constantName) {
  // Convert to proper TypeScript format
  const json = JSON.stringify(data, null, 2);
  
  return `import type { FlashcardSet } from "../types";

export const ${constantName}: Record<number, FlashcardSet> = ${json};
`;
}

/**
 * Create the aggregator file
 */
function createAggregator() {
  console.log(`\n${'='.repeat(70)}`);
  console.log('📝 Creating aggregator file...');
  console.log(`${'='.repeat(70)}\n`);

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
  console.log('✅ Created lib/part-flashcard-data-fr.ts\n');
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 French Flashcard Translation Pipeline');
  console.log(`${'='.repeat(70)}\n`);
  console.log(`🤖 Using Claude 3.5 Sonnet for translations`);
  console.log(`🔑 API Key: ${API_KEY.slice(0, 10)}...${API_KEY.slice(-4)}\n`);

  const BATCH_CONFIGS = [
    { input: 'en-fc-1-25-parts.json', output: 'batch-01-25.ts', constant: 'PART_FLASHCARDS_FR_1_25', range: '1-25' },
    { input: 'en-fc-26-50-parts.json', output: 'batch-26-50.ts', constant: 'PART_FLASHCARDS_FR_26_50', range: '26-50' },
    { input: 'en-fc-51-75-parts.json', output: 'batch-51-75.ts', constant: 'PART_FLASHCARDS_FR_51_75', range: '51-75' },
    { input: 'en-fc-76-100-parts.json', output: 'batch-76-100.ts', constant: 'PART_FLASHCARDS_FR_76_100', range: '76-100' },
  ];

  const results = [];
  
  for (const config of BATCH_CONFIGS) {
    const result = await processBatch(config);
    results.push({ range: config.range, ...result });
  }

  // Create aggregator
  createAggregator();

  // Final summary
  console.log(`\n${'='.repeat(70)}`);
  console.log('✨ TRANSLATION COMPLETE');
  console.log(`${'='.repeat(70)}\n`);

  const totalSuccess = results.reduce((sum, r) => sum + r.success, 0);
  const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);

  console.log('📊 Final Statistics:');
  results.forEach(r => {
    console.log(`  Parts ${r.range}: ${r.success} ✅  ${r.failed} ❌`);
  });
  console.log(`\n  TOTAL: ${totalSuccess}/100 parts translated successfully`);
  
  if (totalFailed > 0) {
    console.log(`  ⚠️  ${totalFailed} parts failed (using fallback)`);
  }

  console.log(`\n✅ Created 5 files:`);
  console.log(`   - lib/fr-flashcards/batch-01-25.ts`);
  console.log(`   - lib/fr-flashcards/batch-26-50.ts`);
  console.log(`   - lib/fr-flashcards/batch-51-75.ts`);
  console.log(`   - lib/fr-flashcards/batch-76-100.ts`);
  console.log(`   - lib/part-flashcard-data-fr.ts`);
  
  console.log(`\n${'='.repeat(70)}\n`);
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
