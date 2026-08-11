/**
 * Brutal QA audit of PART_CONTENT_AR vs PART_CONTENT (English source).
 * Flags: missing/null fields, English leakage, mojibake, markdown structure
 * mismatches (heading/list/table/blockquote counts), suspicious length ratios,
 * duplicate content across parts, and formatting artifacts.
 *
 *   npx tsx scripts/qa-part-content-ar.ts
 */
import { PART_CONTENT } from "../lib/part-content-data";
import { PART_CONTENT_AR } from "../lib/part-content-data-ar";

type Issue = { part: number; severity: "CRITICAL" | "WARN" | "INFO"; msg: string };
const issues: Issue[] = [];
const add = (part: number, severity: Issue["severity"], msg: string) =>
  issues.push({ part, severity, msg });

const ARABIC_RE = /[\u0600-\u06FF]/;
// Latin letters excluding common transliteration diacritics/marks we allow inside AR text
// (e.g. names in parens are fine); we flag long runs of Latin words instead.
const LONG_LATIN_RUN = /[A-Za-z][A-Za-z ,.'-]{14,}[A-Za-z]/g;

function countMd(text: string) {
  const lines = text.split("\n");
  let h2 = 0,
    h3 = 0,
    bullets = 0,
    nested = 0,
    blockquote = 0,
    tableRows = 0,
    bold = 0;
  for (const raw of lines) {
    const line = raw.replace(/\r$/, "");
    const trimmed = line.trim();
    const indent = line.length - line.trimStart().length;
    if (/^##\s+/.test(trimmed) && !/^###/.test(trimmed)) h2++;
    else if (/^###\s+/.test(trimmed)) h3++;
    if (/^[-*•]\s+/.test(trimmed)) {
      if (indent >= 2) nested++;
      else bullets++;
    }
    if (/^>\s?/.test(trimmed)) blockquote++;
    if (/^\|/.test(trimmed)) tableRows++;
    bold += (trimmed.match(/\*\*[^*]+\*\*/g) || []).length;
  }
  return { h2, h3, bullets, nested, blockquote, tableRows, bold };
}

function checkField(
  part: number,
  fieldName: "briefingText" | "statementOfFactsText",
  en: string | null,
  ar: string | null,
) {
  if (en && !ar) {
    add(part, "CRITICAL", `${fieldName}: English exists but Arabic is NULL/missing`);
    return;
  }
  if (!en && ar) {
    add(part, "WARN", `${fieldName}: Arabic exists but English source is null (unexpected)`);
    return;
  }
  if (!en && !ar) return;
  const enText = en as string;
  const arText = ar as string;

  if (!ARABIC_RE.test(arText)) {
    add(part, "CRITICAL", `${fieldName}: contains NO Arabic characters at all`);
    return;
  }

  // English leakage: long runs of Latin words outside of allowed proper nouns/parens.
  const latinRuns = arText.match(LONG_LATIN_RUN) || [];
  const suspicious = latinRuns.filter((r) => {
    const words = r.trim().split(/\s+/);
    // Allow short proper-noun-ish runs (e.g. "Ibn Hisham", "Sahih Bukhari") — flag 4+ word runs
    return words.length >= 4;
  });
  if (suspicious.length > 0) {
    add(
      part,
      "CRITICAL",
      `${fieldName}: possible untranslated English run(s): ${suspicious.slice(0, 3).map((s) => `"${s.trim()}"`).join(" | ")}`,
    );
  }

  // Mojibake / replacement character check
  if (arText.includes("\uFFFD")) {
    add(part, "CRITICAL", `${fieldName}: contains U+FFFD replacement character (encoding corruption)`);
  }

  // Length sanity: AR should not be wildly shorter/longer than EN (rough proxy for truncation)
  const ratio = arText.length / enText.length;
  if (ratio < 0.35) {
    add(part, "CRITICAL", `${fieldName}: AR is only ${(ratio * 100).toFixed(0)}% length of EN — likely truncated`);
  } else if (ratio > 2.2) {
    add(part, "WARN", `${fieldName}: AR is ${(ratio * 100).toFixed(0)}% length of EN — unusually long`);
  }

  // Markdown structure comparison (briefing only — facts is plain lines)
  if (fieldName === "briefingText") {
    const enMd = countMd(enText);
    const arMd = countMd(arText);
    if (enMd.h2 !== arMd.h2) {
      add(part, "WARN", `briefingText: H2 count mismatch EN=${enMd.h2} AR=${arMd.h2}`);
    }
    if (enMd.h3 !== arMd.h3) {
      add(part, "WARN", `briefingText: H3 count mismatch EN=${enMd.h3} AR=${arMd.h3}`);
    }
    if (Math.abs(enMd.bullets - arMd.bullets) > 2) {
      add(part, "WARN", `briefingText: top-level bullet count differs a lot EN=${enMd.bullets} AR=${arMd.bullets}`);
    }
    if (enMd.tableRows > 0 && arMd.tableRows === 0) {
      add(part, "CRITICAL", `briefingText: EN has a markdown table (${enMd.tableRows} rows) but AR has none — table lost`);
    }
    if (enMd.blockquote > 0 && arMd.blockquote === 0) {
      add(part, "WARN", `briefingText: EN has blockquote(s) but AR has none`);
    }
  }

  // Prophet symbol check — English uses ﷺ; Arabic should too if English does
  const enHasSaw = enText.includes("ﷺ");
  const arHasSaw = arText.includes("ﷺ");
  if (enHasSaw && !arHasSaw) {
    add(part, "WARN", `${fieldName}: EN uses ﷺ but AR has none`);
  }

  // Check stray literal "undefined"/"null"/"[object Object]" artifacts
  if (/\bundefined\b|\bnull\b|\[object Object\]/i.test(arText)) {
    add(part, "CRITICAL", `${fieldName}: contains literal "undefined"/"null"/"[object Object]" artifact`);
  }

  // Unbalanced markdown bold markers
  const starCount = (arText.match(/\*\*/g) || []).length;
  if (starCount % 2 !== 0) {
    add(part, "WARN", `${fieldName}: odd number of "**" markers (${starCount}) — unbalanced bold`);
  }

  // Unbalanced parens/brackets (rough)
  const openParen = (arText.match(/\(/g) || []).length;
  const closeParen = (arText.match(/\)/g) || []).length;
  if (Math.abs(openParen - closeParen) > 1) {
    add(part, "WARN", `${fieldName}: unbalanced parentheses (${openParen} open vs ${closeParen} close)`);
  }
}

function checkHtml(part: number, briefingText: string | null, briefingHtml: string | null) {
  if (!briefingText) return;
  if (!briefingHtml) {
    add(part, "CRITICAL", `briefingHtml: missing despite briefingText present`);
    return;
  }
  if (briefingHtml.includes("\uFFFD")) {
    add(part, "CRITICAL", `briefingHtml: contains replacement character`);
  }
  // Every H2 in briefingHtml should not itself start with a bullet dash (formatter bug regression check)
  const badH2 = briefingHtml.match(/<h2[^>]*>-\s/g);
  if (badH2 && badH2.length > 0) {
    add(part, "CRITICAL", `briefingHtml: ${badH2.length} <h2> heading(s) start with "- " — bullets misrendered as headings`);
  }
  // Check for unclosed tags (very rough balance check on <ul>/<li>)
  const ulOpen = (briefingHtml.match(/<ul[^>]*>/g) || []).length;
  const ulClose = (briefingHtml.match(/<\/ul>/g) || []).length;
  if (ulOpen !== ulClose) {
    add(part, "CRITICAL", `briefingHtml: <ul> open/close mismatch (${ulOpen} vs ${ulClose})`);
  }
  const liOpen = (briefingHtml.match(/<li[^>]*>/g) || []).length;
  const liClose = (briefingHtml.match(/<\/li>/g) || []).length;
  if (liOpen !== liClose) {
    add(part, "CRITICAL", `briefingHtml: <li> open/close mismatch (${liOpen} vs ${liClose})`);
  }
  const tblOpen = (briefingHtml.match(/<table[^>]*>/g) || []).length;
  const tblClose = (briefingHtml.match(/<\/table>/g) || []).length;
  if (tblOpen !== tblClose) {
    add(part, "CRITICAL", `briefingHtml: <table> open/close mismatch (${tblOpen} vs ${tblClose})`);
  }
  // Raw markdown leaking into HTML (unconverted ** or ## visible as text)
  if (/>##\s/.test(briefingHtml) || />###\s/.test(briefingHtml)) {
    add(part, "WARN", `briefingHtml: raw "##"/"###" markdown visible in rendered text`);
  }
}

// Duplicate-content detection: hash briefingText across parts to catch copy-paste errors
const seen = new Map<string, number>();

let total = 0;
for (let n = 1; n <= 100; n++) {
  total++;
  const en = PART_CONTENT[n];
  const ar = PART_CONTENT_AR[n];

  if (!en) {
    add(n, "WARN", "No English source entry (skipped)");
    continue;
  }
  if (!ar) {
    add(n, "CRITICAL", "PART_CONTENT_AR entry entirely MISSING");
    continue;
  }

  checkField(n, "briefingText", en.briefingText, ar.briefingText);
  checkField(n, "statementOfFactsText", en.statementOfFactsText, ar.statementOfFactsText);
  checkHtml(n, ar.briefingText, ar.briefingHtml);

  if (ar.briefingText) {
    const key = ar.briefingText.slice(0, 200);
    if (seen.has(key)) {
      add(n, "CRITICAL", `briefingText appears to duplicate part ${seen.get(key)} (same opening 200 chars)`);
    } else {
      seen.set(key, n);
    }
  }
}

// ─── Report ──────────────────────────────────────────────────────────────
const bySeverity = { CRITICAL: [] as Issue[], WARN: [] as Issue[], INFO: [] as Issue[] };
for (const i of issues) bySeverity[i.severity].push(i);

console.log(`\n=== QA Report: ${total} parts checked ===`);
console.log(`CRITICAL: ${bySeverity.CRITICAL.length}  WARN: ${bySeverity.WARN.length}  INFO: ${bySeverity.INFO.length}\n`);

for (const sev of ["CRITICAL", "WARN", "INFO"] as const) {
  if (bySeverity[sev].length === 0) continue;
  console.log(`\n--- ${sev} (${bySeverity[sev].length}) ---`);
  for (const i of bySeverity[sev]) {
    console.log(`Part ${i.part}: ${i.msg}`);
  }
}

if (bySeverity.CRITICAL.length === 0) {
  console.log("\nNo CRITICAL issues found.");
}
