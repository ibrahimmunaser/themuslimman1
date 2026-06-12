import { redirect } from "next/navigation";

interface Props {
  searchParams: Promise<{ plan?: string }>;
}

// Legacy trial checkout — permanently redirect to the unified /checkout page
// which implements the new checkout-first flow (no password at checkout time).
export default async function TrialCheckoutPage({ searchParams }: Props) {
  const params = await searchParams;
  const isFamily = params.plan === "family";
  redirect(`/checkout?plan=${isFamily ? "family-trial" : "individual-trial"}`);
}
