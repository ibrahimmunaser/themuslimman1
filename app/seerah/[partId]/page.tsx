import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireStudent } from "@/lib/auth";
import { hasActiveCourseAccess } from "@/lib/access";
import { getPartById, PARTS } from "@/lib/content";
import { ERA_MAP } from "@/lib/types";
import { getPartPageData } from "@/lib/part-content-cache";
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

  const n = partBase.partNumber;

  // Part 1 is free — logged-in users can view it without a purchase.
  // Parts 2–100 require a lifetime purchase or an active/trialing monthly subscription.
  if (n !== 1) {
    const hasAccess = await hasActiveCourseAccess(user.id);
    if (!hasAccess) {
      redirect("/pricing");
    }
  }

  const userPlan = "complete" as const;

  // Mark part as started (fire-and-forget — doesn't block rendering)
  trackPartOpened(n).catch(() => {});

  // Load all part content from cache (first load hits R2; subsequent loads are instant)
  const {
    briefingText,
    statementOfFactsText,
    studyGuideText,
    reportText,
    quizData,
    flashcards,
    slidesPresentedFiles,
    slidesDetailedFiles,
    slidesFactsFiles,
    infSignedConcise,
    infSignedStandard,
    infSignedBento,
    hasMindmap,
    videoUrl,
    audioUrl,
    mindmapUrl,
  } = await getPartPageData(n);

  const part = {
    ...partBase,
    assets: {
      briefingText:          briefingText ?? undefined,
      statementOfFactsText:  statementOfFactsText ?? undefined,
      studyGuideText:        studyGuideText ?? undefined,
      reportText:            reportText ?? undefined,
      quiz:                  quizData ?? undefined,
      flashcards:            flashcards ?? undefined,
      infographics: {
        concise:   infSignedConcise,
        standard:  infSignedStandard,
        bentoGrid: infSignedBento,
      },
      slides: {
        presented: slidesPresentedFiles,
        detailed:  slidesDetailedFiles,
        facts:     slidesFactsFiles,
      },
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
        <PartTabs part={part} userPlan={userPlan} initialAssetUrls={{ videoUrl, audioUrl, mindmapUrl }} />

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
