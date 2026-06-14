import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export const metadata = { title: "Ann Arbor Stats", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const CREATOR = "annarbor";

const FUNNEL_EVENTS = [
  { key: "annarbor_landing_page_view", label: "Landing page views" },
  { key: "student_lifetime_cta_clicked", label: "Student lifetime CTA clicks" },
  { key: "watch_part1_clicked", label: "Watch Part 1 clicks" },
  { key: "checkout_loaded_student_lifetime", label: "Checkout loaded (student)" },
  { key: "checkout_form_submitted", label: "Checkout form submitted" },
  { key: "purchase_completed", label: "Purchases" },
  { key: "change_plan_clicked", label: "Change plan clicks" },
];

function maskEmail(email: string | null) {
  if (!email) return "—";
  const [u, d] = email.split("@");
  return `${u.slice(0, 2)}***@${d}`;
}

function fmtDollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function AnnArborStatsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const validKey = process.env.ANNARBOR_STATS_KEY;
  if (!validKey || params.key !== validKey) return notFound();

  const [rawClicks, events, purchases] = await Promise.all([
    prisma.influencerClick.count({ where: { creator: CREATOR } }),
    prisma.influencerEvent.findMany({
      where: { creator: CREATOR },
      orderBy: { createdAt: "desc" },
    }),
    prisma.purchase.findMany({
      where: { creator: CREATOR, status: "succeeded" },
      select: { id: true, amount: true, createdAt: true, promoCode: true, user: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const uniqueVisitors = new Set(events.map((e) => e.visitorId)).size;
  const uniqueSessions = new Set(events.map((e) => e.sessionId)).size;
  const landingViews = events.filter((e) => e.eventType === "annarbor_landing_page_view").length;
  const ctaClicks = events.filter((e) => e.eventType === "student_lifetime_cta_clicked").length;
  const totalRevenue = purchases.reduce((s, p) => s + p.amount, 0);

  const funnelRows = FUNNEL_EVENTS.map(({ key, label }) => {
    const count = events.filter((e) => e.eventType === key).length;
    const sessions = new Set(events.filter((e) => e.eventType === key).map((e) => e.sessionId)).size;
    const convRate = landingViews > 0 ? ((count / landingViews) * 100).toFixed(1) : "—";
    return { key, label, count, sessions, convRate };
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Ann Arbor — Student Funnel Stats</h1>
          <p className="text-zinc-500 text-sm mt-1">Promo: ANNARBOR29 ($29 student lifetime)</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "Raw Page Loads", value: rawClicks },
            { label: "Unique Visitors", value: uniqueVisitors },
            { label: "Unique Sessions", value: uniqueSessions },
            { label: "CTA Clicks", value: ctaClicks },
            { label: "Purchases", value: purchases.length },
            { label: "Revenue", value: fmtDollars(totalRevenue) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
              <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">{label}</p>
              <p className="text-2xl font-bold text-gold">{value}</p>
            </div>
          ))}
        </div>

        {/* Funnel table */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h2 className="font-semibold text-sm">Student Funnel</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                <th className="text-left px-5 py-3">Event</th>
                <th className="text-right px-5 py-3">Count</th>
                <th className="text-right px-5 py-3">Sessions</th>
                <th className="text-right px-5 py-3">Conv. from view</th>
              </tr>
            </thead>
            <tbody>
              {funnelRows.map(({ key, label, count, sessions, convRate }) => (
                <tr key={key} className="border-b border-zinc-800/60 hover:bg-zinc-800/30">
                  <td className="px-5 py-3 text-zinc-300">{label}</td>
                  <td className="px-5 py-3 text-right font-mono text-gold">{count}</td>
                  <td className="px-5 py-3 text-right font-mono text-zinc-400">{sessions}</td>
                  <td className="px-5 py-3 text-right font-mono text-zinc-500">{convRate}{convRate !== "—" ? "%" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Purchases */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h2 className="font-semibold text-sm">Purchases ({purchases.length})</h2>
          </div>
          {purchases.length === 0 ? (
            <p className="px-5 py-6 text-zinc-500 text-sm">No purchases yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="text-left px-5 py-3">Email</th>
                  <th className="text-left px-5 py-3">Promo</th>
                  <th className="text-right px-5 py-3">Amount</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => (
                  <tr key={p.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/30">
                    <td className="px-5 py-3 text-zinc-400 text-xs">{p.createdAt.toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-zinc-300 text-xs">{maskEmail(p.user.email)}</td>
                    <td className="px-5 py-3 text-zinc-400 text-xs">{p.promoCode ?? "—"}</td>
                    <td className="px-5 py-3 text-right font-mono text-gold">{fmtDollars(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent events */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h2 className="font-semibold text-sm">Recent Events (last 50)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500">
                  <th className="text-left px-4 py-2">Time</th>
                  <th className="text-left px-4 py-2">Event</th>
                  <th className="text-left px-4 py-2">Plan</th>
                  <th className="text-left px-4 py-2">Session</th>
                </tr>
              </thead>
              <tbody>
                {events.slice(0, 50).map((e) => (
                  <tr key={e.id} className="border-b border-zinc-800/40 hover:bg-zinc-800/20">
                    <td className="px-4 py-2 text-zinc-500 whitespace-nowrap">{e.createdAt.toLocaleString()}</td>
                    <td className="px-4 py-2 text-zinc-300">{e.eventType}</td>
                    <td className="px-4 py-2 text-zinc-500">{e.plan ?? "—"}</td>
                    <td className="px-4 py-2 text-zinc-600 font-mono">{e.sessionId.slice(0, 8)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
