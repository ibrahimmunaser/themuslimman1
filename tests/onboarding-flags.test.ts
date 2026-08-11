import { describe, expect, it } from "vitest";
import {
  ARABIC_ANNOUNCEMENT_LAUNCH_AT,
  getDashboardOnboardingFlags,
} from "@/lib/onboarding";

describe("getDashboardOnboardingFlags", () => {
  const beforeLaunch = new Date(ARABIC_ANNOUNCEMENT_LAUNCH_AT.getTime() - 1);
  const onLaunch = new Date(ARABIC_ANNOUNCEMENT_LAUNCH_AT);
  const afterLaunch = new Date(ARABIC_ANNOUNCEMENT_LAUNCH_AT.getTime() + 1);

  it("shows Arabic announcement to existing students who have not seen it", () => {
    expect(
      getDashboardOnboardingFlags({
        createdAt: beforeLaunch,
        hasSeenWelcomeTour: false,
        hasSeenArabicAnnouncement: false,
      })
    ).toEqual({ showWelcomeTour: false, showArabicAnnouncement: true });
  });

  it("hides Arabic announcement after it has been seen", () => {
    expect(
      getDashboardOnboardingFlags({
        createdAt: beforeLaunch,
        hasSeenWelcomeTour: false,
        hasSeenArabicAnnouncement: true,
      })
    ).toEqual({ showWelcomeTour: false, showArabicAnnouncement: false });
  });

  it("shows welcome tour to brand-new signups, not Arabic announcement", () => {
    expect(
      getDashboardOnboardingFlags({
        createdAt: afterLaunch,
        hasSeenWelcomeTour: false,
        hasSeenArabicAnnouncement: false,
      })
    ).toEqual({ showWelcomeTour: true, showArabicAnnouncement: false });
  });

  it("does not show Arabic announcement to post-launch users even after the tour", () => {
    expect(
      getDashboardOnboardingFlags({
        createdAt: onLaunch,
        hasSeenWelcomeTour: true,
        hasSeenArabicAnnouncement: false,
      })
    ).toEqual({ showWelcomeTour: false, showArabicAnnouncement: false });
  });
});
