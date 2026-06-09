"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Lock, Mail, Eye, EyeOff, ArrowRight, Shield, Clock } from "lucide-react";
import { formatPrice } from "@/lib/stripe-config";

export interface UnifiedPlanInfo {
  planKey: string;        // API key sent to create-checkout-session
  name: string;
  subtitle: string;
  price: number;          // in cents
  billingLabel: string;   // e.g. "one-time" | "/month after trial" | "/month"
  trialFee?: number;      // cents, e.g. 100 for $1
  trialDays?: number;
  features: readonly string[];
  badge?: string;
  isFamily?: boolean;
}

interface Props {
  plan: UnifiedPlanInfo;
  userEmail: string | null;  // null = not logged in
  userVerified: boolean;
}

export default function UnifiedCheckoutClient({ plan, userEmail, userVerified }: Props) {
  const isLoggedIn = !!userEmail;

  // auth form state
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [signedInEmail, setSignedInEmail] = useState<string | null>(userEmail);
  const [needsVerification, setNeedsVerification] = useState(false);

  // checkout state
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  // ── Signup ───────────────────────────────────────────────────────────────────

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");

    if (password !== confirmPassword) {
      setAuthError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setAuthError("Password must be at least 8 characters");
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/signup-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || "Failed to create account. Please try again.");
        return;
      }

      // Account created and session cookie set. User is now "logged in".
      // If production, email is unverified but we still allow checkout.
      setSignedInEmail(email);
    } catch {
      setAuthError("Something went wrong. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  // ── Login ────────────────────────────────────────────────────────────────────

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || "Login failed. Please try again.");
        return;
      }

      setSignedInEmail(email);
    } catch {
      setAuthError("Something went wrong. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  // ── Stripe Checkout redirect ─────────────────────────────────────────────────

  async function handleCheckout() {
    setCheckoutLoading(true);
    setCheckoutError("");
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: plan.planKey }),
      });
      const data = await res.json();

      if (!res.ok) {
        setCheckoutError(data.error || "Failed to start checkout. Please try again.");
        setCheckoutLoading(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutError("No redirect URL received. Please try again.");
        setCheckoutLoading(false);
      }
    } catch {
      setCheckoutError("Connection error. Please check your internet and try again.");
      setCheckoutLoading(false);
    }
  }

  // ── Plan summary sidebar ──────────────────────────────────────────────────────

  const planSummary = (
    <div className="space-y-5">
      <div>
        {plan.badge && (
          <span className="inline-block mb-2 px-2.5 py-0.5 text-xs font-bold rounded-full bg-gold/10 text-gold border border-gold/20 uppercase tracking-wide">
            {plan.badge}
          </span>
        )}
        <h2 className="text-xl font-bold text-text">{plan.name}</h2>
        <p className="text-sm text-text-secondary mt-0.5">{plan.subtitle}</p>
      </div>

      <div className="bg-surface border border-border rounded-xl p-4">
        {plan.trialFee != null && plan.trialDays != null ? (
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-gold">{formatPrice(plan.trialFee)}</span>
              <span className="text-text-secondary text-sm">today</span>
            </div>
            <p className="text-xs text-text-muted mt-1">
              then {formatPrice(plan.price)}/month after {plan.trialDays}-day trial · Cancel anytime
            </p>
          </div>
        ) : (
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-gold">{formatPrice(plan.price)}</span>
            <span className="text-text-secondary text-sm">{plan.billingLabel}</span>
          </div>
        )}
      </div>

      <ul className="space-y-2">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
            <Check className="w-4 h-4 text-gold shrink-0 mt-0.5" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2 text-xs text-text-muted">
        <Shield className="w-3.5 h-3.5 text-gold/60" />
        <span>Secure payment · 7-day money-back guarantee</span>
      </div>
    </div>
  );

  // ── Verification wall (paid but unverified — resend flow) ─────────────────────

  if (needsVerification) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-gold" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-text">Check your inbox</h1>
            <p className="text-text-secondary">
              We sent a verification link to{" "}
              <span className="font-semibold text-gold">{signedInEmail}</span>.
              Verify your email then come back to complete your purchase.
            </p>
          </div>
          <button
            onClick={() => setNeedsVerification(false)}
            className="text-sm text-gold hover:text-gold/80 underline"
          >
            ← Back to checkout
          </button>
        </div>
      </div>
    );
  }

  // ── Main layout ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-10 sm:py-16">

        {/* Back link */}
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text transition-colors mb-8"
        >
          ← Back to pricing
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">

          {/* Left: auth form or "logged in" state */}
          <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8">

            {signedInEmail ? (
              /* ── Logged-in: show account + checkout button ─────────────────── */
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-text">Complete your purchase</h1>
                  <p className="text-sm text-text-secondary mt-1">
                    You&apos;re signed in as{" "}
                    <span className="font-semibold text-gold">{signedInEmail}</span>
                  </p>
                  {!userVerified && !isLoggedIn && (
                    <p className="text-xs text-amber-400 mt-2 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Email not yet verified — you can verify after purchase.
                    </p>
                  )}
                </div>

                {checkoutError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {checkoutError}
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-gold hover:bg-gold-light disabled:opacity-60 text-ink font-bold text-base transition-colors shadow-lg shadow-gold/20"
                >
                  <Lock className="w-4 h-4" />
                  {checkoutLoading ? "Redirecting to Stripe…" : "Continue to Secure Checkout"}
                  {!checkoutLoading && <ArrowRight className="w-4 h-4" />}
                </button>

                <p className="text-xs text-text-muted text-center">
                  You&apos;ll be redirected to Stripe&apos;s secure payment page.
                </p>

                <div className="border-t border-border pt-4">
                  <p className="text-xs text-text-muted text-center">
                    Not you?{" "}
                    <button
                      onClick={async () => {
                        await fetch("/api/auth/signout", { method: "POST" });
                        window.location.reload();
                      }}
                      className="text-gold hover:text-gold/80 underline"
                    >
                      Sign out
                    </button>
                  </p>
                </div>
              </div>
            ) : (
              /* ── Not logged in: show signup / login form ───────────────────── */
              <div className="space-y-5">
                <div>
                  <h1 className="text-2xl font-bold text-text">
                    {authMode === "signup" ? "Create your account" : "Sign in to continue"}
                  </h1>
                  <p className="text-sm text-text-secondary mt-1">
                    {authMode === "signup"
                      ? "Create a free account then complete your purchase."
                      : "Sign in to your existing account."}
                  </p>
                </div>

                {/* Tab toggle */}
                <div className="flex rounded-lg border border-border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => { setAuthMode("signup"); setAuthError(""); }}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                      authMode === "signup"
                        ? "bg-gold text-ink"
                        : "text-text-secondary hover:text-text hover:bg-surface-hover"
                    }`}
                  >
                    New account
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode("login"); setAuthError(""); }}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                      authMode === "login"
                        ? "bg-gold text-ink"
                        : "text-text-secondary hover:text-text hover:bg-surface-hover"
                    }`}
                  >
                    Sign in
                  </button>
                </div>

                <form
                  onSubmit={authMode === "signup" ? handleSignup : handleLogin}
                  className="space-y-4"
                >
                  {authMode === "signup" && (
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">
                        Full name
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border text-text placeholder:text-text-muted focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-colors"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                      Email address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border text-text placeholder:text-text-muted focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={authMode === "signup" ? "At least 8 characters" : "Your password"}
                        className="w-full px-4 py-3 pr-12 rounded-xl bg-background border border-border text-text placeholder:text-text-muted focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors p-1"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {authMode === "signup" && (
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">
                        Confirm password
                      </label>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat your password"
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border text-text placeholder:text-text-muted focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-colors"
                      />
                    </div>
                  )}

                  {authError && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                      {authError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gold hover:bg-gold-light disabled:opacity-60 text-ink font-bold text-sm transition-colors"
                  >
                    {authLoading
                      ? "Please wait…"
                      : authMode === "signup"
                        ? "Create Account & Continue"
                        : "Sign In & Continue"}
                    {!authLoading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>

                {authMode === "login" && (
                  <p className="text-xs text-center text-text-muted">
                    <Link href="/forgot-password" className="text-gold hover:text-gold/80 underline">
                      Forgot password?
                    </Link>
                  </p>
                )}

                <p className="text-xs text-text-muted text-center leading-relaxed">
                  By continuing you agree to our{" "}
                  <a href="/terms" className="underline hover:text-text-secondary">Terms</a>,{" "}
                  <a href="/privacy" className="underline hover:text-text-secondary">Privacy Policy</a>, and{" "}
                  <a href="/refund" className="underline hover:text-text-secondary">Refund Policy</a>.
                </p>
              </div>
            )}
          </div>

          {/* Right: plan summary */}
          <div className="lg:sticky lg:top-8">
            {planSummary}
          </div>

        </div>
      </div>
    </div>
  );
}
