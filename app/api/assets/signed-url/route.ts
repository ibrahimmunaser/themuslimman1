import { NextRequest, NextResponse } from "next/server";
import { generateSignedR2Url, VIDEO_URL_EXPIRY, IMAGE_URL_EXPIRY } from "@/lib/r2";
import { requirePartAccess, extractPartNumberFromR2Key } from "@/lib/part-access";
import { TOTAL_COURSE_PARTS } from "@/lib/access";
import { checkRateLimit, getIP } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

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
 * Validates an R2 key before signing it.
 * Part matching uses extractPartNumberFromR2Key — NEVER substring includes()
 * (which would let partNumber=1 unlock "Part 10" / "Part 100").
 */
function validateKey(key: string, partNumber: number): { valid: true } | { valid: false; reason: string } {
  if (!key || typeof key !== "string") return { valid: false, reason: "missing key" };

  if (key.includes("..") || key.startsWith("/") || key.includes("\\")) {
    return { valid: false, reason: "path traversal detected" };
  }

  const hasAllowedPrefix = ALLOWED_PREFIXES.some((p) => key.startsWith(p));
  if (!hasAllowedPrefix) return { valid: false, reason: "disallowed prefix" };

  const ext = key.substring(key.lastIndexOf(".")).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) return { valid: false, reason: "disallowed extension" };

  const keyPart = extractPartNumberFromR2Key(key);
  if (keyPart === null || keyPart !== partNumber) {
    return { valid: false, reason: "key does not match partNumber" };
  }

  return { valid: true };
}

export async function GET(req: NextRequest) {
  const ip = getIP(req);
  const rl = await checkRateLimit(`signed-url:${ip}`, 60, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  const { searchParams } = req.nextUrl;
  const key = searchParams.get("key");
  const partNumberStr = searchParams.get("partNumber");

  if (!key || !partNumberStr) {
    return NextResponse.json({ error: "Missing key or partNumber" }, { status: 400 });
  }

  const claimedPart = parseInt(partNumberStr, 10);
  if (isNaN(claimedPart) || claimedPart < 1 || claimedPart > TOTAL_COURSE_PARTS) {
    return NextResponse.json({ error: "Invalid partNumber" }, { status: 400 });
  }

  // Authoritative part is parsed from the key; claimed partNumber must match.
  const keyPart = extractPartNumberFromR2Key(key);
  if (keyPart === null || keyPart !== claimedPart) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  const check = validateKey(key, keyPart);
  if (!check.valid) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  // Gate on the key's part — never on a free partNumber claim alone.
  const deny = await requirePartAccess(keyPart);
  if (deny) return deny;

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
