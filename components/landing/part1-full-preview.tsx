import { getPartById } from "@/lib/content";
import {
  readBriefing,
  readStatementOfFacts,
  readStudyGuide,
  readReport,
  getSlideFiles,
  getInfographicFilename,
  mindmapExists,
  readQuiz,
  readFlashcards,
  getPartAssetUrls,
} from "@/lib/files";
import { getR2PublicUrl } from "@/lib/r2";
import { PartTabs } from "@/components/part/part-tabs";
import { Badge } from "@/components/ui/badge";

export async function Part1FullPreview() {
  try {
    const partBase = getPartById("part-1");
    if (!partBase) return null;

    const n = partBase.partNumber;
    
    // Fetch all Part 1 data
    const [
      slidesPresented,
      slidesDetailed,
      slidesFacts,
      briefingText,
      statementOfFactsText,
      studyGuideText,
      reportText,
      hasMindmap,
      quiz,
      flashcards,
      infConcise,
      infStandard,
      infBento,
      assetUrls,
    ] = await Promise.all([
    getSlideFiles(n, "presented"),
    getSlideFiles(n, "detailed"),
    getSlideFiles(n, "facts"),
    readBriefing(n),
    readStatementOfFacts(n),
    readStudyGuide(n),
    readReport(n),
    mindmapExists(n),
    readQuiz(n),
    readFlashcards(n),
    getInfographicFilename(n, "Concise"),
    getInfographicFilename(n, "Standard"),
    getInfographicFilename(n, "Bento Grid"),
    getPartAssetUrls(n),
  ]);

  const slideFiles = {
    presented: slidesPresented,
    detailed: slidesDetailed,
    facts: slidesFacts,
  };

  const part = {
    ...partBase,
    assets: {
      ...partBase.assets,
      briefingText: briefingText ?? undefined,
      statementOfFactsText: statementOfFactsText ?? undefined,
      studyGuideText: studyGuideText ?? undefined,
      reportText: reportText ?? undefined,
      videoUrl: assetUrls.videoUrl ?? undefined,
      audioUrl: assetUrls.audioUrl ?? undefined,
      mindmapUrl: assetUrls.mindmapUrl ?? undefined,
      quiz: quiz ?? undefined,
      flashcards: flashcards ?? undefined,
      slides: slideFiles,
      infographics: {
        concise: infConcise
          ? (infConcise.includes("/") 
              ? getR2PublicUrl(infConcise) ?? undefined
              : `/seerah-media/Infographics/Concise/${infConcise}`)
          : undefined,
        standard: infStandard
          ? (infStandard.includes("/") 
              ? getR2PublicUrl(infStandard) ?? undefined
              : `/seerah-media/Infographics/Standard/${infStandard}`)
          : undefined,
        bentoGrid: infBento
          ? (infBento.includes("/") 
              ? getR2PublicUrl(infBento) ?? undefined
              : `/seerah-media/Infographics/Bento Grid/${infBento}`)
          : undefined,
      },
    },
  };

  return (
    <div className="rounded-2xl border border-gold/20 bg-surface overflow-hidden">
      <div className="p-4 bg-surface-raised border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Complete Preview — No Signup Required</p>
            <h3 className="text-xl font-bold text-text">Part 1: {part.title}</h3>
            {part.subtitle && (
              <p className="text-sm text-text-secondary mt-1">{part.subtitle}</p>
            )}
          </div>
          <Badge variant="gold" size="sm">100% Free</Badge>
        </div>
        {part.description && (
          <p className="text-sm text-text-secondary mt-3 leading-relaxed">
            {part.description}
          </p>
        )}
      </div>

      {/* Full Part 1 Content */}
      <div className="bg-surface px-4 sm:px-6 pt-6 pb-2">
        <PartTabs part={part} userPlan="essentials" previewMode={true} />
      </div>

      {/* Call-to-Action */}
      <div className="p-8 border-t border-gold/20 bg-surface-raised text-center">
        <p className="text-sm text-text-secondary mb-6">
          You just experienced the full Part 1 — the exact same format and quality as all 100 parts.
        </p>
        <a
          href="/signup-checkout?plan=complete"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-gold to-gold-light hover:from-gold-light hover:to-gold text-ink font-bold text-base shadow-lg shadow-gold/30 transition-all hover:shadow-gold/40 hover:scale-[1.02] active:scale-[0.99]"
        >
          Continue the Full Seerah — Get Complete Access for $79
        </a>
        <p className="text-sm text-text-muted mt-4 max-w-lg mx-auto leading-relaxed">
          Unlock the full 100-part Seerah journey with videos, summaries, quizzes, flashcards, mind maps, and progress tracking.
        </p>
        <p className="text-xs text-text-muted mt-3">
          7-Day Clarity Guarantee · Lifetime Access · Instant Unlock
        </p>
      </div>
    </div>
  );
  } catch (error) {
    console.error("Failed to load Part 1 preview:", error);
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <p className="text-text-secondary">Part 1 preview is temporarily unavailable. Please try again later.</p>
      </div>
    );
  }
}
