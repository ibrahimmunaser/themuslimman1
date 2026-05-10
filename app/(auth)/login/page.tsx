"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { roleHome } from "@/lib/roles";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("redirect") || searchParams.get("from") || null;
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      // Use API route instead of server action for better cookie handling
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      const result = await response.json();

      if (response.ok && result.success && result.role) {
        // Cookies are now set by the API route
        // Add a small delay to ensure cookies are propagated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // If there's a return URL, redirect there
        if (returnUrl) {
          router.push(returnUrl);
        } else {
          // Check if user has purchase - redirect accordingly
          if (result.role === "student") {
            // For students, check purchase status
            if (result.hasPurchase) {
              router.push("/my-courses"); // Has purchase - go to my courses
            } else {
              router.push("/pricing"); // No purchase - go to pricing
            }
          } else {
            // For admins, use role-based home
            router.push(roleHome(result.role));
          }
        }
        router.refresh();
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text mb-2">Sign in to Seerah</h1>
          <p className="text-text-secondary text-sm">
            Use your email to continue learning
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8">
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
                className="absolute right-3 top-9 text-text-muted hover:text-text-secondary transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
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

          {/* Link to forgot password */}
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
              Don't have an account?{" "}
              <Link href="/signup" className="text-gold hover:text-gold-light font-medium transition-colors">
                Create an account
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
