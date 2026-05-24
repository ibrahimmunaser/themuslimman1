import { TrendingUp, ShoppingBag, DollarSign, Percent, Clock } from "lucide-react";

interface Purchase {
  id: string;
  amount: number;
  currency: string;
  createdAt: Date;
  userEmail: string;
  promoCode: string | null;
}

interface InfluencerStatsPageProps {
  creatorSlug: string;
  displayName: string;
  promoCode: string;
  totalClicks: number;
  clicksThisWeek: number;
  clicksThisMonth: number;
  purchases: Purchase[];
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "****";
  const masked = local.length > 2
    ? local[0] + "*".repeat(Math.min(local.length - 1, 4))
    : "****";
  return `${masked}@${domain}`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(date));
}

export function InfluencerStatsPage({
  displayName,
  promoCode,
  totalClicks,
  clicksThisWeek,
  clicksThisMonth,
  purchases,
}: InfluencerStatsPageProps) {
  const totalRevenue = purchases.reduce((sum, p) => sum + p.amount, 0);
  const conversionRate = totalClicks > 0
    ? ((purchases.length / totalClicks) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{displayName}</h1>
              <p className="text-zinc-400 text-sm">
                Creator stats · Promo code:{" "}
                <span className="font-mono text-amber-400 font-semibold">{promoCode}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Top metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCard
            icon={<TrendingUp className="w-4 h-4 text-blue-400" />}
            label="Total Clicks"
            value={totalClicks.toLocaleString()}
            sub={`${clicksThisMonth} this month`}
            color="blue"
          />
          <MetricCard
            icon={<ShoppingBag className="w-4 h-4 text-green-400" />}
            label="Purchases"
            value={purchases.length.toLocaleString()}
            sub="via promo code"
            color="green"
          />
          <MetricCard
            icon={<DollarSign className="w-4 h-4 text-amber-400" />}
            label="Revenue"
            value={`$${(totalRevenue / 100).toFixed(0)}`}
            sub="total generated"
            color="amber"
          />
          <MetricCard
            icon={<Percent className="w-4 h-4 text-purple-400" />}
            label="Conversion"
            value={`${conversionRate}%`}
            sub="clicks → purchases"
            color="purple"
          />
        </div>

        {/* Click breakdown */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
            Click Breakdown
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{clicksThisWeek}</p>
              <p className="text-xs text-zinc-500 mt-1">This week</p>
            </div>
            <div className="text-center border-x border-zinc-800">
              <p className="text-2xl font-bold text-white">{clicksThisMonth}</p>
              <p className="text-xs text-zinc-500 mt-1">This month</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{totalClicks}</p>
              <p className="text-xs text-zinc-500 mt-1">All time</p>
            </div>
          </div>
        </div>

        {/* Recent purchases */}
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
            Purchases via {promoCode}
          </h2>

          {purchases.length === 0 ? (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center">
              <ShoppingBag className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">No purchases yet via this promo code.</p>
              <p className="text-zinc-600 text-xs mt-1">
                When someone uses <span className="text-amber-500 font-mono">{promoCode}</span>, it will appear here.
              </p>
            </div>
          ) : (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider">
                    <th className="px-5 py-3 text-left">Customer</th>
                    <th className="px-5 py-3 text-left">Promo</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3 text-right hidden sm:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((p, i) => (
                    <tr
                      key={p.id}
                      className={`border-b border-zinc-800/50 ${i === purchases.length - 1 ? "border-none" : ""}`}
                    >
                      <td className="px-5 py-3.5 text-zinc-300 font-mono text-xs">
                        {maskEmail(p.userEmail)}
                      </td>
                      <td className="px-5 py-3.5">
                        {p.promoCode ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                            {p.promoCode}
                          </span>
                        ) : (
                          <span className="text-zinc-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-green-400">
                        ${(p.amount / 100).toFixed(0)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-zinc-500 text-xs hidden sm:table-cell">
                        <span className="flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(p.createdAt)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="px-5 py-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                <span>{purchases.length} purchase{purchases.length !== 1 ? "s" : ""}</span>
                <span className="text-green-400 font-semibold">
                  Total: ${(totalRevenue / 100).toFixed(0)}
                </span>
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-zinc-700 text-center pb-4">
          Stats are live · Emails are masked for privacy · Purchases via <span className="font-mono">{promoCode}</span> only
        </p>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: "blue" | "green" | "amber" | "purple";
}) {
  const borderColor = {
    blue: "border-blue-500/20",
    green: "border-green-500/20",
    amber: "border-amber-500/20",
    purple: "border-purple-500/20",
  }[color];

  return (
    <div className={`bg-zinc-900/50 border ${borderColor} rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-zinc-500">{label}</span></div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-zinc-600 mt-0.5">{sub}</p>
    </div>
  );
}
