"use client";

import { useState } from "react";
import { XCircle, Loader2, AlertTriangle } from "lucide-react";
import type { CourseLang } from "@/lib/course-lang";
import { t, tf } from "@/lib/ui-strings";

interface Props {
  cancelDate: string; // ISO date string — when access ends if cancelled
  isTrial: boolean;
  lang?: CourseLang;
}

export function CancelSubscriptionButton({ cancelDate, isTrial, lang = "en" }: Props) {
  const [step, setStep] = useState<"idle" | "confirm" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const formattedDate = new Date(cancelDate).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
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
        setError(data.error ?? t(lang, "somethingWentWrong"));
        setStep("error");
        return;
      }
      setStep("done");
      // Reload to refresh the billing page state.
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      setError(t(lang, "couldNotCancel"));
      setStep("error");
    }
  }

  if (step === "done") {
    return (
      <p className="text-sm text-amber-400">
        {tf(lang, "cancelledKeepAccess", { date: formattedDate })}
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
              {isTrial ? t(lang, "cancelTrialQ") : t(lang, "cancelSubscriptionQ")}
            </p>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              {tf(lang, "keepAccessUntil", { date: formattedDate })}
              {isTrial && t(lang, "wontBeChargedTrial")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-semibold text-sm transition-colors"
          >
            {t(lang, "yesCancel")}
          </button>
          <button
            onClick={() => setStep("idle")}
            className="inline-flex items-center px-4 py-2 rounded-lg border border-border text-text-secondary hover:text-text text-sm transition-colors"
          >
            {t(lang, "keepMyPlan")}
          </button>
        </div>
      </div>
    );
  }

  if (step === "loading") {
    return (
      <button disabled className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-text-muted text-sm opacity-60 cursor-not-allowed">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t(lang, "cancelling")}
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
        {isTrial ? t(lang, "cancelTrial") : t(lang, "cancelPlan")}
      </button>
      {step === "error" && error && (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
