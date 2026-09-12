import { describe, expect, it } from "vitest";
import {
  ARABIC_ANNOUNCEMENT_LAUNCH_AT,
  getDashboardOnboardingFlags,
} from "@/lib/onboarding";

describe("getDashboardOnboardingFlags", () => {
  const beforeLaunch = new Date(ARABIC_ANNOUNCEMENT_LAUNCH_AT.getTime() - 1);
  const onLaunch = new Date(ARABIC_ANNOUNCEMENT_LAUNCH_AT);
  const afterLaunch = new Date(ARABIC_ANNOUNCEMENT_LAUNCH_AT.getTime() + 1);

  it("prioritizes languages celebration over Arabic and welcome tour", () => {
    expect(
      getDashboardOnboardingFlags({
        createdAt: beforeLaunch,
        hasSeenWelcomeTour: false,
        hasSeenArabicAnnouncement: false,
        hasSeenLanguagesAnnouncement: false,
      }),
    ).toEqual({
      showLanguagesAnnouncement: true,
      showWelcomeTour: false,
      showArabicAnnouncement: false,
    });
  });

  it("shows Arabic announcement to existing students after languages is seen", () => {
    expect(
      getDashboardOnboardingFlags({
        createdAt: beforeLaunch,
        hasSeenWelcomeTour: false,
        hasSeenArabicAnnouncement: false,
        hasSeenLanguagesAnnouncement: true,
      }),
    ).toEqual({
      showLanguagesAnnouncement: false,
      showWelcomeTour: false,
      showArabicAnnouncement: true,
    });
  });

  it("hides Arabic announcement after it has been seen", () => {
    expect(
      getDashboardOnboardingFlags({
        createdAt: beforeLaunch,
        hasSeenWelcomeTour: false,
        hasSeenArabicAnnouncement: true,
        hasSeenLanguagesAnnouncement: true,
      }),
    ).toEqual({
      showLanguagesAnnouncement: false,
      showWelcomeTour: false,
      showArabicAnnouncement: false,
    });
  });

  it("shows welcome tour to brand-new signups after languages is seen", () => {
    expect(
      getDashboardOnboardingFlags({
        createdAt: afterLaunch,
        hasSeenWelcomeTour: false,
        hasSeenArabicAnnouncement: false,
        hasSeenLanguagesAnnouncement: true,
      }),
    ).toEqual({
      showLanguagesAnnouncement: false,
      showWelcomeTour: true,
      showArabicAnnouncement: false,
    });
  });

  it("does not show Arabic announcement to post-launch users even after the tour", () => {
    expect(
      getDashboardOnboardingFlags({
        createdAt: onLaunch,
        hasSeenWelcomeTour: true,
        hasSeenArabicAnnouncement: false,
        hasSeenLanguagesAnnouncement: true,
      }),
    ).toEqual({
      showLanguagesAnnouncement: false,
      showWelcomeTour: false,
      showArabicAnnouncement: false,
    });
  });
});
