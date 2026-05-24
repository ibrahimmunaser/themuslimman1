import { NextRequest, NextResponse } from "next/server";
import { getPartAssetUrls } from "@/lib/files";
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

    const assets = await getPartAssetUrls(partNum);

    const elapsed = Date.now() - startTime;
    const assetKeys = Object.keys(assets).filter(k => assets[k as keyof typeof assets]);
    console.log(`[API] GET /api/part/${partNum}/assets: returned ${assetKeys.length} assets [${elapsed}ms]`);

    return NextResponse.json(assets);
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[API] GET /api/part/[partNumber]/assets: ERROR [${elapsed}ms]:`, error);
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 });
  }
}
