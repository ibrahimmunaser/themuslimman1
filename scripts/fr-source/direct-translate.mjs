#!/usr/bin/env node
/**
 * Generate French quiz files with placeholders for manual translation
 * This creates properly structured TypeScript files that need French translations added
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// French translations mapping for common terms
const COMMON_TRANSLATIONS = {
  // Kept as-is
  "ﷺ": "ﷺ",
  
  // Geo locations
  "Arabian Peninsula": "la péninsule arabique",
  "Makkah": "La Mecque",
  "Madinah": "Médine",
  "Yemen": "le Yémen",
  "Red Sea": "la mer Rouge",
  "Arabian Gulf": "le golfe Arabique",
  "Arabian Sea": "la mer d'Arabie",
  "ash-Shām": "ash-Shām",
  
  // Common terms
  "According to the text": "Selon le texte",
  "The text states": "Le texte indique",
  "The text says": "Le texte dit",
  "The passage says": "Le passage dit",
};

const BATCH_CONFIGS = [
  { input: 'en-qz-1-25.json', output: 'batch-01-25.ts', constant: 'PART_QUIZ_FR_1_25', range: [1, 25] },
  { input: 'en-qz-26-50.json', output: 'batch-26-50.ts', constant: 'PART_QUIZ_FR_26_50', range: [26, 50] },
  { input: 'en-qz-51-75.json', output: 'batch-51-75.ts', constant: 'PART_QUIZ_FR_51_75', range: [51, 75] },
  { input: 'en-qz-76-100.json', output: 'batch-76-100.ts', constant: 'PART_QUIZ_FR_76_100', range: [76, 100] },
];

function escapeString(str) {
  return JSON.stringify(str);
}

function generateTypeScriptFile(enData, constantName) {
  const parts = Object.keys(enData).map(Number).sort((a, b) => a - b);
  
  let tsContent = '// THIS FILE CONTAINS ENGLISH TEXT - NEEDS FRENCH TRANSLATION\n';
  tsContent += '// Translate: question, options, correct_answer, explanation\n';
  tsContent += '// Keep unchanged: id, question_number, tags, part, question_count\n';
  tsContent += '// Keep ﷺ unchanged\n\n';
  tsContent += 'import type { Quiz } from "../types";\n\n';
  tsContent += `export const ${constantName}: Record<number, Quiz> = {\n`;
  
  parts.forEach((partNum, idx) => {
    const quiz = enData[partNum];
    
    tsContent += `  ${partNum}: {\n`;
    tsContent += `    part: ${quiz.part},\n`;
    tsContent += `    question_count: ${quiz.question_count},\n`;
    tsContent += `    questions: [\n`;
    
    quiz.questions.forEach((q, qIdx) => {
      tsContent += `      {\n`;
      tsContent += `        question_number: ${q.question_number},\n`;
      tsContent += `        question: ${escapeString(q.question)}, // TODO: Translate to French\n`;
      tsContent += `        options: [\n`;
      q.options.forEach(opt => {
        tsContent += `          ${escapeString(opt)}, // TODO: Translate to French\n`;
      });
      tsContent += `        ],\n`;
      tsContent += `        correct_answer: ${escapeString(q.correct_answer)}, // TODO: Must match one of the French options\n`;
      tsContent += `        explanation: ${escapeString(q.explanation)}, // TODO: Translate to French\n`;
      tsContent += `        tags: [${q.tags.map(t => escapeString(t)).join(', ')}],\n`;
      tsContent += `        id: ${escapeString(q.id)},\n`;
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

function main() {
  console.log('🔧 Generating French quiz template files...\n');
  
  const outputDir = path.join(__dirname, '..', '..', 'lib', 'fr-quizzes');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`✅ Created directory: ${outputDir}\n`);
  }

  // Generate template files
  for (const config of BATCH_CONFIGS) {
    const inputPath = path.join(__dirname, config.input);
    const outputPath = path.join(outputDir, config.output);
    
    console.log(`📖 Reading ${config.input}...`);
    const englishData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    
    const tsContent = generateTypeScriptFile(englishData, config.constant);
    fs.writeFileSync(outputPath, tsContent, 'utf8');
    console.log(`✅ Created template: ${config.output} (${Buffer.byteLength(tsContent, 'utf8')} bytes)`);
  }
  
  console.log('\n📝 Template files created. Manual French translation required.');
  console.log('   Each file contains English text with // TODO comments');
  console.log('   indicating what needs to be translated to French.\n');
}

main();
