import type { FlashcardSet } from "./types";
import { PART_FLASHCARDS_FR_1_25 } from "./fr-flashcards/batch-01-25";
import { PART_FLASHCARDS_FR_26_50 } from "./fr-flashcards/batch-26-50";
import { PART_FLASHCARDS_FR_51_75 } from "./fr-flashcards/batch-51-75";
import { PART_FLASHCARDS_FR_76_100 } from "./fr-flashcards/batch-76-100";

/** Hardcoded French flashcards for all 100 parts — preferred over R2 at runtime. */
export const PART_FLASHCARDS_FR: Record<number, FlashcardSet> = {
  ...PART_FLASHCARDS_FR_1_25,
  ...PART_FLASHCARDS_FR_26_50,
  ...PART_FLASHCARDS_FR_51_75,
  ...PART_FLASHCARDS_FR_76_100,
};
