import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ cycle?: string }>;
}

// Old family checkout — permanently redirect to unified /checkout page.
export default async function FamilyCheckoutPage({ searchParams }: Props) {
  const params = await searchParams;
  // Use plan=family-monthly / plan=family-lifetime directly.
  // plan=family&billing=monthly would be silently broken: LEGACY_PLAN_ALIASES["family"]
  // maps to "family-lifetime", ignoring the billing param entirely.
  const plan = params.cycle === "monthly" ? "family-monthly" : "family-lifetime";
  redirect(`/checkout?plan=${plan}`);
}
