import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/unsubscribe?token=<token>
 *
 * One-click unsubscribe for email outreach. The token is unique per email
 * address and is generated when the outreach email is built.
 * Upserts an EmailUnsubscribe row so repeated clicks are safe.
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

  // Mark as unsubscribed (idempotent — safe to click multiple times)
  if (!existing.unsubscribed) {
    const now = new Date();
    await prisma.emailUnsubscribe.update({
      where: { token },
      data:  { unsubscribed: true, unsubscribedAt: now },
    });
    // Propagate unsubscribe timestamp to any quiz leads with this email
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
 * Used internally when generating tokens — ensures a row exists before sending.
 * Also called by the unsubscribe page form if we add one.
 */
export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({ email: "" }));
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const token = crypto.randomUUID();
  await prisma.emailUnsubscribe.upsert({
    where:  { email },
    create: { id: crypto.randomUUID(), email, token },
    update: {}, // keep existing token so old links still work
  });

  const row = await prisma.emailUnsubscribe.findUnique({ where: { email } });
  return NextResponse.json({ token: row?.token });
}
