"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import {
  Check, Lock, Users, User, ArrowLeft, Shield, Star, RefreshCw,
  ArrowUpCircle, Tag, X, ArrowRight, Eye, EyeOff,
} from "lucide-react";
import Link from "next/link";
import { PLANS, formatPrice } from "@/lib/stripe-config";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const LIFETIME_PLAN = PLANS.family;
const MONTHLY_PLAN  = PLANS.familyMonthly;

type BillingCycle = "lifetime" | "monthly";
type AuthMode     = "signup" | "login";

// ── Stripe payment form ───────────────────────────────────────────────────────

function FamilyCheckoutForm({
  cycle,
  isUpgrade,
  finalPrice,
}: {
  cycle: BillingCycle;
  isUpgrade: boolean;
  finalPrice: number;
}) {
  const stripe   = useStripe();
  const elements = useElements();
  const [error, setError]           = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const label = isUpgrade
    ? `Upgrade to Family Lifetime — ${formatPrice(finalPrice)}`
    : cycle === "lifetime"
    ? `Get Family Access — ${formatPrice(finalPrice)}`
    : `Subscribe — ${formatPrice(finalPrice)}/mo`;

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

    const returnUrl = cycle === "lifetime"
      ? `${window.location.origin}/payment/success?type=family`
      : `${window.location.origin}/payment/success?type=family-subscription`;

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed. Please try again.");
      setProcessing(false);
    }
  };

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

// ── Props ─────────────────────────────────────────────────────────────────────

interface FamilyCheckoutClientProps {
  userEmail: string;
  userName: string;
  initialCycle?: BillingCycle;
  isUpgradeFromLifetime?: boolean;
}

// ── Main checkout content ─────────────────────────────────────────────────────

