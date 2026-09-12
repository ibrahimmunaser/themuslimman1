#!/usr/bin/env node
/**
 * Translate English quiz JSON files to French TypeScript files
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
  { input: 'en-qz-1-25.json', output: 'batch-01-25.ts', constant: 'PART_QUIZ_FR_1_25', range: '1-25' },
  { input: 'en-qz-26-50.json', output: 'batch-26-50.ts', constant: 'PART_QUIZ_FR_26_50', range: '26-50' },
  { input: 'en-qz-51-75.json', output: 'batch-51-75.ts', constant: 'PART_QUIZ_FR_51_75', range: '51-75' },
  { input: 'en-qz-76-100.json', output: 'batch-76-100.ts', constant: 'PART_QUIZ_FR_76_100', range: '76-100' },
];

/**
 * Translate quiz content using Claude
 */
async function translateQuiz(quiz, partNum) {
  console.log(`  Translating Part ${partNum}...`);
  
  const prompt = `You are translating Islamic education quiz questions from English to French.

Translate ONLY these fields to scholarly French appropriate for Islamic education:
- "question" (the question text)
- "options" (all 4 option strings in the array)
- "correct_answer" (must be the French translation of the correct English option)
- "explanation" (the explanation text)

Keep the Islamic honorific ﷺ (ṣallā llāhu ʿalayhi wa-sallam) unchanged.
Keep these fields EXACTLY as they are (do NOT translate):
- id, question_number, tags, part, question_count

CRITICAL: The correct_answer MUST be one of the translated options (exact match).
The correct_answer in French must be at the SAME array index as in English.

Translate the following quiz object:

${JSON.stringify(quiz, null, 2)}

Return ONLY valid JSON with the same structure, with question, options, correct_answer, and explanation translated to French.`;

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
    console.error(`❌ Translation failed for Part ${partNum}:`, error.message);
    throw error;
  }
}

/**
 * Validate translated quiz against English source
 */
function validateQuiz(frQuiz, enQuiz, partNum) {
  const issues = [];
  
  if (frQuiz.part !== enQuiz.part) {
    issues.push(`Part number mismatch: ${frQuiz.part} !== ${enQuiz.part}`);
  }
  
  if (frQuiz.question_count !== enQuiz.question_count) {
    issues.push(`Question count mismatch: ${frQuiz.question_count} !== ${enQuiz.question_count}`);
  }
  
  if (frQuiz.questions.length !== enQuiz.questions.length) {
    issues.push(`Questions array length mismatch: ${frQuiz.questions.length} !== ${enQuiz.questions.length}`);
  }
  
  frQuiz.questions.forEach((frQ, idx) => {
    const enQ = enQuiz.questions[idx];
    if (!enQ) return;
    
    if (frQ.id !== enQ.id) {
      issues.push(`Q${idx + 1}: ID mismatch`);
    }
    
    if (frQ.question_number !== enQ.question_number) {
      issues.push(`Q${idx + 1}: question_number mismatch`);
    }
    
    if (JSON.stringify(frQ.tags) !== JSON.stringify(enQ.tags)) {
      issues.push(`Q${idx + 1}: tags should not be translated`);
    }
    
    if (frQ.options.length !== 4) {
      issues.push(`Q${idx + 1}: must have exactly 4 options`);
    }
    
    if (!frQ.options.includes(frQ.correct_answer)) {
      issues.push(`Q${idx + 1}: correct_answer "${frQ.correct_answer}" not in options`);
    }
    
    // Check that correct answer is at same index
    const enCorrectIdx = enQ.options.indexOf(enQ.correct_answer);
    const frCorrectIdx = frQ.options.indexOf(frQ.correct_answer);
    if (enCorrectIdx !== frCorrectIdx) {
      issues.push(`Q${idx + 1}: correct answer index mismatch (EN: ${enCorrectIdx}, FR: ${frCorrectIdx})`);
    }
  });
  
  if (issues.length > 0) {
    console.error(`❌ Validation failed for Part ${partNum}:`);
    issues.forEach(issue => console.error(`   - ${issue}`));
    return false;
  }
  
  return true;
}

/**
 * Process quizzes part by part
 */
async function translateBatch(enData, batchName) {
  const translated = {};
  const partNumbers = Object.keys(enData).map(Number).sort((a, b) => a - b);
  
  console.log(`📦 Processing ${partNumbers.length} parts: ${partNumbers.join(', ')}`);
  
  for (const partNum of partNumbers) {
    try {
      const frQuiz = await translateQuiz(enData[partNum], partNum);
      
      // Validate
      if (!validateQuiz(frQuiz, enData[partNum], partNum)) {
        throw new Error(`Validation failed for Part ${partNum}`);
      }
      
      translated[partNum] = frQuiz;
      console.log(`  ✅ Part ${partNum} complete`);
      
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
 * Main execution
 */
async function main() {
  console.log('🚀 Starting French quiz translation...\n');
  
  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY environment variable not set');
    console.error('Please set it in .env.local or export it');
    process.exit(1);
  }

  // Create output directory
  const outputDir = path.join(__dirname, '..', '..', 'lib', 'fr-quizzes');
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
      const frenchData = await translateBatch(englishData, config.range);
      
      // Generate TypeScript
      const tsContent = generateTypeScriptFile(frenchData, config.constant);
      
      // Write output
      fs.writeFileSync(outputPath, tsContent, 'utf8');
      console.log(`✅ Created ${config.output} (${Buffer.byteLength(tsContent, 'utf8')} bytes)`);
      
    } catch (error) {
      console.error(`❌ Failed to process ${config.range}:`, error.message);
      process.exit(1);
    }
  }
  
  // Create aggregator file
  console.log(`\n${'='.repeat(60)}`);
  console.log('📝 Creating aggregator file...');
  console.log(`${'='.repeat(60)}`);
  
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
  
  console.log('\n' + '='.repeat(60));
  console.log('✨ Translation complete! All files created successfully.');
  console.log('='.repeat(60));
}

main().catch(console.error);
