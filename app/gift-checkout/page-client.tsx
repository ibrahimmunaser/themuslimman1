"use client";

import { useState, useEffect, Suspense } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import {
  Lock, ArrowLeft, ArrowRight, Gift, Check, Mail, User, MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PLANS, formatPrice } from "@/lib/stripe-config";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// ── Payment form (inner Stripe Elements) ─────────────────────────────────────

function GiftPaymentForm({ finalPrice, recipientEmail }: { finalPrice: number; recipientEmail: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? "An error occurred");
      setProcessing(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/gift-sent`,
      },
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed");
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
        Send Gift — {formatPrice(finalPrice)}
      </Button>
      <p className="text-xs text-text-muted text-center">
        Secure payment · Your recipient gets an email with a claim link at{" "}
        <span className="text-gold">{recipientEmail}</span>
      </p>
      <p className="text-xs text-text-muted text-center leading-relaxed">
        By purchasing, you agree to our{" "}
        <a href="/terms" className="underline hover:text-text-secondary">Terms of Service</a>
        {", "}
        <a href="/privacy" className="underline hover:text-text-secondary">Privacy Policy</a>
        {", and "}
        <a href="/refund" className="underline hover:text-text-secondary">Refund Policy</a>.
      </p>
    </form>
  );
}

// ── Main gift checkout page ───────────────────────────────────────────────────

interface GiftCheckoutClientProps {
  purchaserEmail: string;
  purchaserName: string;
}

type Step = "details" | "payment";

interface GiftDetails {
  recipientEmail: string;
  recipientName: string;
  giftMessage: string;
}

export default function GiftCheckoutClient({ purchaserEmail, purchaserName }: GiftCheckoutClientProps) {
  const plan = PLANS.complete;

  const [step, setStep] = useState<Step>("details");
  const [details, setDetails] = useState<GiftDetails>({
    recipientEmail: "",
    recipientName: "",
    giftMessage: "",
  });
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [requiresVerification, setRequiresVerification] = useState(false);

  const [pricing, setPricing] = useState({ baseAmount: plan.price });

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDetailsError(null);

    if (!details.recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.recipientEmail)) {
      setDetailsError("Please enter a valid recipient email address.");
      return;
    }
    if (details.recipientEmail.toLowerCase() === purchaserEmail.toLowerCase()) {
      setDetailsError("You cannot gift the course to yourself. Use regular checkout instead.");
      return;
    }

    setPaymentLoading(true);
    try {
      const res = await fetch("/api/stripe/create-gift-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: details.recipientEmail,
          recipientName: details.recipientName,
          giftMessage: details.giftMessage,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403 && data.requiresVerification) {
          setRequiresVerification(true);
          setDetailsError(data.error);
          return;
        }
        setDetailsError(data.error ?? "Failed to initialize payment");
        return;
      }
      setPricing({ baseAmount: data.baseAmount });
      setClientSecret(data.clientSecret);
      setStep("payment");
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPaymentLoading(false);
    }
  };

  const displayPrice = pricing.baseAmount;

  if (requiresVerification) {
    return (
      <div className="min-h-screen bg-ink text-text flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-8 text-center">
          <Lock className="w-10 h-10 text-gold mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Email Verification Required</h2>
          <p className="text-text-secondary text-sm mb-6">
            Please verify your email address before purchasing a gift.
          </p>
          <Link href="/checkout">
            <Button variant="primary" size="lg" className="w-full justify-center">Back to Account</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink text-text">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">

        {/* Header */}
        <div className="mb-8">
          <Link href="/pricing" className="inline-flex items-center gap-2 text-text-secondary hover:text-text transition-colors text-sm mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to pricing
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/25 flex items-center justify-center">
              <Gift className="w-5 h-5 text-gold" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold">Gift Complete Seerah</h1>
          </div>
          <p className="text-text-secondary">
            Give someone lifetime access to the full 100-part Seerah journey.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">

          {/* ── Order Summary ────────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="bg-surface border border-border rounded-2xl p-6 sticky top-6">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

              <div className="mb-6">
                <h3 className="font-medium text-text mb-1">{plan.name}</h3>
                <p className="text-sm text-text-secondary mb-3">Lifetime gift access</p>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                      <Check className="w-4 h-4 text-gold flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-border space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary text-sm">Lifetime Access</span>
                  <span className="text-sm text-text">{formatPrice(displayPrice)} one-time</span>
                </div>
                <div className="flex items-center justify-between font-semibold text-lg border-t border-border pt-2 mt-2">
                  <span>Gift Total</span>
                  <span className="text-gold">{formatPrice(displayPrice)}</span>
                </div>
              </div>

              {details.recipientEmail && step === "payment" && (
                <div className="mt-4 p-3 rounded-lg bg-gold/5 border border-gold/20 text-xs text-text-secondary space-y-1">
                  <p className="font-medium text-text">Gift to:</p>
                  <p>{details.recipientEmail}</p>
                  {details.recipientName && <p>{details.recipientName}</p>}
                </div>
              )}

              <div className="mt-4 p-3 rounded-lg bg-gold/5 border border-gold/20">
                <p className="text-xs text-text-secondary">
                  ✓ Recipient gets an email with a claim link<br />
                  ✓ They create an account or sign in to claim<br />
                  ✓ Lifetime access activated instantly
                </p>
              </div>

              {/* Toggle back to normal checkout */}
              <div className="mt-5 pt-4 border-t border-border text-center">
                <p className="text-xs text-text-muted mb-1">Buying for yourself?</p>
                <Link href="/checkout?plan=complete" className="text-xs text-gold hover:text-gold-light transition-colors font-medium">
                  Switch to regular checkout →
                </Link>
              </div>
            </div>
          </div>

          {/* ── Form / Payment ───────────────────────────────────────────── */}
          <div className="lg:col-span-3">
            <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8">

              {/* Step 1 — Recipient Details */}
              {step === "details" && (
                <>
                  <h2 className="text-lg font-semibold mb-6">Recipient Details</h2>
                  <form onSubmit={handleDetailsSubmit} className="space-y-5">

                    <div>
                      <label className="block text-sm font-medium text-text mb-1.5">
                        <Mail className="w-4 h-4 inline mr-1.5 text-gold" />
                        Recipient&apos;s Email <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={details.recipientEmail}
                        onChange={(e) => setDetails({ ...details, recipientEmail: e.target.value })}
                        placeholder="their@email.com"
                        className="w-full px-4 py-3 rounded-lg border border-border bg-surface-raised text-text placeholder-text-muted focus:outline-none focus:border-gold/50 transition-colors"
                      />
                      <p className="text-xs text-text-muted mt-1">
                        We&apos;ll send the claim link to this address.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text mb-1.5">
                        <User className="w-4 h-4 inline mr-1.5 text-gold" />
                        Recipient&apos;s Name <span className="text-text-muted font-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={details.recipientName}
                        onChange={(e) => setDetails({ ...details, recipientName: e.target.value })}
                        placeholder="e.g. Ibrahim"
                        className="w-full px-4 py-3 rounded-lg border border-border bg-surface-raised text-text placeholder-text-muted focus:outline-none focus:border-gold/50 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text mb-1.5">
                        <MessageSquare className="w-4 h-4 inline mr-1.5 text-gold" />
                        Personal Message <span className="text-text-muted font-normal">(optional)</span>
                      </label>
                      <textarea
                        value={details.giftMessage}
                        onChange={(e) => setDetails({ ...details, giftMessage: e.target.value })}
                        placeholder="Write a short note to include with the gift…"
                        rows={3}
                        maxLength={500}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-surface-raised text-text placeholder-text-muted focus:outline-none focus:border-gold/50 transition-colors resize-none"
                      />
                      <p className="text-xs text-text-muted mt-1 text-right">
                        {details.giftMessage.length}/500
                      </p>
                    </div>

                    {detailsError && (
                      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {detailsError}
                      </div>
                    )}

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      loading={paymentLoading}
                      className="w-full justify-center"
                    >
                      Continue to Payment
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </form>
                </>
              )}

              {/* Step 2 — Payment */}
              {step === "payment" && clientSecret && (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <button
                      onClick={() => setStep("details")}
                      className="text-text-muted hover:text-text transition-colors"
                      aria-label="Back to recipient details"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <h2 className="text-lg font-semibold">Payment Details</h2>
                  </div>

                  {paymentError && (
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
                      {paymentError}
                    </div>
                  )}

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
                    <GiftPaymentForm
                      finalPrice={displayPrice}
                      recipientEmail={details.recipientEmail}
                    />
                  </Elements>
                </>
              )}

              {step === "payment" && paymentLoading && (
                <div className="py-12 text-center">
                  <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-text-secondary">Loading payment form…</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
