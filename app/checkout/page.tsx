"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Check, Lock, ArrowLeft, Tag, X, ChevronDown, Gift } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PLANS, formatPrice, type PlanId } from "@/lib/stripe-config";
import { CREATOR_PROMO_STORAGE_KEY } from "@/lib/creator-promos";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm({
  plan,
  finalPrice,
  isSubscription = false,
}: {
  plan: typeof PLANS[PlanId];
  finalPrice: number;
  isSubscription?: boolean;
}) {
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
    if (submitError) { setError(submitError.message || "An error occurred"); setProcessing(false); return; }
    const returnUrl = isSubscription
      ? `${window.location.origin}/payment/success?type=subscription`
      : `${window.location.origin}/payment/success`;
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });
    if (confirmError) { setError(confirmError.message || "Payment failed"); setProcessing(false); }
  };

  const buttonLabel = isSubscription
    ? `Start Monthly — ${formatPrice(finalPrice)}/mo`
    : `Get Lifetime Access — ${formatPrice(finalPrice)}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}
      <Button type="submit" variant="primary" size="lg" disabled={!stripe || processing} loading={processing} className="w-full justify-center">
        <Lock className="w-4 h-4" />
        {buttonLabel}
      </Button>
      <p className="text-xs text-text-muted text-center">Secure payment powered by Stripe · Your information is encrypted</p>
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

// ── Types ─────────────────────────────────────────────────────────────────────

interface AppliedPromo {
  code: string;
  label: string;
  promoDiscountAmount: number; // vs. current base price
  finalPrice: number;
}

interface PricingState {
  earlyAccessActive: boolean;
  serverBasePrice: number;   // 9900 or 14900 (server-decided)
  earlyAccessDiscount: number; // 5000 or 0
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");
  const isMonthly = planParam === "monthly";
  const planId: PlanId = "complete"; // for the lifetime plan display
  const plan = PLANS[planId];

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLifetimeAlready, setHasLifetimeAlready] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Pricing driven entirely by server response (lifetime only)
  const [pricing, setPricing] = useState<PricingState>({
    earlyAccessActive: false,
    serverBasePrice: plan.price,
    earlyAccessDiscount: 0,
  });

  const [freeAccess, setFreeAccess] = useState(false);
  const [freeClaimLoading, setFreeClaimLoading] = useState(false);
  const [freeClaimError, setFreeClaimError] = useState<string | null>(null);

  // Promo code state (lifetime only)
  const [showPromo, setShowPromo] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);

  const displayPrice = isMonthly ? 900 : (appliedPromo ? appliedPromo.finalPrice : pricing.serverBasePrice);

  // ── Intent creation ────────────────────────────────────────────────────────

  const createSubscriptionIntent = async () => {
    setLoading(true);
    setError(null);
    setClientSecret(null);
    try {
      const res = await fetch("/api/stripe/create-subscription-intent", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) { router.push("/signup-checkout?plan=monthly"); return; }
        if (res.status === 403 && data.requiresVerification) { setRequiresVerification(true); setError(data.error); return; }
        if (res.status === 409 && data.hasLifetime) { setHasLifetimeAlready(true); setLoading(false); return; }
        throw new Error(data.error || "Failed to create subscription");
      }
      setClientSecret(data.clientSecret);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const createPaymentIntent = async (promoCode?: string) => {
    setLoading(true);
    setError(null);
    setClientSecret(null);
    try {
      const res = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, promoCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) { router.push(`/signup-checkout?plan=${planId}`); return; }
        if (res.status === 403 && data.requiresVerification) { setRequiresVerification(true); setError(data.error); return; }
        throw new Error(data.error || "Failed to create payment intent");
      }
      setPricing({
        earlyAccessActive: data.earlyAccessActive,
        serverBasePrice: data.baseAmount,
        earlyAccessDiscount: data.earlyAccessDiscount,
      });
      if (data.freeAccess) {
        setFreeAccess(true);
      } else {
        setClientSecret(data.clientSecret);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isMonthly) {
      createSubscriptionIntent();
      return;
    }

    // Auto-apply a stored creator promo for lifetime checkout.
    // Monthly checkout is intentionally excluded — it has no promo support.
    const storedPromo =
      typeof window !== "undefined"
        ? localStorage.getItem(CREATOR_PROMO_STORAGE_KEY)
        : null;

    if (storedPromo) {
      fetch(`/api/stripe/validate-promo?code=${encodeURIComponent(storedPromo)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.valid) {
            setAppliedPromo({
              code: data.code,
              label: data.label,
              promoDiscountAmount: data.promoDiscountAmount,
              finalPrice: data.finalPrice,
            });
            setPromoInput(data.code);
            return createPaymentIntent(data.code);
          }
          // Stored code no longer valid — clear it and proceed normally
          localStorage.removeItem(CREATOR_PROMO_STORAGE_KEY);
          return createPaymentIntent();
        })
        .catch(() => createPaymentIntent());
    } else {
      createPaymentIntent();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMonthly]);

  // ── Promo ──────────────────────────────────────────────────────────────────

  const handleApplyPromo = async () => {
    const code = promoInput.trim();
    if (!code) return;
    setPromoLoading(true);
    setPromoError(null);
    try {
      const res = await fetch(`/api/stripe/validate-promo?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!res.ok || !data.valid) { setPromoError(data.error || "Invalid promo code"); return; }
      setAppliedPromo({ code: data.code, label: data.label, promoDiscountAmount: data.promoDiscountAmount, finalPrice: data.finalPrice });
      setPromoError(null);
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
    await createPaymentIntent();
  };

  const handleClaimFreeAccess = async () => {
    if (!appliedPromo) return;
    setFreeClaimLoading(true);
    setFreeClaimError(null);
    try {
      const res = await fetch("/api/stripe/claim-free-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoCode: appliedPromo.code }),
      });
      const data = await res.json();
      if (!res.ok) { setFreeClaimError(data.error || "Something went wrong"); return; }
      router.push("/payment/success?free=1");
    } catch {
      setFreeClaimError("Something went wrong. Please try again.");
    } finally {
      setFreeClaimLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      const data = await res.json();
      if (res.ok) setResendSuccess(true);
      else alert(data.error || "Failed to resend verification email");
    } catch { alert("Something went wrong. Please try again."); }
    finally { setResendLoading(false); }
  };

  if (!plan) { router.push("/"); return null; }

  // ── Order summary helpers ──────────────────────────────────────────────────

  const { serverBasePrice } = pricing;

  return (
    <div className="min-h-screen bg-ink text-text">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/pricing" className="inline-flex items-center gap-2 text-text-secondary hover:text-text transition-colors text-sm mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to pricing
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            {isMonthly ? "Start Monthly Access" : "Complete Your Purchase"}
          </h1>
          <p className="text-text-secondary">
            {isMonthly
              ? "Full access to Complete Seerah · $9/month · Cancel anytime"
              : `You're one step away from accessing the ${plan.name}`}
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* ── Order Summary ──────────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="bg-surface border border-border rounded-2xl p-6 sticky top-6">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

              {/* Features */}
              <div className="mb-6">
                <h3 className="font-medium text-text mb-2">
                  {isMonthly ? "Monthly Access" : plan.name}
                </h3>
                <p className="text-sm text-text-secondary mb-3">
                  {isMonthly ? "Active while subscribed · Cancel anytime" : "One-time payment · Lifetime access"}
                </p>
                <ul className="space-y-2">
                  {(isMonthly ? PLANS.monthly.features : plan.features).slice(0, 4).map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                      <Check className="w-4 h-4 text-gold flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pricing — lifetime only */}
              {!isMonthly && (
                <div className="pt-4 border-t border-border">
                  {/* Promo code input */}
                  <div className="mb-3">
                    {appliedPromo ? (
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-green-500/10 border border-green-500/20 mb-3">
                        <div className="flex items-center gap-2 text-green-400 text-sm">
                          <Tag className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="font-medium">{appliedPromo.code}</span>
                          <span className="text-green-400/70 text-xs">{appliedPromo.label}</span>
                        </div>
                        <button onClick={handleRemovePromo} className="text-green-400/60 hover:text-green-400 transition-colors" aria-label="Remove promo code">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        {!showPromo ? (
                          <button onClick={() => setShowPromo(true)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text transition-colors">
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
                              <button onClick={handleApplyPromo} disabled={promoLoading || !promoInput.trim()}
                                className="px-4 py-2 text-sm font-medium rounded-lg bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                                {promoLoading ? "…" : "Apply"}
                              </button>
                            </div>
                            {promoError && <p className="text-xs text-red-400">{promoError}</p>}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Price rows */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-text-secondary text-sm">Lifetime Access</span>
                    <span className="text-sm text-text">{formatPrice(serverBasePrice)} one-time</span>
                  </div>
                  {appliedPromo && (
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-text-secondary text-sm flex items-center gap-1.5">
                        <Tag className="w-3 h-3" />{appliedPromo.code}
                      </span>
                      <span className="text-green-400 text-sm font-medium">−{formatPrice(appliedPromo.promoDiscountAmount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between font-semibold text-lg border-t border-border pt-2 mt-2">
                    <span>Total</span>
                    <span className="text-gold">{formatPrice(displayPrice)}</span>
                  </div>
                </div>
              )}

              {/* Monthly pricing summary */}
              {isMonthly && (
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between font-semibold text-lg">
                    <span>Per month</span>
                    <span className="text-gold">$9</span>
                  </div>
                  <p className="text-xs text-text-muted mt-1">Billed monthly · Cancel anytime</p>
                </div>
              )}

              <div className="mt-4 p-3 rounded-lg bg-gold/5 border border-gold/20">
                <p className="text-xs text-text-secondary">
                  {isMonthly ? (
                    <>✓ Instant access after payment<br />✓ Full access while subscribed<br />✓ Cancel anytime, no questions</>
                  ) : (
                    <>✓ Instant access after payment<br />✓ Lifetime ownership<br />✓ No recurring charges<br />✓ Monthly subscription cancelled automatically if active</>
                  )}
                </p>
              </div>

              {/* Gift toggle — lifetime only */}
              {!isMonthly && (
                <div className="mt-4 pt-4 border-t border-border text-center">
                  <p className="text-xs text-text-muted mb-1">Buying for someone else?</p>
                  <a href="/gift-checkout" className="inline-flex items-center gap-1.5 text-xs text-gold hover:text-gold-light transition-colors font-medium">
                    <Gift className="w-3.5 h-3.5" />
                    Gift Lifetime Access instead →
                  </a>
                </div>
              )}

              {/* Switch plan toggle */}
              <div className="mt-4 pt-4 border-t border-border text-center">
                {isMonthly ? (
                  <Link href="/checkout?plan=complete" className="text-xs text-text-muted hover:text-gold transition-colors">
                    Switch to Lifetime ($99 one-time) →
                  </Link>
                ) : (
                  <Link href="/checkout?plan=monthly" className="text-xs text-text-muted hover:text-gold transition-colors">
                    Switch to Monthly ($9/mo) →
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* ── Payment Form ──────────────────────────────────────────────── */}
          <div className="lg:col-span-3">
            <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8">
              <h2 className="text-lg font-semibold mb-6">Payment Details</h2>

              {loading && (
                <div className="py-12 text-center">
                  <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-text-secondary">Loading payment form…</p>
                </div>
              )}

              {hasLifetimeAlready && !loading && (
                <div className="py-8 text-center space-y-4">
                  <div className="p-5 rounded-xl bg-gold/10 border border-gold/30">
                    <p className="text-2xl mb-3">✓</p>
                    <h3 className="text-lg font-bold text-gold mb-2">You already have lifetime access</h3>
                    <p className="text-text-secondary text-sm">
                      You own Complete Seerah permanently. There&apos;s no need for a monthly subscription.
                    </p>
                  </div>
                  <Link href="/seerah" className="block w-full py-3 px-6 rounded-lg bg-gold text-ink font-semibold text-center hover:bg-gold/90 transition-colors">
                    Go to Course →
                  </Link>
                  <Link href="/my-courses" className="block text-sm text-text-muted hover:text-gold transition-colors">
                    View my courses
                  </Link>
                </div>
              )}

              {requiresVerification && !loading && (
                <div className="py-8">
                  <div className="p-6 rounded-xl bg-gold/10 border border-gold/30 text-center">
                    <div className="w-16 h-16 rounded-full bg-gold/20 border-2 border-gold/40 flex items-center justify-center mx-auto mb-4">
                      <Lock className="w-8 h-8 text-gold" />
                    </div>
                    <h3 className="text-xl font-bold text-text mb-2">Email Verification Required</h3>
                    <p className="text-text-secondary mb-6">Please verify your email address before making a purchase.</p>
                    {resendSuccess ? (
                      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 mb-4">
                        <p className="text-green-400 text-sm">✓ Verification email sent! Check your inbox.</p>
                      </div>
                    ) : (
                      <Button variant="primary" size="lg" onClick={handleResendVerification} loading={resendLoading} className="mx-auto">
                        Resend Verification Email
                      </Button>
                    )}
                    <p className="text-xs text-text-muted mt-4">After verifying, refresh this page to continue</p>
                  </div>
                </div>
              )}

              {error && !loading && !requiresVerification && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
                  {error}
                  <button onClick={() => window.location.reload()} className="block mt-2 text-red-300 underline hover:text-red-200">Try again</button>
                </div>
              )}

              {/* Free access claim (promo code gives $0 total) */}
              {freeAccess && !loading && !requiresVerification && (
                <div className="space-y-6">
                  <div className="p-5 rounded-xl bg-gold/10 border border-gold/30 text-center">
                    <div className="text-3xl mb-3">🎁</div>
                    <h3 className="text-lg font-bold text-text mb-1">Free Access Applied</h3>
                    <p className="text-text-secondary text-sm">Your promo code gives you full access at no charge.</p>
                  </div>
                  {freeClaimError && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{freeClaimError}</div>
                  )}
                  <Button variant="primary" size="lg" onClick={handleClaimFreeAccess} loading={freeClaimLoading} disabled={freeClaimLoading} className="w-full justify-center">
                    <Lock className="w-4 h-4" />
                    Claim Free Access
                  </Button>
                  <p className="text-xs text-text-muted text-center">Your access will be activated immediately.</p>
                </div>
              )}

              {clientSecret && !loading && !requiresVerification && (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: "night",
                      variables: { colorPrimary: "#d4af37", colorBackground: "#1a1a1a", colorText: "#e0e0e0", colorDanger: "#ef4444", fontFamily: "system-ui, sans-serif", borderRadius: "8px" },
                    },
                  }}
                >
                  <CheckoutForm plan={plan} finalPrice={displayPrice} isSubscription={isMonthly} />
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
          <p className="text-sm text-text-secondary">Loading checkout…</p>
        </div>
      </div>
    }>
      <CheckoutPageContent />
    </Suspense>
  );
}
