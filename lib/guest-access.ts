/**
 * Guest (signed-out) access to the course dashboard.
 *
 * Visitors can browse the dashboard without an account. Part 1 is free and
 * Parts 2+ are locked until the course is purchased. Guests have no learner
 * profile (so no progress tracking), so Part 1 for a guest renders the real
 * lesson page (/seerah/part-1) in the same no-DB-write "previewMode" PartTabs
 * runs in on the old /watch-free marketing page — see
 * app/seerah/[partId]/page.tsx's `!user` branch.
 *
 * Safe to import from both server and client components.
 */

/** Public Part 1 preview — free, no signup required. */
export const GUEST_PART1_HREF = "/seerah/part-1";

/** Where locked parts send a visitor. */
export const LOCKED_PART_HREF = "/pricing";

/** Sign-in link that returns the visitor to the dashboard. */
export const GUEST_SIGN_IN_HREF = "/login?redirect=%2Fseerah";

/** Destination for a part card/link when viewed by a guest. */
export function guestPartHref(partNumber: number): string {
  return partNumber === 1 ? GUEST_PART1_HREF : LOCKED_PART_HREF;
}
