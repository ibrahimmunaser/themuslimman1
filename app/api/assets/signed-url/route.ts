import { NextRequest, NextResponse } from "next/server";
import { generateSignedR2Url, VIDEO_URL_EXPIRY, IMAGE_URL_EXPIRY } from "@/lib/r2";
import { requirePartAccess, extractPartNumberFromR2Key } from "@/lib/part-access";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// ─── Validation constants ─────────────────────────────────────────────────────

const ALLOWED_PREFIXES = [
  "videos/",
  "audio/",
  "mindmaps/",
  "Infographics-Bento-Grid/",
  "Infographics-Concise/",
  "Infographics-Standard/",
  "slides-presented/",
  "slides-detailed/",
  "slides-facts/",
] as const;

const ALLOWED_EXTENSIONS = new Set([".mp4", ".mp3", ".wav", ".png", ".webp"]);

const VIDEO_EXTENSIONS = new Set([".mp4", ".mp3", ".wav"]);

function expiryForKey(key: string): number {
  const ext = key.substring(key.lastIndexOf(".")).toLowerCase();
  return VIDEO_EXTENSIONS.has(ext) ? VIDEO_URL_EXPIRY : IMAGE_URL_EXPIRY;
}

/**
 * Validates an R2 key before signing it:
 * - No path traversal
 * - Must start with an allowed folder prefix
 * - Must have an allowed file extension
 * - Must reference the claimed part number (or a zero-padded form)
 */
function validateKey(key: string, partNumber: number): { valid: true } | { valid: false; reason: string } {
  if (!key || typeof key !== "string") return { valid: false, reason: "missing key" };

  // Prevent path traversal
  if (key.includes("..") || key.startsWith("/") || key.includes("\\")) {
    return { valid: false, reason: "path traversal detected" };
  }

  // Must start with one of the known paid-content folders
  const hasAllowedPrefix = ALLOWED_PREFIXES.some((p) => key.startsWith(p));
  if (!hasAllowedPrefix) return { valid: false, reason: "disallowed prefix" };

  // Must have an allowed extension
  const ext = key.substring(key.lastIndexOf(".")).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) return { valid: false, reason: "disallowed extension" };

  // Key must reference the claimed part number
  // Slides use zero-padded folder names (e.g. "Part 05")
  const padded = String(partNumber).padStart(2, "0");
  const matchesPart =
    key.includes(`Part ${partNumber}`) ||
    key.includes(`Part ${padded}`);

  if (!matchesPart) return { valid: false, reason: "key does not match partNumber" };

  return { valid: true };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const key = searchParams.get("key");
  const partNumberStr = searchParams.get("partNumber");

  if (!key || !partNumberStr) {
    return NextResponse.json({ error: "Missing key or partNumber" }, { status: 400 });
  }

  const partNumber = parseInt(partNumberStr, 10);
  if (isNaN(partNumber) || partNumber < 1 || partNumber > 101) {
    return NextResponse.json({ error: "Invalid partNumber" }, { status: 400 });
  }

  // Validate key structure before touching auth or R2
  const check = validateKey(key, partNumber);
  if (!check.valid) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  // Auth + access check (Part 1 is always free; requirePartAccess handles this)
  const deny = await requirePartAccess(partNumber);
  if (deny) return deny;

  // For non-part-keyed requests (shouldn't happen given validation above) require auth at minimum
  const extractedPart = extractPartNumberFromR2Key(key);
  if (extractedPart === null) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const expiry = expiryForKey(key);
    const url = await generateSignedR2Url(key, expiry);
    const expiresAt = new Date(Date.now() + expiry * 1000).toISOString();

    return NextResponse.json({ url, expiresAt });
  } catch (error) {
    console.error("[signed-url] Failed to generate signed URL:", error);
    return NextResponse.json({ error: "Failed to generate signed URL" }, { status: 500 });
  }
}
