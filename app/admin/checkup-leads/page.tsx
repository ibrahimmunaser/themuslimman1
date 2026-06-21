import { prisma } from "@/lib/db";
import { Mail, ShoppingCart, UserX, MousePointerClick, Play, Users } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Quiz Leads | Admin" };

const SOURCE_LABELS: Record<string, string> = {
  homepage:          "Homepage",
  theorthodoxmuslim: "The Orthodox Muslim",
  deenresponds:      "Deen Responds",
  browniesaadi:      "Brownie Saadi",
  community:         "Community",
  annarbor:          "Ann Arbor Students",
};

export default async function CheckupLeadsPage() {
  const FLOW = "CHECKUP_FOLLOWUP";

  // ── Global summary ───────────────────────────────────────────────────────
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
    prisma.checkupEmailEvent.count({ where: { flowType: FLOW, status: "SENT" } }),
    prisma.checkupEmailEvent.count({ where: { flowType: FLOW, status: "FAILED" } }),
    prisma.checkupEmailEvent.count({ where: { flowType: FLOW, status: "SKIPPED" } }),
    prisma.seerahCheckupLead.count({ where: { unsubscribedAt: { not: null } } }),
    prisma.seerahCheckupLead.count({ where: { checkoutClickedAt: { not: null } } }),
    prisma.seerahCheckupLead.count({ where: { part1ClickedAt: { not: null } } }),
    prisma.seerahCheckupLead.count({ where: { purchasedAt: { not: null } } }),
  ]);

  // ── Per-source breakdown ─────────────────────────────────────────────────
  const sourceBreakdown = await prisma.seerahCheckupLead.groupBy({
    by: ["source"],
    _count: { _all: true },
    orderBy: { source: "asc" },
  });

  const sourceCheckout = await prisma.seerahCheckupLead.groupBy({
    by: ["source"],
    _count: { _all: true },
    where: { checkoutClickedAt: { not: null } },
  });
  const sourcePurchased = await prisma.seerahCheckupLead.groupBy({
    by: ["source"],
    _count: { _all: true },
    where: { purchasedAt: { not: null } },
  });

  const sourceCheckoutMap: Record<string, number> = {};
  for (const r of sourceCheckout) sourceCheckoutMap[r.source ?? "unknown"] = r._count._all;
  const sourcePurchasedMap: Record<string, number> = {};
  for (const r of sourcePurchased) sourcePurchasedMap[r.source ?? "unknown"] = r._count._all;

  // ── Score distribution ───────────────────────────────────────────────────
  const scoreGroups = await prisma.seerahCheckupLead.groupBy({
    by: ["resultType"],
    _count: { _all: true },
    _avg: { score: true },
  });

  // ── Email step breakdown ─────────────────────────────────────────────────
  const stepCounts = await prisma.checkupEmailEvent.groupBy({
    by: ["step", "status"],
    _count: { _all: true },
    where: { flowType: FLOW },
  });
  const stepSent: Record<number, number> = {};
  const stepFailed: Record<number, number> = {};
  for (const r of stepCounts) {
    if (r.status === "SENT")   stepSent[r.step]   = (stepSent[r.step] ?? 0) + r._count._all;
    if (r.status === "FAILED") stepFailed[r.step] = (stepFailed[r.step] ?? 0) + r._count._all;
  }

  // ── All leads ────────────────────────────────────────────────────────────
  const allLeads = await prisma.seerahCheckupLead.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
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
  function pct(num: number, den: number) {
    if (!den) return "—";
    return `${Math.round((num / den) * 100)}%`;
  }
  function stepBadge(events: { step: number; status: string }[], step: number) {
    const ev = events.find(e => e.step === step);
    if (!ev) return <span className="text-zinc-600 text-xs">–</span>;
    const color = ev.status === "SENT"   ? "bg-emerald-900 text-emerald-300"
                : ev.status === "FAILED" ? "bg-red-900 text-red-300"
                :                          "bg-zinc-800 text-zinc-400";
    return <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${color}`}>{ev.status}</span>;
  }

  return (
    <div className="p-6 max-w-screen-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Quiz Leads & Emails</h1>
        <p className="text-sm text-zinc-400">Every email submitted via a Seerah Checkup quiz — across all sources.</p>
      </div>

      {/* ── Global summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: "Total leads",      value: totalLeads,     icon: <Users className="w-4 h-4" /> },
          { label: "Emails sent",      value: emailsSent,     icon: <Mail className="w-4 h-4 text-emerald-400" /> },
          { label: "Failed",           value: emailsFailed,   icon: <Mail className="w-4 h-4 text-red-400" /> },
          { label: "Skipped",          value: emailsSkipped,  icon: <Mail className="w-4 h-4 text-zinc-500" /> },
          { label: "Checkout clicks",  value: checkoutClicks, icon: <ShoppingCart className="w-4 h-4 text-gold" /> },
          { label: "Part 1 clicks",    value: part1Clicks,    icon: <Play className="w-4 h-4 text-blue-400" /> },
          { label: "Purchased",        value: purchased,      icon: <MousePointerClick className="w-4 h-4 text-emerald-400" /> },
          { label: "Unsubscribed",     value: unsubs,         icon: <UserX className="w-4 h-4 text-zinc-400" /> },
        ].map(c => (
          <div key={c.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-zinc-400 mb-1.5">{c.icon}<span className="text-xs">{c.label}</span></div>
            <p className="text-2xl font-bold text-white">{c.value}</p>
          </div>
        ))}
      </div>

      {/* ── Per-source breakdown ── */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3">Leads by source</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {sourceBreakdown.map(row => {
            const src = row.source ?? "unknown";
            const leads = row._count._all;
            const checkout = sourceCheckoutMap[src] ?? 0;
            const paid = sourcePurchasedMap[src] ?? 0;
            return (
              <div key={src} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <p className="font-semibold text-white mb-0.5">{SOURCE_LABELS[src] ?? src}</p>
                <p className="text-xs text-zinc-500 mb-3 font-mono">{src}</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Leads (emails)</span>
                    <span className="text-white font-bold">{leads}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Checkout clicks</span>
                    <span className="text-gold font-semibold">{checkout} <span className="text-zinc-600">({pct(checkout, leads)})</span></span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Purchased</span>
                    <span className="text-emerald-400 font-semibold">{paid} <span className="text-zinc-600">({pct(paid, leads)})</span></span>
                  </div>
                </div>
              </div>
            );
          })}
          {sourceBreakdown.length === 0 && (
            <div className="col-span-4 bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-600">
              No leads yet.
            </div>
          )}
        </div>
      </div>

      {/* ── Score distribution ── */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-zinc-300 mb-3">Score distribution</h2>
          <div className="space-y-2">
            {scoreGroups.map(g => (
              <div key={g.resultType} className="flex items-center gap-3">
                <span className={`text-xs font-semibold w-20 ${
                  g.resultType === "strong" ? "text-emerald-400" :
                  g.resultType === "partial" ? "text-amber-400" : "text-red-400"
                }`}>{resultLabel(g.resultType)}</span>
                <div className="flex-1 bg-zinc-800 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      g.resultType === "strong" ? "bg-emerald-500" :
                      g.resultType === "partial" ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: pct(g._count._all, totalLeads) }}
                  />
                </div>
                <span className="text-xs text-zinc-400 w-12 text-right">{g._count._all} ({pct(g._count._all, totalLeads)})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Email step sent counts */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-zinc-300 mb-3">Email sequence progress</h2>
          <div className="space-y-2">
            {[
              { step: 1, label: "Step 1 — 2h follow-up" },
              { step: 2, label: "Step 2 — 24h educational" },
              { step: 3, label: "Step 3 — 72h plan match" },
              { step: 4, label: "Step 4 — checkout recovery" },
            ].map(({ step, label }) => (
              <div key={step} className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">{label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-emerald-400">{stepSent[step] ?? 0} sent</span>
                  {(stepFailed[step] ?? 0) > 0 && (
                    <span className="text-xs text-red-400">{stepFailed[step]} failed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-700 mt-4">
            Skipped = lead purchased or unsubscribed before that step ran.
          </p>
        </div>
      </div>

      {/* ── All leads table ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-300">All leads — most recent {allLeads.length}</h2>
          <p className="text-xs text-zinc-500">Showing up to 500</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500">
                <th className="px-3 py-2.5 text-left font-medium">Email</th>
                <th className="px-3 py-2.5 text-left font-medium">Score</th>
                <th className="px-3 py-2.5 text-left font-medium">Result</th>
                <th className="px-3 py-2.5 text-left font-medium">Plan</th>
                <th className="px-3 py-2.5 text-left font-medium">Source</th>
                <th className="px-3 py-2.5 text-left font-medium">Objection</th>
                <th className="px-3 py-2.5 text-center font-medium">S1</th>
                <th className="px-3 py-2.5 text-center font-medium">S2</th>
                <th className="px-3 py-2.5 text-center font-medium">S3</th>
                <th className="px-3 py-2.5 text-center font-medium">S4</th>
                <th className="px-3 py-2.5 text-center font-medium">Checkout</th>
                <th className="px-3 py-2.5 text-center font-medium">Part 1</th>
                <th className="px-3 py-2.5 text-center font-medium">Paid</th>
                <th className="px-3 py-2.5 text-center font-medium">Unsub</th>
                <th className="px-3 py-2.5 text-left font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {allLeads.map(lead => (
                <tr key={lead.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-3 py-2 text-zinc-300 max-w-[200px] truncate">{lead.email}</td>
                  <td className="px-3 py-2 text-white font-semibold">{lead.score}</td>
                  <td className={`px-3 py-2 font-medium ${resultColor(lead.resultType)}`}>{resultLabel(lead.resultType)}</td>
                  <td className="px-3 py-2 text-zinc-400">{lead.recommendedPlan}</td>
                  <td className="px-3 py-2 text-zinc-500">{SOURCE_LABELS[lead.source ?? ""] ?? lead.source ?? "—"}</td>
                  <td className="px-3 py-2 text-zinc-500 max-w-[140px] truncate">{lead.mainObjection ?? "—"}</td>
                  <td className="px-3 py-2 text-center">{stepBadge(lead.checkupEmailEvents, 1)}</td>
                  <td className="px-3 py-2 text-center">{stepBadge(lead.checkupEmailEvents, 2)}</td>
                  <td className="px-3 py-2 text-center">{stepBadge(lead.checkupEmailEvents, 3)}</td>
                  <td className="px-3 py-2 text-center">{stepBadge(lead.checkupEmailEvents, 4)}</td>
                  <td className="px-3 py-2 text-center">{lead.checkoutClickedAt ? <span className="text-gold">✓</span> : <span className="text-zinc-700">–</span>}</td>
                  <td className="px-3 py-2 text-center">{lead.part1ClickedAt ? <span className="text-blue-400">✓</span> : <span className="text-zinc-700">–</span>}</td>
                  <td className="px-3 py-2 text-center">{lead.purchasedAt ? <span className="text-emerald-400 font-bold">✓</span> : <span className="text-zinc-700">–</span>}</td>
                  <td className="px-3 py-2 text-center">{lead.unsubscribedAt ? <span className="text-red-400">✓</span> : <span className="text-zinc-700">–</span>}</td>
                  <td className="px-3 py-2 text-zinc-500 whitespace-nowrap">{fmtDate(lead.createdAt)}</td>
                </tr>
              ))}
              {allLeads.length === 0 && (
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
