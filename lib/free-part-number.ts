/**
 * The single free-preview part of the course. Everyone — guests and signed-in
 * users without an active course access — can view this part and all of its
 * lesson materials at no cost. Every other part (1–14, 16–100) requires
 * active course access (lifetime purchase, subscription, or mobile IAP).
 *
 * This lives in its own zero-dependency module (rather than lib/access.ts,
 * which imports Prisma) so it is safe to import from "use client" components
 * and the edge-runtime middleware without pulling server-only code into the
 * browser bundle.
 *
 * Single source of truth for the web app — mirrors the mobile app's
 * `kFreePartNumber` (seerah-mobile/seerah_app/lib/core/constants/app_constants.dart).
 * Change this single value to move the free preview to a different part.
 */
export const FREE_PART_NUMBER: number = 15;
