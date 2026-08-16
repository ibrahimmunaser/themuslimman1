import { NextRequest, NextResponse } from "next/server";
import { getPartById, localizePart } from "@/lib/content";
import { getPartPageData } from "@/lib/part-content-cache";
import { parseLang } from "@/lib/course-lang";

export async function GET(request: NextRequest) {
  try {
    const lang = parseLang(request.nextUrl.searchParams.get("lang"));
    const partBaseEn = getPartById("part-1");
    const partBase = partBaseEn ? localizePart(partBaseEn, lang) : null;
    const { videoUrl, thumbnailUrl, audioUrl } = await getPartPageData(1, lang);

    return NextResponse.json(
      {
        title:        partBase?.title    ?? "The Pre-Islamic Arabian Context",
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
