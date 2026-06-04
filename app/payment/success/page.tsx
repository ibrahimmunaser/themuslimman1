"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type SuccessType = "lifetime" | "subscription" | "family" | "family-subscription";

const MAX_POLL_MS = 20_000;
const POLL_INTERVAL_MS = 2_000;

function PaymentSuccessPageContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successType, setSuccessType] = useState<SuccessType>("lifetime");

  const paymentIntent = searchParams.get("payment_intent");
  const type = searchParams.get("type"); // "subscription" | "family" | null
  const preview = searchParams.get("preview"); // dev-only: bypass payment verification

  useEffect(() => {
    // Dev preview mode — skip all verification, show the success screen directly.
    // Explicitly disabled in production so no one can bypass payment verification.
    if (preview === "1" && process.env.NODE_ENV !== "production") {
      setSuccessType(
        type === "family" ? "family" :
        type === "family-subscription" ? "family-subscription" :
        type === "subscription" ? "subscription" :
        "lifetime"
      );
      setLoading(false);
      return;
    }

    // Subscription payment (individual monthly or family monthly) —
    // poll until webhook confirms access (up to MAX_POLL_MS).
    if (type === "subscription" || type === "family-subscription") {
      setSuccessType(type === "family-subscription" ? "family-subscription" : "subscription");

      const start = Date.now();

      async function pollAccess() {
        try {
          const res = await fetch("/api/stripe/check-access");
          if (res.status === 401) {
            // Session expired — user needs to log back in to access the course
            setError(
              "Payment received, but your session has expired. Please sign in to access your course."
            );
            setLoading(false);
            return;
          }
          if (res.ok) {
            const data = await res.json();
            if (data.hasAccess) {
              setLoading(false);
              return;
            }
          }
        } catch {
          // Network error — keep polling
        }

        if (Date.now() - start >= MAX_POLL_MS) {
          // Timed out waiting for webhook — show a softer message
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
      return;
    }

    // One-time payment (Individual Lifetime or Family Lifetime) —
    // verify the PaymentIntent then show the appropriate success screen.
    async function verifyPayment() {
      if (!paymentIntent) {
        setError("No payment information found");
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(
          `/api/stripe/verify-payment?payment_intent=${paymentIntent}`
        );
        if (!response.ok) throw new Error("Payment verification failed");
        setSuccessType(type === "family" ? "family" : "lifetime");
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

  const isSubscription      = successType === "subscription";        // individual monthly
  const isFamilySubscription = successType === "family-subscription"; // family monthly
  const isFamily             = successType === "family";              // family lifetime
  const isFamilyAny          = isFamily || isFamilySubscription;      // any family plan

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
            {isFamilyAny && (
              <Link href="/profiles" className="w-full block">
                <Button variant="primary" size="lg" className="w-full gap-2">
                  Set Up Learner Profiles
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            )}
            <Link href="/seerah" className="w-full block">
              <Button variant={isFamilyAny ? "ghost" : "primary"} size="lg" className="w-full gap-2">
                {isFamilyAny ? "Go to Dashboard" : "Start Learning"}
                {!isFamilyAny && <ArrowRight className="w-4 h-4" />}
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
