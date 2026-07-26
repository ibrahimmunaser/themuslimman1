import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasActiveCourseAccess } from "@/lib/access";

/**
 * GET /api/access/check
 *
 * Unified access check for web and mobile clients.
 * Covers Stripe purchases, Stripe subscriptions, Apple IAP, and Google Play IAP.
 *
 * Returns:
 *   { hasAccess: true | false, isFamily: true | false, planType: "individual" | "family" }
 *   401 — not authenticated
 */
export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const hasAccess = await hasActiveCourseAccess(user.id, user.hasPaid);
  const planType = user.planType === "family" ? "family" : "individual";

  return NextResponse.json(
    {
      hasAccess,
      isFamily: planType === "family",
      planType,
    },
    {
      headers: { "Cache-Control": "no-store, no-cache" },
    },
  );
}
