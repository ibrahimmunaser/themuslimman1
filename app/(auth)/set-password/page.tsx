"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";

function SetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ password: "", confirmPassword: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

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
      const response = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: form.password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to set password");
        setLoading(false);
        return;
      }
      setSuccess(true);
      // Full page reload to pick up the new session cookie, then go to dashboard
      setTimeout(() => {
        window.location.href = "/seerah";
      }, 1500);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-2xl font-bold text-white">Invalid Link</h1>
          <p className="text-zinc-400">This setup link is missing or has already been used.</p>
          <Link
            href="/forgot-password"
            className="inline-block text-gold hover:text-gold/80 underline text-sm"
          >
            Request a new password link
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome!</h1>
          <p className="text-zinc-400">Password set. Taking you to the dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Set your password
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Choose a password to sign back in anytime.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New password (min 8 characters)"
              value={form.password}
              minLength={8}
              required
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-gold/50 transition-colors text-base sm:text-sm pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-500 hover:text-zinc-300"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Confirm password"
            value={form.confirmPassword}
            required
            onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-gold/50 transition-colors text-base sm:text-sm"
          />

          {error && <p className="text-xs text-red-400 pt-1">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gold hover:bg-gold-light disabled:opacity-60 text-ink font-bold text-sm transition-colors mt-1"
          >
            {loading ? "Setting password…" : "Set Password & Start Learning"}
          </button>
        </form>

        <p className="text-center mt-6 text-xs text-zinc-500">
          Link not working?{" "}
          <Link href="/forgot-password" className="text-gold hover:underline">
            Request a new one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
      <SetPasswordContent />
    </Suspense>
  );
}
