/**
 * AUTOMATED RISK: Quiz score bypass prevention (CRITICAL fix)
 *
 * Tests the sequential lock logic extracted from trackQuizCompleted.
 * A paid user must not be able to POST a fake score for any arbitrary part.
 *
 * Server action behaviour:
 *   - Score clamped to [0, 100]
 *   - NaN/Infinity rejected
 *   - Part N (N > 1, N != 7) requires prevProgress.quizPassed === true in DB
 *   - Part 1 and Part 7 (first children's part) are always open
 */

import { describe, it, expect } from "vitest";
import { QUIZ_PASS_SCORE } from "@/lib/progress";

// ── Pure logic extracted from trackQuizCompleted ────────────────────────────
// These mirror exactly what app/actions/progress.ts does server-side.

function clampScore(raw: unknown): number | null {
  const n = Number(raw);
  // Check isFinite BEFORE clamping — Math.min/max silently convert
  // Infinity to 100 and -Infinity to 0, bypassing the intent of this guard.
  if (!Number.isFinite(n)) return null; // rejects NaN, Infinity, -Infinity
  return Math.min(100, Math.max(0, Math.round(n)));
}

function isSequentiallyUnlocked(
  partNumber: number,
  prevQuizPassed: boolean | null
): boolean {
  // Part 1 and Part 7 (first children's-path part) are always open
  if (partNumber === 1 || partNumber === 7) return true;
  // Every other part requires the predecessor quiz to be passed
  return prevQuizPassed === true;
}

// ── Score clamping ──────────────────────────────────────────────────────────

describe("Score clamping", () => {
  it("clamps a valid score to itself", () => {
    expect(clampScore(85)).toBe(85);
    expect(clampScore(80)).toBe(80);
    expect(clampScore(0)).toBe(0);
    expect(clampScore(100)).toBe(100);
  });

  it("clamps scores above 100 to 100", () => {
    expect(clampScore(101)).toBe(100);
    expect(clampScore(9999)).toBe(100);
  });

  it("clamps negative scores to 0", () => {
    expect(clampScore(-1)).toBe(0);
    expect(clampScore(-9999)).toBe(0);
  });

  it("rejects NaN (client cannot inject NaN as passing score)", () => {
    expect(clampScore(NaN)).toBeNull();
  });

  it("rejects Infinity", () => {
    expect(clampScore(Infinity)).toBeNull();
    expect(clampScore(-Infinity)).toBeNull();
  });

  it("coerces string numbers correctly (defensive against client type tricks)", () => {
    expect(clampScore("100")).toBe(100);
    expect(clampScore("0")).toBe(0);
  });

  it("rejects non-numeric strings as null (via NaN path)", () => {
    expect(clampScore("hack")).toBeNull();
    expect(clampScore("undefined")).toBeNull();
    expect(clampScore({})).toBeNull();
  });
});

// ── Quiz PASS_SCORE threshold ───────────────────────────────────────────────

describe("QUIZ_PASS_SCORE threshold", () => {
  it(`quizPassed is true at score >= ${QUIZ_PASS_SCORE}`, () => {
    const score80 = clampScore(80)!;
    const score100 = clampScore(100)!;
    expect(score80 >= QUIZ_PASS_SCORE).toBe(true);
    expect(score100 >= QUIZ_PASS_SCORE).toBe(true);
  });

  it(`quizPassed is false at score < ${QUIZ_PASS_SCORE}`, () => {
    const score79 = clampScore(79)!;
    expect(score79 >= QUIZ_PASS_SCORE).toBe(false);
  });
});

// ── Sequential lock ─────────────────────────────────────────────────────────

describe("Sequential unlock check — bypass prevention", () => {
  it("Part 1 is always unlocked (free entry)", () => {
    expect(isSequentiallyUnlocked(1, null)).toBe(true);
    expect(isSequentiallyUnlocked(1, false)).toBe(true);
  });

  it("Part 7 is always unlocked (first children's path part)", () => {
    expect(isSequentiallyUnlocked(7, null)).toBe(true);
    expect(isSequentiallyUnlocked(7, false)).toBe(true);
  });

  it("Part 2 is locked if Part 1 quiz not passed", () => {
    expect(isSequentiallyUnlocked(2, false)).toBe(false);
    expect(isSequentiallyUnlocked(2, null)).toBe(false);
  });

  it("Part 2 is unlocked if Part 1 quiz passed", () => {
    expect(isSequentiallyUnlocked(2, true)).toBe(true);
  });

  it("Part 50 is locked if Part 49 quiz not passed", () => {
    expect(isSequentiallyUnlocked(50, false)).toBe(false);
  });

  it("Part 50 is unlocked if Part 49 quiz passed", () => {
    expect(isSequentiallyUnlocked(50, true)).toBe(true);
  });

  it("Part 99 is locked if Part 98 quiz not passed (cannot skip to end)", () => {
    expect(isSequentiallyUnlocked(99, false)).toBe(false);
  });

  it("Part 99 is locked even with null prevProgress (no record = not passed)", () => {
    expect(isSequentiallyUnlocked(99, null)).toBe(false);
  });
});

// ── End-to-end quiz submission simulation ─────────────────────────────────

describe("Full quiz submission flow simulation", () => {
  function simulateTrackQuizCompleted(
    partNumber: number,
    rawScore: unknown,
    prevQuizPassed: boolean | null,
  ): { accepted: boolean; score?: number; passed?: boolean; reason?: string } {
    const score = clampScore(rawScore);
    if (score === null) return { accepted: false, reason: "invalid score" };
    if (!isSequentiallyUnlocked(partNumber, prevQuizPassed)) {
      return { accepted: false, reason: "part locked" };
    }
    const passed = score >= QUIZ_PASS_SCORE;
    return { accepted: true, score, passed };
  }

  it("accepts a valid passing score for an unlocked part", () => {
    const result = simulateTrackQuizCompleted(2, 85, true); // Part 2, prev passed
    expect(result.accepted).toBe(true);
    expect(result.passed).toBe(true);
  });

  it("accepts a failing score (below 80) for an unlocked part", () => {
    const result = simulateTrackQuizCompleted(2, 50, true);
    expect(result.accepted).toBe(true);
    expect(result.passed).toBe(false);
  });

  it("BLOCKS: skipping to Part 99 with fake score when predecessor not passed", () => {
    const result = simulateTrackQuizCompleted(99, 100, false);
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe("part locked");
  });

  it("BLOCKS: score=NaN cannot pass as 100", () => {
    const result = simulateTrackQuizCompleted(2, NaN, true);
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe("invalid score");
  });

  it("BLOCKS: score=Infinity cannot pass", () => {
    const result = simulateTrackQuizCompleted(2, Infinity, true);
    expect(result.accepted).toBe(false);
  });

  it("BLOCKS: client sends string 'hack' as score", () => {
    const result = simulateTrackQuizCompleted(2, "hack", true);
    expect(result.accepted).toBe(false);
  });

  it("Part 1 accepts score without any predecessor check", () => {
    const result = simulateTrackQuizCompleted(1, 90, null);
    expect(result.accepted).toBe(true);
  });

  it("Part 7 (children's path) accepts score without predecessor check", () => {
    const result = simulateTrackQuizCompleted(7, 80, null);
    expect(result.accepted).toBe(true);
  });
});
