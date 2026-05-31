"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  Check,
  Lock,
  Users,
  User,
  ArrowLeft,
  Shield,
  Star,
  Tag,
  X,
  Gift,
} from "lucide-react";
import Link from "next/link";
import { PLANS, formatPrice } from "@/lib/stripe-config";
import { clearCreatorPromo, getCreatorPromo } from "@/lib/creator-promos";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type PlanChoice = "complete" | "family";

// ── Stripe payment form ───────────────────────────────────────────────────────

function CheckoutForm({
  planChoice,
  finalPrice,
}: {
  planChoice: PlanChoice;
  finalPrice: number;
}) {
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

    const returnUrl =
      planChoice === "family"
        ? `${window.location.origin}/payment/success?type=family`
        : `${window.location.origin}/payment/success`;

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed. Please try again.");
      setProcessing(false);
    }
  };

  const label =
    planChoice === "family"
      ? `Get Family Access — ${formatPrice(finalPrice)}`
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
        {processing ? "Processing…" : label}
      </button>

      <p className="text-xs text-zinc-500 text-center">
        Secure payment powered by Stripe · Your information is encrypted
      </p>
      <p className="text-xs text-zinc-600 text-center leading-relaxed">
        By purchasing you agree to our{" "}
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

// ── Applied coupon pill ───────────────────────────────────────────────────────

interface AppliedCoupon {
  code: string;
  label: string;
  discount: number;
  finalPrice: number;
}

// ── Main checkout content ─────────────────────────────────────────────────────

interface CheckoutPageClientProps {
  userEmail?: string;
  initialPlan?: PlanChoice;
  // Server-pre-created payment intent (eliminates client-side round trip)
  initialClientSecret?: string | null;
  initialBasePrice?: number;
  initialFinalPrice?: number;
  initialDiscountAmount?: number;
  initialAppliedPromo?: string | null;
  initialAppliedPromoLabel?: string | null;
  initialFreeAccess?: boolean;
}

