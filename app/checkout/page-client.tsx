"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  Check, Lock, User, Users, ArrowLeft, ArrowRight,
  Shield, Star, Tag, X, Eye, EyeOff, RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { PLANS, formatPrice } from "@/lib/stripe-config";
import { clearCreatorPromo, getCreatorPromo, getCreatorPromoConfig } from "@/lib/creator-promos";

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
  const base = window.location.origin;
  if (billing === "trial")                                 return `${base}/payment/success?type=subscription`;
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
}: {
  audience: Audience;
  billing: Billing;
  finalPrice: number;
}) {
  const stripe   = useStripe();
  const elements = useElements();
  const [error, setError]         = useState<string | null>(null);
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

    try {
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: toReturnUrl(audience, billing) },
      });

      if (confirmError) {
        setError(confirmError.message ?? "Payment failed. Please try again.");
        setProcessing(false);
      }
    } catch {
      setError("Connection lost. Please check your internet and try again.");
      setProcessing(false);
    }
  };

  const buttonLabel =
    billing === "trial"
      ? `Start 7-Day Trial — ${formatPrice(finalPrice)} today`
      : billing === "monthly"
      ? `Subscribe — ${formatPrice(finalPrice)}/mo`
      : `Get Lifetime Access — ${formatPrice(finalPrice)}`;

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
        {processing ? "Processing…" : buttonLabel}
      </button>
      <p className="text-xs text-zinc-500 text-center">
        Secure payment powered by Stripe · Your information is encrypted
      </p>
      <p className="text-xs text-zinc-600 text-center leading-relaxed">
        By {billing === "monthly" ? "subscribing" : "purchasing"} you agree to our{" "}
        <a href="/terms"   className="underline hover:text-zinc-400 transition-colors">Terms of Service</a>{", "}
        <a href="/privacy" className="underline hover:text-zinc-400 transition-colors">Privacy Policy</a>{", and "}
        <a href="/refund"  className="underline hover:text-zinc-400 transition-colors">Refund Policy</a>.
      </p>
    </form>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface CheckoutPageClientProps {
  userEmail?: string;
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
}

