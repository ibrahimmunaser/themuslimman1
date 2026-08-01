"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireStudent } from "@/lib/auth";
import { setActiveProfileCookie, clearActiveProfileCookie, getCurrentUser } from "@/lib/auth";
import { getProfileLimit, FAMILY_PROFILE_LIMIT, TOTAL_COURSE_PARTS, validateAvatar } from "@/lib/access";
import { getCachedStudent } from "@/lib/auth-cache";

const PROFILE_COOKIE = "seerah_profile";

// ─────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────

/**
 * Returns the active profile ID for a user, reading from the cookie
 * and validating ownership. Falls back to the default profile.
 * Creates a default profile lazily if none exists yet.
 *
 * This is the central helper used by all progress-tracking actions
 * and pages. Always validates that the profileId belongs to userId.
 */
export async function getActiveProfileId(userId: string): Promise<string> {
  // Bind to session so this cannot be invoked as an IDOR server action.
  const session = await requireStudent();
  if (!session || session.id !== userId) {
    throw new Error("Unauthorized");
  }

  const cookieStore = await cookies();
  const cookieProfileId = cookieStore.get(PROFILE_COOKIE)?.value ?? null;

  if (cookieProfileId) {
    // Validate ownership — never trust the cookie without a DB check.
    const profile = await prisma.learnerProfile.findFirst({
      where: { id: cookieProfileId, userId },
      select: { id: true },
    });
    if (profile) return profile.id;
  }

  // Cookie missing / invalid — fall back to the user's default profile.
  const defaultProfile = await prisma.learnerProfile.findFirst({
    where: { userId, isDefault: true },
    select: { id: true },
  });
  if (defaultProfile) return defaultProfile.id;

  // No default profile — use the first existing profile rather than creating a
  // new one. This prevents a phantom 6th profile being created for family users
  // who have 5 profiles (all isDefault: false) but have not yet selected one.
  const firstExisting = await prisma.learnerProfile.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (firstExisting) return firstExisting.id;

  // Truly no profiles at all (brand-new user) — create one lazily so progress
  // never crashes.
  return createDefaultProfileForUser(userId);
}

/**
 * Resolves which learner profile a progress-tracking write should apply to,
 * preferring an explicit profileId snapshot over the (possibly stale) cookie.
 *
 * Server-rendered lesson pages resolve `learnerProfileId` once via
 * getActiveProfileId() and pass it down to client components as a prop. If a
 * user has that page open in one tab and switches the active family profile
 * in a second tab, the shared `seerah_profile` cookie now points at a
 * different profile — but the first tab's UI (and any quiz/video progress it
 * later reports) still logically belongs to the profile the page was loaded
 * for. Without this, a client action re-deriving the profile from
 * getActiveProfileId() at write-time would silently attribute that tab's
 * progress to the wrong sibling profile.
 *
 * `explicitProfileId` is still re-validated against the DB (never trusted
 * blindly) — if it no longer belongs to this user (e.g. deleted from another
 * device mid-session), we fall back to the live active profile rather than
 * writing to a dangling id.
 */
export async function resolveLearnerProfileId(
  userId: string,
  explicitProfileId?: string | null,
): Promise<string> {
  // Bind to the session — refuse writing progress under another account's id.
  const session = await getCurrentUser();
  if (!session || session.id !== userId) {
    throw new Error("Unauthorized profile resolution");
  }

  if (explicitProfileId) {
    const profile = await prisma.learnerProfile.findFirst({
      where: { id: explicitProfileId, userId },
      select: { id: true },
    });
    if (profile) return profile.id;
  }
  return getActiveProfileId(userId);
}

/**
 * Creates a default learner profile for a user.
 * Used during lazy migration for users who have no profile yet.
 */
async function createDefaultProfileForUser(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fullName: true },
  });

  const profile = await prisma.learnerProfile.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      displayName: user?.fullName ?? "Learner",
      isDefault: true,
    },
    select: { id: true },
  });

  return profile.id;
}

