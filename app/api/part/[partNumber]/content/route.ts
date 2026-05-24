import { NextRequest, NextResponse } from "next/server";
import { readBriefing, readStatementOfFacts, readStudyGuide, readReport } from "@/lib/files";
import { requirePartAccess } from "@/lib/part-access";

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

    const [briefingText, statementOfFactsText, studyGuideText, reportText] = await Promise.all([
      readBriefing(partNum),
      readStatementOfFacts(partNum),
      readStudyGuide(partNum),
      readReport(partNum),
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
