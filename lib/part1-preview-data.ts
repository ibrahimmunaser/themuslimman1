import { cookies } from "next/headers";
import { getPartById, localizePart } from "@/lib/content";
import { getPartPageData } from "@/lib/part-content-cache";
import { parseLang, COURSE_LANG_COOKIE, type CourseLang } from "@/lib/course-lang";
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

/** Server-side Part 1 preview payload (video, slides, quiz, flashcards, etc.). */
export async function getPart1PreviewData(lang: CourseLang = "en"): Promise<Part1PreviewData> {
  const partBaseEn = getPartById("part-1");
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
    } = await getPartPageData(1, lang);

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
