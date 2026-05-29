// Simplified session type for platform admins and students only

export interface SessionUser {
  id: string;
  fullName: string;
  email: string;
  role: "platform_admin" | "student";
  isActive: boolean;
  profileImage: string | null;
  timezone: string;
  studentProfileId: string | null;
  emailVerified: boolean;
  // Loaded from the user row so downstream access checks can short-circuit
  // without an extra DB round-trip for lifetime buyers.
  hasPaid: boolean;

  // Plan type: "individual" (1 profile) | "family" (up to 5 profiles)
  planType: string;

  // Active learner profile — set via the seerah_profile cookie.
  // Validated server-side on every progress write. Falls back to the
  // user's default profile when the cookie is absent or stale.
  activeProfileId: string | null;
  activeProfileName: string | null;

  // Parent Progress Report Fields
  courseFor: string;
  studentName: string | null;
  parentEmail: string | null;
  parentEmailVerified: boolean;
  sendWeeklyReports: boolean;
}
