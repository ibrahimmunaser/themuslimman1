"use client";

import { useState } from "react";
import { RefreshCw, Loader2 } from "lucide-react";

interface Props {
  isTrial?: boolean;
}

/**
 * Removes the cancel_at_period_end flag on the user's active subscription
 * so it renews normally at the end of the billing period.
 */
export function ReactivateSubscriptionButton({ isTrial = false }: Props) {
  const [step,  setStep]  = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleReactivate() {
    setStep("loading");
    setError(null);
    try {
      const res  = await fetch("/api/stripe/reactivate-subscription", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setStep("error");
        return;
      }
      setStep("done");
      setTimeout(() => window.location.reload(), 1200);
    } catch {
      setError("Could not reactivate subscription. Please try again.");
      setStep("error");
    }
  }

  if (step === "done") {
    return (
      <p className="text-sm text-emerald-400">
        {isTrial ? "Trial kept — it will convert to monthly normally." : "Reactivated — your plan will renew normally."}
      </p>
    );
  }

  if (step === "loading") {
    return (
      <button disabled className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-text-muted text-sm opacity-60 cursor-not-allowed">
        <Loader2 className="w-4 h-4 animate-spin" />
        Reactivating…
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={handleReactivate}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-400/80 hover:text-emerald-400 text-sm transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        {isTrial ? "Keep my trial" : "Keep my plan"}
      </button>
      {step === "error" && error && (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
