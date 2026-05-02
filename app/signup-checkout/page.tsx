import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import SignupCheckoutClient from "./page-client";

export const dynamic = "force-dynamic";

interface SignupCheckoutPageProps {
  searchParams: { plan?: string };
}

export default async function SignupCheckoutPage({ searchParams }: SignupCheckoutPageProps) {
  const user = await getCurrentUser();

  // If user is already logged in, redirect to regular checkout
  if (user) {
    const plan = searchParams.plan || "complete";
    redirect(`/checkout?plan=${plan}`);
  }

  // If not logged in, show the signup form
  return <SignupCheckoutClient />;
}
