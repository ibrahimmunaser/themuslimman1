import { NextResponse } from "next/server";
import { getPartById } from "@/lib/content";
import { getSlideFiles } from "@/lib/files";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ partId: string }> }
) {
  try {
    const { partId } = await params;
    const part = getPartById(partId);
    
    if (!part) {
      return NextResponse.json({ error: "Part not found" }, { status: 404 });
    }

    const n = part.partNumber;

    // Fetch slide files - getSlideFiles already returns public URLs
    const [presented, detailed, facts] = await Promise.all([
      getSlideFiles(n, "presented"),
      getSlideFiles(n, "detailed"),
      getSlideFiles(n, "facts"),
    ]);

    return NextResponse.json({ presented, detailed, facts });
  } catch (error) {
    console.error("Error fetching slides:", error);
    return NextResponse.json({ error: "Failed to fetch slides" }, { status: 500 });
  }
}