function FamilyCheckoutContent({
  userEmail,
  initialCycle = "lifetime",
  isUpgradeFromLifetime = false,
}: FamilyCheckoutClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cycleParam = searchParams.get("cycle") as BillingCycle | null;

  // Upgraders from Individual Lifetime can only go to Family Lifetime.
  const [cycle, setCycle] = useState<BillingCycle>(
    isUpgradeFromLifetime ? "lifetime" : (cycleParam === "monthly" ? "monthly" : initialCycle)
  );

  // ── Auth state ─────────────────────────────────────────────────────────────
  const [isAuthenticated, setIsAuthenticated] = useState(!!userEmail);
  const [authEmail, setAuthEmail]             = useState(userEmail);
  const [authMode, setAuthMode]               = useState<AuthMode>("signup");
  const [showPassword, setShowPassword]       = useState(false);
  const [authForm, setAuthForm]               = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [authError, setAuthError]             = useState("");
  const [authLoading, setAuthLoading]         = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  // ── Payment state ──────────────────────────────────────────────────────────
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [loading, setLoading]           = useState(false);
  const [hasActiveSub, setHasActiveSub] = useState(false);

  // Pricing
  const [basePrice, setBasePrice]     = useState<number>(
    isUpgradeFromLifetime ? LIFETIME_PLAN.upgradeFromLifetimePrice : LIFETIME_PLAN.price
  );
  const [finalPrice, setFinalPrice]   = useState<number>(basePrice);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Coupon
  const [couponInput, setCouponInput]   = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError]   = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string; label: string; discount: number; finalPrice: number;
  } | null>(null);

  // Free access
  const [freeAccess, setFreeAccess]         = useState(false);
  const [freeClaimLoading, setFreeClaimLoading] = useState(false);
  const [freeClaimError, setFreeClaimError] = useState<string | null>(null);

  const isUpgrade = isUpgradeFromLifetime;

  // ── Create intent ──────────────────────────────────────────────────────────

  const createIntent = async (
    currentCycle: BillingCycle,
    promoCode?: string
  ): Promise<{ discountAmount: number; finalPrice: number } | null> => {
    setLoading(true);
    setClientSecret(null);
    setFreeAccess(false);
    setError(null);

    const endpoint = currentCycle === "lifetime"
      ? "/api/stripe/create-family-payment-intent"
      : "/api/stripe/create-family-subscription-intent";

    try {
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isUpgrade, promoCode }),
      });
      const data = await r.json();

      if (data.error) {
        if (data.hasActiveSubscription) {
          setHasActiveSub(true);
        } else if (r.status === 409 && (data.hasLifetime || data.hasFamily)) {
          window.location.href = "/seerah";
        } else {
          setError(data.error);
        }
        return null;
      }

      const discount: number = data.promoDiscountAmount ?? 0;
      const price: number    = data.finalAmount ?? basePrice;

      if (data.baseAmount) setBasePrice(data.baseAmount);
      setFinalPrice(price);
      setDiscountAmount(discount);

      if (data.freeAccess) {
        setFreeAccess(true);
      } else {
        setClientSecret(data.clientSecret);
      }
      return { discountAmount: discount, finalPrice: price };
    } catch {
      setError("Failed to initialize checkout. Please refresh the page.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch on cycle change or after authentication
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (!isAuthenticated) return;
    if (isFirstMount.current) {
      isFirstMount.current = false;
    }
    createIntent(cycle, appliedCoupon?.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycle, isAuthenticated]);

  // ── Coupon handlers ────────────────────────────────────────────────────────

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const result = await createIntent(cycle, code);
      if (result) {
        setAppliedCoupon({ code: code.toUpperCase(), label: "Promo applied", discount: result.discountAmount, finalPrice: result.finalPrice });
      } else {
        setCouponError("Invalid promo code");
      }
    } catch {
      setCouponError("Could not apply code. Please try again.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
    createIntent(cycle);
  };

  // ── Free access claim ──────────────────────────────────────────────────────

  const handleClaimFreeAccess = async () => {
    const code = appliedCoupon?.code ?? couponInput.trim();
    if (!code) return;
    setFreeClaimLoading(true);
    setFreeClaimError(null);
    try {
      const res = await fetch("/api/stripe/claim-free-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoCode: code, planType: "family" }),
      });
      const data = await res.json();
      if (!res.ok) { setFreeClaimError(data.error || "Something went wrong"); return; }
      router.push("/seerah");
    } catch {
      setFreeClaimError("Something went wrong. Please try again.");
    } finally {
      setFreeClaimLoading(false);
    }
  };

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

  // ── Derived display values ─────────────────────────────────────────────────

  const activeFeatures  = cycle === "lifetime" ? LIFETIME_PLAN.features : MONTHLY_PLAN.features;
  const displayPrice    = appliedCoupon ? appliedCoupon.finalPrice : finalPrice;
  const displayDiscount = appliedCoupon ? appliedCoupon.discount : discountAmount;

  // ── Left column (shared) ───────────────────────────────────────────────────

  const LeftColumn = (
    <div className="lg:w-1/2 bg-zinc-900/50 border-r border-zinc-800 px-6 sm:px-12 py-12 flex flex-col justify-center">
      <Link href="/pricing" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-10">
        <ArrowLeft className="w-4 h-4" />
        Back to pricing
      </Link>

      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/25 text-gold text-xs font-semibold mb-5 w-fit">
        <Users className="w-3.5 h-3.5" />
        Family Access
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
        Complete Seerah<br />
        <span className="text-gold">Family Access</span>
      </h1>
      <p className="text-zinc-400 text-base mb-8 leading-relaxed">
        One household account with up to 5 learner profiles. Each family member gets their own separate progress for all course assets.
      </p>

      {/* Billing cycle toggle — hidden for upgraders */}
      {!isUpgrade && (
        <div className="flex items-center gap-1 bg-zinc-800 rounded-xl p-1 w-fit mb-8">
          <button
            onClick={() => setCycle("lifetime")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              cycle === "lifetime" ? "bg-gold text-black shadow" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Star className="w-3.5 h-3.5 inline mr-1.5" />
            Lifetime — {formatPrice(LIFETIME_PLAN.price)}
          </button>
          <button
            onClick={() => setCycle("monthly")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              cycle === "monthly" ? "bg-gold text-black shadow" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" />
            Monthly — {formatPrice(MONTHLY_PLAN.price)}/mo
          </button>
        </div>
      )}

      {/* Price display */}
      <div className="mb-8">
        {isUpgrade ? (
          <div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-white">{formatPrice(LIFETIME_PLAN.upgradeFromLifetimePrice)}</span>
              <span className="text-zinc-500 text-sm line-through">{formatPrice(LIFETIME_PLAN.price)}</span>
              <span className="text-zinc-500 text-sm">one-time</span>
            </div>
            <p className="text-xs text-gold/80 mt-2 flex items-center gap-1.5">
              <ArrowUpCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  You&apos;ve already paid $49 for Individual Lifetime — you&apos;re only paying the $50 difference.
            </p>
          </div>
        ) : cycle === "lifetime" ? (
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">{formatPrice(LIFETIME_PLAN.price)}</span>
              <span className="text-zinc-500 text-sm">one-time · lifetime access</span>
            </div>
            <p className="text-xs text-zinc-600 mt-1">Pay once, access forever.</p>
          </div>
        ) : (
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">{formatPrice(MONTHLY_PLAN.price)}</span>
              <span className="text-zinc-500 text-sm">/ month · cancel anytime</span>
            </div>
            <p className="text-xs text-zinc-600 mt-1">Full family access while subscribed.</p>
          </div>
        )}
      </div>

      {/* Feature list */}
      <ul className="space-y-3">
        {activeFeatures.map((f) => (
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
          { Icon: Shield,    text: "7-day refund guarantee" },
          { Icon: Lock,      text: "Secure payment" },
          { Icon: cycle === "lifetime" ? Star : RefreshCw, text: cycle === "lifetime" ? "Lifetime access" : "Cancel anytime" },
        ].map(({ Icon, text }) => (
          <div key={text} className="flex items-center gap-2 text-xs text-zinc-500">
            <Icon className="w-4 h-4 text-zinc-600" />
            {text}
          </div>
        ))}
      </div>
    </div>
  );

  // ── Order summary card (shared) ────────────────────────────────────────────

  const OrderSummary = (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-white">
            {isUpgrade ? "Family Lifetime (Upgrade)" : cycle === "lifetime" ? LIFETIME_PLAN.name : MONTHLY_PLAN.name}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">
            Up to 5 learner profiles · {isUpgrade || cycle === "lifetime" ? "Lifetime access" : "Cancel anytime"}
          </p>
        </div>
        <div className="text-right ml-4">
          {isUpgrade ? (
            <>
              <p className="text-sm font-bold text-white">{formatPrice(LIFETIME_PLAN.upgradeFromLifetimePrice)}</p>
              <p className="text-xs text-zinc-600 line-through">{formatPrice(LIFETIME_PLAN.price)}</p>
            </>
          ) : (
            <p className="text-sm font-bold text-white">
              {cycle === "lifetime" ? formatPrice(LIFETIME_PLAN.price) : `${formatPrice(MONTHLY_PLAN.price)}/mo`}
            </p>
          )}
        </div>
      </div>
      {displayDiscount > 0 && (
        <div className="flex items-center justify-between text-sm pt-1 border-t border-zinc-800">
          <span className="text-green-400 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" />
            {appliedCoupon?.code ?? "Promo"} discount
          </span>
          <span className="text-green-400 font-medium">−{formatPrice(displayDiscount)}</span>
        </div>
      )}
      {cycle === "lifetime" && (
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
          <span className="text-sm font-semibold text-white">Total</span>
          <span className="text-lg font-bold text-gold">{isAuthenticated ? formatPrice(displayPrice) : formatPrice(isUpgrade ? LIFETIME_PLAN.upgradeFromLifetimePrice : LIFETIME_PLAN.price)}</span>
        </div>
      )}
      {cycle === "monthly" && (
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
          <span className="text-sm font-semibold text-white">Due today</span>
          <span className="text-lg font-bold text-gold">{formatPrice(MONTHLY_PLAN.price)}</span>
        </div>
      )}
    </div>
  );

  // ── Guest: email verification needed ──────────────────────────────────────

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

  // ── Guest: inline auth form ────────────────────────────────────────────────

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col lg:flex-row">
        {LeftColumn}
        <div className="lg:w-1/2 px-6 sm:px-12 py-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <h2 className="text-xl font-bold text-white mb-6">Complete your order</h2>
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
                  <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-500 hover:text-zinc-300">
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
                  <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-500 hover:text-zinc-300">
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

            {/* Nudge to individual checkout */}
            <div className="mt-6 pt-5 border-t border-zinc-800 text-center">
              <p className="text-xs text-zinc-600 mb-1">Looking for individual access instead?</p>
              <Link href="/checkout" className="text-xs text-gold/70 hover:text-gold transition-colors font-medium flex items-center justify-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Individual Lifetime — {formatPrice(PLANS.complete.price)} →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Authenticated: order summary + payment ─────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col lg:flex-row">
      {LeftColumn}
      <div className="lg:w-1/2 px-6 sm:px-12 py-12 flex flex-col justify-center">
        <div className="max-w-md w-full mx-auto">
          <h2 className="text-xl font-bold text-white mb-1">Complete your order</h2>
          <p className="text-sm text-zinc-500 mb-7">
            Purchasing as <span className="text-zinc-300">{authEmail}</span>
          </p>

          {OrderSummary}

          {/* Coupon input — lifetime only */}
          {cycle === "lifetime" && (
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
          )}

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            </div>
          )}

          {hasActiveSub && !loading && (
            <div className="p-5 rounded-xl bg-gold/10 border border-gold/25 text-center space-y-4">
              <p className="text-sm font-semibold text-white">You already have an active monthly subscription.</p>
              <p className="text-xs text-zinc-400">You cannot start a second subscription while one is active.</p>
              <a href="/billing" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-sm transition-colors">
                Manage your subscription
              </a>
            </div>
          )}

          {error && !loading && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
              {error}
            </div>
          )}

          {freeAccess && !loading && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-gold/10 border border-gold/25 text-center">
                <div className="text-3xl mb-3">🎁</div>
                <h3 className="text-lg font-bold text-white mb-1">Free Access Applied</h3>
                <p className="text-zinc-400 text-sm">Your promo code gives you full family access at no charge.</p>
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
                {freeClaimLoading ? "Activating…" : "Claim Free Family Access"}
              </button>
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
              <FamilyCheckoutForm cycle={cycle} isUpgrade={isUpgrade} finalPrice={displayPrice} />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

export default function FamilyCheckoutClient(props: FamilyCheckoutClientProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
      }
    >
      <FamilyCheckoutContent {...props} />
    </Suspense>
  );
}
