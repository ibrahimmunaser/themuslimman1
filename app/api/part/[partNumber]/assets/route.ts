import { NextRequest, NextResponse } from "next/server";
import { getPartPageData } from "@/lib/part-content-cache";
import { requirePartAccess } from "@/lib/part-access";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ partNumber: string }> }
) {
  const startTime = Date.now();

  try {
    const { partNumber } = await context.params;
    const partNum = parseInt(partNumber, 10);

    if (isNaN(partNum)) {
      return NextResponse.json({ error: "Invalid part number" }, { status: 400 });
    }

    const deny = await requirePartAccess(partNum);
    if (deny) return deny;

    // Use the shared in-memory part cache so repeated client calls within the
    // 90-minute TTL window are served instantly without fresh R2 round-trips.
    const { videoUrl, audioUrl, mindmapUrl, thumbnailUrl } = await getPartPageData(partNum);
    const assets = { videoUrl, audioUrl, mindmapUrl, thumbnailUrl };

    const elapsed = Date.now() - startTime;
    const assetKeys = Object.keys(assets).filter(k => assets[k as keyof typeof assets]);
    console.log(`[API] GET /api/part/${partNum}/assets: returned ${assetKeys.length} assets [${elapsed}ms]`);

    return NextResponse.json(assets, {
      headers: {
        // Signed URLs are stable for the cache TTL window (90 min).
        // Cache at the browser for 30 min so back-nav re-uses the same URL.
        "Cache-Control": "private, max-age=1800, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[API] GET /api/part/[partNumber]/assets: ERROR [${elapsed}ms]:`, error);
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 });
  }
}
