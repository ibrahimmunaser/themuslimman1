import { FREE_PART_NUMBER } from "@/lib/free-part-number";

/**
 * Guest (signed-out) access to the course dashboard.
 *
 * Visitors can browse the dashboard without an account. Only the free
 * preview part (FREE_PART_NUMBER) is free — every other part is locked
 * until the course is purchased. Guests have no learner profile (so no
 * progress tracking), so the free part for a guest renders the real lesson
 * page (/seerah/part-{FREE_PART_NUMBER}) in the same no-DB-write
 * "previewMode" PartTabs runs in on the old /watch-free marketing page —
 * see app/seerah/[partId]/page.tsx's `!user` branch.
 *
 * Safe to import from both server and client components.
 */

/** Public free-part preview — free, no signup required. */
export const GUEST_FREE_PART_HREF = `/seerah/part-${FREE_PART_NUMBER}`;

/** Where locked parts send a visitor. */
export const LOCKED_PART_HREF = "/pricing";

/** Sign-in link that returns the visitor to the dashboard. */
export const GUEST_SIGN_IN_HREF = "/login?redirect=%2Fseerah";

/** Destination for a part card/link when viewed by a guest. */
export function guestPartHref(partNumber: number): string {
  return partNumber === FREE_PART_NUMBER ? GUEST_FREE_PART_HREF : LOCKED_PART_HREF;
}
