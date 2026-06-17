import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { buildManualOutreachHtml, buildUnsubscribeUrl } from "@/lib/email-automation";

/**
 * GET /api/admin/outreach/preview?name=Ibrahim
 * Returns the HTML for the manual outreach email so the admin can preview it.
 */
export async function GET(req: NextRequest) {
  await requireAdmin();

  const firstName      = req.nextUrl.searchParams.get("name") ?? "Ibrahim";
  const unsubscribeUrl = buildUnsubscribeUrl("preview-token");
  const html           = buildManualOutreachHtml({ firstName, unsubscribeUrl });

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
