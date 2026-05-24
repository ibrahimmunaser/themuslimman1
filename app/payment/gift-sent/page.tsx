"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Gift, Check, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GiftSentState {
  loading: boolean;
  error: string | null;
  recipientEmail: string | null;
  recipientName: string | null;
}

function GiftSentContent() {
  const searchParams = useSearchParams();
  const paymentIntent = searchParams.get("payment_intent");

  const [state, setState] = useState<GiftSentState>({
    loading: true,
    error: null,
    recipientEmail: null,
    recipientName: null,
  });

  useEffect(() => {
    if (!paymentIntent) {
      setState({ loading: false, error: "No payment information found.", recipientEmail: null, recipientName: null });
      return;
    }

    async function verifyGift() {
      try {
        const res = await fetch(`/api/gift/verify-and-create?payment_intent=${paymentIntent}`);
        const data = await res.json();
        if (!res.ok) {
          setState({ loading: false, error: data.error ?? "Failed to verify gift payment.", recipientEmail: null, recipientName: null });
          return;
        }
        setState({
          loading: false,
          error: null,
          recipientEmail: data.recipientEmail,
          recipientName: data.recipientName,
        });
      } catch {
        setState({ loading: false, error: "Something went wrong verifying your payment.", recipientEmail: null, recipientName: null });
      }
    }

    verifyGift();
  }, [paymentIntent]);

  if (state.loading) {
    return (
      <div className="min-h-screen bg-ink text-text flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Sending your gift…</p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-ink text-text flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
            <span className="text-2xl">✕</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Something Went Wrong</h1>
          <p className="text-text-secondary mb-6">{state.error}</p>
          <div className="space-y-3">
            <Link href="/contact">
              <Button variant="primary" size="lg" className="w-full justify-center">Contact Support</Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="md" className="w-full justify-center">Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink text-text flex items-center justify-center px-4">
      <div className="max-w-lg w-full">

        {/* Success header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-full bg-gold/10 border-2 border-gold/40 flex items-center justify-center mb-6 relative">
            <Gift className="w-10 h-10 text-gold" />
            <div className="absolute inset-0 rounded-full bg-gold/10 animate-ping" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Your Gift Has Been Sent!</h1>
          <p className="text-lg text-text-secondary">
            JazakAllahu Khayran for your generosity.
          </p>
        </div>

        {/* Details card */}
        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 space-y-5">

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-4 h-4 text-gold" />
              </div>
              <div>
                <p className="text-text font-medium">Payment confirmed</p>
                <p className="text-text-secondary text-sm">Lifetime access purchased successfully</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Mail className="w-4 h-4 text-gold" />
              </div>
              <div>
                <p className="text-text font-medium">Gift email sent</p>
                <p className="text-text-secondary text-sm">
                  {state.recipientName
                    ? `${state.recipientName} (${state.recipientEmail})`
                    : state.recipientEmail}{" "}
                  will receive a claim link to activate their access.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-4 h-4 text-gold" />
              </div>
              <p className="text-text-secondary">
                They&apos;ll create a free account (or sign in) to claim their access instantly
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gold/5 border border-gold/15">
            <p className="text-sm text-text-secondary leading-relaxed">
              <strong className="text-text">Heads up:</strong> If your recipient doesn&apos;t see the email within a few minutes, ask them to check their spam folder.
              The subject line is: <em className="text-gold">&quot;You&apos;ve been gifted Complete Seerah&quot;</em>
            </p>
          </div>

          <div className="pt-4 border-t border-border">
            <Link href="/seerah">
              <Button variant="ghost" size="lg" className="w-full justify-center gap-2">
                Go to Your Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-text-muted mt-6">
          Questions?{" "}
          <Link href="/contact" className="text-gold hover:text-gold-light">Contact support</Link>
        </p>
      </div>
    </div>
  );
}

export default function GiftSentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ink text-text flex items-center justify-center px-4">
          <div className="text-center">
            <div className="w-16 h-16 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-text-secondary">Loading…</p>
          </div>
        </div>
      }
    >
      <GiftSentContent />
    </Suspense>
  );
}
