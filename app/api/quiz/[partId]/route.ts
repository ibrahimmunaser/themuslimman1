import { NextResponse } from "next/server";
import { getPartById } from "@/lib/content";
import { readQuiz } from "@/lib/files";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ partId: string }> }
) {
  const startTime = Date.now();
  
  try {
    const { partId } = await params;
    console.log(`[API] GET /api/quiz/${partId}: Request received`);
    
    const part = getPartById(partId);

    if (!part) {
      console.log(`[API] GET /api/quiz/${partId}: Part not found`);
      return NextResponse.json({ error: "Part not found" }, { status: 404 });
    }

    console.log(`[API] GET /api/quiz/${partId}: Part found (partNumber: ${part.partNumber}), loading quiz...`);
    const quiz = await readQuiz(part.partNumber);

    if (!quiz) {
      console.log(`[API] GET /api/quiz/${partId}: Quiz not found for part ${part.partNumber}`);
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const elapsed = Date.now() - startTime;
    console.log(`[API] GET /api/quiz/${partId}: Success - ${quiz.question_count} questions loaded [${elapsed}ms]`);

    return NextResponse.json(quiz);
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[API] GET /api/quiz/[partId]: ERROR [${elapsed}ms]:`, error);
    return NextResponse.json({ error: "Failed to fetch quiz" }, { status: 500 });
  }
}
