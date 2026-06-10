import {
  ArrowRight,
  ExternalLink,
  TrendingUp,
  Users,
  ShoppingCart,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  BarChart2,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getAdminAnalyticsData } from "@/lib/queries/admin";

export const metadata = { title: "Analytics | Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(cents / 100);
}

function pct(num: number, den: number) {
  if (!den) return "—";
  return `${Math.round((num / den) * 100)}%`;
}

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active:    { label: "Active",    color: "text-emerald-400" },
  trialing:  { label: "Trialing",  color: "text-blue-400" },
  past_due:  { label: "Past due",  color: "text-red-400" },
  canceled:  { label: "Cancelled", color: "text-zinc-500" },
  cancelled: { label: "Cancelled", color: "text-zinc-500" },
  incomplete: { label: "Incomplete", color: "text-amber-400" },
};

const PLAN_LABELS: Record<string, string> = {
  complete:     "Individual Lifetime",
  family:       "Family Lifetime",
  familyTrial:  "Family Trial",
  familyMonthly:"Family Monthly",
  monthly:      "Monthly",
  individualTrial: "Individual Trial",
};

export default async function AdminAnalyticsPage() {
  await requireAdmin();
  const data = await getAdminAnalyticsData();
  const { funnel, planStats, subStats, recentAbandoned } = data;

  const activeSubCount = subStats.filter((s) => s.status === "active" || s.status === "trialing").reduce((a, b) => a + b.count, 0);
  const pastDueCount   = subStats.find((s) => s.status === "past_due")?.count ?? 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-10">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BarChart2 className="w-4 h-4 text-gold" />
          <p className="text-xs text-gold uppercase tracking-wider font-semibold">Admin · Analytics</p>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text">Purchase & Checkout Analytics</h1>
        <p className="text-text-secondary mt-1 text-sm">
          Conversion funnel, plan breakdown, and checkout abandonment from your database.
        </p>
      </div>

      {/* Vercel Analytics link */}
      <div className="rounded-xl border border-border bg-surface p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <TrendingUp className="w-5 h-5 text-gold flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text">Page views & traffic</p>
            <p className="text-xs text-text-secondary mt-0.5 truncate">
              Vercel Analytics is already recording every page visit. View the full report on Vercel.
            </p>
          </div>
        </div>
        <a
          href="https://vercel.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gold hover:bg-gold-light text-black text-xs font-bold transition-colors flex-shrink-0"
        >
          Open Vercel Analytics <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Conversion funnel */}
      <section>
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
          <ArrowRight className="w-4 h-4" /> Checkout Conversion Funnel
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: "Signups",
              value: funnel.totalSignups,
              sub: "100% — all students",
              icon: Users,
              color: "text-zinc-400",
            },
            {
              label: "Started checkout",
              value: funnel.startedCheckout,
              sub: `${pct(funnel.startedCheckout, funnel.totalSignups)} of signups`,
              icon: ShoppingCart,
              color: "text-blue-400",
            },
            {
              label: "Purchased",
              value: funnel.completedPurchase,
              sub: `${pct(funnel.completedPurchase, funnel.startedCheckout)} of checkout starts`,
              icon: CheckCircle2,
              color: "text-emerald-400",
            },
            {
              label: "Abandoned",
              value: funnel.abandonedCheckout,
              sub: `${pct(funnel.abandonedCheckout, funnel.startedCheckout)} of checkout starts`,
              icon: XCircle,
              color: "text-red-400",
            },
          ].map(({ label, value, sub, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-4 h-4 ${color}`} />
                <p className="text-xs text-text-muted uppercase tracking-wider">{label}</p>
              </div>
              <p className="text-3xl font-bold text-text tabular-nums">{value.toLocaleString()}</p>
              <p className="text-xs text-text-muted mt-1">{sub}</p>
            </div>
          ))}
        </div>

        {/* Funnel bar */}
        <div className="mt-4 rounded-xl border border-border bg-surface p-4 space-y-2">
          {[
            { label: "Signups", value: funnel.totalSignups, color: "bg-zinc-600" },
            { label: "Started checkout", value: funnel.startedCheckout, color: "bg-blue-500" },
            { label: "Purchased", value: funnel.completedPurchase, color: "bg-emerald-500" },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-3">
              <p className="text-xs text-text-muted w-36 flex-shrink-0">{label}</p>
              <div className="flex-1 bg-surface-raised rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full ${color}`}
                  style={{ width: `${funnel.totalSignups ? Math.max(2, (value / funnel.totalSignups) * 100) : 0}%` }}
                />
              </div>
              <p className="text-xs font-semibold text-text tabular-nums w-10 text-right">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Plan breakdown */}
      <section>
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4" /> Revenue by Plan
        </h2>
        {planStats.length === 0 ? (
          <p className="text-sm text-text-muted">No purchases yet.</p>
        ) : (
          <div className="rounded-2xl border border-border bg-surface overflow-hidden">
            <table className="w-full">
              <thead className="bg-surface-raised border-b border-border">
                <tr className="text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Plan</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Orders</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {planStats.map((p) => (
                  <tr key={p.planId} className="hover:bg-surface-raised/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-text">
                      {PLAN_LABELS[p.planId] ?? p.planName ?? p.planId}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary tabular-nums text-right">{p.count}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-text tabular-nums text-right">{fmt(p.revenueCents)}</td>
                  </tr>
                ))}
                {/* Total row */}
                <tr className="bg-surface-raised">
                  <td className="px-4 py-3 text-sm font-semibold text-text">Total</td>
                  <td className="px-4 py-3 text-sm font-semibold text-text tabular-nums text-right">
                    {planStats.reduce((a, b) => a + b.count, 0)}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gold tabular-nums text-right">
                    {fmt(planStats.reduce((a, b) => a + b.revenueCents, 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Subscription health */}
      <section>
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Subscription Health
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Active / Trialing</p>
            <p className="text-3xl font-bold text-emerald-400 tabular-nums">{activeSubCount}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Past due</p>
            <p className={`text-3xl font-bold tabular-nums ${pastDueCount > 0 ? "text-red-400" : "text-text"}`}>{pastDueCount}</p>
            {pastDueCount > 0 && (
              <p className="text-xs text-red-400/70 mt-1">Payment failed — retrying</p>
            )}
          </div>
          {subStats
            .filter((s) => s.status !== "active" && s.status !== "trialing" && s.status !== "past_due")
            .slice(0, 2)
            .map((s) => {
              const meta = STATUS_LABELS[s.status] ?? { label: s.status, color: "text-zinc-400" };
              return (
                <div key={s.status} className="rounded-2xl border border-border bg-surface p-5">
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-2">{meta.label}</p>
                  <p className={`text-3xl font-bold tabular-nums ${meta.color}`}>{s.count}</p>
                </div>
              );
            })}
        </div>
      </section>

      {/* Checkout abandonment */}
      <section>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Checkout Abandonment
            <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-xs font-bold">
              {funnel.abandonedCheckout}
            </span>
          </h2>
          <p className="text-xs text-text-muted">
            Users who reached checkout (Stripe customer created) but never completed a purchase.
            Showing {Math.min(25, recentAbandoned.length)} most recent.
          </p>
        </div>

        {recentAbandoned.length === 0 ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-emerald-400">No abandoned checkouts</p>
            <p className="text-xs text-text-muted mt-1">Everyone who started checkout completed their purchase.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-surface overflow-hidden">
            <table className="w-full">
              <thead className="bg-surface-raised border-b border-border">
                <tr className="text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider hidden sm:table-cell">Email</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider hidden md:table-cell">Joined</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider hidden md:table-cell">Last seen</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Verified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentAbandoned.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-raised/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm text-text">{u.fullName ?? "—"}</p>
                      <p className="text-xs text-text-muted sm:hidden">{u.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary hidden sm:table-cell">{u.email}</td>
                    <td className="px-4 py-3 text-sm text-text-muted tabular-nums hidden md:table-cell">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-sm text-text-muted tabular-nums hidden md:table-cell">{formatDate(u.lastLoginAt)}</td>
                    <td className="px-4 py-3">
                      {u.emailVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" /> Yes
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Footer link to students page */}
      <div className="flex justify-end">
        <Link
          href="/admin/students"
          className="inline-flex items-center gap-1.5 text-sm text-gold hover:text-gold-light transition-colors"
        >
          View all students <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  );
}
