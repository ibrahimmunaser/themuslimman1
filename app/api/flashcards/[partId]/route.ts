import { NextResponse } from "next/server";
import { getPartById } from "@/lib/content";
import { readFlashcards } from "@/lib/files";
import { requirePartAccess } from "@/lib/part-access";

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

    const deny = await requirePartAccess(part.partNumber);
    if (deny) return deny;

    const flashcards = await readFlashcards(part.partNumber);

    if (!flashcards) {
      return NextResponse.json({ error: "Flashcards not found" }, { status: 404 });
    }

    return NextResponse.json(flashcards);
  } catch (error) {
    console.error("Error fetching flashcards:", error);
    return NextResponse.json({ error: "Failed to fetch flashcards" }, { status: 500 });
  }
}