// ── Main checkout content ─────────────────────────────────────────────────────

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
}: CheckoutPageClientProps) {
  // promoParam comes from the server prop — no useSearchParams() needed.
  // This guarantees server and client render the same initial HTML.
  const promoParam = initialPromoParam;
  const isInApp = useIsInAppBrowser();

  // ── Audience + billing state ───────────────────────────────────────────────
  const [audience, setAudience] = useState<Audience>(initialAudience);
  const [billing,  setBilling]  = useState<Billing>(initialBilling);

  const planKey   = toPlanKey(audience, billing);
  const currentPlan = PLANS[planKey];
  const isLifetime  = billing === "lifetime";
  const isTrial     = billing === "trial";

  // Compute guest promo discount synchronously from the client-safe creator promo
  // config (20% × currentPlan.price). Because promoParam now comes from a server
  // prop (not useSearchParams), server and client always agree on the initial value
  // — no hydration mismatch, no async fetch race condition, always correct for the
  // currently selected plan.
  const creatorPromoConfig   = promoParam ? getCreatorPromoConfig(promoParam) : null;
  const guestCreatorDiscount = (creatorPromoConfig && isLifetime)
    ? Math.round(currentPlan.price * creatorPromoConfig.discountPercent / 100)
    : 0;

  // ── Auth state ─────────────────────────────────────────────────────────────
  const [isAuthenticated, setIsAuthenticated] = useState(!!userEmail);
  const [authEmail,  setAuthEmail]   = useState(userEmail);
  const [authMode,   setAuthMode]    = useState<AuthMode>("signup");
  const [showPass,   setShowPass]    = useState(false);
  const [authForm,   setAuthForm]    = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [authError,  setAuthError]   = useState("");
  const [authLoading,setAuthLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "loading" | "sent" | "error">("idle");

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
  const [hasActiveSub,   setHasActiveSub]   = useState(false);
  // When hasActiveSub is true, this holds what plan type the user currently has
  // so we can show an upgrade CTA instead of a dead-end message.
  const [activeSubPlanType, setActiveSubPlanType] = useState<"individual" | "family" | null>(null);
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

  const createIntent = async (
    aud: Audience,
    bill: Billing,
    promoCode?: string
  ): Promise<{ discountAmount: number; finalPrice: number } | null> => {
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

    try {
      const endpoint = toEndpoint(aud, bill);
      const body: Record<string, unknown> = { planId: toPlanKey(aud, bill) };
      if (promoCode && bill === "lifetime") body.promoCode = promoCode;
      // Always pass isUpgrade=true for family lifetime — the server validates eligibility
      // server-side (user.hasPaid && planType !== "family"). Individual lifetime holders
      // upgrading to Family Lifetime pay only the $70 difference; the server returns the
      // correct amount regardless of what the client sends here.
      if (aud === "family" && bill === "lifetime") body.isUpgrade = true;

      const res  = await fetch(endpoint, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const data = await res.json();

      // Discard stale responses — a newer createIntent call has already taken over.
      if (intentGen.current !== gen) return null;

      if (!res.ok) {
        if (res.status === 409 && (data.hasLifetime || data.hasFamily || data.activeSub || data.hasActiveSubscription)) {
          if (data.activeSub || data.hasActiveSubscription || data.hasLifetime || data.hasFamily) {
            setHasActiveSub(true);
            if (data.currentPlanType) setActiveSubPlanType(data.currentPlanType);
            return null;
          }
          window.location.href = "/seerah";
          return null;
        }
        throw new Error(data.error || "Failed to initialize checkout");
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
      }
      return { discountAmount: discount, finalPrice: price };
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
      if (promoParam) { autoApply(promoParam); return; }
      const stored = getCreatorPromo();
      if (stored) { autoApply(stored, clearCreatorPromo); return; }
      if (couponCode) { autoApply(couponCode); return; }
    }

    createIntent(audience, billing, undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audience, billing, isAuthenticated]);

  // ── Auth handlers ──────────────────────────────────────────────────────────

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (authForm.fullName.trim().length < 2) { setAuthError("Please enter your full name"); return; }
    if (!authForm.email.includes("@"))         { setAuthError("Please enter a valid email address"); return; }
    if (authForm.password.length < 8)          { setAuthError("Password must be at least 8 characters"); return; }
    if (authForm.password !== authForm.confirmPassword) { setAuthError("Passwords do not match"); return; }

    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/signup-student", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: authForm.fullName, email: authForm.email, password: authForm.password }),
      });
      const data = await res.json();
      if (!res.ok) { setAuthError(data.error || "Failed to create account"); return; }

      if (data.emailVerified) {
        if ((guestPromo || creatorPromoConfig) && billing === "lifetime") {
          const code     = guestPromo?.code     ?? promoParam ?? "";
          const label    = guestPromo?.label    ?? creatorPromoConfig?.displayLabel ?? "";
          // Use the synchronously-computed creator discount if available so the
          // correct plan-specific discount is applied regardless of fetch timing.
          const discount = guestCreatorDiscount > 0 ? guestCreatorDiscount : (guestPromo?.discount ?? 0);
          setAppliedCoupon({ code, label, discount, finalPrice: currentPlan.price - discount });
          setCouponInput(code);
        }
        setAuthEmail(authForm.email);
        setIsAuthenticated(true);
      } else {
        setNeedsVerification(true);
      }
    } catch {
      setAuthError("An error occurred. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

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
        const discount = guestCreatorDiscount > 0 ? guestCreatorDiscount : (guestPromo?.discount ?? 0);
        setAppliedCoupon({ code, label, discount, finalPrice: currentPlan.price - discount });
        setCouponInput(code);
      }
      setAuthEmail(authForm.email);
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
  // For known creator promo codes the discount is always computed synchronously from
  // creatorPromoConfig.discountPercent × currentPlan.price, so it is ALWAYS correct
  // for the currently selected plan — regardless of auth state, async fetch timing,
  // or in-flight race conditions.  For non-creator codes we fall back to the
  // server/async-derived values.
  const displayDiscount = guestCreatorDiscount > 0
    ? guestCreatorDiscount
    : (!isAuthenticated
        ? ((guestPromo?.forAudience === audience) ? (guestPromo?.discount ?? 0) : 0)
        : (appliedCoupon?.discount ?? discountAmount));
  const displayPrice    = displayBase - displayDiscount;

  // ── Left column ────────────────────────────────────────────────────────────

  const audienceOptions: { id: Audience; Icon: typeof User; label: string }[] = [
    { id: "individual", Icon: User,  label: "Individual" },
    { id: "family",     Icon: Users, label: "Family" },
  ];

  const billingOptions: { id: Billing; label: string; price: number; priceSuffix?: string; sub: string; badge?: string }[] = audience === "individual"
    ? [
        { id: "trial",    label: "7-Day Trial", price: PLANS.individualTrial.trialFeeAmount, priceSuffix: " today", sub: `Then ${formatPrice(PLANS.individualTrial.price)}/mo · cancel anytime`, badge: "Most Popular" },
        { id: "lifetime", label: "Lifetime",    price: PLANS.complete.price, sub: "Pay once, access forever", badge: "Best Value" },
      ]
    : [
        { id: "trial",    label: "7-Day Trial", price: PLANS.familyTrial.trialFeeAmount, priceSuffix: " today", sub: `Then ${formatPrice(PLANS.familyTrial.price)}/mo · up to 5 profiles`, badge: "Most Popular" },
        { id: "lifetime", label: "Lifetime",    price: PLANS.family.price, sub: "Up to 5 profiles · pay once", badge: "Best Value" },
      ];

  const LeftColumn = (
    <div className="lg:w-1/2 bg-zinc-900/50 border-r border-zinc-800 px-6 sm:px-12 py-12 flex flex-col justify-center">
      {/* Logo — links back to homepage */}
      <Link href="/" className="flex items-center mb-10 self-start">
        <Image
          src="/images/logoicon.png"
          alt="TheMuslimMan"
          width={967}
          height={219}
          className="h-9 w-auto"
          priority
        />
      </Link>

      {/* In-app browser warning — Instagram/TikTok/Facebook WebViews can block Stripe.
          Only shown when a social-app browser is detected on mobile. */}
      {isInApp && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm leading-relaxed">
          <p className="font-semibold mb-1">⚠️ Payment may not work in this browser</p>
          <p className="text-amber-300/80 text-xs">
            To complete your purchase, please open this page in Safari or Chrome.{" "}
            <span className="font-medium">Tap the ··· or share button → &ldquo;Open in Browser&rdquo;</span>
          </p>
        </div>
      )}
      <Link href="/pricing" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" />
        Back to pricing
      </Link>

      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Complete Seerah</h1>
      <p className="text-zinc-400 text-base mb-8 leading-relaxed">
        {audience === "family"
          ? "One household account with up to 5 learner profiles, each with their own progress."
          : "Full structured access to all 100 parts of the Seerah of the Prophet ﷺ."}
      </p>

      {/* Audience tabs */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 mb-6">
        {audienceOptions.map(({ id, Icon, label }) => (
          <button
            key={id}
            onClick={() => {
              setAudience(id);
              setAppliedCoupon(null); setGuestPromo(null); setDiscountAmount(0); setCouponInput(""); setCouponError(null);
              // Immediately reset displayed price to the new plan so the order
              // summary never shows stale pricing while the API call is in-flight.
              const newPlan = PLANS[toPlanKey(id, billing)];
              const snap = billing === "trial" ? (newPlan as typeof PLANS.individualTrial).trialFeeAmount ?? newPlan.price : newPlan.price;
              setBasePrice(snap); setFinalPrice(snap);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              audience === id
                ? "bg-zinc-700 text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Billing options */}
          <div className="space-y-3 mb-8">
        {billingOptions.map(({ id, label, price, priceSuffix, sub, badge }) => (
          <button
            key={id}
            onClick={() => {
              setBilling(id);
              setAppliedCoupon(null); setGuestPromo(null); setDiscountAmount(0); setCouponInput(""); setCouponError(null);
              // Immediately snap displayed price to the selected plan so the order
              // summary is always correct before the async createIntent responds.
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
            {/* Radio dot */}
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
                {formatPrice(price)}
              </span>
              {priceSuffix && <span className="text-xs text-zinc-500">{priceSuffix}</span>}
            </div>
          </button>
        ))}
      </div>

      {/* Features */}
      <ul className="space-y-2.5">
        {currentPlan.features.map((f) => (
          <li key={f} className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-gold/15 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-3 h-3 text-gold" />
            </div>
            <span className="text-sm text-zinc-300">{f}</span>
          </li>
        ))}
      </ul>

      {/* Trust badges */}
      <div className="mt-8 pt-6 border-t border-zinc-800 flex flex-wrap gap-4">
        {[
          { Icon: Shield, text: isTrial ? "Cancel anytime" : isLifetime ? "7-day refund guarantee" : "Cancel anytime" },
          { Icon: Lock,   text: "Secure payment" },
          { Icon: Star,   text: isTrial ? "7-day trial access" : isLifetime ? "Lifetime access" : "Full access while subscribed" },
        ].map(({ Icon, text }) => (
          <div key={text} className="flex items-center gap-2 text-xs text-zinc-500">
            <Icon className="w-4 h-4 text-zinc-600" />
            {text}
          </div>
        ))}
      </div>
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
            7-day trial
          </p>
        </div>
        <div className="text-right ml-4 flex-shrink-0">
          <p className="text-sm font-bold text-white whitespace-nowrap">
            {formatPrice(trialPlanConfig.trialFeeAmount)} today
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-zinc-500 pt-1 border-t border-zinc-800/60">
        <span>After 7 days</span>
        <span>{formatPrice(trialPlanConfig.price)}/mo · cancel anytime</span>
      </div>
      <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
        <span className="text-sm font-semibold text-white">Due today</span>
        <span className="text-lg font-bold text-gold">{formatPrice(trialPlanConfig.trialFeeAmount)}</span>
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
        <span className="text-sm font-semibold text-white">Total{!isLifetime ? " today" : ""}</span>
        <span className="text-lg font-bold text-gold">
          {formatPrice(isLifetime ? displayPrice : displayBase)}{!isLifetime ? "/mo" : ""}
        </span>
      </div>
    </div>
  );

  // ── Needs verification screen ─────────────────────────────────────────────

  if (!isAuthenticated && needsVerification) {
    const handleResendVerification = async () => {
      setResendState("loading");
      try {
        const res = await fetch("/api/auth/resend-verification", { method: "POST" });
        setResendState(res.ok ? "sent" : "error");
      } catch {
        setResendState("error");
      }
    };

    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col lg:flex-row">
        {LeftColumn}
        <div className="lg:w-1/2 px-6 sm:px-12 py-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            {OrderSummary}
            <div className="p-6 rounded-xl bg-gold/10 border border-gold/25 text-center space-y-3">
              <p className="text-lg font-bold text-white">Check your email</p>
              <p className="text-sm text-zinc-400">
                We sent a verification link to <span className="text-gold">{authForm.email}</span>.
                Click the link to verify, then sign in to complete your purchase.
              </p>
              <button
                onClick={() => { setNeedsVerification(false); setAuthMode("login"); setResendState("idle"); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-ink font-semibold text-sm transition-colors"
              >
                Go to Sign In <ArrowRight className="w-4 h-4" />
              </button>
              <div className="pt-2 border-t border-gold/20">
                {resendState === "sent" ? (
                  <p className="text-xs text-emerald-400">Email resent! Check your inbox.</p>
                ) : resendState === "error" ? (
                  <p className="text-xs text-red-400">Failed to resend. Try again in a moment.</p>
                ) : (
                  <button
                    onClick={handleResendVerification}
                    disabled={resendState === "loading"}
                    className="text-xs text-zinc-400 hover:text-gold transition-colors disabled:opacity-50 flex items-center gap-1 mx-auto"
                  >
                    <RefreshCw className={`w-3 h-3 ${resendState === "loading" ? "animate-spin" : ""}`} />
                    {resendState === "loading" ? "Sending…" : "Resend verification email"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Guest right column: auth form ─────────────────────────────────────────

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col lg:flex-row">
        {LeftColumn}
        <div className="lg:w-1/2 px-6 sm:px-12 py-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <h2 className="text-xl font-bold text-white mb-6">Complete your order</h2>
            {OrderSummary}

            {/* Auth tabs */}
            <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 mb-5">
              {(["signup", "login"] as AuthMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => { setAuthMode(mode); setAuthError(""); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    authMode === mode ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {mode === "signup" ? "New customer" : "Sign in"}
                </button>
              ))}
            </div>

            {/* Signup form */}
            {authMode === "signup" && (
              <form onSubmit={handleSignup} className="space-y-3">
                <input
                  type="text" placeholder="Full name"
                  value={authForm.fullName}
                  onChange={(e) => setAuthForm((f) => ({ ...f, fullName: e.target.value }))}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-gold/50 transition-colors text-base sm:text-sm"
                />
                <input
                  type="email" placeholder="Email address"
                  value={authForm.email}
                  onChange={(e) => setAuthForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-gold/50 transition-colors text-base sm:text-sm"
                />
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"} placeholder="Password (min 8 characters)"
                    value={authForm.password} minLength={8} required
                    onChange={(e) => setAuthForm((f) => ({ ...f, password: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-gold/50 transition-colors text-base sm:text-sm pr-11"
                  />
                  <button type="button" onClick={() => setShowPass((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-500 hover:text-zinc-300">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <input
                  type={showPass ? "text" : "password"} placeholder="Confirm password" required
                  value={authForm.confirmPassword}
                  onChange={(e) => setAuthForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-gold/50 transition-colors text-base sm:text-sm"
                />
                {authError && <p className="text-xs text-red-400 pt-1">{authError}</p>}
                <button
                  type="submit" disabled={authLoading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gold hover:bg-gold-light disabled:opacity-60 text-ink font-bold text-sm transition-colors"
                >
                  {authLoading ? "Creating account…" : "Create Account & Continue"}
                  {!authLoading && <ArrowRight className="w-4 h-4" />}
                </button>
                <p className="text-xs text-zinc-600 text-center leading-relaxed">
                  By creating an account you agree to our{" "}
                  <a href="/terms"   className="underline hover:text-zinc-400">Terms</a>,{" "}
                  <a href="/privacy" className="underline hover:text-zinc-400">Privacy Policy</a>, and{" "}
                  <a href="/refund"  className="underline hover:text-zinc-400">Refund Policy</a>.
                </p>
              </form>
            )}

            {/* Login form */}
            {authMode === "login" && (
              <form onSubmit={handleLogin} className="space-y-3">
                <input
                  type="email" placeholder="Email address" required
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
                {authError && <p className="text-xs text-red-400 pt-1">{authError}</p>}
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
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Authenticated: already has this plan (same type) ──────────────────────

  if (hasActiveSub) {
    const isOnFamily     = activeSubPlanType === "family";
    const isOnIndividual = activeSubPlanType === "individual" || !activeSubPlanType;

    // Family user looking at an individual plan — downgrade attempt.
    const isDowngrade = isOnFamily && audience === "individual";
    // Individual user looking at the same individual plan — duplicate attempt.
    const showUpgradeCta = isOnIndividual && audience === "individual";

    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col lg:flex-row">
        {LeftColumn}
        <div className="lg:w-1/2 px-6 sm:px-12 py-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-4">
            <div className="p-6 rounded-xl bg-gold/10 border border-gold/25 text-center space-y-4">
              <RefreshCw className="w-10 h-10 text-gold mx-auto" />
              <p className="text-lg font-bold text-white">
                {isDowngrade ? "You already have Family Access" : "You already have this plan"}
              </p>
              <p className="text-sm text-zinc-400">
                {isDowngrade
                  ? "Your Family plan already includes everything in the Individual plan — plus up to 5 learner profiles. There's nothing to downgrade to."
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
            {showUpgradeCta && (
              <div className="p-5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-3">
                <p className="font-semibold text-white text-sm">Upgrade to Family Access</p>
                <p className="text-xs text-zinc-400">
                  One household account with up to 5 learner profiles and individual progress tracking.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { setAudience("family"); setBilling("trial"); }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-colors"
                  >
                    7-Day Trial — $1 today <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { setAudience("family"); setBilling("lifetime"); }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/40 hover:border-amber-500/70 text-amber-400 font-semibold text-sm transition-colors"
                  >
                    Lifetime — $149
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Authenticated right column: payment form ───────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col lg:flex-row">
      {LeftColumn}
      <div className="lg:w-1/2 px-6 sm:px-12 py-12 flex flex-col justify-center">
        <div className="max-w-md w-full mx-auto">
          <h2 className="text-xl font-bold text-white mb-2">Complete your order</h2>
          <p className="text-sm text-zinc-500 mb-6">Signed in as <span className="text-zinc-300">{authEmail}</span></p>

          {OrderSummary}

          {/* Promo code — lifetime plans only */}
          {isLifetime && (
            <div className="mb-6">
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-green-400">{appliedCoupon.code} applied</p>
                      <p className="text-xs text-zinc-500">{appliedCoupon.label}</p>
                    </div>
                  </div>
                  <button onClick={handleRemoveCoupon} className="text-zinc-600 hover:text-zinc-400 transition-colors ml-3">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text" placeholder="Promo code"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-gold/50 transition-colors text-base sm:text-sm"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {couponLoading ? "…" : "Apply"}
                  </button>
                </div>
              )}
              {couponError && <p className="text-xs text-red-400 mt-2">{couponError}</p>}
            </div>
          )}

          {/* Free access via promo */}
          {freeAccess && (
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
          )}

          {/* Stripe payment form */}
          {!freeAccess && (
            <>
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
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
                  key={clientSecret}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: "night",
                      variables: {
                        colorPrimary: "#f4c542",
                        colorBackground: "#18181b",
                        colorText: "#f4f4f5",
                        colorDanger: "#ef4444",
                        fontFamily: "ui-sans-serif, system-ui, sans-serif",
                        borderRadius: "12px",
                      },
                    },
                  }}
                >
                  <CheckoutForm audience={audience} billing={billing} finalPrice={finalPrice} />
                </Elements>
              )}
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
