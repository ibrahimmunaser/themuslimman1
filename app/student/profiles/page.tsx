import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireStudent } from "@/lib/auth";
import { getProfilesWithProgress } from "@/app/actions/profiles";
import { isFamilyPlan, getProfileLimit, getUserAccessInfo, hasActiveCourseAccess } from "@/lib/access";
import { StudentLayout } from "@/components/student/student-layout";
import { ProfilesClient } from "./profiles-client";
import { parseLang, COURSE_LANG_COOKIE } from "@/lib/course-lang";

export const metadata = { title: "Learner Profiles | Complete Seerah" };
export const dynamic = "force-dynamic";

export default async function ProfilesPage() {
  const user = await requireStudent();
  if (!user.studentProfileId) redirect("/");

  const [hasAccess, profiles, accessInfo] = await Promise.all([
    hasActiveCourseAccess(user.id, user.hasPaid),
    getProfilesWithProgress(),
    getUserAccessInfo(user.id, user.hasPaid),
  ]);

  if (!hasAccess) redirect("/pricing");
  // Entitled unverified keep access (part-access / Apple 5.1.1(v) parity).

  const isFamily     = isFamilyPlan(user.planType);
  const profileLimit = getProfileLimit(user.planType);
  const cookieStore = await cookies();
  const lang = parseLang(cookieStore.get(COURSE_LANG_COOKIE)?.value);

  return (
    <StudentLayout
      userPlan="complete"
      userName={user.fullName}
      activeProfileName={user.activeProfileName}
      planType={user.planType}
    >
      <ProfilesClient
        profiles={profiles}
        isFamily={isFamily}
        profileLimit={profileLimit}
        hasLifetime={accessInfo.hasLifetime}
        currentUserId={user.id}
        activeProfileId={user.activeProfileId}
        isRtl={lang === "ar"}
      />
    </StudentLayout>
  );
}
