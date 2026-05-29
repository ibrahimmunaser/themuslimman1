import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasActiveCourseAccess } from "@/lib/access";

/**
 * GET /api/stripe/check-access
 *
 * Lightweight endpoint for the payment success page to poll until the
 * webhook has confirmed access. Requires an authenticated session.
 *
 * Returns:
 *   { hasAccess: true }  — once the webhook has granted subscription/lifetime access
 *   { hasAccess: false } — user is authenticated but access is not yet confirmed
 *   401                  — not authenticated
 */
export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const hasAccess = await hasActiveCourseAccess(user.id);

  return NextResponse.json({ hasAccess }, {
    headers: { "Cache-Control": "no-store, no-cache" },
  });
}
