import { NextRequest, NextResponse } from "next/server";
import { getPartAssetUrls } from "@/lib/files";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ partNumber: string }> }
) {
  try {
    const { partNumber } = await context.params;
    const partNum = parseInt(partNumber, 10);

    if (isNaN(partNum)) {
      return NextResponse.json({ error: "Invalid part number" }, { status: 400 });
    }

    const assets = await getPartAssetUrls(partNum);
    return NextResponse.json(assets);
  } catch (error) {
    console.error("Error fetching part assets:", error);
    return NextResponse.json(
      { error: "Failed to fetch assets" },
      { status: 500 }
    );
  }
}
