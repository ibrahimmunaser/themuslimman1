/**
 * Short-window deduplication for physical pointer interactions.
 * Prevents duplicate analytics when two handlers or ghost clicks fire for one tap.
 */

const slots = new Map<string, number>();

/** Default suppression window for simultaneous duplicate emissions. */
export const INTERACTION_DEDUP_MS = 500;

export function buildInteractionKey(
  eventType: string,
  planId: string,
  event: Pick<MouseEvent, "timeStamp" | "type">,
  targetKey?: string
): string {
  const tsBucket = Math.round(event.timeStamp);
  const target = targetKey ?? "unknown";
  return `${eventType}::${planId}::${event.type}::${tsBucket}::${target}`;
}

/**
 * Returns true if this interaction should emit an analytics event.
 * Returns false if the same key was consumed within windowMs.
 */
export function consumeInteractionSlot(key: string, windowMs = INTERACTION_DEDUP_MS): boolean {
  const now = Date.now();
  const last = slots.get(key);
  if (last !== undefined && now - last < windowMs) return false;
  slots.set(key, now);
  return true;
}

/** Test helper — reset in-memory dedup state. */
export function resetInteractionDedupForTests(): void {
  slots.clear();
}
