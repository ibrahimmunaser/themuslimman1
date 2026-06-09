"use client";

import { useState } from "react";
import { XCircle, Loader2, AlertTriangle } from "lucide-react";

interface Props {
  cancelDate: string; // ISO date string — when access ends if cancelled
  isTrial: boolean;
}

export function CancelSubscriptionButton({ cancelDate, isTrial }: Props) {
  const [step, setStep] = useState<"idle" | "confirm" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const formattedDate = new Date(cancelDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  async function handleCancel() {
    setStep("loading");
    setError(null);
    try {
      const res = await fetch("/api/stripe/cancel-subscription", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setStep("error");
        return;
      }
      setStep("done");
      // Reload to refresh the billing page state.
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      setError("Could not cancel subscription. Please try again.");
      setStep("error");
    }
  }

  if (step === "done") {
    return (
      <p className="text-sm text-amber-400">
        Cancelled — you&apos;ll keep access until {formattedDate}.
      </p>
    );
  }

  if (step === "confirm") {
    return (
      <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 space-y-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-text">
              Cancel {isTrial ? "trial" : "subscription"}?
            </p>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              You&apos;ll keep full access until <span className="font-medium text-text">{formattedDate}</span>.
              After that, your account will lose course access.
              {isTrial && " You won't be charged the monthly fee."}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-semibold text-sm transition-colors"
          >
            Yes, cancel
          </button>
          <button
            onClick={() => setStep("idle")}
            className="inline-flex items-center px-4 py-2 rounded-lg border border-border text-text-secondary hover:text-text text-sm transition-colors"
          >
            Keep my plan
          </button>
        </div>
      </div>
    );
  }

  if (step === "loading") {
    return (
      <button disabled className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-text-muted text-sm opacity-60 cursor-not-allowed">
        <Loader2 className="w-4 h-4 animate-spin" />
        Cancelling…
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => setStep("confirm")}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/20 hover:border-red-500/40 text-red-400/70 hover:text-red-400 text-sm transition-colors"
      >
        <XCircle className="w-4 h-4" />
        Cancel {isTrial ? "trial" : "plan"}
      </button>
      {step === "error" && error && (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
