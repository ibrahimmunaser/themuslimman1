import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCachedStudent } from "@/lib/auth-cache";
import { hasActiveCourseAccess } from "@/lib/access";
import { getActiveProfileId } from "@/app/actions/profiles";
import { getPartById, PARTS } from "@/lib/content";
import { ERA_MAP } from "@/lib/types";
import type { Part, Quiz } from "@/lib/types";

/** Remove correct_answer from all questions before the quiz crosses the server→client boundary.
 *  The RSC payload is inspectable by anyone; answers are validated server-side via checkQuizAnswer. */
function stripQuizAnswers(quiz: Quiz | null | undefined): Quiz | null | undefined {
  if (!quiz) return quiz;
  return {
    ...quiz,
    questions: quiz.questions.map(({ correct_answer: _a, ...q }) => q as Quiz["questions"][number]),
  };
}
import { getPartPageData } from "@/lib/part-content-cache";
import { prisma } from "@/lib/db";
import {
  ArrowLeft,
  Clock,
} from "lucide-react";
import { PartTabs } from "@/components/part/part-tabs";
import { PartNavButtons } from "@/components/part/part-nav-buttons";
import { StudyTimeTracker } from "@/components/study-time-tracker";
import { trackPartOpened } from "@/app/actions/progress";
import { PartProgressBadges } from "@/components/part/part-progress-badges";
import { UpNextCard } from "@/components/part/up-next-card";

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
  initialVideoPercent: number;
  initialVideoCompleted: boolean;
  initialQuizBestScore?: number;
}

