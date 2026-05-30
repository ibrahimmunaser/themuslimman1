import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserAccessInfo } from "@/lib/access";
import CheckoutClientPage from "./page-client";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ plan?: string }>;
}

export default async function CheckoutPage({ searchParams }: Props) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);

  if (user) {
    const { hasLifetime } = await getUserAccessInfo(user.id, user.hasPaid);
    // Only redirect for lifetime owners — monthly subscribers can still upgrade.
    if (hasLifetime && user.planType === "family") {
      redirect("/my-courses");
    }
    // Individual lifetime holders can still go to family checkout via plan picker
  }

  const initialPlan = params.plan === "family" ? "family" : "complete";

  return (
    <CheckoutClientPage
      userEmail={user?.email ?? ""}
      initialPlan={initialPlan}
    />
  );
}
