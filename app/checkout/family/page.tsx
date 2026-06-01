import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserAccessInfo } from "@/lib/access";
import FamilyCheckoutClient from "./page-client";

export const metadata = { title: "Family Access Checkout | Complete Seerah" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ cycle?: string }>;
}

export default async function FamilyCheckoutPage({ searchParams }: Props) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);

  const initialCycle: "lifetime" | "monthly" =
    params.cycle === "monthly" ? "monthly" : "lifetime";

  // Already has family lifetime — nothing to buy
  if (user?.planType === "family" && user.hasPaid) {
    redirect("/student/profiles");
  }

  // Individual Lifetime holders pay only the $100 difference.
  let isUpgradeFromLifetime = false;
  if (user) {
    const accessInfo = await getUserAccessInfo(user.id, user.hasPaid);
    isUpgradeFromLifetime =
      accessInfo.hasLifetime && user.planType !== "family" && !accessInfo.hasActiveSubscription;
  }

  return (
    <FamilyCheckoutClient
      userEmail={user?.email ?? ""}
      userName={user?.fullName ?? ""}
      initialCycle={initialCycle}
      isUpgradeFromLifetime={isUpgradeFromLifetime}
    />
  );
}
