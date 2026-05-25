interface InfluencerStatsPageProps {
  displayName: string;
  promoCode: string;
  totalClicks: number;
  clicksThisWeek: number;
  clicksThisMonth: number;
  totalPurchases: number;
  totalRevenueCents: number;
  commissionCents: number;
  lastUpdated: Date;
}

export function InfluencerStatsPage({
  displayName,
  promoCode,
  totalClicks,
  clicksThisWeek,
  clicksThisMonth,
  totalPurchases,
  totalRevenueCents,
  commissionCents,
  lastUpdated,
}: InfluencerStatsPageProps) {
  const conversionRate =
    totalClicks > 0
      ? ((totalPurchases / totalClicks) * 100).toFixed(2)
      : "0.00";

  const revenueFormatted = (totalRevenueCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

  const commissionFormatted = (commissionCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

  const lastUpdatedFormatted = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(lastUpdated);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-start justify-center">
      <div className="w-full max-w-lg mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-10">
          <p className="text-amber-400 text-xs font-semibold uppercase tracking-widest mb-2">
            Creator Campaign
          </p>
          <h1 className="text-3xl font-bold text-white">{displayName} Stats</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Promo code:{" "}
            <span className="font-mono text-amber-400 font-semibold">
              {promoCode}
            </span>
          </p>
        </div>

        {/* Commission */}
        <div className="mb-8 border border-amber-500/30 rounded-xl p-5 bg-amber-500/5">
          <p className="text-xs font-semibold text-amber-500/70 uppercase tracking-wider mb-1">
            Your Commission
          </p>
          <p className="text-4xl font-bold text-amber-400">{commissionFormatted}</p>
          <p className="text-xs text-zinc-500 mt-1">$5 per sale · {totalPurchases} sale{totalPurchases !== 1 ? "s" : ""}</p>
        </div>

        {/* Metrics */}
        <div className="space-y-3">
          <StatRow label="Clicks" value={totalClicks.toLocaleString()} />
          <StatRow label="Purchases" value={totalPurchases.toLocaleString()} />
          <StatRow label="Conversion rate" value={`${conversionRate}%`} />
        </div>

        {/* Click breakdown */}
        <div className="mt-8 border border-zinc-800 rounded-xl p-5 bg-zinc-900/40">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
            Click Breakdown
          </p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xl font-bold text-white">{clicksThisWeek}</p>
              <p className="text-xs text-zinc-600 mt-1">This week</p>
            </div>
            <div className="border-x border-zinc-800">
              <p className="text-xl font-bold text-white">{clicksThisMonth}</p>
              <p className="text-xs text-zinc-600 mt-1">This month</p>
            </div>
            <div>
              <p className="text-xl font-bold text-white">
                {totalClicks.toLocaleString()}
              </p>
              <p className="text-xs text-zinc-600 mt-1">All time</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-zinc-700 text-center mt-10">
          Last updated: {lastUpdatedFormatted}
        </p>
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border border-zinc-800 rounded-xl px-5 py-4 bg-zinc-900/40">
      <span className="text-zinc-400 text-sm">{label}</span>
      <span
        className={`text-xl font-bold ${accent ? "text-amber-400" : "text-white"}`}
      >
        {value}
      </span>
    </div>
  );
}
