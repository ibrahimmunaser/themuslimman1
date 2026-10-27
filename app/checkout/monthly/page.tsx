import { redirect } from "next/navigation";

// Legacy monthly checkout — now handled by the unified /checkout page.
export default async function MonthlyCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  await searchParams;
  redirect("/checkout?plan=individual-lifetime");
}
