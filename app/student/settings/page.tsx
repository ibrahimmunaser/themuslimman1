import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { hasActiveCourseAccess } from "@/lib/access";
import { StudentLayout } from "@/components/student/student-layout";
import { User, Mail, Shield } from "lucide-react";
import { ChangePasswordForm } from "@/components/student/change-password-form";
import { cookies } from "next/headers";
import { parseLang, COURSE_LANG_COOKIE } from "@/lib/course-lang";
import { loc } from "@/lib/loc";

export const metadata = { title: "Settings | Complete Seerah" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireStudent();
  if (!user.studentProfileId) redirect("/");

  const hasAccess = await hasActiveCourseAccess(user.id, user.hasPaid);
  if (!hasAccess) redirect("/pricing");

  const userPlan = "complete" as const;
  const cookieStore = await cookies();
  const lang = parseLang(cookieStore.get(COURSE_LANG_COOKIE)?.value);
  const ar = lang === "ar";

  return (
    <StudentLayout userPlan={userPlan} userName={user.fullName}>
      <div className="min-h-screen bg-[#0a0a0a]" dir={ar ? "rtl" : undefined}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-xl sm:text-3xl font-bold text-text mb-2">
              {loc(lang, "Profile & Settings", "الملف الشخصي والإعدادات", "Profil et paramètres")}
            </h1>
            <p className="text-text-secondary">
              {loc(
                lang,
                "Manage your account preferences and settings",
                "إدارة تفضيلات الحساب والإعدادات",
                "Gérez les préférences et les paramètres de votre compte",
              )}
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border bg-surface mb-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-5 h-5 text-gold" />
              <h2 className="text-lg font-semibold text-text">
                {loc(lang, "Profile Information", "معلومات الملف الشخصي", "Informations du profil")}
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  {loc(lang, "Full Name", "الاسم الكامل", "Nom complet")}
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
                  {loc(lang, "Email Address", "عنوان البريد الإلكتروني", "Adresse e-mail")}
                </label>
                <input
                  type="email"
                  defaultValue={user.email}
                  disabled
                  className="w-full px-4 py-2 rounded-lg bg-surface-raised border border-border text-text-muted cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-text-muted">
                {loc(
                  lang,
                  "To update your profile information, please contact support.",
                  "لتحديث معلومات ملفك الشخصي، يرجى التواصل مع الدعم.",
                  "Pour mettre à jour les informations de votre profil, veuillez contacter le support.",
                )}
              </p>
            </div>
          </div>

          <div className="p-6 rounded-xl border border-border bg-surface mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-5 h-5 text-gold" />
              <h2 className="text-lg font-semibold text-text">
                {loc(lang, "Security", "الأمان", "Sécurité")}
              </h2>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                {loc(lang, "Password", "كلمة المرور", "Mot de passe")}
              </label>
              <ChangePasswordForm lang={lang} />
            </div>
          </div>

          <div className="mt-6"></div>
          <div className="p-6 rounded-xl border border-border bg-surface">
            <div className="flex items-center gap-3 mb-6">
              <Mail className="w-5 h-5 text-gold" />
              <h2 className="text-lg font-semibold text-text">
                {loc(lang, "Current Plan", "خطتك الحالية", "Plan actuel")}
              </h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text font-semibold capitalize mb-1">
                  {loc(
                    lang,
                    "Complete Seerah Early Access",
                    "وصول كامل إلى السيرة النبوية",
                    "Accès anticipé Complete Seerah",
                  )}
                </p>
                <p className="text-text-secondary text-sm">
                  {loc(
                    lang,
                    "Full access to all 100 parts and the complete mastery system",
                    "وصول كامل إلى جميع الـ ١٠٠ جزء ونظام الإتقان الشامل",
                    "Accès complet aux 100 parties et au système de maîtrise complet",
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