// ─────────────────────────────────────────────────────────────
// Public server actions
// ─────────────────────────────────────────────────────────────

/** Returns all learner profiles for the current user. */
export async function getProfiles() {
  const user = await getCachedStudent();

  const profiles = await prisma.learnerProfile.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      displayName: true,
      avatar: true,
      isDefault: true,
      createdAt: true,
      _count: {
        select: { partProgress: true },
      },
    },
  });

  return profiles;
}

/** Returns a summary of progress for each learner profile (for parent dashboard). */
export async function getProfilesWithProgress() {
  const user = await getCachedStudent();

  const profiles = await prisma.learnerProfile.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    include: {
      partProgress: {
        select: {
          partNumber: true,
          status: true,
          videoWatchPercent: true,
          videoCompleted: true,
          briefingOpened: true,
          quizPassed: true,
          quizScoreVerified: true,
          quizBestScore: true,
          quizAttempts: true,
          flashcardsReviewed: true,
          openedAssets: true,
          lastAccessedAt: true,
          completedAt: true,
        },
        orderBy: { lastAccessedAt: "desc" },
      },
    },
  });

  return profiles.map((profile) => {
    const progress = profile.partProgress;
    const totalParts = TOTAL_COURSE_PARTS;

    // Parse openedAssets JSON once per part and reuse the result for all
    // asset-type lookups below. Previously each getAssetCount() call parsed
    // JSON for every part independently — 5 asset types × 100 parts = 500
    // JSON.parse calls per profile. Now it is exactly 100 per profile.
    type ProgressRow = (typeof progress)[number];
    // Normalize legacy asset IDs at parse time so old DB records are counted
    // correctly: "facts" and "statement_of_facts" → "statement-of-facts".
    const normalizeAssetId = (id: string): string => {
      if (id === "facts" || id === "statement_of_facts") return "statement-of-facts";
      return id;
    };
    const openedAssetsPerPart: string[][] = progress.map((p: ProgressRow) => {
      try {
        const raw = JSON.parse(p.openedAssets) as string[];
        return raw.map(normalizeAssetId);
      }
      catch { return []; }
    });

    const completedParts = progress.filter(
      (p: ProgressRow) => p.quizPassed && p.quizScoreVerified
    ).length;

    const videosCompleted = progress.filter((p: ProgressRow) => p.videoCompleted || p.videoWatchPercent >= 85).length;
    const briefingsOpened = progress.filter((p: ProgressRow) => p.briefingOpened).length;
    const quizzesPassed   = progress.filter((p: ProgressRow) => p.quizPassed && p.quizScoreVerified).length;
    const flashcardsStudied = progress.filter((p: ProgressRow) => p.flashcardsReviewed).length;

    const getAssetCount = (assetType: string) =>
      openedAssetsPerPart.filter((assets) => assets.includes(assetType)).length;

    const lastActivity = progress[0]?.lastAccessedAt ?? null;
    const completionPercent =
      completedParts > 0 ? Math.round((completedParts / totalParts) * 100) : 0;

    return {
      id: profile.id,
      displayName: profile.displayName,
      avatar: profile.avatar,
      isDefault: profile.isDefault,
      createdAt: profile.createdAt,
      stats: {
        completedParts,
        totalParts,
        completionPercent,
        videosCompleted,
        briefingsOpened,
        slidesViewed:      getAssetCount("slides"),
        infographicsViewed: getAssetCount("infographic"),
        mindmapsViewed:    getAssetCount("mindmap"),
        audioCompleted:    getAssetCount("audio"),
        flashcardsStudied,
        quizzesPassed,
        factsViewed:       getAssetCount("statement-of-facts"),
        lastActivity,
      },
    };
  });
}

