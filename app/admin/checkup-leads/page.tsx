import { prisma } from "@/lib/db";
import { Mail, ShoppingCart, UserX, MousePointerClick, Play } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CheckupLeadsPage() {
  const FLOW = "CHECKUP_FOLLOWUP";

  // ── Summary stats ─────────────────────────────────────────────────────────
  const [
    totalLeads,
    emailsSent,
    emailsFailed,
    emailsSkipped,
    unsubs,
    checkoutClicks,
    part1Clicks,
    purchased,
  ] = await Promise.all([
    prisma.seerahCheckupLead.count(),
    prisma.checkupEmailEvent.count({ where: { status: "SENT" } }),
    prisma.checkupEmailEvent.count({ where: { status: "FAILED" } }),
    prisma.checkupEmailEvent.count({ where: { status: "SKIPPED" } }),
    prisma.seerahCheckupLead.count({ where: { unsubscribedAt: { not: null } } }),
    prisma.seerahCheckupLead.count({ where: { checkoutClickedAt: { not: null } } }),
    prisma.seerahCheckupLead.count({ where: { part1ClickedAt: { not: null } } }),
    prisma.seerahCheckupLead.count({ where: { purchasedAt: { not: null } } }),
  ]);

  // Step-specific send counts
  const stepCounts = await prisma.checkupEmailEvent.groupBy({
    by: ["step", "status"],
    _count: { _all: true },
    where: { flowType: FLOW },
  });

  const stepSent: Record<number, number> = {};
  for (const r of stepCounts) {
    if (r.status === "SENT") stepSent[r.step] = (stepSent[r.step] ?? 0) + r._count._all;
  }

  // Recent leads with email events
  const recentLeads = await prisma.seerahCheckupLead.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id:                true,
      email:             true,
      score:             true,
      resultType:        true,
      recommendedPlan:   true,
      source:            true,
      audienceType:      true,
      mainObjection:     true,
      checkoutClickedAt: true,
      part1ClickedAt:    true,
      purchasedAt:       true,
      unsubscribedAt:    true,
      createdAt:         true,
      checkupEmailEvents: {
        select: { step: true, status: true, sentAt: true },
        orderBy: { step: "asc" },
      },
    },
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  function resultLabel(r: string) {
    return r === "strong" ? "Strong" : r === "partial" ? "Partial" : "Scattered";
  }
  function resultColor(r: string) {
    return r === "strong" ? "text-emerald-400" : r === "partial" ? "text-amber-400" : "text-red-400";
  }
  function fmtDate(d: Date | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }
  function stepBadge(events: { step: number; status: string }[], step: number) {
    const ev = events.find(e => e.step === step);
    if (!ev) return <span className="text-zinc-600 text-xs">–</span>;
    const color = ev.status === "SENT" ? "bg-emerald-900 text-emerald-300"
      : ev.status === "FAILED" ? "bg-red-900 text-red-300"
      : "bg-zinc-800 text-zinc-400";
    return <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${color}`}>{ev.status}</span>;
  }

  return (
    <div className="p-6 max-w-screen-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Seerah Checkup Leads</h1>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
        {[
          { label: "Leads",            value: totalLeads,      icon: <Mail className="w-4 h-4" /> },
          { label: "Emails sent",      value: emailsSent,      icon: <Mail className="w-4 h-4 text-emerald-400" /> },
          { label: "Failed",           value: emailsFailed,    icon: <Mail className="w-4 h-4 text-red-400" /> },
          { label: "Skipped",          value: emailsSkipped,   icon: <Mail className="w-4 h-4 text-zinc-500" /> },
          { label: "Checkout clicks",  value: checkoutClicks,  icon: <ShoppingCart className="w-4 h-4 text-gold" /> },
          { label: "Part 1 clicks",    value: part1Clicks,     icon: <Play className="w-4 h-4 text-blue-400" /> },
          { label: "Purchased",        value: purchased,       icon: <MousePointerClick className="w-4 h-4 text-emerald-400" /> },
          { label: "Unsubscribed",     value: unsubs,          icon: <UserX className="w-4 h-4 text-zinc-400" /> },
        ].map(c => (
          <div key={c.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-zinc-400 mb-1.5">{c.icon}<span className="text-xs">{c.label}</span></div>
            <p className="text-2xl font-bold text-white">{c.value}</p>
          </div>
        ))}
      </div>

      {/* ── Email step breakdown ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-8">
        <h2 className="text-sm font-semibold text-zinc-300 mb-3">Email steps sent</h2>
        <div className="flex gap-6">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="text-center">
              <p className="text-xs text-zinc-500 mb-1">Step {s}</p>
              <p className="text-xl font-bold text-white">{stepSent[s] ?? 0}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-600 mt-3">Step 1 = 2h reminder · Step 2 = 24h educational · Step 3 = 72h plan · Step 4 = checkout recovery</p>
      </div>

      {/* ── Leads table ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-300">Recent 100 leads</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500">
                <th className="px-3 py-2 text-left font-medium">Email</th>
                <th className="px-3 py-2 text-left font-medium">Score</th>
                <th className="px-3 py-2 text-left font-medium">Result</th>
                <th className="px-3 py-2 text-left font-medium">Plan</th>
                <th className="px-3 py-2 text-left font-medium">Source</th>
                <th className="px-3 py-2 text-left font-medium">Objection</th>
                <th className="px-3 py-2 text-center font-medium">S1</th>
                <th className="px-3 py-2 text-center font-medium">S2</th>
                <th className="px-3 py-2 text-center font-medium">S3</th>
                <th className="px-3 py-2 text-center font-medium">S4</th>
                <th className="px-3 py-2 text-center font-medium">Checkout</th>
                <th className="px-3 py-2 text-center font-medium">Part 1</th>
                <th className="px-3 py-2 text-center font-medium">Purchased</th>
                <th className="px-3 py-2 text-center font-medium">Unsub</th>
                <th className="px-3 py-2 text-left font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {recentLeads.map(lead => (
                <tr key={lead.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-3 py-2 text-zinc-300 max-w-[180px] truncate">{lead.email}</td>
                  <td className="px-3 py-2 text-white font-semibold">{lead.score}</td>
                  <td className={`px-3 py-2 font-medium ${resultColor(lead.resultType)}`}>{resultLabel(lead.resultType)}</td>
                  <td className="px-3 py-2 text-zinc-400">{lead.recommendedPlan}</td>
                  <td className="px-3 py-2 text-zinc-500">{lead.source ?? "—"}</td>
                  <td className="px-3 py-2 text-zinc-500 max-w-[160px] truncate">{lead.mainObjection ?? "—"}</td>
                  <td className="px-3 py-2 text-center">{stepBadge(lead.checkupEmailEvents, 1)}</td>
                  <td className="px-3 py-2 text-center">{stepBadge(lead.checkupEmailEvents, 2)}</td>
                  <td className="px-3 py-2 text-center">{stepBadge(lead.checkupEmailEvents, 3)}</td>
                  <td className="px-3 py-2 text-center">{stepBadge(lead.checkupEmailEvents, 4)}</td>
                  <td className="px-3 py-2 text-center">{lead.checkoutClickedAt ? <span className="text-gold">✓</span> : <span className="text-zinc-700">–</span>}</td>
                  <td className="px-3 py-2 text-center">{lead.part1ClickedAt ? <span className="text-blue-400">✓</span> : <span className="text-zinc-700">–</span>}</td>
                  <td className="px-3 py-2 text-center">{lead.purchasedAt ? <span className="text-emerald-400">✓</span> : <span className="text-zinc-700">–</span>}</td>
                  <td className="px-3 py-2 text-center">{lead.unsubscribedAt ? <span className="text-red-400">✓</span> : <span className="text-zinc-700">–</span>}</td>
                  <td className="px-3 py-2 text-zinc-500 whitespace-nowrap">{fmtDate(lead.createdAt)}</td>
                </tr>
              ))}
              {recentLeads.length === 0 && (
                <tr>
                  <td colSpan={15} className="px-3 py-8 text-center text-zinc-600">No leads yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
