import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCronAuth } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH_LIMIT = 200;
// Guest (isAnonymous) accounts are silently provisioned by
// /api/auth/mobile-anonymous with no CAPTCHA/device attestation and are
// rate-limited only per-serverless-instance (see lib/rate-limit.ts), so they
// are a real DB-bloat vector if never cleaned up. Give a generous window —
// long enough that someone genuinely using the free Part 1 content on and
// off isn't deleted out from under them — before treating one as abandoned.
const ABANDONED_AFTER_MS = 45 * 24 * 60 * 60 * 1000; // 45 days

/**
 * GET /api/cron/cleanup-abandoned-guests
 *
 * Runs daily via Vercel Cron. Deletes device-linked guest accounts
 * (isAnonymous=true, created by the mobile app's silent guest provisioning)
 * that:
 *  - never upgraded to a real account,
 *  - never made any purchase (Stripe or mobile IAP), and
 *  - have shown no course activity (PartProgress) in the last 45 days.
 *
 * A guest who purchased, upgraded, or is still actively reading free
 * content is never touched — only truly abandoned, never-monetized,
 * never-engaged rows are removed.
 *
 * Query params:
 *   ?dryRun=1 — compute eligible accounts but do not delete anything
 */
export async function GET(req: NextRequest) {
  if (!requireCronAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = req.nextUrl.searchParams.get("dryRun") === "1";
  const cutoff = new Date(Date.now() - ABANDONED_AFTER_MS);

  const candidates = await prisma.user.findMany({
    where: {
      isAnonymous: true,
      hasPaid: false,
      createdAt: { lte: cutoff },
      mobilePurchases: { none: {} },
      purchases: { none: {} },
      subscriptions: { none: {} },
      partProgress: { none: { updatedAt: { gt: cutoff } } },
    },
    select: { id: true, email: true, createdAt: true },
    take: BATCH_LIMIT,
    orderBy: { createdAt: "asc" },
  });

  const results = { eligible: candidates.length, deleted: 0, failed: 0 };

  if (dryRun) {
    return NextResponse.json({ ok: true, dryRun, ...results });
  }

  for (const user of candidates) {
    try {
      await prisma.$transaction([
        prisma.activityLog.updateMany({ where: { userId: user.id }, data: { userId: null } }),
        prisma.giftPurchase.updateMany({
          where: { purchaserUserId: user.id },
          data: { purchaserUserId: null },
        }),
        prisma.giftPurchase.updateMany({
          where: { claimedByUserId: user.id },
          data: { claimedByUserId: null },
        }),
        prisma.trialEligibility.deleteMany({ where: { userId: user.id } }),
        prisma.user.delete({ where: { id: user.id } }),
      ]);
      results.deleted++;
    } catch (err) {
      console.error(`[CLEANUP_ABANDONED_GUESTS] Failed to delete ${user.id}:`, err);
      results.failed++;
    }
  }

  console.log(`[CLEANUP_ABANDONED_GUESTS] Results:`, results);
  return NextResponse.json({ ok: true, dryRun, ...results });
}
