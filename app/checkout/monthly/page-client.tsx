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
  ArrowLeft,
  Shield,
  RefreshCw,
  User,
  Users,
  ExternalLink,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { PLANS, formatPrice } from "@/lib/stripe-config";

// Lazily memoized so it reads the env var at first render rather than at module
// evaluation time — avoids crashes when the key isn't yet compiled into the bundle.
let _stripePromise: ReturnType<typeof loadStripe> | null = null;
function getStripePromise() {
  if (!_stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (key) _stripePromise = loadStripe(key);
  }
  return _stripePromise;
}

type PlanChoice = "monthly" | "familyMonthly";
type AuthMode = "signup" | "login";

// -- Stripe payment form -------------------------------------------------------

function MonthlyCheckoutForm({
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
      planChoice === "familyMonthly"
        ? `${window.location.origin}/payment/success?type=family-subscription`
        : `${window.location.origin}/payment/success?type=subscription`;

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
        {processing ? "Processing?" : `Subscribe ? ${formatPrice(finalPrice)}/mo`}
      </button>
      <p className="text-xs text-zinc-500 text-center">
        Secure payment powered by Stripe ? Your information is encrypted
      </p>
      <p className="text-xs text-zinc-600 text-center leading-relaxed">
        By subscribing you agree to our{" "}
        <a href="/terms" className="underline hover:text-zinc-400 transition-colors">Terms of Service</a>
        {", "}
        <a href="/privacy" className="underline hover:text-zinc-400 transition-colors">Privacy Policy</a>
        {", and "}
        <a href="/refund" className="underline hover:text-zinc-400 transition-colors">Refund Policy</a>.
      </p>
    </form>
  );
}

// -- Props ---------------------------------------------------------------------

interface Props {
  userEmail: string;
  userName: string;
}

// -- Main checkout content -----------------------------------------------------

