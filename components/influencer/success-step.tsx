"use client";

import { useEffect, useState } from "react";
import { Check, ArrowRight, RefreshCw, Mail } from "lucide-react";
import type { InfluencerConfig } from "@/lib/influencer-configs";
import { trackEvent } from "@/lib/analytics";

const MAX_POLL_MS     = 60_000;
const POLL_INTERVAL   = 2_000;

interface SuccessStepProps {
  config: InfluencerConfig;
  /** Payment intent ID used to track the purchase analytics event */
  paymentIntentId?: string;
}

type PollState = "polling" | "confirmed" | "error";

export function SuccessStep({ config, paymentIntentId }: SuccessStepProps) {
  const [pollState, setPollState]       = useState<PollState>("polling");
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [hasPassword, setHasPassword]   = useState<boolean | null>(null);

  useEffect(() => {
    if (paymentIntentId) {
      trackEvent(
        "purchase_completed",
        {
          influencer_slug: config.slug,
          payment_intent:  paymentIntentId,
          plan:            "individual-monthly",
          source:          "influencer_quick_checkout",
        },
        { creator: config.slug }
      );
    }

    const start = Date.now();

    async function poll() {
      try {
        const res = await fetch("/api/stripe/check-access");
        if (res.status === 401) {
          setPollState("error");
          return;
        }
        if (res.ok) {
          const data = await res.json();
          if (data.hasAccess) {
            setEmailVerified(data.emailVerified ?? true);
            setHasPassword(data.hasPassword ?? true);
            setPollState("confirmed");
            return;
          }
        }
      } catch { /* keep polling */ }

      if (Date.now() - start >= MAX_POLL_MS) {
        setPollState("error");
        return;
      }
      setTimeout(poll, POLL_INTERVAL);
    }

    poll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Polling ─────────────────────────────────────────────────────────────────
  if (pollState === "polling") {
    return (
      <div className="min-h-[100dvh] bg-background text-text flex items-center justify-center px-5">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-5" aria-label="Loading" />
          <p className="text-text-secondary text-sm">Confirming your subscription…</p>
          <p className="text-xs text-zinc-600 mt-2">(This can take up to 60 seconds)</p>
        </div>
      </div>
    );
  }

  // ── Error (timeout) ──────────────────────────────────────────────────────────
  if (pollState === "error") {
    return (
      <div className="min-h-[100dvh] bg-background text-text flex items-center justify-center px-5">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-5">
            <RefreshCw className="w-7 h-7 text-amber-400" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold mb-2">Almost there…</h1>
          <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
            Your payment was received. We&apos;re still finishing setup — this usually takes a few
            seconds. If your access has not appeared within a few minutes, email us at{" "}
            <a href="mailto:support@themuslimman.com" className="text-gold hover:text-gold/80">
              support@themuslimman.com
            </a>{" "}
            and we&apos;ll fix it immediately.
          </p>
          <div className="space-y-3">
            <a
              href="/seerah"
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-sm transition-colors min-h-[44px]"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </a>
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm text-zinc-400 hover:text-zinc-200 transition-colors min-h-[44px]"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Confirmed ────────────────────────────────────────────────────────────────
  const needsVerification = emailVerified === false;
  const needsPassword     = hasPassword === false;

  return (
    <div
      className="min-h-[100dvh] bg-background text-text flex items-center justify-center px-5"
      aria-live="assertive"
    >
      <div className="w-full max-w-sm space-y-6">
        {/* Success icon */}
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
            <div className="relative w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center">
              <Check className="w-10 h-10 text-green-400" aria-hidden="true" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-text">You&apos;re in.</h1>
          <p className="text-zinc-400 mt-1">
            Welcome to Complete Seerah, recommended by {config.displayName}.
          </p>
        </div>

        {/* Email verification notice */}
        {needsVerification && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 flex items-start gap-3">
            <Mail className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-amber-300">
                {needsPassword ? "One more step — set your password" : "One more step — verify your email"}
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {needsPassword
                  ? "Check your inbox — we sent you a link to set your password and access your course."
                  : "Check your inbox for a verification link to unlock the course."}
              </p>
            </div>
          </div>
        )}

        {/* Confirmation items */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
          {[
            "Monthly subscription activated",
            "Full access to all 100 parts",
            "Start learning immediately",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center flex-shrink-0">
                <Check className="w-3.5 h-3.5 text-gold" aria-hidden="true" />
              </div>
              <p className="text-sm text-zinc-300">{item}</p>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <a
            href="/seerah?part=1"
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-base transition-colors shadow-lg shadow-gold/25 min-h-[52px]"
          >
            Start learning now
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </a>
          <a
            href="/seerah"
            className="w-full flex items-center justify-center gap-2 py-3 text-sm text-zinc-400 hover:text-zinc-200 transition-colors min-h-[44px] rounded-lg"
          >
            Go to Course Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
