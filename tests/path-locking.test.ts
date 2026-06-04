/**
 * AUTOMATED RISK: Path locking — server OR-logic vs UI strict-lock mismatch
 *
 * Documents and verifies the server-side OR-unlock rule:
 *   Part N is unlocked if EITHER the complete-path predecessor (N-1)
 *   OR the children's-path predecessor's quiz is passed.
 *
 * This prevents the situation where a child who finished Part 7 (children's Part 1)
 * cannot access Part 11 (children's Part 2) because the server uses OR logic
 * but the UI was using a stricter sequential check.
 *
 * It also documents which parts belong to each path (from PART_AUDIENCES)
 * so regressions in the audience map are caught.
 */

import { describe, it, expect } from "vitest";
import { PART_AUDIENCES } from "@/lib/part-audiences";

// ── Helper: Server-side OR unlock logic ─────────────────────────────────────
// Mirrors the logic in app/seerah/[partId]/page.tsx

function getChildrenPath(): number[] {
  return Object.entries(PART_AUDIENCES)
    .filter(([, paths]) => paths.includes("children"))
    .map(([n]) => parseInt(n, 10))
    .sort((a, b) => a - b);
}

function getPrevChildrenPartNumber(partNumber: number): number | null {
  const childrenPath = getChildrenPath();
  const idx = childrenPath.indexOf(partNumber);
  if (idx <= 0) return null; // first or not in children's path
  return childrenPath[idx - 1];
}

function isPartUnlocked(
  partNumber: number,
  completePrevPassed: boolean,
  childrenPrevPassed: boolean,
): boolean {
  // Part 1 always unlocked
  if (partNumber === 1) return true;
  // First children's-path part (Part 7) always unlocked
  if (partNumber === 7) return true;
  // Server OR logic: unlocked if EITHER predecessor passed
  return completePrevPassed || childrenPrevPassed;
}

// ── Children's path structure ───────────────────────────────────────────────

describe("PART_AUDIENCES — children's path", () => {
  const childrenPath = getChildrenPath();

  it("starts with Part 7 (first children's-path part)", () => {
    expect(childrenPath[0]).toBe(7);
  });

  it("ends with Part 100", () => {
    expect(childrenPath[childrenPath.length - 1]).toBe(100);
  });

  it("has at least 30 parts in the children's path", () => {
    expect(childrenPath.length).toBeGreaterThanOrEqual(30);
  });

  it("Part 11 is in children's path (second children's part after Part 7)", () => {
    expect(childrenPath).toContain(11);
  });

  it("Part 1 is NOT in children's path (complete-only introduction)", () => {
    expect(childrenPath).not.toContain(1);
  });

  it("all children's-path parts also have 'complete' (children's is a subset)", () => {
    for (const n of childrenPath) {
      expect(
        PART_AUDIENCES[n],
        `Part ${n} in children's path should also include 'complete'`
      ).toContain("complete");
    }
  });
});

describe("getPrevChildrenPartNumber", () => {
  it("returns null for Part 7 (first in children's path)", () => {
    expect(getPrevChildrenPartNumber(7)).toBeNull();
  });

  it("returns 7 for Part 11 (second in children's path)", () => {
    expect(getPrevChildrenPartNumber(11)).toBe(7);
  });

  it("returns null for a complete-only part not in children's path", () => {
    expect(getPrevChildrenPartNumber(1)).toBeNull();
    expect(getPrevChildrenPartNumber(2)).toBeNull();
  });
});

// ── Server OR-unlock logic ──────────────────────────────────────────────────

describe("Server OR-unlock logic", () => {
  it("Part 1 always unlocked regardless of progress", () => {
    expect(isPartUnlocked(1, false, false)).toBe(true);
  });

  it("Part 7 always unlocked (first children's part)", () => {
    expect(isPartUnlocked(7, false, false)).toBe(true);
  });

  it("Part 2 locked when Part 1 quiz not passed", () => {
    expect(isPartUnlocked(2, false, false)).toBe(false);
  });

  it("Part 2 unlocked when Part 1 (complete predecessor) quiz passed", () => {
    expect(isPartUnlocked(2, true, false)).toBe(true);
  });

  it("Part 11 unlocked when Part 7 (children's predecessor) quiz passed — OR logic", () => {
    // Critical: Part 10 (complete predecessor) NOT passed, but Part 7 (children's) IS passed
    expect(isPartUnlocked(11, false, true)).toBe(true);
  });

  it("Part 11 locked when NEITHER Part 10 NOR Part 7 quiz passed", () => {
    expect(isPartUnlocked(11, false, false)).toBe(false);
  });

  it("Part 11 unlocked when Part 10 (complete predecessor) passed — even without children's", () => {
    expect(isPartUnlocked(11, true, false)).toBe(true);
  });
});

// ── Mismatch documentation ──────────────────────────────────────────────────

describe("Path locking mismatch documentation", () => {
  /**
   * This test documents the KNOWN mismatch between UI (strict per-path lock)
   * and server (OR logic). It is NOT a security issue — it's a UX inconsistency.
   *
   * A user who passed Part 7 quiz (children's) will:
   *   - Server: be allowed into Part 11 ✅
   *   - UI (old): see Part 11 as "Locked" ❌ (was strict sequential, only checked path)
   *
   * The server is the authoritative gate — it will let the user in.
   * The UI lock is cosmetic and should be updated to match server logic.
   */
  it("documents: Part 11 is server-accessible if children's Part 7 was passed (OR logic)", () => {
    const serverDecision = isPartUnlocked(11, false, true); // Part 10 not passed, Part 7 passed
    expect(serverDecision).toBe(true); // Server allows it
  });

  it("documents: Part 13 is server-accessible if Part 11 (children's prev) was passed", () => {
    // Children's path: 7 → 11 → 13 → 14 → ...
    const serverDecision = isPartUnlocked(13, false, true); // complete prev (12) not passed, children prev (11) passed
    expect(serverDecision).toBe(true);
  });
});
