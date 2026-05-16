"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PLANS, formatPrice, type PlanId } from "@/lib/stripe-config";

function SignupCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // Only complete is sold during early access; normalize any other value
  const planId: PlanId = "complete";
  const plan = PLANS[planId];

  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (form.fullName.trim().length < 2) {
      setError("Please enter your full name");
      return;
    }

    if (!form.email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // Create account
      const response = await fetch("/api/auth/signup-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create account");
        setLoading(false);
        return;
      }

      // Check if account is auto-verified (development) or needs verification (production)
      const isAutoVerified = data.message?.includes("auto-verified");
      
      if (isAutoVerified) {
        // In development, auto-login and redirect to checkout
        const loginResponse = await fetch("/api/auth/signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
          }),
        });

        if (loginResponse.ok) {
          router.push(`/checkout?plan=${planId}`);
        } else {
          router.push(`/login?redirect=/checkout?plan=${planId}`);
        }
      } else {
        // In production, show verification message
        setShowVerificationMessage(true);
        setLoading(false);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (!plan) {
    router.push("/");
    return null;
  }

  // Verification message view
  if (showVerificationMessage) {
    return (
      <div className="min-h-screen bg-ink text-text flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          <div className="bg-surface border border-border rounded-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
              <Check className="w-8 h-8 text-gold" />
            </div>
            
            <h1 className="text-2xl font-bold mb-3">Account Created Successfully!</h1>

            <div className="mb-6 p-5 rounded-lg bg-blue-500/5 border border-blue-500/20 text-left">
              <p className="text-base text-text mb-3">
                <strong className="text-gold">📧 Check your email</strong>
              </p>
              <p className="text-sm text-text-secondary mb-2">
                We sent a verification link to:
              </p>
              <p className="text-sm text-gold font-medium mb-3">{form.email}</p>
              <p className="text-sm text-text-secondary">
                Click the link in the email to verify your account, then sign in to complete your purchase.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => router.push(`/login?redirect=/checkout?plan=${planId}`)}
              >
                Go to Sign In
                <ArrowRight className="w-4 h-4" />
              </Button>
              
              <p className="text-xs text-text-muted">
                After verifying your email, sign in to continue to checkout and complete your purchase.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink text-text">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Create Your Account
          </h1>
          <p className="text-text-secondary">
            Sign up to continue to checkout
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Order Summary - Sidebar */}
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

              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-text-secondary text-sm">Regular price</span>
                  <span className="text-text-muted text-sm line-through">{formatPrice(plan.regularPrice!)}</span>
                </div>
                <div className="flex items-center justify-between font-semibold text-lg">
                  <span>Early access price</span>
                  <span className="text-gold">{formatPrice(plan.price)}</span>
                </div>
              </div>

              <div className="mt-6 p-3 rounded-lg bg-gold/5 border border-gold/20">
                <p className="text-xs text-text-secondary">
                  ✓ Instant access after payment<br />
                  ✓ Lifetime ownership<br />
                  ✓ No recurring charges
                </p>
              </div>
            </div>
          </div>

          {/* Signup Form */}
          <div className="lg:col-span-3">
            <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-lg font-semibold mb-6">
                  Account Details
                </h2>

                {/* Full Name */}
                <div>
                  <Input
                    label="Full name"
                    type="text"
                    placeholder="Ibrahim Munaser"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    required
                    autoComplete="name"
                  />
                </div>

                {/* Email */}
                <Input
                  label="Email address"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="email"
                />

                {/* Password */}
                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    autoComplete="new-password"
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-text-muted hover:text-text-secondary transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Confirm Password */}
                <Input
                  label="Confirm password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  required
                  autoComplete="new-password"
                  minLength={8}
                />

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div className="pt-2">
                  <p className="text-sm text-text-muted mb-4">
                    After creating your account, you'll be redirected to complete your payment.
                  </p>
                  
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full justify-center"
                    loading={loading}
                    disabled={loading}
                  >
                    Create Account & Continue
                    <ArrowRight className="w-4 h-4" />
                  </Button>

                  <p className="text-xs text-text-muted text-center mt-3 leading-relaxed">
                    By creating an account, you agree to our{" "}
                    <Link href="/terms" className="underline hover:text-text-secondary transition-colors">Terms of Service</Link>
                    {", "}
                    <Link href="/privacy" className="underline hover:text-text-secondary transition-colors">Privacy Policy</Link>
                    {", and "}
                    <Link href="/refund" className="underline hover:text-text-secondary transition-colors">Refund Policy</Link>.
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-border text-center">
                  <p className="text-sm text-text-secondary">
                    Already have an account?{" "}
                    <Link href={`/login?redirect=/checkout?plan=${planId}`} className="text-gold hover:text-gold-light font-medium transition-colors">
                      Sign in
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupCheckoutClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-ink text-text flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-text-secondary">Loading...</p>
        </div>
      </div>
    }>
      <SignupCheckoutContent />
    </Suspense>
  );
}
