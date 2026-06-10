import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasActiveCourseAccess } from "@/lib/access";

/**
 * Server-side access guard for paid content/media API routes.
 *
 * All parts (including Part 1) require an authenticated user who has:
 *   1. A verified email address (emailVerified = true)
 *   2. Active course access (lifetime purchase OR active/trialing subscription)
 *
 * The emailVerified check mirrors the dashboard UI gate: a paid-but-unverified
 * user must not be able to bypass the verification wall by calling APIs directly.
 *
 * Returns null when access is permitted.
 * Returns a NextResponse (401 or 403) when access must be denied — the
 * caller must return this response immediately.
 *
 * Usage:
 *   const deny = await requirePartAccess(partNumber);
 *   if (deny) return deny;
 */
export async function requirePartAccess(partNumber: number): Promise<NextResponse | null> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  // Email must be verified before content is unlocked, even for paid users.
  if (!user.emailVerified) {
    return NextResponse.json(
      { error: "Email verification required" },
      { status: 403 }
    );
  }

  // Pass sessionHasPaid so lifetime buyers short-circuit without any DB queries.
  const hasAccess = await hasActiveCourseAccess(user.id, user.hasPaid);
  if (!hasAccess) {
    return NextResponse.json(
      { error: "Active subscription or lifetime purchase required" },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Extracts a Seerah part number from an R2 object key.
 *
 * Known key formats:
 *   "videos/Part 50.mp4"
 *   "audio/Part 50.mp3"
 *   "mindmaps/Part 50 - Mindmap.png"
 *   "slides/Part 50 - ..."
 *   "infographics/Part 50 - ..."
 *
 * Returns null if no part number can be parsed from the key.
 */
export function extractPartNumberFromR2Key(key: string): number | null {
  const match = /Part\s+(\d+)/i.exec(key);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  return isNaN(num) ? null : num;
}
