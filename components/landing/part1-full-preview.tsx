import { getPartById } from "@/lib/content";
import { getPartPageData } from "@/lib/part-content-cache";
import type { Part, Quiz } from "@/lib/types";
import { Part1PreviewTabs } from "@/components/landing/part1-preview-tabs";
import { Badge } from "@/components/ui/badge";
import { Video, FileText, Layers, Map, Layers2, HelpCircle } from "lucide-react";

function stripQuizAnswers(quiz: Quiz | null | undefined): Quiz | null | undefined {
  if (!quiz) return quiz;
  return {
    ...quiz,
    questions: quiz.questions.map(({ correct_answer: _a, ...q }) => q as Quiz["questions"][number]),
  };
}

export async function Part1FullPreview({
  checkoutHref = "/checkout?plan=individual-trial",
  hideCta = false,
  ctaLabel = "Get Lifetime Access — $49",
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
      <div className="px-4 sm:px-6 py-3 border-b border-border/50 bg-surface-raised/40">
        <p className="text-sm font-semibold text-center text-text mb-3">
          Every lesson follows one simple path:{" "}
          <span className="text-gold">Watch → Study → Review</span>
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <a
            href="#preview?mode=watch"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:border-gold/40 hover:bg-surface-raised text-xs font-medium text-text-secondary hover:text-text transition-colors"
          >
            <Video className="w-3.5 h-3.5" />
            Video
          </a>
          <a
            href="#preview?mode=read"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:border-gold/40 hover:bg-surface-raised text-xs font-medium text-text-secondary hover:text-text transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Reading
          </a>
          <a
            href="#preview?mode=slides"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:border-gold/40 hover:bg-surface-raised text-xs font-medium text-text-secondary hover:text-text transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            Slides
          </a>
          <a
            href="#preview?mode=mindmap"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:border-gold/40 hover:bg-surface-raised text-xs font-medium text-text-secondary hover:text-text transition-colors"
          >
            <Map className="w-3.5 h-3.5" />
            Mind Map
          </a>
          <a
            href="#preview?mode=flashcards"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:border-gold/40 hover:bg-surface-raised text-xs font-medium text-text-secondary hover:text-text transition-colors"
          >
            <Layers2 className="w-3.5 h-3.5" />
            Flashcards
          </a>
          <a
            href="#preview?mode=quiz"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:border-gold/40 hover:bg-surface-raised text-xs font-medium text-text-secondary hover:text-text transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Quiz
          </a>
        </div>
      </div>

      {/* Full Part 1 Content — PartTabs is lazy-loaded in a separate JS chunk */}
      <div className="bg-surface px-4 sm:px-6 py-6">
        <Part1PreviewTabs part={part} initialAssetUrls={initialAssetUrls} />
      </div>

      {/* Call-to-Action — hidden on pages that provide their own post-preview hook */}
      {!hideCta && (
        <div className="p-8 border-t border-gold/20 bg-surface-raised text-center">
          <p className="text-sm text-text-secondary mb-6">
            That was Part 1 — every part of the course follows the same format. Continue at your own pace.
          </p>
          <a
            href={checkoutHref}
            data-track="part1_continue_clicked"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-gold to-gold-light hover:from-gold-light hover:to-gold text-ink font-bold text-base shadow-lg shadow-gold/30 transition-all hover:shadow-gold/40 hover:scale-[1.02] active:scale-[0.99]"
          >
            {ctaLabel}
          </a>
          <p className="text-sm text-text-muted mt-4 max-w-lg mx-auto leading-relaxed">
            Full Seerah access — video, reading, flashcards, and more. Start at $4.99/month or pay once.
          </p>
          <p className="text-xs text-text-muted mt-3">
            Cancel anytime · 7-day refund guarantee
          </p>
        </div>
      )}
    </div>
  );
}
