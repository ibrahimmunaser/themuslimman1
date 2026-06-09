import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { hasActiveCourseAccess } from "@/lib/access";
import TrialCheckoutClientPage from "./page-client";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ plan?: string }>;
}

export default async function TrialCheckoutPage({ searchParams }: Props) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);

  if (user && !user.emailVerified && process.env.NODE_ENV === "production") {
    redirect("/verify-email-pending");
  }

  if (user) {
    const alreadyHasAccess = user.hasPaid || (await hasActiveCourseAccess(user.id));
    if (alreadyHasAccess) redirect("/seerah");
  }

  const isFamily = params.plan === "family";

  return (
    <TrialCheckoutClientPage
      userEmail={user?.email ?? ""}
      isFamily={isFamily}
    />
  );
}
