#!/usr/bin/env node
/**
 * Translate English flashcard JSON files to French TypeScript files
 * Uses Anthropic Claude API for high-quality Islamic education translations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const BATCH_CONFIGS = [
  { input: 'en-fc-1-25.json', output: 'batch-01-25.ts', constant: 'PART_FLASHCARDS_FR_1_25', range: '1-25' },
  { input: 'en-fc-26-50.json', output: 'batch-26-50.ts', constant: 'PART_FLASHCARDS_FR_26_50', range: '26-50' },
  { input: 'en-fc-51-75.json', output: 'batch-51-75.ts', constant: 'PART_FLASHCARDS_FR_51_75', range: '51-75' },
  { input: 'en-fc-76-100.json', output: 'batch-76-100.ts', constant: 'PART_FLASHCARDS_FR_76_100', range: '76-100' },
];

/**
 * Translate flashcard content using Claude
 */
async function translateFlashcards(flashcards, batchName) {
  console.log(`\n🔄 Translating ${batchName}...`);
  
  const prompt = `You are translating Islamic education flashcards from English to French. 
Translate ONLY the "side1" and "side2" fields to scholarly French appropriate for Islamic education.
Keep the Islamic honorific ﷺ (ṣallā llāhu ʿalayhi wa-sallam) unchanged.
Keep all other fields (id, card_number, tags, part, counts) EXACTLY as they are.

Translate the following JSON object, maintaining exact structure:

${JSON.stringify(flashcards, null, 2)}

Return ONLY valid JSON with the same structure, with side1 and side2 translated to French.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 16000,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text;
    // Extract JSON from potential markdown code blocks
    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) || responseText.match(/```\n?([\s\S]*?)\n?```/);
    const jsonText = jsonMatch ? jsonMatch[1] : responseText;
    
    return JSON.parse(jsonText);
  } catch (error) {
    console.error(`❌ Translation failed for ${batchName}:`, error.message);
    throw error;
  }
}

/**
 * Process flashcards in smaller chunks to avoid token limits
 */
async function translateInChunks(data, batchName) {
  const translated = {};
  const partNumbers = Object.keys(data).map(Number).sort((a, b) => a - b);
  
  console.log(`📦 Processing ${partNumbers.length} parts: ${partNumbers.join(', ')}`);
  
  for (const partNum of partNumbers) {
    console.log(`  Translating Part ${partNum}...`);
    
    try {
      const partData = { [partNum]: data[partNum] };
      const result = await translateFlashcards(partData, `Part ${partNum}`);
      translated[partNum] = result[partNum];
      
      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`  ❌ Failed to translate Part ${partNum}`);
      throw error;
    }
  }
  
  return translated;
}

/**
 * Generate TypeScript file content
 */
function generateTypeScriptFile(data, constantName) {
  const json = JSON.stringify(data, null, 2);
  
  return `import type { FlashcardSet } from "../types";

export const ${constantName}: Record<number, FlashcardSet> = ${json};
`;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting French flashcard translation...\n');
  
  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY environment variable not set');
    console.error('Please set it in .env.local or export it');
    process.exit(1);
  }

  // Create output directory
  const outputDir = path.join(__dirname, '..', '..', 'lib', 'fr-flashcards');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`✅ Created directory: ${outputDir}\n`);
  }

  // Process each batch
  for (const config of BATCH_CONFIGS) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📚 Processing batch: ${config.range}`);
    console.log(`${'='.repeat(60)}`);
    
    const inputPath = path.join(__dirname, config.input);
    const outputPath = path.join(outputDir, config.output);
    
    try {
      // Read English source
      console.log(`📖 Reading ${config.input}...`);
      const englishData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
      
      // Translate
      const frenchData = await translateInChunks(englishData, config.range);
      
      // Generate TypeScript
      const tsContent = generateTypeScriptFile(frenchData, config.constant);
      
      // Write output
      fs.writeFileSync(outputPath, tsContent, 'utf8');
      console.log(`✅ Created ${config.output}`);
      
    } catch (error) {
      console.error(`❌ Failed to process ${config.range}:`, error.message);
      process.exit(1);
    }
  }
  
  // Create aggregator file
  console.log(`\n${'='.repeat(60)}`);
  console.log('📝 Creating aggregator file...');
  console.log(`${'='.repeat(60)}`);
  
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
  console.log(`✅ Created part-flashcard-data-fr.ts`);
  
  console.log('\n' + '='.repeat(60));
  console.log('✨ Translation complete! All files created successfully.');
  console.log('='.repeat(60));
}

main().catch(console.error);
