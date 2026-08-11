/**
 * Accounts created before this instant are treated as existing / returning
 * students. They should see the one-time Arabic announcement on their next
 * dashboard visit, and should not get the brand-new-user welcome tour.
 *
 * Matches the Arabic announcement migration date (2026-08-10). New signups
 * on/after this date discover Arabic via the sidebar language toggle instead.
 */
export const ARABIC_ANNOUNCEMENT_LAUNCH_AT = new Date("2026-08-10T00:00:00.000Z");

export function isExistingStudentForArabicAnnouncement(createdAt: Date): boolean {
  return createdAt.getTime() < ARABIC_ANNOUNCEMENT_LAUNCH_AT.getTime();
}

/**
 * Dashboard onboarding flags for /seerah. Existing students get the Arabic
 * banner once; brand-new signups get the welcome tour once. Never both.
 */
export function getDashboardOnboardingFlags(opts: {
  createdAt: Date;
  hasSeenWelcomeTour: boolean;
  hasSeenArabicAnnouncement: boolean;
}): { showWelcomeTour: boolean; showArabicAnnouncement: boolean } {
  const isExisting = isExistingStudentForArabicAnnouncement(opts.createdAt);
  const showArabicAnnouncement =
    isExisting && opts.hasSeenArabicAnnouncement === false;
  const showWelcomeTour =
    !isExisting && opts.hasSeenWelcomeTour === false;
  return { showWelcomeTour, showArabicAnnouncement };
}
