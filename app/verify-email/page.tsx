"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, X, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  // Optional redirect destination embedded in the verification link (e.g. gift claim page).
  // Validated to be a safe internal path before use.
  const rawRedirect = searchParams.get("redirect") ?? "";
  const safeRedirect =
    rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
      ? rawRedirect
      : "";
  
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link");
      return;
    }

    async function verify() {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setStatus("success");
          setMessage("Email verified successfully!");
          // Redirect to the embedded destination (e.g. gift claim) or default dashboard.
          setTimeout(() => router.push(safeRedirect || "/seerah"), 2000);
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed");
        }
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    }

    verify();
  }, [token, router]);

  return (
    <div className="w-full max-w-md text-center">
      {status === "verifying" && (
        <>
          <div className="w-16 h-16 mx-auto rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mb-4">
            <Loader className="w-8 h-8 text-gold animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-text mb-2">Verifying your email</h1>
          <p className="text-text-secondary text-sm">
            Please wait while we verify your account...
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-text mb-2">Email verified!</h1>
          <p className="text-text-secondary text-sm mb-6">
            Your email is confirmed. Taking you to your dashboard...
          </p>
          <Link href={safeRedirect || "/seerah"}>
            <Button variant="primary" size="lg">
              {safeRedirect ? "Continue" : "Go to Dashboard"}
            </Button>
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-text mb-2">Verification failed</h1>
          <p className="text-red-400 text-sm mb-2">{message}</p>
          <p className="text-text-muted text-xs mb-6">
            Your link may have expired. Sign in to request a new one.
          </p>
          <div className="space-y-3">
            <Link href="/login?redirect=/verify-email-pending">
              <Button variant="primary" size="lg" className="w-full">
                Sign In to Resend
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="lg" className="w-full">
                Back to Sign In
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Suspense
        fallback={
          <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mb-4">
              <Loader className="w-8 h-8 text-gold animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-text mb-2">Loading...</h1>
          </div>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
