import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireStudent } from "@/lib/auth";
import { hasActiveCourseAccess } from "@/lib/access";
import { getActiveProfileId } from "@/app/actions/profiles";
import { getPartById, PARTS } from "@/lib/content";
import { ERA_MAP } from "@/lib/types";
import type { Part } from "@/lib/types";
import { getPartPageData } from "@/lib/part-content-cache";
import { prisma } from "@/lib/db";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { PartTabs } from "@/components/part/part-tabs";
import { StudentLayout } from "@/components/student/student-layout";
import { StudyTimeTracker } from "@/components/study-time-tracker";
import { trackPartOpened } from "@/app/actions/progress";
import { PartProgressBadges } from "@/components/part/part-progress-badges";

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

// ─── Streaming content component ──────────────────────────────────────────────
// Runs inside a <Suspense> boundary. Awaits the R2 cache (which was already
// kicked off at the start of the parent component), then renders PartTabs.

interface PartTabsContentProps {
  partNumber: number;
  partBase: NonNullable<ReturnType<typeof getPartById>>;
  userPlan: "essentials" | "complete";
}

async function PartTabsContent({ partNumber, partBase, userPlan }: PartTabsContentProps) {
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
    videoUrl,
    audioUrl,
    mindmapUrl,
  } = await getPartPageData(partNumber);

  const part: Part = {
    ...partBase,
    assets: {
      briefingText:         briefingText ?? undefined,
      statementOfFactsText: statementOfFactsText ?? undefined,
      studyGuideText:       studyGuideText ?? undefined,
      reportText:           reportText ?? undefined,
      quiz:                 quizData as Part["assets"]["quiz"],
      flashcards:           flashcards as Part["assets"]["flashcards"],
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

  return (
    <PartTabs
      part={part}
      userPlan={userPlan}
      initialAssetUrls={{ videoUrl, audioUrl, mindmapUrl }}
    />
  );
}

// Skeleton shown while PartTabs data loads
function PartTabsFallback() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[120, 96, 104, 88, 110, 92, 108, 80].map((w, i) => (
          <div
            key={i}
            className="h-9 rounded-lg bg-surface-raised animate-pulse shrink-0"
            style={{ width: w }}
          />
        ))}
      </div>
      <div className="flex gap-2 mb-1">
        {[80, 72, 68].map((w, i) => (
          <div
            key={i}
            className="h-8 rounded-md bg-surface-raised animate-pulse"
            style={{ width: w }}
          />
        ))}
      </div>
      <div className="w-full aspect-video rounded-xl bg-surface-raised animate-pulse" />
      <div className="mt-3 space-y-2">
        <div className="h-4 w-3/4 bg-surface-raised rounded animate-pulse" />
        <div className="h-4 w-1/2 bg-surface-raised rounded animate-pulse" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SeerahPartPage(props: Props) {
  const { partId } = await props.params;
  const partBase = getPartById(partId);
  if (!partBase) notFound();

  const n = partBase.partNumber;

  // ① Kick off the slow R2 fetch immediately — runs in parallel with auth below.
  //    The inflight dedup Map in part-content-cache ensures PartTabsContent
  //    joins this same promise rather than starting a new one.
  getPartPageData(n).catch(() => {});

  // ② Auth + access check + progress fetch (parallel where possible)
  const user = await requireStudent();
  if (!user.studentProfileId) notFound();

  const learnerProfileId = user.activeProfileId ?? await getActiveProfileId(user.id);

  const [accessOk, partProgress] = await Promise.all([
    n !== 1 ? hasActiveCourseAccess(user.id, user.hasPaid) : Promise.resolve(true),
    prisma.partProgress.findUnique({
      where: { learnerProfileId_partNumber: { learnerProfileId, partNumber: n } },
      select: {
        videoWatchPercent:  true,
        briefingOpened:     true,
        quizPassed:         true,
        quizBestScore:      true,
        flashcardsReviewed: true,
        openedAssets:       true,
      },
    }),
  ]);

  if (!accessOk) redirect("/pricing");

  const userPlan = "complete" as const;

  // Parse openedAssets for the live header badge component
  let openedAssets: string[] = [];
  try { openedAssets = JSON.parse((partProgress?.openedAssets as string) ?? "[]"); } catch {}

  // ③ Background fire-and-forget tasks (don't block rendering)
  trackPartOpened(n).catch(() => {});
  // Pre-warm adjacent parts so Next/Prev navigation is instant
  if (n + 1 <= PARTS.length) getPartPageData(n + 1).catch(() => {});
  if (n - 1 >= 1)             getPartPageData(n - 1).catch(() => {});

  const allParts = PARTS;
  const currentIndex = allParts.findIndex((p) => p.id === partId);
  const prevPart = currentIndex > 0 ? allParts[currentIndex - 1] : null;
  const nextPart = currentIndex < allParts.length - 1 ? allParts[currentIndex + 1] : null;

  // ④ Shell renders immediately after auth (~400-800ms TTFB).
  //    PartTabsContent is inside <Suspense> — it streams in when R2 is ready.
  return (
    <StudentLayout userPlan={userPlan} userName={user.fullName} activeProfileName={user.activeProfileName} planType={user.planType}>
      <StudyTimeTracker partNumber={n} />

      <div className="min-h-screen bg-background">
        {/* Header — sticky, renders with the shell */}
        <div className="border-b border-border bg-surface sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4">
            {/* Top row: back + part badge — padding kept symmetric; floating menu overlays independently */}
            <div className="flex items-center justify-between gap-4">
              <Link
                href="/seerah"
                className="inline-flex items-center gap-1.5 text-text-secondary hover:text-text transition-colors text-sm min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Back to Seerah</span>
                <span className="sm:hidden">Back</span>
              </Link>

              {/* Right side — part badge + era (+ gap for floating menu on mobile) */}
              <div className="flex items-center gap-2 mr-10 sm:mr-0">
                <span className="px-2 py-1 text-xs font-semibold rounded-md bg-gold/10 text-gold border border-gold/20">
                  Part {partBase.partNumber}
                </span>
                <span className="text-xs text-text-muted uppercase tracking-wider hidden sm:inline">
                  {ERA_MAP[partBase.era as keyof typeof ERA_MAP]?.label || partBase.era}
                </span>
              </div>
            </div>

            {/* Title — no hyphen breaks; subtitle hidden on mobile to save height */}
            <h1
              className="text-base sm:text-2xl font-bold text-text mt-1 leading-snug"
              style={{ hyphens: "none", overflowWrap: "normal", wordBreak: "normal" }}
            >
              {partBase.title}
            </h1>
            {partBase.subtitle && (
              <p className="hidden sm:block text-xs sm:text-sm text-text-secondary/80 mt-0.5 leading-snug">{partBase.subtitle}</p>
            )}

            {/* Lesson metadata — era (mobile only) + estimated time — collapsed on mobile to save header height */}
            <div className="hidden sm:flex items-center gap-2.5 mt-1.5">
              <span className="text-[11px] text-text-muted/60 uppercase tracking-wider">
                {ERA_MAP[partBase.era as keyof typeof ERA_MAP]?.label || partBase.era}
              </span>
              <span className="text-text-muted/30 text-[10px]">·</span>
              <span className="flex items-center gap-1 text-[11px] text-text-muted/60">
                <Clock className="w-3 h-3" />
                15–20 min
              </span>
            </div>

            {/* Per-asset progress indicators — live client component */}
            <PartProgressBadges
              initial={{
                videoWatchPercent:  partProgress?.videoWatchPercent  ?? 0,
                briefingOpened:     partProgress?.briefingOpened     ?? false,
                quizPassed:         partProgress?.quizPassed         ?? false,
                quizBestScore:      partProgress?.quizBestScore      ?? null,
                flashcardsReviewed: partProgress?.flashcardsReviewed ?? false,
                openedAssets,
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
          {/* PartTabs: streams in when R2 data is ready */}
          <Suspense fallback={<PartTabsFallback />}>
            <PartTabsContent
              partNumber={n}
              partBase={partBase}
              userPlan={userPlan}
            />
          </Suspense>

          {/* Up Next card — preview only, nav row handles the CTA */}
          {nextPart && (
            <div className="mt-8 px-4 py-3.5 sm:px-5 sm:py-4 rounded-xl bg-gold/5 border border-gold/15">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gold/80 mb-1.5">Up Next</p>
              <p className="text-sm font-semibold text-text leading-snug line-clamp-2" style={{ hyphens: "none" }}>
                Part {nextPart.partNumber}: {nextPart.title}
              </p>
              {nextPart.subtitle && (
                <p className="text-xs text-text-secondary/70 mt-0.5 leading-snug">{nextPart.subtitle}</p>
              )}
            </div>
          )}

          {/* Navigation row */}
          <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between gap-3">
            {prevPart ? (
              <Link
                href={`/seerah/${prevPart.id}`}
                className="inline-flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border/60 hover:bg-surface-raised hover:border-border transition-all min-h-[48px]"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <div className="text-left">
                  <p className="text-[10px] text-text-muted">Previous</p>
                  <p className="text-xs font-medium text-text-secondary">Part {prevPart.partNumber}</p>
                </div>
              </Link>
            ) : (
              <div />
            )}

            {nextPart && (
              <Link
                href={`/seerah/${nextPart.id}`}
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 rounded-xl bg-gold text-ink hover:bg-gold-light transition-all font-bold ml-auto min-h-[52px] shadow-lg shadow-gold/25 text-sm"
              >
                <div className="text-right">
                  <p className="text-[10px] text-ink/60 font-normal leading-none mb-0.5">Continue</p>
                  <p className="font-bold leading-none">Part {nextPart.partNumber}</p>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </Link>
            )}
          </div>

          {/* Bottom progression — binge momentum */}
          <div className="mt-5 pb-2 flex items-center justify-center gap-2 text-[11px] text-text-muted/50 max-w-full">
            <span className="flex-shrink-0">Part {n} of {allParts.length}</span>
            {nextPart && (
              <>
                <span className="text-[9px] flex-shrink-0">·</span>
                <span className="truncate min-w-0">Next: {nextPart.title}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
