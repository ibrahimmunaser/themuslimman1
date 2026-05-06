"use client";

import { useState, useEffect, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { CreditCard, Plus, Trash2, Loader2, X, Check } from "lucide-react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
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
  onSuccess: () => void;
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
      setTimeout(onSuccess, 700);
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
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [setupSecret, setSetupSecret] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/payment-methods");
      const data = await res.json();
      setCards(data.paymentMethods ?? []);
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

  const handleAddSuccess = () => {
    setShowForm(false);
    setSetupSecret(null);
    fetchCards();
  };

  const handleRemove = async (pmId: string) => {
    setRemovingId(pmId);
    try {
      await fetch(`/api/stripe/payment-methods/${pmId}`, { method: "DELETE" });
      setCards((prev) => prev.filter((c) => c.id !== pmId));
    } finally {
      setRemovingId(null);
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

        {cards.map((card, i) => (
          <div
            key={card.id}
            className={`flex items-center gap-4 px-5 py-4 ${i > 0 ? "border-t border-border" : ""}`}
          >
            <div className="w-12 h-8 rounded-md bg-gradient-to-br from-surface-raised to-border flex items-center justify-center flex-shrink-0 border border-border">
              <CardBrandBadge brand={card.brand} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text capitalize">
                {card.brand} ···· {card.last4}
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                Expires {String(card.expMonth).padStart(2, "0")}/{card.expYear}
              </p>
            </div>
            <button
              onClick={() => handleRemove(card.id)}
              disabled={removingId === card.id}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors disabled:opacity-50"
              aria-label="Remove card"
            >
              {removingId === card.id
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        ))}

        {/* Add card form */}
        {showForm && setupSecret && (
          <div className={`px-5 pb-5 ${cards.length > 0 ? "border-t border-border" : ""}`}>
            <Elements
              stripe={stripePromise}
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

