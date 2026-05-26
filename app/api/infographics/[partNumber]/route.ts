import { NextRequest, NextResponse } from "next/server";
import { r2GetInfographicKey, generateSignedR2Url, IMAGE_URL_EXPIRY } from "@/lib/r2";
import { requirePartAccess } from "@/lib/part-access";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { partNumber: string } }
) {
  const partNumber = parseInt(params.partNumber, 10);
  if (isNaN(partNumber) || partNumber < 1 || partNumber > 100) {
    return NextResponse.json({ error: "Invalid partNumber" }, { status: 400 });
  }

  // Auth + access check
  const deny = await requirePartAccess(partNumber);
  if (deny) return deny;

  // Resolve the actual R2 keys using smart lookup (handles all naming variants)
  const [bentoKey, conciseKey, standardKey] = await Promise.all([
    r2GetInfographicKey(partNumber, "Bento Grid"),
    r2GetInfographicKey(partNumber, "Concise"),
    r2GetInfographicKey(partNumber, "Standard"),
  ]);

  // Generate signed URLs for found keys (null if key not found)
  const [bentoUrl, conciseUrl, standardUrl] = await Promise.all([
    bentoKey   ? generateSignedR2Url(bentoKey,   IMAGE_URL_EXPIRY) : null,
    conciseKey ? generateSignedR2Url(conciseKey, IMAGE_URL_EXPIRY) : null,
    standardKey? generateSignedR2Url(standardKey,IMAGE_URL_EXPIRY) : null,
  ]);

  const expiresAt = new Date(Date.now() + IMAGE_URL_EXPIRY * 1000).toISOString();

  return NextResponse.json({
    bentoGrid: bentoUrl,
    concise:   conciseUrl,
    standard:  standardUrl,
    expiresAt,
  });
}
