#!/usr/bin/env node
/**
 * Convert English flashcard JSON to TypeScript structure
 * Outputs the structure so it can be translated
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BATCH_CONFIGS = [
  { input: 'en-fc-1-25.json', output: 'en-fc-1-25-parts.json', range: '1-25' },
  { input: 'en-fc-26-50.json', output: 'en-fc-26-50-parts.json', range: '26-50' },
  { input: 'en-fc-51-75.json', output: 'en-fc-51-75-parts.json', range: '51-75' },
  { input: 'en-fc-76-100.json', output: 'en-fc-76-100-parts.json', range: '76-100' },
];

/**
 * Split large JSON into individual part files for easier processing
 */
function splitIntoParts(data, batchName) {
  const parts = Object.keys(data).map(Number).sort((a, b) => a - b);
  console.log(`📦 Batch ${batchName}: ${parts.length} parts (${parts[0]}-${parts[parts.length - 1]})`);
  
  return parts.map(partNum => ({
    part: partNum,
    data: data[partNum]
  }));
}

function main() {
  console.log('📊 Analyzing English flashcard files...\n');
  
  for (const config of BATCH_CONFIGS) {
    const inputPath = path.join(__dirname, config.input);
    const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    
    const parts = splitIntoParts(data, config.range);
    
    // Write individual part files for easier translation
    const outputPath = path.join(__dirname, config.output);
    fs.writeFileSync(outputPath, JSON.stringify(parts, null, 2), 'utf8');
    
    console.log(`  ✅ Created ${config.output} with ${parts.length} parts\n`);
  }
  
  console.log('✨ Done! Now we can translate each part individually.');
}

main();
