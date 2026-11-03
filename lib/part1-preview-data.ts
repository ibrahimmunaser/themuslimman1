import { cookies } from "next/headers";
import { getPartById, localizePart } from "@/lib/content";
import { getPartPageData } from "@/lib/part-content-cache";
import { parseLang, COURSE_LANG_COOKIE, type CourseLang } from "@/lib/course-lang";
import { FREE_PART_NUMBER } from "@/lib/access";
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
  lang: CourseLang;
}

function stripQuizAnswers(quiz: Quiz | null | undefined): Quiz | null | undefined {
  if (!quiz) return quiz;
  return {
    ...quiz,
    questions: quiz.questions.map(({ correct_answer: _a, ...q }) => q as Quiz["questions"][number]),
  };
}

/**
 * Server-side free-preview payload (video, slides, quiz, flashcards, etc.)
 * for the course's single free part (lib/access.ts's FREE_PART_NUMBER).
 *
 * NOTE: this module/function keeps its legacy "part1" name for historical
 * reasons (it originally always previewed Part 1), but it now always loads
 * FREE_PART_NUMBER — currently Part 15, "The First Revelation". Change
 * FREE_PART_NUMBER in lib/access.ts to move the free preview elsewhere.
 */
export async function getPart1PreviewData(lang: CourseLang = "en"): Promise<Part1PreviewData> {
  const partBaseEn = getPartById(`part-${FREE_PART_NUMBER}`);
  if (!partBaseEn) return { part: null, initialAssetUrls: {}, lang };

  const partBase = localizePart(partBaseEn, lang);

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
    } = await getPartPageData(FREE_PART_NUMBER, lang);

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
      lang,
    };
  } catch {
    return { part: null, initialAssetUrls: {}, lang };
  }
}

/** Resolve course language from the request cookie (defaults to English). */
export async function getPreviewLangFromCookies(): Promise<CourseLang> {
  const cookieStore = await cookies();
  return parseLang(cookieStore.get(COURSE_LANG_COOKIE)?.value);
}
