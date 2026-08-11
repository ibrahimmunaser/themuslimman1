"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import type { CourseLang } from "@/lib/course-lang";
import { t } from "@/lib/ui-strings";

interface Props {
  /** Button text. Defaults to "Manage billing". */
  label?: string;
  /**
   * "alert" = urgent red styling for payment-failure banners.
   * "default" = neutral styling for general subscription management.
   */
  variant?: "alert" | "default";
  lang?: CourseLang;
}

export function PortalButton({ label, variant = "default", lang = "en" }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? t(lang, "somethingWentWrong"));
        setLoading(false);
      }
    } catch {
      setError(t(lang, "couldNotOpenPortal"));
      setLoading(false);
    }
  }

  const className =
    variant === "alert"
      ? "inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      : "inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-text-secondary hover:text-text text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <div>
      <button onClick={openPortal} disabled={loading} className={className}>
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <CreditCard className="w-4 h-4" />
        )}
        {loading ? t(lang, "openingEllipsis") : (label ?? t(lang, "managingBilling"))}
      </button>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
