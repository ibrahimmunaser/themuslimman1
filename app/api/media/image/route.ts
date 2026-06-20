import { NextRequest, NextResponse } from "next/server";
import { r2StreamFile, r2GetMetadata, generateETag, isCached } from "@/lib/r2";
import { requirePartAccess, extractPartNumberFromR2Key } from "@/lib/part-access";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

function getMimeType(key: string): string {
  const ext = key.substring(key.lastIndexOf(".")).toLowerCase();
  return MIME[ext] ?? "application/octet-stream";
}

export async function GET(req: NextRequest) {
  // In production all images are served via short-lived signed R2 URLs.
  // This proxy route exists only for local development environments.
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(
      "Deprecated: use the direct R2 signed URL returned by getPartAssetUrls()",
      { status: 410 }
    );
  }

  const { searchParams } = req.nextUrl;
  const relPath = searchParams.get("p");

  if (!relPath) return new NextResponse("Missing path", { status: 400 });

  try {
    const key = relPath.startsWith("/") ? relPath.slice(1) : relPath;

    // Access control: if the key contains a part number, enforce per-part access rules.
    // Keys without a part number (thumbnails, etc.) still require a valid session.
    const partNumber = extractPartNumberFromR2Key(key);
    if (partNumber !== null) {
      const deny = await requirePartAccess(partNumber);
      if (deny) return deny;
    } else {
      const user = await getCurrentUser();
      if (!user) return new NextResponse("Authentication required", { status: 401 });
    }

    // Get file metadata
    const metadata = await r2GetMetadata(key);
    
    if (!metadata) {
      return new NextResponse("Not found", { status: 404 });
    }

    // Generate ETag and check cache
    const etag = generateETag({ size: metadata.size, lastModified: metadata.lastModified });
    const clientETag = req.headers.get("if-none-match");
    
    if (isCached(etag, clientETag)) {
      return new NextResponse(null, { status: 304 });
    }

    // Determine content type
    const contentType = getMimeType(key);

    // Stream file from R2
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
        "Cache-Control": "public, max-age=31536000, immutable",
        "ETag": etag,
      },
    });
  } catch (error) {
    console.error("Error streaming image from R2:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
