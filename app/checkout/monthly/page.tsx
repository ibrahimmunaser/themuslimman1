import { redirect } from "next/navigation";

// Legacy monthly checkout URL — now handled by the unified /checkout page.
// Individual monthly is sold again (secondary offer alongside lifetime), so
// this forwards here instead of to lifetime.
export default async function MonthlyCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  await searchParams;
  redirect("/checkout?plan=individual-monthly");
}
