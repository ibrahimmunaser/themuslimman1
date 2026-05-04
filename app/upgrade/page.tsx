"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Check, Lock, ArrowLeft, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PLANS, formatPrice } from "@/lib/stripe-config";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function UpgradeCheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const upgradePrice = PLANS.essentials.upgradePrice!;

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
        Complete Upgrade - {formatPrice(upgradePrice)}
      </Button>

      <p className="text-xs text-text-muted text-center">
        Secure payment powered by Stripe · Your information is encrypted
      </p>
    </form>
  );
}

export default function UpgradePage() {
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const upgradePrice = PLANS.essentials.upgradePrice!;
  const newFeatures = [
    "Slides (3 formats per part)",
    "Infographics (3 formats per part)",
    "Mind maps for visual learning",
    "Flashcards (Easy, Medium, Hard)",
    "Quizzes for mastery",
    "Study guides & Reports",
    "Statement of Facts",
    "Certificate",
    "Advanced parent reports",
  ];

  useEffect(() => {
    async function createUpgradePaymentIntent() {
      try {
        const response = await fetch("/api/stripe/create-upgrade-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/login?redirect=/upgrade");
            return;
          }
          if (response.status === 403) {
            // User doesn't have Essentials or already has Complete
            router.push("/my-courses");
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

    createUpgradePaymentIntent();
  }, [router]);

  return (
    <div className="min-h-screen bg-ink text-text">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/my-courses"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-text transition-colors text-sm mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to my courses
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gold/10 border-2 border-gold/30 flex items-center justify-center">
              <Zap className="w-6 h-6 text-gold" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold">Upgrade to Complete Seerah</h1>
              <p className="text-text-secondary text-sm mt-1">
                Unlock the full mastery system
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* What You're Getting */}
          <div className="lg:col-span-2">
            <div className="bg-surface border border-border rounded-2xl p-6 sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-gold" />
                <h2 className="text-lg font-semibold">What You're Getting</h2>
              </div>

              <div className="space-y-4 mb-6">
                <div className="p-4 rounded-lg bg-gold/5 border border-gold/20">
                  <p className="text-xs text-text-muted mb-1">Upgrading from</p>
                  <p className="font-semibold text-text">Essentials (100 parts)</p>
                  <p className="text-xs text-text-secondary mt-1">Video lessons, Listen on the Go, and briefings</p>
                </div>

                <div className="flex items-center justify-center">
                  <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent" />
                  <div className="mx-3 text-gold">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                  <div className="w-8 h-0.5 bg-gradient-to-r from-gold via-transparent to-transparent" />
                </div>

                <div className="p-4 rounded-lg bg-gold/10 border-2 border-gold/30">
                  <p className="text-xs text-gold mb-1">Upgrading to</p>
                  <p className="font-bold text-text">Complete Seerah (100 parts)</p>
                  <p className="text-xs text-text-secondary mt-1">Full mastery system with slides, infographics, mind maps, flashcards, quizzes, reports, and study guides</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <p className="text-sm font-semibold text-text-muted">Additional Features:</p>
                {newFeatures.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-text-secondary">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-secondary">Essentials (paid)</span>
                  <span className="text-text line-through">{formatPrice(PLANS.essentials.price)}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-secondary">Complete Seerah</span>
                  <span className="text-text">{formatPrice(PLANS.complete.price)}</span>
                </div>
                <div className="flex items-center justify-between font-semibold text-lg pt-3 border-t border-border">
                  <span>Upgrade Price</span>
                  <span className="text-gold">{formatPrice(upgradePrice)}</span>
                </div>
              </div>

              <div className="mt-6 p-3 rounded-lg bg-gold/5 border border-gold/20">
                <p className="text-xs text-text-secondary">
                  ✓ Instant access to all Complete features
                  <br />
                  ✓ Lifetime access + future updates
                  <br />
                  ✓ One-time payment, no recurring charges
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

              {error && !loading && (
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

              {clientSecret && !loading && (
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
                  <UpgradeCheckoutForm />
                </Elements>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
