import { NextRequest, NextResponse } from "next/server";
import { readBriefing, readStatementOfFacts, readStudyGuide, readReport } from "@/lib/files";
import { requirePartAccess } from "@/lib/part-access";
import { parseLang } from "@/lib/course-lang";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ partNumber: string }> }
) {
  const startTime = Date.now();

  try {
    const { partNumber } = await context.params;
    const partNum = parseInt(partNumber, 10);

    if (isNaN(partNum)) {
      return NextResponse.json({ error: "Invalid part number" }, { status: 400 });
    }

    const deny = await requirePartAccess(partNum);
    if (deny) return deny;

    const lang = parseLang(req.nextUrl.searchParams.get("lang"));

    const [briefingText, statementOfFactsText, studyGuideText, reportText] = await Promise.all([
      readBriefing(partNum, lang),
      readStatementOfFacts(partNum, lang),
      readStudyGuide(partNum, lang),
      // Report has no Arabic translation; always serve English
      lang === "en" ? readReport(partNum) : Promise.resolve(null),
    ]);

    const elapsed = Date.now() - startTime;
    console.log(`[API] GET /api/part/${partNum}/content: Success [${elapsed}ms]`);

    return NextResponse.json({
      briefingText,
      statementOfFactsText,
      studyGuideText,
      reportText,
    });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[API] GET /api/part/[partNumber]/content: ERROR [${elapsed}ms]:`, error);
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
  }
}
