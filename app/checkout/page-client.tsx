"use client";

import { useEffect, useState, useRef } from "react";
import { loadStripe } from "@stripe/stripe-js";
import type { StripeExpressCheckoutElementConfirmEvent } from "@stripe/stripe-js";
import {
  Elements,
  ExpressCheckoutElement,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  Check, Lock, User, Users, ArrowLeft, ArrowRight,
  Tag, Eye, EyeOff, RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { PLANS, formatPrice } from "@/lib/stripe-config";
import { clearCreatorPromo, getCreatorPromo, getCreatorPromoConfig } from "@/lib/creator-promos";
import CheckoutFunnelTracker, { sendCheckoutEvent, markPaymentStartedInSession, markPaymentMethodInSession } from "./checkout-funnel-tracker";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// ── Types ─────────────────────────────────────────────────────────────────────

type Audience = "individual" | "family";
type Billing  = "lifetime" | "monthly" | "trial";
type AuthMode = "signup" | "login";

interface AppliedCoupon {
  code: string;
  label: string;
  discount: number;
  finalPrice: number;
}

/**
 * Maps a Stripe StripeError to a human-friendly message.
 * 3DS / authentication failures get a specific message that encourages
 * the user to retry or try Apple Pay / Google Pay.
 */
function friendlyPaymentError(err: { code?: string; decline_code?: string; message?: string }): string {
  const code         = err.code ?? "";
  const declineCode  = err.decline_code ?? "";
  const msgLower     = (err.message ?? "").toLowerCase();

  // ── 3DS / authentication failures ────────────────────────────────────────
  const authCodes = new Set([
    "payment_intent_authentication_failure",
    "authentication_required",
    "card_authentication_required",
  ]);
  const isAuthFailure =
    authCodes.has(code) ||
    authCodes.has(declineCode) ||
    msgLower.includes("authentication") ||
    msgLower.includes("3d secure") ||
    msgLower.includes("3ds");

  if (isAuthFailure) {
    return "Your bank could not verify this payment. Please try again, use a different card, or use Apple Pay / Google Pay if available.";
  }

  // ── Bank blocked / international transaction ──────────────────────────────
  // "do_not_honor" is the most common decline for international cards (e.g. AU banks
  // that block cross-border online transactions by default).
  if (
    declineCode === "do_not_honor" ||
    declineCode === "transaction_not_allowed" ||
    declineCode === "card_not_supported" ||
    declineCode === "service_not_allowed"
  ) {
    return "Your bank declined this payment. This often happens when your bank blocks international or online transactions. Please contact your bank to enable these, then try again — or use a different card or Apple Pay / Google Pay.";
  }

  // ── Insufficient funds ───────────────────────────────────────────────────
  if (declineCode === "insufficient_funds") {
    return "Your card has insufficient funds. Please use a different card.";
  }

  // ── Expired card ─────────────────────────────────────────────────────────
  if (code === "expired_card" || declineCode === "expired_card") {
    return "Your card has expired. Please use a different card.";
  }

  // ── Wrong CVC / number ───────────────────────────────────────────────────
  if (code === "incorrect_cvc" || declineCode === "incorrect_cvc") {
    return "Your card's security code (CVV/CVC) is incorrect. Please double-check the 3-digit code on the back of your card.";
  }
  if (code === "incorrect_number" || code === "invalid_number") {
    return "Your card number is invalid. Please double-check all 16 digits and try again.";
  }

  // ── Too many attempts ────────────────────────────────────────────────────
  if (declineCode === "card_velocity_exceeded") {
    return "Too many payment attempts on this card. Please wait a few minutes and try again, or use a different card.";
  }

  // ── Generic / unknown decline — keep Stripe's message, add guidance ───────
  const base = err.message ?? "Your payment was declined.";
  return `${base} Please try again, use a different card, or contact support at support@themuslimman.com.`;
}

/**
 * Converts Stripe elements.submit() validation errors into actionable messages.
 * These fire before any server call — purely client-side card field validation.
 */
function friendlySubmitError(err: { code?: string; message?: string }): string {
  switch (err.code) {
    case "incomplete_number":
      return "Your card number is incomplete. Please enter all digits on your card.";
    case "invalid_number":
      return "Your card number appears to be invalid. Please double-check the number and try again.";
    case "incomplete_expiry":
      return "Your card's expiration date is incomplete.";
    case "invalid_expiry_year_past":
      return "Your card's expiration year is in the past. Please use a different card.";
    case "incomplete_cvc":
      return "Your card's security code (CVV/CVC) is incomplete.";
    case "incomplete_zip":
      return "Please enter your card's billing postal code.";
    default:
      // Fall back to Stripe's own message — it's usually descriptive enough.
      return err.message ?? "Please check your card details and try again.";
  }
}

/** Derive the canonical plan key from audience + billing. */
function toPlanKey(audience: Audience, billing: Billing) {
  if (audience === "individual" && billing === "lifetime") return "complete"        as const;
  if (audience === "individual" && billing === "monthly")  return "monthly"         as const;
  if (audience === "individual" && billing === "trial")    return "individualTrial" as const;
  if (audience === "family"     && billing === "lifetime") return "family"          as const;
  if (audience === "family"     && billing === "trial")    return "familyTrial"     as const;
  return "familyMonthly" as const;
}

/** Derive the correct Stripe API endpoint. */
function toEndpoint(audience: Audience, billing: Billing): string {
  if (billing === "trial")                                 return "/api/stripe/create-trial-intent";
  if (audience === "individual" && billing === "lifetime") return "/api/stripe/create-payment-intent";
  if (audience === "individual" && billing === "monthly")  return "/api/stripe/create-subscription-intent";
  if (audience === "family"     && billing === "lifetime") return "/api/stripe/create-family-payment-intent";
  return "/api/stripe/create-family-subscription-intent";
}

/** Derive the payment success return URL. */
function toReturnUrl(audience: Audience, billing: Billing): string {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? "https://themuslimman.com");
  if (billing === "trial" && audience === "family")        return `${base}/payment/success?type=family-subscription&billing=trial`;
  if (billing === "trial")                                 return `${base}/payment/success?type=subscription&billing=trial`;
  if (audience === "individual" && billing === "monthly")  return `${base}/payment/success?type=subscription`;
  if (audience === "family"     && billing === "lifetime") return `${base}/payment/success?type=family`;
  if (audience === "family"     && billing === "monthly")  return `${base}/payment/success?type=family-subscription`;
  return `${base}/payment/success`;
}

// ── Stripe payment form ───────────────────────────────────────────────────────