async function PartTabsContent({ partNumber, partBase, userPlan, initialVideoPercent, initialVideoCompleted, initialQuizBestScore }: PartTabsContentProps) {
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
    thumbnailUrl,
  } = await getPartPageData(partNumber);

  const part: Part = {
    ...partBase,
    assets: {
      briefingText:         briefingText ?? undefined,
      statementOfFactsText: statementOfFactsText ?? undefined,
      studyGuideText:       studyGuideText ?? undefined,
      reportText:           reportText ?? undefined,
      quiz:                 stripQuizAnswers(quizData as Part["assets"]["quiz"]) as Part["assets"]["quiz"],
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
    <div className="animate-page-enter">
      <PartTabs
        part={part}
        userPlan={userPlan}
        initialAssetUrls={{ videoUrl, audioUrl, mindmapUrl, thumbnailUrl }}
        initialVideoPercent={initialVideoPercent}
        initialVideoCompleted={initialVideoCompleted}
        initialQuizBestScore={initialQuizBestScore}
      />
    </div>
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
  // getCachedStudent() deduplicates with the seerah/layout.tsx call in the same request.
  const user = await getCachedStudent();
  if (!user.studentProfileId) notFound();

  const learnerProfileId = user.activeProfileId ?? await getActiveProfileId(user.id);

  // Determine the Children's Seerah path order so we can apply path-aware
  // sequential locking. Part 7 is always accessible (first in Children's path).
  // For other Children's parts, passing EITHER the complete-path predecessor
  // (n-1) OR the Children's-path predecessor unlocks access.
  const CHILDREN_PARTS = PARTS
    .filter((p) => p.audiences.includes("children"))
    .sort((a, b) => a.partNumber - b.partNumber);
  const childrenIndex = CHILDREN_PARTS.findIndex((p) => p.partNumber === n);
  const isFirstInChildrenPath = childrenIndex === 0;
  // Previous part in Children's path (null if n is not in path, or is first)
  const prevChildrenPartNumber =
    childrenIndex > 0 ? CHILDREN_PARTS[childrenIndex - 1].partNumber : null;
  // Only fetch children's predecessor if it's different from the complete-path
  // predecessor (n-1) — otherwise prevProgress already covers it.
  const needsChildrenQuery =
    prevChildrenPartNumber !== null && prevChildrenPartNumber !== n - 1;

  const [accessOk, partProgress, prevProgress, prevChildrenProgress] = await Promise.all([
    n !== 1 ? hasActiveCourseAccess(user.id, user.hasPaid) : Promise.resolve(true),
    prisma.partProgress.findUnique({
      where: { learnerProfileId_partNumber: { learnerProfileId, partNumber: n } },
      select: {
        videoWatchPercent:  true,
        videoCompleted:     true,
        briefingOpened:     true,
        quizPassed:         true,
        quizBestScore:      true,
        flashcardsReviewed: true,
        openedAssets:       true,
      },
    }),
    n > 1
      ? prisma.partProgress.findUnique({
          where: { learnerProfileId_partNumber: { learnerProfileId, partNumber: n - 1 } },
          select: { quizPassed: true },
        })
      : Promise.resolve(null),
    needsChildrenQuery
      ? prisma.partProgress.findUnique({
          where: { learnerProfileId_partNumber: { learnerProfileId, partNumber: prevChildrenPartNumber! } },
          select: { quizPassed: true },
        })
      : Promise.resolve(null),
  ]);

  if (!accessOk) redirect("/pricing");

  // Sequential progression lock.
  // Part 1 and the first Children's-path part (Part 7) are always accessible.
  // Every other part requires the previous part in EITHER the complete path
  // (n-1) OR the Children's path to have its quiz passed.
  if (n > 1 && !isFirstInChildrenPath) {
    const completePrevPassed = prevProgress?.quizPassed ?? false;
    // If children's predecessor == n-1, reuse prevProgress (same DB row).
    // If n is not in children's path at all (prevChildrenPartNumber === null),
    // children's check contributes nothing (false).
    const childrenPrevPassed = needsChildrenQuery
      ? (prevChildrenProgress?.quizPassed ?? false)
      : prevChildrenPartNumber !== null && (prevProgress?.quizPassed ?? false);
    if (!completePrevPassed && !childrenPrevPassed) {
      // Redirect to whichever predecessor applies.
      // If the current part is in the Children's path, send them to the
      // Children's predecessor so they know what to complete next.
      // Otherwise fall back to the complete-path predecessor (n-1).
      const redirectTo = prevChildrenPartNumber !== null ? prevChildrenPartNumber : n - 1;
      redirect(`/seerah/part-${redirectTo}`);
    }
  }

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

  // Compute Children's-path siblings so the nav buttons can switch between
  // complete-order and children's-order based on the active path in localStorage.
  const childrenPartsOrdered = PARTS
    .filter((p) => p.audiences.includes("children"))
    .sort((a, b) => a.partNumber - b.partNumber);
  const childrenPartIndex = childrenPartsOrdered.findIndex((p) => p.id === partId);
  const childrenPrevPart = childrenPartIndex > 0
    ? childrenPartsOrdered[childrenPartIndex - 1]
    : null;
  const childrenNextPart = childrenPartIndex >= 0 && childrenPartIndex < childrenPartsOrdered.length - 1
    ? childrenPartsOrdered[childrenPartIndex + 1]
    : null;

  // ④ Shell renders immediately after auth (~400-800ms TTFB).
  //    PartTabsContent is inside <Suspense> — it streams in when R2 is ready.
  return (
    <>
      <StudyTimeTracker partNumber={n} />

      <div className="min-h-screen bg-background animate-page-enter">
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
              initialVideoPercent={partProgress?.videoWatchPercent ?? 0}
              initialVideoCompleted={
                !!(partProgress?.videoCompleted || (partProgress?.videoWatchPercent ?? 0) >= 85)
              }
              initialQuizBestScore={partProgress?.quizBestScore ?? undefined}
            />
          </Suspense>

          {/* Up Next card — shows Children's or Complete next part based on path cookie */}
          <UpNextCard
            completePath={nextPart}
            childrenPath={childrenNextPart ?? null}
          />

          {/* Navigation row — client component so startTransition keeps current page
              visible during load (no skeleton flash) */}
          <PartNavButtons
            prevPart={prevPart ? { id: prevPart.id, partNumber: prevPart.partNumber } : null}
            nextPart={nextPart ? { id: nextPart.id, partNumber: nextPart.partNumber, title: nextPart.title, subtitle: nextPart.subtitle } : null}
            childrenPrevPart={childrenPrevPart ? { id: childrenPrevPart.id, partNumber: childrenPrevPart.partNumber } : null}
            childrenNextPart={childrenNextPart ? { id: childrenNextPart.id, partNumber: childrenNextPart.partNumber, title: childrenNextPart.title, subtitle: childrenNextPart.subtitle } : null}
            currentPart={n}
            totalParts={allParts.length}
            childrenTotalParts={childrenPartsOrdered.length}
            childrenCurrentIndex={childrenPartIndex >= 0 ? childrenPartIndex + 1 : undefined}
            initialQuizPassed={partProgress?.quizPassed ?? false}
          />
        </div>
      </div>
    </>
  );
}
