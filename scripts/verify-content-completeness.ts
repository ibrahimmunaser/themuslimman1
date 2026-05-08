/**
 * Content Completeness Verification Script
 * 
 * Checks all 100 Seerah parts for asset availability before launch.
 * Outputs: Console table, JSON report, CSV report
 * 
 * Usage: npx tsx scripts/verify-content-completeness.ts
 */

// CRITICAL: Load environment variables FIRST, before any other imports
import { config } from "dotenv";
import path from "path";

config({ path: path.join(process.cwd(), ".env") });
config({ path: path.join(process.cwd(), ".env.local"), override: true });

// Now import everything else after env vars are loaded
import fs from "fs";
import { PARTS } from "../lib/content";
import {
  videoExists,
  audioExists,
  readBriefing,
  readStatementOfFacts,
  readStudyGuide,
  readReport,
  readQuiz,
  readFlashcards,
  mindmapExists,
  getSlideFiles,
  getInfographicFilename,
} from "../lib/files";

// Debug: Check which storage mode we're using
console.log("\n🔍 STORAGE CONFIGURATION:");
console.log(`R2_BUCKET: ${process.env.R2_BUCKET ? "✓ Set" : "✗ Not set"}`);
console.log(`R2_ACCESS_KEY_ID: ${process.env.R2_ACCESS_KEY_ID ? "✓ Set" : "✗ Not set"}`);
console.log(`USE_R2 Flag: ${(process.env.R2_BUCKET && process.env.R2_ACCESS_KEY_ID) ? "✅ ENABLED (checking R2)" : "❌ DISABLED (checking local files)"}`);
console.log(`SEERAH_DATA_DIR: ${process.env.SEERAH_DATA_DIR || path.resolve(process.cwd(), "..", "Seerah-data")}\n`);

// ─── Types ────────────────────────────────────────────────────────────────────

interface PartAssetStatus {
  partNumber: number;
  title: string;
  video: "present" | "missing";
  audio: "present" | "missing";
  briefing: "present" | "missing";
  statementOfFacts: "present" | "missing";
  studyGuide: "present" | "missing";
  report: "present" | "missing";
  quiz: "present" | "missing";
  flashcards: "present" | "missing";
  mindmap: "present" | "missing";
  slidesPresentedCount: number;
  slidesDetailedCount: number;
  slidesFactsCount: number;
  infographicConcise: "present" | "missing";
  infographicStandard: "present" | "missing";
  infographicBento: "present" | "missing";
  missingRequiredAssets: string[];
  launchReady: boolean;
}

interface SummaryStats {
  totalPartsChecked: number;
  fullyReady: number;
  missingVideo: number;
  missingBriefing: number;
  missingQuiz: number;
  missingFlashcards: number;
  missingAnyRequired: number;
  partsWithIssues: Array<{
    partNumber: number;
    title: string;
    missingAssets: string[];
  }>;
}

// ─── Asset Checking Functions ─────────────────────────────────────────────────

