import { NextResponse } from "next/server";
import { getPartById } from "@/lib/content";
import { readQuiz } from "@/lib/files";

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

    const quiz = await readQuiz(part.partNumber);

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return NextResponse.json({ error: "Failed to fetch quiz" }, { status: 500 });
  }
}
