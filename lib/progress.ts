/**
 * Progress calculation logic for Seerah lesson parts.
 *
 * Completion rules:
 *   Essentials: video >= 85% + briefing opened
 *   Complete:   quiz passed >= 80%
 *
 * Mastery (Complete only):
 *   quiz best score >= 90% + flashcards reviewed + 2+ optional assets opened
 */

import type { Quiz } from "./types";

/**
 * Both the client (quiz UI) and the content data store the FULL option text
 * as the answer value (never an index/letter — see quiz_tab.dart), so an
 * exact `===` comparison normally works. But this content is hand-authored
 * across 100 parts, and `correct_answer` is a separately-typed copy of one
 * of the `options` strings rather than a reference into the array — any
 * authoring inconsistency (a stray trailing space, curly vs straight quotes,
 * doubled internal whitespace, a differently-composed Unicode accent on a
 * transliterated Arabic name) between the two would silently mark an
 * objectively correct answer wrong with zero visibility into why. Normalize
 * both sides the same way before comparing so only the actual answer
 * content matters, not incidental formatting drift between two hand-typed
 * copies of the same text.
 */
export function normalizeQuizAnswer(s: string): string {
  return s.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Recomputes a quiz score from the authoritative correct_answer values
 * rather than trusting a client-supplied number. Shared by the web
 * (`submitQuizAnswers`) and mobile (`/api/mobile-progress/track` and
 * `/bulk-sync`) submission paths so neither can be bypassed by simply
 * POSTing `{ score: 100 }` without ever answering a real question.
 */
export function computeQuizScore(quizData: Quiz, answers: Record<string, string>): number {
  const total = quizData.questions.length;
  if (total === 0) return 0;
  const correct = quizData.questions.filter((q) => {
    const given = answers[q.id];
    return given !== undefined && normalizeQuizAnswer(given) === normalizeQuizAnswer(q.correct_answer);
  }).length;
  return Math.round((correct / total) * 100);
}

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
  /** False for legacy/offline bulk scores that were never re-graded from answers. */
  quizScoreVerified: boolean;
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
  if (userPlan === "essentials") return videoReachedThreshold(snap) && snap.briefingOpened;
  // Require verified so an unverified bulk-sync score can't complete a part
  // (mobile get route already gates completedParts the same way).
  return snap.quizPassed && snap.quizScoreVerified;
}

export function isMastered(snap: ProgressSnapshot, userPlan: "essentials" | "complete"): boolean {
  if (userPlan === "essentials") return false;
  const openedCount = snap.openedAssets.length;
  return (
    videoReachedThreshold(snap) &&
    snap.briefingOpened &&
    snap.quizScoreVerified &&
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
    quizNeeded:     userPlan === "complete" && !(snap.quizPassed && snap.quizScoreVerified),
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
  quizScoreVerified?: boolean | null;
  flashcardsReviewed:boolean;
  openedAssets:      string;
  startedAt:         Date | null;
}): ProgressSnapshot {
  let openedAssets: string[] = [];
  try { openedAssets = JSON.parse(row.openedAssets); } catch {}
  return {
    videoWatchPercent: row.videoWatchPercent,
    videoCompleted: row.videoCompleted,
    briefingOpened: row.briefingOpened,
    quizCompleted: row.quizCompleted,
    quizBestScore: row.quizBestScore,
    quizPassed: row.quizPassed,
    // Legacy rows written before the verified column defaulted false; treat
    // missing as false so status can't complete from unverified bulk scores.
    quizScoreVerified: row.quizScoreVerified === true,
    flashcardsReviewed: row.flashcardsReviewed,
    openedAssets,
    startedAt: row.startedAt,
  };
}
