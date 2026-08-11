import { NextRequest, NextResponse } from "next/server";
import { getPartById } from "@/lib/content";
import { getSlideFiles } from "@/lib/files";
import { requirePartAccess } from "@/lib/part-access";
import { parseLang } from "@/lib/course-lang";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ partId: string }> }
) {
  try {
    const { partId } = await params;
    const part = getPartById(partId);
    
    if (!part) {
      return NextResponse.json({ error: "Part not found" }, { status: 404 });
    }

    const n = part.partNumber;

    const deny = await requirePartAccess(n);
    if (deny) return deny;

    const lang = parseLang(request.nextUrl.searchParams.get("lang"));

    // Fetch slide files — Arabic only has "presented"-style slides, served as PNG directly
    const [presented, detailed, facts] = await Promise.all([
      getSlideFiles(n, "presented", lang),
      lang === "en" ? getSlideFiles(n, "detailed") : Promise.resolve([]),
      lang === "en" ? getSlideFiles(n, "facts")    : Promise.resolve([]),
    ]);

    return NextResponse.json({ presented, detailed, facts });
  } catch (error) {
    console.error("Error fetching slides:", error);
    return NextResponse.json({ error: "Failed to fetch slides" }, { status: 500 });
  }
}
