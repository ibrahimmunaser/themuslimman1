import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ cycle?: string }>;
}

// Old family checkout — permanently redirect to unified /checkout (lifetime only).
export default async function FamilyCheckoutPage({ searchParams }: Props) {
  await searchParams;
  redirect("/checkout?plan=family-lifetime");
}
