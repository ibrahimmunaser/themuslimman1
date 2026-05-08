import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { StudentLayout } from "@/components/student/student-layout";
import { ParentEmailSettings } from "@/components/student/parent-email-settings";
import { prisma } from "@/lib/db";
import { User, Mail, Shield } from "lucide-react";
import { ChangePasswordForm } from "@/components/student/change-password-form";

export const metadata = { title: "Settings | Seerah Masterclass" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireStudent();
  if (!user.studentProfileId) redirect("/");

  const purchases = await prisma.purchase.findMany({
    where: { userId: user.id, status: "succeeded" },
  });

  if (purchases.length === 0) redirect("/pricing");

  const userPlan = "complete" as const;

  return (
    <StudentLayout userPlan={userPlan} userName={user.fullName}>
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text mb-2">Profile & Settings</h1>
            <p className="text-text-secondary">
              Manage your account preferences and settings
            </p>
          </div>

          {/* Profile Information */}
          <div className="p-6 rounded-xl border border-border bg-surface mb-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-5 h-5 text-gold" />
              <h2 className="text-lg font-semibold text-text">Profile Information</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  defaultValue={user.fullName}
                  disabled
                  className="w-full px-4 py-2 rounded-lg bg-surface-raised border border-border text-text-muted cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  defaultValue={user.email}
                  disabled
                  className="w-full px-4 py-2 rounded-lg bg-surface-raised border border-border text-text-muted cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-text-muted">
                To update your profile information, please contact support.
              </p>
            </div>
          </div>

          {/* Security */}
          <div className="p-6 rounded-xl border border-border bg-surface mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-5 h-5 text-gold" />
              <h2 className="text-lg font-semibold text-text">Security</h2>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Password
              </label>
              <ChangePasswordForm />
            </div>
          </div>


          {/* Parent Progress Reports */}
          <ParentEmailSettings
            currentParentEmail={user.parentEmail}
            parentEmailVerified={user.parentEmailVerified}
            studentName={user.studentName}
            sendWeeklyReports={user.sendWeeklyReports}
          />

          {/* Account Plan */}
          <div className="mt-6"></div>
          <div className="p-6 rounded-xl border border-border bg-surface">
            <div className="flex items-center gap-3 mb-6">
              <Mail className="w-5 h-5 text-gold" />
              <h2 className="text-lg font-semibold text-text">Current Plan</h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text font-semibold capitalize mb-1">
                  Complete Seerah Early Access
                </p>
                <p className="text-text-secondary text-sm">
                  Full access to all 100 parts and the complete mastery system
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
