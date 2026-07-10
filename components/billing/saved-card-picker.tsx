"use client";

import { useEffect, useState } from "react";
import { CreditCard, Check, Star, AlertTriangle } from "lucide-react";
import { isCardExpired, isValidSavedCardList, pickInitialSavedCard, type SavedCardLike } from "@/lib/saved-cards";

interface PaymentMethod extends SavedCardLike {
  brand: string;
  last4: string;
}

function CardBrandBadge({ brand }: { brand: string }) {
  const b = brand.toLowerCase();
  if (b === "visa") return <span className="font-bold italic text-blue-400 text-[10px] tracking-wider">VISA</span>;
  if (b === "mastercard") return (
    <span className="inline-flex items-center">
      <span className="w-3 h-3 rounded-full bg-red-500 opacity-90" />
      <span className="w-3 h-3 rounded-full bg-yellow-400 opacity-90 -ml-1.5" />
    </span>
  );
  if (b === "amex") return <span className="font-bold text-blue-300 text-[10px] tracking-wider">AMEX</span>;
  if (b === "discover") return <span className="font-bold text-orange-400 text-[10px] tracking-wider">DISC</span>;
  return <CreditCard className="w-3.5 h-3.5 text-zinc-400" />;
}

const NEW_CARD = "__new_card__";

/**
 * Reusable "pay with a saved card, or add a new one" picker for checkout flows.
 *
 * Designed to be dropped into ANY checkout page for an authenticated user who may
 * already be a Stripe customer — e.g. a lifetime member buying a second/future
 * course, or an upgrade purchase. Fetches cards live from Stripe (never persisted
 * in Prisma) via the existing GET /api/stripe/payment-methods route.
 *
 * Calls onSelect(paymentMethodId) when the user picks a saved (non-expired) card,
 * or onSelect(null) when no usable saved cards exist or the user chooses "Use a
 * new card" — in that case the host page should fall back to its normal new-card
 * entry UI (PaymentElement / CardElement). Every failure mode (request failure,
 * malformed response, zero cards, all cards expired) fails open to onSelect(null).
 */
export function SavedCardPicker({
  onSelect,
}: {
  onSelect: (paymentMethodId: string | null) => void;
}) {
  const [cards, setCards] = useState<PaymentMethod[] | null>(null);
  const [selected, setSelected] = useState<string>(NEW_CARD);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/stripe/payment-methods");
        if (!res.ok) throw new Error("failed to load payment methods");
        const data = await res.json();
        if (cancelled) return;

        const rawList = data?.paymentMethods;
        const list: PaymentMethod[] = isValidSavedCardList(rawList) ? rawList : [];
        if (!isValidSavedCardList(rawList) && rawList !== undefined) {
          console.warn("[saved-card-picker] Malformed paymentMethods response — falling back to new-card flow");
        }
        setCards(list);

        const defaultId: string | null = typeof data?.defaultPaymentMethodId === "string" ? data.defaultPaymentMethodId : null;
        const initial = pickInitialSavedCard(list, defaultId);
        setSelected(initial ?? NEW_CARD);
        onSelect(initial);
      } catch {
        // Network/auth/parse failure — fail open to the normal new-card flow.
        if (!cancelled) { setCards([]); setSelected(NEW_CARD); onSelect(null); }
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = (id: string) => {
    setSelected(id);
    onSelect(id === NEW_CARD ? null : id);
  };

  // Still loading, or no saved cards — render nothing; host page shows its
  // normal new-card entry form (this is also the default first-time-buyer path).
  if (!cards || cards.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-800/40 overflow-hidden">
      <p className="px-3 pt-3 pb-1 text-xs font-medium text-zinc-400">Pay with a saved card</p>
      {cards.map((card) => {
        const isSelected = selected === card.id;
        const expired = isCardExpired(card.expMonth, card.expYear);
        return (
          <button
            key={card.id}
            type="button"
            disabled={expired}
            onClick={() => !expired && choose(card.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 border-t border-zinc-700/60 text-left transition-colors ${
              expired
                ? "opacity-50 cursor-not-allowed"
                : isSelected
                ? "bg-gold/10"
                : "hover:bg-zinc-800/60"
            }`}
          >
            <div className="w-8 h-6 rounded bg-zinc-900 border border-zinc-700 flex items-center justify-center flex-shrink-0">
              <CardBrandBadge brand={card.brand} />
            </div>
            <span className="flex-1 text-sm text-zinc-200 capitalize">
              {card.brand} ···· {card.last4}
            </span>
            {expired ? (
              <span className="inline-flex items-center gap-1 text-xs text-red-400">
                <AlertTriangle className="w-3 h-3" /> Expired
              </span>
            ) : (
              <span className="text-xs text-zinc-500">
                {String(card.expMonth).padStart(2, "0")}/{card.expYear}
              </span>
            )}
            {!expired && (isSelected ? (
              <Check className="w-4 h-4 text-gold flex-shrink-0" />
            ) : (
              <span className="w-4 h-4 flex-shrink-0" />
            ))}
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => choose(NEW_CARD)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 border-t border-zinc-700/60 text-left transition-colors ${
          selected === NEW_CARD ? "bg-gold/10" : "hover:bg-zinc-800/60"
        }`}
      >
        <div className="w-8 h-6 rounded bg-zinc-900 border border-zinc-700 flex items-center justify-center flex-shrink-0">
          <Star className="w-3.5 h-3.5 text-zinc-500" />
        </div>
        <span className="flex-1 text-sm text-zinc-200">Use a new card</span>
        {selected === NEW_CARD ? (
          <Check className="w-4 h-4 text-gold flex-shrink-0" />
        ) : (
          <span className="w-4 h-4 flex-shrink-0" />
        )}
      </button>
    </div>
  );
}
