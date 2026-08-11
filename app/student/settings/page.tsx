import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { hasActiveCourseAccess } from "@/lib/access";
import { StudentLayout } from "@/components/student/student-layout";
import { User, Mail, Shield } from "lucide-react";
import { ChangePasswordForm } from "@/components/student/change-password-form";
import { cookies } from "next/headers";
import { parseLang, COURSE_LANG_COOKIE } from "@/lib/course-lang";

export const metadata = { title: "Settings | Complete Seerah" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireStudent();
  if (!user.studentProfileId) redirect("/");

  const hasAccess = await hasActiveCourseAccess(user.id, user.hasPaid);
  if (!hasAccess) redirect("/pricing");
  // Entitled unverified keep access (part-access / Apple 5.1.1(v) parity).

  const userPlan = "complete" as const;
  const cookieStore = await cookies();
  const lang = parseLang(cookieStore.get(COURSE_LANG_COOKIE)?.value);
  const ar = lang === "ar";

  return (
    <StudentLayout userPlan={userPlan} userName={user.fullName}>
      <div className="min-h-screen bg-[#0a0a0a]" dir={ar ? "rtl" : undefined}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-xl sm:text-3xl font-bold text-text mb-2">{ar ? "الملف الشخصي والإعدادات" : "Profile & Settings"}</h1>
            <p className="text-text-secondary">
              {ar ? "إدارة تفضيلات الحساب والإعدادات" : "Manage your account preferences and settings"}
            </p>
          </div>

          {/* Profile Information */}
          <div className="p-6 rounded-xl border border-border bg-surface mb-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-5 h-5 text-gold" />
              <h2 className="text-lg font-semibold text-text">{ar ? "معلومات الملف الشخصي" : "Profile Information"}</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  {ar ? "الاسم الكامل" : "Full Name"}
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
                  {ar ? "عنوان البريد الإلكتروني" : "Email Address"}
                </label>
                <input
                  type="email"
                  defaultValue={user.email}
                  disabled
                  className="w-full px-4 py-2 rounded-lg bg-surface-raised border border-border text-text-muted cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-text-muted">
                {ar ? "لتحديث معلومات ملفك الشخصي، يرجى التواصل مع الدعم." : "To update your profile information, please contact support."}
              </p>
            </div>
          </div>

          {/* Security */}
          <div className="p-6 rounded-xl border border-border bg-surface mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-5 h-5 text-gold" />
              <h2 className="text-lg font-semibold text-text">{ar ? "الأمان" : "Security"}</h2>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                {ar ? "كلمة المرور" : "Password"}
              </label>
              <ChangePasswordForm lang={lang} />
            </div>
          </div>


          {/* Account Plan */}
          <div className="mt-6"></div>
          <div className="p-6 rounded-xl border border-border bg-surface">
            <div className="flex items-center gap-3 mb-6">
              <Mail className="w-5 h-5 text-gold" />
              <h2 className="text-lg font-semibold text-text">{ar ? "خطتك الحالية" : "Current Plan"}</h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text font-semibold capitalize mb-1">
                  {ar ? "وصول كامل إلى السيرة النبوية" : "Complete Seerah Early Access"}
                </p>
                <p className="text-text-secondary text-sm">
                  {ar ? "وصول كامل إلى جميع الـ ١٠٠ جزء ونظام الإتقان الشامل" : "Full access to all 100 parts and the complete mastery system"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
