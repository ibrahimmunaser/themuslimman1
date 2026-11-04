import { redirect } from "next/navigation";

interface Props {
  searchParams: Promise<{ plan?: string }>;
}

// Legacy trial checkout — permanently redirect to the unified /checkout page
// which implements the new checkout-first flow (no password at checkout time).
// The free trial is no longer offered; this goes to the individual monthly plan.
export default async function TrialCheckoutPage({ searchParams }: Props) {
  await searchParams;
  redirect("/checkout?plan=individual-monthly");
}
