#!/usr/bin/env node
/**
 * Build French quiz TypeScript files from English JSON sources
 * Processes all 100 parts systematically
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BATCH_CONFIGS = [
  { input: 'en-qz-1-25.json', output: 'batch-01-25.ts', constant: 'PART_QUIZ_FR_1_25', range: [1, 25] },
  { input: 'en-qz-26-50.json', output: 'batch-26-50.ts', constant: 'PART_QUIZ_FR_26_50', range: [26, 50] },
  { input: 'en-qz-51-75.json', output: 'batch-51-75.ts', constant: 'PART_QUIZ_FR_51_75', range: [51, 75] },
  { input: 'en-qz-76-100.json', output: 'batch-76-100.ts', constant: 'PART_QUIZ_FR_76_100', range: [76, 100] },
];

/**
 * Generate TypeScript file content from quiz data
 */
function generateTypeScriptFile(data, constantName) {
  const parts = Object.keys(data).map(Number).sort((a, b) => a - b);
  
  let tsContent = 'import type { Quiz } from "../types";\n\n';
  tsContent += `export const ${constantName}: Record<number, Quiz> = {\n`;
  
  parts.forEach((partNum, idx) => {
    const quiz = data[partNum];
    
    tsContent += `  ${partNum}: {\n`;
    tsContent += `    part: ${quiz.part},\n`;
    tsContent += `    question_count: ${quiz.question_count},\n`;
    tsContent += `    questions: [\n`;
    
    quiz.questions.forEach((q, qIdx) => {
      tsContent += `      {\n`;
      tsContent += `        question_number: ${q.question_number},\n`;
      tsContent += `        question: ${JSON.stringify(q.question)},\n`;
      tsContent += `        options: [\n`;
      q.options.forEach(opt => {
        tsContent += `          ${JSON.stringify(opt)},\n`;
      });
      tsContent += `        ],\n`;
      tsContent += `        correct_answer: ${JSON.stringify(q.correct_answer)},\n`;
      tsContent += `        explanation: ${JSON.stringify(q.explanation)},\n`;
      tsContent += `        tags: [${q.tags.map(t => JSON.stringify(t)).join(', ')}],\n`;
      tsContent += `        id: ${JSON.stringify(q.id)},\n`;
      tsContent += `      }`;
      if (qIdx < quiz.questions.length - 1) tsContent += ',';
      tsContent += '\n';
    });
    
    tsContent += `    ],\n`;
    tsContent += `  }`;
    if (idx < parts.length - 1) tsContent += ',';
    tsContent += '\n';
  });
  
  tsContent += '};\n';
  
  return tsContent;
}

/**
 * Extract all English quiz data for translation
 */
function main() {
  console.log('🔄 Extracting English quiz data for translation...\n');
  
  // Create output directory for English extracts
  const extractDir = path.join(__dirname, 'quiz-extracts');
  if (!fs.existsSync(extractDir)) {
    fs.mkdirSync(extractDir, { recursive: true });
  }
  
  // Process each batch and extract for translation
  for (const config of BATCH_CONFIGS) {
    const inputPath = path.join(__dirname, config.input);
    const extractPath = path.join(extractDir, `extract-${config.range[0]}-${config.range[1]}.json`);
    
    console.log(`📖 Reading ${config.input}...`);
    const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    
    // Write extract for translation
    fs.writeFileSync(extractPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ Extracted parts ${config.range[0]}-${config.range[1]} (${Object.keys(data).length} parts)`);
  }
  
  console.log('\n✨ Extraction complete!');
  console.log('\nNext step: Translate the extracted files and place them in fr-quiz-translations/');
  console.log('Then run: node build-fr-quizzes-direct.mjs --build');
}

// Check if we're building from translations
if (process.argv.includes('--build')) {
  console.log('🏗️  Building TypeScript files from French translations...\n');
  
  const outputDir = path.join(__dirname, '..', '..', 'lib', 'fr-quizzes');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const translationDir = path.join(__dirname, 'fr-quiz-translations');
  
  for (const config of BATCH_CONFIGS) {
    const translationPath = path.join(translationDir, `fr-${config.range[0]}-${config.range[1]}.json`);
    const outputPath = path.join(outputDir, config.output);
    
    if (!fs.existsSync(translationPath)) {
      console.warn(`⚠️  Translation file not found: ${translationPath}`);
      continue;
    }
    
    console.log(`📖 Reading French translation for parts ${config.range[0]}-${config.range[1]}...`);
    const frenchData = JSON.parse(fs.readFileSync(translationPath, 'utf8'));
    
    const tsContent = generateTypeScriptFile(frenchData, config.constant);
    fs.writeFileSync(outputPath, tsContent, 'utf8');
    console.log(`✅ Created ${config.output} (${Buffer.byteLength(tsContent, 'utf8')} bytes)`);
  }
  
  // Create aggregator file
  const aggregatorContent = `import type { Quiz } from "./types";
import { PART_QUIZ_FR_1_25 } from "./fr-quizzes/batch-01-25";
import { PART_QUIZ_FR_26_50 } from "./fr-quizzes/batch-26-50";
import { PART_QUIZ_FR_51_75 } from "./fr-quizzes/batch-51-75";
import { PART_QUIZ_FR_76_100 } from "./fr-quizzes/batch-76-100";

/** Hardcoded French quizzes for all 100 parts — preferred over R2 at runtime. */
export const PART_QUIZ_FR: Record<number, Quiz> = {
  ...PART_QUIZ_FR_1_25,
  ...PART_QUIZ_FR_26_50,
  ...PART_QUIZ_FR_51_75,
  ...PART_QUIZ_FR_76_100,
};
`;
  
  const aggregatorPath = path.join(__dirname, '..', '..', 'lib', 'part-quiz-data-fr.ts');
  fs.writeFileSync(aggregatorPath, aggregatorContent, 'utf8');
  console.log(`✅ Created part-quiz-data-fr.ts`);
  
  console.log('\n✨ Build complete!');
} else {
  main();
}
