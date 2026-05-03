import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { StudentLayout } from "@/components/student/student-layout";
import { prisma } from "@/lib/db";
import { User, Mail, Lock, Bell, Shield } from "lucide-react";

export const metadata = { title: "Settings | Seerah Masterclass" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireStudent();
  if (!user.studentProfileId) redirect("/");

  const purchases = await prisma.purchase.findMany({
    where: { userId: user.id, status: "succeeded" },
  });

  if (purchases.length === 0) redirect("/pricing");

  const hasCompletePlan = purchases.some(p => p.planId === "complete");
  const userPlan = hasCompletePlan ? "complete" : "essentials";

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
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Password
                </label>
                <button
                  disabled
                  className="px-4 py-2 rounded-lg bg-surface-raised border border-border text-text-secondary cursor-not-allowed text-sm"
                >
                  Change Password (Coming Soon)
                </button>
              </div>
            </div>
          </div>


          {/* Parent Progress Reports */}
          {user.courseFor && (user.courseFor === "my_child" || user.courseFor === "my_family") && (
            <div className="p-6 rounded-xl border border-border bg-surface mb-6">
              <div className="flex items-center gap-3 mb-6">
                <Mail className="w-5 h-5 text-gold" />
                <h2 className="text-lg font-semibold text-text">Parent Progress Reports</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Student Name
                  </label>
                  <input
                    type="text"
                    value={user.studentName || ""}
                    disabled
                    className="w-full px-4 py-2 rounded-lg bg-surface-raised border border-border text-text-muted cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Parent / Guardian Email
                  </label>
                  <input
                    type="email"
                    value={user.parentEmail || ""}
                    disabled
                    className="w-full px-4 py-2 rounded-lg bg-surface-raised border border-border text-text-muted cursor-not-allowed"
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-surface-raised">
                  <div>
                    <p className="text-text font-medium">Weekly Progress Reports</p>
                    <p className="text-text-secondary text-sm">
                      {user.sendWeeklyReports ? "Enabled - Reports sent every Sunday" : "Disabled"}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    user.sendWeeklyReports 
                      ? "bg-green-500/10 text-green-400 border border-green-500/20"
                      : "bg-zinc-800 text-zinc-400"
                  }`}>
                    {user.sendWeeklyReports ? "ON" : "OFF"}
                  </div>
                </div>
                <p className="text-xs text-text-muted">
                  To update these settings, please contact support.
                </p>
              </div>
            </div>
          )}

          {/* Account Plan */}
          <div className="p-6 rounded-xl border border-border bg-surface">
            <div className="flex items-center gap-3 mb-6">
              <Mail className="w-5 h-5 text-gold" />
              <h2 className="text-lg font-semibold text-text">Current Plan</h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text font-semibold capitalize mb-1">
                  {userPlan === "complete" ? "Complete Seerah" : "Essentials Seerah"}
                </p>
                <p className="text-text-secondary text-sm">
                  {userPlan === "complete" 
                    ? "Full access to all 100 parts and the complete mastery system"
                    : "Access to all 100 video lessons, Listen on the Go, and briefings"}
                </p>
              </div>
              {userPlan === "essentials" && (
                <a
                  href="/pricing"
                  className="px-4 py-2 rounded-lg bg-gold text-ink font-semibold hover:bg-gold/90 transition-colors"
                >
                  Upgrade
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
