import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { getProfiles, ensureFamilyProfiles } from "@/app/actions/profiles";
import { isFamilyPlan, getProfileLimit } from "@/lib/access";
import { ProfilePickerClient } from "@/components/profiles/profile-picker-client";

export const metadata = { title: "Who is learning today? | Complete Seerah" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ preview?: string }>;
}

export default async function ProfilePickerPage({ searchParams }: Props) {
  const user = await requireStudent();
  if (!user.studentProfileId) redirect("/");

  const { preview } = await searchParams;
  const isPreview = preview === "family";

  const isFamily = isPreview || isFamilyPlan(user.planType);
  const profileLimit = isPreview ? 5 : getProfileLimit(user.planType);

  // For family plans, pre-populate all 5 profile slots with defaults on first visit
  if (isFamily && !isPreview) {
    await ensureFamilyProfiles();
  }

  const profiles = await getProfiles();

  // Preview mode: pad with mock profiles to fill 5 slots
  const displayProfiles = isPreview && profiles.length < 5
    ? [
        ...profiles,
        { id: "mock-2", displayName: "Ahmad", avatar: "📖", isDefault: false },
        { id: "mock-3", displayName: "Maryam", avatar: "🌙", isDefault: false },
        { id: "mock-4", displayName: "Yusuf", avatar: "⭐", isDefault: false },
        { id: "mock-5", displayName: "Fatimah", avatar: "🌸", isDefault: false },
      ].slice(0, 5)
    : profiles;

  // Individual plan: skip picker when 0 or 1 profiles — /seerah lazily creates a default profile
  if (!isFamily && profiles.length <= 1) {
    redirect("/seerah");
  }

  return (
    <ProfilePickerClient
      profiles={displayProfiles}
      profileLimit={profileLimit}
      isFamily={isFamily}
      activeProfileId={user.activeProfileId}
    />
  );
}
