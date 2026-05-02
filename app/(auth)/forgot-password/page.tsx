"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send reset email");
        setLoading(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
              <Mail className="w-8 h-8 text-gold" />
            </div>

            <h1 className="text-2xl font-bold text-text mb-3">Check Your Email</h1>
            
            <p className="text-text-secondary mb-6">
              If an account exists with <span className="text-gold font-medium">{email}</span>, 
              you'll receive an email with instructions to reset your password.
            </p>

            <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 text-left mb-6">
              <p className="text-sm text-text-secondary">
                <strong className="text-text">Didn't receive an email?</strong>
              </p>
              <ul className="text-sm text-text-muted mt-2 space-y-1">
                <li>• Check your spam/junk folder</li>
                <li>• Make sure you entered the correct email</li>
                <li>• Wait a few minutes and check again</li>
              </ul>
            </div>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-gold hover:text-gold-light transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
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
          <h1 className="text-2xl font-bold text-text mb-2">Forgot Password?</h1>
          <p className="text-text-secondary text-sm">
            Enter your email and we'll send you a link to reset your password
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

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
              Send Reset Link
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-text-muted hover:text-gold transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          © 2026 TheMuslimMan · themuslimman.com
        </p>
      </div>
    </div>
  );
}
