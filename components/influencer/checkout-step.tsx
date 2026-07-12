"use client";

import { useState, useRef, useCallback, useEffect, type ComponentProps } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  ExpressCheckoutElement,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

// StripeExpressCheckoutElementConfirmEvent isn't part of @stripe/stripe-js's
// public export surface (it's used internally by @stripe/react-stripe-js's
// own prop types but not re-exported by name), so the event type is derived
// structurally from ExpressCheckoutElement's own `onConfirm` prop instead of
// hand-rolling a subset type — this stays correct automatically if Stripe's
// SDK ever changes the event shape.
type ExpressCheckoutConfirmHandler = ComponentProps<typeof ExpressCheckoutElement>["onConfirm"];
type ExpressCheckoutConfirmEvent = Parameters<NonNullable<ExpressCheckoutConfirmHandler>>[0];
import { ArrowLeft, Check, Lock, AlertCircle, Users, Infinity, User } from "lucide-react";
import { PLANS, formatPrice } from "@/lib/stripe-config";
import { trackEvent } from "@/lib/analytics";
import { planAnalyticsProps } from "@/lib/plan-catalog";
import { startCheckoutAttempt, checkoutAttemptPayload } from "@/lib/checkout-attempt";
import type { InfluencerConfig } from "@/lib/influencer-configs";

// ── Stripe init ───────────────────────────────────────────────────────────────
// Lazily memoized so it reads the env var at first render rather than at module
// evaluation time — avoids crashes when the key isn't yet compiled into the bundle.
let _stripePromise: ReturnType<typeof loadStripe> | null = null;
function getStripePromise() {
  if (!_stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (key) _stripePromise = loadStripe(key);
  }
  return _stripePromise;
}

// ── Plan options shown in the picker ─────────────────────────────────────────
type PlanOption = "monthly" | "familyMonthly" | "complete" | "family";

interface PlanDef {
  id: PlanOption;
  label: string;
  sublabel: string;
  price: number;
  unit: string;
  badge?: string;
  icon: React.FC<{ className?: string }>;
  inline: boolean;
  /** "subscription" plans use create-subscription-intent; "payment" plans use create-payment-intent */
  stripeMode: "subscription" | "payment";
  apiEndpoint: string;
  /** Canonical plan id (lib/plan-catalog) — used for analytics properties only. */
  analyticsPlanId: string;
}

const PLAN_OPTIONS: PlanDef[] = [
  {
    id:          "monthly",
    label:       "Individual",
    sublabel:    "Access for one learner · cancel anytime",
    price:       PLANS.monthly.price,
    unit:        "/mo",
    badge:       "Most Popular",
    icon:        User,
    inline:      true,
    stripeMode:  "subscription",
    apiEndpoint: "/api/stripe/create-subscription-intent",
    analyticsPlanId: "individual-monthly",
  },
  {
    id:          "familyMonthly",
    label:       "Family",
    sublabel:    "Up to 5 profiles with individual progress",
    price:       PLANS.familyMonthly.price,
    unit:        "/mo",
    icon:        Users,
    inline:      true,
    stripeMode:  "subscription",
    apiEndpoint: "/api/stripe/create-family-subscription-intent",
    analyticsPlanId: "family-monthly",
  },
  {
    id:          "complete",
    label:       "Individual Lifetime",
    sublabel:    "Access for one learner · one-time payment",
    price:       PLANS.complete.price,
    unit:        "",
    icon:        Infinity,
    inline:      true,
    stripeMode:  "payment",
    apiEndpoint: "/api/stripe/create-payment-intent",
    analyticsPlanId: "individual-lifetime",
  },
  {
    id:          "family",
    label:       "Family Lifetime",
    sublabel:    "Up to 5 profiles · one-time payment",
    price:       PLANS.family.price,
    unit:        "",
    badge:       PLANS.family.badge, // "Best for Families" — keeps a single universal "Most Popular" badge
    icon:        Users,
    inline:      true,
    stripeMode:  "payment",
    apiEndpoint: "/api/stripe/create-family-payment-intent",
    analyticsPlanId: "family-lifetime",
  },
];

