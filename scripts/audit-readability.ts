/**
 * Readability Audit Script — scans all 100 Seerah parts via the local API.
 *
 * Usage (run while `npm run dev` is active):
 *   npx ts-node --project tsconfig.json scripts/audit-readability.ts
 *   -- or --
 *   npx tsx scripts/audit-readability.ts
 *
 * Output:
 *   reports/readability-audit.json
 *   reports/readability-audit.csv
 *   reports/READABILITY-AUDIT-SUMMARY.md
 */

import fs from "fs";
import path from "path";

// ─── Config ──────────────────────────────────────────────────────────────────

const BASE_URL = process.env.AUDIT_BASE_URL ?? "http://localhost:3000";
const TOTAL_PARTS = 100;
const OUT_DIR = path.join(__dirname, "..", "reports");

// ─── Types ────────────────────────────────────────────────────────────────────

type Severity = "high" | "medium" | "low";
type ResourceType = "briefing" | "facts" | "study_guide" | "report";
type IssueType =
  | "tab_table_unrendered"
  | "genealogy_chain_unstructured"
  | "name_notes_mixed_in_list"
  | "repeated_short_lines_not_bullets"
  | "encoding_corruption"
  | "dense_paragraph_no_headings"
  | "caution_note_buried"
  | "comparison_not_structured"
  | "nested_bullets_flattened"
  | "missing_content";
type FixSource = "renderer" | "source_content" | "both";

interface Issue {
  partNumber: number;
  resourceType: ResourceType;
  section: string;
  issueType: IssueType;
  severity: Severity;
  problem: string;
  recommendation: string;
  fixSource: FixSource;
  affectsLaunch: boolean;
}

