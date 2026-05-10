import { requireAdmin } from "@/lib/auth";
import { getAdminOrdersData } from "@/lib/queries/admin";
import { formatPrice } from "@/lib/stripe-config";
import { ShoppingCart, DollarSign, Users, CheckCircle2, Clock, XCircle } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";

export const metadata = { title: "Orders | TheMuslimMan" };
export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  succeeded: { label: "Paid", className: "text-emerald-400 bg-emerald-500/10" },
  pending:   { label: "Pending", className: "text-amber-400 bg-amber-500/10" },
  failed:    { label: "Failed", className: "text-red-400 bg-red-500/10" },
};

export default async function AdminOrdersPage() {
  await requireAdmin();
  const { purchases, totalRevenueCents, totalOrders, uniqueBuyers } = await getAdminOrdersData();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-text mb-1">Orders</h1>
        <p className="text-text-secondary text-sm">
          All purchases for the Complete Seerah course.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Total revenue"
          value={formatPrice(totalRevenueCents)}
          icon={DollarSign}
          tone="success"
        />
        <StatCard label="Orders" value={totalOrders} icon={ShoppingCart} />
        <StatCard label="Unique buyers" value={uniqueBuyers} icon={Users} tone="gold" />
      </div>

      {/* Orders table */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-raised border-b border-border">
            <tr className="text-left">
              <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Student</th>
              <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider hidden sm:table-cell">Email</th>
              <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Plan</th>
              <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Amount</th>
              <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider hidden md:table-cell">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {purchases.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-text-muted">
                  No orders yet.
                </td>
              </tr>
            ) : (
              purchases.map((p) => {
                const status = STATUS_STYLES[p.status] ?? { label: p.status, className: "text-text-muted bg-surface-raised" };
                return (
                  <tr key={p.id} className="hover:bg-surface-raised/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-text font-medium">{p.user.fullName}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary hidden sm:table-cell">{p.user.email}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{p.planName}</td>
                    <td className="px-4 py-3 text-sm text-text tabular-nums text-right font-medium">
                      {formatPrice(p.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                        {p.status === "succeeded" && <CheckCircle2 className="w-3 h-3" />}
                        {p.status === "pending" && <Clock className="w-3 h-3" />}
                        {p.status === "failed" && <XCircle className="w-3 h-3" />}
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted tabular-nums hidden md:table-cell">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
