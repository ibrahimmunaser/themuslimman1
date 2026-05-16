"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Check, Lock, ArrowLeft, Tag, X, ChevronDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PLANS, formatPrice, type PlanId } from "@/lib/stripe-config";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm({ plan, finalPrice }: { plan: typeof PLANS[PlanId]; finalPrice: number }) {
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
        Complete Purchase - {formatPrice(finalPrice)}
      </Button>

      <p className="text-xs text-text-muted text-center">
        Secure payment powered by Stripe · Your information is encrypted
      </p>

      <p className="text-xs text-text-muted text-center leading-relaxed">
        By purchasing, you agree to our{" "}
        <a href="/terms" className="underline hover:text-text-secondary transition-colors">Terms of Service</a>
        {", "}
        <a href="/privacy" className="underline hover:text-text-secondary transition-colors">Privacy Policy</a>
        {", and "}
        <a href="/refund" className="underline hover:text-text-secondary transition-colors">Refund Policy</a>.
      </p>
    </form>
  );
}

export function CheckoutPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // Only complete is sold during early access
  const planId: PlanId = "complete";
  const plan = PLANS[planId];

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Promo code state
  const [showPromo, setShowPromo] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string; label: string; discountAmount: number; finalPrice: number;
  } | null>(null);

  const displayPrice = appliedPromo ? appliedPromo.finalPrice : plan.price;

  const createPaymentIntent = async (promoCode?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, promoCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.push(`/signup-checkout?plan=${planId}`);
          return;
        }
        if (response.status === 403 && data.requiresVerification) {
          setRequiresVerification(true);
          setError(data.error);
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
  };

  useEffect(() => {
    createPaymentIntent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyPromo = async () => {
    const code = promoInput.trim();
    if (!code) return;
    setPromoLoading(true);
    setPromoError(null);

    try {
      const res = await fetch(`/api/stripe/validate-promo?code=${encodeURIComponent(code)}`);
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setPromoError(data.error || "Invalid promo code");
        return;
      }

      setAppliedPromo({
        code: data.code,
        label: data.label,
        discountAmount: data.discountAmount,
        finalPrice: data.finalPrice,
      });
      setPromoError(null);
      // Recreate the payment intent with the discounted amount
      setClientSecret(null);
      await createPaymentIntent(data.code);
    } catch {
      setPromoError("Could not validate code. Please try again.");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = async () => {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoError(null);
    setClientSecret(null);
    await createPaymentIntent();
  };

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

              {/* Promo code */}
              <div className="pt-4 border-t border-border">
                {appliedPromo ? (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-green-500/10 border border-green-500/20 mb-3">
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                      <Tag className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="font-medium">{appliedPromo.code}</span>
                      <span className="text-green-400/80">{appliedPromo.label}</span>
                    </div>
                    <button
                      onClick={handleRemovePromo}
                      className="text-green-400/60 hover:text-green-400 transition-colors"
                      aria-label="Remove promo code"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="mb-3">
                    {!showPromo ? (
                      <button
                        onClick={() => setShowPromo(true)}
                        className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text transition-colors"
                      >
                        <Tag className="w-3.5 h-3.5" />
                        Have a promo code?
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={promoInput}
                            onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(null); }}
                            onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                            placeholder="Enter code"
                            className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-surface-raised text-text placeholder-text-muted focus:outline-none focus:border-gold/50 uppercase"
                            autoFocus
                          />
                          <button
                            onClick={handleApplyPromo}
                            disabled={promoLoading || !promoInput.trim()}
                            className="px-4 py-2 text-sm font-medium rounded-lg bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                          >
                            {promoLoading ? "..." : "Apply"}
                          </button>
                        </div>
                        {promoError && (
                          <p className="text-xs text-red-400">{promoError}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {!appliedPromo && (
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-text-secondary text-sm">Regular price</span>
                    <span className="text-text-muted text-sm line-through">{formatPrice(plan.regularPrice!)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-secondary">{appliedPromo ? "Subtotal" : "Early access price"}</span>
                  <span className={appliedPromo ? "line-through text-text-muted text-sm" : "text-text font-medium"}>
                    {formatPrice(plan.price)}
                  </span>
                </div>

                {appliedPromo && (
                  <div className="flex items-center justify-between mb-2 text-green-400">
                    <span className="text-sm">Discount</span>
                    <span className="text-sm font-medium">−{formatPrice(appliedPromo.discountAmount)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-gold">{formatPrice(displayPrice)}</span>
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
                  <CheckoutForm plan={plan} finalPrice={displayPrice} />
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
