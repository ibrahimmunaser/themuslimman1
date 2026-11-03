import { NextRequest, NextResponse } from "next/server";
import { getPartById, localizePart } from "@/lib/content";
import { getPartPageData } from "@/lib/part-content-cache";
import { parseLang } from "@/lib/course-lang";
import { FREE_PART_NUMBER } from "@/lib/access";

// NOTE: this route keeps its legacy "part1" path/name for historical reasons
// (it originally always previewed Part 1), but it now always serves
// FREE_PART_NUMBER — currently Part 15, "The First Revelation". Change
// FREE_PART_NUMBER in lib/access.ts to move the free preview elsewhere.
export async function GET(request: NextRequest) {
  try {
    const lang = parseLang(request.nextUrl.searchParams.get("lang"));
    const partBaseEn = getPartById(`part-${FREE_PART_NUMBER}`);
    const partBase = partBaseEn ? localizePart(partBaseEn, lang) : null;
    const { videoUrl, thumbnailUrl, audioUrl } = await getPartPageData(FREE_PART_NUMBER, lang);

    return NextResponse.json(
      {
        title:        partBase?.title    ?? "The First Revelation",
        subtitle:     partBase?.subtitle ?? null,
        videoUrl:     videoUrl     ?? null,
        thumbnailUrl: thumbnailUrl ?? null,
        audioUrl:     audioUrl     ?? null,
        lang,
      },
      {
        headers: {
          // Don't CDN-cache across languages — signed URLs + lang-specific payloads
          "Cache-Control": "private, max-age=300, stale-while-revalidate=60",
          Vary: "Cookie",
        },
      },
    );
  } catch (err) {
    console.error("[preview/part1]", err);
    return NextResponse.json({ error: "Failed to load preview" }, { status: 500 });
  }
}
