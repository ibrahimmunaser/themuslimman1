"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  Check,
  Lock,
  Users,
  User,
  ArrowLeft,
  Shield,
  Star,
  Tag,
  X,
  Gift,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { PLANS, formatPrice } from "@/lib/stripe-config";
import { clearCreatorPromo, getCreatorPromo } from "@/lib/creator-promos";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type PlanChoice = "complete" | "family";
type AuthMode = "signup" | "login";

// ── Stripe payment form ───────────────────────────────────────────────────────

function CheckoutForm({
  planChoice,
  finalPrice,
}: {
  planChoice: PlanChoice;
  finalPrice: number;
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
    if (submitError) {
      setError(submitError.message ?? "An error occurred");
      setProcessing(false);
      return;
    }

    const returnUrl =
      planChoice === "family"
        ? `${window.location.origin}/payment/success?type=family`
        : `${window.location.origin}/payment/success`;

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed. Please try again.");
      setProcessing(false);
    }
  };

  const label =
    planChoice === "family"
      ? `Get Family Access — ${formatPrice(finalPrice)}`
      : `Get Lifetime Access — ${formatPrice(finalPrice)}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement options={{ wallets: { link: "never" } }} />
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gold hover:bg-gold-light disabled:opacity-60 text-ink font-bold text-base transition-colors shadow-lg shadow-gold/20"
      >
        <Lock className="w-4 h-4" />
        {processing ? "Processing…" : label}
      </button>
      <p className="text-xs text-zinc-500 text-center">
        Secure payment powered by Stripe · Your information is encrypted
      </p>
      <p className="text-xs text-zinc-600 text-center leading-relaxed">
        By purchasing you agree to our{" "}
        <a href="/terms" className="underline hover:text-zinc-400 transition-colors">Terms of Service</a>
        {", "}
        <a href="/privacy" className="underline hover:text-zinc-400 transition-colors">Privacy Policy</a>
        {", and "}
        <a href="/refund" className="underline hover:text-zinc-400 transition-colors">Refund Policy</a>.
      </p>
    </form>
  );
}

// ── Applied coupon type ───────────────────────────────────────────────────────

interface AppliedCoupon {
  code: string;
  label: string;
  discount: number;
  finalPrice: number;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface CheckoutPageClientProps {
  userEmail?: string;
  initialPlan?: PlanChoice;
  initialClientSecret?: string | null;
  initialBasePrice?: number;
  initialFinalPrice?: number;
  initialDiscountAmount?: number;
  initialAppliedPromo?: string | null;
  initialAppliedPromoLabel?: string | null;
  initialFreeAccess?: boolean;
}

// ── Main checkout content ─────────────────────────────────────────────────────

function CheckoutPageContent({
  userEmail = "",
  initialPlan = "complete",
  initialClientSecret = null,
  initialBasePrice: serverBasePrice,
  initialFinalPrice: serverFinalPrice,
  initialDiscountAmount: serverDiscount = 0,
  initialAppliedPromo = null,
  initialAppliedPromoLabel = null,
  initialFreeAccess = false,
}: CheckoutPageClientProps) {
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan") as PlanChoice | null;
  const promoParam = searchParams.get("promo")?.toUpperCase() ?? null;

  const [planChoice, setPlanChoice] = useState<PlanChoice>(
    planParam === "family" ? "family" : initialPlan
  );

  const defaultBase = planChoice === "family" ? PLANS.family.price : PLANS.complete.price;

  // ── Auth state ─────────────────────────────────────────────────────────────
  const [isAuthenticated, setIsAuthenticated] = useState(!!userEmail);
  const [authEmail, setAuthEmail] = useState(userEmail);
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [showPassword, setShowPassword] = useState(false);
  const [authForm, setAuthForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  // Promo validated for the guest view (URL ?promo= param, before auth)
  const [guestPromo, setGuestPromo] = useState<{ code: string; label: string; discount: number } | null>(null);

  // ── Payment state ──────────────────────────────────────────────────────────
  const [clientSecret, setClientSecret] = useState<string | null>(initialClientSecret);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [basePrice, setBasePrice] = useState<number>(serverBasePrice ?? defaultBase);
  const [finalPrice, setFinalPrice] = useState<number>(serverFinalPrice ?? defaultBase);
  const [discountAmount, setDiscountAmount] = useState(serverDiscount);

  const [couponInput, setCouponInput] = useState(initialAppliedPromo ?? promoParam ?? "");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(
    initialAppliedPromo && initialAppliedPromoLabel && serverFinalPrice != null
      ? { code: initialAppliedPromo, label: initialAppliedPromoLabel, discount: serverDiscount, finalPrice: serverFinalPrice }
      : null
  );

  const [freeAccess, setFreeAccess] = useState(initialFreeAccess);
  const [freeClaimLoading, setFreeClaimLoading] = useState(false);
  const [freeClaimError, setFreeClaimError] = useState<string | null>(null);

  // ── Create payment intent ──────────────────────────────────────────────────

  const createIntent = async (
    plan: PlanChoice,
    promoCode?: string
  ): Promise<{ discountAmount: number; finalPrice: number } | null> => {
    setLoading(true);
    setClientSecret(null);
    setFreeAccess(false);
    setError(null);

    const endpoint =
      plan === "family"
        ? "/api/stripe/create-family-payment-intent"
        : "/api/stripe/create-payment-intent";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: "complete", promoCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 && (data.hasLifetime || data.hasFamily)) {
          window.location.href = "/my-courses";
          return null;
        }
        throw new Error(data.error || "Failed to initialize checkout");
      }

      const discount: number = data.promoDiscountAmount ?? 0;
      const price: number = data.finalAmount;

      setBasePrice(data.baseAmount);
      setFinalPrice(price);
      setDiscountAmount(discount);

      if (data.freeAccess) {
        setFreeAccess(true);
      } else {
        setClientSecret(data.clientSecret);
      }
      return { discountAmount: discount, finalPrice: price };
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ── Validate URL promo for guest order summary preview ────────────────────

  useEffect(() => {
    if (isAuthenticated || !promoParam) return;
    fetch(`/api/stripe/validate-promo?code=${encodeURIComponent(promoParam)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          setGuestPromo({ code: data.code, label: data.label, discount: data.promoDiscountAmount });
          setCouponInput(data.code);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── On mount / plan change: create intent (if authenticated) ───────────────

  const isFirstMount = useRef(true);

  useEffect(() => {
    if (!isAuthenticated) return; // guests see the auth form, not a spinner

    const autoApply = (code: string, onInvalid?: () => void) => {
      fetch(`/api/stripe/validate-promo?code=${encodeURIComponent(code)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.valid) {
            setAppliedCoupon({ code: data.code, label: data.label, discount: data.promoDiscountAmount, finalPrice: data.finalPrice });
            setCouponInput(data.code);
            return createIntent(planChoice, data.code);
          }
          onInvalid?.();
          return createIntent(planChoice, undefined);
        })
        .catch(() => createIntent(planChoice, undefined));
    };

    if (isFirstMount.current) {
      isFirstMount.current = false;
      if (initialClientSecret || initialFreeAccess) return; // already have a secret from server
    }

    if (planChoice === "complete" && !appliedCoupon) {
      if (promoParam) { autoApply(promoParam); return; }
      const stored = getCreatorPromo();
      if (stored) { autoApply(stored, clearCreatorPromo); return; }
    }
    createIntent(planChoice, appliedCoupon?.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planChoice, isAuthenticated]);

  // ── Auth handlers ──────────────────────────────────────────────────────────

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (authForm.fullName.trim().length < 2) { setAuthError("Please enter your full name"); return; }
    if (!authForm.email.includes("@")) { setAuthError("Please enter a valid email address"); return; }
    if (authForm.password.length < 8) { setAuthError("Password must be at least 8 characters"); return; }
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

      // Session cookie is always set by the signup route.
      // emailVerified = true in dev (auto-verified), false in prod (needs email click).
      if (data.emailVerified) {
        // Pre-load the guest promo as the applied coupon so createIntent uses it
        if (guestPromo) {
          setAppliedCoupon({ code: guestPromo.code, label: guestPromo.label, discount: guestPromo.discount, finalPrice: currentPlan.price - guestPromo.discount });
          setCouponInput(guestPromo.code);
        }
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
    if (!authForm.password) { setAuthError("Please enter your password"); return; }

    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authForm.email, password: authForm.password }),
      });
      const data = await res.json();
      if (!res.ok) { setAuthError(data.error || "Invalid email or password"); return; }
      if (guestPromo) {
        setAppliedCoupon({ code: guestPromo.code, label: guestPromo.label, discount: guestPromo.discount, finalPrice: currentPlan.price - guestPromo.discount });
        setCouponInput(guestPromo.code);
      }
      setAuthEmail(authForm.email);
      setIsAuthenticated(true);
    } catch {
      setAuthError("An error occurred. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  // ── Coupon handlers ────────────────────────────────────────────────────────

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      if (planChoice === "family") {
        const result = await createIntent("family", code);
        if (result) {
          setAppliedCoupon({ code: code.toUpperCase(), label: "Promo applied", discount: result.discountAmount, finalPrice: result.finalPrice });
        } else {
          setCouponError("Invalid promo code");
        }
        return;
      }
      const res = await fetch(`/api/stripe/validate-promo?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!res.ok || !data.valid) { setCouponError(data.error || "Invalid promo code"); return; }
      setAppliedCoupon({ code: data.code, label: data.label, discount: data.promoDiscountAmount, finalPrice: data.finalPrice });
      setCouponError(null);
      await createIntent("complete", data.code);
    } catch {
      setCouponError("Could not validate code. Please try again.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = async () => {
    clearCreatorPromo();
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
    await createIntent(planChoice);
  };

  const handleClaimFreeAccess = async () => {
    const code = appliedCoupon?.code ?? couponInput.trim();
    if (!code) return;
    setFreeClaimLoading(true);
    setFreeClaimError(null);
    try {
      const res = await fetch("/api/stripe/claim-free-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoCode: code, planType: planChoice === "family" ? "family" : "individual" }),
      });
      const data = await res.json();
      if (!res.ok) { setFreeClaimError(data.error || "Something went wrong"); return; }
      window.location.href = "/my-courses";
    } catch {
      setFreeClaimError("Something went wrong. Please try again.");
    } finally {
      setFreeClaimLoading(false);
    }
  };

  // ── Derived display values ─────────────────────────────────────────────────

  const currentPlan = planChoice === "family" ? PLANS.family : PLANS.complete;

  // For guests: use reactive plan price (no createIntent has run yet).
  // For auth'd users: use server-confirmed prices from createIntent.
  const displayBase = !isAuthenticated
    ? currentPlan.price
    : (appliedCoupon ? currentPlan.price : basePrice);
  const displayDiscount = !isAuthenticated
    ? (guestPromo && planChoice === "complete" ? guestPromo.discount : 0)
    : (appliedCoupon ? appliedCoupon.discount : discountAmount);
  const displayPrice = displayBase - displayDiscount;

  // ── Left column (shared) ───────────────────────────────────────────────────

  const LeftColumn = (
    <div className="lg:w-1/2 bg-zinc-900/50 border-r border-zinc-800 px-6 sm:px-12 py-12 flex flex-col justify-center">
      <Link href="/pricing" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-10">
        <ArrowLeft className="w-4 h-4" />
        Back to pricing
      </Link>

      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
        Complete Seerah<br />
        <span className="text-gold">Lifetime Access</span>
      </h1>
      <p className="text-zinc-400 text-base mb-8 leading-relaxed">
        One-time payment. Lifetime access to all 100 parts, every asset, every learner.
      </p>

      {/* Plan selector */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {([
          { id: "complete" as PlanChoice, icon: User, label: "Individual", price: PLANS.complete.price, sub: "1 learner · one-time" },
          { id: "family"   as PlanChoice, icon: Users, label: "Family",     price: PLANS.family.price,   sub: "Up to 5 learners · one-time" },
        ] as const).map(({ id, icon: Icon, label, price, sub }) => (
          <button
            key={id}
            onClick={() => setPlanChoice(id)}
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

      {/* Features */}
      <ul className="space-y-3">
        {currentPlan.features.map((f) => (
          <li key={f} className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-gold/15 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-3 h-3 text-gold" />
            </div>
            <span className="text-sm text-zinc-300">{f}</span>
          </li>
        ))}
      </ul>

      {/* Monthly nudge */}
      <div className="mt-8 p-4 rounded-xl border border-zinc-700/50 bg-zinc-900/40">
        <p className="text-sm text-zinc-400">
          Not ready to commit?{" "}
          <a href="/checkout/monthly" className="text-gold hover:text-gold-light font-medium transition-colors">
            Try Monthly Access from $9/mo →
          </a>
        </p>
      </div>

      {/* Trust badges */}
      <div className="mt-6 pt-6 border-t border-zinc-800 flex flex-wrap gap-4">
        {[
          { Icon: Shield, text: "7-day refund guarantee" },
          { Icon: Lock,   text: "Secure payment" },
          { Icon: Star,   text: "Lifetime access" },
        ].map(({ Icon, text }) => (
          <div key={text} className="flex items-center gap-2 text-xs text-zinc-500">
            <Icon className="w-4 h-4 text-zinc-600" />
            {text}
          </div>
        ))}
      </div>
    </div>
  );

  // ── Order summary card (reused in both guest and auth views) ───────────────

  const promoCodeLabel = !isAuthenticated ? guestPromo?.code : appliedCoupon?.code;

  const OrderSummary = (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-white">{currentPlan.name}</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            {planChoice === "family" ? "Up to 5 learner profiles · " : ""}Lifetime access
          </p>
        </div>
        <p className="text-sm font-bold text-white whitespace-nowrap ml-4">{formatPrice(displayBase)}</p>
      </div>
      {displayDiscount > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-green-400 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" />
            {promoCodeLabel ?? "Promo"} discount
          </span>
          <span className="text-green-400 font-medium">−{formatPrice(displayDiscount)}</span>
        </div>
      )}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
        <span className="text-sm font-semibold text-white">Total</span>
        <span className="text-lg font-bold text-gold">{formatPrice(displayPrice)}</span>
      </div>
    </div>
  );

  // ── Guest right column: inline auth ───────────────────────────────────────

  if (!isAuthenticated) {
    if (needsVerification) {
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

    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col lg:flex-row">
        {LeftColumn}
        <div className="lg:w-1/2 px-6 sm:px-12 py-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <h2 className="text-xl font-bold text-white mb-6">Complete your order</h2>
            {OrderSummary}

            {/* Auth mode tabs */}
            <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 mb-5">
              {(["signup", "login"] as AuthMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => { setAuthMode(mode); setAuthError(""); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    authMode === mode
                      ? "bg-zinc-700 text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {mode === "signup" ? "New customer" : "Sign in"}
                </button>
              ))}
            </div>

            {/* Signup form */}
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

            {/* Login form */}
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
          </div>
        </div>
      </div>
    );
  }

  // ── Authenticated right column: order summary + payment ────────────────────

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col lg:flex-row">
      {LeftColumn}
      <div className="lg:w-1/2 px-6 sm:px-12 py-12 flex flex-col justify-center">
        <div className="max-w-md w-full mx-auto">
          <h2 className="text-xl font-bold text-white mb-1">Complete your order</h2>
          {authEmail && (
            <p className="text-sm text-zinc-500 mb-7">
              Purchasing as <span className="text-zinc-300">{authEmail}</span>
            </p>
          )}
          {!authEmail && <div className="mb-7" />}

          {OrderSummary}

          {/* Coupon input */}
          <div className="mb-6">
            {appliedCoupon ? (
              <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <Tag className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="font-medium">{appliedCoupon.code}</span>
                  <span className="text-green-400/60 text-xs">{appliedCoupon.label}</span>
                </div>
                <button onClick={handleRemoveCoupon} className="text-green-400/60 hover:text-green-400 transition-colors ml-2" aria-label="Remove promo code">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null); }}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                    placeholder="Promo code"
                    className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-gold/50 transition-colors uppercase"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponInput.trim()}
                    className="px-4 py-2.5 text-sm font-medium rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-gold/40 hover:text-gold transition-colors disabled:opacity-40 whitespace-nowrap"
                  >
                    {couponLoading ? "…" : "Apply"}
                  </button>
                </div>
                {couponError && <p className="text-xs text-red-400">{couponError}</p>}
              </div>
            )}
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            </div>
          )}

          {error && !loading && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
              {error}
              <button onClick={() => window.location.reload()} className="block mt-2 text-red-300 underline hover:text-red-200">
                Try again
              </button>
            </div>
          )}

          {freeAccess && !loading && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-gold/10 border border-gold/25 text-center">
                <div className="text-3xl mb-3">🎁</div>
                <h3 className="text-lg font-bold text-white mb-1">Free Access Applied</h3>
                <p className="text-zinc-400 text-sm">
                  Your promo code gives you full {planChoice === "family" ? "family " : ""}access at no charge.
                </p>
              </div>
              {freeClaimError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{freeClaimError}</div>
              )}
              <button
                onClick={handleClaimFreeAccess}
                disabled={freeClaimLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gold hover:bg-gold-light disabled:opacity-60 text-ink font-bold text-base transition-colors shadow-lg shadow-gold/20"
              >
                <Lock className="w-4 h-4" />
                {freeClaimLoading ? "Activating…" : "Claim Free Access"}
              </button>
              <p className="text-xs text-zinc-500 text-center">Your access will be activated immediately.</p>
            </div>
          )}

          {clientSecret && !loading && (
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
              <CheckoutForm planChoice={planChoice} finalPrice={displayPrice} />
            </Elements>
          )}

          {!freeAccess && !loading && planChoice === "complete" && (
            <div className="mt-6 pt-5 border-t border-zinc-800 text-center">
              <p className="text-xs text-zinc-600 mb-1">Buying for someone else?</p>
              <a href="/gift-checkout" className="inline-flex items-center gap-1.5 text-xs text-gold/70 hover:text-gold transition-colors font-medium">
                <Gift className="w-3.5 h-3.5" />
                Gift Lifetime Access instead →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

export default function CheckoutClientPage(props: CheckoutPageClientProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
      }
    >
      <CheckoutPageContent {...props} />
    </Suspense>
  );
}

export type { CheckoutPageClientProps };
