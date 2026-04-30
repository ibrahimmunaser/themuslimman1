"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Eye, EyeOff, ArrowRight, Check, User, Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PLANS, formatPrice, type PlanId } from "@/lib/stripe-config";
import { previewUsername } from "@/lib/username-generator";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm({ 
  plan, 
  formData, 
  onSuccess 
}: { 
  plan: typeof PLANS[PlanId];
  formData: { fullName: string; email: string; password: string };
  onSuccess: (username: string) => void;
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
      setError(submitError.message || "An error occurred");
      setProcessing(false);
      return;
    }

    try {
      // Confirm payment with Stripe
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (confirmError) {
        setError(confirmError.message || "Payment failed");
        setProcessing(false);
        return;
      }

      // Payment succeeded, now create account
      const response = await fetch("/api/auth/signup-with-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          paymentIntentId: paymentIntent?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Account creation failed");
        setProcessing(false);
        return;
      }

      // Success!
      onSuccess(data.username);
    } catch (err) {
      setError("Something went wrong. Please contact support.");
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 rounded-lg bg-surface-raised border border-border">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <Lock className="w-4 h-4 text-gold" />
          Payment Information
        </h3>
        <PaymentElement />
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={processing}
        disabled={!stripe || processing}
        className="w-full justify-center"
      >
        {processing ? "Processing..." : `Complete Purchase · ${formatPrice(plan.price)}`}
        <ArrowRight className="w-4 h-4" />
      </Button>

      <p className="text-xs text-text-muted text-center">
        Your payment is secure and encrypted. By completing this purchase, you agree to our Terms of Service.
      </p>
    </form>
  );
}

function SignupCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planId = (searchParams.get("plan") || "complete") as PlanId;
  const plan = PLANS[planId];

  const [step, setStep] = useState<"details" | "payment" | "success">("details");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [generatedUsername, setGeneratedUsername] = useState("");

  const usernamePreview = form.fullName.trim().length >= 2 
    ? previewUsername(form.fullName) 
    : "";

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (form.fullName.trim().length < 2) {
      setError("Please enter your full name");
      return;
    }

    if (!form.email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Create payment intent
    try {
      const response = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to initialize payment");
      }

      setClientSecret(data.clientSecret);
      setStep("payment");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handlePaymentSuccess = (username: string) => {
    setGeneratedUsername(username);
    setStep("success");
  };

  if (!plan) {
    router.push("/");
    return null;
  }

  // Success view
  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-text mb-2">Welcome to Seerah LMS!</h1>
            <p className="text-text-secondary text-sm">
              Your payment was successful
            </p>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
            <div className="p-4 rounded-lg bg-gold/5 border border-gold/20">
              <p className="text-sm text-text mb-2">
                <strong className="text-gold">Your username:</strong>
              </p>
              <p className="text-lg font-mono text-gold font-bold">
                {generatedUsername}
              </p>
              <p className="text-xs text-text-muted mt-2">
                Save this! You'll need it to sign in.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-surface-raised border border-border">
              <p className="text-sm text-text-secondary mb-2">
                📧 We sent a verification email to:
              </p>
              <p className="text-sm text-gold font-medium">{form.email}</p>
              <p className="text-xs text-text-muted mt-2">
                Click the link to verify your email and start learning!
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => router.push("/login")}
            >
              Go to Login
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink text-text">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            {step === "details" ? "Create Your Account" : "Complete Your Purchase"}
          </h1>
          <p className="text-text-secondary">
            {step === "details" 
              ? "Enter your details to get started" 
              : "Secure payment to unlock instant access"}
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Order Summary - Sidebar */}
          <div className="lg:col-span-2">
            <div className="bg-surface border border-border rounded-2xl p-6 sticky top-6">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <h3 className="font-medium text-text mb-2">{plan.name}</h3>
                  <p className="text-sm text-text-secondary mb-3">
                    One-time payment · Lifetime access
                  </p>
                  <ul className="space-y-2">
                    {plan.features.slice(0, 4).map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-text-secondary">
                        <Check className="w-4 h-4 text-gold flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                    {plan.features.length > 4 && (
                      <li className="text-sm text-text-muted">
                        + {plan.features.length - 4} more features
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-gold">{formatPrice(plan.price)}</span>
                </div>
              </div>

              <div className="mt-6 p-3 rounded-lg bg-gold/5 border border-gold/20">
                <p className="text-xs text-text-secondary">
                  ✓ Instant access after payment<br />
                  ✓ Lifetime ownership<br />
                  ✓ No recurring charges
                </p>
              </div>
            </div>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-3">
            <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8">
              {step === "details" ? (
                <form onSubmit={handleDetailsSubmit} className="space-y-4">
                  <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <User className="w-5 h-5 text-gold" />
                    Account Details
                  </h2>

                  {/* Full Name */}
                  <div>
                    <Input
                      label="Full name"
                      type="text"
                      placeholder="Ibrahim Munaser"
                      value={form.fullName || ""}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      required
                      autoComplete="name"
                    />
                    {usernamePreview && (
                      <p className="text-xs text-text-muted mt-1.5 flex items-center gap-1.5">
                        <User className="w-3 h-3" />
                        Your username will be: <span className="text-gold font-mono">{usernamePreview}</span>
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <Input
                    label="Email address"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email || ""}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    autoComplete="email"
                  />

                  {/* Password */}
                  <div className="relative">
                    <Input
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 8 characters"
                      value={form.password || ""}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                      autoComplete="new-password"
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-9 text-text-muted hover:text-text-secondary transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Confirm Password */}
                  <Input
                    label="Confirm password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Re-enter password"
                    value={form.confirmPassword || ""}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    required
                    autoComplete="new-password"
                    minLength={8}
                  />

                  {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full justify-center mt-2"
                  >
                    Continue to Payment
                    <ArrowRight className="w-4 h-4" />
                  </Button>

                  <div className="mt-5 pt-4 border-t border-border text-center">
                    <p className="text-sm text-text-secondary">
                      Already have an account?{" "}
                      <Link href="/login" className="text-gold hover:text-gold-light font-medium transition-colors">
                        Sign in
                      </Link>
                    </p>
                  </div>
                </form>
              ) : (
                clientSecret && (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: "night",
                        variables: {
                          colorPrimary: "#d4af37",
                          colorBackground: "#1a1a1a",
                          colorText: "#e0e0e0",
                          colorDanger: "#ef4444",
                          fontFamily: "system-ui, sans-serif",
                          borderRadius: "8px",
                        },
                      },
                    }}
                  >
                    <CheckoutForm 
                      plan={plan} 
                      formData={form}
                      onSuccess={handlePaymentSuccess}
                    />
                  </Elements>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-ink text-text flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-text-secondary">Loading...</p>
        </div>
      </div>
    }>
      <SignupCheckoutContent />
    </Suspense>
  );
}
