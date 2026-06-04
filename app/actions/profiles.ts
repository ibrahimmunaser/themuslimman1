"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireStudent } from "@/lib/auth";
import { setActiveProfileCookie } from "@/lib/auth";
import { getProfileLimit } from "@/lib/access";

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
  const user = await requireStudent();

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
  const user = await requireStudent();

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
    const totalParts = 100;

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
      (p: ProgressRow) => p.quizPassed
    ).length;

    const videosCompleted = progress.filter((p: ProgressRow) => p.videoCompleted || p.videoWatchPercent >= 85).length;
    const briefingsOpened = progress.filter((p: ProgressRow) => p.briefingOpened).length;
    const quizzesPassed   = progress.filter((p: ProgressRow) => p.quizPassed).length;
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

  const profileLimit = getProfileLimit(user.planType);

  const currentCount = await prisma.learnerProfile.count({
    where: { userId: user.id },
  });

  if (currentCount >= profileLimit) {
    const limitMsg =
      user.planType === "family"
        ? `Family Access allows up to ${profileLimit} learner profiles.`
        : `Your plan allows 1 learner profile. Upgrade to Family Access for up to 5 profiles.`;
    return { success: false, error: limitMsg };
  }

  const profile = await prisma.learnerProfile.create({
    data: {
      id: crypto.randomUUID(),
      userId: user.id,
      displayName: trimmedName,
      avatar: avatar ?? null,
      isDefault: false,
    },
    select: { id: true, displayName: true, avatar: true, isDefault: true },
  });

  revalidatePath("/student/profiles");
  revalidatePath("/profiles");
  return { success: true, profile };
}

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
    data.displayName = trimmed;
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

  // Prevent deleting if it's the only profile left
  const totalProfiles = await prisma.learnerProfile.count({
    where: { userId: user.id },
  });
  if (totalProfiles <= 1) {
    return {
      success: false,
      error: "You must have at least one learner profile.",
    };
  }

  await prisma.learnerProfile.delete({ where: { id: profileId } });

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
  const user = await requireStudent();

  const [existing, hasDefault] = await Promise.all([
    prisma.learnerProfile.findMany({
      where: { userId: user.id },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.learnerProfile.findFirst({
      where: { userId: user.id, isDefault: true },
      select: { id: true },
    }),
  ]);

  const FAMILY_LIMIT = 5;
  const needed = FAMILY_LIMIT - existing.length;
  if (needed <= 0) return { created: 0 };

  const DEFAULT_NAMES = ["Ahmad", "Maryam", "Yusuf", "Fatimah", "Omar"];
  const DEFAULT_AVATARS = ["📖", "🌙", "⭐", "🌸", "🕌"];

  // Determine which default names haven't been used yet (slot-indexed, not name-matched)
  const slots = DEFAULT_NAMES.slice(existing.length, existing.length + needed);
  const avatarSlots = DEFAULT_AVATARS.slice(existing.length, existing.length + needed);

  await prisma.learnerProfile.createMany({
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

  // Note: no revalidatePath here — this is called during page render, not
  // from a Server Action, so revalidatePath is not permitted at this point.
  // The calling page always re-fetches profiles immediately after, so no cache
  // invalidation is needed.
  return { created: slots.length };
}
