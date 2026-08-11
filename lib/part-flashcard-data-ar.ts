import type { FlashcardSet } from "./types";
import { PART_FLASHCARDS_AR_1_25 } from "./ar-flashcards/batch-01-25";
import { PART_FLASHCARDS_AR_26_50 } from "./ar-flashcards/batch-26-50";
import { PART_FLASHCARDS_AR_51_75 } from "./ar-flashcards/batch-51-75";
import { PART_FLASHCARDS_AR_76_100 } from "./ar-flashcards/batch-76-100";

/** Hardcoded Arabic flashcards for all 100 parts — preferred over R2 at runtime. */
export const PART_FLASHCARDS_AR: Record<number, FlashcardSet> = {
  ...PART_FLASHCARDS_AR_1_25,
  ...PART_FLASHCARDS_AR_26_50,
  ...PART_FLASHCARDS_AR_51_75,
  ...PART_FLASHCARDS_AR_76_100,
};
