import { NextResponse } from "next/server";
import { getPartById } from "@/lib/content";
import { readQuiz } from "@/lib/files";
import { requirePartAccess } from "@/lib/part-access";
import { normalizeQuizAnswer } from "@/lib/progress";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ partId: string }> }
) {
  const startTime = Date.now();

  try {
    const { partId } = await params;
    const part = getPartById(partId);

    if (!part) {
      return NextResponse.json({ error: "Part not found" }, { status: 404 });
    }

    const deny = await requirePartAccess(part.partNumber);
    if (deny) return deny;

    const quiz = await readQuiz(part.partNumber);

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Strip correct_answer text from every question.
    // INTENTIONAL: correctIndex is exposed for native mobile inline feedback
    // (see app/actions/quiz.ts). Index alone is not a useful secret — all options
    // are already on screen. Web uses checkQuizAnswer; submitQuizAnswers is
    // authoritative for scoring on both platforms.
    // Use the same normalizeQuizAnswer as computeQuizScore so formatting drift
    // between options[] and correct_answer does not yield indexOf === -1 (or a
    // wrong match) while server scoring would still accept the answer.
    const safeQuiz = {
      ...quiz,
      questions: quiz.questions.map(({ correct_answer, ...q }) => ({
        ...q,
        correctIndex: q.options.findIndex(
          (opt) => normalizeQuizAnswer(opt) === normalizeQuizAnswer(correct_answer),
        ),
      })),
    };

    const elapsed = Date.now() - startTime;
    console.log(`[API] GET /api/quiz/${partId}: ${quiz.question_count} questions [${elapsed}ms]`);

    return NextResponse.json(safeQuiz, {
      headers: {
        // Quiz JSON is static content — cache privately for 1 hour.
        // CDN must not cache (private), browser reuses on revisit.
        "Cache-Control": "private, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[API] GET /api/quiz/[partId]: ERROR [${elapsed}ms]:`, error);
    return NextResponse.json({ error: "Failed to fetch quiz" }, { status: 500 });
  }
}
