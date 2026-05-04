import { NextRequest, NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth";
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

export const maxDuration = 300; // 5 minutes

interface AssetTestResult {
  partNumber: number;
  loadTime: number;
  assets: {
    video: { exists: boolean; url?: string; time: number };
    audio: { exists: boolean; url?: string; time: number };
    mindmap: { exists: boolean; url?: string; time: number };
    briefing: { exists: boolean; size: number; time: number };
    facts: { exists: boolean; size: number; time: number };
    studyGuide: { exists: boolean; size: number; time: number };
    report: { exists: boolean; size: number; time: number };
    quiz: { exists: boolean; questions: number; time: number };
    flashcards: { exists: boolean; count: number; time: number };
    slides: {
      presented: { count: number; time: number };
      detailed: { count: number; time: number };
      facts: { count: number; time: number };
    };
    infographics: {
      concise: { exists: boolean; time: number };
      standard: { exists: boolean; time: number };
      bentoGrid: { exists: boolean; time: number };
    };
  };
  errors: string[];
}

async function testPart(partNum: number): Promise<AssetTestResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  // Helper to time async operations
  const timeAsync = async <T,>(fn: Promise<T>): Promise<{ result: T; time: number }> => {
    const start = Date.now();
    try {
      const result = await fn;
      return { result, time: Date.now() - start };
    } catch (error) {
      errors.push(`${error}`);
      return { result: null as T, time: Date.now() - start };
    }
  };

  // Test all assets in parallel
  const [
    videoAudioMindmap,
    briefing,
    facts,
    studyGuide,
    report,
    quiz,
    flashcards,
    slidesPresented,
    slidesDetailed,
    slidesFacts,
    infConcise,
    infStandard,
    infBento,
    mindmap,
  ] = await Promise.all([
    timeAsync(getPartAssetUrls(partNum)),
    timeAsync(readBriefing(partNum)),
    timeAsync(readStatementOfFacts(partNum)),
    timeAsync(readStudyGuide(partNum)),
    timeAsync(readReport(partNum)),
    timeAsync(readQuiz(partNum)),
    timeAsync(readFlashcards(partNum)),
    timeAsync(getSlideFiles(partNum, "presented")),
    timeAsync(getSlideFiles(partNum, "detailed")),
    timeAsync(getSlideFiles(partNum, "facts")),
    timeAsync(getInfographicFilename(partNum, "Concise")),
    timeAsync(getInfographicFilename(partNum, "Standard")),
    timeAsync(getInfographicFilename(partNum, "Bento Grid")),
    timeAsync(mindmapExists(partNum)),
  ]);

  const totalTime = Date.now() - startTime;

  return {
    partNumber: partNum,
    loadTime: totalTime,
    assets: {
      video: {
        exists: !!videoAudioMindmap.result?.videoUrl,
        url: videoAudioMindmap.result?.videoUrl ?? undefined,
        time: videoAudioMindmap.time,
      },
      audio: {
        exists: !!videoAudioMindmap.result?.audioUrl,
        url: videoAudioMindmap.result?.audioUrl ?? undefined,
        time: videoAudioMindmap.time,
      },
      mindmap: {
        exists: !!videoAudioMindmap.result?.mindmapUrl || mindmap.result,
        url: videoAudioMindmap.result?.mindmapUrl ?? undefined,
        time: Math.max(videoAudioMindmap.time, mindmap.time),
      },
      briefing: {
        exists: !!briefing.result,
        size: briefing.result?.length || 0,
        time: briefing.time,
      },
      facts: {
        exists: !!facts.result,
        size: facts.result?.length || 0,
        time: facts.time,
      },
      studyGuide: {
        exists: !!studyGuide.result,
        size: studyGuide.result?.length || 0,
        time: studyGuide.time,
      },
      report: {
        exists: !!report.result,
        size: report.result?.length || 0,
        time: report.time,
      },
      quiz: {
        exists: !!quiz.result,
        questions: quiz.result?.questions?.length || 0,
        time: quiz.time,
      },
      flashcards: {
        exists: !!flashcards.result,
        count: flashcards.result
          ? (flashcards.result.easy?.length || 0) +
            (flashcards.result.medium?.length || 0) +
            (flashcards.result.full?.length || 0)
          : 0,
        time: flashcards.time,
      },
      slides: {
        presented: {
          count: slidesPresented.result?.length || 0,
          time: slidesPresented.time,
        },
        detailed: {
          count: slidesDetailed.result?.length || 0,
          time: slidesDetailed.time,
        },
        facts: {
          count: slidesFacts.result?.length || 0,
          time: slidesFacts.time,
        },
      },
      infographics: {
        concise: {
          exists: !!infConcise.result,
          time: infConcise.time,
        },
        standard: {
          exists: !!infStandard.result,
          time: infStandard.time,
        },
        bentoGrid: {
          exists: !!infBento.result,
          time: infBento.time,
        },
      },
    },
    errors,
  };
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireStudent();

    const searchParams = req.nextUrl.searchParams;
    const startPart = parseInt(searchParams.get("start") || "1");
    const endPart = parseInt(searchParams.get("end") || "100");
    const sample = searchParams.get("sample"); // "quick" = test parts 1,10,20,30...

    let partsToTest: number[];
    if (sample === "quick") {
      partsToTest = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    } else {
      partsToTest = Array.from({ length: endPart - startPart + 1 }, (_, i) => startPart + i);
    }

    console.log(`\n=== STRESS TEST: Testing ${partsToTest.length} parts ===`);
    const overallStart = Date.now();

    // Test parts in batches of 10 to avoid overwhelming the system
    const batchSize = 10;
    const results: AssetTestResult[] = [];

    for (let i = 0; i < partsToTest.length; i += batchSize) {
      const batch = partsToTest.slice(i, i + batchSize);
      console.log(`Testing batch: Parts ${batch[0]}-${batch[batch.length - 1]}`);

      const batchResults = await Promise.all(batch.map((partNum) => testPart(partNum)));
      results.push(...batchResults);
    }

    const overallTime = Date.now() - overallStart;

    // Calculate statistics
    const stats = {
      totalParts: partsToTest.length,
      totalTime: overallTime,
      averageTimePerPart: overallTime / partsToTest.length,
      assetCounts: {
        videos: results.filter((r) => r.assets.video.exists).length,
        audio: results.filter((r) => r.assets.audio.exists).length,
        mindmaps: results.filter((r) => r.assets.mindmap.exists).length,
        briefings: results.filter((r) => r.assets.briefing.exists).length,
        facts: results.filter((r) => r.assets.facts.exists).length,
        studyGuides: results.filter((r) => r.assets.studyGuide.exists).length,
        reports: results.filter((r) => r.assets.report.exists).length,
        quizzes: results.filter((r) => r.assets.quiz.exists).length,
        flashcards: results.filter((r) => r.assets.flashcards.exists).length,
        slidesPresented: results.reduce((sum, r) => sum + r.assets.slides.presented.count, 0),
        slidesDetailed: results.reduce((sum, r) => sum + r.assets.slides.detailed.count, 0),
        slidesFacts: results.reduce((sum, r) => sum + r.assets.slides.facts.count, 0),
        infographicsConcise: results.filter((r) => r.assets.infographics.concise.exists).length,
        infographicsStandard: results.filter((r) => r.assets.infographics.standard.exists).length,
        infographicsBento: results.filter((r) => r.assets.infographics.bentoGrid.exists).length,
      },
      averageLoadTimes: {
        video: results.reduce((sum, r) => sum + r.assets.video.time, 0) / results.length,
        audio: results.reduce((sum, r) => sum + r.assets.audio.time, 0) / results.length,
        slides: results.reduce((sum, r) => sum + r.assets.slides.presented.time, 0) / results.length,
        text: results.reduce((sum, r) => sum + r.assets.briefing.time, 0) / results.length,
      },
      partsWithErrors: results.filter((r) => r.errors.length > 0).length,
    };

    console.log(`\n=== STRESS TEST COMPLETE ===`);
    console.log(`Total time: ${overallTime}ms (${(overallTime / 1000).toFixed(2)}s)`);
    console.log(`Average per part: ${stats.averageTimePerPart.toFixed(0)}ms`);
    console.log(`Videos found: ${stats.assetCounts.videos}/${results.length}`);
    console.log(`Audio found: ${stats.assetCounts.audio}/${results.length}`);
    console.log(`Parts with errors: ${stats.partsWithErrors}`);

    return NextResponse.json({
      success: true,
      stats,
      results,
    });
  } catch (error) {
    console.error("Stress test error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
