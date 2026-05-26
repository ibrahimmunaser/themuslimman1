"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, Mail, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "complete";
  const hintEmail = searchParams.get("email") ?? "";
  const redirectAfter = searchParams.get("redirect") ?? "";

  const [step, setStep] = useState<"signup" | "verification">("signup");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    email: hintEmail,
    password: "",
    confirmPassword: "",
  });
  const [sentToEmail, setSentToEmail] = useState("");

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

      // Success — redirect to gift claim page if we came from there, else dashboard
      const destination = redirectAfter || "/my-courses";
      router.push(destination);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "verification") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-text mb-2">Check your email</h1>
            <p className="text-text-secondary text-sm">
              We sent a verification link to:
            </p>
            <p className="text-gold font-medium mt-1">{sentToEmail}</p>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
          <div className="space-y-3 text-sm text-text-secondary">
            <p className="flex items-start gap-2">
              <Mail className="w-4 h-4 mt-0.5 text-gold flex-shrink-0" />
              <span>Click the link in the email to verify your account</span>
            </p>
            <p className="flex items-start gap-2">
              <Mail className="w-4 h-4 mt-0.5 text-gold flex-shrink-0" />
              <span>After verification, use your email to sign in and complete your purchase</span>
            </p>
          </div>

          <div className="pt-4 border-t border-border">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => router.push(`/checkout?plan=${plan}`)}
            >
              Go to Checkout Now
              <ArrowRight className="w-4 h-4" />
            </Button>
            <p className="text-xs text-text-muted text-center mt-3">
              Or wait for the verification email
            </p>
          </div>
          </div>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-gold hover:text-gold-light">
              Back to sign in
            </Link>
          </div>
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
                className="absolute right-3 top-9 text-text-muted hover:text-text-secondary transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
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
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
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
