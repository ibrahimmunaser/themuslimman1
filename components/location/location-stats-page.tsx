interface Purchase {
  id: string;
  amount: number;
  createdAt: Date;
  userEmail: string;
}

interface LocationStatsPageProps {
  displayName: string;
  promoCode: string;
  totalClicks: number;
  totalPurchases: number;
  totalRevenueCents: number;
  lastUpdated: Date;
  purchases: Purchase[];
}

export function LocationStatsPage({
  displayName,
  promoCode,
  totalClicks,
  totalPurchases,
  totalRevenueCents,
  lastUpdated,
  purchases,
}: LocationStatsPageProps) {
  const conversionRate =
    totalClicks > 0
      ? ((totalPurchases / totalClicks) * 100).toFixed(1)
      : "0.0";

  const revenueFormatted = (totalRevenueCents / 100).toLocaleString("en-US", {
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
            Location Campaign
          </p>
          <h1 className="text-3xl font-bold text-white">{displayName} Stats</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Promo code:{" "}
            <span className="font-mono text-amber-400 font-semibold">{promoCode}</span>
            {" · "}
            <span className="text-zinc-600">20% off lifetime access</span>
          </p>
        </div>

        {/* Revenue highlight */}
        <div className="mb-8 border border-amber-500/30 rounded-xl p-5 bg-amber-500/5">
          <p className="text-xs font-semibold text-amber-500/70 uppercase tracking-wider mb-1">
            Total Revenue
          </p>
          <p className="text-4xl font-bold text-amber-400">{revenueFormatted}</p>
          <p className="text-xs text-zinc-500 mt-1">
            from {totalPurchases} sale{totalPurchases !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Metrics */}
        <div className="space-y-3 mb-10">
          <StatRow label="Link Clicks" value={totalClicks.toLocaleString()} />
          <StatRow label="Purchases" value={totalPurchases.toLocaleString()} />
          <StatRow label="Conversion Rate" value={`${conversionRate}%`} />
        </div>

        {/* Purchase history */}
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
            Purchase History
          </p>

          {purchases.length === 0 ? (
            <div className="border border-zinc-800 rounded-xl px-5 py-10 bg-zinc-900/40 text-center">
              <p className="text-zinc-600 text-sm">No purchases yet.</p>
              <p className="text-zinc-700 text-xs mt-1">
                Sales using <span className="font-mono">{promoCode}</span> will appear here.
              </p>
            </div>
          ) : (
            <div className="border border-zinc-800 rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/60">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">#</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Time</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Email</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((p, i) => {
                    const d = new Date(p.createdAt);
                    const date = new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }).format(d);
                    const time = new Intl.DateTimeFormat("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZoneName: "short",
                    }).format(d);
                    const amount = (p.amount / 100).toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    });

                    return (
                      <tr
                        key={p.id}
                        className="border-b border-zinc-800/60 last:border-0 bg-zinc-900/20 hover:bg-zinc-900/50 transition-colors"
                      >
                        <td className="px-4 py-4 text-zinc-600 text-xs">{i + 1}</td>
                        <td className="px-4 py-4 text-zinc-300 whitespace-nowrap">{date}</td>
                        <td className="px-4 py-4 text-zinc-500 text-xs whitespace-nowrap">{time}</td>
                        <td className="px-4 py-4 text-zinc-300 font-mono text-xs">{maskEmail(p.userEmail)}</td>
                        <td className="px-4 py-4 text-right text-amber-400 font-semibold whitespace-nowrap">{amount}</td>
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

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, 3);
  return `${visible}***@${domain}`;
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border border-zinc-800 rounded-xl px-5 py-4 bg-zinc-900/40">
      <span className="text-zinc-400 text-sm">{label}</span>
      <span className="text-xl font-bold text-white">{value}</span>
    </div>
  );
}
