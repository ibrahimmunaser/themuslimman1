"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

/**
 * One-click upgrade from individual trial/monthly → family monthly.
 * Calls create-family-subscription-intent which upgrades the Stripe subscription
 * in-place (no new payment form needed — existing card is used, Stripe prorates).
 */
export function UpgradeToFamilyMonthlyButton() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/stripe/create-family-subscription-intent", { method: "POST" });
      const data = await res.json();

      if (data.upgraded) {
        window.location.href = "/billing?upgraded=family-monthly";
        return;
      }
      if (!res.ok) throw new Error(data.error || "Upgrade failed");
      // If a clientSecret is returned (new subscriber, no existing card) fall back to checkout.
      window.location.href = "/checkout?plan=family-monthly";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
      )}
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-amber-500/40 hover:border-amber-500/70 text-amber-400 font-semibold text-sm transition-colors disabled:opacity-50"
      >
        {loading ? "Upgrading…" : <>Monthly — $9.99/mo <ArrowRight className="w-4 h-4" /></>}
      </button>
    </div>
  );
}
