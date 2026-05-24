import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireStudent } from "@/lib/auth";
import { hasActiveCourseAccess } from "@/lib/access";
import { getPartById, PARTS } from "@/lib/content";
import { ERA_MAP } from "@/lib/types";
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
} from "@/lib/files";
import { getR2AssetUrl, getR2PublicUrl } from "@/lib/r2";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { PartTabs } from "@/components/part/part-tabs";
import { prisma } from "@/lib/db";
import { StudentLayout } from "@/components/student/student-layout";
import { StudyTimeTracker } from "@/components/study-time-tracker";
import { trackPartOpened } from "@/app/actions/progress";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ partId: string }>;
}

export async function generateMetadata(props: Props) {
  const { partId } = await props.params;
  const part = getPartById(partId);
  if (!part) return { title: "Part Not Found" };
  
  return {
    title: `Part ${part.partNumber}: ${part.title}`,
    description: part.description || `Seerah Part ${part.partNumber}`,
  };
}

export default async function SeerahPartPage(props: Props) {
  const user = await requireStudent();
  if (!user.studentProfileId) notFound();

  const { partId } = await props.params;
  const partBase = getPartById(partId);
  if (!partBase) notFound();

  // Lifetime purchase OR active monthly subscription grants access
  const hasAccess = await hasActiveCourseAccess(user.id);
  if (!hasAccess) {
    redirect("/pricing");
  }

  const userPlan = "complete" as const;

  const n = partBase.partNumber;

  // Mark part as started (fire-and-forget — doesn't block rendering)
  trackPartOpened(n).catch(() => {});

  console.log(`[Part ${n}] Loading content for ${partId}`);
  
  // Get user's progress for this part (will be implemented later)
  // TODO: Add direct progress tracking outside of class context
  const progress = null;

  // Load assets from R2 with error handling
  let briefingText: string | null;
  let statementOfFactsText: string | null;
  let studyGuideText: string | null;
  let reportText: string | null;
  let quizData: any;
  let flashcards: any;
  let slidesPresentedFiles: string[];
  let slidesDetailedFiles: string[];
  let slidesFactsFiles: string[];
  let infConcise: string | null;
  let infStandard: string | null;
  let infBento: string | null;
  let hasMindmap: boolean;

  try {
    [
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
    ] = await Promise.all([
      readBriefing(n).catch(e => { console.error(`[Part ${n}] Briefing error:`, e); return null; }),
      readStatementOfFacts(n).catch(e => { console.error(`[Part ${n}] Facts error:`, e); return null; }),
      readStudyGuide(n).catch(e => { console.error(`[Part ${n}] Study guide error:`, e); return null; }),
      readReport(n).catch(e => { console.error(`[Part ${n}] Report error:`, e); return null; }),
      readQuiz(n).catch(e => { console.error(`[Part ${n}] Quiz error:`, e); return null; }),
      readFlashcards(n).catch(e => { console.error(`[Part ${n}] Flashcards error:`, e); return null; }),
      getSlideFiles(n, "presented").catch(e => { console.error(`[Part ${n}] Presented slides error:`, e); return []; }),
      getSlideFiles(n, "detailed").catch(e => { console.error(`[Part ${n}] Detailed slides error:`, e); return []; }),
      getSlideFiles(n, "facts").catch(e => { console.error(`[Part ${n}] Facts slides error:`, e); return []; }),
      getInfographicFilename(n, "Concise").catch(e => { console.error(`[Part ${n}] Concise inf error:`, e); return null; }),
      getInfographicFilename(n, "Standard").catch(e => { console.error(`[Part ${n}] Standard inf error:`, e); return null; }),
      getInfographicFilename(n, "Bento Grid").catch(e => { console.error(`[Part ${n}] Bento inf error:`, e); return null; }),
      mindmapExists(n).catch(e => { console.error(`[Part ${n}] Mindmap error:`, e); return false; }),
    ]);
  } catch (error) {
    console.error(`[Part ${n}] Fatal error loading assets:`, error);
    // Set defaults to prevent crash
    briefingText = statementOfFactsText = studyGuideText = reportText = quizData = flashcards = null;
    slidesPresentedFiles = slidesDetailedFiles = slidesFactsFiles = [];
    infConcise = infStandard = infBento = null;
    hasMindmap = false;
  }

  // Log asset info for debugging
  console.log(`[Part ${n}] Assets loaded:`, {
    slideCounts: {
      presented: slidesPresentedFiles.length,
      detailed: slidesDetailedFiles.length,
      facts: slidesFactsFiles.length,
    },
    infographics: { infConcise, infStandard, infBento },
    textContent: {
      briefing: !!briefingText,
      facts: !!statementOfFactsText,
      studyGuide: !!studyGuideText,
      report: !!reportText,
    },
    hasMindmap,
  });

  // Slides are already URLs from getSlideFiles - use them directly
  const slideFiles = {
    presented: slidesPresentedFiles,
    detailed: slidesDetailedFiles,
    facts: slidesFactsFiles,
  };

  const part = {
    ...partBase,
    assets: {
      // Video/audio/mindmap URLs are now lazy-loaded client-side
      briefingText: briefingText ?? undefined,
      statementOfFactsText: statementOfFactsText ?? undefined,
      studyGuideText: studyGuideText ?? undefined,
      reportText: reportText ?? undefined,
      quiz: quizData ?? undefined,
      flashcards: flashcards ?? undefined,
      infographics: {
        concise: infConcise
          ? (infConcise.includes("/") 
              ? getR2PublicUrl(infConcise) ?? undefined
              : `/seerah-media/Infographics/Concise/${infConcise}`)
          : undefined,
        standard: infStandard
          ? (infStandard.includes("/") 
              ? getR2PublicUrl(infStandard) ?? undefined
              : `/seerah-media/Infographics/Standard/${infStandard}`)
          : undefined,
        bentoGrid: infBento
          ? (infBento.includes("/") 
              ? getR2PublicUrl(infBento) ?? undefined
              : `/seerah-media/Infographics/Bento Grid/${infBento}`)
          : undefined,
      },
      slides: slideFiles,
    },
  };

  const allParts = PARTS;
  const currentIndex = allParts.findIndex((p) => p.id === partId);
  const prevPart = currentIndex > 0 ? allParts[currentIndex - 1] : null;
  const nextPart = currentIndex < allParts.length - 1 ? allParts[currentIndex + 1] : null;

  // All parts are freely navigable for paid users — no sequential lock

  return (
    <StudentLayout userPlan={userPlan} userName={user.fullName}>
      {/* Track study time for this lesson */}
      <StudyTimeTracker partNumber={partBase.partNumber} />
      
      <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-surface sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 pr-20 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/seerah"
              className="inline-flex items-center gap-2 text-text-secondary hover:text-text transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Seerah</span>
              <span className="sm:hidden">Back</span>
            </Link>

            <div className="flex items-center gap-3">
              <span className="px-2 py-1 text-xs font-medium rounded-md bg-gold/10 text-gold border border-gold/20">
                Part {part.partNumber}
              </span>
              <span className="text-xs text-text-muted uppercase tracking-wider hidden sm:inline">
                {ERA_MAP[part.era as keyof typeof ERA_MAP]?.label || part.era}
              </span>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-text mt-3">
            {part.title}
          </h1>
          {part.subtitle && (
            <p className="text-sm text-text-secondary mt-1">{part.subtitle}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PartTabs part={part} userPlan={userPlan} />

        {/* Navigation */}
        <div className="mt-8 pt-6 border-t border-border flex items-center justify-between gap-4">
          {prevPart ? (
            <Link
              href={`/seerah/${prevPart.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-border hover:border-gold/30 hover:bg-surface-raised transition-all text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              <div className="text-left">
                <p className="text-xs text-text-muted">Previous</p>
                <p className="text-text font-medium">Part {prevPart.partNumber}</p>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {nextPart && (
            <Link
              href={`/seerah/${nextPart.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-ink hover:bg-gold-light transition-all text-sm font-medium ml-auto"
            >
              <div className="text-right">
                <p className="text-xs text-ink/70">Next</p>
                <p className="text-ink font-medium">Part {nextPart.partNumber}</p>
              </div>
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
      </div>
    </StudentLayout>
  );
}
