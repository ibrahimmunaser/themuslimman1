import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasActiveCourseAccess } from "@/lib/access";

/**
 * GET /api/stripe/check-access
 *
 * @deprecated Use GET /api/access/check instead.
 * Kept as a backward-compatible alias for payment success pages and older clients.
 * Now delegates to the unified access check (Stripe + Apple IAP + Google Play IAP).
 */
export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const hasAccess = await hasActiveCourseAccess(user.id, user.hasPaid);

  return NextResponse.json({ hasAccess, emailVerified: user.emailVerified }, {
    headers: { "Cache-Control": "no-store, no-cache" },
  });
}
