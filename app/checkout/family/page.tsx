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

  if (!user) {
    redirect(`/login?redirect=/checkout/family?cycle=${initialCycle}`);
  }

  if (user.planType === "family" && user.hasPaid) {
    redirect("/student/profiles");
  }

  // Individual Lifetime holders pay only the $100 difference.
  // They must: have hasPaid (lifetime purchase), not be on family plan, and not be
  // on a monthly-only subscription (hasLifetime specifically covers one-time buyers).
  const accessInfo = await getUserAccessInfo(user.id, user.hasPaid);
  const isUpgradeFromLifetime =
    accessInfo.hasLifetime && user.planType !== "family" && !accessInfo.hasActiveSubscription;

  return (
    <FamilyCheckoutClient
      userEmail={user.email}
      userName={user.fullName}
      initialCycle={initialCycle}
      isUpgradeFromLifetime={isUpgradeFromLifetime}
    />
  );
}
