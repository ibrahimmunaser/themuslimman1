import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireStudent } from "@/lib/auth";
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
  getPartAssetUrls,
} from "@/lib/files";
import { getR2AssetUrl, getR2PublicUrl } from "@/lib/r2";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  BookOpen,
  Lock,
} from "lucide-react";
import { PartTabs } from "@/components/part/part-tabs";
import { prisma } from "@/lib/db";

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

export default async function LearnPartPage(props: Props) {
  const user = await requireStudent();
  if (!user.studentProfileId) notFound();

  const { partId } = await props.params;
  const partBase = getPartById(partId);
  if (!partBase) notFound();

  // Check if user has paid
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { hasPaid: true },
  });

  if (!dbUser?.hasPaid) {
    // Redirect to pricing if not paid
    redirect("/pricing");
  }

  const n = partBase.partNumber;
  
  // Get user's progress for this part
  const progress = await prisma.studentProgress.findFirst({
    where: {
      studentProfileId: user.studentProfileId,
      classCourseItemId: null, // Direct learn progress (not tied to a class)
    },
  });

  // Load assets from R2
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
    readBriefing(n),
    readStatementOfFacts(n),
    readStudyGuide(n),
    readReport(n),
    readQuiz(n),
    readFlashcards(n),
    getSlideFiles(n, "presented"),
    getSlideFiles(n, "detailed"),
    getSlideFiles(n, "facts"),
    getInfographicFilename(n, "Concise"),
    getInfographicFilename(n, "Standard"),
    getInfographicFilename(n, "Bento Grid"),
    mindmapExists(n),
    getPartAssetUrls(n),
  ]);

  const slideFiles = {
    presented: slidesPresentedFiles,
    detailed: slidesDetailedFiles,
    facts: slidesFactsFiles,
  };

  const part = {
    ...partBase,
    assets: {
      videoUrl: assetUrls.videoUrl ? await getR2AssetUrl(assetUrls.videoUrl) : undefined,
      audioUrl: assetUrls.audioUrl ? await getR2AssetUrl(assetUrls.audioUrl) : undefined,
      infographicConcise: infConcise ? await getR2PublicUrl(infConcise) : undefined,
      infographicStandard: infStandard ? await getR2PublicUrl(infStandard) : undefined,
      infographicBento: infBento ? await getR2PublicUrl(infBento) : undefined,
      mindmap: hasMindmap ? await getR2AssetUrl(`part-${n}/mindmap/mindmap.html`) : undefined,
      slides: {
        presented: slidesPresentedFiles.map((f: string) => getR2PublicUrl(f)),
        detailed: slidesDetailedFiles.map((f: string) => getR2PublicUrl(f)),
        facts: slidesFactsFiles.map((f: string) => getR2PublicUrl(f)),
      },
    },
    briefing: briefingText,
    statementOfFacts: statementOfFactsText,
    studyGuide: studyGuideText,
    report: reportText,
    quiz: quizData,
    flashcards,
  };

  const allParts = PARTS;
  const currentIndex = allParts.findIndex((p) => p.id === partId);
  const prevPart = currentIndex > 0 ? allParts[currentIndex - 1] : null;
  const nextPart = currentIndex < allParts.length - 1 ? allParts[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-surface sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/learn"
              className="inline-flex items-center gap-2 text-text-secondary hover:text-text transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Series</span>
              <span className="sm:hidden">Back</span>
            </Link>

            <div className="flex items-center gap-3">
              <span className="px-2 py-1 text-xs font-medium rounded-md bg-gold/10 text-gold border border-gold/20">
                Part {part.partNumber}
              </span>
              <span className="text-xs text-text-muted uppercase tracking-wider hidden sm:inline">
                {ERA_MAP[part.era as keyof typeof ERA_MAP] || part.era}
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
        <PartTabs part={part} />

        {/* Navigation */}
        <div className="mt-8 pt-6 border-t border-border flex items-center justify-between gap-4">
          {prevPart ? (
            <Link
              href={`/learn/${prevPart.id}`}
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
              href={`/learn/${nextPart.id}`}
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
  );
}
