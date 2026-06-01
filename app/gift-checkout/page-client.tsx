"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import {
  Lock, ArrowLeft, ArrowRight, Gift, Check, Mail, User, MessageSquare, Tag, X, Users,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PLANS, formatPrice } from "@/lib/stripe-config";
import { getCreatorPromo, clearCreatorPromo, getCreatorPromoConfig } from "@/lib/creator-promos";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type GiftPlanId = "complete" | "family";

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
      <PaymentElement options={{ wallets: { link: "never" } }} />
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

interface GiftPromoState {
  code: string;
  displayLabel: string;
  discountAmount: number;
  estimatedFinalPrice: number;
}

interface GiftPricing {
  baseAmount: number;
  finalAmount: number;
  promoCode: string | null;
  promoDiscountAmount: number;
}

export default function GiftCheckoutClient({ purchaserEmail, purchaserName: _purchaserName }: GiftCheckoutClientProps) {
  const [planChoice, setPlanChoice] = useState<GiftPlanId>("complete");
  const plan = planChoice === "family" ? PLANS.family : PLANS.complete;

  const [step, setStep] = useState<Step>("details");
  const [details, setDetails] = useState<GiftDetails>({
    recipientEmail: "",
    recipientName: "",
    giftMessage: "",
  });
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, _setPaymentError] = useState<string | null>(null);
  const [requiresVerification, setRequiresVerification] = useState(false);

  const [pricing, setPricing] = useState<GiftPricing>({
    baseAmount: plan.price,
    finalAmount: plan.price,
    promoCode: null,
    promoDiscountAmount: 0,
  });

  // Creator promo — applies to gift checkout since it is still lifetime access
  const [giftPromo, setGiftPromo] = useState<GiftPromoState | null>(null);

  useEffect(() => {
    const stored = getCreatorPromo();
    if (!stored) return;
    const config = getCreatorPromoConfig(stored);
    if (!config) {
      clearCreatorPromo();
      return;
    }
    // Creator promos are fixed-amount discounts, so the discount applies to whichever plan is selected
    const estimatedFinal = plan.price - config.discountAmount;
    setGiftPromo({
      code: config.code,
      displayLabel: config.displayLabel,
      discountAmount: config.discountAmount,
      estimatedFinalPrice: Math.max(0, estimatedFinal),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planChoice]);

  const handleRemoveGiftPromo = () => {
    clearCreatorPromo();
    setGiftPromo(null);
  };

  // Reset to details step when plan changes so the intent is recreated with the right price
  const handlePlanChange = (newPlan: GiftPlanId) => {
    if (newPlan === planChoice) return;
    setPlanChoice(newPlan);
    if (step === "payment") {
      setStep("details");
      setClientSecret(null);
    }
  };

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
          planId: planChoice,
          promoCode: giftPromo?.code ?? undefined,
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
      setPricing({
        baseAmount: data.baseAmount,
        finalAmount: data.finalAmount,
        promoCode: data.promoCode ?? null,
        promoDiscountAmount: data.promoDiscountAmount ?? 0,
      });
      setClientSecret(data.clientSecret);
      setStep("payment");
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPaymentLoading(false);
    }
  };

  // Before payment is created: use estimated price from client-side promo config.
  // After payment is created: use the server-verified finalAmount.
  const displayPrice =
    step === "payment"
      ? pricing.finalAmount
      : giftPromo
        ? giftPromo.estimatedFinalPrice
        : plan.price;

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

        {/* Plan selector */}
        <div className="grid grid-cols-2 gap-3 mb-8 max-w-md">
          {([
            { id: "complete" as GiftPlanId, icon: User,  label: "Individual", price: PLANS.complete.price, sub: "1 learner · one-time" },
            { id: "family"   as GiftPlanId, icon: Users, label: "Family",     price: PLANS.family.price,   sub: "Up to 5 learners · one-time" },
          ] as const).map(({ id, icon: Icon, label, price, sub }) => (
            <button
              key={id}
              type="button"
              onClick={() => handlePlanChange(id)}
              className={`flex flex-col p-4 rounded-xl border transition-all text-left ${
                planChoice === id
                  ? "border-gold/50 bg-gold/8 text-white ring-1 ring-gold/30"
                  : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="font-semibold text-sm">{label}</span>
                {planChoice === id && <div className="ml-auto w-2 h-2 rounded-full bg-gold-light" />}
              </div>
              <span className="text-2xl font-bold text-white">{formatPrice(price)}</span>
              <span className="text-xs text-zinc-500 mt-0.5">{sub}</span>
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-5 gap-8">

          {/* ── Order Summary ────────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="bg-surface border border-border rounded-2xl p-6 sticky top-6">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

              <div className="mb-6">
                <h3 className="font-medium text-text mb-1">{plan.name}</h3>
                <p className="text-sm text-text-secondary mb-3">
                  {planChoice === "family" ? "Lifetime gift — up to 5 learner profiles" : "Lifetime gift access"}
                </p>
                <ul className="space-y-2">
                  {plan.features.slice(0, 5).map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                      <Check className="w-4 h-4 text-gold flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Creator promo banner */}
              {giftPromo && (
                <div className="mb-4 flex items-start justify-between gap-2 rounded-lg bg-gold/10 border border-gold/20 px-3 py-2.5">
                  <div className="flex items-start gap-2 text-sm min-w-0">
                    <Tag className="w-3.5 h-3.5 text-gold mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-gold font-medium leading-tight">Creator offer applied</p>
                      <p className="text-text-secondary text-xs mt-0.5 break-words">{giftPromo.displayLabel} — lifetime gift access</p>
                    </div>
                  </div>
                  {step === "details" && (
                    <button
                      type="button"
                      onClick={handleRemoveGiftPromo}
                      className="text-text-muted hover:text-text transition-colors flex-shrink-0 mt-0.5"
                      aria-label="Remove promo code"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-border space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary text-sm">
                    {planChoice === "family" ? "Family Lifetime Gift" : "Lifetime Gift Access"}
                  </span>
                  <span className="text-sm text-text">
                    {giftPromo ? (
                      <>
                        <span className="line-through text-text-muted mr-1.5">{formatPrice(plan.price)}</span>
                        {formatPrice(displayPrice)}
                      </>
                    ) : (
                      <>{formatPrice(displayPrice)} one-time</>
                    )}
                  </span>
                </div>
                {giftPromo && (
                  <div className="flex items-center justify-between text-sm text-gold">
                    <span>Creator discount (${giftPromo.discountAmount / 100} off)</span>
                    <span>−{formatPrice(plan.price - displayPrice)}</span>
                  </div>
                )}
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

              <div className="mt-5 pt-4 border-t border-border text-center">
                <p className="text-xs text-text-muted mb-1">Buying for yourself?</p>
                <Link href="/checkout" className="text-xs text-gold hover:text-gold-light transition-colors font-medium">
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
                        {planChoice === "family" && " They'll be the account owner and can add up to 4 more learner profiles."}
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
