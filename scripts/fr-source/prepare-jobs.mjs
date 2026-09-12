#!/usr/bin/env node
/**
 * Interactive translation assistant
 * Prepares translation jobs that can be processed by AI
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function prepareBatches() {
  const batches = [
    { input: 'en-fc-1-25-parts.json', start: 1, end: 25 },
    { input: 'en-fc-26-50-parts.json', start: 26, end: 50 },
    { input: 'en-fc-51-75-parts.json', start: 51, end: 75 },
    { input: 'en-fc-76-100-parts.json', start: 76, end: 100 },
  ];

  console.log('📊 Preparing translation batches...\n');

  // Create smaller sub-batches (5 parts each) for easier processing
  const subBatches = [];
  
  for (const batch of batches) {
    const inputPath = path.join(__dirname, batch.input);
    const partsArray = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    
    // Split into groups of 5 parts
    for (let i = 0; i < partsArray.length; i += 5) {
      const group = partsArray.slice(i, Math.min(i + 5, partsArray.length));
      const firstPart = group[0].part;
      const lastPart = group[group.length - 1].part;
      
      const outputFile = `translate-job-${firstPart}-${lastPart}.json`;
      const outputPath = path.join(__dirname, 'jobs', outputFile);
      
      // Create jobs directory
      const jobsDir = path.join(__dirname, 'jobs');
      if (!fs.existsSync(jobsDir)) {
        fs.mkdirSync(jobsDir, { recursive: true });
      }
      
      // Write job file
      fs.writeFileSync(outputPath, JSON.stringify(group, null, 2), 'utf8');
      
      console.log(`✅ Created job: ${outputFile} (${group.length} parts)`);
      
      subBatches.push({
        file: outputFile,
        parts: `${firstPart}-${lastPart}`,
        count: group.length
      });
    }
  }

  console.log(`\n📦 Total: ${subBatches.length} job files created`);
  console.log(`📁 Location: scripts/fr-source/jobs/\n`);
  
  // Create README for the jobs
  const readme = `# Translation Jobs

This folder contains translation job files (5 parts each) that need to be translated from English to French.

## Format

Each job file contains an array of parts with flashcard data. For each flashcard:
- Translate "side1" and "side2" fields to scholarly French
- Keep all other fields unchanged (id, file, card_number, tags, etc.)
- Preserve the Islamic honorific ﷺ

## Processing

The translate-complete.mjs script will process these jobs automatically if you have an Anthropic API key.

Alternatively, use Claude AI directly to translate each job file.
`;

  fs.writeFileSync(path.join(__dirname, 'jobs', 'README.md'), readme, 'utf8');
  
  return subBatches;
}

prepareBatches();
console.log('✨ Job files ready for translation!\n');
