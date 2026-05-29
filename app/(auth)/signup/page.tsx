"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hintEmail = searchParams.get("email") ?? "";
  const redirectAfter = searchParams.get("redirect") ?? "";

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: hintEmail,
    password: "",
    confirmPassword: "",
  });

  async function handleSubmit(e: React.FormEvent) {
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
      const response = await fetch("/api/auth/signup-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Signup failed");
        return;
      }

      // In production, email verification is required before accessing the course.
      // Show a "check your email" screen instead of silently redirecting.
      if (data.requiresVerification) {
        setPendingVerification(true);
        return;
      }

      // Dev mode (auto-verified) or gift claim flow — go to destination.
      const destination = redirectAfter || "/pricing";
      router.push(destination);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (pendingVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
              <Mail className="w-8 h-8 text-gold" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-text mb-3">Check your email</h1>
          <p className="text-text-secondary mb-6">
            We sent a verification link to{" "}
            <span className="text-text font-medium">{form.email}</span>.
            Click the link to verify your account, then come back to sign in.
          </p>
          <div className="bg-surface border border-border rounded-2xl p-5 text-sm text-text-muted mb-6">
            Didn&apos;t get it? Check your spam folder, or{" "}
            <Link href="/login" className="text-gold hover:text-gold-light transition-colors">
              sign in
            </Link>{" "}
            to resend the verification email.
          </div>
          <Link href="/login" className="text-gold hover:text-gold-light text-sm font-medium transition-colors">
            Back to sign in →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text mb-2">
            Start learning the Seerah
          </h1>
          <p className="text-text-secondary text-sm">
            Create your account and get instant access
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8">
          {hintEmail && (
            <div className="mb-4 p-3 rounded-lg bg-gold/8 border border-gold/25 text-sm text-text-secondary text-center">
              Create your account with <span className="text-gold font-medium">{hintEmail}</span> to claim your gift.
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <Input
                label="Full name"
                type="text"
                placeholder="Your full name"
                value={form.fullName || ""}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
                autoComplete="name"
              />
            </div>

            {/* Email — locked to recipient email if coming from a gift link */}
            <div>
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={form.email || ""}
                onChange={(e) => !hintEmail && setForm({ ...form, email: e.target.value })}
                readOnly={!!hintEmail}
                required
                autoComplete="email"
                className={hintEmail ? "opacity-70 cursor-not-allowed" : ""}
              />
              {hintEmail && (
                <p className="text-xs text-gold/80 mt-1">This email is required to claim your gift.</p>
              )}
            </div>

            {/* Password */}
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                value={form.password || ""}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                autoComplete="new-password"
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-6 min-h-[44px] min-w-[44px] flex items-center justify-center text-text-muted hover:text-text-secondary transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Confirm Password */}
            <div>
              <Input
                label="Confirm password"
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter password"
                value={form.confirmPassword || ""}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
                autoComplete="new-password"
                minLength={8}
              />
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-xs text-red-400 mt-1.5">Passwords do not match</p>
              )}
              {form.confirmPassword && form.password === form.confirmPassword && form.password.length >= 8 && (
                <p className="text-xs text-green-400 mt-1.5">Passwords match ✓</p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div role="alert" aria-live="assertive" className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full justify-center mt-2"
            >
              Create account
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-border text-center">
            <p className="text-sm text-text-secondary">
              Already have an account?{" "}
              <Link href="/login" className="text-gold hover:text-gold-light font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-text-muted mt-4">
          By creating an account you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

export default function NewStudentSignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-text-secondary">Loading...</div>
      </div>
    }>
      <SignupPageContent />
    </Suspense>
  );
}
