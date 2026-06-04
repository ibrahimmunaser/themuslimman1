import { redirect } from "next/navigation";

// Legacy monthly checkout — now handled by the unified /checkout page.
export default async function MonthlyCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const params = await searchParams;
  const isFamily = params.plan === "familyMonthly" || params.plan === "family-monthly";
  redirect(`/checkout?plan=${isFamily ? "family" : "individual"}&billing=monthly`);
}
