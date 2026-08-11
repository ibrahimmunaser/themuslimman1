"use server";

import { getCurrentUser } from "@/lib/auth";
import { hasActiveCourseAccess, TOTAL_COURSE_PARTS } from "@/lib/access";
import { PART_CONTENT } from "@/lib/part-content-data";
import { PART_CONTENT_AR } from "@/lib/part-content-data-ar";
import { formatSeerahContent } from "@/lib/text-formatter";
import type { CourseLang } from "@/lib/course-lang";

/**
 * Access gate for text content server actions.
 */
async function canAccessPartContent(partNumber: number): Promise<boolean> {
  if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > TOTAL_COURSE_PARTS) {
    return false;
  }

  const user = await getCurrentUser();
  if (!user) return false;
  if (partNumber === 1) return true;
  if (!user.emailVerified && !user.isAnonymous) {
    const entitled = await hasActiveCourseAccess(user.id, user.hasPaid);
    if (!entitled) return false;
    return true;
  }
  return hasActiveCourseAccess(user.id, user.hasPaid);
}

/**
 * Returns pre-rendered briefing HTML for a single part.
 * English: hardcoded PART_CONTENT. Arabic: hardcoded PART_CONTENT_AR
 * (translated from the English source — not loaded from R2 at runtime).
 */
export async function getPartBriefingHtml(
  partNumber: number,
  lang: CourseLang = "en",
): Promise<string | null> {
  if (!(await canAccessPartContent(partNumber))) return null;

  if (lang === "ar") {
    const ar = PART_CONTENT_AR[partNumber];
    if (ar?.briefingHtml) return ar.briefingHtml;
    if (ar?.briefingText) return formatSeerahContent(ar.briefingText);
    return null;
  }

  const entry = PART_CONTENT[partNumber];
  if (entry?.briefingHtml) return entry.briefingHtml;
  if (entry?.briefingText) return formatSeerahContent(entry.briefingText);
  return null;
}

/**
 * Returns statement-of-facts raw text for a single part.
 * English: hardcoded PART_CONTENT. Arabic: hardcoded PART_CONTENT_AR.
 */
export async function getPartStatementOfFactsText(
  partNumber: number,
  lang: CourseLang = "en",
): Promise<string | null> {
  if (!(await canAccessPartContent(partNumber))) return null;

  if (lang === "ar") {
    return PART_CONTENT_AR[partNumber]?.statementOfFactsText ?? null;
  }

  return PART_CONTENT[partNumber]?.statementOfFactsText ?? null;
}
