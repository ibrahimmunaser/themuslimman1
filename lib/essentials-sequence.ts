// Sequential order of Essentials Seerah parts
// Essentials includes all 100 parts (video only)

export const ESSENTIALS_PARTS_SEQUENCE = Array.from({ length: 100 }, (_, i) => i + 1);

// No parts are complete-only; all 100 parts are included in Essentials
export const COMPLETE_ONLY_PARTS: number[] = [];

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
export const ESSENTIALS_TOTAL_COUNT = ESSENTIALS_PARTS_SEQUENCE.length; // 100
