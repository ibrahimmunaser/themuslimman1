import { NextRequest, NextResponse } from "next/server";
import { r2StreamFile, r2GetMetadata, r2GetVideoKey, generateETag, isCached } from "@/lib/r2";
import { requirePartAccess } from "@/lib/part-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ part: string }> }
) {
  // In production all video is served via short-lived signed R2 URLs returned
  // by /api/part/[partNumber]/assets. This proxy route exists only for local
  // development environments where R2 is not configured.
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(
      "Deprecated: use the direct R2 public URL returned by getPartAssetUrls()",
      { status: 410 }
    );
  }

  const { part } = await params;
  const partNum = parseInt(part, 10);
  if (isNaN(partNum)) return new NextResponse("Bad request", { status: 400 });

  const deny = await requirePartAccess(partNum);
  if (deny) return deny;

  try {
    const videoKey = await r2GetVideoKey(partNum);

    if (!videoKey) {
      return new NextResponse("Not found", { status: 404 });
    }

    const metadata = await r2GetMetadata(videoKey);

    if (!metadata) {
      return new NextResponse("Not found", { status: 404 });
    }

    const fileSize = metadata.size;
    const etag = generateETag({ size: metadata.size, lastModified: metadata.lastModified });
    const clientETag = req.headers.get("if-none-match");

    if (isCached(etag, clientETag)) {
      return new NextResponse(null, { status: 304 });
    }

    const rangeHeader = req.headers.get("range");

    if (!rangeHeader) {
      const response = await r2StreamFile(videoKey);

      if (!response.Body) {
        return new NextResponse("Error reading file", { status: 500 });
      }

      const stream = response.Body.transformToWebStream();

      return new NextResponse(stream as ReadableStream, {
        status: 200,
        headers: {
          "Content-Type": "video/mp4",
          "Content-Length": String(fileSize),
          "Accept-Ranges": "bytes",
          "Cache-Control": "private, max-age=3600",
          "ETag": etag,
        },
      });
    }

    const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader);

    if (!match) {
      return new NextResponse("Invalid range", { status: 416 });
    }

    const start = parseInt(match[1], 10);
    const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize || start > end) {
      return new NextResponse("Range Not Satisfiable", {
        status: 416,
        headers: { "Content-Range": `bytes */${fileSize}` },
      });
    }

    const chunkSize = end - start + 1;

    const response = await r2StreamFile(videoKey, `bytes=${start}-${end}`);

    if (!response.Body) {
      return new NextResponse("Error reading file", { status: 500 });
    }

    const stream = response.Body.transformToWebStream();

    return new NextResponse(stream as ReadableStream, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunkSize),
        "Content-Type": "video/mp4",
        "Cache-Control": "private, max-age=3600",
        "ETag": etag,
      },
    });
  } catch (error) {
    console.error("Error streaming video from R2:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
