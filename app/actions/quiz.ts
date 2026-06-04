"use server";

import { getPartPageData } from "@/lib/part-content-cache";
import { requirePartAccess } from "@/lib/part-access";
import type { Quiz } from "@/lib/types";

export interface QuizAnswerResult {
  correct: boolean;
  correctAnswer: string;
  explanation: string;
}

/** Per-question answer data pre-fetched at quiz start. */
export type QuizAnswerMap = Record<string, { correctAnswer: string; explanation: string }>;

/** Wrapper that lets TypeScript distinguish success from error without index-signature conflicts. */
export type QuizAnswerMapResult =
  | { ok: true; map: QuizAnswerMap }
  | { ok: false; error: string };

/**
 * Pre-fetch the full answer map for a quiz in a SINGLE server round-trip.
 *
 * Called ONCE when the user opens the quiz tab (not on every click).
 * The client stores the map and resolves answers instantly — no per-question
 * server call needed, so feedback is immediate.
 *
 * Answers are not included in the RSC page payload (stripped in stripQuizAnswers),
 * so they are only accessible after this explicit access-gated fetch.
 */
export async function getQuizAnswerMap(
  partNumber: number,
): Promise<QuizAnswerMapResult> {
  const deny = await requirePartAccess(partNumber);
  if (deny) return { ok: false, error: "Access denied" };

  // Use the shared in-memory part cache — no extra file/R2 read on repeat calls.
  const partData = await getPartPageData(partNumber);
  const quizData = partData.quizData as Quiz | null | undefined;
  if (!quizData) return { ok: false, error: "Quiz not found" };

  const map: QuizAnswerMap = {};
  for (const q of quizData.questions) {
    map[q.id] = { correctAnswer: q.correct_answer, explanation: q.explanation };
  }
  return { ok: true, map };
}

/**
 * Single-question answer check kept for backward-compatibility.
 * New code should prefer getQuizAnswerMap + client-side lookup.
 *
 * @deprecated Use getQuizAnswerMap instead.
 */
export async function checkQuizAnswer(
  partNumber: number,
  questionId: string,
  selectedAnswer: string,
): Promise<QuizAnswerResult | { error: string }> {
  const result = await getQuizAnswerMap(partNumber);
  if (!result.ok) return { error: result.error };

  const entry = result.map[questionId];
  if (!entry) return { error: "Question not found" };

  return {
    correct: selectedAnswer === entry.correctAnswer,
    correctAnswer: entry.correctAnswer,
    explanation: entry.explanation,
  };
}
