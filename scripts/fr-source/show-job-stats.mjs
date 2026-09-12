#!/usr/bin/env node
/**
 * Helper script to validate translation structure
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read a job file and show its structure
const jobPath = path.join(__dirname, 'jobs', 'translate-job-1-5.json');
const data = JSON.parse(fs.readFileSync(jobPath, 'utf8'));

console.log(`Parts in job: ${data.map(p => p.part).join(', ')}`);
console.log(`\nTotal flashcards to translate:`);

let totalCards = 0;
data.forEach(partObj => {
  const easy = partObj.data.easy?.length || 0;
  const medium = partObj.data.medium?.length || 0;
  const full = partObj.data.full?.length || 0;
  const partTotal = easy + medium + full;
  totalCards += partTotal;
  console.log(`  Part ${partObj.part}: ${partTotal} cards (easy:${easy}, medium:${medium}, full:${full})`);
});

console.log(`\nTotal: ${totalCards} cards in this job`);
console.log(`Fields to translate per card: 2 (side1 + side2)`);
console.log(`Total translations needed: ${totalCards * 2}\n`);
