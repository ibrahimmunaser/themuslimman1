"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function PaymentSuccessPageContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFreeAccess, setIsFreeAccess] = useState(false);

  const paymentIntent = searchParams.get("payment_intent");
  const free = searchParams.get("free");

  useEffect(() => {
    // Free access via promo code — no Stripe payment to verify
    if (free === "1") {
      setIsFreeAccess(true);
      setLoading(false);
      return;
    }

    // Verify Stripe payment intent
    async function verifyPayment() {
      if (!paymentIntent) {
        setError("No payment information found");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/stripe/verify-payment?payment_intent=${paymentIntent}`);
        
        if (!response.ok) {
          throw new Error("Payment verification failed");
        }

        setLoading(false);
      } catch (err) {
        setError("Failed to verify payment");
        setLoading(false);
      }
    }

    verifyPayment();
  }, [paymentIntent, free]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ink text-text flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-ink text-text flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
            <span className="text-2xl">✕</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Payment Verification Failed</h1>
          <p className="text-text-secondary mb-6">{error}</p>
          <div className="space-y-3">
            <Link href="/contact" className="w-full">
              <Button variant="primary" size="lg" className="w-full">
                Contact Support
              </Button>
            </Link>
            <Link href="/" className="w-full">
              <Button variant="ghost" size="md" className="w-full">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink text-text flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mb-6 relative">
            <Check className="w-10 h-10 text-green-400" />
            <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            {isFreeAccess ? "Access Granted!" : "Payment Successful!"}
          </h1>
          <p className="text-lg text-text-secondary">
            Welcome to Complete Seerah
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="space-y-3">
            {!isFreeAccess && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-gold" />
                </div>
                <p className="text-text-secondary">
                  Payment processed successfully
                </p>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-gold" />
              </div>
              <p className="text-text-secondary">
                Full access granted to all 100 parts
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-gold" />
              </div>
              <p className="text-text-secondary">
                Your progress will be saved automatically
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-border">
            <Link href="/seerah" className="w-full">
              <Button variant="primary" size="lg" className="w-full gap-2">
                Start Learning
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-text-muted mt-6">
          Questions? <Link href="/contact" className="text-gold hover:text-gold-light">Contact support</Link>
        </p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-ink text-text flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    }>
      <PaymentSuccessPageContent />
    </Suspense>
  );
}
