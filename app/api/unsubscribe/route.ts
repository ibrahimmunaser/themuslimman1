import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCronAuth } from "@/lib/cron-auth";

/**
 * GET /api/unsubscribe?token=<token>
 *
 * One-click unsubscribe for email outreach. The token is unique per email
 * address and is generated when the outreach email is built.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://themuslimman.com";

  if (!token) {
    return NextResponse.redirect(`${appUrl}/unsubscribed?status=invalid`);
  }

  const existing = await prisma.emailUnsubscribe.findUnique({ where: { token } });
  if (!existing) {
    return NextResponse.redirect(`${appUrl}/unsubscribed?status=invalid`);
  }

  if (!existing.unsubscribed) {
    const now = new Date();
    await prisma.emailUnsubscribe.update({
      where: { token },
      data:  { unsubscribed: true, unsubscribedAt: now },
    });
    await prisma.seerahCheckupLead.updateMany({
      where: { email: existing.email, unsubscribedAt: null },
      data:  { unsubscribedAt: now },
    });
  }

  return NextResponse.redirect(`${appUrl}/unsubscribed?status=ok`);
}

/**
 * POST /api/unsubscribe
 * Body: { email: string }
 *
 * Ensures an unsubscribe row exists (cron/automation only).
 * Never returns the raw token to unauthenticated clients.
 */
export async function POST(req: NextRequest) {
  if (!requireCronAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email } = await req.json().catch(() => ({ email: "" }));
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const normalized = email.toLowerCase().trim();
  const token = crypto.randomUUID();
  await prisma.emailUnsubscribe.upsert({
    where:  { email: normalized },
    create: { id: crypto.randomUUID(), email: normalized, token },
    update: {},
  });

  return NextResponse.json({ ok: true });
}
