import { requireAdmin } from "@/lib/auth";
import { CheckCircle2, AlertTriangle, XCircle, HardDrive, Zap } from "lucide-react";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

function getPublicAssets() {
  const publicDir = path.join(process.cwd(), "public");
  const assets: { path: string; sizeMB: number; note: string }[] = [];

  function walk(dir: string, base = "") {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = base ? `${base}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          walk(fullPath, relPath);
        } else {
          const { size } = fs.statSync(fullPath);
          const sizeMB = size / 1024 / 1024;
          if (sizeMB >= 0.05) {
            assets.push({ path: `/${relPath}`, sizeMB, note: "" });
          }
        }
      }
    } catch {
      // ignore unreadable dirs
    }
  }

  walk(publicDir);
  return assets.sort((a, b) => b.sizeMB - a.sizeMB).slice(0, 20);
}

const ROUTE_AUDIT = [
  {
    route: "/api/media/video/[part]",
    status: "ok" as const,
    behavior: "Returns 410 in production. Dev-only proxy.",
    note: "✓ Fixed",
  },
  {
    route: "/api/media/audio/[part]",
    status: "ok" as const,
    behavior: "Returns 410 in production. Dev-only proxy.",
    note: "✓ Fixed",
  },
  {
    route: "/api/media/image",
    status: "ok" as const,
    behavior: "Returns 410 in production. Dev-only proxy.",
    note: "✓ Fixed Jun 19 2026",
  },
  {
    route: "/api/r2/asset",
    status: "ok" as const,
    behavior:
      "Production: 307 redirect to signed R2 URL — bandwidth goes to Cloudflare, not Vercel. Dev: proxies content.",
    note: "✓ Fixed Jun 19 2026",
  },
  {
    route: "/api/assets/signed-url",
    status: "ok" as const,
    behavior: "Returns signed URL JSON only — no binary content served through Vercel.",
    note: "✓ No bandwidth",
  },
  {
    route: "/api/thumbnails/[partNumber]",
    status: "ok" as const,
    behavior: "302 redirect to signed R2 URL.",
    note: "✓ No bandwidth",
  },
  {
    route: "/api/infographics/[partNumber]",
    status: "ok" as const,
    behavior: "Returns signed URL JSON only.",
    note: "✓ No bandwidth",
  },
  {
    route: "/api/part/[partNumber]/assets",
    status: "ok" as const,
    behavior: "Returns signed URL JSON only — no binary content.",
    note: "✓ No bandwidth",
  },
  {
    route: "/api/slides/[partId]",
    status: "warn" as const,
    behavior: "Returns signed URL JSON. Check if any slide images use the old proxy path.",
    note: "Verify in Observability",
  },
];

const PUBLIC_NOTES: Record<string, string> = {
  "/images/logodashboard.png":
    "⚠ 11.4 MB — favicon switched to logoicon.png. Only used via next/image now (optimized).",
  "/images/logoicon_upscayl_4x_digital-art-4x.png":
    "⚠ 1.75 MB — check if actively used. Replace with logoicon.png if possible.",
  "/images/logoicon_upscayl_2x_digital-art-4x.png":
    "⚠ 0.6 MB — check if actively used.",
  "/images/logoicon.png": "✓ Now used as favicon (0.46 MB, cached 1 year).",
};

export default async function BandwidthPage() {
  await requireAdmin();
  const assets = getPublicAssets();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <HardDrive className="w-6 h-6 text-blue-600" />
            Bandwidth Optimization Report
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Audits Vercel Fast Data Transfer sources. Check Vercel Observability → Top Paths for live
            per-route breakdown.
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Limit
            </p>
            <p className="text-2xl font-bold text-slate-900">100 GB / mo</p>
            <p className="text-xs text-slate-400 mt-1">Vercel Hobby free tier</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Primary Fix
            </p>
            <p className="text-sm font-semibold text-green-700">R2 redirect + favicon swap</p>
            <p className="text-xs text-slate-400 mt-1">Bandwidth now goes to Cloudflare</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Image Cache TTL
            </p>
            <p className="text-2xl font-bold text-slate-900">1 year</p>
            <p className="text-xs text-slate-400 mt-1">/images/* in next.config.ts</p>
          </div>
        </div>

        {/* Route Audit */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" />
              Media API Route Audit
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {ROUTE_AUDIT.map((r) => (
              <div key={r.route} className="flex items-start gap-4 px-6 py-4">
                <div className="mt-0.5 flex-shrink-0">
                  {r.status === "ok" ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-semibold text-slate-900">{r.route}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{r.behavior}</p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                    r.status === "ok"
                      ? "bg-green-50 text-green-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {r.note}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Public asset sizes */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="font-semibold text-slate-900">
              Top /public Assets by Size
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              These are served by Vercel CDN. Files ≥ 0.05 MB shown.
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {assets.map((a) => {
              const isLarge = a.sizeMB > 1;
              const note = PUBLIC_NOTES[a.path];
              return (
                <div key={a.path} className="flex items-start gap-4 px-6 py-3.5">
                  <div className="mt-0.5 flex-shrink-0">
                    {isLarge ? (
                      <XCircle className="w-4 h-4 text-red-400" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm text-slate-900 truncate">{a.path}</p>
                    {note && <p className="text-xs text-slate-500 mt-0.5">{note}</p>}
                  </div>
                  <span
                    className={`text-xs font-bold tabular-nums flex-shrink-0 ${
                      isLarge ? "text-red-600" : "text-slate-500"
                    }`}
                  >
                    {a.sizeMB.toFixed(2)} MB
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-slate-400 text-center mt-6">
          For live per-route bandwidth data, open Vercel Dashboard → Observability → Top Paths.
          Filter date range to the spike period (Jun 13–16) to see the exact culprit URLs.
        </p>
      </div>
    </div>
  );
}
