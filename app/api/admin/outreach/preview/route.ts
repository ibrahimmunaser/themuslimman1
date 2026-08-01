import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { buildManualOutreachHtml, buildUnsubscribeUrl } from "@/lib/email-automation";

/**
 * GET /api/admin/outreach/preview?name=Ibrahim
 * Returns the HTML for the manual outreach email so the admin can preview it.
 */
export async function GET(req: NextRequest) {
  await requireAdmin();

  const rawName = req.nextUrl.searchParams.get("name") ?? "Ibrahim";
  // Escape before interpolating into HTML — prevents reflected XSS (CSP allows unsafe-inline).
  const firstName = rawName
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .slice(0, 80);
  const unsubscribeUrl = buildUnsubscribeUrl("preview-token");
  const html = buildManualOutreachHtml({ firstName, unsubscribeUrl });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; img-src data: https:;",
    },
  });
}
