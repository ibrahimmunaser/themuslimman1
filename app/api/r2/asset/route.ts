import { NextRequest, NextResponse } from "next/server";
import { r2StreamFile, r2GetMetadata, generateETag, isCached, generateSignedR2Url, IMAGE_URL_EXPIRY } from "@/lib/r2";
import { requirePartAccess, extractPartNumberFromR2Key } from "@/lib/part-access";
import { checkRateLimit, getIP } from "@/lib/rate-limit";

export const runtime = "nodejs";
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

const ALLOWED_EXTENSIONS = new Set([
  ".mp4", ".mp3", ".wav", ".png", ".webp", ".jpg", ".jpeg", ".gif", ".pdf", ".txt", ".json",
]);

const MIME_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".json": "application/json",
};

function getMimeType(key: string): string {
  const ext = key.substring(key.lastIndexOf(".")).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

function validateKey(key: string, partNumber: number): boolean {
  if (!key || typeof key !== "string") return false;
  if (key.includes("..") || key.startsWith("/") || key.includes("\\")) return false;
  if (!ALLOWED_PREFIXES.some((p) => key.startsWith(p))) return false;
  const ext = key.substring(key.lastIndexOf(".")).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) return false;
  const keyPart = extractPartNumberFromR2Key(key);
  return keyPart !== null && keyPart === partNumber;
}

export async function GET(req: NextRequest) {
  const ip = getIP(req);
  const rl = await checkRateLimit(`r2-asset:${ip}`, 120, 60 * 1000);
  if (!rl.allowed) {
    return new NextResponse("Too many requests", {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfterSeconds) },
    });
  }

  const { searchParams } = req.nextUrl;
  const key = searchParams.get("key");

  if (!key) {
    return new NextResponse("Missing key parameter", { status: 400 });
  }

  const partNum = extractPartNumberFromR2Key(key);

  if (partNum === null) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (!validateKey(key, partNum)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const deny = await requirePartAccess(partNum);
  if (deny) return deny;

  if (process.env.NODE_ENV === "production") {
    try {
      const signedUrl = await generateSignedR2Url(key, IMAGE_URL_EXPIRY);
      return NextResponse.redirect(signedUrl, { status: 307 });
    } catch (error) {
      console.error("[r2/asset] Failed to generate signed URL for redirect:", error);
      return new NextResponse("Failed to generate media URL", { status: 500 });
    }
  }

  try {
    const metadata = await r2GetMetadata(key);

    if (!metadata) {
      return new NextResponse("Not found", { status: 404 });
    }

    const etag = generateETag({ size: metadata.size, lastModified: metadata.lastModified });
    const clientETag = req.headers.get("if-none-match");

    if (isCached(etag, clientETag)) {
      return new NextResponse(null, { status: 304 });
    }

    const rangeHeader = req.headers.get("range");
    const contentType = getMimeType(key);

    if (rangeHeader && (contentType.startsWith("video/") || contentType.startsWith("audio/"))) {
      return await handleRangeRequest(key, rangeHeader, metadata, contentType, etag);
    }

    const response = await r2StreamFile(key);

    if (!response.Body) {
      return new NextResponse("Error reading file", { status: 500 });
    }

    const stream = response.Body.transformToWebStream();

    return new NextResponse(stream as ReadableStream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(metadata.size),
        "Cache-Control": "private, max-age=3600",
        "ETag": etag,
        "Accept-Ranges": "bytes",
      },
    });
  } catch (error) {
    console.error("Error streaming from R2:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

async function handleRangeRequest(
  key: string,
  rangeHeader: string,
  metadata: { size: number; lastModified?: Date },
  contentType: string,
  etag: string
) {
  const fileSize = metadata.size;
  const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader);

  if (!match) {
    return new NextResponse("Invalid range", { status: 416 });
  }

  const start = parseInt(match[1], 10);
  const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;

  if (start >= fileSize || end >= fileSize || start > end) {
    return new NextResponse("Range not satisfiable", {
      status: 416,
      headers: { "Content-Range": `bytes */${fileSize}` },
    });
  }

  const chunkSize = end - start + 1;

  try {
    const response = await r2StreamFile(key, `bytes=${start}-${end}`);

    if (!response.Body) {
      return new NextResponse("Error reading file", { status: 500 });
    }

    const stream = response.Body.transformToWebStream();

    return new NextResponse(stream as ReadableStream, {
      status: 206,
      headers: {
        "Content-Type": contentType,
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunkSize),
        "Cache-Control": "private, max-age=3600",
        "ETag": etag,
      },
    });
  } catch (error) {
    console.error("Error streaming range from R2:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