function CheckoutPageContent({
  userEmail = "",
  initialPlan = "complete",
  initialClientSecret = null,
  initialBasePrice: serverBasePrice,
  initialFinalPrice: serverFinalPrice,
  initialDiscountAmount: serverDiscount = 0,
  initialAppliedPromo = null,
  initialAppliedPromoLabel = null,
  initialFreeAccess = false,
}: CheckoutPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan") as PlanChoice | null;
  const promoParam = searchParams.get("promo")?.toUpperCase() ?? null;

  const [planChoice, setPlanChoice] = useState<PlanChoice>(
    planParam === "family" ? "family" : initialPlan
  );

  const defaultBase = planChoice === "family" ? PLANS.family.price : PLANS.complete.price;

  // Payment intent — initialise from server-pre-created secret if available
  const [clientSecret, setClientSecret] = useState<string | null>(initialClientSecret);
  const [loading, setLoading] = useState(initialClientSecret == null && !initialFreeAccess);
  const [error, setError] = useState<string | null>(null);

  // Pricing — use server-provided values when available
  const [basePrice, setBasePrice] = useState<number>(serverBasePrice ?? defaultBase);
  const [finalPrice, setFinalPrice] = useState<number>(serverFinalPrice ?? defaultBase);
  const [discountAmount, setDiscountAmount] = useState(serverDiscount);

  // Coupon — pre-fill if server applied one
  const [couponInput, setCouponInput] = useState(initialAppliedPromo ?? promoParam ?? "");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(
    initialAppliedPromo && initialAppliedPromoLabel && serverFinalPrice != null
      ? {
          code: initialAppliedPromo,
          label: initialAppliedPromoLabel,
          discount: serverDiscount,
          finalPrice: serverFinalPrice,
        }
      : null
  );

  // Free access (promo code gives $0)
  const [freeAccess, setFreeAccess] = useState(initialFreeAccess);
  const [freeClaimLoading, setFreeClaimLoading] = useState(false);
  const [freeClaimError, setFreeClaimError] = useState<string | null>(null);

  // ── Create payment intent ──────────────────────────────────────────────────

  const createIntent = async (
    plan: PlanChoice,
    promoCode?: string
  ): Promise<{ discountAmount: number; finalPrice: number } | null> => {
    setLoading(true);
    setClientSecret(null);
    setFreeAccess(false);
    setError(null);

    const endpoint =
      plan === "family"
        ? "/api/stripe/create-family-payment-intent"
        : "/api/stripe/create-payment-intent";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: "complete", promoCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push(
            `/signup-checkout?plan=${plan === "family" ? "family" : "complete"}`
          );
          return null;
        }
        if (res.status === 409 && (data.hasLifetime || data.hasFamily)) {
          router.push("/my-courses");
          return null;
        }
        throw new Error(data.error || "Failed to initialize checkout");
      }

      const discount: number = data.promoDiscountAmount ?? 0;
      const price: number = data.finalAmount;

      setBasePrice(data.baseAmount);
      setFinalPrice(price);
      setDiscountAmount(discount);

      if (data.freeAccess) {
        setFreeAccess(true);
      } else {
        setClientSecret(data.clientSecret);
      }
      return { discountAmount: discount, finalPrice: price };
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ── On plan change: recreate intent (reuse applied coupon if any) ──────────
   
  // Track whether this is the first mount so we can skip the fetch
  // when the server already pre-created the intent.
  const isFirstMount = useRef(true);

  useEffect(() => {
    const autoApply = (code: string, onInvalid?: () => void) => {
      fetch(`/api/stripe/validate-promo?code=${encodeURIComponent(code)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.valid) {
            setAppliedCoupon({
              code: data.code,
              label: data.label,
              discount: data.promoDiscountAmount,
              finalPrice: data.finalPrice,
            });
            setCouponInput(data.code);
            return createIntent(planChoice, data.code);
          }
          onInvalid?.();
          return createIntent(planChoice, undefined);
        })
        .catch(() => createIntent(planChoice, undefined));
    };

    // Skip the initial API call if the server already pre-created the intent.
    if (isFirstMount.current) {
      isFirstMount.current = false;
      if (initialClientSecret || initialFreeAccess) return;
    }

    if (planChoice === "complete" && !appliedCoupon) {
      // Priority 1: ?promo= URL param (e.g. /checkout?promo=DEARBORN20)
      if (promoParam) {
        autoApply(promoParam);
        return;
      }
      // Priority 2: stored creator promo
      const stored = getCreatorPromo();
      if (stored) {
        autoApply(stored, clearCreatorPromo);
        return;
      }
    }
    createIntent(planChoice, appliedCoupon?.code);
    // Intentionally omit appliedCoupon from deps — we want the current value
    // at the time planChoice changes, not to re-run every time coupon changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planChoice]);

  // ── Coupon handlers ───────────────────────────────────────────────────────

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setCouponLoading(true);
    setCouponError(null);

    try {
      // For family, go straight to the intent (validate-promo uses individual base price)
      if (planChoice === "family") {
        const result = await createIntent("family", code);
        if (result) {
          setAppliedCoupon({
            code: code.toUpperCase(),
            label: "Promo applied",
            discount: result.discountAmount,
            finalPrice: result.finalPrice,
          });
        } else {
          setCouponError("Invalid promo code");
        }
        return;
      }

      // For individual, use validate-promo for a clean discount preview
      const res = await fetch(
        `/api/stripe/validate-promo?code=${encodeURIComponent(code)}`
      );
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setCouponError(data.error || "Invalid promo code");
        return;
      }
      setAppliedCoupon({
        code: data.code,
        label: data.label,
        discount: data.promoDiscountAmount,
        finalPrice: data.finalPrice,
      });
      setCouponError(null);
      await createIntent("complete", data.code);
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
    await createIntent(planChoice);
  };

  // ── Free access claim ─────────────────────────────────────────────────────

  const handleClaimFreeAccess = async () => {
    const code = appliedCoupon?.code ?? couponInput.trim();
    if (!code) return;
    setFreeClaimLoading(true);
    setFreeClaimError(null);
    try {
      const res = await fetch("/api/stripe/claim-free-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promoCode: code,
          planType: planChoice === "family" ? "family" : "individual",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFreeClaimError(data.error || "Something went wrong");
        return;
      }
      router.push("/my-courses");
    } catch {
      setFreeClaimError("Something went wrong. Please try again.");
    } finally {
      setFreeClaimLoading(false);
    }
  };

  // ── Derived display values ────────────────────────────────────────────────

  const currentPlan = planChoice === "family" ? PLANS.family : PLANS.complete;
  const displayPrice = appliedCoupon ? appliedCoupon.finalPrice : finalPrice;
  const displayDiscount = appliedCoupon ? appliedCoupon.discount : discountAmount;
  const displayBase = appliedCoupon ? currentPlan.price : basePrice;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col lg:flex-row">
      {/* ── Left column — plan details ─────────────────────────────────────── */}
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
          <span className="text-gold">Lifetime Access</span>
        </h1>

        <p className="text-zinc-400 text-base mb-8 leading-relaxed">
          One-time payment. Lifetime access to all 100 parts, every asset, every
          learner.
        </p>

        {/* Plan selector */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <button
            onClick={() => setPlanChoice("complete")}
            className={`flex flex-col p-4 rounded-xl border transition-all text-left ${
              planChoice === "complete"
                ? "border-gold/50 bg-gold/8 text-white ring-1 ring-gold/30"
                : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 flex-shrink-0" />
              <span className="font-semibold text-sm">Individual</span>
              {planChoice === "complete" && (
                <div className="ml-auto w-2 h-2 rounded-full bg-gold-light" />
              )}
            </div>
            <span className="text-2xl font-bold text-white">
              {formatPrice(PLANS.complete.price)}
            </span>
            <span className="text-xs text-zinc-500 mt-0.5">
              1 learner · one-time
            </span>
          </button>

          <button
            onClick={() => setPlanChoice("family")}
            className={`flex flex-col p-4 rounded-xl border transition-all text-left ${
              planChoice === "family"
                ? "border-gold/50 bg-gold/8 text-white ring-1 ring-gold/30"
                : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 flex-shrink-0" />
              <span className="font-semibold text-sm">Family</span>
              {planChoice === "family" && (
                <div className="ml-auto w-2 h-2 rounded-full bg-gold-light" />
              )}
            </div>
            <span className="text-2xl font-bold text-white">
              {formatPrice(PLANS.family.price)}
            </span>
            <span className="text-xs text-zinc-500 mt-0.5">
              Up to 5 learners · one-time
            </span>
          </button>
        </div>

        {/* Feature list */}
        <ul className="space-y-3">
          {currentPlan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-gold/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-gold" />
              </div>
              <span className="text-sm text-zinc-300">{feature}</span>
            </li>
          ))}
        </ul>

        {/* Monthly nudge */}
        <div className="mt-8 p-4 rounded-xl border border-zinc-700/50 bg-zinc-900/40">
          <p className="text-sm text-zinc-400">
            Not ready to commit?{" "}
            <a
              href="/checkout/monthly"
              className="text-gold hover:text-gold-light font-medium transition-colors"
            >
              Try Monthly Access from $9/mo →
            </a>
          </p>
        </div>

        {/* Trust badges */}
        <div className="mt-6 pt-6 border-t border-zinc-800 flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Shield className="w-4 h-4 text-zinc-600" />
            7-day refund guarantee
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Lock className="w-4 h-4 text-zinc-600" />
            Secure payment
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Star className="w-4 h-4 text-zinc-600" />
            Lifetime access
          </div>
        </div>
      </div>

      {/* ── Right column — order summary + payment ──────────────────────────── */}
      <div className="lg:w-1/2 px-6 sm:px-12 py-12 flex flex-col justify-center">
        <div className="max-w-md w-full mx-auto">
          <h2 className="text-xl font-bold text-white mb-1">
            Complete your order
          </h2>
          {userEmail && (
            <p className="text-sm text-zinc-500 mb-7">
              Purchasing as{" "}
              <span className="text-zinc-300">{userEmail}</span>
            </p>
          )}
          {!userEmail && <div className="mb-7" />}

          {/* Order summary card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 space-y-3">
            {/* Plan row */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-white">
                  {currentPlan.name}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {planChoice === "family"
                    ? "Up to 5 learner profiles · "
                    : ""}
                  Lifetime access
                </p>
              </div>
              <p className="text-sm font-bold text-white whitespace-nowrap ml-4">
                {formatPrice(displayBase)}
              </p>
            </div>

            {/* Discount row */}
            {displayDiscount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-400 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  {appliedCoupon?.code ?? "Promo"} discount
                </span>
                <span className="text-green-400 font-medium">
                  −{formatPrice(displayDiscount)}
                </span>
              </div>
            )}

            {/* Total row */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <span className="text-sm font-semibold text-white">Total</span>
              <span className="text-lg font-bold text-gold">
                {formatPrice(displayPrice)}
              </span>
            </div>
          </div>

          {/* Coupon input */}
          <div className="mb-6">
            {appliedCoupon ? (
              <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <Tag className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="font-medium">{appliedCoupon.code}</span>
                  <span className="text-green-400/60 text-xs">
                    {appliedCoupon.label}
                  </span>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  className="text-green-400/60 hover:text-green-400 transition-colors ml-2"
                  aria-label="Remove promo code"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value.toUpperCase());
                      setCouponError(null);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                    placeholder="Promo code"
                    className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-gold/50 transition-colors uppercase"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponInput.trim()}
                    className="px-4 py-2.5 text-sm font-medium rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-gold/40 hover:text-gold transition-colors disabled:opacity-40 whitespace-nowrap"
                  >
                    {couponLoading ? "…" : "Apply"}
                  </button>
                </div>
                {couponError && (
                  <p className="text-xs text-red-400">{couponError}</p>
                )}
              </div>
            )}
          </div>

          {/* Loading spinner */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            </div>
          )}

          {/* Error state */}
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

          {/* Free access claim */}
          {freeAccess && !loading && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-gold/10 border border-gold/25 text-center">
                <div className="text-3xl mb-3">🎁</div>
                <h3 className="text-lg font-bold text-white mb-1">
                  Free Access Applied
                </h3>
                <p className="text-zinc-400 text-sm">
                  Your promo code gives you full{" "}
                  {planChoice === "family" ? "family " : ""}
                  access at no charge.
                </p>
              </div>
              {freeClaimError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {freeClaimError}
                </div>
              )}
              <button
                onClick={handleClaimFreeAccess}
                disabled={freeClaimLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gold hover:bg-gold-light disabled:opacity-60 text-ink font-bold text-base transition-colors shadow-lg shadow-gold/20"
              >
                <Lock className="w-4 h-4" />
                {freeClaimLoading ? "Activating…" : "Claim Free Access"}
              </button>
              <p className="text-xs text-zinc-500 text-center">
                Your access will be activated immediately.
              </p>
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
              <CheckoutForm planChoice={planChoice} finalPrice={displayPrice} />
            </Elements>
          )}

          {/* Gift link */}
          {!freeAccess && !loading && planChoice === "complete" && (
            <div className="mt-6 pt-5 border-t border-zinc-800 text-center">
              <p className="text-xs text-zinc-600 mb-1">
                Buying for someone else?
              </p>
              <a
                href="/gift-checkout"
                className="inline-flex items-center gap-1.5 text-xs text-gold/70 hover:text-gold transition-colors font-medium"
              >
                <Gift className="w-3.5 h-3.5" />
                Gift Lifetime Access instead →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Exported page component (wrapped in Suspense for useSearchParams) ─────────

export default function CheckoutClientPage(props: CheckoutPageClientProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
      }
    >
      <CheckoutPageContent {...props} />
    </Suspense>
  );
}

// Re-export props type for the server page
export type { CheckoutPageClientProps };
