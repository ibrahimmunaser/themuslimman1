import { getPartById } from "@/lib/content";
import { getPartPageData } from "@/lib/part-content-cache";
import type { Part, Quiz } from "@/lib/types";

export interface Part1AssetUrls {
  videoUrl?: string;
  audioUrl?: string;
  mindmapUrl?: string;
  thumbnailUrl?: string;
}

export interface Part1PreviewData {
  part: Part | null;
  initialAssetUrls: Part1AssetUrls;
}

function stripQuizAnswers(quiz: Quiz | null | undefined): Quiz | null | undefined {
  if (!quiz) return quiz;
  return {
    ...quiz,
    questions: quiz.questions.map(({ correct_answer: _a, ...q }) => q as Quiz["questions"][number]),
  };
}

/** Server-side Part 1 preview payload (video, slides, quiz, flashcards, etc.). */
export async function getPart1PreviewData(): Promise<Part1PreviewData> {
  const partBase = getPartById("part-1");
  if (!partBase) return { part: null, initialAssetUrls: {} };

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

    const part: Part = {
      ...partBase,
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

    return {
      part,
      initialAssetUrls: { videoUrl, audioUrl, mindmapUrl, thumbnailUrl },
    };
  } catch {
    return { part: null, initialAssetUrls: {} };
  }
}
