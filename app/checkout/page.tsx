"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Check, Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PLANS, formatPrice, type PlanId } from "@/lib/stripe-config";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm({ plan }: { plan: typeof PLANS[PlanId] }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || "An error occurred");
      setProcessing(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/success`,
      },
    });

    if (confirmError) {
      setError(confirmError.message || "Payment failed");
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={!stripe || processing}
        loading={processing}
        className="w-full justify-center"
      >
        <Lock className="w-4 h-4" />
        Complete Purchase - {formatPrice(plan.price)}
      </Button>

      <p className="text-xs text-text-muted text-center">
        Secure payment powered by Stripe · Your information is encrypted
      </p>
    </form>
  );
}

export function CheckoutPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planId = (searchParams.get("plan") || "complete") as PlanId;
  const plan = PLANS[planId];

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    async function createPaymentIntent() {
      try {
        const response = await fetch("/api/stripe/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            // User not logged in, redirect to signup
            router.push(`/signup-checkout?plan=${planId}`);
            return;
          }
          if (response.status === 403 && data.requiresVerification) {
            // Email not verified
            setRequiresVerification(true);
            setError(data.error);
            setLoading(false);
            return;
          }
          throw new Error(data.error || "Failed to create payment intent");
        }

        setClientSecret(data.clientSecret);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    createPaymentIntent();
  }, [planId, router]);

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setResendSuccess(true);
      } else {
        alert(data.error || "Failed to resend verification email");
      }
    } catch (err) {
      alert("Something went wrong. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  if (!plan) {
    router.push("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-ink text-text">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-text transition-colors text-sm mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Complete Your Purchase</h1>
          <p className="text-text-secondary">
            You're one step away from accessing the {plan.name}
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-surface border border-border rounded-2xl p-6 sticky top-6">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <h3 className="font-medium text-text mb-2">{plan.name}</h3>
                  <p className="text-sm text-text-secondary mb-3">
                    One-time payment · Lifetime access
                  </p>
                  <ul className="space-y-2">
                    {plan.features.slice(0, 4).map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-text-secondary">
                        <Check className="w-4 h-4 text-gold flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                    {plan.features.length > 4 && (
                      <li className="text-sm text-text-muted">
                        + {plan.features.length - 4} more features
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-secondary">Subtotal</span>
                  <span className="text-text">{formatPrice(plan.price)}</span>
                </div>
                <div className="flex items-center justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-gold">{formatPrice(plan.price)}</span>
                </div>
              </div>

              <div className="mt-6 p-3 rounded-lg bg-gold/5 border border-gold/20">
                <p className="text-xs text-text-secondary">
                  ✓ Instant access after payment
                  <br />
                  ✓ Lifetime ownership
                  <br />
                  ✓ No recurring charges
                </p>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="lg:col-span-3">
            <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8">
              <h2 className="text-lg font-semibold mb-6">Payment Details</h2>

              {loading && (
                <div className="py-12 text-center">
                  <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-text-secondary">Loading payment form...</p>
                </div>
              )}

              {requiresVerification && !loading && (
                <div className="py-8">
                  <div className="p-6 rounded-xl bg-gold/10 border border-gold/30 text-center">
                    <div className="w-16 h-16 rounded-full bg-gold/20 border-2 border-gold/40 flex items-center justify-center mx-auto mb-4">
                      <Lock className="w-8 h-8 text-gold" />
                    </div>
                    <h3 className="text-xl font-bold text-text mb-2">Email Verification Required</h3>
                    <p className="text-text-secondary mb-6">
                      Please verify your email address before making a purchase. We sent a verification link to your email.
                    </p>
                    
                    {resendSuccess ? (
                      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 mb-4">
                        <p className="text-green-400 text-sm">
                          ✓ Verification email sent! Check your inbox.
                        </p>
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        size="lg"
                        onClick={handleResendVerification}
                        loading={resendLoading}
                        className="mx-auto"
                      >
                        Resend Verification Email
                      </Button>
                    )}

                    <p className="text-xs text-text-muted mt-4">
                      After verifying, refresh this page to continue
                    </p>
                  </div>
                </div>
              )}

              {error && !loading && !requiresVerification && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
                  {error}
                  <button
                    onClick={() => window.location.reload()}
                    className="block mt-2 text-red-300 underline hover:text-red-200"
                  >
                    Try again
                  </button>
                </div>
              )}

              {clientSecret && !loading && !requiresVerification && (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: "night",
                      variables: {
                        colorPrimary: "#d4af37",
                        colorBackground: "#1a1a1a",
                        colorText: "#e0e0e0",
                        colorDanger: "#ef4444",
                        fontFamily: "system-ui, sans-serif",
                        borderRadius: "8px",
                      },
                    },
                  }}
                >
                  <CheckoutForm plan={plan} />
                </Elements>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-ink text-text flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-text-secondary">Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutPageContent />
    </Suspense>
  );
}
