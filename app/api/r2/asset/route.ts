import { NextRequest, NextResponse } from "next/server";
import { r2StreamFile, r2GetMetadata, generateETag, isCached } from "@/lib/r2";
import { requirePartAccess, extractPartNumberFromR2Key } from "@/lib/part-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// NOTE: This route proxies binary content through the Next.js server rather than
// issuing signed R2 URLs directly. This is intentional for cases where the client
// cannot receive a redirect (e.g. <img src> in certain WebViews, Safari range
// requests). The trade-off is higher server bandwidth and latency compared to
// direct signed URLs. For the primary video/audio player, prefer the
// /api/part/[partNumber]/assets route which returns pre-signed URLs instead.

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

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const key = searchParams.get("key");

  if (!key) {
    return new NextResponse("Missing key parameter", { status: 400 });
  }

  // Access control: extract part number from key and enforce paid-content rules.
  // Key format examples: "videos/Part 50.mp4", "audio/Part 1.mp3", "mindmaps/Part 3 - Mindmap.png"
  const partNum = extractPartNumberFromR2Key(key);

  if (partNum !== null) {
    const deny = await requirePartAccess(partNum);
    if (deny) return deny;
  } else {
    // Key does not match a known part — deny by default to avoid arbitrary R2 access.
    return new NextResponse("Forbidden", { status: 403 });
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