async function checkPartAssets(partNumber: number, title: string): Promise<PartAssetStatus> {
  console.log(`[${partNumber}/100] Checking: ${title}...`);

  // Check all assets in parallel for speed
  const [
    hasVideo,
    hasAudio,
    briefingText,
    factsText,
    studyGuideText,
    reportText,
    quizData,
    flashcardsData,
    hasMindmap,
    slidesPresented,
    slidesDetailed,
    slidesFacts,
    infoConcise,
    infoStandard,
    infoBento,
  ] = await Promise.all([
    videoExists(partNumber).catch(() => false),
    audioExists(partNumber).catch(() => false),
    readBriefing(partNumber).catch(() => null),
    readStatementOfFacts(partNumber).catch(() => null),
    readStudyGuide(partNumber).catch(() => null),
    readReport(partNumber).catch(() => null),
    readQuiz(partNumber).catch(() => null),
    readFlashcards(partNumber).catch(() => null),
    mindmapExists(partNumber).catch(() => false),
    getSlideFiles(partNumber, "presented").catch(() => []),
    getSlideFiles(partNumber, "detailed").catch(() => []),
    getSlideFiles(partNumber, "facts").catch(() => []),
    getInfographicFilename(partNumber, "Concise").catch(() => null),
    getInfographicFilename(partNumber, "Standard").catch(() => null),
    getInfographicFilename(partNumber, "Bento Grid").catch(() => null),
  ]);

  // Define required assets for launch
  const missingRequired: string[] = [];
  
  if (!hasVideo) missingRequired.push("video");
  if (!briefingText) missingRequired.push("briefing");
  if (!quizData) missingRequired.push("quiz");
  if (!flashcardsData) missingRequired.push("flashcards");

  // Mindmap and slides are nice-to-have but not strictly required
  // We'll track them but not block launch on them

  const status: PartAssetStatus = {
    partNumber,
    title,
    video: hasVideo ? "present" : "missing",
    audio: hasAudio ? "present" : "missing",
    briefing: briefingText ? "present" : "missing",
    statementOfFacts: factsText ? "present" : "missing",
    studyGuide: studyGuideText ? "present" : "missing",
    report: reportText ? "present" : "missing",
    quiz: quizData ? "present" : "missing",
    flashcards: flashcardsData ? "present" : "missing",
    mindmap: hasMindmap ? "present" : "missing",
    slidesPresentedCount: slidesPresented.length,
    slidesDetailedCount: slidesDetailed.length,
    slidesFactsCount: slidesFacts.length,
    infographicConcise: infoConcise ? "present" : "missing",
    infographicStandard: infoStandard ? "present" : "missing",
    infographicBento: infoBento ? "present" : "missing",
    missingRequiredAssets: missingRequired,
    launchReady: missingRequired.length === 0,
  };

  return status;
}

// ─── Main Verification Function ───────────────────────────────────────────────

async function verifyAllParts(): Promise<PartAssetStatus[]> {
  console.log("🔍 Starting content completeness verification...\n");
  console.log(`Checking all ${PARTS.length} Seerah parts for asset availability.\n`);

  const results: PartAssetStatus[] = [];

  for (const part of PARTS) {
    const status = await checkPartAssets(part.partNumber, part.title);
    results.push(status);
    
    // Brief feedback during scan
    if (!status.launchReady) {
      console.log(`   ⚠️  Missing: ${status.missingRequiredAssets.join(", ")}`);
    } else {
      console.log(`   ✅ Launch ready`);
    }
  }

  return results;
}

// ─── Summary Statistics ───────────────────────────────────────────────────────

function calculateSummary(results: PartAssetStatus[]): SummaryStats {
  const stats: SummaryStats = {
    totalPartsChecked: results.length,
    fullyReady: 0,
    missingVideo: 0,
    missingBriefing: 0,
    missingQuiz: 0,
    missingFlashcards: 0,
    missingAnyRequired: 0,
    partsWithIssues: [],
  };

  for (const part of results) {
    if (part.launchReady) {
      stats.fullyReady++;
    } else {
      stats.missingAnyRequired++;
      stats.partsWithIssues.push({
        partNumber: part.partNumber,
        title: part.title,
        missingAssets: part.missingRequiredAssets,
      });
    }

    if (part.video === "missing") stats.missingVideo++;
    if (part.briefing === "missing") stats.missingBriefing++;
    if (part.quiz === "missing") stats.missingQuiz++;
    if (part.flashcards === "missing") stats.missingFlashcards++;
  }

  return stats;
}

// ─── Output Functions ─────────────────────────────────────────────────────────

