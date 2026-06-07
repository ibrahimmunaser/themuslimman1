import { redirect } from "next/navigation";
import { getCachedStudent } from "@/lib/auth-cache";
import { hasActiveCourseAccess } from "@/lib/access";
import { getActiveProfileId } from "@/app/actions/profiles";
import { PARTS } from "@/lib/content";
import { getThumbnailUrls } from "@/lib/r2";
import { getPartPageData } from "@/lib/part-content-cache";
import { ERA_MAP } from "@/lib/types";
import { prisma } from "@/lib/db";
import { CourseDashboardTabs } from "@/components/course/course-dashboard-tabs";
import { CourseHomeContent } from "@/components/course/course-home-content";
import { CourseProgressContent } from "@/components/course/course-progress-content";
import { LessonsPathView } from "@/components/course/lessons-path-view";
import { ResourcesTabs } from "@/components/resources/resources-tabs";
import { VideoResourceContent } from "@/components/resources/video-resource-content";
import { AudioResourceContent } from "@/components/resources/audio-resource-content";
import { TextResourceContent } from "@/components/resources/text-resource-content";
import { SimpleResourceContent } from "@/components/resources/simple-resource-content";
import { QuizResourceContent } from "@/components/resources/quiz-resource-content";

export const metadata = { title: "Complete Seerah" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LearnIndexPage() {
  // getCachedStudent() deduplicates with the seerah/layout.tsx call in the same request.
  const user = await getCachedStudent();
  if (!user.studentProfileId) redirect("/");

  // Run access check, thumbnail fetch, and profile-ID resolution in parallel.
  //
  // Why this order is safe:
  //   - hasActiveCourseAccess: for lifetime buyers (hasPaid=true) it short-circuits
  //     instantly; for monthly subscribers it runs 3 parallel DB queries. Either
  //     way it is completely independent of thumbnails and profile resolution.
  //   - getThumbnailUrls: pure R2 API call, independent of everything.
  //   - profileId: reads the cookie value already validated by getCurrentUser();
  //     falls back to a DB lookup only for brand-new sessions (very rare).
  //
  // Previously these ran sequentially (access → profile → [progress + thumbnails]).
  // For monthly subscribers this collapses one full sequential step, saving the
  // R2 thumbnail latency (~50–200 ms) off the dashboard's critical path.
  const [hasAccess, thumbnails, learnerProfileId] = await Promise.all([
    hasActiveCourseAccess(user.id, user.hasPaid),
    getThumbnailUrls(PARTS.map((p) => p.partNumber)),
    user.activeProfileId
      ? Promise.resolve(user.activeProfileId)
      : getActiveProfileId(user.id),
  ]);

  if (!hasAccess) redirect("/pricing");

  // Check if the user's subscription is past_due — they still have access
  // (we include past_due in ACTIVE_SUBSCRIPTION_STATUSES) but we show a
  // persistent banner so they know to fix their payment before retries run out.
  const pastDueSub = user.hasPaid ? null : await prisma.subscription.findFirst({
    where: { userId: user.id, status: "past_due" },
    select: { id: true },
  });
  const isPastDue = !!pastDueSub;

  const userPlan = "complete" as const;

  // Fetch all per-part progress for this profile in one query.
  const allPartProgress = await prisma.partProgress.findMany({
    where: { learnerProfileId },
    orderBy: { partNumber: "asc" },
    select: {
      partNumber:         true,
      status:             true,
      videoWatchPercent:  true,
      briefingOpened:     true,
      quizPassed:         true,
      quizBestScore:      true,
      quizAttempts:       true,
      flashcardsReviewed: true,
      openedAssets:       true,
      lastAccessedAt:     true,
    },
  });

  // Children's Seerah path has been removed — always use the complete path.
  const activeLearningPath = "complete" as const;

  // Derive progress overview stats inline (replaces the old getProgress() call).
  const completedParts = allPartProgress
    .filter(p => p.quizPassed)
    .map(p => p.partNumber);

  // "started" is the only real DB status for in-progress parts.
  const inProgressParts = allPartProgress
    .filter(p => p.status === "started")
    .map(p => p.partNumber);

  // Build a set of passed quizzes for sequential-lock checks.
  const quizPassedSet = new Set(completedParts);

  // The highest part number the user can actually reach under the sequential lock:
  // Part 1 is always accessible; Part n (n>1) requires Part n-1 quiz passed.
  // Walk forward from 1 until we hit the first part whose prerequisite is unmet.
  const maxAccessiblePart = (() => {
    for (let n = 2; n <= PARTS.length; n++) {
      if (!quizPassedSet.has(n - 1)) return n - 1;
    }
    return PARTS.length;
  })();

  // Compute current part: the lowest in-progress accessible part, or next after
  // the highest completed, or Part 1 if nothing has started yet. Clamped to
  // maxAccessiblePart so a stale "started" row never sends the user somewhere locked.
  const accessibleInProgress = inProgressParts.filter(n => n <= maxAccessiblePart);
  const accessibleCompleted  = completedParts.filter(n => n <= maxAccessiblePart);
  let currentPart: number;
  if (accessibleInProgress.length > 0) {
    currentPart = Math.min(...accessibleInProgress);
  } else if (accessibleCompleted.length > 0) {
    currentPart = Math.min(Math.max(...accessibleCompleted) + 1, maxAccessiblePart);
  } else {
    currentPart = 1;
  }

  // Proactively warm the user's current part so clicking "Continue" / "Start stage"
  // hits a hot cache instead of waiting for cold R2 fetches.
  getPartPageData(currentPart).catch(() => {});

  const progressMap = Object.fromEntries(
    allPartProgress.map(p => [p.partNumber, p])
  );

  // Parse openedAssets JSON once per part — reused by all helper functions below.
  // Normalize legacy asset IDs to canonical values so old DB records are counted
  // correctly: "facts" and "statement_of_facts" → "statement-of-facts".
  const normalizeAssetId = (id: string): string => {
    if (id === "facts" || id === "statement_of_facts") return "statement-of-facts";
    return id;
  };
  const openedAssetsMap: Record<number, string[]> = Object.fromEntries(
    allPartProgress.map((p) => {
      try {
        const raw: string[] = p.openedAssets ? JSON.parse(p.openedAssets as string) : [];
        return [p.partNumber, raw.map(normalizeAssetId)];
      } catch {
        return [p.partNumber, []];
      }
    })
  );

  const getAssetProgressMap = (assetType: string) =>
    Object.fromEntries(
      allPartProgress.map((p) => [p.partNumber, (openedAssetsMap[p.partNumber] ?? []).includes(assetType)])
    );

  const getAssetCompletedCount = (assetType: string) =>
    allPartProgress.filter((p) => (openedAssetsMap[p.partNumber] ?? []).includes(assetType)).length;

  // Video stats for resource tabs — use videoWatchPercent >= 85 as the sole
  // signal; the legacy status field is not written after the quiz-only
  // completion change and should not be used for video-specific counts.
  const videoCompletedCount = allPartProgress.filter((p) => p.videoWatchPercent >= 85).length;
  const videoInProgressCount = allPartProgress.filter(
    (p) => p.videoWatchPercent > 0 && p.videoWatchPercent < 85
  ).length;
  const videoContinueWatching = allPartProgress
    .filter((p) => p.videoWatchPercent > 0 && p.videoWatchPercent < 85)
    .sort((a, b) => b.videoWatchPercent - a.videoWatchPercent)[0];

  // Quiz stats
  const quizCompletedCount = allPartProgress.filter((p) => p.quizPassed).length;
  const quizPassedCount = quizCompletedCount;
  const quizTotalAttempts = allPartProgress.reduce((sum, p) => sum + (p.quizAttempts || 0), 0);
  // Only average rows where the user actually attempted a quiz (has a score).
  // Including zero-score rows in the denominator's count-only calculation was
  // producing averages > 100% (e.g. 5 passed rows / 10 scored rows = inflated avg).
  const quizScoredRows = allPartProgress.filter((p) => (p.quizAttempts || 0) > 0 && p.quizBestScore != null);
  const quizAvgScore = quizScoredRows.length > 0
    ? quizScoredRows.reduce((sum, p) => sum + (p.quizBestScore || 0), 0) / quizScoredRows.length
    : 0;

  // Asset progress maps for resource tabs
  const audioProgressMap = getAssetProgressMap("audio");
  const audioCompletedCount = getAssetCompletedCount("audio");

  const slidesProgressMap = getAssetProgressMap("slides");
  const slidesCompletedCount = getAssetCompletedCount("slides");

  const infographicsProgressMap = getAssetProgressMap("infographic");
  const infographicsCompletedCount = getAssetCompletedCount("infographic");

  const mindmapsProgressMap = getAssetProgressMap("mindmap");
  const mindmapsCompletedCount = getAssetCompletedCount("mindmap");

  const flashcardsProgressMap = getAssetProgressMap("flashcard");
  const flashcardsCompletedCount = getAssetCompletedCount("flashcard");

  const briefingsProgressMap = getAssetProgressMap("briefing");
  const briefingsCompletedCount = getAssetCompletedCount("briefing");

  const factsProgressMap = getAssetProgressMap("statement-of-facts");
  const factsCompletedCount = getAssetCompletedCount("statement-of-facts");

  // Progress map for video resource content (needs videoCompleted)
  const videoProgressMap = Object.fromEntries(
    allPartProgress.map(p => [p.partNumber, {
      videoWatchPercent: p.videoWatchPercent,
      videoCompleted: p.status === "completed" || p.videoWatchPercent >= 85
    }])
  );

  // Progress map for quiz resource content
  const quizProgressMap = Object.fromEntries(
    allPartProgress.map(p => [p.partNumber, {
      quizCompleted: p.quizPassed || false,
      quizBestScore: p.quizBestScore,
      quizPassed: p.quizPassed || false,
      quizAttempts: p.quizAttempts || 0,
    }])
  );

  // Sequential lock: only Part 1 is freely accessible.
  // Every other part requires the previous part's quiz to be passed.
  const lockedPartNumbers = PARTS
    .filter((p) => {
      const n = p.partNumber;
      if (n === 1) return false;
      return !(progressMap[n - 1]?.quizPassed ?? false);
    })
    .map((p) => p.partNumber);

  // Show all parts (plan-locked parts are shown for upsell purposes)
  const accessibleParts = PARTS;

  // Get current part details — already in progressMap, no extra DB query needed.
  const currentPartData = PARTS.find(p => p.partNumber === currentPart);
  const currentPartProgress = progressMap[currentPart]?.videoWatchPercent ?? 0;

  const totalParts = accessibleParts.length;
  const completedCount = completedParts.length;
  // Only count fully-completed parts — partial video progress does NOT inflate the %
  const progressPercentage = completedCount > 0 ? Math.round((completedCount / totalParts) * 100) : 0;


  // Build serializable progress data for LessonsPathView (client component).
  // Re-uses openedAssetsMap already parsed above.
  const lessonsProgressData = Object.fromEntries(
    allPartProgress.map((p) => [
      p.partNumber,
      {
        status: p.status ?? "not_started",
        videoWatchPercent: p.videoWatchPercent ?? 0,
        briefingOpened: p.briefingOpened ?? false,
        quizPassed: p.quizPassed ?? false,
        quizBestScore: p.quizBestScore ?? null,
        quizAttempts: p.quizAttempts ?? 0,
        flashcardsReviewed: p.flashcardsReviewed ?? false,
        openedAssets: openedAssetsMap[p.partNumber] ?? [],
      },
    ])
  );

  // Era grouping — used by Home and Progress tabs (always shows all 100 parts).
  const partsByEra = accessibleParts.reduce((acc, part) => {
    const eraInfo = ERA_MAP[part.era as keyof typeof ERA_MAP];
    const era = eraInfo?.label || part.era;
    if (!acc[era]) {
      acc[era] = {
        label: era,
        description: getEraDescription(era),
        color: eraInfo?.color ?? "#8B6F45",
        parts: [],
        completedCount: 0,
        totalCount: 0,
      };
    }
    acc[era].parts.push(part);
    acc[era].totalCount++;
    if (completedParts.includes(part.partNumber)) {
      acc[era].completedCount++;
    }
    return acc;
  }, {} as Record<string, { label: string; description: string; color: string; parts: typeof PARTS; completedCount: number; totalCount: number }>);

  // Get user's first name for header
  // Show the active learner profile's name on the dashboard.
  // For family plans this will be "Ahmad", "Maryam" etc.
  // For individual plans it will be the account owner's first name.
  const userFirstName =
    user.activeProfileName ??
    user.fullName.split(" ")[0] ??
    user.email.split("@")[0];

  // Build stagesData for home dashboard
  const stagesData = Object.values(partsByEra).map((era, idx) => ({
    label: era.label,
    description: era.description,
    stageNumber: idx + 1,
    totalCount: era.totalCount,
    completedCount: era.completedCount,
    firstPartNumber: era.parts[0]?.partNumber ?? 1,
  }));

  // Determine which stage the currentPart belongs to
  const currentStageNumber = (() => {
    const eraArr = Object.values(partsByEra);
    for (let i = 0; i < eraArr.length; i++) {
      if (eraArr[i].parts.some((p) => p.partNumber === currentPart)) return i + 1;
    }
    return 1;
  })();

  // Parts with any real activity (for progress tab recent activity),
  // sorted by most recently accessed so the list reflects actual recency.
  const activeParts = allPartProgress
    .filter(p =>
      (p.videoWatchPercent > 0) ||
      p.briefingOpened ||
      (p.quizAttempts > 0) ||
      p.flashcardsReviewed
    )
    .sort((a, b) => {
      const ta = a.lastAccessedAt?.getTime() ?? 0;
      const tb = b.lastAccessedAt?.getTime() ?? 0;
      return tb - ta; // most recent first
    })
    .map(p => p.partNumber);

  // Title map for progress tab activity list
  const partTitleMap = Object.fromEntries(PARTS.map(p => [p.partNumber, p.title]));

  // Lessons content — client component handles path selector and filtering
  const lessonsContent = (
    <LessonsPathView
      parts={PARTS}
      progressData={lessonsProgressData}
      currentPart={currentPart}
    />
  );

  // StudentLayout is provided by app/seerah/layout.tsx — no wrapper needed here.
  return (
    <>
      {isPastDue && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-red-400 font-medium">
            ⚠️ Your last payment failed. Fix your card to keep access — your progress is safe.
          </p>
          <a
            href="/billing"
            className="text-xs font-bold text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors whitespace-nowrap"
          >
            Update payment →
          </a>
        </div>
      )}
    <CourseDashboardTabs
        homeContent={
          <CourseHomeContent 
            userPlan={userPlan} 
            completionPercentage={progressPercentage}
            completedLessons={completedCount}
            totalLessons={totalParts}
            userName={userFirstName}
            currentPart={currentPart}
            currentPartTitle={currentPartData?.title ?? "Getting Started"}
            currentPartSubtitle={currentPartData?.subtitle}
            currentPartVideoProgress={currentPartProgress}
            stagesData={stagesData}
            currentStageNumber={currentStageNumber}
          />
        }
        lessonsContent={lessonsContent}
        resourcesContent={
          <ResourcesTabs
            videosContent={
              <VideoResourceContent
                progressMap={videoProgressMap}
                completedCount={videoCompletedCount}
                inProgressCount={videoInProgressCount}
                continueWatching={videoContinueWatching}
                thumbnails={thumbnails}
                lockedPartNumbers={lockedPartNumbers}
              />
            }
            audioContent={
              <AudioResourceContent
                progressMap={audioProgressMap}
                completedCount={audioCompletedCount}
                thumbnails={thumbnails}
                lockedPartNumbers={lockedPartNumbers}
              />
            }
            briefingsContent={
              <TextResourceContent
                title="Briefings"
                description="Concise summaries of each lesson"
                resourceType="briefing"
                progressMap={briefingsProgressMap}
                completedCount={briefingsCompletedCount}
                thumbnails={thumbnails}
                lockedPartNumbers={lockedPartNumbers}
              />
            }
            slidesContent={
              <SimpleResourceContent
                title="Slides"
                description="Professional presentation decks in three formats: Presented, Detailed, and Facts"
                resourceType="slides"
                progressMap={slidesProgressMap}
                completedCount={slidesCompletedCount}
                actionLabel="View"
                statusLabel="Viewed"
                thumbnails={thumbnails}
                lockedPartNumbers={lockedPartNumbers}
              />
            }
            infographicsContent={
              <SimpleResourceContent
                title="Infographics"
                description="Visual summaries in three formats: Concise, Standard, and Bento Grid"
                resourceType="infographic"
                progressMap={infographicsProgressMap}
                completedCount={infographicsCompletedCount}
                actionLabel="View"
                statusLabel="Viewed"
                thumbnails={thumbnails}
                lockedPartNumbers={lockedPartNumbers}
              />
            }
            mindmapsContent={
              <SimpleResourceContent
                title="Mind Maps"
                description="Visual mind maps connecting people, places, and events throughout the Seerah"
                resourceType="mindmap"
                progressMap={mindmapsProgressMap}
                completedCount={mindmapsCompletedCount}
                actionLabel="View"
                statusLabel="Viewed"
                thumbnails={thumbnails}
                lockedPartNumbers={lockedPartNumbers}
              />
            }
            flashcardsContent={
              <SimpleResourceContent
                title="Flashcards"
                description="Interactive flashcards for spaced repetition learning across three difficulty levels"
                resourceType="flashcard"
                progressMap={flashcardsProgressMap}
                completedCount={flashcardsCompletedCount}
                actionLabel="Study"
                statusLabel="Studied"
                thumbnails={thumbnails}
                lockedPartNumbers={lockedPartNumbers}
              />
            }
            quizzesContent={
              <QuizResourceContent
                progressMap={quizProgressMap}
                videoProgressMap={videoProgressMap}
                completedCount={quizCompletedCount}
                passedCount={quizPassedCount}
                avgScore={quizAvgScore}
                totalAttempts={quizTotalAttempts}
                thumbnails={thumbnails}
                lockedPartNumbers={lockedPartNumbers}
              />
            }
            factsContent={
              <TextResourceContent
                title="Facts"
                description="Key facts and information from each lesson"
                resourceType="statement-of-facts"
                progressMap={factsProgressMap}
                completedCount={factsCompletedCount}
                thumbnails={thumbnails}
                lockedPartNumbers={lockedPartNumbers}
              />
            }
          />
        }
        progressContent={
          <CourseProgressContent 
            userPlan={userPlan}
            hasParentEmail={!!user.parentEmail && user.parentEmailVerified}
            parentEmail={user.parentEmail || undefined}
            studentName={user.studentName || undefined}
            sendWeeklyReports={user.sendWeeklyReports}
            completedLessons={completedCount}
            totalLessons={totalParts}
            progressPercentage={progressPercentage}
            currentPart={currentPart}
            stagesData={stagesData}
            quizAvgScore={quizAvgScore}
            quizTotalAttempts={quizTotalAttempts}
            activeParts={activeParts}
            partTitleMap={partTitleMap}
        />
      }
    />
    </>
  );
}

// Helper function to get era descriptions
function getEraDescription(era: string): string {
  const descriptions: Record<string, string> = {
    "Pre-Islamic Arabia": "Understand the world the Prophet ﷺ was sent to transform",
    "Birth & Early Life": "From his noble lineage to his character before prophethood",
    "Beginning of Revelation": "The first signs, the call to Islam, and early believers",
    "Makkah — Persecution": "See how early Muslims endured pressure, rejection, and sacrifice",
    "The Hijrah": "The migration that changed history and established a new society",
    "Madinah Period": "Building the first Islamic community and establishing the Ummah",
    "Major Campaigns": "The battles that defended Islam and shaped its expansion",
    "Final Years & Legacy": "The conquest of Makkah, Farewell Sermon, and the Prophet's ﷺ passing",
  };
  return descriptions[era] || "Journey through this important period";
}
