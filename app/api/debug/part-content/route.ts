import { NextRequest, NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth";
import { getPartById } from "@/lib/content";
import {
  readBriefing,
  readStatementOfFacts,
  readStudyGuide,
  readReport,
  getSlideFiles,
  getInfographicFilename,
  mindmapExists,
  readQuiz,
  readFlashcards,
  getPartAssetUrls,
} from "@/lib/files";
import { getR2PublicUrl, getR2AssetUrl } from "@/lib/r2";

export async function GET(req: NextRequest) {
  try {
    const user = await requireStudent();
    
    const searchParams = req.nextUrl.searchParams;
    const partNum = parseInt(searchParams.get("partNumber") || "1");
    
    const partBase = getPartById(`part-${partNum}`);
    if (!partBase) {
      return NextResponse.json({ error: "Part not found" }, { status: 404 });
    }

    console.log(`\n=== DEBUG: Loading content for Part ${partNum} ===`);
    
    // Load all assets
    const [
      briefingText,
      statementOfFactsText,
      studyGuideText,
      reportText,
      quizData,
      flashcards,
      slidesPresentedFiles,
      slidesDetailedFiles,
      slidesFactsFiles,
      infConcise,
      infStandard,
      infBento,
      hasMindmap,
      assetUrls,
    ] = await Promise.all([
      readBriefing(partNum),
      readStatementOfFacts(partNum),
      readStudyGuide(partNum),
      readReport(partNum),
      readQuiz(partNum),
      readFlashcards(partNum),
      getSlideFiles(partNum, "presented"),
      getSlideFiles(partNum, "detailed"),
      getSlideFiles(partNum, "facts"),
      getInfographicFilename(partNum, "Concise"),
      getInfographicFilename(partNum, "Standard"),
      getInfographicFilename(partNum, "Bento Grid"),
      mindmapExists(partNum),
      getPartAssetUrls(partNum),
    ]);

    const diagnostics = {
      partNumber: partNum,
      partTitle: partBase.title,
      environment: {
        R2_BUCKET: !!process.env.R2_BUCKET,
        R2_ACCESS_KEY_ID: !!process.env.R2_ACCESS_KEY_ID,
        R2_SECRET_ACCESS_KEY: !!process.env.R2_SECRET_ACCESS_KEY,
        R2_PUBLIC_URL: !!process.env.R2_PUBLIC_URL,
        R2_ACCOUNT_ID: !!process.env.R2_ACCOUNT_ID,
        USE_R2: process.env.R2_BUCKET && process.env.R2_ACCESS_KEY_ID,
      },
      content: {
        briefing: {
          exists: !!briefingText,
          length: briefingText?.length || 0,
          preview: briefingText?.substring(0, 100),
        },
        statementOfFacts: {
          exists: !!statementOfFactsText,
          length: statementOfFactsText?.length || 0,
          preview: statementOfFactsText?.substring(0, 100),
        },
        studyGuide: {
          exists: !!studyGuideText,
          length: studyGuideText?.length || 0,
          preview: studyGuideText?.substring(0, 100),
        },
        report: {
          exists: !!reportText,
          length: reportText?.length || 0,
          preview: reportText?.substring(0, 100),
        },
        quiz: {
          exists: !!quizData,
          questionsCount: quizData?.questions?.length || 0,
        },
        flashcards: {
          exists: !!flashcards,
          count: flashcards?.length || 0,
        },
        slides: {
          presented: {
            count: slidesPresentedFiles.length,
            files: slidesPresentedFiles.slice(0, 3),
          },
          detailed: {
            count: slidesDetailedFiles.length,
            files: slidesDetailedFiles.slice(0, 3),
          },
          facts: {
            count: slidesFactsFiles.length,
            files: slidesFactsFiles.slice(0, 3),
          },
        },
        infographics: {
          concise: infConcise,
          standard: infStandard,
          bentoGrid: infBento,
        },
        mindmap: {
          exists: hasMindmap,
        },
        assets: {
          videoUrl: assetUrls.videoUrl,
          audioUrl: assetUrls.audioUrl,
          mindmapUrl: assetUrls.mindmapUrl,
        },
      },
    };

    console.log("Diagnostics:", JSON.stringify(diagnostics, null, 2));

    return NextResponse.json(diagnostics);
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
