/**
 * AUTOMATED RISK: Course progress tracking
 *
 * Tests all pure progress-calculation functions.
 * These drive the quiz unlock, part completion, and mastery systems.
 */

import { describe, it, expect } from "vitest";
import {
  videoReachedThreshold,
  isCompleted,
  isMastered,
  computeStatus,
  parseProgressRow,
  canUnlockNextPart as _canUnlockNextPart,
  VIDEO_COMPLETION_THRESHOLD,
  QUIZ_PASS_SCORE,
  QUIZ_MASTERY_SCORE,
} from "@/lib/progress";
import type { ProgressSnapshot } from "@/lib/progress";

// Helpers
function snap(overrides: Partial<ProgressSnapshot> = {}): ProgressSnapshot {
  return {
    videoWatchPercent: 0,
    videoCompleted: false,
    briefingOpened: false,
    quizCompleted: false,
    quizBestScore: null,
    quizPassed: false,
    flashcardsReviewed: false,
    openedAssets: [],
    startedAt: null,
    ...overrides,
  };
}

// ── videoReachedThreshold ───────────────────────────────────────────────────

describe("videoReachedThreshold", () => {
  it("returns false when percent is 0", () => {
    expect(videoReachedThreshold(snap())).toBe(false);
  });

  it(`returns false below ${VIDEO_COMPLETION_THRESHOLD}%`, () => {
    expect(videoReachedThreshold(snap({ videoWatchPercent: 84 }))).toBe(false);
  });

  it(`returns true at exactly ${VIDEO_COMPLETION_THRESHOLD}%`, () => {
    expect(videoReachedThreshold(snap({ videoWatchPercent: 85 }))).toBe(true);
  });

  it("returns true when videoCompleted sticky flag is set, regardless of percent", () => {
    // Simulates: user completed video, reloaded page, percent regressed to 0
    expect(videoReachedThreshold(snap({ videoCompleted: true, videoWatchPercent: 0 }))).toBe(true);
    expect(videoReachedThreshold(snap({ videoCompleted: true, videoWatchPercent: 10 }))).toBe(true);
  });
});

// ── isCompleted ─────────────────────────────────────────────────────────────

describe("isCompleted — essentials plan", () => {
  it("requires video 85% + briefing", () => {
    expect(isCompleted(snap({ videoWatchPercent: 85, briefingOpened: true }), "essentials")).toBe(true);
  });

  it("false without briefing", () => {
    expect(isCompleted(snap({ videoWatchPercent: 85 }), "essentials")).toBe(false);
  });

  it("false without video threshold", () => {
    expect(isCompleted(snap({ videoWatchPercent: 50, briefingOpened: true }), "essentials")).toBe(false);
  });
});

describe("isCompleted — complete plan", () => {
  it("requires only quizPassed", () => {
    expect(isCompleted(snap({ quizPassed: true }), "complete")).toBe(true);
  });

  it("false even with video + briefing if quiz not passed", () => {
    expect(
      isCompleted(snap({ videoWatchPercent: 100, briefingOpened: true }), "complete")
    ).toBe(false);
  });

  it("true with quiz score exactly at threshold", () => {
    // quizPassed is a DB field set by trackQuizCompleted when score >= QUIZ_PASS_SCORE
    // We test that isCompleted uses quizPassed (boolean) not a raw score
    expect(isCompleted(snap({ quizPassed: true, quizBestScore: QUIZ_PASS_SCORE }), "complete")).toBe(true);
  });
});

// ── isMastered ──────────────────────────────────────────────────────────────

describe("isMastered", () => {
  const masteredSnap = snap({
    videoWatchPercent: 100,
    briefingOpened: true,
    quizBestScore: QUIZ_MASTERY_SCORE,
    flashcardsReviewed: true,
    openedAssets: ["slides", "mindmap"],
  });

  it("returns true when all mastery criteria met", () => {
    expect(isMastered(masteredSnap, "complete")).toBe(true);
  });

  it("always false for essentials plan", () => {
    expect(isMastered(masteredSnap, "essentials")).toBe(false);
  });

  it("false if quiz score below mastery threshold", () => {
    const s = snap({ ...masteredSnap, quizBestScore: QUIZ_MASTERY_SCORE - 1 });
    expect(isMastered(s, "complete")).toBe(false);
  });

  it("false if flashcards not reviewed", () => {
    const s = snap({ ...masteredSnap, flashcardsReviewed: false });
    expect(isMastered(s, "complete")).toBe(false);
  });

  it("false if fewer than 2 optional assets opened", () => {
    const s = snap({ ...masteredSnap, openedAssets: ["slides"] });
    expect(isMastered(s, "complete")).toBe(false);
  });
});

// ── computeStatus ───────────────────────────────────────────────────────────

describe("computeStatus", () => {
  it("returns not_started when startedAt is null", () => {
    expect(computeStatus(snap(), "complete")).toBe("not_started");
  });

  it("returns started when begun but not completed", () => {
    const s = snap({ startedAt: new Date(), videoWatchPercent: 50 });
    expect(computeStatus(s, "complete")).toBe("started");
  });

  it("returns completed for complete plan after quiz pass", () => {
    const s = snap({ startedAt: new Date(), quizPassed: true });
    expect(computeStatus(s, "complete")).toBe("completed");
  });

  it("returns mastered when all mastery criteria met", () => {
    const s = snap({
      startedAt: new Date(),
      videoWatchPercent: 100,
      briefingOpened: true,
      quizBestScore: QUIZ_MASTERY_SCORE,
      flashcardsReviewed: true,
      openedAssets: ["slides", "mindmap"],
    });
    expect(computeStatus(s, "complete")).toBe("mastered");
  });
});

// ── parseProgressRow ────────────────────────────────────────────────────────

describe("parseProgressRow", () => {
  it("parses valid JSON openedAssets string", () => {
    const row = {
      videoWatchPercent: 80,
      videoCompleted: false,
      briefingOpened: false,
      quizCompleted: false,
      quizBestScore: null,
      quizPassed: false,
      flashcardsReviewed: false,
      openedAssets: '["slides","mindmap"]',
      startedAt: null,
    };
    const result = parseProgressRow(row);
    expect(result.openedAssets).toEqual(["slides", "mindmap"]);
  });

  it("returns empty array for invalid JSON openedAssets", () => {
    const row = {
      videoWatchPercent: 0,
      videoCompleted: false,
      briefingOpened: false,
      quizCompleted: false,
      quizBestScore: null,
      quizPassed: false,
      flashcardsReviewed: false,
      openedAssets: "{{invalid",
      startedAt: null,
    };
    const result = parseProgressRow(row);
    expect(result.openedAssets).toEqual([]);
  });
});
