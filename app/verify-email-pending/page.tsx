import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Mail } from "lucide-react";
import { ResendVerificationButton } from "./resend-button";

export const metadata = { title: "Verify Your Email | Complete Seerah" };
export const dynamic = "force-dynamic";

export default async function VerifyEmailPendingPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (user.emailVerified) redirect("/seerah");

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto">
          <Mail className="w-8 h-8 text-gold" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-text">Check your inbox</h1>
          <p className="text-text-secondary">
            We sent a verification link to{" "}
            <span className="font-semibold text-gold">{user.email}</span>.
            Click the link to unlock full access to Complete Seerah.
          </p>
        </div>

        <ResendVerificationButton />

        <p className="text-xs text-text-muted">
          Already verified?{" "}
          <Link href="/seerah" className="text-gold hover:text-gold/80 underline">
            Go to dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
