import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import SignupCheckoutClient from "./page-client";

export const dynamic = "force-dynamic";

interface SignupCheckoutPageProps {
  searchParams: Promise<{ plan?: string }>;
}

export default async function SignupCheckoutPage(props: SignupCheckoutPageProps) {
  const user = await getCurrentUser();
  const searchParams = await props.searchParams;

  // If user is already logged in, redirect to regular checkout
  if (user) {
    const plan = searchParams.plan || "complete";
    redirect(`/checkout?plan=${plan}`);
  }

  // If not logged in, show the signup form
  return <SignupCheckoutClient />;
}
