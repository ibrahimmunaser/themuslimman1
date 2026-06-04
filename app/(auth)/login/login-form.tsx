"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { roleHome } from "@/lib/roles";

export function LoginForm() {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("redirect") || searchParams.get("from") || null;
  const hintEmail = searchParams.get("email") ?? "";
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: hintEmail, password: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      const result = await response.json();

      if (response.ok && result.success && result.role) {
        // Use window.location.href for a full-page navigation so the server
        // re-renders with fresh auth cookies — avoids the race condition where
        // router.push() + router.refresh() discard the RSC payload mid-flight
        // and leave the page black.
        let destination: string;
        // Only allow safe internal relative paths to prevent open redirect attacks.
        const isSafeReturn =
          returnUrl && returnUrl.startsWith("/") && !returnUrl.startsWith("//");
        if (isSafeReturn) {
          destination = returnUrl;
        } else if (result.role === "student") {
          if (!result.hasPurchase) {
            destination = "/pricing";
          } else if (result.isFamily) {
            // Family plan → always go through the profile picker
            destination = "/profiles";
          } else {
            // Individual plan → go straight to course (picker auto-skips for 1 profile)
            destination = "/seerah";
          }
        } else {
          destination = roleHome(result.role);
        }
        window.location.href = destination;
      } else {
        setError(result.error || "Login failed. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-16 flex flex-col items-center justify-start">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logodashboard.png"
            alt="Complete Seerah"
            className="w-12 h-12 rounded-xl mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-text mb-2">Sign in to Seerah</h1>
          <p className="text-text-secondary text-sm">
            Use your email to continue learning
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8">
          {hintEmail && (
            <div className="mb-4 p-3 rounded-lg bg-gold/8 border border-gold/25 text-sm text-text-secondary text-center">
              Sign in with <span className="text-gold font-medium">{hintEmail}</span> to claim your gift.
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                autoComplete="current-password"
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

            {error && (
              <div role="alert" aria-live="assertive" className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full justify-center mt-2"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link
              href="/forgot-password"
              className="text-sm text-text-muted hover:text-gold transition-colors"
            >
              Forgot your password?
            </Link>
          </div>

          <div className="mt-6 pt-5 border-t border-border text-center">
            <p className="text-sm text-text-secondary">
              Don&apos;t have an account?{" "}
              <Link href="/checkout" className="text-gold hover:text-gold-light font-medium transition-colors">
                Get started
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          © 2026 TheMuslimMan · themuslimman.com
        </p>
      </div>
    </div>
  );
}
