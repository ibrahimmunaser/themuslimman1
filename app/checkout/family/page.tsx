import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ cycle?: string }>;
}

// Old family checkout — permanently redirect to unified /checkout page.
export default async function FamilyCheckoutPage({ searchParams }: Props) {
  const params = await searchParams;
  const billing = params.cycle === "monthly" ? "monthly" : "lifetime";
  redirect(`/checkout?plan=family&billing=${billing}`);
}
