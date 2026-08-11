import { NextRequest, NextResponse } from "next/server";
import { r2GetInfographicKey, r2GetArabicInfographicKey, generateSignedR2Url, IMAGE_URL_EXPIRY } from "@/lib/r2";
import { requirePartAccess } from "@/lib/part-access";
import { TOTAL_COURSE_PARTS } from "@/lib/access";
import { parseLang } from "@/lib/course-lang";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ partNumber: string }> }
) {
  const { partNumber: partNumberStr } = await params;
  const partNumber = parseInt(partNumberStr, 10);
  if (isNaN(partNumber) || partNumber < 1 || partNumber > TOTAL_COURSE_PARTS) {
    return NextResponse.json({ error: "Invalid partNumber" }, { status: 400 });
  }

  // Auth + access check
  const deny = await requirePartAccess(partNumber);
  if (deny) return deny;

  const lang = parseLang(req.nextUrl.searchParams.get("lang"));
  const expiresAt = new Date(Date.now() + IMAGE_URL_EXPIRY * 1000).toISOString();

  if (lang === "ar") {
    // Arabic has a single infographic per part; expose it under "concise"
    const key = await r2GetArabicInfographicKey(partNumber);
    const url = await generateSignedR2Url(key, IMAGE_URL_EXPIRY).catch(() => null);
    return NextResponse.json({ bentoGrid: null, concise: url, standard: null, expiresAt });
  }

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

  return NextResponse.json({
    bentoGrid: bentoUrl,
    concise:   conciseUrl,
    standard:  standardUrl,
    expiresAt,
  });
}