function printConsoleSummary(results: PartAssetStatus[], stats: SummaryStats) {
  console.log("\n" + "=".repeat(80));
  console.log("📊 CONTENT COMPLETENESS SUMMARY");
  console.log("=".repeat(80) + "\n");

  console.log(`Total parts checked:          ${stats.totalPartsChecked}`);
  console.log(`✅ Fully launch-ready:         ${stats.fullyReady} (${((stats.fullyReady / stats.totalPartsChecked) * 100).toFixed(1)}%)`);
  console.log(`⚠️  Missing required assets:   ${stats.missingAnyRequired}`);
  console.log();
  console.log(`Missing breakdown:`);
  console.log(`  - Video:       ${stats.missingVideo} parts`);
  console.log(`  - Briefing:    ${stats.missingBriefing} parts`);
  console.log(`  - Quiz:        ${stats.missingQuiz} parts`);
  console.log(`  - Flashcards:  ${stats.missingFlashcards} parts`);

  if (stats.partsWithIssues.length > 0) {
    console.log("\n" + "─".repeat(80));
    console.log(`🔴 TOP ${Math.min(20, stats.partsWithIssues.length)} PARTS WITH MISSING REQUIRED ASSETS`);
    console.log("─".repeat(80) + "\n");

    stats.partsWithIssues.slice(0, 20).forEach(({ partNumber, title, missingAssets }) => {
      console.log(`Part ${partNumber}: ${title}`);
      console.log(`   Missing: ${missingAssets.join(", ")}`);
      console.log();
    });
  }

  // Launch readiness verdict
  console.log("=".repeat(80));
  if (stats.fullyReady === stats.totalPartsChecked) {
    console.log("✅ ALL PARTS ARE LAUNCH-READY!");
    console.log("   Safe to invite first 10 users.");
  } else if (stats.fullyReady >= 20) {
    console.log("⚠️  PARTIAL LAUNCH POSSIBLE");
    console.log(`   First ${stats.fullyReady} parts are ready.`);
    console.log("   Safe for warm launch if you limit access to ready parts.");
  } else {
    console.log("🔴 NOT READY FOR LAUNCH");
    console.log(`   Only ${stats.fullyReady}/${stats.totalPartsChecked} parts have all required assets.`);
    console.log("   Fix missing assets before inviting users.");
  }
  console.log("=".repeat(80) + "\n");
}

function saveJsonReport(results: PartAssetStatus[], stats: SummaryStats) {
  const reportsDir = path.join(process.cwd(), "reports");
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    summary: stats,
    parts: results,
  };

  const jsonPath = path.join(reportsDir, "content-completeness.json");
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  console.log(`📄 JSON report saved: ${jsonPath}`);
}

function saveCsvReport(results: PartAssetStatus[]) {
  const reportsDir = path.join(process.cwd(), "reports");
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // CSV Header
  const headers = [
    "Part",
    "Title",
    "Video",
    "Audio",
    "Briefing",
    "Facts",
    "Study Guide",
    "Report",
    "Quiz",
    "Flashcards",
    "Mindmap",
    "Slides (P/D/F)",
    "Infographics (C/S/B)",
    "Missing Required",
    "Launch Ready",
  ];

  const rows = results.map((part) => [
    part.partNumber,
    `"${part.title.replace(/"/g, '""')}"`, // Escape quotes in CSV
    part.video === "present" ? "✓" : "✗",
    part.audio === "present" ? "✓" : "✗",
    part.briefing === "present" ? "✓" : "✗",
    part.statementOfFacts === "present" ? "✓" : "✗",
    part.studyGuide === "present" ? "✓" : "✗",
    part.report === "present" ? "✓" : "✗",
    part.quiz === "present" ? "✓" : "✗",
    part.flashcards === "present" ? "✓" : "✗",
    part.mindmap === "present" ? "✓" : "✗",
    `${part.slidesPresentedCount}/${part.slidesDetailedCount}/${part.slidesFactsCount}`,
    `${part.infographicConcise === "present" ? "C" : ""}${part.infographicStandard === "present" ? "S" : ""}${part.infographicBento === "present" ? "B" : ""}`,
    part.missingRequiredAssets.length > 0 ? part.missingRequiredAssets.join("; ") : "none",
    part.launchReady ? "YES" : "NO",
  ]);

  const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

  const csvPath = path.join(reportsDir, "content-completeness.csv");
  fs.writeFileSync(csvPath, csv);
  console.log(`📄 CSV report saved: ${csvPath}`);
}

// ─── Main Execution ───────────────────────────────────────────────────────────

async function main() {
  const startTime = Date.now();

  try {
    // Run verification
    const results = await verifyAllParts();

    // Calculate summary
    const stats = calculateSummary(results);

    // Output results
    printConsoleSummary(results, stats);
    saveJsonReport(results, stats);
    saveCsvReport(results);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ Verification complete in ${duration}s\n`);

    // Exit with error code if not ready
    if (stats.missingAnyRequired > 0) {
      console.log("⚠️  Exiting with error code 1 (missing required assets)\n");
      process.exit(1);
    } else {
      console.log("✅ Exiting with success code 0 (all parts ready)\n");
      process.exit(0);
    }
  } catch (error) {
    console.error("\n❌ Fatal error during verification:", error);
    process.exit(1);
  }
}

// Run script
main();
