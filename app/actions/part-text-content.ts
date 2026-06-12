"use server";

import { PART_CONTENT } from "@/lib/part-content-data";
import { getCurrentUser } from "@/lib/auth";
import { hasActiveCourseAccess } from "@/lib/access";

/**
 * Access gate for text content server actions.
 *
 * Three-layer check — identical to getQuizAnswerMap / requirePartAccess:
 *   1. Authenticated user
 *   2. Verified email (prevents bypass of the verification wall)
 *   3. Active course access (lifetime purchase OR active/trialing subscription)
 *
 * Returns false (silently) for any denied case — no error detail is leaked
 * to the caller since these actions return string | null.
 *
 * Part number is validated first (fast, no DB) to reject obviously invalid
 * inputs before hitting auth.
 */
async function canAccessPartContent(partNumber: number): Promise<boolean> {
  if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > 100) {
    return false;
  }

  const user = await getCurrentUser();
  if (!user) return false;
  if (!user.emailVerified) return false;

  return hasActiveCourseAccess(user.id, user.hasPaid);
}

/**
 * Returns pre-rendered briefing HTML for a single part.
 *
 * Access: authenticated + verified + active course access only.
 * Returns null for denied access, invalid part number, or missing content.
 */
export async function getPartBriefingHtml(partNumber: number): Promise<string | null> {
  if (!(await canAccessPartContent(partNumber))) return null;
  return PART_CONTENT[partNumber]?.briefingHtml ?? null;
}

/**
 * Returns statement-of-facts raw text for a single part.
 *
 * Access: authenticated + verified + active course access only.
 * Returns null for denied access, invalid part number, or missing content.
 */
export async function getPartStatementOfFactsText(partNumber: number): Promise<string | null> {
  if (!(await canAccessPartContent(partNumber))) return null;
  return PART_CONTENT[partNumber]?.statementOfFactsText ?? null;
}