function MonthlyCheckoutContent({ userEmail }: Props) {
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan") as PlanChoice | null;

  const [planChoice, setPlanChoice] = useState<PlanChoice>(
    planParam === "familyMonthly" ? "familyMonthly" : "monthly"
  );

  // -- Auth state -------------------------------------------------------------
  const [isAuthenticated, setIsAuthenticated] = useState(!!userEmail);
  const [authEmail, setAuthEmail] = useState(userEmail);
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [showPassword, setShowPassword] = useState(false);
  const [authForm, setAuthForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  // -- Payment state ----------------------------------------------------------
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasActiveSub, setHasActiveSub] = useState(false);

  const currentPlan = PLANS[planChoice];

  // -- Create subscription intent ---------------------------------------------

  const createIntent = async (plan: PlanChoice) => {
    setLoading(true);
    setClientSecret(null);
    setError(null);
    setHasActiveSub(false);

    const endpoint =
      plan === "familyMonthly"
        ? "/api/stripe/create-family-subscription-intent"
        : "/api/stripe/create-subscription-intent";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 && data.hasLifetime) {
          window.location.href = "/seerah";
          return;
        }
        if (res.status === 409 && data.hasActiveSubscription) {
          setHasActiveSub(true);
          return;
        }
        throw new Error(data.error || "Failed to initialize checkout");
      }

      setClientSecret(data.clientSecret);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // -- On plan change: recreate intent (only when authenticated) -------------

  const isFirstMount = useRef(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (isFirstMount.current) {
      isFirstMount.current = false;
    }
    createIntent(planChoice);
  }, [planChoice, isAuthenticated]);

  // -- Auth handlers ----------------------------------------------------------

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
      setAuthEmail(authForm.email);
      setIsAuthenticated(true);
    } catch {
      setAuthError("An error occurred. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  // -- Left column (shared) ---------------------------------------------------

  const LeftColumn = (
    <div className="lg:w-1/2 bg-zinc-900/50 border-r border-zinc-800 px-6 sm:px-12 py-12 flex flex-col justify-center">
      <Link href="/pricing" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-10">
        <ArrowLeft className="w-4 h-4" />
        Back to pricing
      </Link>

      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
        Complete Seerah<br />
        <span className="text-gold">Monthly Access</span>
      </h1>
      <p className="text-zinc-400 text-base mb-8 leading-relaxed">
        Full Seerah access. Start today. Cancel anytime.
      </p>

      {/* Plan selector */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {([
          { id: "monthly" as PlanChoice,       icon: User,  label: "Individual", price: PLANS.monthly.price,       sub: "1 learner ? per month" },
          { id: "familyMonthly" as PlanChoice,  icon: Users, label: "Family",     price: PLANS.familyMonthly.price, sub: "Up to 5 learners ? per month" },
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

      {/* Upgrade nudge */}
      <div className="mt-8 p-4 rounded-xl border border-gold/20 bg-gold/5">
        <p className="text-sm text-zinc-400">
          Want to own it forever?{" "}
          <Link href="/checkout" className="text-gold hover:text-gold-light font-medium transition-colors">
            Get Lifetime Access ?
          </Link>
        </p>
      </div>

      {/* Trust badges */}
      <div className="mt-8 pt-6 border-t border-zinc-800 flex flex-wrap gap-4">
        {[
          { Icon: Shield,    text: "7-day refund guarantee" },
          { Icon: Lock,      text: "Secure payment" },
          { Icon: RefreshCw, text: "Cancel anytime" },
        ].map(({ Icon, text }) => (
          <div key={text} className="flex items-center gap-2 text-xs text-zinc-500">
            <Icon className="w-4 h-4 text-zinc-600" />
            {text}
          </div>
        ))}
      </div>
    </div>
  );

  // -- Order summary card (shared) --------------------------------------------

  const OrderSummary = (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-white">{currentPlan.name}</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            {planChoice === "familyMonthly" ? "Up to 5 learner profiles ? " : ""}
            billed monthly ? cancel anytime
          </p>
        </div>
        <p className="text-sm font-bold text-white whitespace-nowrap ml-4">
          {formatPrice(currentPlan.price)}/mo
        </p>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
        <span className="text-sm font-semibold text-white">Due today</span>
        <span className="text-lg font-bold text-gold">{formatPrice(currentPlan.price)}</span>
      </div>
    </div>
  );

  // -- Guest: email verification needed --------------------------------------

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
                Click the link to verify, then sign in to complete your subscription.
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

  // -- Guest: inline auth form ------------------------------------------------

  if (!isAuthenticated) {
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

            {authMode === "signup" && (
              <form onSubmit={handleSignup} className="space-y-3">
                <input
                  type="text"
                  placeholder="Full name"
                  value={authForm.fullName}
                  onChange={(e) => setAuthForm((f) => ({ ...f, fullName: e.target.value }))}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-gold/50 transition-colors text-base sm:text-sm"
                />
                <input
                  type="email"
                  placeholder="Email address"
                  value={authForm.email}
                  onChange={(e) => setAuthForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-gold/50 transition-colors text-base sm:text-sm"
                />
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password (min 8 characters)"
                    value={authForm.password}
                    onChange={(e) => setAuthForm((f) => ({ ...f, password: e.target.value }))}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-gold/50 transition-colors text-base sm:text-sm pr-11"
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
                  className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-gold/50 transition-colors text-base sm:text-sm"
                />
                {authError && <p className="text-xs text-red-400 pt-1">{authError}</p>}
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gold hover:bg-gold-light disabled:opacity-60 text-ink font-bold text-sm transition-colors"
                >
                  {authLoading ? "Creating account?" : "Create Account & Continue"}
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
                  className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-gold/50 transition-colors text-base sm:text-sm"
                />
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={authForm.password}
                    onChange={(e) => setAuthForm((f) => ({ ...f, password: e.target.value }))}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-gold/50 transition-colors text-base sm:text-sm pr-11"
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
                  {authLoading ? "Signing in?" : "Sign In & Continue"}
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

  // -- Authenticated: order summary + payment form ----------------------------

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col lg:flex-row">
      {LeftColumn}
      <div className="lg:w-1/2 px-6 sm:px-12 py-12 flex flex-col justify-center">
        <div className="max-w-md w-full mx-auto">
          <h2 className="text-xl font-bold text-white mb-1">Complete your order</h2>
          {authEmail ? (
            <p className="text-sm text-zinc-500 mb-7">
              Subscribing as <span className="text-zinc-300">{authEmail}</span>
            </p>
          ) : (
            <div className="mb-7" />
          )}

          {OrderSummary}

          {hasActiveSub && !loading && (
            <div className="p-5 rounded-xl bg-gold/10 border border-gold/25 text-center space-y-4">
              <p className="text-sm font-semibold text-white">
                You already have an active monthly subscription.
              </p>
              <p className="text-xs text-zinc-400">
                You cannot start a second subscription while one is active.
              </p>
              <a
                href="/billing"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-sm transition-colors"
              >
                Manage your subscription
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            </div>
          )}

          {error && !loading && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
              {error}
              <button
                onClick={() => createIntent(planChoice)}
                className="block mt-2 text-red-300 underline hover:text-red-200"
              >
                Try again
              </button>
            </div>
          )}

          {clientSecret && !loading && (
            <Elements
              key={clientSecret}
              stripe={getStripePromise()}
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
              <MonthlyCheckoutForm planChoice={planChoice} finalPrice={currentPlan.price} />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
}

// -- Export --------------------------------------------------------------------

export default function MonthlyCheckoutClient(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
      }
    >
      <MonthlyCheckoutContent {...props} />
    </Suspense>
  );
}
