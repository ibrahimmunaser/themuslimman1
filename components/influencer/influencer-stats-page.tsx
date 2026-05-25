interface Purchase {
  id: string;
  amount: number;
  createdAt: Date;
}

interface InfluencerStatsPageProps {
  displayName: string;
  promoCode: string;
  totalClicks: number;
  totalPurchases: number;
  commissionCents: number;
  lastUpdated: Date;
  purchases: Purchase[];
}

export function InfluencerStatsPage({
  displayName,
  promoCode,
  totalClicks,
  totalPurchases,
  commissionCents,
  lastUpdated,
  purchases,
}: InfluencerStatsPageProps) {
  const conversionRate =
    totalClicks > 0
      ? ((totalPurchases / totalClicks) * 100).toFixed(2)
      : "0.00";

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
      <div className="w-full max-w-2xl mx-auto px-6 py-16">
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
        <div className="space-y-3 mb-10">
          <StatRow label="Clicks" value={totalClicks.toLocaleString()} />
          <StatRow label="Purchases" value={totalPurchases.toLocaleString()} />
          <StatRow label="Conversion rate" value={`${conversionRate}%`} />
        </div>

        {/* Purchases table */}
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
            Purchase History
          </p>

          {purchases.length === 0 ? (
            <div className="border border-zinc-800 rounded-xl px-5 py-10 bg-zinc-900/40 text-center">
              <p className="text-zinc-600 text-sm">No purchases yet.</p>
              <p className="text-zinc-700 text-xs mt-1">Sales using your code will appear here.</p>
            </div>
          ) : (
            <div className="border border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/60">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">#</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Date</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Amount Paid</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Your Cut</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((p, i) => {
                    const date = new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }).format(new Date(p.createdAt));

                    const amountFormatted = (p.amount / 100).toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    });

                    return (
                      <tr
                        key={p.id}
                        className="border-b border-zinc-800/60 last:border-0 bg-zinc-900/20 hover:bg-zinc-900/50 transition-colors"
                      >
                        <td className="px-5 py-4 text-zinc-600 text-xs">{i + 1}</td>
                        <td className="px-5 py-4 text-zinc-300">{date}</td>
                        <td className="px-5 py-4 text-right text-white font-medium">{amountFormatted}</td>
                        <td className="px-5 py-4 text-right text-amber-400 font-semibold">$5.00</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between border border-zinc-800 rounded-xl px-5 py-4 bg-zinc-900/40">
      <span className="text-zinc-400 text-sm">{label}</span>
      <span className="text-xl font-bold text-white">{value}</span>
    </div>
  );
}
