/**
 * Request-scoped cached versions of auth helpers.
 *
 * React.cache() deduplicates calls within a single React render tree, so
 * calling getCachedStudent() from both a layout and its child page resolves
 * the same DB query only once per request.
 *
 * Server-component use only — do not import in client components.
 */
import { cache } from "react";
import { requireStudent, getCurrentUser } from "./auth";
import { ROLES } from "./roles";
import type { SessionUser } from "./session";

export const getCachedStudent = cache(requireStudent);
export const getCachedCurrentUser = cache(getCurrentUser);

/**
 * For the publicly viewable course dashboard (/seerah, /seerah/resources).
 *
 * - Signed-out visitors → `null` (render the guest view: Part 1 free, rest locked).
 * - Signed-in students  → the SessionUser.
 * - Signed-in non-students (e.g. platform admins) → redirected home by requireStudent().
 *
 * Deduplicated per request so the layout and page share a single session lookup.
 */
export const getCachedStudentOrGuest = cache(async (): Promise<SessionUser | null> => {
  const user = await getCachedCurrentUser();
  if (!user) return null;
  if (user.role !== ROLES.STUDENT) return requireStudent(); // redirects, never returns
  return user;
});