function CheckoutForm({
  audience,
  billing,
  finalPrice,
  creator,
  promoCode,
  getOrCreateClientSecret,
  isAuthenticated,
  authFormRef,
  authLoading: authInProgress,
}: {
  audience: Audience;
  billing: Billing;
  finalPrice: number;
  creator?: string;
  promoCode?: string;
  getOrCreateClientSecret: (name: string, email: string) => Promise<string>;
  isAuthenticated: boolean;
  authFormRef: React.RefObject<{ fullName: string; email: string; password: string; confirmPassword: string }>;
  authLoading: boolean;
}) {
  const stripe   = useStripe();
  const elements = useElements();
  const [error, setError]           = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showExpressCheckout, setShowExpressCheckout] = useState(false);

  const returnUrl = toReturnUrl(audience, billing);

  /** Flag the session as purchased so the abandonment tracker won't fire. */
  const markPurchased = () => {
    try { sessionStorage.setItem("checkout_purchased", "1"); } catch { /* storage blocked */ }
  };

  // Keep Stripe's internal amount in sync when a promo is applied so Apple Pay /
  // Google Pay show the correct amount in the wallet sheet without remounting.
  useEffect(() => {
    if (!elements || billing === "trial" || finalPrice <= 0) return;
    elements.update({ amount: finalPrice });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalPrice]);

  // Track which payment method the user has selected (card / applePay / googlePay).
  const selectedMethodRef = useRef<string | null>(null);

  // Lightweight checkout stage logger. Enriches each event with plan context.
  // Wrapped in try/catch — tracking must never crash checkout.
  const logStage = (stage: string, extra?: Record<string, unknown>) => {
    try {
      const ctx = {
        plan:             `${audience}-${billing}`,
        plan_type:        audience,
        billing_interval: billing,
        amount:           finalPrice,
        currency:         "usd",
        payment_method:   selectedMethodRef.current ?? undefined,
        ...extra,
      };
      console.log(`[CHECKOUT:${stage}]`, ctx);
      if (creator) sendCheckoutEvent(creator, stage, { ...ctx, promoCode });
    } catch { /* never block checkout */ }
  };

  // Called by the card form submit button
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || processing || authInProgress) return;

    // ── Guard: full name required ──────────────────────────────────────────────
    if (!authFormRef.current?.fullName?.trim()) {
      setError("Please enter your full name to continue.");
      return;
    }

    // ── Guard: amount must be positive ────────────────────────────────────────
    if (finalPrice <= 0) {
      setError("Something went wrong with your order. Please refresh and try again.");
      return;
    }

    setProcessing(true);
    setError(null);
    const fullNamePresent = !!(authFormRef.current?.fullName?.trim());
    const emailPresent    = !!(authFormRef.current?.email?.trim() || isAuthenticated);
    markPaymentStartedInSession(selectedMethodRef.current ?? undefined);
    logStage("payment_started", { full_name_present: fullNamePresent, email_prefilled: emailPresent });
    logStage("payment_submitted", { full_name_present: fullNamePresent, email_prefilled: emailPresent });

    // ── Step 1: Validate card details first (Stripe deferred intent pattern) ──
    // Per Stripe docs, elements.submit() must be called BEFORE creating the server
    // intent. It validates card fields, locks the UI, and collects any required
    // user actions (e.g. BECS OTP). Doing this first gives immediate feedback if
    // the card number is incomplete — before any network calls.
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(friendlySubmitError(submitError));
      setProcessing(false);
      return;
    }

    // ── Step 2: Ensure account + intent exist ─────────────────────────────────
    let clientSecret: string;
    try {
      const name  = authFormRef.current?.fullName ?? "";
      const email = authFormRef.current?.email    ?? "";
      clientSecret = await getOrCreateClientSecret(name, email);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "__FREE_ACCESS__") {
        // $0 promo — no Stripe payment; free-claim UI should now be visible.
        setProcessing(false);
        return;
      }
      if (msg === "__AUTH_FAILED__") {
        // Auth error already shown in the name/email form above payment.
        setProcessing(false);
        return;
      }
      setError(msg || "Unable to prepare payment. Please try again.");
      setProcessing(false);
      return;
    }

    // ── Step 3: Pre-flight guard — skip charge if user already has access ──────
    try {
      const sessionRes = await fetch("/api/stripe/check-access");
      if (sessionRes.status === 401) {
        setError("Your session has expired. Please sign in again to complete your purchase.");
        setProcessing(false);
        return;
      }
      if (sessionRes.ok) {
        const { hasAccess } = await sessionRes.json();
        if (hasAccess) {
          logStage("payment_skipped_already_has_access");
          window.location.href = "/seerah";
          return;
        }
      }
    } catch {
      // Network error — proceed; Stripe handles idempotency.
    }

    try {
      if (billing === "trial") {
        // Free trial: save card via SetupIntent — no charge today.
        const { error: confirmError, setupIntent } = await stripe.confirmSetup({
          elements,
          clientSecret,
          confirmParams: { return_url: returnUrl },
          redirect: "if_required",
        });
        if (confirmError) {
          setError(confirmError.message ?? "Card setup failed. Please try again.");
          setProcessing(false);
        } else if (setupIntent?.status === "succeeded") {
          // Setup completed in-page — navigate to success
          markPurchased();
          window.location.href = returnUrl;
        }
        // If redirect happened, browser navigates away — no further action needed
      } else {
        const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
          elements,
          clientSecret,
          confirmParams: { return_url: returnUrl },
          redirect: "if_required",
        });
        if (confirmError) {
          console.error("[CHECKOUT] payment confirmation failed:", confirmError.code, confirmError.decline_code, confirmError.message);
          logStage("payment_failed", { errorCode: confirmError.code ?? "unknown" });
          setError(friendlyPaymentError(confirmError));
          setProcessing(false);
        } else if (paymentIntent?.status === "succeeded") {
          logStage("payment_succeeded");
          markPurchased();
          const url = new URL(returnUrl, window.location.origin);
          url.searchParams.set("payment_intent", paymentIntent.id);
          url.searchParams.set("payment_intent_client_secret", paymentIntent.client_secret ?? "");
          url.searchParams.set("redirect_status", "succeeded");
          window.location.href = url.toString();
        } else if (paymentIntent?.status === "processing") {
          logStage("payment_submitted", { status: "processing" });
          markPurchased();
          const url = new URL(returnUrl, window.location.origin);
          url.searchParams.set("payment_intent", paymentIntent.id);
          url.searchParams.set("payment_intent_client_secret", paymentIntent.client_secret ?? "");
          url.searchParams.set("redirect_status", "processing");
          window.location.href = url.toString();
        } else if (paymentIntent) {
          // Stripe returned an unexpected status — unlock the UI so the user can retry.
          logStage("payment_failed", { errorCode: paymentIntent.status });
          setError("Payment could not be completed. Please try again or use a different payment method.");
          setProcessing(false);
        }
        // If Stripe redirected the browser (3DS etc.), no further action needed.
      }
    } catch {
      setError("Connection lost. Please check your internet and try again.");
      setProcessing(false);
    }
  };

  // Called by Apple Pay / Google Pay / Samsung Pay / Link after wallet auth
  const handleExpressConfirm = async (event: StripeExpressCheckoutElementConfirmEvent) => {
    if (!stripe || !elements || processing || authInProgress) return;
    // Lock immediately — prevents duplicate PIs from rapid double-tap on wallet button.
    setProcessing(true);

    // Wallet payments may provide billing details (name/email from Apple/Google Wallet).
    // Use those to create an account if the user hasn't filled in the name/email fields yet.
    const walletName  = event.billingDetails?.name?.trim() || authFormRef.current?.fullName?.trim() || "";
    const walletEmail = event.billingDetails?.email ?? authFormRef.current?.email ?? "";

    if (!walletName) {
      event.paymentFailed({ reason: "fail" });
      setProcessing(false);
      setError("Please enter your full name in the form above before using express checkout.");
      return;
    }

    // ── Step 1: Ensure account + intent ───────────────────────────────────────
    let clientSecret: string;
    try {
      clientSecret = await getOrCreateClientSecret(walletName, walletEmail);
    } catch (err) {
      event.paymentFailed({ reason: "fail" });
      setProcessing(false);
      const msg = err instanceof Error ? err.message : "";
      if (msg === "__FREE_ACCESS__" || msg === "__AUTH_FAILED__") return;
      // Google Pay / Apple Pay may not provide an email in some setups.
      // Show a targeted message so the user knows what to do.
      if (msg.includes("email")) {
        setError("Please enter your email address in the form above, then try again.");
      } else {
        setError(msg || "Unable to prepare payment. Please try again.");
      }
      return;
    }

    // ── Step 2: Pre-flight duplicate guard ────────────────────────────────────
    try {
      const sessionRes = await fetch("/api/stripe/check-access");
      if (sessionRes.status === 401) {
        event.paymentFailed({ reason: "fail" });
        setProcessing(false);
        setError("Your session has expired. Please refresh the page to continue.");
        return;
      }
      if (sessionRes.ok) {
        const { hasAccess } = await sessionRes.json();
        if (hasAccess) {
          logStage("payment_skipped_already_has_access", { method: "express" });
          window.location.href = "/seerah";
          return;
        }
      }
    } catch {
      // Network error — proceed; Stripe handles idempotency.
    }

    setError(null);
    markPaymentStartedInSession("express");
    logStage("payment_started", { method: "express", full_name_present: !!walletName, email_prefilled: !!walletEmail });
    try {
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: { return_url: returnUrl },
        redirect: "if_required",
      });
        if (confirmError) {
          event.paymentFailed({ reason: "fail" });
          console.error("[CHECKOUT] express payment failed:", confirmError.code, confirmError.decline_code, confirmError.message);
          logStage("payment_failed", { errorCode: confirmError.code ?? "unknown", method: "express" });
          setError(friendlyPaymentError(confirmError));
        setProcessing(false);
      } else if (paymentIntent?.status === "succeeded") {
        logStage("payment_succeeded", { method: "express" });
        markPurchased();
        const url = new URL(returnUrl, window.location.origin);
        url.searchParams.set("payment_intent", paymentIntent.id);
        url.searchParams.set("payment_intent_client_secret", paymentIntent.client_secret ?? "");
        url.searchParams.set("redirect_status", "succeeded");
        window.location.href = url.toString();
      } else if (paymentIntent?.status === "processing") {
        logStage("payment_submitted", { status: "processing", method: "express" });
        markPurchased();
        const url = new URL(returnUrl, window.location.origin);
        url.searchParams.set("payment_intent", paymentIntent.id);
        url.searchParams.set("payment_intent_client_secret", paymentIntent.client_secret ?? "");
        url.searchParams.set("redirect_status", "processing");
        window.location.href = url.toString();
      } else if (paymentIntent) {
        event.paymentFailed({ reason: "fail" });
        logStage("payment_failed", { errorCode: paymentIntent.status, method: "express" });
        setError("Payment could not be completed. Please try again or use a different card.");
        setProcessing(false);
      }
    } catch {
      event.paymentFailed({ reason: "fail" });
      setError("Connection lost. Please check your internet and try again.");
      setProcessing(false);
    }
  };

  // True for any creator promo code, not just browniesaadi
  const isCreatorPromo = !!(creator && creator.length > 0);

  // Ann Arbor student offer uses custom labels everywhere
  const isAnnArborStudent = creator === "annarbor" && billing === "lifetime" && audience === "individual";

  const buttonLabel =
    billing === "trial"
      ? "Start Free Trial — $0 Today"
      : billing === "monthly"
      ? audience === "family"
        ? `Start Family Access — ${formatPrice(finalPrice)}/month`
        : `Start Individual Access — ${formatPrice(finalPrice)}/month`
      : isAnnArborStudent
        ? `Get Student Lifetime Access — ${formatPrice(finalPrice)}`
        : audience === "family"
          ? `Get Family Lifetime Access — ${formatPrice(finalPrice)}`
          : `Get Individual Lifetime Access — ${formatPrice(finalPrice)}`;

  const trustBadges =
    billing === "trial"
      ? [
          "Due today: $0",
          "Cancel anytime before trial ends",
          "Secure checkout",
        ]
      : billing === "monthly"
      ? ([
          `Due today: ${formatPrice(finalPrice)}`,
          "Instant access after payment.",
          "Cancel anytime.",
          "7-day refund guarantee.",
        ])
      : [
          "One-time payment — no recurring charge",
          "7-day refund guarantee",
          "Secure checkout",
          ...(isCreatorPromo ? ["Special offer discount applied"] : []),
        ];

  const whatHappensNext =
    billing === "trial"
      ? [
          "Your card is saved but not charged today.",
          "You get full access immediately.",
          "After 7 days, you're billed monthly. Cancel anytime.",
        ]
      : billing === "monthly"
      ? [
          "Get instant access after payment.",
          "Set your password from your email.",
          "Start Part 1 and continue at your own pace.",
        ]
      : [
          "Get instant access after payment.",
          "Set your password from your email.",
          "Start Part 1 and continue at your own pace.",
        ];

  return (
    <div className="space-y-5">
      {/* Express checkout: Apple Pay, Google Pay, Samsung Pay, Link
          Hidden for trial (SetupIntent flow — incompatible with confirmPayment).
          Enabled for both lifetime and monthly (subscription PaymentIntent). */}
      {billing !== "trial" && (
        <>
          {/* Container must never be display:none — hiding before mount prevents
              Google Pay / Apple Pay from initializing. Stripe requires the element
              to be in a visible container so it can detect wallet availability.
              The border wrapper is applied once onReady confirms a button exists so
              we don't flash an empty bordered box while Stripe loads. */}
          <div
            className={
              showExpressCheckout
                ? "rounded-xl border border-zinc-600 bg-zinc-800/40 p-3"
                : undefined
            }
          >
            <ExpressCheckoutElement
              onConfirm={handleExpressConfirm}
              onReady={({ availablePaymentMethods }) => {
                const methods = availablePaymentMethods ? Object.keys(availablePaymentMethods) : [];
                const hasApplePay  = methods.includes("applePay");
                const hasGooglePay = methods.includes("googlePay");
                if (methods.length > 0) {
                  setShowExpressCheckout(true);
                  logStage("express_checkout_visible", { methods });
                }
                logStage("payment_method_available", {
                  available_methods:    methods.length > 0 ? methods : ["card"],
                  apple_pay_available:  hasApplePay,
                  google_pay_available: hasGooglePay,
                  card_available:       true,
                });
              }}
              options={{
                paymentMethods: { applePay: "auto", googlePay: "auto", link: "auto" },
                buttonType:  { applePay: "buy", googlePay: "buy" },
                buttonTheme: { applePay: "white-outline", googlePay: "white" },
                layout: { maxColumns: 1, maxRows: 3, overflow: "auto" },
              }}
            />
          </div>
          {showExpressCheckout && (
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <div className="flex-1 h-px bg-zinc-700/60" />
              <span>or pay with card</span>
              <div className="flex-1 h-px bg-zinc-700/60" />
            </div>
          )}
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Apple Pay, Google Pay, Link appear above via ExpressCheckoutElement — suppress duplicates.
            Cash App requires setup_future_usage=off_session to be absent; hide it on trial. */}
        <PaymentElement
          onReady={() => logStage("payment_element_loaded")}
          onChange={(e) => {
            if (e.value?.type) {
              selectedMethodRef.current = e.value.type;
              markPaymentMethodInSession(e.value.type);
              logStage("payment_method_selected", { method: e.value.type });
            }
          }}
          options={{
            wallets: { applePay: "never", googlePay: "never", link: "never" },
          }}
        />
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
          {processing ? "Processing…" : buttonLabel}
        </button>

        {/* Contextual trust badges */}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 pt-1">
          {trustBadges.map((badge) => (
            <span key={badge} className="flex items-center gap-1 text-xs text-zinc-400">
              <Check className="w-3 h-3 text-green-400 flex-shrink-0" />
              {badge}
            </span>
          ))}
        </div>

        {/* Safety valve — give hesitant users a free path instead of losing them */}
        <p className="text-center text-xs text-zinc-500">
          Not ready yet?{" "}
          <a
            href="/watch-free"
            onClick={() => creator && sendCheckoutEvent(creator, "checkout_escape_clicked", { escape_type: "watch_free", plan: `${audience}-${billing}` })}
            className="underline hover:text-zinc-300 transition-colors"
          >
            Watch Part 1 free first
          </a>
        </p>

        {/* What happens next */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">What happens next</p>
          <ol className="space-y-1.5">
            {whatHappensNext.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-zinc-500 font-bold mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <p className="text-xs text-zinc-600 text-center leading-relaxed">
          Built from Qur&apos;an, authentic hadith, and classical Seerah sources. Educational tool · Not a fatwa site.
        </p>

        <p className="text-xs text-zinc-600 text-center leading-relaxed">
          By {billing === "trial" ? "starting your trial" : billing === "monthly" ? "subscribing" : "purchasing"} you agree to our{" "}
          <a href="/terms"   className="underline hover:text-zinc-400 transition-colors">Terms of Service</a>{", "}
          <a href="/privacy" className="underline hover:text-zinc-400 transition-colors">Privacy Policy</a>{", and "}
          <a href="/refund"  className="underline hover:text-zinc-400 transition-colors">Refund Policy</a>.
        </p>
      </form>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface CheckoutPageClientProps {
  userEmail?: string;
  userPlanType?: string | null;
  initialAudience?: Audience;
  initialBilling?: Billing;
  initialClientSecret?: string | null;
  initialBasePrice?: number;
  initialFinalPrice?: number;
  initialDiscountAmount?: number;
  initialAppliedPromo?: string | null;
  initialAppliedPromoLabel?: string | null;
  initialFreeAccess?: boolean;
  /** Passed from the server to avoid useSearchParams() SSR/CSR hydration mismatches. */
  initialPromoParam?: string | null;
  /**
   * True when the user is an individual lifetime holder upgrading to Family Lifetime.
   * When set, the billing selector is locked to "lifetime" only — trial and monthly
   * are not valid paths for existing lifetime buyers.
   */
  isLifetimeUpgrade?: boolean;
  /**
   * The `source` URL param (e.g. "browniesaadi"). When set, checkout enters
   * influencer confirmation mode: the plan selector is hidden by default and
   * the user sees a simple "Your selected offer" confirmation view instead.
   */
  initialSourceParam?: string | null;
  /**
   * Email collected upstream (e.g. Seerah Checkup funnel email gate).
   * Pre-fills the guest checkout form and auto-starts the Stripe intent.
   */
  initialEmail?: string | null;
  /**
   * First name collected upstream. Used alongside initialEmail to skip the
   * name field. Only effective when initialEmail is also provided.
   */
  initialName?: string | null;
  /** Quiz score from the Seerah Checkup funnel (0–100). */
  initialQuizScore?: number | null;
  /** Result type from the quiz ("scattered" | "partial" | "strong"). */
  initialResultType?: string | null;
}

// ── Main checkout content ─────────────────────────────────────────────────────

// Plan-specific promo codes that must be resolved to the correct variant based on
// the selected audience. Add any new plan-paired codes here.
// All creator / location discounts have been removed. No active promo codes apply.
// Legacy codes are still recognised server-side for backward compatibility
// (recovery emails, old bookmarks) but no new URLs embed promo= params.
const COMMUNITY_CODE_MAP: Partial<Record<string, Record<"individual" | "family", string>>> = {};

/** Returns true when running inside an Instagram / TikTok / Facebook in-app browser. */
function useIsInAppBrowser() {
  const [inApp, setInApp] = useState(false);
  useEffect(() => {
    const ua = navigator.userAgent;
    setInApp(/Instagram|FBAN|FBAV|FB_IAB|BytedanceWebview|TikTok|Musical\.ly|snapchat/i.test(ua));
  }, []);
  return inApp;
}

function CheckoutPageContent({
  userEmail = "",
  userPlanType = null,
  initialAudience = "individual",
  initialBilling  = "lifetime",
  initialClientSecret = null,
  initialBasePrice: serverBasePrice,
  initialFinalPrice: serverFinalPrice,
  initialDiscountAmount: serverDiscount = 0,
  initialAppliedPromo = null,
  initialAppliedPromoLabel = null,
  initialFreeAccess = false,
  initialPromoParam = null,
  initialSourceParam = null,
  isLifetimeUpgrade = false,
  initialEmail = null,
  initialName  = null,
  initialQuizScore  = null,
  initialResultType = null,
}: CheckoutPageClientProps) {
  // promoParam comes from the server prop — no useSearchParams() needed.
  // This guarantees server and client render the same initial HTML.
  const promoParam = initialPromoParam;
  const isInApp = useIsInAppBrowser();

  // Influencer confirmation mode: active when the user arrives from any influencer
  // landing page (source param matches a known creator) or carries a creator promo
  // code, and the plan is a lifetime plan. In this mode the plan selector is hidden
  // by default — the user sees "Your selected offer" and a "Change plan" link.
  const INFLUENCER_SOURCES = new Set([
    "browniesaadi", "deenresponds", "community", "annarbor", "dearborn", "theorthodoxmuslim",
  ]);
  const isInfluencerMode = !!(
    (initialSourceParam && INFLUENCER_SOURCES.has(initialSourceParam)) ||
    (promoParam && getCreatorPromoConfig(promoParam) !== null)
  ) && initialBilling === "lifetime";

  const [showPlanSelector, setShowPlanSelector] = useState(false);

  // ── Audience + billing state ───────────────────────────────────────────────
  const [audience, setAudience] = useState<Audience>(initialAudience);
  const [billing,  setBilling]  = useState<Billing>(initialBilling);

  // Ann Arbor student offer: customise labels in the offer panel and buttons
  const isAnnArborStudent = initialSourceParam === "annarbor" && billing === "lifetime" && audience === "individual";

  // Community codes are plan-specific: resolve to the correct variant based on
  // the selected audience (defined at module level to avoid per-render allocation).
  const resolvedPromoParam = promoParam
    ? (COMMUNITY_CODE_MAP[promoParam.toUpperCase()]?.[audience] ?? promoParam)
    : null;

  const planKey   = toPlanKey(audience, billing);
  const currentPlan = PLANS[planKey];
  const isLifetime  = billing === "lifetime";
  const isTrial     = billing === "trial";

  // Compute guest promo discount synchronously from the client-safe creator promo
  // config (20% × currentPlan.price). Because promoParam now comes from a server
  // prop (not useSearchParams), server and client always agree on the initial value
  // — no hydration mismatch, no async fetch race condition, always correct for the
  // currently selected plan.
  const creatorPromoConfig   = resolvedPromoParam ? getCreatorPromoConfig(resolvedPromoParam) : null;
  const guestCreatorDiscount = (creatorPromoConfig && isLifetime)
    ? Math.round(currentPlan.price * creatorPromoConfig.discountPercent / 100)
    : 0;

  // ── Auth state ─────────────────────────────────────────────────────────────
  const [isAuthenticated, setIsAuthenticated] = useState(!!userEmail);
  const [authEmail,  setAuthEmail]   = useState(userEmail);
  const [authMode,   setAuthMode]    = useState<AuthMode>("signup");
  const [showPass,   setShowPass]    = useState(false);
  const [authForm,   setAuthForm]    = useState({
    fullName:        initialName  ?? "",
    email:           initialEmail ?? "",
    password:        "",
    confirmPassword: "",
  });
  const [authError,  setAuthError]   = useState("");
  const [authLoading,setAuthLoading] = useState(false);
  // When a quiz-funnel email arrives via URL param, lock the field so the user
  // sees it's already set and only needs to enter their name.
  const [emailLocked, setEmailLocked] = useState(!!(initialEmail && !userEmail));
  // Auto-trigger: fires when the email field blurs with a valid name + email so the
  // Stripe payment form loads without requiring a separate "Continue to Payment" click.
  const autoDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [autoIntentStarted, setAutoIntentStarted] = useState(false);
  // AbortController ref: used to cancel in-flight guest-checkout + intent fetches
  // when the user clicks "Not you?" so no stale clientSecret can surface.
  const intentAbortRef = useRef<AbortController | null>(null);

  // Promo shown to guests before auth (URL ?promo= param preview).
  // The `forAudience` field tags which plan this discount was computed for so
  // a stale individual-plan response can never display on the family plan.
  const [guestPromo, setGuestPromo] = useState<{
    code: string;
    label: string;
    discount: number;
    forAudience: Audience;
  } | null>(null);

  // ── Payment state ──────────────────────────────────────────────────────────
  const [clientSecret,   setClientSecret]   = useState<string | null>(initialClientSecret);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [hasActiveSub,      setHasActiveSub]      = useState(false);
  // When hasActiveSub is true, this holds what plan type the user currently has
  // so we can show an upgrade CTA instead of a dead-end message.
  const [activeSubPlanType, setActiveSubPlanType] = useState<"individual" | "family" | null>(null);
  // True when the user has already used their one free trial and selected a trial plan.
  // Shows upgrade options (family monthly or family lifetime) instead of a payment form.
  const [trialAlreadyUsed,  setTrialAlreadyUsed]  = useState(false);
  // True while a subscription upgrade (individual → family monthly) is in progress.
  const [upgradeLoading,    setUpgradeLoading]    = useState(false);
  const [upgradeError,      setUpgradeError]      = useState<string | null>(null);
  const [freeAccess,     setFreeAccess]     = useState(initialFreeAccess);
  const [freeClaimLoading, setFreeClaimLoading] = useState(false);
  const [freeClaimError,   setFreeClaimError]   = useState<string | null>(null);

  const defaultBase = currentPlan.price;
  const [basePrice,     setBasePrice]     = useState<number>(serverBasePrice ?? defaultBase);
  const [finalPrice,    setFinalPrice]    = useState<number>(serverFinalPrice ?? defaultBase);
  const [discountAmount,setDiscountAmount]= useState(serverDiscount);

  const [couponInput,  setCouponInput]  = useState(initialAppliedPromo ?? promoParam ?? "");
  const [couponLoading,setCouponLoading]= useState(false);
  const [couponError,  setCouponError]  = useState<string | null>(null);
  const [appliedCoupon,setAppliedCoupon]= useState<AppliedCoupon | null>(
    initialAppliedPromo && initialAppliedPromoLabel && serverFinalPrice != null
      ? { code: initialAppliedPromo, label: initialAppliedPromoLabel, discount: serverDiscount, finalPrice: serverFinalPrice }
      : null
  );

  // ── Create payment / subscription intent ───────────────────────────────────

  // Ref mirrors: always hold the latest value so async callbacks avoid stale closures.
  const clientSecretRef    = useRef<string | null>(initialClientSecret ?? null);
  const isAuthenticatedRef = useRef<boolean>(!!userEmail);
  const authFormRef        = useRef({ fullName: "", email: "", password: "", confirmPassword: "" });

  // Keep refs in sync with state.
  useEffect(() => { isAuthenticatedRef.current = isAuthenticated; }, [isAuthenticated]);
  useEffect(() => { clientSecretRef.current    = clientSecret;    }, [clientSecret]);
  useEffect(() => { authFormRef.current        = authForm;        }, [authForm]);

  const createIntent = async (
    aud: Audience,
    bill: Billing,
    promoCode?: string
  ): Promise<{ discountAmount: number; finalPrice: number; clientSecret?: string } | null> => {
    // Stamp this call with a generation number. Any response that arrives after
    // a newer call has started will be silently discarded — this prevents a slow
    // 409 from an old trial intent overwriting the clientSecret from a faster
    // lifetime intent when the user switches plans quickly.
    const gen = ++intentGen.current;

    setLoading(true);
    setClientSecret(null);
    setFreeAccess(false);
    setError(null);
    setHasActiveSub(false);
    setActiveSubPlanType(null);
    setTrialAlreadyUsed(false);
    setUpgradeError(null);

    try {
      const endpoint = toEndpoint(aud, bill);
      const body: Record<string, unknown> = { planId: toPlanKey(aud, bill) };
      if (promoCode && bill === "lifetime") body.promoCode = promoCode;
      // Always pass isUpgrade=true for family lifetime — the server validates eligibility
      // server-side (user.hasPaid && planType !== "family"). Individual lifetime holders
      // upgrading to Family Lifetime pay only the $50 difference; the server returns the
      // correct amount regardless of what the client sends here.
      if (aud === "family" && bill === "lifetime") body.isUpgrade = true;

      // Pass creator attribution for trial and monthly subscriptions so Subscription.creator
      // and Subscription.promoCode are set — enabling influencer commission tracking.
      if (bill === "trial" || bill === "monthly") {
        const storedPromo = promoCode ?? getCreatorPromo();
        if (storedPromo) {
          const cfg = getCreatorPromoConfig(storedPromo);
          if (cfg?.creator) {
            body.creator   = cfg.creator;
            body.promoCode = storedPromo;
          }
        }
        // Pass the landing-page source (e.g. "browniesaadi") so we know which
        // influencer page drove the subscription, even without a promo code.
        if (initialSourceParam) body.source = initialSourceParam;
      }

      const res  = await fetch(endpoint, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const data = await res.json();

      // Discard stale responses — a newer createIntent call has already taken over.
      if (intentGen.current !== gen) return null;

      if (!res.ok) {
        if (res.status === 409) {
          // Trial already used — user must upgrade via family monthly or lifetime.
          if (data.trialAlreadyUsed) {
            setTrialAlreadyUsed(true);
            if (data.currentPlanType) setActiveSubPlanType(data.currentPlanType as "individual" | "family");
            // Fallback to server-provided userPlanType if API didn't return plan info
            else if (userPlanType === "family" || userPlanType === "individual") setActiveSubPlanType(userPlanType);
            return null;
          }
          // Already has this plan / downgrade attempt / any other 409 conflict.
          // Show the "already have access" UI instead of redirecting.
          setHasActiveSub(true);
          // isFamilyPlan means the user is on a family plan trying to buy individual — show downgrade block.
          if (data.isFamilyPlan) setActiveSubPlanType("family");
          else if (data.currentPlanType) setActiveSubPlanType(data.currentPlanType as "individual" | "family");
          // Fallback to server-provided userPlanType if API didn't return plan info
          else if (userPlanType === "family" || userPlanType === "individual") setActiveSubPlanType(userPlanType);
          return null;
        }
        throw new Error(data.error || "Failed to initialize checkout");
      }

      // Subscription was upgraded in-place (individual → family monthly) — no payment form needed.
      if (data.upgraded) {
        window.location.href = "/payment/success?type=family-subscription";
        return null;
      }

      const discount: number = data.promoDiscountAmount ?? 0;
      const price: number    = data.finalAmount ?? data.amount ?? currentPlan.price;

      // One final stale-check before writing state — the fetch above could have
      // taken a while and a newer call may have already completed.
      if (intentGen.current !== gen) return null;

      setBasePrice(data.baseAmount ?? currentPlan.price);
      setFinalPrice(price);
      setDiscountAmount(discount);

      // Sync appliedCoupon with the server-computed discount for the CURRENT plan.
      // validate-promo always returns the individual price discount, so without this
      // a Family plan user would see the wrong (individual-based) discount in the UI.
      if (discount > 0) {
        setAppliedCoupon((prev) =>
          prev ? { ...prev, discount, finalPrice: price } : prev
        );
      }

      if (data.freeAccess) {
        setFreeAccess(true);
      } else {
        setClientSecret(data.clientSecret);
        clientSecretRef.current = data.clientSecret;
      }
      return { discountAmount: discount, finalPrice: price, clientSecret: data.clientSecret as string | undefined };
    } catch (err) {
      if (intentGen.current === gen) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
      return null;
    } finally {
      // Only clear the loading state if this is still the active call.
      if (intentGen.current === gen) setLoading(false);
    }
  };

  // ── Deferred-intent helper ────────────────────────────────────────────────
  // Called by CheckoutForm at submit time. Ensures auth + creates intent if
  // not already done, then returns the clientSecret for stripe.confirmPayment.
  // Ref so getOrCreateClientSecret can read freeAccess without a stale closure.
  const freeAccessRef = useRef<boolean>(!!initialFreeAccess);
  useEffect(() => { freeAccessRef.current = freeAccess; }, [freeAccess]);

  const getOrCreateClientSecret = async (name: string, email: string): Promise<string> => {
    // Fast path — intent already ready.
    if (clientSecretRef.current) return clientSecretRef.current;

    // If a $0 promo was applied, no Stripe payment is needed — bubble up so the
    // free-claim UI is shown instead of attempting confirmPayment.
    if (freeAccessRef.current) throw new Error("__FREE_ACCESS__");

    // Validate email before doing any network calls.
    if (!isAuthenticatedRef.current) {
      if (!email.includes("@"))
        throw new Error("Please enter a valid email address to continue.");

      // Name is optional — the API derives it from email if not provided.
      await runGuestCheckout(name || "", email);

      if (!isAuthenticatedRef.current) {
        // Auth failed — authError state may have been set with the reason.
        // Throw so CheckoutForm can surface it in the payment error area.
        throw new Error("__AUTH_FAILED__");
      }
    }

    // If a $0 promo was set during runGuestCheckout, handle it.
    if (freeAccessRef.current) throw new Error("__FREE_ACCESS__");

    // At this point we are authenticated. If createIntent already fired (background
    // auto-trigger), clientSecretRef should be set. Otherwise call it now.
    if (!clientSecretRef.current) {
      const result = await createIntent(audience, billing, appliedCoupon?.code ?? undefined);
      const secret = result?.clientSecret;
      if (secret) return secret;
      // If freeAccess was set by createIntent, bubble up.
      if (freeAccessRef.current) throw new Error("__FREE_ACCESS__");
    }

    // Poll up to 10s for the background auto-trigger to finish setting the secret.
    for (let i = 0; i < 100; i++) {
      if (clientSecretRef.current) return clientSecretRef.current;
      if (freeAccessRef.current) throw new Error("__FREE_ACCESS__");
      await new Promise((r) => setTimeout(r, 100));
    }

    throw new Error("Unable to prepare payment. Please try again.");
  };

  // ── Validate URL promo for guest preview ───────────────────────────────────

  useEffect(() => {
    if (isAuthenticated || !promoParam) return;
    // Clear stale discount immediately so the UI never shows the previous plan's
    // discount while the new validation request is in-flight.
    setGuestPromo(null);
    // Use AbortController so that if the audience changes before this fetch
    // completes, the stale response is ignored and can't overwrite a newer result.
    const controller = new AbortController();
    const planParam = audience === "family" ? "&plan=family" : "";
    fetch(`/api/stripe/validate-promo?code=${encodeURIComponent(promoParam)}${planParam}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          // Tag the result with the audience it was computed for so stale
          // individual-plan responses cannot display on the family plan.
          setGuestPromo({ code: data.code, label: data.label, discount: data.promoDiscountAmount, forAudience: audience });
          setCouponInput(data.code);
        }
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          // non-abort errors are silently swallowed (promo just won't show)
        }
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audience]);

  // ── On mount / plan change: create intent (authenticated users) ────────────

  const isFirstMount  = useRef(true);
  // Monotonically-increasing counter used to detect stale autoApply responses.
  // Each time a new autoApply is started, gen is incremented.  The response
  // checks gen against the current value; if they differ, a newer autoApply
  // has started and this response must be discarded.
  const autoApplyGen  = useRef(0);
  // Same pattern for createIntent — prevents a stale 409 from an old trial
  // intent call overwriting a successful response from a newer lifetime call
  // when the user switches plans quickly while the first fetch is in-flight.
  const intentGen     = useRef(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    const autoApply = (code: string, onInvalid?: () => void) => {
      // Capture the current generation so stale responses from a previous plan
      // cannot overwrite a newer (correct) result.
      const gen = ++autoApplyGen.current;
      const planParam = audience === "family" ? "&plan=family" : "";
      fetch(`/api/stripe/validate-promo?code=${encodeURIComponent(code)}${planParam}`)
        .then((r) => r.json())
        .then((data) => {
          // If gen no longer matches, a newer autoApply has started — discard.
          if (autoApplyGen.current !== gen) return;
          if (data.valid) {
            setAppliedCoupon({ code: data.code, label: data.label, discount: data.promoDiscountAmount, finalPrice: data.finalPrice });
            setCouponInput(data.code);
            return createIntent(audience, billing, data.code);
          }
          onInvalid?.();
          return createIntent(audience, billing, undefined);
        })
        .catch(() => { if (autoApplyGen.current === gen) createIntent(audience, billing, undefined); });
    };

    if (isFirstMount.current) {
      isFirstMount.current = false;
      // Already have a server-created secret for individual lifetime — skip.
      if ((initialClientSecret || initialFreeAccess) && audience === "individual" && billing === "lifetime") return;
    } else {
      // Plan changed after initial mount: clear any stale coupon/discount that was
      // computed for a different plan so we never show the wrong discounted price
      // while the new intent is being created server-side.
      setAppliedCoupon(null);
      setDiscountAmount(0);
    }

    if (billing === "lifetime") {
      const couponCode = appliedCoupon?.code;
      const resolveCode = (code: string) =>
        COMMUNITY_CODE_MAP[code.toUpperCase()]?.[audience] ?? code;
      if (promoParam) { autoApply(resolveCode(promoParam)); return; }
      const stored = getCreatorPromo();
      if (stored) { autoApply(resolveCode(stored), clearCreatorPromo); return; }
      if (couponCode) { autoApply(resolveCode(couponCode)); return; }
    }

    createIntent(audience, billing, undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audience, billing, isAuthenticated]);

  // ── Auth handlers ──────────────────────────────────────────────────────────

  // Core guest-checkout logic — shared by both the explicit form submit and the
  // auto-trigger so we never duplicate the API call.
  const runGuestCheckout = async (name: string, email: string) => {
    // Create a fresh AbortController for this run so "Not you?" can cancel it.
    const controller = new AbortController();
    intentAbortRef.current = controller;

    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/guest-checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name, email }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.hasAccount) {
          if (isInfluencerMode) {
            setAuthError("__existing_account__");
          } else {
            setAuthMode("login");
            setAuthError("You already have an account with this email. Please sign in.");
          }
          setAutoIntentStarted(false);
          return;
        }
        setAuthError(data.error || "Failed to continue. Please try again.");
        setAutoIntentStarted(false);
        return;
      }
      if ((guestPromo || creatorPromoConfig) && billing === "lifetime") {
        const code     = guestPromo?.code     ?? promoParam ?? "";
        const label    = guestPromo?.label    ?? creatorPromoConfig?.displayLabel ?? "";
        // Prefer server-validated discount (correct for both percent and fixed codes).
        const discount = (guestPromo?.discount ?? 0) || guestCreatorDiscount;
        const discountedPrice = currentPlan.price - discount;
        setAppliedCoupon({ code, label, discount, finalPrice: discountedPrice });
        setCouponInput(code);
        // Sync finalPrice so Elements + wallet sheet show the correct discounted
        // amount immediately — before createIntent returns the server-verified price.
        if (discount > 0) {
          setFinalPrice(discountedPrice);
          setDiscountAmount(discount);
          setBasePrice(currentPlan.price);
        }
      }
      setAuthEmail(email);
      isAuthenticatedRef.current = true; // sync update so getOrCreateClientSecret sees it immediately
      setIsAuthenticated(true);
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return; // "Not you?" cancelled this
      setAuthError("An error occurred. Please try again.");
      setAutoIntentStarted(false);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGuestCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (!authForm.email.includes("@")) { setAuthError("Please enter a valid email address"); return; }
    if (autoIntentStarted) return; // already in progress from auto-trigger
    setAutoIntentStarted(true);
    await runGuestCheckout(authForm.fullName, authForm.email);
  };

  // Auto-trigger: fires once a valid email is entered (name is optional).
  const triggerAutoCheckout = (_name: string, email: string) => {
    if (isAuthenticated || autoIntentStarted || authLoading) return;
    if (autoDebounceRef.current) clearTimeout(autoDebounceRef.current);
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!validEmail) return;
    autoDebounceRef.current = setTimeout(() => {
      setAutoIntentStarted(true);
      runGuestCheckout(authForm.fullName, email);
    }, 600);
  };

  // When arriving from the Seerah Checkup funnel with a pre-filled email,
  // auto-start the guest checkout flow immediately — name is no longer required.
  useEffect(() => {
    if (!initialEmail || isAuthenticated) return;
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(initialEmail);
    if (!validEmail) return;
    setAutoIntentStarted(true);
    runGuestCheckout(initialName ?? "", initialEmail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount; initial values are stable

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (!authForm.email.includes("@")) { setAuthError("Please enter a valid email address"); return; }
    if (!authForm.password)            { setAuthError("Please enter your password"); return; }

    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/signin", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authForm.email, password: authForm.password }),
      });
      const data = await res.json();
      if (!res.ok) { setAuthError(data.error || "Invalid email or password"); return; }
      if ((guestPromo || creatorPromoConfig) && billing === "lifetime") {
        const code     = guestPromo?.code     ?? promoParam ?? "";
        const label    = guestPromo?.label    ?? creatorPromoConfig?.displayLabel ?? "";
        // Prefer server-validated discount (correct for both percent and fixed codes).
        const discount = (guestPromo?.discount ?? 0) || guestCreatorDiscount;
        setAppliedCoupon({ code, label, discount, finalPrice: currentPlan.price - discount });
        setCouponInput(code);
      }
      setAuthEmail(authForm.email);
      isAuthenticatedRef.current = true; // sync update so getOrCreateClientSecret sees it immediately
      setIsAuthenticated(true);
    } catch {
      setAuthError("An error occurred. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  // ── Coupon handlers (lifetime only) ───────────────────────────────────────

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    // Clear the existing intent so getOrCreateClientSecret creates a new one with the discount.
    clientSecretRef.current = null;
    setClientSecret(null);
    setCouponLoading(true);
    setCouponError(null);
    try {
      if (audience === "family" && billing === "lifetime") {
        // Validate with the family plan base price so the displayed discount is correct.
        const res  = await fetch(`/api/stripe/validate-promo?code=${encodeURIComponent(code)}&plan=family`);
        const data = await res.json();
        if (!res.ok || !data.valid) { setCouponError(data.error || "Invalid promo code"); return; }
        // Always show the code as applied (correct family discount from validate-promo).
        // If authenticated, also create/update the Stripe intent immediately.
        setAppliedCoupon({ code: data.code, label: data.label, discount: data.promoDiscountAmount, finalPrice: data.finalPrice });
        setCouponInput(data.code);
        setCouponError(null);
        if (isAuthenticated) {
          const result = await createIntent("family", "lifetime", data.code);
          if (result) {
            setAppliedCoupon({ code: data.code, label: data.label, discount: result.discountAmount, finalPrice: result.finalPrice });
          }
        }
        return;
      }
      const res  = await fetch(`/api/stripe/validate-promo?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!res.ok || !data.valid) { setCouponError(data.error || "Invalid promo code"); return; }
      setAppliedCoupon({ code: data.code, label: data.label, discount: data.promoDiscountAmount, finalPrice: data.finalPrice });
      setCouponError(null);
      await createIntent("individual", "lifetime", data.code);
    } catch {
      setCouponError("Could not validate code. Please try again.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = async () => {
    clearCreatorPromo();
    clientSecretRef.current = null;
    setClientSecret(null);
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
    await createIntent(audience, billing);
  };

  const handleClaimFreeAccess = async () => {
    const code = appliedCoupon?.code ?? couponInput.trim();
    if (!code) return;
    setFreeClaimLoading(true);
    setFreeClaimError(null);
    try {
      const res = await fetch("/api/stripe/claim-free-access", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoCode: code, planType: audience === "family" ? "family" : "individual" }),
      });
      const data = await res.json();
      if (!res.ok) { setFreeClaimError(data.error || "Something went wrong"); return; }
      window.location.href = "/seerah";
    } catch {
      setFreeClaimError("Something went wrong. Please try again.");
    } finally {
      setFreeClaimLoading(false);
    }
  };

  // ── Derived display values ─────────────────────────────────────────────────

  // For creator promo codes, always use the current plan's catalogue price as the
  // base so the order summary is correct the instant the user switches plans —
  // before any async createIntent/autoApply calls complete.
  const displayBase = (guestCreatorDiscount > 0 || !isAuthenticated)
    ? currentPlan.price
    : (appliedCoupon ? currentPlan.price : basePrice);
  // Server-validated amounts always take priority (correct for both percent and fixed
  // codes). Fall back to the client-side estimate (guestCreatorDiscount) only when no
  // server value has arrived yet — this covers the brief window before validate-promo
  // or createIntent responds.
  const resolvedDiscount = !isAuthenticated
    ? ((guestPromo?.forAudience === audience) ? (guestPromo?.discount ?? null) : null)
    : (appliedCoupon ? (appliedCoupon.discount ?? discountAmount) : null);
  const displayDiscount = resolvedDiscount !== null
    ? resolvedDiscount
    : (guestCreatorDiscount || discountAmount);
  const displayPrice    = displayBase - displayDiscount;

  // ── Plan summary (top of single-column checkout) ──────────────────────────

  const audienceOptions: { id: Audience; Icon: typeof User; label: string }[] = [
    { id: "individual", Icon: User,  label: "Individual" },
    { id: "family",     Icon: Users, label: "Family" },
  ];

  const allBillingOptions: { id: Billing; label: string; price: number; priceSuffix?: string; priceOverride?: string; sub: string; badge?: string }[] = audience === "individual"
    ? [
        { id: "monthly",  label: "Monthly",  price: PLANS.monthly.price,   priceSuffix: "/mo", sub: "Cancel anytime",          badge: "Most Popular" },
        { id: "lifetime", label: "Lifetime", price: PLANS.complete.price,  sub: "Pay once, access forever", badge: "Best Value" },
      ]
    : [
        { id: "monthly",  label: "Monthly",  price: PLANS.familyMonthly.price, priceSuffix: "/mo", sub: "Up to 5 profiles · cancel anytime", badge: "Most Popular" },
        { id: "lifetime", label: "Lifetime", price: PLANS.family.price,        sub: "Up to 5 profiles · pay once", badge: "Best Value" },
      ];

  const billingOptions = allBillingOptions;

  const PlanSummary = (
    <div>
      {isInApp && (
        <div className="mb-5 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm leading-relaxed">
          <p className="font-semibold mb-1">⚠️ Payment may not work in this browser</p>
          <p className="text-amber-300/80 text-xs">
            To complete your purchase, please open this page in Safari or Chrome.{" "}
            <span className="font-medium">Tap the ··· or share button → &ldquo;Open in Browser&rdquo;</span>
          </p>
        </div>
      )}

      {!showPlanSelector ? (
        <div className="rounded-xl border border-gold/30 bg-gold/5 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-white leading-snug">
                {isAnnArborStudent
                  ? "Ann Arbor Student Lifetime"
                  : billing === "monthly"
                    ? audience === "family" ? "Family Access" : "Individual Access"
                    : audience === "family" ? "Family Lifetime Access" : "Individual Lifetime Access"}
              </p>
              <p className="text-sm text-zinc-400 mt-0.5 leading-snug">
                {audience === "family"
                  ? "Up to 5 profiles · separate progress · one household plan."
                  : "Continue the full 100-part Seerah path."}
              </p>
              <p className="text-xs text-zinc-600 mt-1.5">
                Videos · quizzes · flashcards · summaries · progress tracking
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-2xl sm:text-3xl font-extrabold text-gold leading-none">
                {formatPrice(displayPrice)}
              </p>
              {billing === "monthly" && <p className="text-xs text-zinc-500 mt-0.5">/month</p>}
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-3 border-t border-zinc-800/60">
            {(billing === "monthly"
              ? ["Cancel anytime", "Instant access", "7-day refund"]
              : isLifetime
                ? ["One-time payment", "No subscription", "7-day refund", "Instant access"]
                : ["No charge today", "Cancel anytime"]
            ).map((t) => (
              <span key={t} className="flex items-center gap-1 text-xs text-zinc-400">
                <Check className="w-3 h-3 text-zinc-600 flex-shrink-0" />
                {t}
              </span>
            ))}
          </div>

          {displayDiscount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-green-400 mt-2.5">
              <Check className="w-3.5 h-3.5 flex-shrink-0" />
              Discount applied — saving {formatPrice(displayDiscount)}
            </div>
          )}

          <button
            onClick={() => {
              setShowPlanSelector(true);
              const src = initialSourceParam ?? "homepage";
              sendCheckoutEvent(src, "change_plan_clicked",      { plan: `${audience}-${billing}` });
              sendCheckoutEvent(src, "checkout_escape_clicked",  { escape_type: "change_plan", plan: `${audience}-${billing}` });
            }}
            className="mt-3 text-[10px] text-zinc-700 hover:text-zinc-500 transition-colors"
          >
            Change plan →
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setShowPlanSelector(false)}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to your plan
            </button>
          </div>

          <div className="flex gap-1 bg-zinc-950 border border-zinc-800 rounded-xl p-1 mb-4">
            {audienceOptions.map(({ id, Icon, label }) => (
              <button
                key={id}
                disabled={isLifetimeUpgrade && id !== "family"}
                onClick={() => {
                  if (isLifetimeUpgrade && id !== "family") return;
                  setAudience(id);
                  // Clear immediately so getOrCreateClientSecret can't return a stale intent.
                  clientSecretRef.current = null;
                  setClientSecret(null);
                  setAppliedCoupon(null); setGuestPromo(null); setDiscountAmount(0); setCouponInput(""); setCouponError(null);
                  const newPlan = PLANS[toPlanKey(id, billing)];
                  const snap = billing === "trial" ? (newPlan as typeof PLANS.individualTrial).trialFeeAmount ?? newPlan.price : newPlan.price;
                  setBasePrice(snap); setFinalPrice(snap);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  audience === id
                    ? "bg-zinc-700 text-white shadow-sm"
                    : isLifetimeUpgrade && id !== "family"
                      ? "text-zinc-700 cursor-not-allowed"
                      : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {billingOptions.map(({ id, label, price, priceSuffix, priceOverride, sub, badge }) => (
              <button
                key={id}
                onClick={() => {
                  setBilling(id);
                  clientSecretRef.current = null;
                  setClientSecret(null);
                  setAppliedCoupon(null); setGuestPromo(null); setDiscountAmount(0); setCouponInput(""); setCouponError(null);
                  const newPlan = PLANS[toPlanKey(audience, id)];
                  const snap = id === "trial" ? (newPlan as typeof PLANS.individualTrial).trialFeeAmount ?? newPlan.price : newPlan.price;
                  setBasePrice(snap); setFinalPrice(snap);
                }}
                className={`w-full flex items-center p-4 rounded-xl border transition-all text-left ${
                  billing === id
                    ? "border-gold/50 bg-gold/8 ring-1 ring-gold/30"
                    : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 mr-4 flex-shrink-0 flex items-center justify-center ${
                  billing === id ? "border-gold" : "border-zinc-600"
                }`}>
                  {billing === id && <div className="w-2 h-2 rounded-full bg-gold" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-semibold text-sm ${billing === id ? "text-white" : "text-zinc-300"}`}>{label}</span>
                    {badge && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gold/20 text-gold uppercase tracking-wide">
                        {badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-500">{sub}</span>
                </div>
                <div className="text-right ml-4 flex-shrink-0">
                  <span className={`text-xl font-bold ${billing === id ? "text-white" : "text-zinc-400"}`}>
                    {priceOverride ?? formatPrice(price)}
                  </span>
                  {priceSuffix && <span className="text-xs text-zinc-500">{priceSuffix}</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ── Order summary ─────────────────────────────────────────────────────────

  const promoCodeLabel = guestCreatorDiscount > 0
    ? (creatorPromoConfig?.displayLabel ?? promoParam)
    : (!isAuthenticated
        ? (guestPromo?.label ?? guestPromo?.code)
        : (appliedCoupon?.label ?? appliedCoupon?.code));

  const trialPlanConfig = isTrial
    ? (audience === "family" ? PLANS.familyTrial : PLANS.individualTrial)
    : null;

  const OrderSummary = isTrial && trialPlanConfig ? (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-white">{trialPlanConfig.name}</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            {audience === "family" ? "Up to 5 learner profiles · " : ""}
            7-day free trial
          </p>
        </div>
        <div className="text-right ml-4 flex-shrink-0">
          <p className="text-sm font-bold text-green-400 whitespace-nowrap">Free today</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-zinc-500 pt-1 border-t border-zinc-800/60">
        <span>After 7 days</span>
        <span>{formatPrice(trialPlanConfig.price)}/mo · cancel anytime</span>
      </div>
      <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
        <span className="text-sm font-semibold text-white">Due today</span>
        <span className="text-lg font-bold text-green-400">FREE</span>
      </div>
    </div>
  ) : (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-white">{currentPlan.name}</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            {audience === "family" ? "Up to 5 learner profiles · " : ""}
            {isLifetime ? "Lifetime access" : "Monthly subscription"}
          </p>
        </div>
        <div className="text-right ml-4 flex-shrink-0">
          <p className="text-sm font-bold text-white whitespace-nowrap">
            {formatPrice(displayBase)}{!isLifetime ? "/mo" : ""}
          </p>
        </div>
      </div>
      {isLifetime && displayDiscount > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-green-400 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" />
            {promoCodeLabel ?? "Promo"} discount
          </span>
          <span className="text-green-400 font-medium">−{formatPrice(displayDiscount)}</span>
        </div>
      )}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
        <span className="text-sm font-semibold text-white">
          {isLifetime ? "Total" : "Due today"}
        </span>
        <span className="text-lg font-bold text-gold">
          {formatPrice(isLifetime ? displayPrice : displayBase)}
        </span>
      </div>
      {!isLifetime && (
        <p className="text-xs text-zinc-500">
          Then {formatPrice(displayBase)}/month. Cancel anytime.
        </p>
      )}
    </div>
  );


  // ── Trial already used — show upgrade options (one free trial per account) ──

  if (trialAlreadyUsed) {
    const isOnFamily = activeSubPlanType === "family";
    const handleSwitchToFamilyMonthly = async () => {
      setUpgradeLoading(true);
      setUpgradeError(null);
      try {
        const res  = await fetch("/api/stripe/create-family-subscription-intent", { method: "POST" });
        const data = await res.json();
        if (data.upgraded) {
          window.location.href = "/payment/success?type=family-subscription";
          return;
        }
        if (!res.ok) throw new Error(data.error || "Upgrade failed");
        // If a clientSecret came back (new subscriber, not upgrade), handle normally.
        setClientSecret(data.clientSecret);
        setTrialAlreadyUsed(false);
      } catch (err) {
        setUpgradeError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      } finally {
        setUpgradeLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-zinc-950 py-10 px-4">
        <div className="max-w-[520px] mx-auto space-y-4">
          <div className="p-6 rounded-xl bg-gold/10 border border-gold/25 text-center space-y-3">
            <p className="text-lg font-bold text-white">
              {isOnFamily ? "You already have Family Access" : "Free trial already used"}
            </p>
            <p className="text-sm text-zinc-400">
              {isOnFamily
                ? "Your Family plan already includes everything. Manage it from your billing page."
                : "You've already used your free trial. Upgrade your plan below."}
            </p>
            <Link href="/seerah" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-ink font-semibold text-sm transition-colors">
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {!isOnFamily && (
            <div className="p-5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-3">
              <p className="font-semibold text-white text-sm">Upgrade to Family Access</p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                One household account · up to 5 learner profiles · separate progress for every learner.
              </p>
              {upgradeError && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{upgradeError}</p>
              )}
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleSwitchToFamilyMonthly}
                  disabled={upgradeLoading}
                  className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-colors disabled:opacity-50"
                >
                  {upgradeLoading ? "Upgrading…" : <>Switch to Family Monthly — $9.99/mo <ArrowRight className="w-3.5 h-3.5" /></>}
                </button>
                <button
                  onClick={() => { setTrialAlreadyUsed(false); setAudience("family"); setBilling("lifetime"); }}
                  className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border border-amber-500/40 hover:border-amber-500/70 text-amber-400 font-semibold text-sm transition-colors"
                >
                  Family Lifetime — $99 one-time
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Authenticated: already has this plan (same type) ──────────────────────

  if (hasActiveSub) {
    // Final fallback: if plan type still unknown after API + server prop, derive from
    // context clues. If the audience the user was trying to buy is "family" and we
    // got a conflict, they likely have individual. If the userPlanType prop contains
    // "family" in any form, treat as family. Otherwise default to individual.
    const resolvedPlanType: "family" | "individual" =
      activeSubPlanType ??
      (userPlanType?.includes("family") ? "family" : "individual");

    const isOnFamily     = resolvedPlanType === "family";
    const isOnIndividual = resolvedPlanType === "individual";

    // Family user looking at an individual plan — downgrade attempt.
    const isDowngrade = isOnFamily && audience === "individual";
    // Family user looking at family plan — already have it.
    const familyDuplicate = isOnFamily && audience === "family";
    // Individual user looking at the same individual plan — show upgrade to family option.
    const showUpgradeCta = isOnIndividual && audience === "individual";

    return (
      <div className="min-h-screen bg-zinc-950 py-10 px-4">
        <div className="max-w-[520px] mx-auto space-y-4">
          <div className="p-6 rounded-xl bg-gold/10 border border-gold/25 text-center space-y-4">
            <RefreshCw className="w-10 h-10 text-gold mx-auto" />
            <p className="text-lg font-bold text-white">
              {isDowngrade || familyDuplicate ? "You already have Family Access" : "You already have this plan"}
            </p>
            <p className="text-sm text-zinc-400">
              {isDowngrade
                ? "Your Family plan already includes everything in the Individual plan — plus up to 5 learner profiles. There's nothing to downgrade to."
                : familyDuplicate
                  ? "You already have an active Family plan. Head to your dashboard to continue learning."
                  : showUpgradeCta
                    ? "You're already on an individual trial. Head to your dashboard or upgrade to a family plan."
                    : "Your account is already active. Head to your dashboard to continue learning."}
            </p>
            <Link
              href="/seerah"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-ink font-semibold text-sm transition-colors"
            >
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
            {isDowngrade && (
              <button
                onClick={() => { setAudience("family"); }}
                className="block w-full text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                View Family plan options →
              </button>
            )}
          </div>
          {showUpgradeCta && !familyDuplicate && (
            <div className="p-5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-3">
              <p className="font-semibold text-white text-sm">Upgrade to Family Access</p>
              <p className="text-xs text-zinc-400">
                One household account with up to 5 learner profiles and individual progress tracking.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setAudience("family"); setBilling("monthly"); }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-colors"
                >
                  Switch to Family Monthly — $9.99/mo <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { setAudience("family"); setBilling("lifetime"); }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/40 hover:border-amber-500/70 text-amber-400 font-semibold text-sm transition-colors"
                >
                  Family Lifetime — {formatPrice(PLANS.family.price)} one-time
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Single-column checkout ─────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-950 py-8 px-4">
      <div className="max-w-[520px] mx-auto space-y-5">

        {/* Plan summary — always first */}
        {PlanSummary}

        <div className="space-y-4">

          {/* ── Full name — always visible ── */}
          <input
            suppressHydrationWarning
            type="text"
            placeholder="Full name"
            required
            autoComplete="name"
            inputMode="text"
            value={authForm.fullName}
            onChange={(e) => setAuthForm((f) => ({ ...f, fullName: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-gold/50 transition-colors text-base sm:text-sm"
          />

          {/* ── 1. Email (only shown for unauthenticated guests) ── */}
          {!isAuthenticated && authMode === "signup" && (
            <form onSubmit={handleGuestCheckout} className="space-y-3">
              {emailLocked ? (
                /* Locked — email came from the quiz funnel; show as read-only */
                <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-900/60">
                  <div className="flex items-center gap-2 min-w-0">
                    <Lock className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                    <span className="text-white text-sm truncate">{authForm.email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (autoDebounceRef.current) clearTimeout(autoDebounceRef.current);
                      setEmailLocked(false);
                      setAuthForm((f) => ({ ...f, email: "" }));
                    }}
                    className="text-xs text-zinc-500 hover:text-gold transition-colors whitespace-nowrap flex-shrink-0"
                  >
                    Use a different email
                  </button>
                </div>
              ) : (
                <input
                  type="email" placeholder="Email address" required
                  autoComplete="email"
                  inputMode="email"
                  value={authForm.email}
                  onChange={(e) => {
                    const email = e.target.value;
                    setAuthForm((f) => ({ ...f, email }));
                    triggerAutoCheckout("", email);
                  }}
                  onBlur={(e) => triggerAutoCheckout("", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-gold/50 transition-colors text-base sm:text-sm"
                />
              )}
              {authError === "__existing_account__" ? (
                <div className="p-4 rounded-xl bg-gold/10 border border-gold/25 text-sm space-y-2">
                  <p className="font-semibold text-white">You already have an account</p>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Sign in to your student dashboard to manage your plan or upgrade.
                  </p>
                  <a
                    href={`/login?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "/checkout")}`}
                    className="inline-flex items-center gap-1.5 text-gold text-xs font-semibold hover:text-gold-light transition-colors"
                  >
                    Go to sign in <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : authError ? (
                <p className="text-xs text-red-400 pt-1">{authError}</p>
              ) : null}
              <button type="submit" className="sr-only" aria-hidden>Continue</button>
              {!isInfluencerMode && !authError && (
                <p className="text-xs text-zinc-600 text-center">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => { setAuthMode("login"); setAuthError(""); }}
                    className="text-zinc-500 hover:text-gold transition-colors underline"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </form>
          )}

          {/* ── Sign-in form (for existing accounts) ── */}
          {!isAuthenticated && authMode === "login" && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => { setAuthMode("signup"); setAuthError(""); }}
                  className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Back
                </button>
                <p className="text-xs text-zinc-400">Sign in to continue</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-3">
                <input
                  type="email" placeholder="Email address" required
                  autoComplete="email"
                  inputMode="email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-gold/50 transition-colors text-base sm:text-sm"
                />
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"} placeholder="Password" required
                    value={authForm.password}
                    onChange={(e) => setAuthForm((f) => ({ ...f, password: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-gold/50 transition-colors text-base sm:text-sm pr-11"
                  />
                  <button type="button" onClick={() => setShowPass((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-500 hover:text-zinc-300">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {authError && authError !== "__existing_account__" && <p className="text-xs text-red-400 pt-1">{authError}</p>}
                <button
                  type="submit" disabled={authLoading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gold hover:bg-gold-light disabled:opacity-60 text-ink font-bold text-sm transition-colors"
                >
                  {authLoading ? "Signing in…" : "Sign In & Continue"}
                  {!authLoading && <ArrowRight className="w-4 h-4" />}
                </button>
                <div className="text-center">
                  <a href="/forgot-password" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                    Forgot your password?
                  </a>
                </div>
              </form>
            </div>
          )}

          {/* ── Authenticated indicator ── */}
          {isAuthenticated && (
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                  <Check className="w-3 h-3 text-green-400" />
                </span>
                <span className="text-sm text-zinc-300 truncate">{authEmail}</span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  // Abort any in-flight guest-checkout or intent fetch so stale
                  // clientSecrets can never surface for a different identity.
                  if (intentAbortRef.current) {
                    intentAbortRef.current.abort();
                    intentAbortRef.current = null;
                  }
                  if (autoDebounceRef.current) {
                    clearTimeout(autoDebounceRef.current);
                    autoDebounceRef.current = null;
                  }
                  // Increment intentGen to discard any in-flight createIntent response.
                  ++intentGen.current;

                  await fetch("/api/auth/signout", { method: "POST" });

                  // Reset all auth + payment state to a clean slate.
                  setIsAuthenticated(false);
                  setAuthEmail("");
                  setAuthMode("signup");
                  setAuthForm({ fullName: "", email: "", password: "", confirmPassword: "" });
                  setAuthError("");
                  setAuthLoading(false);
                  setAutoIntentStarted(false);
                  setClientSecret(null);
                  setLoading(false);
                  setError(null);
                  setHasActiveSub(false);
                  setActiveSubPlanType(null);
                  setTrialAlreadyUsed(false);
                  setFreeAccess(false);
                  setAppliedCoupon(null);
                  setCouponInput("");
                }}
                className="flex-shrink-0 ml-3 text-xs text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                Not you?
              </button>
            </div>
          )}

          {/* ── Auto-applied promo — only shown when arriving from an influencer link ── */}
          {isLifetime && isAuthenticated && appliedCoupon && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-400">{appliedCoupon.code} applied</p>
                  <p className="text-xs text-zinc-500">{appliedCoupon.label}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── 2. Payment options ── */}
          {freeAccess ? (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-gold/10 border border-gold/25 text-center">
                <p className="text-sm font-bold text-gold mb-1">Free Access Applied!</p>
                <p className="text-xs text-zinc-400">Your promo code gives you full access at no cost.</p>
              </div>
              <button
                onClick={handleClaimFreeAccess}
                disabled={freeClaimLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gold hover:bg-gold-light disabled:opacity-60 text-ink font-bold text-base transition-colors"
              >
                {freeClaimLoading ? "Activating…" : "Activate Free Access"}
              </button>
              {freeClaimError && <p className="text-xs text-red-400 text-center">{freeClaimError}</p>}
            </div>
          ) : (
            <>
              {error && !loading && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Deferred intent: Elements renders immediately without clientSecret.
                  The form collects payment details upfront; we create the server-side
                  intent only when the user clicks the pay button. key remounts the form
                  on plan-type changes (audience/billing) but NOT on price changes —
                  those are handled via elements.update() inside CheckoutForm. */}
              {(() => {
                const code = appliedCoupon?.code ?? resolvedPromoParam ?? "";
                const cfg = code ? getCreatorPromoConfig(code) : null;
                const checkoutCreator = cfg?.creator ?? null;
                const elementsAppearance = {
                  theme: "night" as const,
                  variables: {
                    colorPrimary: "#f4c542",
                    colorBackground: "#18181b",
                    colorText: "#f4f4f5",
                    colorDanger: "#ef4444",
                    fontFamily: "ui-sans-serif, system-ui, sans-serif",
                    borderRadius: "12px",
                  },
                };
                // Stripe discriminated union: "setup" mode must not include amount.
                // NOTE: Do NOT pass paymentMethodTypes: ["card", "link"] for monthly.
                // Including "link" causes Stripe.js to inject setup_future_usage: "off_session"
                // into confirmPayment, which conflicts with subscription invoice PaymentIntents
                // that have setup_future_usage: null — Stripe rejects the mismatch with a 400.
                // Link is already suppressed in PaymentElement via wallets: { link: "never" }.
                const elementsOptions = billing === "trial"
                  ? { mode: "setup" as const, currency: "usd", appearance: elementsAppearance }
                  : {
                      mode: "payment" as const,
                      amount: finalPrice > 0 ? finalPrice : 1, // must be > 0 for payment mode
                      currency: "usd",
                      appearance: elementsAppearance,
                    };
                // Default to "homepage" so organic checkout visitors are also tracked
              const trackerCreator = checkoutCreator ?? initialSourceParam ?? "homepage";
              return (
                  <Elements
                    stripe={stripePromise}
                    key={`${audience}-${billing}`}
                    options={elementsOptions}
                  >
                    <CheckoutFunnelTracker
                      creator={trackerCreator}
                      plan={`${audience}-${billing}`}
                      interval={billing}
                      price={finalPrice}
                      promoCode={code || null}
                      source={initialSourceParam}
                      influencer={checkoutCreator ?? initialSourceParam}
                      quizScore={initialQuizScore}
                      resultType={initialResultType}
                      emailPrefilled={!!(initialEmail || isAuthenticated)}
                      fromQuiz={!!(initialQuizScore !== null || initialResultType)}
                    />
                    <CheckoutForm
                      audience={audience}
                      billing={billing}
                      finalPrice={finalPrice}
                      creator={trackerCreator}
                      promoCode={code || undefined}
                      getOrCreateClientSecret={getOrCreateClientSecret}
                      isAuthenticated={isAuthenticated}
                      authFormRef={authFormRef}
                      authLoading={authLoading}
                    />
                  </Elements>
                );
              })()}
            </>
          )}

        </div>
      </div>
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

// No Suspense wrapper needed — useSearchParams() was removed in favour of the
// server-passed initialPromoParam prop, eliminating the SSR/CSR hydration risk.
export default function CheckoutClientPage(props: CheckoutPageClientProps) {
  return <CheckoutPageContent {...props} />;
}
