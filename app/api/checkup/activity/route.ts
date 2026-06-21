import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit, getIP } from "@/lib/rate-limit";

/**
 * PATCH /api/checkup/activity
 * Body: { leadId: string, event: "checkout_clicked" | "part1_clicked" }
 *
 * Sets a timestamp on the lead the first time a CTA is clicked.
 * Uses the opaque cuid leadId — no auth required, but rate-limited per IP.
 */
export async function PATCH(req: NextRequest) {
  try {
    // Rate-limit per IP: 20 writes per 10 minutes is more than enough for real use.
    const ip = getIP(req);
    const rl = checkRateLimit(`checkup_activity:${ip}`, 20, 10 * 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "rate_limited" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
      );
    }

    const { leadId, event } = await req.json();
    if (!leadId || !event) {
      return NextResponse.json({ error: "leadId and event are required" }, { status: 400 });
    }

    const now = new Date();

    if (event === "checkout_clicked") {
      await prisma.seerahCheckupLead.updateMany({
        where: { id: leadId, checkoutClickedAt: null },
        data:  { checkoutClickedAt: now, clickedCheckout: true },
      });
    } else if (event === "part1_clicked") {
      await prisma.seerahCheckupLead.updateMany({
        where: { id: leadId, part1ClickedAt: null },
        data:  { part1ClickedAt: now },
      });
    } else {
      return NextResponse.json({ error: "Unknown event" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[checkup/activity]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
