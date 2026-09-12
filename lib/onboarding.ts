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
 * Dashboard onboarding flags for authenticated student shells.
 * Languages celebration takes priority (shown to everyone once).
 * Welcome tour / Arabic banner wait until languages has been seen.
 */
export function getDashboardOnboardingFlags(opts: {
  createdAt: Date;
  hasSeenWelcomeTour: boolean;
  hasSeenArabicAnnouncement: boolean;
  hasSeenLanguagesAnnouncement?: boolean;
}): {
  showWelcomeTour: boolean;
  showArabicAnnouncement: boolean;
  showLanguagesAnnouncement: boolean;
} {
  const showLanguagesAnnouncement = opts.hasSeenLanguagesAnnouncement === false;
  const isExisting = isExistingStudentForArabicAnnouncement(opts.createdAt);

  // Don't stack celebration + tour / Arabic banner in the same visit.
  if (showLanguagesAnnouncement) {
    return {
      showLanguagesAnnouncement: true,
      showWelcomeTour: false,
      showArabicAnnouncement: false,
    };
  }

  const showArabicAnnouncement =
    isExisting && opts.hasSeenArabicAnnouncement === false;
  const showWelcomeTour =
    !isExisting && opts.hasSeenWelcomeTour === false;

  return {
    showLanguagesAnnouncement: false,
    showWelcomeTour,
    showArabicAnnouncement,
  };
}