interface PartContent {
  briefingText: string | null;
  statementOfFactsText: string | null;
  studyGuideText: string | null;
  reportText: string | null;
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchPartContent(partNum: number, retries = 2): Promise<PartContent | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}/api/part/${partNum}/content`, {
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) return null;
      return (await res.json()) as PartContent;
    } catch {
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
      }
    }
  }
  return null;
}

// ─── Detectors ────────────────────────────────────────────────────────────────

function detectTabTable(text: string): boolean {
  return text.includes("\t");
}

function detectEncodingCorruption(text: string): boolean {
  // Mojibake patterns: replacement character or suspicious ? sequences
  return /\uFFFD|[^\x00-\x7F\u0600-\u06FF\u0750-\u077F\s]{3,}/.test(text);
}

function detectGenealogyChain(text: string): { found: boolean; lineCount: number } {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const genealogyPattern = /\bbin\b|\bbint\b/i;
  const matchingLines = lines.filter(l => genealogyPattern.test(l));
  return { found: matchingLines.length >= 3, lineCount: matchingLines.length };
}

function detectNameNotes(text: string): { found: boolean; count: number } {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const nameNotePattern = /\bname was\b|\bwas called\b|\balso called\b|\bknown as\b/i;
  const matches = lines.filter(l => nameNotePattern.test(l));
  return { found: matches.length >= 2, count: matches.length };
}

function detectRepeatedShortLines(text: string): { found: boolean; clusters: number } {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  let clusters = 0;
  let streak = 0;
  for (const line of lines) {
    // Short factual sentence, not already a bullet/heading
    if (line.length > 10 && line.length < 120 && line.endsWith(".") && !line.startsWith("*") && !line.startsWith("-")) {
      streak++;
      if (streak === 4) clusters++; // count once per cluster of 4+
    } else {
      streak = 0;
    }
  }
  return { found: clusters > 0, clusters };
}

function detectCautionNote(text: string): boolean {
  const cautionPhrases = [
    /not treated as.{0,40}authenticated/i,
    /reports differ/i,
    /stronger view is/i,
    /should not be overstated/i,
    /requires caution/i,
    /narration.{0,30}weak/i,
    /lack.{0,30}certainty/i,
    /transmitted tradition/i,
    /less certain/i,
  ];
  return cautionPhrases.some(r => r.test(text));
}

function detectDenseParagraphs(text: string): boolean {
  const paragraphs = text.split(/\n\s*\n/).map(p => p.trim());
  return paragraphs.some(p => p.length > 600 && !p.includes("\n"));
}

function detectMissingHeadings(text: string): boolean {
  const wordCount = text.split(/\s+/).length;
  // Long content with no heading-like lines
  if (wordCount < 200) return false;
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const headingLike = lines.filter(
    l =>
      (l === l.toUpperCase() && l.length > 3) ||
      (l.match(/^[A-Z]/) && l.endsWith(":") && l.length < 80) ||
      l.match(/^#+\s/)
  );
  return headingLike.length === 0;
}

function detectNestedBullets(text: string): boolean {
  // Indented bullets that might be flattened by renderer
  return /^ {2,}[\*\-•]\s/m.test(text);
}

// ─── Audit a single resource ──────────────────────────────────────────────────

function auditResource(
  partNumber: number,
  resourceType: ResourceType,
  text: string | null
): Issue[] {
  const issues: Issue[] = [];

  if (!text) {
    if (resourceType === "briefing") {
      issues.push({
        partNumber,
        resourceType,
        section: "(entire resource)",
        issueType: "missing_content",
        severity: "high",
        problem: "Briefing text is missing or could not be loaded.",
        recommendation: "Upload briefing file to R2 / check filename convention.",
        fixSource: "source_content",
        affectsLaunch: true,
      });
    }
    return issues;
  }

  // Tab-separated tables unrendered
  if (detectTabTable(text)) {
    issues.push({
      partNumber,
      resourceType,
      section: "table section",
      issueType: "tab_table_unrendered",
      severity: resourceType === "briefing" ? "high" : "medium",
      problem: "Content contains tab-separated columns that render as plain text without structure.",
      recommendation: "Renderer now handles tab tables — verify visually. If still broken, source may need re-encoding.",
      fixSource: "renderer",
      affectsLaunch: resourceType === "briefing",
    });
  }

  // Encoding corruption
  if (detectEncodingCorruption(text)) {
    issues.push({
      partNumber,
      resourceType,
      section: "(throughout)",
      issueType: "encoding_corruption",
      severity: "medium",
      problem: "Text contains garbled/corrupted characters (possible UTF-8 encoding issue in source file).",
      recommendation: "Re-save source file as UTF-8 without BOM. Check for Windows-1252 encoding artifacts.",
      fixSource: "source_content",
      affectsLaunch: false,
    });
  }

  // Genealogy chain not structured
  const genealogy = detectGenealogyChain(text);
  if (genealogy.found) {
    issues.push({
      partNumber,
      resourceType,
      section: "genealogy/lineage section",
      issueType: "genealogy_chain_unstructured",
      severity: resourceType === "facts" ? "high" : "medium",
      problem: `${genealogy.lineCount} "bin/bint" genealogy lines appear as plain numbered/bulleted items without visual chain structure.`,
      recommendation:
        "Renderer or source: separate main lineage from name-notes. Render lineage as a vertical chain card with gold accents.",
      fixSource: "both",
      affectsLaunch: partNumber <= 15,
    });
  }

  // Name notes mixed in
  const nameNotes = detectNameNotes(text);
  if (nameNotes.found) {
    issues.push({
      partNumber,
      resourceType,
      section: "name notes",
      issueType: "name_notes_mixed_in_list",
      severity: "low",
      problem: `${nameNotes.count} "was called / name was" notes are scattered inline with lineage or body text.`,
      recommendation:
        'Group into a "Name Notes" or "Also Known As" callout section for easier scanning.',
      fixSource: "both",
      affectsLaunch: false,
    });
  }

  // Repeated short lines
  const shortLines = detectRepeatedShortLines(text);
  if (shortLines.found) {
    issues.push({
      partNumber,
      resourceType,
      section: "fact/list section",
      issueType: "repeated_short_lines_not_bullets",
      severity: "medium",
      problem: `Found ${shortLines.clusters} cluster(s) of 4+ consecutive short sentences that should be a bullet list.`,
      recommendation:
        "Convert clusters of short factual sentences to bullet lists in source. Low-risk auto-fix candidate.",
      fixSource: "source_content",
      affectsLaunch: false,
    });
  }

  // Caution note buried
  if (detectCautionNote(text)) {
    issues.push({
      partNumber,
      resourceType,
      section: "caution/authenticity note",
      issueType: "caution_note_buried",
      severity: "low",
      problem:
        'Authenticity warning or scholarly caution language is present but rendered as regular paragraph text.',
      recommendation:
        'Style as a muted gold callout with label "Authenticity Note" or "Scholarly Caution". Renderer improvement.',
      fixSource: "renderer",
      affectsLaunch: false,
    });
  }

  // Dense paragraphs
  if (detectDenseParagraphs(text)) {
    issues.push({
      partNumber,
      resourceType,
      section: "long paragraph",
      issueType: "dense_paragraph_no_headings",
      severity: "low",
      problem: "One or more paragraphs exceed 600 characters without an internal line break.",
      recommendation:
        "Split at sentence boundaries where logical. Flag for human review — do not auto-split.",
      fixSource: "source_content",
      affectsLaunch: false,
    });
  }

  // Missing headings in long content
  if (detectMissingHeadings(text)) {
    issues.push({
      partNumber,
      resourceType,
      section: "(entire resource)",
      issueType: "dense_paragraph_no_headings",
      severity: "low",
      problem: "Long content block has no discernible heading structure.",
      recommendation:
        "Add section headings to source content. Requires human judgment — do not auto-add.",
      fixSource: "source_content",
      affectsLaunch: false,
    });
  }

  // Nested bullets that were previously flattened
  if (detectNestedBullets(text)) {
    issues.push({
      partNumber,
      resourceType,
      section: "nested list section",
      issueType: "nested_bullets_flattened",
      severity: "low",
      problem:
        "Source contains indented bullet items (2+ spaces + *). These were previously rendered as flat bullets.",
      recommendation:
        "Renderer now detects indentation and renders nested lists — verify visually.",
      fixSource: "renderer",
      affectsLaunch: false,
    });
  }

  return issues;
}

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function csvEscape(value: string | number | boolean): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🔍  Seerah Readability Audit — scanning ${TOTAL_PARTS} parts via ${BASE_URL}\n`);

  const allIssues: Issue[] = [];
  const partsSeen: number[] = [];
  const partsMissingBriefing: number[] = [];
  let partsWithIssues = 0;

  for (let partNum = 1; partNum <= TOTAL_PARTS; partNum++) {
    process.stdout.write(`  Part ${String(partNum).padStart(3, " ")} … `);
    const content = await fetchPartContent(partNum);

    if (!content) {
      console.log("⚠  (API unavailable)");
      continue;
    }

    partsSeen.push(partNum);

    const issues: Issue[] = [
      ...auditResource(partNum, "briefing", content.briefingText),
      ...auditResource(partNum, "facts", content.statementOfFactsText),
      ...auditResource(partNum, "study_guide", content.studyGuideText),
      ...auditResource(partNum, "report", content.reportText),
    ];

    allIssues.push(...issues);
    if (issues.length > 0) partsWithIssues++;

    if (!content.briefingText) partsMissingBriefing.push(partNum);

    // Small pacing delay to avoid overwhelming the dev server
    await new Promise(r => setTimeout(r, 80));

    console.log(
      issues.length === 0
        ? "✅ clean"
        : `⚠  ${issues.length} issue(s): ${[...new Set(issues.map(i => i.issueType))].join(", ")}`
    );
  }

  // ── Aggregate stats ──────────────────────────────────────────────────────

  const issueTypeCounts: Record<string, number> = {};
  for (const issue of allIssues) {
    issueTypeCounts[issue.issueType] = (issueTypeCounts[issue.issueType] ?? 0) + 1;
  }
  const topIssues = Object.entries(issueTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const highSeverity = allIssues.filter(i => i.severity === "high");
  const rendererFixes = allIssues.filter(i => i.fixSource === "renderer" || i.fixSource === "both");
  const sourceFixes = allIssues.filter(i => i.fixSource === "source_content" || i.fixSource === "both");
  const launchCritical = allIssues.filter(i => i.affectsLaunch);

  const priorityParts = [...new Set(highSeverity.map(i => i.partNumber))].sort((a, b) => a - b);

  // ── Write JSON ────────────────────────────────────────────────────────────

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, "readability-audit.json"),
    JSON.stringify({ meta: { scannedAt: new Date().toISOString(), partsSeen: partsSeen.length, totalIssues: allIssues.length }, issues: allIssues }, null, 2)
  );

  // ── Write CSV ─────────────────────────────────────────────────────────────

  const csvHeader = [
    "partNumber",
    "resourceType",
    "section",
    "issueType",
    "severity",
    "problem",
    "recommendation",
    "fixSource",
    "affectsLaunch",
  ].join(",");
  const csvRows = allIssues.map(i =>
    [
      i.partNumber,
      i.resourceType,
      i.section,
      i.issueType,
      i.severity,
      i.problem,
      i.recommendation,
      i.fixSource,
      i.affectsLaunch,
    ]
      .map(csvEscape)
      .join(",")
  );
  fs.writeFileSync(
    path.join(OUT_DIR, "readability-audit.csv"),
    [csvHeader, ...csvRows].join("\n")
  );

  // ── Write Markdown summary ────────────────────────────────────────────────

  const md = `# Seerah Readability Audit Summary

**Generated:** ${new Date().toUTCString()}

---

## 1. Scan Scope

| Metric | Count |
|--------|-------|
| Parts scanned | ${partsSeen.length} / ${TOTAL_PARTS} |
| Parts with issues | ${partsWithIssues} |
| Total issues found | ${allIssues.length} |
| High-severity issues | ${highSeverity.length} |
| Launch-critical issues | ${launchCritical.length} |
| Parts missing briefing | ${partsMissingBriefing.length} |

---

## 2. Top Recurring Issue Types

| Issue Type | Count |
|-----------|-------|
${topIssues.map(([t, n]) => `| ${t} | ${n} |`).join("\n")}

---

## 3. Renderer vs Source Split

| Fix Type | Issue Count |
|----------|------------|
| Renderer fix only | ${allIssues.filter(i => i.fixSource === "renderer").length} |
| Source content fix only | ${allIssues.filter(i => i.fixSource === "source_content").length} |
| Both (renderer + source) | ${allIssues.filter(i => i.fixSource === "both").length} |

---

## 4. Highest-Priority Parts

${priorityParts.length > 0 ? priorityParts.map(p => `- Part ${p}`).join("\n") : "No high-severity parts found."}

---

## 5. Parts Missing Briefing

${partsMissingBriefing.length > 0 ? partsMissingBriefing.map(p => `- Part ${p}`).join("\n") : "All parts have briefing text."}

---

## 6. Recommended Safe Auto-Fixes (Low-Risk)

These can be applied without human review:

- **tab_table_unrendered** — Already fixed in renderer (tab-separated table support added).
- **nested_bullets_flattened** — Already fixed in renderer (indentation-aware list parsing added).
- **repeated_short_lines_not_bullets** — Conservative: flag for review, do not auto-rewrite sentences.

---

## 7. Issues Requiring Human Review

- **genealogy_chain_unstructured** — Separating lineage from name-notes requires judgment about content boundaries.
- **encoding_corruption** — Source files need manual re-encoding; cannot be auto-fixed in renderer.
- **caution_note_buried** — Detecting caution language and adding callout labels requires editorial review.
- **dense_paragraph_no_headings** — Adding headings requires content knowledge, not just pattern matching.

---

## 8. Part 1 Status

${allIssues.filter(i => i.partNumber === 1).length === 0 
  ? "✅ Part 1 has no detected readability issues."
  : allIssues.filter(i => i.partNumber === 1).map(i => `- **${i.severity.toUpperCase()}** [${i.resourceType}] ${i.issueType}: ${i.problem}`).join("\n")}

---

## 9. Renderer Improvements Already Deployed

| Fix | Status |
|-----|--------|
| Tab-separated table rendering | ✅ Deployed |
| Nested bullet list (indentation-aware) | ✅ Deployed |
| FactsViewer font size (text-sm → text-base) | ✅ Deployed |
| seerah-data-table CSS class | ✅ Deployed |
| seerah-nested-list CSS class | ✅ Deployed |

---

*Full issue list: \`reports/readability-audit.json\` and \`reports/readability-audit.csv\`*
`;

  fs.writeFileSync(path.join(OUT_DIR, "READABILITY-AUDIT-SUMMARY.md"), md);

  // ── Console summary ───────────────────────────────────────────────────────

  console.log(`
╔══════════════════════════════════════════════════════╗
║          READABILITY AUDIT COMPLETE                  ║
╠══════════════════════════════════════════════════════╣
║  Parts scanned:      ${String(partsSeen.length).padEnd(32)}║
║  Parts with issues:  ${String(partsWithIssues).padEnd(32)}║
║  Total issues:       ${String(allIssues.length).padEnd(32)}║
║  High severity:      ${String(highSeverity.length).padEnd(32)}║
║  Launch-critical:    ${String(launchCritical.length).padEnd(32)}║
╠══════════════════════════════════════════════════════╣
║  Top issue types:                                    ║
${topIssues.slice(0, 5).map(([t, n]) => `║    ${(t + ":").padEnd(34)}${String(n).padEnd(16)}║`).join("\n")}
╠══════════════════════════════════════════════════════╣
║  Output:                                             ║
║    reports/readability-audit.json                    ║
║    reports/readability-audit.csv                     ║
║    reports/READABILITY-AUDIT-SUMMARY.md              ║
╚══════════════════════════════════════════════════════╝
`);
}

main().catch(err => {
  console.error("Audit failed:", err);
  process.exit(1);
});
