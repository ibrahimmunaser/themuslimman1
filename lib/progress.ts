/**
 * Progress calculation logic for Seerah lesson parts.
 *
 * Unlock rule (softer — applies to ALL plans):
 *   video >= 85% AND briefing opened
 *
 * Completion rules:
 *   Essentials: video >= 85% + briefing opened
 *   Complete:   video >= 85% + briefing opened + quiz passed >= 80%
 *
 * Mastery (Complete only):
 *   quiz best score >= 90% + flashcards reviewed + 2+ optional assets opened
 */

export const VIDEO_COMPLETION_THRESHOLD = 85;  // percent
export const QUIZ_PASS_SCORE            = 80;  // percent
export const QUIZ_MASTERY_SCORE         = 90;  // percent
export const MASTERY_ASSETS_MIN         = 2;   // optional assets needed

export type PartStatus = "not_started" | "started" | "completed" | "mastered";

export interface ProgressSnapshot {
  videoWatchPercent: number;
  videoCompleted:    boolean;
  briefingOpened:    boolean;
  quizCompleted:     boolean;
  quizBestScore:     number | null;
  quizPassed:        boolean;
  flashcardsReviewed:boolean;
  openedAssets:      string[]; // e.g. ["slides","mindmap","infographic"]
  startedAt:         Date | null;
}

// ── Core helpers ──────────────────────────────────────────────────────────────

export function videoReachedThreshold(snap: Pick<ProgressSnapshot, "videoWatchPercent" | "videoCompleted">) {
  // videoCompleted is a sticky flag — once set it is never cleared, so treat it
  // as permanently reaching threshold even if videoWatchPercent has regressed
  // (e.g. user reloads the page and re-watches from the beginning).
  return snap.videoCompleted || snap.videoWatchPercent >= VIDEO_COMPLETION_THRESHOLD;
}

/** Softer unlock: video 85% + briefing opened. Applies to both plans. */
export function canUnlockNextPart(snap: ProgressSnapshot): boolean {
  return videoReachedThreshold(snap) && snap.briefingOpened;
}

export function isCompleted(snap: ProgressSnapshot, userPlan: "essentials" | "complete"): boolean {
  const base = videoReachedThreshold(snap) && snap.briefingOpened;
  if (userPlan === "essentials") return base;
  return base && snap.quizPassed;
}

export function isMastered(snap: ProgressSnapshot, userPlan: "essentials" | "complete"): boolean {
  if (userPlan === "essentials") return false;
  const openedCount = snap.openedAssets.length;
  return (
    videoReachedThreshold(snap) &&
    snap.briefingOpened &&
    (snap.quizBestScore ?? 0) >= QUIZ_MASTERY_SCORE &&
    snap.flashcardsReviewed &&
    openedCount >= MASTERY_ASSETS_MIN
  );
}

export function computeStatus(snap: ProgressSnapshot, userPlan: "essentials" | "complete"): PartStatus {
  if (!snap.startedAt) return "not_started";
  if (isMastered(snap, userPlan)) return "mastered";
  if (isCompleted(snap, userPlan)) return "completed";
  return "started";
}

// ── What's missing labels (for UI) ───────────────────────────────────────────

export interface CompletionRequirements {
  videoNeeded:   boolean;
  briefingNeeded:boolean;
  quizNeeded:    boolean; // Complete only
  quizScore:     number | null;
}

export function getCompletionRequirements(
  snap: ProgressSnapshot,
  userPlan: "essentials" | "complete",
): CompletionRequirements {
  return {
    videoNeeded:    !videoReachedThreshold(snap),
    briefingNeeded: !snap.briefingOpened,
    quizNeeded:     userPlan === "complete" && !snap.quizPassed,
    quizScore:      snap.quizBestScore,
  };
}

// ── Parse DB row ─────────────────────────────────────────────────────────────

export function parseProgressRow(row: {
  videoWatchPercent: number;
  videoCompleted:    boolean;
  briefingOpened:    boolean;
  quizCompleted:     boolean;
  quizBestScore:     number | null;
  quizPassed:        boolean;
  flashcardsReviewed:boolean;
  openedAssets:      string;
  startedAt:         Date | null;
}): ProgressSnapshot {
  let openedAssets: string[] = [];
  try { openedAssets = JSON.parse(row.openedAssets); } catch {}
  return { ...row, openedAssets };
}
