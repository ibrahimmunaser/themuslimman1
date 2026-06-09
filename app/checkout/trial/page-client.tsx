"use client";

import { useState } from "react";
import {
  Check, Lock, ArrowLeft, Shield, Users, User, Eye, EyeOff, ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface Props {
  userEmail: string;
  isFamily: boolean;
}

type AuthMode = "signup" | "login";

export default function TrialCheckoutClientPage({ userEmail, isFamily }: Props) {
  // ── Auth state ───────────────────────────────────────────────────────────────
  const [isAuthenticated, setIsAuthenticated] = useState(!!userEmail);
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [showPass, setShowPass] = useState(false);
  const [authForm, setAuthForm] = useState({
    fullName: "",
    email: userEmail,
    password: "",
    confirmPassword: "",
  });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  // ── Checkout state ───────────────────────────────────────────────────────────
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const planType = isFamily ? "family-trial" : "individual-trial";
  const planTitle = isFamily ? "Start Family Access for $1" : "Start for $1";
  const planSubtitle = isFamily
    ? "7 days of full family access"
    : "7 days of full access";
  const planAfter = isFamily ? "Then $19/month" : "Then $9/month";
  const planFeatures = isFamily
    ? [
        "Access for the entire household",
        "Up to 5 learner profiles",
        "Structured Seerah learning for the family",
        "Cancel anytime",
      ]
    : [
        "Unlock all 100 Seerah lessons",
        "Watch, read, review, and take quizzes",
        "Cancel anytime",
      ];
  const buttonLabel = isFamily
    ? "Start Family Access for $1"
    : "Start 7-Day Access for $1";

  // ── Auth handlers ────────────────────────────────────────────────────────────

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (authForm.fullName.trim().length < 2) {
      setAuthError("Please enter your full name");
      return;
    }
    if (!authForm.email.includes("@")) {
      setAuthError("Please enter a valid email address");
      return;
    }
    if (authForm.password.length < 8) {
      setAuthError("Password must be at least 8 characters");
      return;
    }
    if (authForm.password !== authForm.confirmPassword) {
      setAuthError("Passwords do not match");
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/signup-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: authForm.fullName,
          email: authForm.email,
          password: authForm.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Failed to create account");
        return;
      }
      if (data.emailVerified) {
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
    if (!authForm.email.includes("@")) {
      setAuthError("Please enter a valid email address");
      return;
    }
    if (!authForm.password) {
      setAuthError("Please enter your password");
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authForm.email, password: authForm.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        // If login succeeded but email still unverified, show verification screen
        if (res.status === 403 && data.requiresVerification) {
          setNeedsVerification(true);
          return;
        }
        setAuthError(data.error || "Invalid email or password");
        return;
      }
      setIsAuthenticated(true);
    } catch {
      setAuthError("An error occurred. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  // ── Checkout redirect ────────────────────────────────────────────────────────

  const handleProceedToCheckout = async () => {
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: planType }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Already has access — redirect to course
        if (data.url) {
          window.location.href = data.url;
          return;
        }
        // Email not verified — show verification screen
        if (res.status === 403 && data.requiresVerification) {
          setNeedsVerification(true);
          setCheckoutLoading(false);
          return;
        }
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      setCheckoutError(
        err instanceof Error ? err.message : "An error occurred. Please try again."
      );
      setCheckoutLoading(false);
    }
  };

  // ── Email verification pending ───────────────────────────────────────────────

  if (needsVerification) {
    return (
      <div className="min-h-screen bg-ink text-text flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-gold" />
          </div>
          <h2 className="text-xl font-bold mb-2">Check your email</h2>
          <p className="text-text-secondary text-sm mb-4">
            We sent a verification link to <strong>{authForm.email}</strong>.
            Click it to verify your account, then come back here to complete your purchase.
          </p>
          <button
            onClick={() => { setNeedsVerification(false); setAuthMode("login"); }}
            className="text-gold text-sm hover:text-gold-light transition-colors"
          >
            Already verified? Sign in →
          </button>
        </div>
      </div>
    );
  }

  // ── Page layout ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-ink text-text flex flex-col lg:flex-row">

      {/* Left column — plan details */}
      <div className="lg:w-1/2 bg-zinc-900/50 border-b lg:border-b-0 lg:border-r border-zinc-800 px-6 sm:px-12 py-12 flex flex-col justify-center">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to pricing
        </Link>

        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gold/15 border border-gold/25 flex items-center justify-center">
            {isFamily ? (
              <Users className="w-4 h-4 text-gold" />
            ) : (
              <User className="w-4 h-4 text-gold" />
            )}
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-gold">
            {isFamily ? "Family Trial" : "Individual Trial"}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
          Complete Seerah
        </h1>
        <p className="text-zinc-400 text-base mb-8 leading-relaxed">
          {isFamily
            ? "One household account with up to 5 learner profiles."
            : "Full access to all 100 parts of the Seerah of the Prophet ﷺ."}
        </p>

        {/* Plan summary */}
        <div className="bg-zinc-800/60 border border-gold/20 rounded-2xl p-6 mb-8">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-4xl font-bold text-gold">$1</span>
            <span className="text-zinc-400 text-sm">now</span>
          </div>
          <p className="text-zinc-300 text-sm mb-1">{planSubtitle}</p>
          <p className="text-zinc-500 text-sm">{planAfter} · Cancel anytime</p>
        </div>

        <ul className="space-y-3 mb-8">
          {planFeatures.map((f) => (
            <li key={f} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-gold/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-gold" />
              </div>
              <span className="text-sm text-zinc-300">{f}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-4">
          {[
            { Icon: Shield, text: "Cancel anytime" },
            { Icon: Lock,   text: "Secure payment" },
          ].map(({ Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-xs text-zinc-500">
              <Icon className="w-4 h-4 text-zinc-600" />
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* Right column — auth or proceed */}
      <div className="lg:w-1/2 px-6 sm:px-12 py-12 flex flex-col justify-center">

        {!isAuthenticated ? (
          /* ── Auth form ──────────────────────────────────────────────────── */
          <div className="max-w-md w-full mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-1">
                {authMode === "signup" ? "Create your account" : "Sign in to continue"}
              </h2>
              <p className="text-zinc-500 text-sm">
                {authMode === "signup"
                  ? "You need an account to start your trial."
                  : "Sign in to your existing account."}
              </p>
            </div>

            {/* Auth mode toggle */}
            <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 mb-6">
              {(["signup", "login"] as AuthMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => { setAuthMode(mode); setAuthError(""); }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    authMode === mode
                      ? "bg-zinc-700 text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {mode === "signup" ? "Create Account" : "Sign In"}
                </button>
              ))}
            </div>

            {authMode === "signup" ? (
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                    Full name
                  </label>
                  <input
                    type="text"
                    autoComplete="name"
                    value={authForm.fullName}
                    onChange={(e) => setAuthForm((p) => ({ ...p, fullName: e.target.value }))}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-600 text-base sm:text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    value={authForm.email}
                    onChange={(e) => setAuthForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-600 text-base sm:text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      autoComplete="new-password"
                      value={authForm.password}
                      onChange={(e) => setAuthForm((p) => ({ ...p, password: e.target.value }))}
                      placeholder="At least 8 characters"
                      className="w-full px-4 py-3 pr-12 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-600 text-base sm:text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                    Confirm password
                  </label>
                  <input
                    type={showPass ? "text" : "password"}
                    autoComplete="new-password"
                    value={authForm.confirmPassword}
                    onChange={(e) => setAuthForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                    placeholder="Repeat password"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-600 text-base sm:text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-colors"
                    required
                  />
                </div>

                {authError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {authError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gold hover:bg-gold-light disabled:opacity-60 text-ink font-bold text-base transition-colors shadow-lg shadow-gold/20"
                >
                  {authLoading ? "Creating account…" : "Continue →"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    value={authForm.email}
                    onChange={(e) => setAuthForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-600 text-base sm:text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      autoComplete="current-password"
                      value={authForm.password}
                      onChange={(e) => setAuthForm((p) => ({ ...p, password: e.target.value }))}
                      placeholder="Your password"
                      className="w-full px-4 py-3 pr-12 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-600 text-base sm:text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {authError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {authError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gold hover:bg-gold-light disabled:opacity-60 text-ink font-bold text-base transition-colors shadow-lg shadow-gold/20"
                >
                  {authLoading ? "Signing in…" : "Continue →"}
                </button>

                <p className="text-center text-xs text-zinc-500">
                  <Link href="/forgot-password" className="text-gold hover:text-gold-light">
                    Forgot password?
                  </Link>
                </p>
              </form>
            )}
          </div>
        ) : (
          /* ── Proceed to Stripe Checkout ─────────────────────────────────── */
          <div className="max-w-md w-full mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-1">{planTitle}</h2>
              <p className="text-zinc-400 text-sm">{planSubtitle} · {planAfter}</p>
            </div>

            {/* Order summary */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">7-day access fee</span>
                <span className="text-white font-semibold">$1.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">After trial</span>
                <span className="text-zinc-300">{isFamily ? "$19/month" : "$9/month"}</span>
              </div>
              <div className="border-t border-zinc-800 pt-3 flex justify-between">
                <span className="text-sm font-semibold text-white">Due today</span>
                <span className="text-gold font-bold">$1.00</span>
              </div>
            </div>

            {checkoutError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
                {checkoutError}
              </div>
            )}

            <button
              onClick={handleProceedToCheckout}
              disabled={checkoutLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gold hover:bg-gold-light disabled:opacity-60 text-ink font-bold text-base transition-colors shadow-lg shadow-gold/20"
            >
              <Lock className="w-4 h-4" />
              {checkoutLoading ? "Redirecting to checkout…" : buttonLabel}
              {!checkoutLoading && <ArrowRight className="w-4 h-4" />}
            </button>

            <p className="text-xs text-zinc-500 text-center mt-4">
              Secure payment powered by Stripe · Your card information is encrypted
            </p>
            <p className="text-xs text-zinc-600 text-center mt-2 leading-relaxed">
              By starting your trial you agree to our{" "}
              <a href="/terms" className="underline hover:text-zinc-400">Terms of Service</a>,{" "}
              <a href="/privacy" className="underline hover:text-zinc-400">Privacy Policy</a>, and{" "}
              <a href="/refund" className="underline hover:text-zinc-400">Refund Policy</a>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
