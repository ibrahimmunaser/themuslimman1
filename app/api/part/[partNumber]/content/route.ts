import { NextRequest, NextResponse } from "next/server";
import { readBriefing, readStatementOfFacts, readStudyGuide, readReport } from "@/lib/files";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ partNumber: string }> }
) {
  const startTime = Date.now();
  
  try {
    const { partNumber } = await context.params;
    const partNum = parseInt(partNumber, 10);
    
    console.log(`[API] GET /api/part/${partNumber}/content: Request received`);

    if (isNaN(partNum)) {
      console.log(`[API] GET /api/part/${partNumber}/content: Invalid part number "${partNumber}"`);
      return NextResponse.json({ error: "Invalid part number" }, { status: 400 });
    }

    console.log(`[API] GET /api/part/${partNum}/content: Fetching briefing, facts, study guide, and report...`);
    
    const [briefingText, statementOfFactsText, studyGuideText, reportText] = await Promise.all([
      readBriefing(partNum),
      readStatementOfFacts(partNum),
      readStudyGuide(partNum),
      readReport(partNum),
    ]);

    const elapsed = Date.now() - startTime;
    console.log(`[API] GET /api/part/${partNum}/content: Success - briefing: ${briefingText ? `${briefingText.length} chars` : "null"}, facts: ${statementOfFactsText ? `${statementOfFactsText.length} chars` : "null"}, study guide: ${studyGuideText ? `${studyGuideText.length} chars` : "null"}, report: ${reportText ? `${reportText.length} chars` : "null"} [${elapsed}ms]`);

    return NextResponse.json({
      briefingText,
      statementOfFactsText,
      studyGuideText,
      reportText,
    });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[API] GET /api/part/[partNumber]/content: ERROR [${elapsed}ms]:`, error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}
