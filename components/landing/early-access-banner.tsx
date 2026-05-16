import { Sparkles } from "lucide-react";

/**
 * Slim early-access pricing banner.
 * Displayed near the top of the homepage, pricing page, and checkout pages.
 * Static — no fake countdown logic.
 */
export function EarlyAccessBanner() {
  return (
    <div className="w-full bg-gold/10 border-b border-gold/20 text-center py-2.5 px-4">
      <p className="text-sm text-gold font-medium flex items-center justify-center gap-2 flex-wrap">
        <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
        <span>
          Early access:{" "}
          <strong>$99 lifetime access</strong>
          {" — "}
          <span className="line-through text-gold/60 font-normal">regular price $149</span>
          {" · "}
          <span className="text-gold/80 font-normal">14-day early access offer</span>
        </span>
      </p>
    </div>
  );
}
