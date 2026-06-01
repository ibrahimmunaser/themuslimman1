import { getCurrentUser } from "@/lib/auth";
import GiftCheckoutClient from "./page-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gift Complete Seerah — TheMuslimMan",
  description: "Give someone you love lifetime access to Complete Seerah.",
};

export default async function GiftCheckoutPage() {
  const user = await getCurrentUser();

  return (
    <GiftCheckoutClient
      purchaserEmail={user?.email ?? ""}
      purchaserName={user?.fullName ?? ""}
    />
  );
}
