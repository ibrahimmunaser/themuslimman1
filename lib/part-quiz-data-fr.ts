import type { Quiz } from "./types";
import { PART_QUIZ_FR_1_25 } from "./fr-quizzes/batch-01-25";
import { PART_QUIZ_FR_26_50 } from "./fr-quizzes/batch-26-50";
import { PART_QUIZ_FR_51_75 } from "./fr-quizzes/batch-51-75";
import { PART_QUIZ_FR_76_100 } from "./fr-quizzes/batch-76-100";

/** Hardcoded French quizzes for all 100 parts — preferred over R2 at runtime. */
export const PART_QUIZ_FR: Record<number, Quiz> = {
  ...PART_QUIZ_FR_1_25,
  ...PART_QUIZ_FR_26_50,
  ...PART_QUIZ_FR_51_75,
  ...PART_QUIZ_FR_76_100,
};
