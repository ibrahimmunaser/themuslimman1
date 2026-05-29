"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Check, Lock, Users, ArrowLeft, Shield, Star, RefreshCw, ArrowUpCircle } from "lucide-react";
import Link from "next/link";
import { PLANS, formatPrice } from "@/lib/stripe-config";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const LIFETIME_PLAN  = PLANS.family;
const MONTHLY_PLAN   = PLANS.familyMonthly;

type BillingCycle = "lifetime" | "monthly";

// ── Stripe payment form ───────────────────────────────────────

function FamilyCheckoutForm({ cycle, isUpgrade }: { cycle: BillingCycle; isUpgrade: boolean }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [error, setError]           = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const displayPrice = isUpgrade
    ? LIFETIME_PLAN.upgradeFromLifetimePrice
    : cycle === "lifetime" ? LIFETIME_PLAN.price : MONTHLY_PLAN.price;
  const label = isUpgrade
    ? `Upgrade to Family Lifetime — ${formatPrice(displayPrice)}`
    : cycle === "lifetime"
    ? `Get Family Access — ${formatPrice(displayPrice)}`
    : `Subscribe — ${formatPrice(displayPrice)}/mo`;

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

    // Family Lifetime is a one-time PaymentIntent — use ?type=family so the success
    // page calls verify-payment, which also sets planType=family on the user.
    // Family Monthly is a subscription — use ?type=family-subscription so the success
    // page polls /api/stripe/check-access AND shows the family profile-setup CTA.
    const returnUrl = cycle === "lifetime"
      ? `${window.location.origin}/payment/success?type=family`
      : `${window.location.origin}/payment/success?type=family-subscription`;

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
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
        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black font-bold text-base transition-colors shadow-lg shadow-amber-500/20"
      >
        <Lock className="w-4 h-4" />
        {processing ? "Processing…" : label}
      </button>

      <p className="text-xs text-zinc-500 text-center">
        Secure payment powered by Stripe · Your information is encrypted
      </p>
      <p className="text-xs text-zinc-600 text-center leading-relaxed">
        By purchasing you agree to our{" "}
        <a href="/terms" className="underline hover:text-zinc-400 transition-colors">Terms of Service</a>
        {", "}
        <a href="/privacy" className="underline hover:text-zinc-400 transition-colors">Privacy Policy</a>
        {", and "}
        <a href="/refund" className="underline hover:text-zinc-400 transition-colors">Refund Policy</a>.
      </p>
    </form>
  );
}

// ── Main checkout page ────────────────────────────────────────

interface FamilyCheckoutClientProps {
  userEmail: string;
  userName: string;
  initialCycle?: BillingCycle;
  isUpgradeFromLifetime?: boolean;
}

