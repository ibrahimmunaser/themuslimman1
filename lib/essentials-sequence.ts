// Sequential order of Essentials Seerah parts
// This defines which parts are included in Essentials and their unlock sequence

export const ESSENTIALS_PARTS_SEQUENCE = [
  1, 6, 7, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
  29, 30, 31, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 47, 50, 51,
  53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 67, 68, 69, 71, 72, 78,
  79, 80, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 94, 95, 97, 99,
];

// Complete-only parts (not included in Essentials)
export const COMPLETE_ONLY_PARTS = [
  2, 3, 4, 5, 8, 9, 10, 11, 32, 46, 48, 49, 52, 66, 70, 73, 74, 75, 76, 77, 81,
  93, 96, 98, 100,
];

/**
 * Check if a part is included in Essentials Seerah
 */
export function isPartInEssentials(partNumber: number): boolean {
  return ESSENTIALS_PARTS_SEQUENCE.includes(partNumber);
}

/**
 * Get the Essentials sequence position for a part (0-indexed)
 * Returns -1 if not in Essentials
 */
export function getEssentialsSequenceIndex(partNumber: number): number {
  return ESSENTIALS_PARTS_SEQUENCE.indexOf(partNumber);
}

/**
 * Get the next Essentials part in sequence
 * Returns undefined if no next part or not in Essentials
 */
export function getNextEssentialsPart(partNumber: number): number | undefined {
  const index = getEssentialsSequenceIndex(partNumber);
  if (index === -1 || index >= ESSENTIALS_PARTS_SEQUENCE.length - 1) {
    return undefined;
  }
  return ESSENTIALS_PARTS_SEQUENCE[index + 1];
}

/**
 * Get the previous Essentials part in sequence
 * Returns undefined if no previous part or not in Essentials
 */
export function getPreviousEssentialsPart(partNumber: number): number | undefined {
  const index = getEssentialsSequenceIndex(partNumber);
  if (index <= 0) {
    return undefined;
  }
  return ESSENTIALS_PARTS_SEQUENCE[index - 1];
}

/**
 * Get the Essentials lesson number (1-indexed) for a part
 * Returns null if not in Essentials
 */
export function getEssentialsLessonNumber(partNumber: number): number | null {
  const index = getEssentialsSequenceIndex(partNumber);
  return index === -1 ? null : index + 1;
}

/**
 * Check if a part is Complete-only (not included in Essentials)
 */
export function isCompleteOnly(partNumber: number): boolean {
  return COMPLETE_ONLY_PARTS.includes(partNumber);
}

/**
 * Total count of Essentials parts
 */
export const ESSENTIALS_TOTAL_COUNT = ESSENTIALS_PARTS_SEQUENCE.length; // 75
