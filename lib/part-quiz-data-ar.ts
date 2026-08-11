import type { Quiz } from "./types";
import { PART_QUIZ_AR_1_25 } from "./ar-quizzes/batch-01-25";
import { PART_QUIZ_AR_26_50 } from "./ar-quizzes/batch-26-50";
import { PART_QUIZ_AR_51_75 } from "./ar-quizzes/batch-51-75";
import { PART_QUIZ_AR_76_100 } from "./ar-quizzes/batch-76-100";

/** Hardcoded Arabic quizzes for all 100 parts — preferred over R2 at runtime. */
export const PART_QUIZ_AR: Record<number, Quiz> = {
  ...PART_QUIZ_AR_1_25,
  ...PART_QUIZ_AR_26_50,
  ...PART_QUIZ_AR_51_75,
  ...PART_QUIZ_AR_76_100,
};
