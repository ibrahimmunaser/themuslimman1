import { NextResponse } from "next/server";
import { getPartById } from "@/lib/content";
import { getPartPageData } from "@/lib/part-content-cache";

export async function GET() {
  try {
    const partBase = getPartById("part-1");
    const { videoUrl, thumbnailUrl } = await getPartPageData(1);

    return NextResponse.json(
      {
        title:        partBase?.title    ?? "The Pre-Islamic Arabian Context",
        subtitle:     partBase?.subtitle ?? null,
        videoUrl:     videoUrl     ?? null,
        thumbnailUrl: thumbnailUrl ?? null,
      },
      {
        headers: {
          // Cache for 55 min — signed URLs last 4 hours, so safe to cache at CDN
          "Cache-Control": "public, max-age=3300, stale-while-revalidate=60",
        },
      },
    );
  } catch (err) {
    console.error("[preview/part1]", err);
    return NextResponse.json({ error: "Failed to load preview" }, { status: 500 });
  }
}
