"use server";

import { readQuiz } from "@/lib/files";
import { requirePartAccess } from "@/lib/part-access";

export interface QuizAnswerResult {
  correct: boolean;
  correctAnswer: string;
  explanation: string;
}

/**
 * Server-side answer check for a single quiz question.
 *
 * Returns { correct, correctAnswer, explanation } on success.
 * Returns { error } if the part is inaccessible or the question is unknown.
 *
 * This is the ONLY place correct_answer ever leaves the server.
 * The quiz API route strips correct_answer before sending questions to the client
 * so the user cannot read answers from the network tab.
 */
export async function checkQuizAnswer(
  partNumber: number,
  questionId: string,
  selectedAnswer: string,
): Promise<QuizAnswerResult | { error: string }> {
  const deny = await requirePartAccess(partNumber);
  if (deny) return { error: "Access denied" };

  const quiz = await readQuiz(partNumber);
  if (!quiz) return { error: "Quiz not found" };

  const question = quiz.questions.find((q) => q.id === questionId);
  if (!question) return { error: "Question not found" };

  return {
    correct: selectedAnswer === question.correct_answer,
    correctAnswer: question.correct_answer,
    explanation: question.explanation,
  };
}
