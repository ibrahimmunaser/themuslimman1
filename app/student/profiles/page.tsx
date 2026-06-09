import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { getProfilesWithProgress } from "@/app/actions/profiles";
import { isFamilyPlan, getProfileLimit, getUserAccessInfo } from "@/lib/access";
import { StudentLayout } from "@/components/student/student-layout";
import { ProfilesClient } from "./profiles-client";

export const metadata = { title: "Learner Profiles | Complete Seerah" };
export const dynamic = "force-dynamic";

export default async function ProfilesPage() {
  const user = await requireStudent();
  if (!user.studentProfileId) redirect("/");

  const [profiles, accessInfo] = await Promise.all([
    getProfilesWithProgress(),
    getUserAccessInfo(user.id, user.hasPaid),
  ]);

  const isFamily     = isFamilyPlan(user.planType);
  const profileLimit = getProfileLimit(user.planType);

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
      />
    </StudentLayout>
  );
}
