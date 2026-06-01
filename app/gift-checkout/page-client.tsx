"use client";

import { useState, useEffect, Suspense } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import {
  Lock, ArrowLeft, ArrowRight, Gift, Check, Mail, User, MessageSquare,
  Tag, X, Users, Shield, Eye, EyeOff,
} from "lucide-react";
import Link from "next/link";
import { PLANS, formatPrice } from "@/lib/stripe-config";
import { getCreatorPromo, clearCreatorPromo, getCreatorPromoConfig } from "@/lib/creator-promos";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type GiftPlanId = "complete" | "family";
type AuthMode   = "signup" | "login";
type Step       = "details" | "payment";

// ── Stripe payment form ───────────────────────────────────────────────────────

function GiftPaymentForm({ finalPrice, recipientEmail }: { finalPrice: number; recipientEmail: string }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [error, setError]           = useState<string | null>(null);
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
      confirmParams: { return_url: `${window.location.origin}/payment/gift-sent` },
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed");
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement options={{ wallets: { link: "never" } }} />
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gold hover:bg-gold-light disabled:opacity-60 text-ink font-bold text-base transition-colors shadow-lg shadow-gold/20"
      >
        <Lock className="w-4 h-4" />
        {processing ? "Processing…" : `Send Gift — ${formatPrice(finalPrice)}`}
      </button>
      <p className="text-xs text-zinc-500 text-center">
        Recipient gets a claim link at <span className="text-gold">{recipientEmail}</span>
      </p>
      <p className="text-xs text-zinc-600 text-center leading-relaxed">
        By purchasing you agree to our{" "}
        <a href="/terms" className="underline hover:text-zinc-400">Terms of Service</a>
        {", "}
        <a href="/privacy" className="underline hover:text-zinc-400">Privacy Policy</a>
        {", and "}
        <a href="/refund" className="underline hover:text-zinc-400">Refund Policy</a>.
      </p>
    </form>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface GiftCheckoutClientProps {
  purchaserEmail: string;
  purchaserName: string;
}

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

// ── Main content ──────────────────────────────────────────────────────────────

function GiftCheckoutContent({ purchaserEmail, purchaserName: _purchaserName }: GiftCheckoutClientProps) {
  // ── Auth state ─────────────────────────────────────────────────────────────
  const [isAuthenticated, setIsAuthenticated] = useState(!!purchaserEmail);
  const [authEmail, setAuthEmail]             = useState(purchaserEmail);
  const [authMode, setAuthMode]               = useState<AuthMode>("signup");
  const [showPassword, setShowPassword]       = useState(false);
  const [authForm, setAuthForm]               = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [authError, setAuthError]             = useState("");
  const [authLoading, setAuthLoading]         = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  // ── Gift state ─────────────────────────────────────────────────────────────
  const [planChoice, setPlanChoice]   = useState<GiftPlanId>("complete");
  const plan = planChoice === "family" ? PLANS.family : PLANS.complete;

  const [step, setStep]               = useState<Step>("details");
  const [details, setDetails]         = useState<GiftDetails>({ recipientEmail: "", recipientName: "", giftMessage: "" });
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const [clientSecret, setClientSecret]         = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading]     = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);

  const [pricing, setPricing] = useState<GiftPricing>({
    baseAmount: plan.price, finalAmount: plan.price, promoCode: null, promoDiscountAmount: 0,
  });

  const [giftPromo, setGiftPromo] = useState<GiftPromoState | null>(null);

  useEffect(() => {
    const stored = getCreatorPromo();
    if (!stored) return;
    const config = getCreatorPromoConfig(stored);
    if (!config) { clearCreatorPromo(); return; }
    const estimatedFinal = plan.price - config.discountAmount;
    setGiftPromo({ code: config.code, displayLabel: config.displayLabel, discountAmount: config.discountAmount, estimatedFinalPrice: Math.max(0, estimatedFinal) });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planChoice]);

  const handleRemoveGiftPromo = () => { clearCreatorPromo(); setGiftPromo(null); };

  const handlePlanChange = (newPlan: GiftPlanId) => {
    if (newPlan === planChoice) return;
    setPlanChoice(newPlan);
    if (step === "payment") { setStep("details"); setClientSecret(null); }
  };

  const displayPrice = step === "payment" ? pricing.finalAmount : giftPromo ? giftPromo.estimatedFinalPrice : plan.price;

  // ── Auth handlers ──────────────────────────────────────────────────────────

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (authForm.fullName.trim().length < 2)  { setAuthError("Please enter your full name"); return; }
    if (!authForm.email.includes("@"))        { setAuthError("Please enter a valid email address"); return; }
    if (authForm.password.length < 8)         { setAuthError("Password must be at least 8 characters"); return; }
    if (authForm.password !== authForm.confirmPassword) { setAuthError("Passwords do not match"); return; }

    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/signup-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: authForm.fullName, email: authForm.email, password: authForm.password }),
      });
      const data = await res.json();
      if (!res.ok) { setAuthError(data.error || "Failed to create account"); return; }
      if (data.emailVerified) {
        setAuthEmail(authForm.email);
        setIsAuthenticated(true);
      } else {
        setNeedsVerification(true);
      }
    } catch {
      setAuthError("An error occurred. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (!authForm.email.includes("@")) { setAuthError("Please enter a valid email address"); return; }
    if (!authForm.password)            { setAuthError("Please enter your password"); return; }

    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authForm.email, password: authForm.password }),
      });
      const data = await res.json();
      if (!res.ok) { setAuthError(data.error || "Invalid email or password"); return; }
      setAuthEmail(authForm.email);
      setIsAuthenticated(true);
    } catch {
      setAuthError("An error occurred. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  // ── Gift details submit ────────────────────────────────────────────────────

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDetailsError(null);

    if (!details.recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.recipientEmail)) {
      setDetailsError("Please enter a valid recipient email address."); return;
    }
    if (details.recipientEmail.toLowerCase() === authEmail.toLowerCase()) {
      setDetailsError("You cannot gift the course to yourself. Use regular checkout instead."); return;
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
        if (res.status === 403 && data.requiresVerification) { setRequiresVerification(true); setDetailsError(data.error); return; }
        setDetailsError(data.error ?? "Failed to initialize payment"); return;
      }
      setPricing({ baseAmount: data.baseAmount, finalAmount: data.finalAmount, promoCode: data.promoCode ?? null, promoDiscountAmount: data.promoDiscountAmount ?? 0 });
      setClientSecret(data.clientSecret);
      setStep("payment");
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPaymentLoading(false);
    }
  };

  // ── Left column ────────────────────────────────────────────────────────────

  const LeftColumn = (
    <div className="lg:w-1/2 bg-zinc-900/50 border-r border-zinc-800 px-6 sm:px-12 py-12 flex flex-col justify-center">
      <Link href="/pricing" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-10">
        <ArrowLeft className="w-4 h-4" />
        Back to pricing
      </Link>

      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/25 text-gold text-xs font-semibold mb-5 w-fit">
        <Gift className="w-3.5 h-3.5" />
        Gift Access
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
        Gift Complete Seerah
      </h1>
      <p className="text-zinc-400 text-base mb-8 leading-relaxed">
        Give someone you love lifetime access to the full 100-part Seerah journey — video, audio, notes, flashcards, quizzes, and more.
      </p>

      {/* Plan selector */}
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Choose gift type</p>
      <div className="grid grid-cols-2 gap-3 mb-8">
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
                ? "border-gold/50 bg-gold/8 ring-1 ring-gold/30"
                : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 flex-shrink-0 ${planChoice === id ? "text-gold" : "text-zinc-500"}`} />
              <span className={`font-semibold text-sm ${planChoice === id ? "text-white" : "text-zinc-400"}`}>{label}</span>
              {planChoice === id && <div className="ml-auto w-2 h-2 rounded-full bg-gold" />}
            </div>
            <span className="text-xl font-bold text-white">{formatPrice(price)}</span>
            <span className="text-xs text-zinc-500 mt-0.5">{sub}</span>
          </button>
        ))}
      </div>

      {/* Features */}
      <ul className="space-y-3">
        {plan.features.slice(0, 5).map((f) => (
          <li key={f} className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-gold/15 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-3 h-3 text-gold" />
            </div>
            <span className="text-sm text-zinc-300">{f}</span>
          </li>
        ))}
      </ul>

      {/* Trust badges */}
      <div className="mt-8 pt-6 border-t border-zinc-800 flex flex-wrap gap-4">
        {[
          { Icon: Shield,  text: "7-day refund guarantee" },
          { Icon: Lock,    text: "Secure payment" },
          { Icon: Gift,    text: "Claim link sent by email" },
        ].map(({ Icon, text }) => (
          <div key={text} className="flex items-center gap-2 text-xs text-zinc-500">
            <Icon className="w-4 h-4 text-zinc-600" />
            {text}
          </div>
        ))}
      </div>
    </div>
  );

  // ── Order summary box ──────────────────────────────────────────────────────

  const OrderSummary = (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-white">{plan.name} Gift</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            {planChoice === "family" ? "Up to 5 learners · lifetime" : "1 learner · lifetime"}
          </p>
        </div>
        <p className="text-sm font-bold text-white ml-4">{formatPrice(plan.price)}</p>
      </div>
      {giftPromo && (
        <div className="flex items-center justify-between text-sm pt-1 border-t border-zinc-800">
          <span className="text-green-400 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" />
            Creator offer
          </span>
          <span className="text-green-400 font-medium">−{formatPrice(giftPromo.discountAmount)}</span>
        </div>
      )}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
        <span className="text-sm font-semibold text-white">Gift Total</span>
        <span className="text-lg font-bold text-gold">{formatPrice(displayPrice)}</span>
      </div>
    </div>
  );

  // ── Email verification needed ──────────────────────────────────────────────

  if (!isAuthenticated && needsVerification) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col lg:flex-row">
        {LeftColumn}
        <div className="lg:w-1/2 px-6 sm:px-12 py-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            {OrderSummary}
            <div className="p-6 rounded-xl bg-gold/10 border border-gold/25 text-center space-y-3">
              <p className="text-lg font-bold text-white">Check your email</p>
              <p className="text-sm text-zinc-400">
                We sent a verification link to <span className="text-gold">{authForm.email}</span>.
                Click the link to verify, then sign in to complete your purchase.
              </p>
              <button
                onClick={() => { setNeedsVerification(false); setAuthMode("login"); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-ink font-semibold text-sm transition-colors"
              >
                Go to Sign In <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Email verification (already purchased account) ─────────────────────────

  if (requiresVerification) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col lg:flex-row">
        {LeftColumn}
        <div className="lg:w-1/2 px-6 sm:px-12 py-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            {OrderSummary}
            <div className="p-6 rounded-xl bg-gold/10 border border-gold/25 text-center space-y-3">
              <Lock className="w-8 h-8 text-gold mx-auto" />
              <p className="text-lg font-bold text-white">Email Verification Required</p>
              <p className="text-sm text-zinc-400">Please verify your email address before purchasing a gift.</p>
              <Link href="/checkout" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-ink font-semibold text-sm transition-colors">
                Back to Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Guest: inline auth form ────────────────────────────────────────────────

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col lg:flex-row">
        {LeftColumn}
        <div className="lg:w-1/2 px-6 sm:px-12 py-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <h2 className="text-xl font-bold text-white mb-6">Complete your gift purchase</h2>
            {OrderSummary}

            {/* Auth tabs */}
            <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 mb-5">
              {(["signup", "login"] as AuthMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => { setAuthMode(mode); setAuthError(""); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    authMode === mode ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {mode === "signup" ? "New customer" : "Sign in"}
                </button>
              ))}
            </div>

            {authMode === "signup" && (
              <form onSubmit={handleSignup} className="space-y-3">
                <input
                  type="text"
                  placeholder="Full name"
                  value={authForm.fullName}
                  onChange={(e) => setAuthForm((f) => ({ ...f, fullName: e.target.value }))}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-gold/50 transition-colors text-sm"
                />
                <input
                  type="email"
                  placeholder="Email address"
                  value={authForm.email}
                  onChange={(e) => setAuthForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-gold/50 transition-colors text-sm"
                />
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password (min 8 characters)"
                    value={authForm.password}
                    onChange={(e) => setAuthForm((f) => ({ ...f, password: e.target.value }))}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-gold/50 transition-colors text-sm pr-11"
                  />
                  <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  value={authForm.confirmPassword}
                  onChange={(e) => setAuthForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-gold/50 transition-colors text-sm"
                />
                {authError && <p className="text-xs text-red-400 pt-1">{authError}</p>}
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gold hover:bg-gold-light disabled:opacity-60 text-ink font-bold text-sm transition-colors"
                >
                  {authLoading ? "Creating account…" : "Create Account & Continue"}
                  {!authLoading && <ArrowRight className="w-4 h-4" />}
                </button>
                <p className="text-xs text-zinc-600 text-center leading-relaxed">
                  By creating an account you agree to our{" "}
                  <a href="/terms" className="underline hover:text-zinc-400">Terms</a>,{" "}
                  <a href="/privacy" className="underline hover:text-zinc-400">Privacy Policy</a>, and{" "}
                  <a href="/refund" className="underline hover:text-zinc-400">Refund Policy</a>.
                </p>
              </form>
            )}

            {authMode === "login" && (
              <form onSubmit={handleLogin} className="space-y-3">
                <input
                  type="email"
                  placeholder="Email address"
                  value={authForm.email}
                  onChange={(e) => setAuthForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-gold/50 transition-colors text-sm"
                />
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={authForm.password}
                    onChange={(e) => setAuthForm((f) => ({ ...f, password: e.target.value }))}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-gold/50 transition-colors text-sm pr-11"
                  />
                  <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {authError && <p className="text-xs text-red-400 pt-1">{authError}</p>}
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gold hover:bg-gold-light disabled:opacity-60 text-ink font-bold text-sm transition-colors"
                >
                  {authLoading ? "Signing in…" : "Sign In & Continue"}
                  {!authLoading && <ArrowRight className="w-4 h-4" />}
                </button>
                <div className="text-center">
                  <a href="/forgot-password" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                    Forgot your password?
                  </a>
                </div>
              </form>
            )}

            <div className="mt-6 pt-5 border-t border-zinc-800 text-center">
              <p className="text-xs text-zinc-600 mb-1">Buying for yourself instead?</p>
              <Link href="/checkout" className="text-xs text-gold/70 hover:text-gold transition-colors font-medium flex items-center justify-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Individual Checkout →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Authenticated: recipient details + payment ─────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col lg:flex-row">
      {LeftColumn}

      <div className="lg:w-1/2 px-6 sm:px-12 py-12 flex flex-col justify-center">
        <div className="max-w-md w-full mx-auto">
          <h2 className="text-xl font-bold text-white mb-1">
            {step === "details" ? "Recipient Details" : "Payment Details"}
          </h2>
          <p className="text-sm text-zinc-500 mb-7">
            Purchasing as <span className="text-zinc-300">{authEmail}</span>
          </p>

          {OrderSummary}

          {/* Creator promo banner */}
          {giftPromo && step === "details" && (
            <div className="mb-5 flex items-start justify-between gap-2 rounded-xl bg-gold/10 border border-gold/20 px-4 py-3">
              <div className="flex items-start gap-2 text-sm min-w-0">
                <Tag className="w-3.5 h-3.5 text-gold mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gold font-medium leading-tight">Creator offer applied</p>
                  <p className="text-zinc-400 text-xs mt-0.5">{giftPromo.displayLabel}</p>
                </div>
              </div>
              <button type="button" onClick={handleRemoveGiftPromo} className="text-zinc-500 hover:text-zinc-300 flex-shrink-0" aria-label="Remove promo">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Step 1: Recipient Details */}
          {step === "details" && (
            <form onSubmit={handleDetailsSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  <Mail className="w-4 h-4 inline mr-1.5 text-gold" />
                  Recipient&apos;s Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={details.recipientEmail}
                  onChange={(e) => setDetails({ ...details, recipientEmail: e.target.value })}
                  placeholder="their@email.com"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-gold/50 transition-colors text-sm"
                />
                <p className="text-xs text-zinc-600 mt-1">
                  We&apos;ll send the claim link here.
                  {planChoice === "family" && " They'll be the account owner and can add up to 4 learner profiles."}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  <User className="w-4 h-4 inline mr-1.5 text-gold" />
                  Recipient&apos;s Name <span className="text-zinc-500 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={details.recipientName}
                  onChange={(e) => setDetails({ ...details, recipientName: e.target.value })}
                  placeholder="e.g. Ibrahim"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-gold/50 transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  <MessageSquare className="w-4 h-4 inline mr-1.5 text-gold" />
                  Personal Message <span className="text-zinc-500 font-normal">(optional)</span>
                </label>
                <textarea
                  value={details.giftMessage}
                  onChange={(e) => setDetails({ ...details, giftMessage: e.target.value })}
                  placeholder="Write a short note to include with the gift…"
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-gold/50 transition-colors text-sm resize-none"
                />
                <p className="text-xs text-zinc-600 mt-1 text-right">{details.giftMessage.length}/500</p>
              </div>

              {detailsError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{detailsError}</div>
              )}

              <button
                type="submit"
                disabled={paymentLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gold hover:bg-gold-light disabled:opacity-60 text-ink font-bold text-base transition-colors shadow-lg shadow-gold/20"
              >
                {paymentLoading ? "Loading…" : "Continue to Payment"}
                {!paymentLoading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}

          {/* Step 2: Payment */}
          {step === "payment" && clientSecret && (
            <>
              <button
                onClick={() => setStep("details")}
                className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-5"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to recipient details
              </button>

              {details.recipientEmail && (
                <div className="mb-5 p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm">
                  <p className="text-zinc-500 text-xs mb-1">Sending to</p>
                  <p className="text-white font-medium">{details.recipientEmail}</p>
                  {details.recipientName && <p className="text-zinc-400 text-xs mt-0.5">{details.recipientName}</p>}
                </div>
              )}

              <Elements
                key={clientSecret}
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: "night",
                    variables: {
                      colorPrimary: "#C8A96E",
                      colorBackground: "#18181b",
                      colorText: "#ffffff",
                      colorDanger: "#ef4444",
                      borderRadius: "12px",
                      fontFamily: "system-ui, sans-serif",
                    },
                  },
                }}
              >
                <GiftPaymentForm finalPrice={displayPrice} recipientEmail={details.recipientEmail} />
              </Elements>
            </>
          )}

          {step === "payment" && paymentLoading && (
            <div className="py-12 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-zinc-800 text-center">
            <p className="text-xs text-zinc-600 mb-1">Buying for yourself instead?</p>
            <Link href="/checkout" className="text-xs text-gold/70 hover:text-gold transition-colors font-medium flex items-center justify-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Individual Checkout →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

export default function GiftCheckoutClient(props: GiftCheckoutClientProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
      }
    >
      <GiftCheckoutContent {...props} />
    </Suspense>
  );
}
