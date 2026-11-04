import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Gifting was only ever offered for the lifetime plan, which is no longer
// sold. A recurring monthly membership isn't meaningfully giftable, so this
// option is disabled — send anyone who lands here to the normal pricing page.
export default async function GiftCheckoutPage() {
  redirect("/pricing");
}
