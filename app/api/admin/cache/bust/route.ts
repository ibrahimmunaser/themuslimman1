import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { invalidatePartCache } from "@/lib/part-content-cache";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/cache/bust
 * Body: { partNumber: number }
 *
 * Clears the in-memory cache for a specific part so the next page request
 * re-fetches all assets (video URL, audio URL, etc.) from R2.
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const partNumber = typeof body.partNumber === "number" ? body.partNumber : null;

  if (!partNumber || partNumber < 1 || partNumber > 100) {
    return NextResponse.json(
      { error: "partNumber must be an integer between 1 and 100" },
      { status: 400 }
    );
  }

  invalidatePartCache(partNumber);
  console.log(`[admin] Cache busted for Part ${partNumber}`);

  return NextResponse.json({ ok: true, busted: partNumber });
}
