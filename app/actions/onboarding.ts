"use server";

import { prisma } from "@/lib/db";
import { requireStudent } from "@/lib/auth";

/**
 * Marks the first-run welcome/coachmark tour of the course dashboard as seen
 * for the current account. Idempotent — safe to call multiple times (e.g. if
 * the user skips, or finishes, or the request races with a page unload).
 */
export async function markWelcomeTourSeen(): Promise<{ success: boolean }> {
  const user = await requireStudent();

  await prisma.user.update({
    where: { id: user.id },
    data: { hasSeenWelcomeTour: true },
  });

  return { success: true };
}

/**
 * Marks the one-time dashboard banner announcing Arabic course support as
 * seen for the current account. Idempotent — safe to call multiple times
 * (e.g. dismiss vs. "Switch to Arabic" both call this).
 */
export async function markArabicAnnouncementSeen(): Promise<{ success: boolean }> {
  const user = await requireStudent();

  await prisma.user.update({
    where: { id: user.id },
    data: { hasSeenArabicAnnouncement: true },
  });

  return { success: true };
}