/** Creates a new learner profile. Validates the Family plan profile limit. */
export async function createProfile(displayName: string, avatar?: string) {
  const user = await requireStudent();

  const trimmedName = displayName.trim();
  if (!trimmedName || trimmedName.length > 50) {
    return { success: false, error: "Name must be between 1 and 50 characters." };
  }
  const avatarError = validateAvatar(avatar);
  if (avatarError) {
    return { success: false, error: avatarError };
  }

  const profileLimit = getProfileLimit(user.planType);
  // Kept in lockstep with app/api/mobile-profiles/route.ts's identical
  // mobile-side message wording — a user bouncing between web and app
  // should never notice a discrepancy here.
  const limitMsg =
    user.planType === "family"
      ? `Family Access allows up to ${profileLimit} learner profiles.`
      : `Your plan allows 1 learner profile. Upgrade to Family Access for up to ${FAMILY_PROFILE_LIMIT} profiles.`;

  // Same race as the mobile /api/mobile-profiles POST route: count-then-create
  // as two statements lets two concurrent submissions (e.g. a family plan's
  // web dashboard open in two tabs) both pass the limit check before either
  // inserts. Serializable isolation forces Postgres to abort one side with a
  // P2034 serialization failure instead of over-provisioning profiles; retry
  // once so the loser re-reads the winner's committed row and correctly
  // rejects if the plan is now full.
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const profile = await prisma.$transaction(
        async (tx) => {
          const currentCount = await tx.learnerProfile.count({ where: { userId: user.id } });
          if (currentCount >= profileLimit) {
            throw new ProfileLimitError(limitMsg);
          }
          const duplicate = await tx.learnerProfile.findFirst({
            where: { userId: user.id, displayName: { equals: trimmedName, mode: "insensitive" } },
            select: { id: true },
          });
          if (duplicate) {
            throw new DuplicateProfileNameError();
          }
          return tx.learnerProfile.create({
            data: {
              id: crypto.randomUUID(),
              userId: user.id,
              displayName: trimmedName,
              avatar: avatar ?? null,
              isDefault: false,
            },
            select: { id: true, displayName: true, avatar: true, isDefault: true },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      revalidatePath("/student/profiles");
      revalidatePath("/profiles");
      return { success: true, profile };
    } catch (e) {
      if (e instanceof ProfileLimitError) {
        return { success: false, error: e.message };
      }
      if (e instanceof DuplicateProfileNameError) {
        return { success: false, error: "You already have a learner profile with this name." };
      }
      const isSerializationFailure =
        e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2034";
      if (!isSerializationFailure || attempt === maxAttempts) throw e;
      await new Promise((r) => setTimeout(r, 50 * attempt));
    }
  }
  // Unreachable — the loop above always returns or throws.
  return { success: false, error: "Server error" };
}

/** Internal signal used to short-circuit the transaction when the profile
 * limit is already reached, without letting Prisma treat it as a retryable
 * serialization failure. */
class ProfileLimitError extends Error {}

/** Internal signal used to short-circuit the delete transaction when this
 * would be the last remaining profile, without letting Prisma treat it as a
 * retryable serialization failure. */
class LastProfileError extends Error {}

/** Internal signal used to short-circuit create/update when another profile
 * on the same account already has this display name (case-insensitive,
 * trimmed), without letting Prisma treat it as a retryable serialization
 * failure. Audit L-duplicate-profile-names: two family profiles named
 * identically (e.g. both "Ahmad") were previously allowed, making the
 * profile-switcher list genuinely ambiguous — a parent could tap the wrong
 * "Ahmad" and record a sibling's quiz score against the wrong learner. */
class DuplicateProfileNameError extends Error {}

/** Updates a learner profile's display name or avatar. */
export async function updateProfile(
  profileId: string,
  data: { displayName?: string; avatar?: string | null }
) {
  const user = await requireStudent();

  // Validate ownership
  const existing = await prisma.learnerProfile.findFirst({
    where: { id: profileId, userId: user.id },
  });
  if (!existing) {
    return { success: false, error: "Profile not found." };
  }

  if (data.displayName !== undefined) {
    const trimmed = data.displayName.trim();
    if (!trimmed || trimmed.length > 50) {
      return { success: false, error: "Name must be between 1 and 50 characters." };
    }
    const duplicate = await prisma.learnerProfile.findFirst({
      where: {
        userId: user.id,
        id: { not: profileId },
        displayName: { equals: trimmed, mode: "insensitive" },
      },
      select: { id: true },
    });
    if (duplicate) {
      return { success: false, error: "You already have a learner profile with this name." };
    }
    data.displayName = trimmed;
  }
  if (data.avatar !== undefined) {
    const avatarError = validateAvatar(data.avatar);
    if (avatarError) {
      return { success: false, error: avatarError };
    }
  }

  await prisma.learnerProfile.update({
    where: { id: profileId },
    data: {
      displayName: data.displayName,
      avatar: data.avatar,
    },
  });

  revalidatePath("/student/profiles");
  revalidatePath("/profiles");
  return { success: true };
}

/**
 * Deletes a learner profile. The default / last remaining profile cannot be
 * deleted. Progress data is preserved via cascaded FK (set ON DELETE CASCADE).
 * If you want to hard-delete progress, do so explicitly before calling this.
 */
export async function deleteProfile(profileId: string) {
  const user = await requireStudent();

  // Validate ownership
  const existing = await prisma.learnerProfile.findFirst({
    where: { id: profileId, userId: user.id },
  });
  if (!existing) {
    return { success: false, error: "Profile not found." };
  }

  if (existing.isDefault) {
    return {
      success: false,
      error: "You cannot delete the default profile.",
    };
  }

  // Same race as createProfile above, mirrored: count-then-delete as two
  // separate statements lets two concurrent deletes (e.g. a family plan's
  // web dashboard open in two tabs, one deleting two different profiles at
  // once) both pass the "more than 1 left" check before either commits,
  // potentially dropping the account to 0 profiles entirely. Serializable
  // isolation + retry closes the same window the create-side fix closed.
  const deleteMaxAttempts = 3;
  for (let attempt = 1; attempt <= deleteMaxAttempts; attempt++) {
    try {
      await prisma.$transaction(
        async (tx) => {
          const totalProfiles = await tx.learnerProfile.count({
            where: { userId: user.id },
          });
          if (totalProfiles <= 1) {
            throw new LastProfileError();
          }
          await tx.learnerProfile.delete({ where: { id: profileId } });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      break;
    } catch (e) {
      if (e instanceof LastProfileError) {
        return {
          success: false,
          error: "You must have at least one learner profile.",
        };
      }
      const isSerializationFailure =
        e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2034";
      if (!isSerializationFailure || attempt === deleteMaxAttempts) throw e;
      await new Promise((r) => setTimeout(r, 50 * attempt));
    }
  }

  // If the deleted profile was the active one, clear the stale cookie now
  // instead of leaving it pointing at a now-nonexistent profile. This is
  // belt-and-suspenders — getActiveProfileId() already re-validates cookie
  // ownership on every read and falls back to the default profile — but
  // clearing it here avoids relying on that fallback and keeps the cookie
  // itself accurate immediately.
  const cookieStore = await cookies();
  if (cookieStore.get(PROFILE_COOKIE)?.value === profileId) {
    await clearActiveProfileCookie();
  }

  revalidatePath("/student/profiles");
  revalidatePath("/profiles");
  return { success: true };
}

/**
 * Sets the active learner profile cookie.
 * Validates that the profile belongs to the current user before setting.
 */
export async function switchProfile(profileId: string) {
  const user = await requireStudent();

  const profile = await prisma.learnerProfile.findFirst({
    where: { id: profileId, userId: user.id },
    select: { id: true, displayName: true },
  });

  if (!profile) {
    return { success: false, error: "Profile not found." };
  }

  await setActiveProfileCookie(profile.id);

  // Revalidate the entire /seerah subtree so any cached part pages, the
  // dashboard, and the resource library all reflect the new profile's progress.
  revalidatePath("/seerah", "layout");
  revalidatePath("/profiles");
  return { success: true, profile };
}

/**
 * Sets the primary/default profile flag.
 * Clears isDefault on all other profiles for this user.
 */
export async function setDefaultProfile(profileId: string) {
  const user = await requireStudent();

  const profile = await prisma.learnerProfile.findFirst({
    where: { id: profileId, userId: user.id },
  });
  if (!profile) {
    return { success: false, error: "Profile not found." };
  }

  await prisma.$transaction([
    prisma.learnerProfile.updateMany({
      where: { userId: user.id },
      data: { isDefault: false },
    }),
    prisma.learnerProfile.update({
      where: { id: profileId },
      data: { isDefault: true },
    }),
  ]);

  revalidatePath("/student/profiles");
  return { success: true };
}

/**
 * After a family plan purchase, ensures all 5 learner profile slots are
 * pre-populated with placeholder names so the Netflix-style picker is full.
 * Only creates profiles up to the limit; existing ones are preserved.
 * Safe to call multiple times — idempotent.
 */
export async function ensureFamilyProfiles() {
  const user = await getCachedStudent();

  const DEFAULT_NAMES = ["Ahmad", "Maryam", "Yusuf", "Fatimah", "Omar"];
  const DEFAULT_AVATARS = ["📖", "🌙", "⭐", "🌸", "🕌"];

  // Read-then-createMany used to run as two unrelated statements outside any
  // transaction — this page is visited right after checkout, at the same
  // moment the Stripe webhook's own ensureFamilyProfilesForUser (lib/access.ts)
  // may be independently provisioning the SAME user's profiles. Both reading
  // "0 existing profiles" and both inserting a full set would land the user
  // on 10 profiles for a 5-slot plan. Serializable isolation + retry — same
  // pattern as lib/access.ts's version — makes Postgres abort the loser
  // instead of letting both succeed.
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const [existing, hasDefault] = await Promise.all([
            tx.learnerProfile.findMany({
              where: { userId: user.id },
              select: { id: true },
              orderBy: { createdAt: "asc" },
            }),
            tx.learnerProfile.findFirst({
              where: { userId: user.id, isDefault: true },
              select: { id: true },
            }),
          ]);

          const needed = FAMILY_PROFILE_LIMIT - existing.length;
          if (needed <= 0) return { created: 0 };

          // Determine which default names haven't been used yet (slot-indexed, not name-matched)
          const slots = DEFAULT_NAMES.slice(existing.length, existing.length + needed);
          const avatarSlots = DEFAULT_AVATARS.slice(existing.length, existing.length + needed);

          await tx.learnerProfile.createMany({
            data: slots.map((name, i) => ({
              id: crypto.randomUUID(),
              userId: user.id,
              displayName: name,
              avatar: avatarSlots[i] ?? null,
              // If no default profile exists yet, mark the first slot as the default
              // so getActiveProfileId never needs to create a phantom 6th profile.
              isDefault: !hasDefault && existing.length === 0 && i === 0,
            })),
          });

          return { created: slots.length };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      // Note: no revalidatePath here — this is called during page render, not
      // from a Server Action, so revalidatePath is not permitted at this point.
      // The calling page always re-fetches profiles immediately after, so no cache
      // invalidation is needed.
    } catch (e) {
      const isSerializationFailure =
        e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2034";
      if (!isSerializationFailure || attempt === maxAttempts) throw e;
      await new Promise((r) => setTimeout(r, 50 * attempt));
    }
  }
  // Unreachable — the loop above always returns or throws.
  return { created: 0 };
}
