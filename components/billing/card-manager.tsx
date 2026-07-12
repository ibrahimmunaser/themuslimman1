"use client";

import { useState, useEffect, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { CreditCard, Plus, Trash2, Loader2, X, Check, Star, AlertTriangle } from "lucide-react";
import { daysUntilCardExpiry, isCardExpiringSoon, type SavedCardLike } from "@/lib/saved-cards";

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

const EXPIRY_WARNING_DAYS = 60;

interface PaymentMethod extends SavedCardLike {
  brand: string;
  last4: string;
}

function CardBrandBadge({ brand }: { brand: string }) {
  const b = brand.toLowerCase();
  if (b === "visa") return <span className="font-bold italic text-blue-400 text-[11px] tracking-wider">VISA</span>;
  if (b === "mastercard") return (
    <span className="inline-flex items-center">
      <span className="w-3.5 h-3.5 rounded-full bg-red-500 opacity-90" />
      <span className="w-3.5 h-3.5 rounded-full bg-yellow-400 opacity-90 -ml-1.5" />
    </span>
  );
  if (b === "amex") return <span className="font-bold text-blue-300 text-[11px] tracking-wider">AMEX</span>;
  if (b === "discover") return <span className="font-bold text-orange-400 text-[11px] tracking-wider">DISC</span>;
  return <CreditCard className="w-3.5 h-3.5 text-text-muted" />;
}

// Uses the clientSecret already embedded in the parent <Elements> context
function AddCardForm({
  clientSecret,
  onSuccess,
  onCancel,
}: {
  clientSecret: string;
  onSuccess: (paymentMethodId: string | null) => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSaving(true);
    setError(null);

    const cardEl = elements.getElement(CardElement);
    if (!cardEl) { setSaving(false); return; }

    const { error: confirmError, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: { card: cardEl },
    });

    if (confirmError) {
      setError(confirmError.message ?? "Card setup failed");
      setSaving(false);
      return;
    }

    if (setupIntent?.status === "succeeded") {
      setSucceeded(true);
      const pmId = typeof setupIntent.payment_method === "string" ? setupIntent.payment_method : null;
      setTimeout(() => onSuccess(pmId), 700);
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between pt-4">
        <p className="text-sm font-semibold text-text">Add a new card</p>
        <button type="button" onClick={onCancel} className="text-text-muted hover:text-text transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 rounded-lg border border-border bg-[#0d0d0d] focus-within:border-gold/50 transition-colors">
        <CardElement
          options={{
            style: {
              base: {
                color: "#e0e0e0",
                fontFamily: "system-ui, sans-serif",
                fontSize: "14px",
                "::placeholder": { color: "#555" },
              },
              invalid: { color: "#ef4444" },
            },
          }}
        />
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || succeeded || !stripe}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gold hover:bg-gold-light disabled:opacity-60 text-ink text-sm font-semibold transition-all"
        >
          {succeeded ? (
            <><Check className="w-4 h-4" /> Saved</>
          ) : saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
          ) : (
            "Save card"
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-border text-text-secondary hover:text-text text-sm transition-colors"
        >
          Cancel
        </button>
      </div>

      <p className="text-[11px] text-text-muted text-center">
        Secured by Stripe · Encrypted and never stored on our servers.
      </p>
    </form>
  );
}

export function CardManager() {
  const [cards, setCards] = useState<PaymentMethod[]>([]);
  const [defaultId, setDefaultId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [setupSecret, setSetupSecret] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/payment-methods");
      const data = await res.json();
      setCards(data.paymentMethods ?? []);
      setDefaultId(data.defaultPaymentMethodId ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  const handleAddClick = async () => {
    try {
      const res = await fetch("/api/stripe/payment-methods", { method: "POST" });
      const data = await res.json();
      console.log("[card-manager] POST result:", res.status, "clientSecret?", !!data.clientSecret, "value:", String(data.clientSecret).slice(0, 20));
      if (data.clientSecret) {
        setSetupSecret(data.clientSecret);
        setShowForm(true);
      }
    } catch (err) {
      console.error("[card-manager] handleAddClick error:", err);
    }
  };

  const handleCancel = () => { setShowForm(false); setSetupSecret(null); };

  const handleAddSuccess = async (newPmId: string | null) => {
    setShowForm(false);
    setSetupSecret(null);
    // If this is the customer's very first saved card, make it the default automatically —
    // there's nothing to choose between yet, and it should be usable right away.
    const hadNoCardsBefore = cards.length === 0;
    if (hadNoCardsBefore && newPmId) {
      await fetch(`/api/stripe/payment-methods/${newPmId}/default`, { method: "POST" }).catch(() => {});
    }
    fetchCards();
  };

  const handleRemove = async (pmId: string) => {
    setRemovingId(pmId);
    try {
      await fetch(`/api/stripe/payment-methods/${pmId}`, { method: "DELETE" });
      // Refetch (rather than optimistic local filter) since removing the default
      // card may cause Stripe to reassign or clear the default server-side.
      await fetchCards();
    } finally {
      setRemovingId(null);
    }
  };

  const handleSetDefault = async (pmId: string) => {
    setSettingDefaultId(pmId);
    try {
      const res = await fetch(`/api/stripe/payment-methods/${pmId}/default`, { method: "POST" });
      if (res.ok) setDefaultId(pmId);
    } finally {
      setSettingDefaultId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-text flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-text-muted" />
          Payment Methods
        </h2>
        {!showForm && (
          <button
            onClick={handleAddClick}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gold hover:text-gold-light transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add card
          </button>
        )}
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        {!loading && cards.length === 0 && !showForm && (
          <div className="px-5 py-6 text-sm text-text-muted text-center">
            No saved cards.{" "}
            <button onClick={handleAddClick} className="text-gold hover:text-gold-light underline underline-offset-2 cursor-pointer">
              Add one
            </button>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-text-muted px-5 py-4">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        )}

        {cards.map((card, i) => {
          const isDefault = card.id === defaultId;
          const daysLeft = daysUntilCardExpiry(card.expMonth, card.expYear);
          const isExpired = daysLeft < 0;
          const isExpiringSoon = isCardExpiringSoon(card.expMonth, card.expYear, EXPIRY_WARNING_DAYS);

          return (
            <div
              key={card.id}
              className={`flex items-center gap-4 px-5 py-4 ${i > 0 ? "border-t border-border" : ""}`}
            >
              <div className="w-12 h-8 rounded-md bg-gradient-to-br from-surface-raised to-border flex items-center justify-center flex-shrink-0 border border-border">
                <CardBrandBadge brand={card.brand} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-text capitalize">
                    {card.brand} ···· {card.last4}
                  </p>
                  {isDefault && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      Default
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-0.5 ${isExpired ? "text-red-400" : isExpiringSoon ? "text-amber-400" : "text-text-muted"}`}>
                  Expires {String(card.expMonth).padStart(2, "0")}/{card.expYear}
                  {isExpired && (
                    <span className="inline-flex items-center gap-1 ml-2">
                      <AlertTriangle className="w-3 h-3" /> Expired
                    </span>
                  )}
                  {isExpiringSoon && (
                    <span className="inline-flex items-center gap-1 ml-2">
                      <AlertTriangle className="w-3 h-3" /> Expires soon
                    </span>
                  )}
                </p>
              </div>
              {!isDefault && (
                <button
                  onClick={() => handleSetDefault(card.id)}
                  disabled={settingDefaultId === card.id}
                  className="text-xs font-medium text-text-muted hover:text-gold transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {settingDefaultId === card.id ? "Setting…" : "Set as default"}
                </button>
              )}
              <button
                onClick={() => handleRemove(card.id)}
                disabled={removingId === card.id}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors disabled:opacity-50 flex-shrink-0"
                aria-label="Remove card"
              >
                {removingId === card.id
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          );
        })}

        {/* Add card form */}
        {showForm && setupSecret && (
          <div className={`px-5 pb-5 ${cards.length > 0 ? "border-t border-border" : ""}`}>
            <Elements
              stripe={getStripePromise()}
              options={{
                appearance: {
                  theme: "night",
                  variables: {
                    colorPrimary: "#d4af37",
                    colorBackground: "#0d0d0d",
                    colorText: "#e0e0e0",
                    borderRadius: "8px",
                  },
                },
              }}
            >
              <AddCardForm
                clientSecret={setupSecret}
                onSuccess={handleAddSuccess}
                onCancel={handleCancel}
              />
            </Elements>
          </div>
        )}
      </div>
    </div>
  );
}
