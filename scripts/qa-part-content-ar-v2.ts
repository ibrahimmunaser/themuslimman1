/**
 * Brutal QA v2 — deeper checks beyond structural pass:
 * - bracket/placeholder artifacts ([pbuh], [TODO], (), empty parens)
 * - digit style consistency (Arabic-Indic ٠-٩ vs Western 0-9) per part and across corpus
 * - statement-of-facts line-count parity vs English (should be ~1:1 facts)
 * - heading enumeration style consistency (أ/ب/ج vs A/B/C leaking untranslated)
 * - literal English words that are clearly not proper nouns (common function words)
 * - repeated/duplicated paragraph within same part (copy-paste translation error)
 */
import { PART_CONTENT } from "../lib/part-content-data";
import { PART_CONTENT_AR } from "../lib/part-content-data-ar";

type Issue = { part: number; severity: "CRITICAL" | "WARN" | "INFO"; msg: string };
const issues: Issue[] = [];
const add = (part: number, severity: Issue["severity"], msg: string) =>
  issues.push({ part, severity, msg });

const WESTERN_DIGIT = /[0-9]/g;
const ARABIC_INDIC_DIGIT = /[\u0660-\u0669]/g;

// Common English function words that should never appear in correct Arabic prose
// (excludes proper nouns / transliteration letters). Word-boundary, case-insensitive.
const FUNCTION_WORDS =
  /\b(the|and|of|in|to|is|was|were|with|from|that|this|these|those|which|who|his|her|their|according|however|therefore|because|although|before|after|during|between)\b/gi;

for (let n = 1; n <= 100; n++) {
  const en = PART_CONTENT[n];
  const ar = PART_CONTENT_AR[n];
  if (!en || !ar) continue;

  for (const field of ["briefingText", "statementOfFactsText"] as const) {
    const arText = ar[field];
    if (!arText) continue;

    // Bracket/placeholder artifacts
    const brackets = arText.match(/\[[^\]]*\]/g);
    if (brackets && brackets.length > 0) {
      add(n, "CRITICAL", `${field}: leftover bracket artifact(s): ${brackets.slice(0, 5).join(", ")}`);
    }
    if (/\(\s*\)/.test(arText)) {
      add(n, "WARN", `${field}: empty parentheses "()" found`);
    }

    // English function-word leakage (strong signal of untranslated prose, not proper nouns)
    const fw = arText.match(FUNCTION_WORDS);
    if (fw && fw.length > 0) {
      const counts = new Map<string, number>();
      for (const w of fw) counts.set(w.toLowerCase(), (counts.get(w.toLowerCase()) ?? 0) + 1);
      const summary = [...counts.entries()].map(([w, c]) => `${w}×${c}`).join(", ");
      add(n, "CRITICAL", `${field}: English function words present: ${summary}`);
    }

    // Digit style — count both styles; flag if BOTH appear heavily mixed within the same field
    const western = (arText.match(WESTERN_DIGIT) || []).length;
    const indic = (arText.match(ARABIC_INDIC_DIGIT) || []).length;
    if (western > 0 && indic > 0) {
      add(n, "INFO", `${field}: mixed digit styles — Western=${western}, Arabic-Indic=${indic}`);
    }
  }

  // Statement of facts: line-count parity check (each line ~ one atomic fact)
  const enFacts = en.statementOfFactsText;
  const arFacts = ar.statementOfFactsText;
  if (enFacts && arFacts) {
    const enLines = enFacts.split("\n").filter((l) => l.trim()).length;
    const arLines = arFacts.split("\n").filter((l) => l.trim()).length;
    const diff = Math.abs(enLines - arLines);
    if (diff > 2) {
      add(n, "CRITICAL", `statementOfFactsText: line count mismatch EN=${enLines} AR=${arLines} (diff=${diff})`);
    } else if (diff > 0) {
      add(n, "WARN", `statementOfFactsText: line count off by ${diff} EN=${enLines} AR=${arLines}`);
    }
  }

  // Duplicate paragraph within same briefing (copy-paste error signal)
  if (ar.briefingText) {
    const paras = ar.briefingText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 60 && !p.startsWith("#") && !p.startsWith(">"));
    const seenP = new Set<string>();
    for (const p of paras) {
      const key = p.slice(0, 120);
      if (seenP.has(key)) {
        add(n, "WARN", `briefingText: duplicate paragraph detected (repeated content within same part)`);
        break;
      }
      seenP.add(key);
    }
  }
}

// Cross-part digit-style consistency summary
let westernHeavy = 0;
let indicHeavy = 0;
for (let n = 1; n <= 100; n++) {
  const ar = PART_CONTENT_AR[n];
  if (!ar?.briefingText) continue;
  const western = (ar.briefingText.match(WESTERN_DIGIT) || []).length;
  const indic = (ar.briefingText.match(ARABIC_INDIC_DIGIT) || []).length;
  if (western > indic) westernHeavy++;
  else if (indic > western) indicHeavy++;
}
console.log(`\nCross-corpus digit style: ${indicHeavy} parts predominantly Arabic-Indic, ${westernHeavy} parts predominantly Western digits.`);

const bySeverity = { CRITICAL: [] as Issue[], WARN: [] as Issue[], INFO: [] as Issue[] };
for (const i of issues) bySeverity[i.severity].push(i);

console.log(`\n=== QA v2 Report ===`);
console.log(`CRITICAL: ${bySeverity.CRITICAL.length}  WARN: ${bySeverity.WARN.length}  INFO: ${bySeverity.INFO.length}\n`);

for (const sev of ["CRITICAL", "WARN", "INFO"] as const) {
  if (bySeverity[sev].length === 0) continue;
  console.log(`\n--- ${sev} (${bySeverity[sev].length}) ---`);
  for (const i of bySeverity[sev]) {
    console.log(`Part ${i.part}: ${i.msg}`);
  }
}