export default function FamilyCheckoutClient({
  userEmail,
  initialCycle = "lifetime",
  isUpgradeFromLifetime = false,
}: FamilyCheckoutClientProps) {
  // Upgraders from Individual Lifetime can only go to Family Lifetime — lock the cycle.
  const [cycle, setCycle]             = useState<BillingCycle>(isUpgradeFromLifetime ? "lifetime" : initialCycle);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [loading, setLoading]           = useState(true);

  const isUpgrade = isUpgradeFromLifetime;

  // Re-fetch a new PaymentIntent / SubscriptionIntent whenever billing cycle changes
  useEffect(() => {
    setLoading(true);
    setClientSecret(null);
    setError(null);

    const endpoint = cycle === "lifetime"
      ? "/api/stripe/create-family-payment-intent"
      : "/api/stripe/create-family-subscription-intent";

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isUpgrade }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setClientSecret(data.clientSecret);
        }
      })
      .catch(() => setError("Failed to initialize checkout. Please refresh the page."))
      .finally(() => setLoading(false));
  }, [cycle]);

  const activeFeatures = cycle === "lifetime" ? LIFETIME_PLAN.features : MONTHLY_PLAN.features;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col lg:flex-row">
      {/* Left column — plan details */}
      <div className="lg:w-1/2 bg-zinc-900/50 border-r border-zinc-800 px-6 sm:px-12 py-12 flex flex-col justify-center">
        <Link
          href="/billing"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to billing
        </Link>

        {/* Plan badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold mb-5 w-fit">
          <Users className="w-3.5 h-3.5" />
          Family Access
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          Complete Seerah<br />
          <span className="text-amber-400">Family Access</span>
        </h1>

        <p className="text-zinc-400 text-base mb-8 leading-relaxed">
          One household account with up to 5 learner profiles. Parents log in once,
          create profiles for each family member, and each learner gets their own
          separate progress for all course assets.
        </p>

        {/* Billing cycle toggle — hidden for upgraders (lifetime-only path) */}
        {!isUpgrade && (
          <div className="flex items-center gap-1 bg-zinc-800 rounded-xl p-1 w-fit mb-8">
            <button
              onClick={() => setCycle("lifetime")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                cycle === "lifetime"
                  ? "bg-amber-500 text-black shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Star className="w-3.5 h-3.5 inline mr-1.5" />
              Lifetime — {formatPrice(LIFETIME_PLAN.price)}
            </button>
            <button
              onClick={() => setCycle("monthly")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                cycle === "monthly"
                  ? "bg-amber-500 text-black shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" />
              Monthly — {formatPrice(MONTHLY_PLAN.price)}/mo
            </button>
          </div>
        )}

        {/* Price display */}
        <div className="mb-8">
          {isUpgrade ? (
            <div>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-white">
                  {formatPrice(LIFETIME_PLAN.upgradeFromLifetimePrice)}
                </span>
                <span className="text-zinc-500 text-sm line-through">{formatPrice(LIFETIME_PLAN.price)}</span>
                <span className="text-zinc-500 text-sm">one-time</span>
              </div>
              <p className="text-xs text-amber-500/80 mt-2 flex items-center gap-1.5">
                <ArrowUpCircle className="w-3.5 h-3.5 flex-shrink-0" />
                You&apos;ve already paid $99 for Individual Lifetime — you&apos;re only paying the $100 difference.
              </p>
            </div>
          ) : cycle === "lifetime" ? (
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">{formatPrice(LIFETIME_PLAN.price)}</span>
                <span className="text-zinc-500 text-sm">one-time · lifetime access</span>
              </div>
              <p className="text-xs text-zinc-600 mt-1">Pay once, access forever.</p>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">{formatPrice(MONTHLY_PLAN.price)}</span>
                <span className="text-zinc-500 text-sm">/ month · cancel anytime</span>
              </div>
              <p className="text-xs text-zinc-600 mt-1">
                Full family access while subscribed.{" "}
                <span className="text-amber-600/70">
                  Upgrade to lifetime anytime for {formatPrice(LIFETIME_PLAN.price)}.
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Feature list */}
        <ul className="space-y-3">
          {activeFeatures.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-amber-400" />
              </div>
              <span className="text-sm text-zinc-300">{feature}</span>
            </li>
          ))}
        </ul>

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
          {cycle === "lifetime" && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Star className="w-4 h-4 text-zinc-600" />
              Lifetime access
            </div>
          )}
          {cycle === "monthly" && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <RefreshCw className="w-4 h-4 text-zinc-600" />
              Cancel anytime
            </div>
          )}
        </div>
      </div>

      {/* Right column — payment form */}
      <div className="lg:w-1/2 px-6 sm:px-12 py-12 flex flex-col justify-center">
        <div className="max-w-md w-full mx-auto">
          <h2 className="text-xl font-bold text-white mb-1">Complete your order</h2>
          <p className="text-sm text-zinc-500 mb-7">
            Purchasing as <span className="text-zinc-300">{userEmail}</span>
          </p>

          {/* Order summary */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">
                  {isUpgrade ? "Family Lifetime (Upgrade)" : cycle === "lifetime" ? LIFETIME_PLAN.name : MONTHLY_PLAN.name}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Up to 5 learner profiles ·{" "}
                  {isUpgrade || cycle === "lifetime" ? "Lifetime access" : "Cancel anytime"}
                </p>
              </div>
              <div className="text-right">
                {isUpgrade ? (
                  <>
                    <p className="text-base font-bold text-white">
                      {formatPrice(LIFETIME_PLAN.upgradeFromLifetimePrice)}
                    </p>
                    <p className="text-xs text-zinc-600 line-through">
                      {formatPrice(LIFETIME_PLAN.price)}
                    </p>
                  </>
                ) : (
                  <p className="text-base font-bold text-white">
                    {cycle === "lifetime"
                      ? formatPrice(LIFETIME_PLAN.price)
                      : `${formatPrice(MONTHLY_PLAN.price)}/mo`}
                  </p>
                )}
              </div>
            </div>
            {isUpgrade && (
              <div className="mt-3 pt-3 border-t border-zinc-800 text-xs text-zinc-500 flex items-center justify-between">
                <span>Individual Lifetime (already paid)</span>
                <span>$99</span>
              </div>
            )}
          </div>

          {/* Payment form */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
            </div>
          )}

          {error && !loading && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
              {error}
            </div>
          )}

          {clientSecret && !loading && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "night",
                  variables: {
                    colorPrimary: "#f4c542",
                    colorBackground: "#18181b",
                    colorText: "#ffffff",
                    colorDanger: "#ef4444",
                    borderRadius: "12px",
                    fontFamily: "system-ui, sans-serif",
                  },
                },
              }}
            >
              <FamilyCheckoutForm cycle={cycle} isUpgrade={isUpgrade} />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
}
