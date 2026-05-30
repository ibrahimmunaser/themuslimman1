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

export const getCachedStudent = cache(requireStudent);
export const getCachedCurrentUser = cache(getCurrentUser);
