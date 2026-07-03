import { getPartById } from "@/lib/content";
import { getPartPageData } from "@/lib/part-content-cache";
import type { Part, Quiz } from "@/lib/types";
import { Part1PreviewTabs } from "@/components/landing/part1-preview-tabs";
import { Part1PreviewNav } from "@/components/landing/part1-preview-nav";
import { Badge } from "@/components/ui/badge";

function stripQuizAnswers(quiz: Quiz | null | undefined): Quiz | null | undefined {
  if (!quiz) return quiz;
  return {
    ...quiz,
    questions: quiz.questions.map(({ correct_answer: _a, ...q }) => q as Quiz["questions"][number]),
  };
}

export async function Part1FullPreview({
  checkoutHref = "/checkout?plan=individual-monthly",
  hideCta = false,
  ctaLabel = "Start for $4.99/month",
}: {
  checkoutHref?: string;
  hideCta?: boolean;
  ctaLabel?: string;
} = {}) {
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Complete Preview — No Signup Required</p>
            <h3 className="text-xl font-bold text-text">Part 1: {part.title}</h3>
            {part.subtitle && (
              <p className="text-sm text-text-secondary mt-1">{part.subtitle}</p>
            )}
          </div>
          <Badge variant="gold" size="sm" className="self-start sm:self-auto flex-shrink-0">100% Free</Badge>
        </div>
        {part.description && (
          <p className="text-sm text-text-secondary mt-3 leading-relaxed">
            {part.description}
          </p>
        )}
      </div>

      {/* Learning path descriptor with quick navigation */}
      <Part1PreviewNav />

      {/* Full Part 1 Content — PartTabs is lazy-loaded in a separate JS chunk */}
      <div className="bg-surface px-4 sm:px-6 py-6">
        <Part1PreviewTabs part={part} initialAssetUrls={initialAssetUrls} />
      </div>

      {/* Call-to-Action — hidden on pages that provide their own post-preview hook */}
      {!hideCta && (
        <div className="p-8 border-t border-gold/20 bg-surface-raised text-center">
          <p className="text-xs font-bold text-gold uppercase tracking-widest mb-2">
            Ready for Part 2?
          </p>
          <h3 className="text-xl sm:text-2xl font-bold text-text mb-2">
            Continue the full course.
          </h3>
          <p className="text-sm text-text-secondary mb-6 max-w-md mx-auto leading-relaxed">
            Every part follows the same format — video, reading, slides, quiz, and flashcards.
            100 parts. One connected story.
          </p>
          <a
            href={checkoutHref}
            data-track="checkout_clicked"
            data-plan="individual-monthly"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-gold to-gold-light hover:from-gold-light hover:to-gold text-ink font-bold text-base shadow-lg shadow-gold/30 transition-all hover:shadow-gold/40 hover:scale-[1.02] active:scale-[0.99]"
          >
            {ctaLabel}
          </a>
          <p className="text-xs text-text-muted mt-4">
            Cancel anytime · 7-day refund guarantee
          </p>
        </div>
      )}
    </div>
  );
}
