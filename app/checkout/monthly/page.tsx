import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserAccessInfo } from "@/lib/access";
import MonthlyCheckoutClient from "./page-client";

export const metadata = { title: "Monthly Access Checkout | Complete Seerah" };
export const dynamic = "force-dynamic";

export default async function MonthlyCheckoutPage() {
  const user = await getCurrentUser();

  if (user) {
    const accessInfo = await getUserAccessInfo(user.id, user.hasPaid);
    // Lifetime holders already have permanent access — no need for monthly
    if (accessInfo.hasLifetime) {
      redirect("/my-courses");
    }
  }

  return (
    <MonthlyCheckoutClient
      userEmail={user?.email ?? ""}
      userName={user?.fullName ?? ""}
    />
  );
}
