import { redirect } from "next/navigation";

// Legacy monthly checkout — now handled by the unified /checkout page.
export default async function MonthlyCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const params = await searchParams;
  const isFamily = params.plan === "familyMonthly" || params.plan === "family-monthly";
  // Use plan=family-monthly directly — NOT plan=family&billing=monthly.
  // LEGACY_PLAN_ALIASES["family"] maps to "family-lifetime", which would ignore
  // the billing=monthly param and silently route to a lifetime checkout instead.
  redirect(`/checkout?plan=${isFamily ? "family-monthly" : "individual-monthly"}`);
}
