import Link from "next/link";
import {
  Users,
  CreditCard,
  BookOpen,
  TrendingUp,
  Library,
  ChevronRight,
  ShieldCheck,
  Activity,
  MessageCircle,
  CheckCircle2,
  DollarSign,
  ShoppingCart,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminDashboardData } from "@/lib/queries/admin";
import { StatCard } from "@/components/ui/stat-card";
import { formatPrice } from "@/lib/stripe-config";

export const metadata = { title: "Admin Dashboard | TheMuslimMan" };

export default async function AdminDashboardPage() {
  const user = await requireAdmin();
  const data = await getAdminDashboardData();

  const avgScore =
    data.avgQuizScore !== null && data.avgQuizScore !== undefined
      ? `${Math.round(data.avgQuizScore)}%`
      : "—";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-gold" />
          <p className="text-xs text-gold uppercase tracking-wider font-semibold">
            Platform admin
          </p>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text">
          Platform overview
        </h1>
        <p className="text-text-secondary mt-1 text-sm">
          Welcome back, {user.fullName}.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <StatCard label="Total students" value={data.totalStudents} icon={Users} tone="gold" />
        <StatCard label="Paid students" value={data.paidStudents} icon={CreditCard} tone="success" />
        <StatCard
          label="Revenue"
          value={formatPrice(data.totalRevenueCents)}
          icon={DollarSign}
          tone="success"
        />
        <StatCard label="Orders" value={data.totalOrders} icon={ShoppingCart} />
        <StatCard label="Parts completed" value={data.partsCompleted} icon={CheckCircle2} />
        <StatCard
          label="Avg quiz score"
          value={avgScore}
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Quiz Performance */}
        <div className="p-6 rounded-2xl border border-border bg-surface">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-gold" />
            <p className="text-xs text-text-muted uppercase tracking-wider">Quiz performance</p>
          </div>
          <p className="text-3xl font-bold text-text tabular-nums">{avgScore}</p>
          <p className="text-xs text-text-muted mt-1">
            {data.totalQuizCompletions} quiz{data.totalQuizCompletions !== 1 ? "zes" : ""} completed
          </p>
          <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-text-muted">Parts completed</p>
              <p className="text-lg font-bold text-text tabular-nums mt-0.5">{data.partsCompleted}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Paid students</p>
              <p className="text-lg font-bold text-text tabular-nums mt-0.5">{data.paidStudents}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-6 rounded-2xl border border-border bg-surface">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-3">Quick actions</p>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/admin/students"
              className="flex items-center gap-2 p-3 rounded-xl border border-border bg-surface-raised hover:border-gold/30 transition-all text-sm text-text-secondary hover:text-text"
            >
              <Users className="w-4 h-4 text-gold" />
              Students
            </Link>
            <Link
              href="/admin/orders"
              className="flex items-center gap-2 p-3 rounded-xl border border-border bg-surface-raised hover:border-gold/30 transition-all text-sm text-text-secondary hover:text-text"
            >
              <ShoppingCart className="w-4 h-4 text-gold" />
              Orders
            </Link>
            <Link
              href="/admin/content"
              className="flex items-center gap-2 p-3 rounded-xl border border-border bg-surface-raised hover:border-gold/30 transition-all text-sm text-text-secondary hover:text-text"
            >
              <Library className="w-4 h-4 text-gold" />
              Content
            </Link>
            <Link
              href="/admin/analytics"
              className="flex items-center gap-2 p-3 rounded-xl border border-border bg-surface-raised hover:border-gold/30 transition-all text-sm text-text-secondary hover:text-text"
            >
              <Activity className="w-4 h-4 text-gold" />
              Analytics
            </Link>
            <Link
              href="/admin/support"
              className="flex items-center gap-2 p-3 rounded-xl border border-border bg-surface-raised hover:border-gold/30 transition-all text-sm text-text-secondary hover:text-text col-span-2"
            >
              <MessageCircle className="w-4 h-4 text-gold" />
              <span>Support Tickets</span>
              {data.openSupportTickets > 0 && (
                <span className="ml-auto px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold">
                  {data.openSupportTickets}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Signups */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-text-muted uppercase tracking-wider">Recent student signups</p>
          <Link
            href="/admin/students"
            className="text-xs text-gold hover:text-gold-light transition-colors flex items-center gap-1"
          >
            All students <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-raised border-b border-border">
              <tr className="text-left">
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider hidden sm:table-cell">Joined</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.recentSignups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-text-muted">
                    No students yet.
                  </td>
                </tr>
              ) : (
                data.recentSignups.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-raised/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-text">{u.fullName}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{u.email}</td>
                    <td className="px-4 py-3 text-sm text-text-muted tabular-nums hidden sm:table-cell">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {u.hasPaid ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" /> Paid
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted">Free</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
