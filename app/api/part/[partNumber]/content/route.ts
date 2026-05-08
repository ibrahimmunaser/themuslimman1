import { NextRequest, NextResponse } from "next/server";
import { readBriefing, readStatementOfFacts, readStudyGuide, readReport } from "@/lib/files";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ partNumber: string }> }
) {
  try {
    const { partNumber } = await context.params;
    const partNum = parseInt(partNumber, 10);

    if (isNaN(partNum)) {
      return NextResponse.json({ error: "Invalid part number" }, { status: 400 });
    }

    const [briefingText, statementOfFactsText, studyGuideText, reportText] = await Promise.all([
      readBriefing(partNum),
      readStatementOfFacts(partNum),
      readStudyGuide(partNum),
      readReport(partNum),
    ]);

    return NextResponse.json({
      briefingText,
      statementOfFactsText,
      studyGuideText,
      reportText,
    });
  } catch (error) {
    console.error("Error fetching part content:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}
