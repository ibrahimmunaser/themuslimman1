import { NextRequest, NextResponse } from "next/server";
import { requirePartAccess } from "@/lib/part-access";
import { getPartPageData } from "@/lib/part-content-cache";

export const dynamic = "force-dynamic";

/**
 * GET /api/part/[partNumber]/warm
 *
 * Warms the in-memory R2 cache for a part so that the subsequent page
 * navigation is served from cache (fast) instead of cold R2 fetches.
 *
 * Called on hover of stage/part links. Returns 204 immediately; warming
 * runs in the background so the response isn't blocked.
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ partNumber: string }> }
) {
  const { partNumber } = await context.params;
  const n = parseInt(partNumber, 10);
  if (isNaN(n) || n < 1) {
    return new NextResponse(null, { status: 400 });
  }

  const deny = await requirePartAccess(n);
  if (deny) return deny;

  // Fire-and-forget: warm the cache without blocking the response
  getPartPageData(n).catch(() => {});

  return new NextResponse(null, { status: 204 });
}
