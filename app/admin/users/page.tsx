import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ACTIVE_SUBSCRIPTION_STATUSES } from "@/lib/access";

export const metadata = { title: "Users — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireAdmin();

  const now = new Date();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      hasPaid: true,
      planType: true,
      emailVerified: true,
      createdAt: true,
      purchases: {
        where: { status: "succeeded" },
        select: { id: true, planName: true, amount: true, promoCode: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      subscriptions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          status: true,
          currentPeriodEnd: true,
          cancelAtPeriodEnd: true,
          createdAt: true,
        },
      },
      mobilePurchases: {
        where: { status: "active" },
        select: { platform: true, purchaseType: true, currentPeriodEnd: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      GiftPurchase_GiftPurchase_claimedByUserIdToUser: {
        select: { id: true, createdAt: true },
        take: 1,
      },
    },
  });

  type UserRow = typeof users[number];

  function getAccessLabel(u: UserRow): { label: string; color: string; note: string } {
    if (u.role === "platform_admin") {
      return { label: "Admin", color: "bg-purple-500/15 text-purple-400 border-purple-500/30", note: "Platform admin" };
    }

    const lifetimePurchase = u.purchases[0];
    const sub = u.subscriptions[0];
    const subActive = sub &&
      (ACTIVE_SUBSCRIPTION_STATUSES as readonly string[]).includes(sub.status) &&
      sub.currentPeriodEnd > now;
    const mobile = u.mobilePurchases[0];
    const gift = u.GiftPurchase_GiftPurchase_claimedByUserIdToUser[0];

    if (lifetimePurchase) {
      const note = lifetimePurchase.promoCode
        ? `${lifetimePurchase.planName} · promo: ${lifetimePurchase.promoCode}`
        : lifetimePurchase.planName;
      return { label: "Lifetime", color: "bg-gold/15 text-gold border-gold/30", note };
    }

    if (subActive) {
      return {
        label: "Subscribed",
        color: "bg-green-500/15 text-green-400 border-green-500/30",
        note: `Active · renews ${sub.currentPeriodEnd.toLocaleDateString()}${sub.cancelAtPeriodEnd ? " (cancels)" : ""}`,
      };
    }

    if (mobile) {
      return {
        label: `Mobile (${mobile.platform})`,
        color: "bg-blue-500/15 text-blue-400 border-blue-500/30",
        note: `${mobile.purchaseType}`,
      };
    }

    if (gift) {
      return { label: "Gift", color: "bg-pink-500/15 text-pink-400 border-pink-500/30", note: "Claimed gift" };
    }

    if (u.hasPaid) {
      // hasPaid=true but no purchase/sub/gift trace = manually granted
      return { label: "Free (manual)", color: "bg-amber-500/15 text-amber-400 border-amber-500/30", note: "hasPaid=true, no payment record" };
    }

    if (sub) {
      // has a sub row but it's expired/cancelled
      return {
        label: "Expired",
        color: "bg-red-500/15 text-red-400 border-red-500/30",
        note: `${sub.status} · ended ${sub.currentPeriodEnd.toLocaleDateString()}`,
      };
    }

    return { label: "No access", color: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30", note: "Not purchased" };
  }

  // Separate free (manual) accounts for the warning section
  const freeManual = users.filter((u) => {
    if (u.role === "platform_admin") return false;
    return u.hasPaid && u.purchases.length === 0 && u.subscriptions.length === 0 &&
      u.mobilePurchases.length === 0 &&
      u.GiftPurchase_GiftPurchase_claimedByUserIdToUser.length === 0;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text mb-1">Users</h1>
        <p className="text-text-secondary text-sm">
          {users.length} total accounts · {freeManual.length} with manual free access
        </p>
      </div>

      {/* ── Free (manual) access warning ─────────────────────────────── */}
      {freeManual.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
          <h2 className="text-base font-semibold text-amber-400 mb-1">
            ⚠ {freeManual.length} account{freeManual.length !== 1 ? "s" : ""} with free access (no payment record)
          </h2>
          <p className="text-amber-300/70 text-sm mb-4">
            These accounts have <code className="font-mono bg-amber-500/10 px-1 rounded">hasPaid=true</code> but no
            Purchase, Subscription, Gift, or Mobile purchase row. They were likely granted access manually.
          </p>
          <div className="space-y-1.5">
            {freeManual.map((u) => (
              <div key={u.id} className="flex items-center gap-3 text-sm">
                <span className="font-mono text-amber-300">{u.email}</span>
                <span className="text-amber-300/50">·</span>
                <span className="text-amber-300/70">{u.fullName || "—"}</span>
                <span className="text-amber-300/50">·</span>
                <span className="text-amber-300/50">joined {new Date(u.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── All users table ───────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-surface overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead className="bg-surface-raised border-b border-border">
            <tr className="text-left">
              <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Access</th>
              <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Plan</th>
              <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Note</th>
              <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Verified</th>
              <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => {
              const access = getAccessLabel(u);
              return (
                <tr key={u.id} className="hover:bg-surface-raised/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-text whitespace-nowrap">{u.fullName || <span className="text-text-muted italic">—</span>}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary font-mono">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium whitespace-nowrap ${access.color}`}>
                      {access.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">{u.planType || "—"}</td>
                  <td className="px-4 py-3 text-xs text-text-muted max-w-xs truncate">{access.note}</td>
                  <td className="px-4 py-3 text-xs">
                    {u.emailVerified
                      ? <span className="text-green-400">✓</span>
                      : <span className="text-red-400">✗</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-muted tabular-nums whitespace-nowrap">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
