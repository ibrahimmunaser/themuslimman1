"use client";

import { useState } from "react";
import { Mail, X, RefreshCw, CheckCircle2 } from "lucide-react";

interface EmailVerificationBannerProps {
  email: string;
}

export function EmailVerificationBanner({ email }: EmailVerificationBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "loading" | "sent" | "error">("idle");

  if (dismissed) return null;

  async function handleResend() {
    setResendState("loading");
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      setResendState(res.ok ? "sent" : "error");
    } catch {
      setResendState("error");
    }
  }

  return (
    <div className="bg-gradient-to-r from-gold/20 to-amber-600/20 border-b border-gold/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center flex-shrink-0">
              <Mail className="w-4 h-4 text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text">
                <span className="font-semibold">Verify your email to unlock all features.</span>{" "}
                <span className="text-text-secondary hidden sm:inline">
                  We sent a link to{" "}
                  <span className="font-medium text-gold">{email}</span>
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {resendState === "sent" ? (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Sent!
              </span>
            ) : resendState === "error" ? (
              <span className="text-xs text-red-400">Failed — try again</span>
            ) : (
              <button
                onClick={handleResend}
                disabled={resendState === "loading"}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:text-gold/80 transition-colors disabled:opacity-60 min-h-[32px] px-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resendState === "loading" ? "animate-spin" : ""}`} />
                {resendState === "loading" ? "Sending…" : "Resend"}
              </button>
            )}

            <button
              onClick={() => setDismissed(true)}
              className="text-text-muted hover:text-text transition-colors p-1"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
