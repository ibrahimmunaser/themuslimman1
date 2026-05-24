import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasActiveCourseAccess } from "@/lib/access";

/**
 * Server-side access guard for paid content/media API routes.
 *
 * Part 1 is always free — no authentication required.
 * Parts 2–100 require an authenticated user with active course access
 * (lifetime purchase OR active/trialing monthly subscription).
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
  if (partNumber === 1) return null;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const hasAccess = await hasActiveCourseAccess(user.id);
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
