import { getPartById } from "@/lib/content";
import { getPartPageData } from "@/lib/part-content-cache";
import type { Part, Quiz } from "@/lib/types";
import { PartTabs } from "@/components/part/part-tabs";
import { Badge } from "@/components/ui/badge";

function stripQuizAnswers(quiz: Quiz | null | undefined): Quiz | null | undefined {
  if (!quiz) return quiz;
  return {
    ...quiz,
    questions: quiz.questions.map(({ correct_answer: _a, ...q }) => q as Quiz["questions"][number]),
  };
}

export async function Part1FullPreview() {
  const partBase = getPartById("part-1");

  let part: Part | null = null;
  let initialAssetUrls: { videoUrl?: string; audioUrl?: string; mindmapUrl?: string; thumbnailUrl?: string } = {};

  try {
    const {
      briefingText,
      statementOfFactsText,
      studyGuideText,
      reportText,
      quizData,
      flashcards,
      slidesPresentedFiles,
      slidesDetailedFiles,
      slidesFactsFiles,
      infSignedConcise,
      infSignedStandard,
      infSignedBento,
      videoUrl,
      audioUrl,
      mindmapUrl,
      thumbnailUrl,
    } = await getPartPageData(1);

    part = {
      ...partBase!,
      assets: {
        briefingText:         briefingText ?? undefined,
        statementOfFactsText: statementOfFactsText ?? undefined,
        studyGuideText:       studyGuideText ?? undefined,
        reportText:           reportText ?? undefined,
        quiz:                 stripQuizAnswers(quizData as Part["assets"]["quiz"]) as Part["assets"]["quiz"],
        flashcards:           flashcards as Part["assets"]["flashcards"],
        infographics: {
          concise:   infSignedConcise,
          standard:  infSignedStandard,
          bentoGrid: infSignedBento,
        },
        slides: {
          presented: slidesPresentedFiles,
          detailed:  slidesDetailedFiles,
          facts:     slidesFactsFiles,
        },
      },
    };

    initialAssetUrls = { videoUrl, audioUrl, mindmapUrl, thumbnailUrl };
  } catch (error) {
    console.error("Failed to load Part 1 preview:", error);
  }

  if (!part) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <p className="text-text-secondary">Part 1 preview is temporarily unavailable. Please try again later.</p>
      </div>
    );
  }

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
      <div className="bg-surface px-4 sm:px-6 py-6">
        <PartTabs
          part={part}
          userPlan="essentials"
          previewMode={true}
          initialAssetUrls={initialAssetUrls}
        />
      </div>

      {/* Call-to-Action */}
      <div className="p-8 border-t border-gold/20 bg-surface-raised text-center">
        <p className="text-sm text-text-secondary mb-6">
          You just experienced the full Part 1 — the exact same format and quality as all 100 parts.
        </p>
        <a
          href="/checkout"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-gold to-gold-light hover:from-gold-light hover:to-gold text-ink font-bold text-base shadow-lg shadow-gold/30 transition-all hover:shadow-gold/40 hover:scale-[1.02] active:scale-[0.99]"
        >
          Continue the Full Seerah — Get Complete Access for $99
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
}
