import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasActiveCourseAccess } from "@/lib/access";
import { prisma } from "@/lib/db";

/**
 * GET /api/stripe/check-access
 *
 * @deprecated Use GET /api/access/check instead.
 * Kept as a backward-compatible alias for payment success pages and older clients.
 * Now delegates to the unified access check (Stripe + Apple IAP + Google Play IAP).
 *
 * Also returns `hasPassword` so the success page can distinguish between
 * "verify email" (existing users) and "set your password" (guest-checkout users).
 */
export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const [hasAccess, dbUser] = await Promise.all([
    hasActiveCourseAccess(user.id, user.hasPaid),
    prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } }),
  ]);

  return NextResponse.json(
    {
      hasAccess,
      emailVerified: user.emailVerified,
      hasPassword: !!dbUser?.passwordHash,
    },
    { headers: { "Cache-Control": "no-store, no-cache" } },
  );
}