// ── Button copy ───────────────────────────────────────────────────────────────
function submitButtonLabel(plan: PlanDef): string {
  switch (plan.id) {
    case "monthly":       return `Start Individual — ${formatPrice(plan.price)}/month`;
    case "familyMonthly": return `Start Family — ${formatPrice(plan.price)}/month`;
    case "complete":      return `Get Individual Lifetime — ${formatPrice(plan.price)}`;
    case "family":        return `Get Family Lifetime — ${formatPrice(plan.price)}`;
  }
}

// ── Error helpers ─────────────────────────────────────────────────────────────
function friendlyError(err: { code?: string; decline_code?: string; message?: string }): string {
  const code = err.code ?? "";
  const dc   = err.decline_code ?? "";
  const msg  = (err.message ?? "").toLowerCase();
  if (code.includes("authentication") || msg.includes("3d secure") || msg.includes("authentication"))
    return "Your bank could not verify this payment. Please try again or use Apple Pay / Google Pay.";
  if (dc === "do_not_honor" || dc === "transaction_not_allowed")
    return "Your bank declined this payment. Contact your bank to enable international transactions, or try a different card.";
  if (dc === "insufficient_funds") return "Your card has insufficient funds. Please use a different card.";
  if (code === "expired_card" || dc === "expired_card") return "Your card has expired. Please use a different card.";
  if (code === "incorrect_cvc" || dc === "incorrect_cvc") return "Your card's security code is incorrect.";
  if (code === "incomplete_number" || code === "invalid_number") return "Your card number appears to be invalid.";
  const base = err.message ?? "Your payment was declined.";
  return `${base} Please try again or contact support@themuslimman.com.`;
}

// ── Inner form ────────────────────────────────────────────────────────────────

interface InnerFormProps {
  config: InfluencerConfig;
  plan: PlanDef;
  fullName: string;
  email: string;
  onFullNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  isAuthenticated: boolean;
  onSuccess: (paymentIntentId: string) => void;
  onRedirecting: () => void;
}

