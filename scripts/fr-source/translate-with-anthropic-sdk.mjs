#!/usr/bin/env node
/**
 * Translate English quiz JSON files to French using Anthropic SDK
 * Install with: npm install @anthropic-ai/sdk
 * Run with: ANTHROPIC_API_KEY=your_key node translate-with-anthropic-sdk.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load from environment or .env file
let ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.log('⚠️  ANTHROPIC_API_KEY not found in environment');
  console.log('💡 Please provide API key as argument or set environment variable');
  console.log('   Usage: node translate-with-anthropic-sdk.mjs YOUR_API_KEY');
  
  if (process.argv[2] && process.argv[2].startsWith('sk-')) {
    ANTHROPIC_API_KEY = process.argv[2];
    console.log('✅ Using API key from command line argument');
  } else {
    process.exit(1);
  }
}

// Dynamically import Anthropic
let anthropic;
try {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  console.log('✅ Anthropic SDK loaded successfully\n');
} catch (error) {
  console.error('❌ Failed to load @anthropic-ai/sdk');
  console.error('   Install with: npm install @anthropic-ai/sdk');
  process.exit(1);
}

const BATCH_CONFIGS = [
  { input: 'en-qz-1-25.json', output: 'batch-01-25.ts', constant: 'PART_QUIZ_FR_1_25', range: [1, 25] },
  { input: 'en-qz-26-50.json', output: 'batch-26-50.ts', constant: 'PART_QUIZ_FR_26_50', range: [26, 50] },
  { input: 'en-qz-51-75.json', output: 'batch-51-75.ts', constant: 'PART_QUIZ_FR_51_75', range: [51, 75] },
  { input: 'en-qz-76-100.json', output: 'batch-76-100.ts', constant: 'PART_QUIZ_FR_76_100', range: [76, 100] },
];

async function translateQuiz(quiz, partNum) {
  console.log(`  🔄 Translating Part ${partNum} (${quiz.question_count} questions)...`);
  
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
    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) || responseText.match(/```\n?([\s\S]*?)\n?```/);
    const jsonText = jsonMatch ? jsonMatch[1] : responseText;
    
    return JSON.parse(jsonText);
  } catch (error) {
    console.error(`❌ Translation failed for Part ${partNum}:`, error.message);
    throw error;
  }
}

function validateQuiz(frQuiz, enQuiz, partNum) {
  const issues = [];
  
  if (frQuiz.part !== enQuiz.part) issues.push(`Part number mismatch`);
  if (frQuiz.question_count !== enQuiz.question_count) issues.push(`Question count mismatch`);
  if (frQuiz.questions.length !== enQuiz.questions.length) issues.push(`Questions array length mismatch`);
  
  frQuiz.questions.forEach((frQ, idx) => {
    const enQ = enQuiz.questions[idx];
    if (!enQ) return;
    
    if (frQ.id !== enQ.id) issues.push(`Q${idx + 1}: ID mismatch`);
    if (frQ.question_number !== enQ.question_number) issues.push(`Q${idx + 1}: question_number mismatch`);
    if (JSON.stringify(frQ.tags) !== JSON.stringify(enQ.tags)) issues.push(`Q${idx + 1}: tags should not be translated`);
    if (frQ.options.length !== 4) issues.push(`Q${idx + 1}: must have exactly 4 options`);
    if (!frQ.options.includes(frQ.correct_answer)) issues.push(`Q${idx + 1}: correct_answer not in options`);
    
    const enCorrectIdx = enQ.options.indexOf(enQ.correct_answer);
    const frCorrectIdx = frQ.options.indexOf(frQ.correct_answer);
    if (enCorrectIdx !== frCorrectIdx) issues.push(`Q${idx + 1}: correct answer index mismatch`);
  });
  
  if (issues.length > 0) {
    console.error(`❌ Validation failed for Part ${partNum}:`);
    issues.forEach(issue => console.error(`   - ${issue}`));
    return false;
  }
  
  return true;
}

async function translateBatch(enData, batchName) {
  const translated = {};
  const partNumbers = Object.keys(enData).map(Number).sort((a, b) => a - b);
  
  console.log(`📦 Processing ${partNumbers.length} parts for ${batchName}`);
  
  for (const partNum of partNumbers) {
    try {
      const frQuiz = await translateQuiz(enData[partNum], partNum);
      
      if (!validateQuiz(frQuiz, enData[partNum], partNum)) {
        throw new Error(`Validation failed for Part ${partNum}`);
      }
      
      translated[partNum] = frQuiz;
      console.log(`  ✅ Part ${partNum} complete`);
      
      // Delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`  ❌ Failed: ${error.message}`);
      throw error;
    }
  }
  
  return translated;
}

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

async function main() {
  console.log('🚀 Starting French quiz translation with Anthropic Claude...\n');
  
  const outputDir = path.join(__dirname, '..', '..', 'lib', 'fr-quizzes');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`✅ Created directory: ${outputDir}\n`);
  }

  for (const config of BATCH_CONFIGS) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📚 Processing batch: parts ${config.range[0]}-${config.range[1]}`);
    console.log(`${'='.repeat(60)}`);
    
    const inputPath = path.join(__dirname, config.input);
    const outputPath = path.join(outputDir, config.output);
    
    try {
      console.log(`📖 Reading ${config.input}...`);
      const englishData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
      
      const frenchData = await translateBatch(englishData, `parts ${config.range[0]}-${config.range[1]}`);
      
      const tsContent = generateTypeScriptFile(frenchData, config.constant);
      
      fs.writeFileSync(outputPath, tsContent, 'utf8');
      console.log(`✅ Created ${config.output} (${Buffer.byteLength(tsContent, 'utf8')} bytes)`);
      
    } catch (error) {
      console.error(`❌ Failed to process batch ${config.range[0]}-${config.range[1]}:`, error.message);
      process.exit(1);
    }
  }
  
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
  console.log('✨ Translation complete! All 100 French quizzes created successfully.');
  console.log('='.repeat(60));
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});
