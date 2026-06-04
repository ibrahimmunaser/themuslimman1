"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle2 } from "lucide-react";

export function ResendVerificationButton() {
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">("idle");

  async function handleResend() {
    setState("loading");
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      setState(res.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-5 space-y-4 text-left">
      <p className="text-sm text-text-muted">
        Didn&apos;t receive the email? Check your spam folder, then use the button below.
      </p>

      {state === "sent" ? (
        <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Verification email sent! Check your inbox.
        </div>
      ) : state === "error" ? (
        <div className="space-y-2">
          <p className="text-sm text-red-400">Failed to send. Please try again in a moment.</p>
          <button
            onClick={handleResend}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gold hover:text-gold/80 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try again
          </button>
        </div>
      ) : (
        <button
          onClick={handleResend}
          disabled={state === "loading"}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gold/30 bg-gold/10 text-gold hover:bg-gold/15 transition-colors text-sm font-semibold disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${state === "loading" ? "animate-spin" : ""}`} />
          {state === "loading" ? "Sending…" : "Resend verification email"}
        </button>
      )}
    </div>
  );
}
