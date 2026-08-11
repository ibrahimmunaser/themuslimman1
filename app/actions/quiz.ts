"use server";

import { getPartPageData } from "@/lib/part-content-cache";
import { requirePartAccess } from "@/lib/part-access";
import { normalizeQuizAnswer } from "@/lib/progress";
import type { Quiz } from "@/lib/types";
import type { CourseLang } from "@/lib/course-lang";

export interface QuizAnswerResult {
  correct: boolean;
  correctAnswer: string;
  explanation: string;
}

/**
 * Single-question answer check. Prefer this so the client never receives
 * the full answer key in one response.
 *
 * INTENTIONAL (accepted): Mobile still uses correctIndex from GET
 * /api/quiz/[partId] for inline UX. That leaks which option is correct in the
 * payload, but options are already visible on screen; web uses this action.
 * Server-side submitQuizAnswers remains authoritative for scores/progress.
 *
 * @param previewMode - When true and partNumber is 1, skip access check (free preview)
 * @param lang - Course language the quiz was rendered in — must match so the
 *   returned correctAnswer/explanation (and the correctness check itself) use
 *   the same-language quiz data the user is actually looking at.
 */
export async function checkQuizAnswer(
  partNumber: number,
  questionId: string,
  selectedAnswer: string,
  previewMode = false,
  lang: CourseLang = "en",
): Promise<QuizAnswerResult | { error: string }> {
  const skipAccessCheck = previewMode && partNumber === 1;

  if (!skipAccessCheck) {
    const deny = await requirePartAccess(partNumber);
    if (deny) return { error: "Access denied" };
  }

  const partData = await getPartPageData(partNumber, lang);
  const quizData = partData.quizData as Quiz | null | undefined;
  if (!quizData) return { error: "Quiz not found" };

  const question = quizData.questions.find((q) => q.id === questionId);
  if (!question) return { error: "Question not found" };

  return {
    correct:
      normalizeQuizAnswer(selectedAnswer) === normalizeQuizAnswer(question.correct_answer),
    correctAnswer: question.correct_answer,
    explanation: question.explanation,
  };
}
