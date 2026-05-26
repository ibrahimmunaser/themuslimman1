import { NextRequest, NextResponse } from "next/server";
import { generateSignedR2Url, IMAGE_URL_EXPIRY } from "@/lib/r2";
import { requirePartAccess } from "@/lib/part-access";

export const dynamic = "force-dynamic";

/** Build the first-slide key for a given part number. */
function firstSlideKey(partNum: number): string {
  const padded = String(partNum).padStart(2, "0");
  return `slides-presented/Part ${padded}/Part_${padded}_Slide_001_watermarked.png`;
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ partNumber: string }> }
) {
  const { partNumber } = await context.params;
  const partNum = parseInt(partNumber, 10);

  if (isNaN(partNum) || partNum < 1) {
    return new NextResponse(null, { status: 400 });
  }

  const deny = await requirePartAccess(partNum);
  if (deny) return deny;

  try {
    const key = firstSlideKey(partNum);
    const url = await generateSignedR2Url(key, IMAGE_URL_EXPIRY);
    return NextResponse.redirect(url, { status: 302 });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
