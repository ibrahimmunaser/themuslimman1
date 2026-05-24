import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserAccessInfo } from "@/lib/access";
import CheckoutClientPage from "./page-client";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const user = await getCurrentUser();

  if (user) {
    const { hasLifetime } = await getUserAccessInfo(user.id);
    // Only redirect for lifetime owners — monthly subscribers can still upgrade.
    if (hasLifetime) {
      redirect("/my-courses");
    }
  }

  return <CheckoutClientPage />;
}
