"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, ArrowRight, RefreshCw, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

type SuccessType = "lifetime" | "subscription" | "family" | "family-subscription" | "family-lifetime";

const MAX_POLL_MS = 20_000;
const POLL_INTERVAL_MS = 2_000;

function PaymentSuccessPageContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successType, setSuccessType] = useState<SuccessType>("lifetime");
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  const paymentIntent = searchParams.get("payment_intent");
  const sessionId = searchParams.get("session_id");
  const type = searchParams.get("type"); // "subscription" | "family" | "lifetime" | "family-lifetime" | null
  const preview = searchParams.get("preview"); // dev-only: bypass payment verification

  async function resendVerification() {
    setResendLoading(true);
    try {
      await fetch("/api/auth/resend-verification", { method: "POST" });
      setResendDone(true);
    } catch {
      // ignore
    } finally {
      setResendLoading(false);
    }
  }

  useEffect(() => {
    // Dev preview mode — skip all verification, show the success screen directly.
    if (preview === "1" && process.env.NODE_ENV !== "production") {
      setSuccessType(
        type === "family" ? "family" :
        type === "family-lifetime" ? "family-lifetime" :
        type === "family-subscription" ? "family-subscription" :
        type === "subscription" ? "subscription" :
        "lifetime"
      );
      setEmailVerified(true);
      setLoading(false);
      return;
    }

    // Shared polling helper: poll check-access until confirmed, then fetch email status.
    async function pollThenFinish(resolvedType: SuccessType) {
      setSuccessType(resolvedType);
      const start = Date.now();

      async function pollAccess() {
        try {
          const res = await fetch("/api/stripe/check-access");
          if (res.status === 401) {
            setError("Payment received, but your session has expired. Please sign in to access your course.");
            setLoading(false);
            return;
          }
          if (res.ok) {
            const data = await res.json();
            if (data.hasAccess) {
              setEmailVerified(data.emailVerified ?? true);
              setHasPassword(data.hasPassword ?? true);
              setLoading(false);
              return;
            }
          }
        } catch {
          // Network error — keep polling
        }

        if (Date.now() - start >= MAX_POLL_MS) {
          setError(
            "Payment received. We're finishing setup — this usually takes a few seconds. " +
              "Refresh the page or go to the dashboard. If access is missing, contact support."
          );
          setLoading(false);
          return;
        }
        setTimeout(pollAccess, POLL_INTERVAL_MS);
      }

      pollAccess();
    }

    // Subscription types (trial or monthly) — poll for webhook confirmation
    if (type === "subscription" || type === "family-subscription") {
      const resolvedType: SuccessType = type === "family-subscription" ? "family-subscription" : "subscription";
      pollThenFinish(resolvedType);
      return;
    }

    // New Stripe Checkout Session lifetime payments (session_id in URL) — poll for access
    if (sessionId && (type === "lifetime" || type === "family-lifetime")) {
      const resolvedType: SuccessType = type === "family-lifetime" ? "family-lifetime" : "lifetime";
      pollThenFinish(resolvedType);
      return;
    }

    // Legacy: one-time payment via PaymentIntent (old Stripe Elements flow)
    async function verifyPayment() {
      if (!paymentIntent) {
        setError("No payment information found");
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`/api/stripe/verify-payment?payment_intent=${paymentIntent}`);
        if (!response.ok) throw new Error("Payment verification failed");
        // Fetch the real email verification status so pay-first users see the
        // verification banner rather than assuming email is already confirmed.
        const accessRes = await fetch("/api/stripe/check-access");
        const accessData = accessRes.ok ? await accessRes.json() : {};
        setSuccessType(type === "family" ? "family" : "lifetime");
        setEmailVerified(accessData.emailVerified ?? false);
        setHasPassword(accessData.hasPassword ?? true);
        setLoading(false);
      } catch {
        setError("Failed to verify payment. If you were charged, contact support.");
        setLoading(false);
      }
    }

    verifyPayment();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    // Both individual monthly ("subscription") and family monthly ("family-subscription")
    // use polling — show subscription copy for both. One-time payments show payment copy.
    const isAnySubscription = type === "subscription" || type === "family-subscription";
    return (
      <div className="min-h-screen bg-ink text-text flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">
            {isAnySubscription
              ? "Confirming your subscription…"
              : "Verifying your payment…"}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    const isSessionExpired = error.includes("session has expired");
    return (
      <div className="min-h-screen bg-ink text-text flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
            <RefreshCw className="w-7 h-7 text-amber-400" />
          </div>
          <h1 className="text-xl font-bold mb-2">Almost there…</h1>
          <p className="text-text-secondary mb-6 text-sm leading-relaxed">{error}</p>
          <div className="space-y-3">
            {isSessionExpired ? (
              <Link href="/login?redirect=/seerah">
                <Button variant="primary" size="lg" className="w-full">
                  Sign In to Access Course
                </Button>
              </Link>
            ) : (
              <button
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Page
              </button>
            )}
            <Link href="/contact">
              <Button variant="ghost" size="md" className="w-full">
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isSubscription      = successType === "subscription";        // individual monthly/trial
  const isFamilySubscription = successType === "family-subscription"; // family monthly/trial
  const isFamily             = successType === "family";              // family lifetime (legacy)
  const isFamilyLifetime     = successType === "family-lifetime";     // family lifetime (new)
  const isFamilyAny          = isFamily || isFamilySubscription || isFamilyLifetime;

  const needsVerification = emailVerified === false;

  return (
    <div className="min-h-screen bg-ink text-text flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mb-6 relative">
            {isSubscription || isFamilySubscription ? (
              <RefreshCw className="w-10 h-10 text-green-400" />
            ) : (
              <Check className="w-10 h-10 text-green-400" />
            )}
            <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            {isSubscription || isFamilySubscription ? "Subscription Active!" : "Payment Successful!"}
          </h1>
          <p className="text-lg text-text-secondary">
            {isFamilyAny ? "Welcome to Family Access" : "Welcome to Complete Seerah"}
          </p>
        </div>

        {/* Post-checkout action banner — shown for unverified users */}
        {needsVerification && (
          <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
            <Mail className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            {hasPassword === false ? (
              /* Guest checkout: they need to set a password */
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-amber-300">One more step — set your password</p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Your access is confirmed. Check your inbox — we sent you a link to set your
                  password and go straight to the dashboard.
                </p>
                <p className="text-xs text-zinc-500">
                  Link not arriving?{" "}
                  <a href="/forgot-password" className="text-gold hover:text-gold/80 underline">
                    Request a new one
                  </a>
                </p>
              </div>
            ) : (
              /* Existing account: they need to verify their email */
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-amber-300">One more step — verify your email</p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Your payment is confirmed and saved. Check your inbox for the verification link
                  to unlock your course.
                </p>
                <button
                  onClick={resendVerification}
                  disabled={resendLoading || resendDone}
                  className="text-xs text-gold hover:text-gold/80 underline disabled:opacity-50"
                >
                  {resendDone ? "Email sent!" : resendLoading ? "Sending…" : "Resend verification email"}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="space-y-3">
            {isFamilySubscription ? (
              // Family monthly — subscription + family profile messaging
              <>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-gold" />
                  </div>
                  <p className="text-text-secondary">Family subscription activated</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-gold" />
                  </div>
                  <p className="text-text-secondary">Up to 5 learner profiles for your household</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-gold" />
                  </div>
                  <p className="text-text-secondary">Cancel anytime from your billing page</p>
                </div>
              </>
            ) : isSubscription ? (
              // Individual monthly
              <>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-gold" />
                  </div>
                  <p className="text-text-secondary">Monthly subscription activated</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-gold" />
                  </div>
                  <p className="text-text-secondary">Full access to all 100 parts</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-gold" />
                  </div>
                  <p className="text-text-secondary">Cancel anytime from your billing page</p>
                </div>
              </>
            ) : isFamily ? (
              // Family lifetime
              <>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-gold" />
                  </div>
                  <p className="text-text-secondary">Family Access activated</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-gold" />
                  </div>
                  <p className="text-text-secondary">Up to 5 learner profiles for your household</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-gold" />
                  </div>
                  <p className="text-text-secondary">Lifetime access — no recurring charges</p>
                </div>
              </>
            ) : (
              // Individual lifetime
              <>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-gold" />
                  </div>
                  <p className="text-text-secondary">Payment processed successfully</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-gold" />
                  </div>
                  <p className="text-text-secondary">Full lifetime access granted to all 100 parts</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-gold" />
                  </div>
                  <p className="text-text-secondary">Your progress will be saved automatically</p>
                </div>
              </>
            )}
          </div>

          <div className="pt-6 border-t border-border space-y-3">
            {isFamilyAny && !needsVerification && (
              <Link href="/profiles" className="w-full block">
                <Button variant="primary" size="lg" className="w-full gap-2">
                  Set Up Learner Profiles
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            )}
            <Link href="/seerah" className="w-full block">
              <Button
                variant={isFamilyAny && !needsVerification ? "ghost" : "primary"}
                size="lg"
                className="w-full gap-2"
              >
                {needsVerification
                  ? "Go to Dashboard (verify first)"
                  : isFamilyAny
                    ? "Go to Dashboard"
                    : "Start Learning"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-text-muted mt-6">
          Questions?{" "}
          <Link href="/contact" className="text-gold hover:text-gold-light">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ink text-text flex items-center justify-center px-4">
          <div className="text-center">
            <div className="w-16 h-16 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-text-secondary">Loading…</p>
          </div>
        </div>
      }
    >
      <PaymentSuccessPageContent />
    </Suspense>
  );
}
