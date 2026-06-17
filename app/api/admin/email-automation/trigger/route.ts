import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

/**
 * POST /api/admin/email-automation/trigger
 * POST /api/admin/email-automation/trigger?dryRun=1
 *
 * Admin-only trigger that calls the internal cron endpoint with the
 * CRON_SECRET header so it passes the auth check.
 */
export async function POST(req: NextRequest) {
  await requireAdmin();

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? "https://themuslimman.com";
  const dryRun  = req.nextUrl.searchParams.get("dryRun") === "1";
  const url     = `${appUrl}/api/cron/no-plan-recovery${dryRun ? "?dryRun=1" : ""}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${cronSecret}` },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json({ error: "Cron trigger failed", detail: data }, { status: 502 });
  }

  return NextResponse.json(data);
}
