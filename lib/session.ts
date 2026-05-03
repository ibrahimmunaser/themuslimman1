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
  
  // Parent Progress Report Fields
  courseFor: string;
  studentName: string | null;
  parentEmail: string | null;
  parentEmailVerified: boolean;
  sendWeeklyReports: boolean;
}