function InnerCheckoutForm({
  config,
  plan,
  fullName,
  email,
  onFullNameChange,
  onEmailChange,
  isAuthenticated,
  onSuccess,
  onRedirecting,
}: InnerFormProps) {
  const stripe   = useStripe();
  const elements = useElements();

  const [error, setError]               = useState<string | null>(null);
  const [processing, setProcessing]     = useState(false);
  const [showExpress, setShowExpress]   = useState(false);
  const clientSecretRef                 = useRef<string | null>(null);
  const attemptRef                      = useRef<ReturnType<typeof startCheckoutAttempt> | null>(null);
  const paymentFormStartedRef           = useRef(false);

  const origin = typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL ?? "https://themuslimman.com");
  const successType = plan.stripeMode === "payment"
    ? (plan.id === "family" ? "family" : "lifetime")
    : "subscription";
  const returnUrl = `${origin}/payment/success?type=${successType}&from=influencer&slug=${config.slug}`;

  function trackCheckoutEvent(event: string, extra?: Record<string, unknown>) {
    const attempt = attemptRef.current;
    trackEvent(
      event,
      {
        influencer_slug: config.slug,
        plan: plan.id,
        amount: plan.price,
        ...(attempt ? { checkout_attempt_id: attempt.checkout_attempt_id } : {}),
        ...checkoutAttemptPayload(),
        ...extra,
      },
      { creator: config.slug }
    );
  }

  // Ensure an attempt ID is created when the checkout step mounts
  useEffect(() => {
    attemptRef.current = startCheckoutAttempt("individual-monthly", { source: config.slug });
    trackCheckoutEvent("checkout_loaded");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Obtain a Stripe client secret (guest checkout + subscription intent) ─────
  const getClientSecret = useCallback(
    async (name: string, userEmail: string): Promise<string> => {
      if (clientSecretRef.current) return clientSecretRef.current;

      // 1. Ensure account / session
      if (!isAuthenticated) {
        const guestRes = await fetch("/api/auth/guest-checkout", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ email: userEmail.trim(), fullName: name.trim() }),
        });
        const guestData = await guestRes.json();
        if (!guestRes.ok) {
          if (guestData.hasAccount) {
            throw new Error(
              "An account with this email already exists. Please sign in at themuslimman.com/login, then return here."
            );
          }
          throw new Error(guestData.error ?? "Could not create account. Please try again.");
        }
      }

      // 2. Create subscription/payment intent via the plan-specific endpoint
      const subRes = await fetch(plan.apiEndpoint!, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          creator:     config.slug,
          source:      config.slug,
          utmSource:   config.utmSource,
          utmMedium:   config.utmMedium,
          utmCampaign: config.utmCampaign,
          utmContent:  config.utmContent,
        }),
      });
      const subData = await subRes.json();
      if (!subRes.ok) {
        if (subData.hasLifetime)           throw new Error("You already have lifetime access. Go to themuslimman.com/seerah.");
        if (subData.hasActiveSubscription) throw new Error("You already have an active subscription. Manage it at themuslimman.com/billing.");
        if (subData.hasAccess)             throw new Error("You already have access through another plan.");
        throw new Error(subData.error ?? "Could not prepare payment. Please try again.");
      }

      clientSecretRef.current = subData.clientSecret;
      return subData.clientSecret as string;
    },
    [config, isAuthenticated, plan]
  );

  // ── Check for already-purchased session before submitting ──────────────────
  async function guardDuplicatePurchase(): Promise<boolean> {
    try {
      const res = await fetch("/api/stripe/check-access");
      if (res.ok) {
        const { hasAccess } = await res.json();
        if (hasAccess) {
          window.location.href = "/seerah";
          return true;
        }
      }
    } catch { /* proceed */ }
    return false;
  }

  // ── Express checkout (Apple Pay / Google Pay) ─────────────────────────────
  async function handleExpressConfirm(event: ExpressCheckoutConfirmEvent) {
    if (!stripe || !elements) { event.paymentFailed({ reason: "fail" }); return; }
    if (await guardDuplicatePurchase()) return;
    setProcessing(true);

    const walletEmail = email.trim() || "";
    const walletName  = fullName.trim() || "Student";

    let secret: string;
    try {
      secret = await getClientSecret(walletName, walletEmail);
    } catch (err) {
      event.paymentFailed({ reason: "fail" });
      setProcessing(false);
      setError(err instanceof Error ? err.message : "Could not prepare payment.");
      return;
    }

    trackCheckoutEvent("checkout_payment_started", { method: "express" });

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret: secret,
      confirmParams: { return_url: returnUrl },
      redirect: "if_required",
    });

    if (confirmError) {
      event.paymentFailed({ reason: "fail" });
      trackCheckoutEvent("payment_failed", { error_code: confirmError.code, method: "express" });
      setError(friendlyError(confirmError));
      setProcessing(false);
    } else if (paymentIntent?.status === "succeeded") {
      trackCheckoutEvent("payment_succeeded", { method: "express" });
      onSuccess(paymentIntent.id);
    } else if (paymentIntent?.status === "processing") {
      onRedirecting();
      window.location.href = returnUrl;
    } else {
      // Stripe is about to redirect (3DS or bank redirect)
      onRedirecting();
    }
  }

  // ── Regular card submit ───────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || processing) return;

    const trimmedName  = fullName.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName)  { setError("Please enter your full name."); return; }
    if (!trimmedEmail.includes("@")) { setError("Please enter a valid email address."); return; }
    if (await guardDuplicatePurchase()) return;

    setProcessing(true);
    setError(null);
    trackCheckoutEvent("checkout_payment_started", { method: "card" });

    const card = elements.getElement(CardElement);
    if (!card) {
      setError("Card element not found. Please refresh the page.");
      setProcessing(false);
      return;
    }

    let secret: string;
    try {
      secret = await getClientSecret(trimmedName, trimmedEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not prepare payment.");
      setProcessing(false);
      trackCheckoutEvent("payment_failed", { error_code: "setup_error" });
      return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(secret, {
      payment_method: {
        card,
        billing_details: { name: trimmedName, email: trimmedEmail },
      },
      return_url: returnUrl,
    });

    if (confirmError) {
      trackCheckoutEvent("payment_failed", { error_code: confirmError.code, method: "card" });
      setError(friendlyError(confirmError));
      setProcessing(false);
    } else if (paymentIntent?.status === "succeeded") {
      trackCheckoutEvent("payment_succeeded", { method: "card" });
      onSuccess(paymentIntent.id);
    } else if (paymentIntent?.status === "processing") {
      onRedirecting();
      window.location.href = returnUrl;
    } else {
      // 3DS — Stripe navigates away
      onRedirecting();
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Express checkout (Apple Pay / Google Pay) */}
      <div
        className={showExpress ? "rounded-xl border border-zinc-600 bg-zinc-800/40 p-3" : undefined}
      >
        <ExpressCheckoutElement
          onConfirm={handleExpressConfirm}
          onCancel={() => {
            trackCheckoutEvent("payment_cancelled", { method: "express" });
            setProcessing(false);
          }}
          onReady={({ availablePaymentMethods }) => {
            const methods = availablePaymentMethods ? Object.keys(availablePaymentMethods) : [];
            trackCheckoutEvent("payment_method_available", { available_methods: methods.length > 0 ? methods : ["card"] });
            if (methods.length > 0) setShowExpress(true);
          }}
          options={{
            paymentMethods: { applePay: "auto", googlePay: "auto", link: "auto" },
            buttonType: { applePay: "buy", googlePay: "buy" },
          }}
        />
      </div>

      {showExpress && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-xs text-zinc-400">or pay with card</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>
      )}

      {/* Name + Email (guest checkout only) */}
      {!isAuthenticated && (
        <div className="space-y-3">
          <div>
            <label htmlFor="iqc-name" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Full name
            </label>
            <input
              id="iqc-name"
              type="text"
              value={fullName}
              onChange={(e) => onFullNameChange(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              className="w-full px-3.5 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-text placeholder-zinc-500 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50"
              required
            />
          </div>
          <div>
            <label htmlFor="iqc-email" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Email address
            </label>
            <input
              id="iqc-email"
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              inputMode="email"
              className="w-full px-3.5 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-text placeholder-zinc-500 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50"
              required
            />
          </div>
        </div>
      )}

      {/* Card details */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Card details</label>
        <div className="px-3.5 py-3.5 rounded-xl bg-zinc-800 border border-zinc-700 focus-within:border-gold focus-within:ring-1 focus-within:ring-gold/50 transition-colors">
          <CardElement
            options={{
              style: {
                base: {
                  color: "#f4f4f5",
                  fontFamily: "inherit",
                  fontSize: "15px",
                  fontSmoothing: "antialiased",
                  "::placeholder": { color: "#71717a" },
                  iconColor: "#a1a1aa",
                },
                invalid: { color: "#f87171", iconColor: "#f87171" },
              },
              hidePostalCode: true,
            }}
            onReady={() => trackCheckoutEvent("payment_element_loaded")}
            onChange={(e) => {
              if (!paymentFormStartedRef.current && !e.empty) {
                paymentFormStartedRef.current = true;
                trackCheckoutEvent("payment_form_started", { method: "card" });
              }
              if (e.complete) trackCheckoutEvent("payment_method_presented", { method: "card" });
            }}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30"
        >
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-red-300 leading-relaxed">{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={processing || !stripe}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-base transition-all shadow-lg shadow-gold/25 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background min-h-[52px]"
        aria-busy={processing}
      >
        {processing ? (
          <>
            <span className="w-4 h-4 border-2 border-ink/30 border-t-ink rounded-full animate-spin" aria-hidden="true" />
            Processing…
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" aria-hidden="true" />
            {submitButtonLabel(plan)}
          </>
        )}
      </button>

      {/* Trust badges */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
        {["Instant access", "Cancel anytime", "7-day refund guarantee", "Secure checkout"].map((t) => (
          <span key={t} className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Check className="w-3 h-3 text-zinc-500" aria-hidden="true" />
            {t}
          </span>
        ))}
      </div>
    </form>
  );
}

// ── Outer checkout step ───────────────────────────────────────────────────────

interface CheckoutStepProps {
  config: InfluencerConfig;
  isAuthenticated: boolean;
  userEmail?: string;
  onBack: () => void;
  onSuccess: (paymentIntentId: string) => void;
  onRedirecting: () => void;
}

const STRIPE_APPEARANCE = {
  theme: "night" as const,
  variables: {
    colorPrimary:    "#c9a84c",
    colorBackground: "#1c1c1c",
    colorText:       "#e5e5e5",
    colorDanger:     "#ef4444",
    fontFamily:      "system-ui, sans-serif",
    borderRadius:    "12px",
    spacingUnit:     "4px",
  },
};

export function CheckoutStep({
  config,
  isAuthenticated,
  userEmail = "",
  onBack,
  onSuccess,
  onRedirecting,
}: CheckoutStepProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<PlanOption>("monthly");
  const [fullName, setFullName]             = useState("");
  const [email, setEmail]                   = useState(userEmail);

  const selectedPlan = PLAN_OPTIONS.find(p => p.id === selectedPlanId)!;

  function handlePlanChange(id: PlanOption) {
    setSelectedPlanId(id);
    const plan = PLAN_OPTIONS.find((p) => p.id === id)!;
    trackEvent(
      "plan_selected",
      { influencer_slug: config.slug, ...planAnalyticsProps(plan.analyticsPlanId) },
      { allowDuplicates: true, creator: config.slug }
    );
  }

  return (
    <div className="h-full overflow-y-auto flex flex-col">
      <div className="w-full max-w-lg mx-auto px-5 py-6 flex flex-col gap-6 flex-1">

        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded min-h-[44px]"
            aria-label="Go back to the free lesson"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back
          </button>
        </div>

        {/* Value reminder */}
        <p className="text-xs text-zinc-400 text-center leading-relaxed -mb-1">
          Every plan includes all 100 lessons, videos, readings, slides, flashcards, quizzes, mind maps, and progress tracking.
        </p>

        {/* Plan picker */}
        <div>
          <h2 className="text-xs font-bold text-gold uppercase tracking-wider mb-3">Choose your plan</h2>
          <div className="flex flex-col gap-3">
            {(
              [
                { title: "Monthly",   plans: PLAN_OPTIONS.slice(0, 2) },
                { title: "Lifetime",  plans: PLAN_OPTIONS.slice(2, 4) },
              ] as const
            ).map((section) => (
              <div key={section.title}>
                <p className="text-[11px] font-semibold text-gold-light uppercase tracking-widest mb-2 text-center">
                  {section.title}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {section.plans.map((plan) => {
                    const isActive = selectedPlanId === plan.id;
                    const Icon = plan.icon;
                    return (
                      <button
                        key={plan.id}
                        onClick={() => handlePlanChange(plan.id)}
                        className={[
                          "relative flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                          isActive
                            ? plan.id === "family"
                              ? "border-gold bg-gold/15 shadow-lg shadow-gold/20"
                              : "border-gold/60 bg-gold/10"
                            : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-600",
                        ].join(" ")}
                        aria-pressed={isActive}
                      >
                        {plan.badge && (
                          <span className="absolute -top-2 right-2 text-[10px] font-bold bg-gold text-ink px-2 py-0.5 rounded-full">
                            {plan.badge}
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Icon className={`w-3.5 h-3.5 ${isActive ? "text-gold" : "text-zinc-500"}`} aria-hidden="true" />
                          <span className={`text-xs font-semibold ${isActive ? "text-gold" : "text-zinc-300"}`}>
                            {plan.label}
                          </span>
                        </div>
                        <p className={`text-lg font-extrabold leading-none ${isActive ? "text-text" : "text-zinc-300"}`}>
                          {formatPrice(plan.price)}
                          <span className="text-xs font-normal text-zinc-400 ml-0.5">{plan.unit}</span>
                        </p>
                        <p className="text-[10px] text-zinc-400 leading-snug mt-0.5">{plan.sublabel}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stripe form — all 4 plans handled inline */}
        <Elements
          key={selectedPlanId}
          stripe={getStripePromise()}
          options={{ appearance: STRIPE_APPEARANCE }}
        >
          <InnerCheckoutForm
            config={config}
            plan={selectedPlan}
            fullName={fullName}
            email={email}
            onFullNameChange={setFullName}
            onEmailChange={setEmail}
            isAuthenticated={isAuthenticated}
            onSuccess={onSuccess}
            onRedirecting={onRedirecting}
          />
        </Elements>

      </div>
    </div>
  );
}
