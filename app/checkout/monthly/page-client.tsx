"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Check, Lock, ArrowLeft, Shield, RefreshCw, ExternalLink } from "lucide-react";
import Link from "next/link";
import { PLANS, formatPrice } from "@/lib/stripe-config";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const PLAN = PLANS.monthly;

// ── Stripe payment form ───────────────────────────────────────────────────────

function MonthlyCheckoutForm({ finalPrice }: { finalPrice: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? "An error occurred");
      setProcessing(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/success?type=subscription`,
      },
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed. Please try again.");
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement options={{ wallets: { link: "never" } }} />

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gold hover:bg-gold-light disabled:opacity-60 text-ink font-bold text-base transition-colors shadow-lg shadow-gold/20"
      >
        <Lock className="w-4 h-4" />
        {processing ? "Processing…" : `Subscribe — ${formatPrice(finalPrice)}/mo`}
      </button>

      <p className="text-xs text-zinc-500 text-center">
        Secure payment powered by Stripe · Your information is encrypted
      </p>
      <p className="text-xs text-zinc-600 text-center leading-relaxed">
        By subscribing you agree to our{" "}
        <a href="/terms" className="underline hover:text-zinc-400 transition-colors">
          Terms of Service
        </a>
        {", "}
        <a href="/privacy" className="underline hover:text-zinc-400 transition-colors">
          Privacy Policy
        </a>
        {", and "}
        <a href="/refund" className="underline hover:text-zinc-400 transition-colors">
          Refund Policy
        </a>
        .
      </p>
    </form>
  );
}

// ── Main checkout client ──────────────────────────────────────────────────────

interface Props {
  userEmail: string;
  userName: string;
}

export default function MonthlyCheckoutClient({ userEmail }: Props) {
  const router = useRouter();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasActiveSub, setHasActiveSub] = useState(false);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/stripe/create-subscription-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();

        if (!res.ok) {
          if (res.status === 401) {
            router.push("/signup-checkout?plan=monthly");
            return;
          }
          if (res.status === 409 && data.hasLifetime) {
            router.push("/my-courses");
            return;
          }
          if (res.status === 409 && data.hasActiveSubscription) {
            setHasActiveSub(true);
            return;
          }
          throw new Error(data.error || "Failed to initialize checkout");
        }

        setClientSecret(data.clientSecret);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col lg:flex-row">
      {/* ── Left column — plan details ────────────────────────────────────────── */}
      <div className="lg:w-1/2 bg-zinc-900/50 border-r border-zinc-800 px-6 sm:px-12 py-12 flex flex-col justify-center">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to pricing
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          Complete Seerah
          <br />
          <span className="text-gold">Monthly Access</span>
        </h1>

        <p className="text-zinc-400 text-base mb-3 leading-relaxed">
          Full access to all 100 parts. Cancel anytime.
        </p>

        <div className="mb-8">
          <span className="text-4xl font-bold text-white">
            {formatPrice(PLAN.price)}
          </span>
          <span className="text-zinc-400 text-base">/month</span>
        </div>

        {/* Feature list */}
        <ul className="space-y-3">
          {PLAN.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-gold/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-gold" />
              </div>
              <span className="text-sm text-zinc-300">{feature}</span>
            </li>
          ))}
        </ul>

        {/* Upgrade nudge */}
        <div className="mt-8 p-4 rounded-xl border border-gold/20 bg-gold/5">
          <p className="text-sm text-zinc-400">
            Want to own it forever?{" "}
            <Link href="/checkout" className="text-gold hover:text-gold-light font-medium transition-colors">
              Get Lifetime Access for $99 →
            </Link>
          </p>
        </div>

        {/* Trust badges */}
        <div className="mt-8 pt-6 border-t border-zinc-800 flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Shield className="w-4 h-4 text-zinc-600" />
            7-day refund guarantee
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Lock className="w-4 h-4 text-zinc-600" />
            Secure payment
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <RefreshCw className="w-4 h-4 text-zinc-600" />
            Cancel anytime
          </div>
        </div>
      </div>

      {/* ── Right column — order summary + payment ──────────────────────────────── */}
      <div className="lg:w-1/2 px-6 sm:px-12 py-12 flex flex-col justify-center">
        <div className="max-w-md w-full mx-auto">
          <h2 className="text-xl font-bold text-white mb-1">Complete your order</h2>
          {userEmail && (
            <p className="text-sm text-zinc-500 mb-7">
              Subscribing as{" "}
              <span className="text-zinc-300">{userEmail}</span>
            </p>
          )}
          {!userEmail && <div className="mb-7" />}

          {/* Order summary card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-white">{PLAN.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Full access · billed monthly · cancel anytime
                </p>
              </div>
              <p className="text-sm font-bold text-white whitespace-nowrap ml-4">
                {formatPrice(PLAN.price)}/mo
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <span className="text-sm font-semibold text-white">Due today</span>
              <span className="text-lg font-bold text-gold">
                {formatPrice(PLAN.price)}
              </span>
            </div>
          </div>

          {/* Already subscribed — clear billing link */}
          {hasActiveSub && !loading && (
            <div className="p-5 rounded-xl bg-gold/10 border border-gold/25 text-center space-y-4">
              <p className="text-sm font-semibold text-white">
                You already have an active monthly subscription.
              </p>
              <p className="text-xs text-zinc-400">
                You cannot start a second subscription while one is active.
              </p>
              <a
                href="/billing"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-sm transition-colors"
              >
                Manage your subscription
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
              {error}
              <button
                onClick={() => window.location.reload()}
                className="block mt-2 text-red-300 underline hover:text-red-200"
              >
                Try again
              </button>
            </div>
          )}

          {/* Stripe payment form */}
          {clientSecret && !loading && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "night",
                  variables: {
                    colorPrimary: "#C8A96E",
                    colorBackground: "#18181b",
                    colorText: "#ffffff",
                    colorDanger: "#ef4444",
                    borderRadius: "12px",
                    fontFamily: "system-ui, sans-serif",
                  },
                },
              }}
            >
              <MonthlyCheckoutForm finalPrice={PLAN.price} />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
}
