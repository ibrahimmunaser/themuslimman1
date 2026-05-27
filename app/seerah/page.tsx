import { redirect } from "next/navigation";
import Link from "next/link";
import { requireStudent } from "@/lib/auth";
import { hasActiveCourseAccess } from "@/lib/access";
import { PARTS } from "@/lib/content";
import { getThumbnailUrls } from "@/lib/r2";
import { getPartPageData } from "@/lib/part-content-cache";
import { ERA_MAP } from "@/lib/types";
import { ChevronRight, ChevronDown, Play, CheckCircle2, BookOpen, Clock, Video, FileText, Brain, ClipboardCheck, Headphones, Map, Image, Layers, BarChart2, GraduationCap } from "lucide-react";
import { prisma } from "@/lib/db";
import { StudentLayout } from "@/components/student/student-layout";
import { CourseDashboardTabs } from "@/components/course/course-dashboard-tabs";
import { CourseHomeContent } from "@/components/course/course-home-content";
import { CourseProgressContent } from "@/components/course/course-progress-content";
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
  const user = await requireStudent();
  if (!user.studentProfileId) redirect("/");

  // Lifetime purchase OR active monthly subscription grants access
  const hasAccess = await hasActiveCourseAccess(user.id);
  if (!hasAccess) {
    redirect("/pricing");
  }

  const userPlan = "complete" as const;

  const [progress, thumbnails] = await Promise.all([
    getProgress(user.id),
    getThumbnailUrls(PARTS.map((p) => p.partNumber)),
  ]);
  const currentPart    = progress.currentPart    || 1;
  const completedParts = progress.completedParts  || [];
  const unlockedParts  = progress.unlockedParts   || [];
  const inProgressParts = progress.inProgressParts || [];

  // Proactively warm the user's current part so clicking "Continue" / "Start stage"
  // hits a hot cache instead of waiting for cold R2 fetches.
  getPartPageData(currentPart).catch(() => {});

  // Per-part progress map for UI badges
  const allPartProgress = await prisma.partProgress.findMany({
    where: { userId: user.id },
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
    },
  });
  const progressMap = Object.fromEntries(
    allPartProgress.map(p => [p.partNumber, p])
  );

  // Helper functions for resource progress tracking
  const getAssetProgressMap = (assetType: string) => {
    return Object.fromEntries(
      allPartProgress.map((p) => {
        try {
          const openedAssets = p.openedAssets ? JSON.parse(p.openedAssets as string) : [];
          return [p.partNumber, openedAssets.includes(assetType)];
        } catch {
          return [p.partNumber, false];
        }
      })
    );
  };

  const getAssetCompletedCount = (assetType: string) => {
    return allPartProgress.filter((p) => {
      try {
        const openedAssets = p.openedAssets ? JSON.parse(p.openedAssets as string) : [];
        return openedAssets.includes(assetType);
      } catch {
        return false;
      }
    }).length;
  };

  // Video stats for resource tabs
  const videoCompletedCount = allPartProgress.filter((p) => p.status === "completed" || p.videoWatchPercent >= 85).length;
  const videoInProgressCount = allPartProgress.filter(
    (p) => p.videoWatchPercent > 0 && p.videoWatchPercent < 85 && p.status !== "completed"
  ).length;
  const videoContinueWatching = allPartProgress
    .filter((p) => p.videoWatchPercent > 0 && p.videoWatchPercent < 85 && p.status !== "completed")
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

  // Show all parts (plan-locked parts are shown for upsell purposes)
  const accessibleParts = PARTS;

  // Get current part details
  const currentPartData = PARTS.find(p => p.partNumber === currentPart);
  
  // Get actual progress for current part
  const currentPartProgressRecord = await prisma.partProgress.findUnique({
    where: { userId_partNumber: { userId: user.id, partNumber: currentPart } },
    select: { videoWatchPercent: true },
  });
  const currentPartProgress = currentPartProgressRecord?.videoWatchPercent || 0;

  const totalParts = accessibleParts.length;
  const completedCount = completedParts.length;
  // Only count fully-completed parts — partial video progress does NOT inflate the %
  const progressPercentage = completedCount > 0 ? Math.round((completedCount / totalParts) * 100) : 0;

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

  // All parts are available for paid users — progress is a guide, not a gate
  const getPartStatus = (partNumber: number) => {
    if (completedParts.includes(partNumber)) return "completed";
    // Only flag as in_progress if there is REAL activity, not just a DB record existing
    const p = progressMap[partNumber];
    const hasActivity = p && (
      (p.videoWatchPercent > 0) ||
      p.briefingOpened ||
      (p.quizAttempts > 0) ||
      p.flashcardsReviewed
    );
    if (hasActivity) return "in_progress";
    return "not_started";
  };

  // Get user's first name for header
  const userFirstName = user.fullName.split(" ")[0];

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

  // Parts with any real activity (for progress tab recent activity)
  const activeParts = allPartProgress
    .filter(p =>
      (p.videoWatchPercent > 0) ||
      p.briefingOpened ||
      (p.quizAttempts > 0) ||
      p.flashcardsReviewed
    )
    .map(p => p.partNumber)
    .sort((a, b) => a - b);

  // Title map for progress tab activity list
  const partTitleMap = Object.fromEntries(PARTS.map(p => [p.partNumber, p.title]));

  // Helper: asset indicator row for each lesson card
  function partAssetBadges(p: typeof progressMap[number] | undefined) {
    let opened: string[] = [];
    try { opened = JSON.parse((p?.openedAssets as string) ?? "[]"); } catch {}
    const vp = p?.videoWatchPercent ?? 0;
    const assets = [
      { key: "video",       label: vp >= 85 ? "✓ Video" : vp > 0 ? `Video ${vp}%` : "Video",                               done: vp >= 85,              partial: vp > 0 && vp < 85 },
      { key: "briefing",    label: p?.briefingOpened        ? "✓ Briefing"    : "Briefing",                                   done: !!p?.briefingOpened,   partial: false },
      { key: "slides",      label: opened.includes("slides")    ? "✓ Slides"      : "Slides",                                done: opened.includes("slides"),    partial: false },
      { key: "audio",       label: opened.includes("audio")     ? "✓ Audio"       : "Audio",                                 done: opened.includes("audio"),     partial: false },
      { key: "mindmap",     label: opened.includes("mindmap")   ? "✓ Mind Map"    : "Mind Map",                              done: opened.includes("mindmap"),   partial: false },
      { key: "infographic", label: opened.includes("infographic") ? "✓ Infographic" : "Infographic",                         done: opened.includes("infographic"), partial: false },
      { key: "flashcards",  label: p?.flashcardsReviewed    ? "✓ Flashcards"  : "Flashcards",                                done: !!p?.flashcardsReviewed, partial: false },
      { key: "quiz",        label: p?.quizPassed ? `✓ Quiz ${p.quizBestScore}%` : p?.quizBestScore ? `Quiz ${p.quizBestScore}%` : "Quiz", done: !!p?.quizPassed, partial: !!(p?.quizBestScore && !p?.quizPassed) },
    ];
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs hidden sm:flex">
        {assets.map((a, i) => (
          <span key={a.key} className={a.done ? "text-green-400" : a.partial ? "text-amber-400" : "text-zinc-600"}>
            {a.label}{i < assets.length - 1 ? <span className="ml-3 text-zinc-700">·</span> : null}
          </span>
        ))}
      </div>
    );
  }

  // Lessons content
  const lessonsContent = (
    <div className="min-h-screen bg-[#0a0a0a]">

      {/* Course Hero */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Lessons Header */}
          <div className="mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Lessons</h1>
            <p className="text-zinc-400 text-sm mt-1">Browse all 100 lessons. All parts are unlocked.</p>
          </div>







        </div>
      </div>

      {/* Chapters */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Course Roadmap</h2>
          <p className="text-zinc-400 text-sm">
            The life of Prophet Muhammad ﷺ in eight stages — from pre-Islamic Arabia to his final days.
            All parts are unlocked. The course is arranged chronologically so each part adds context to the next.
          </p>
        </div>

        <div className="space-y-4">
          {Object.entries(partsByEra).map(([eraKey, era]) => {
            const allCompleted = era.completedCount === era.totalCount;
            const inProgress = era.completedCount > 0 && era.completedCount < era.totalCount;
            const hasCurrentPart = era.parts.some(p => p.partNumber === currentPart);
            const eraPercent = era.totalCount > 0 ? Math.round((era.completedCount / era.totalCount) * 100) : 0;

            return (
              <details key={eraKey} className="group" open={hasCurrentPart}>
                <summary className="cursor-pointer list-none">
                  <div className="bg-zinc-900/50 rounded-xl p-5 transition-colors border" style={{ borderColor: `${era.color}40` }}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          allCompleted ? "bg-green-500/10 border border-green-500/20" : ""
                        }`} style={!allCompleted ? { backgroundColor: `${era.color}18`, border: `1px solid ${era.color}40` } : {}}>
                          {allCompleted ? (
                            <CheckCircle2 className="w-6 h-6 text-green-400" />
                          ) : (
                            <BookOpen className="w-6 h-6" style={{ color: era.color }} />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <h3 className="text-base sm:text-lg font-semibold truncate min-w-0" style={{ color: era.color }}>{era.label}</h3>
                            {allCompleted && (
                              <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium rounded">
                                Completed
                              </span>
                            )}
                            {inProgress && !allCompleted && (
                              <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium rounded">
                                In Progress
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-zinc-400 mb-3">{era.description}</p>
                          {/* Era progress bar */}
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden max-w-[180px]">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  allCompleted ? "bg-green-500" : "bg-amber-500"
                                }`}
                                style={{ width: `${eraPercent}%` }}
                              />
                            </div>
                            <span className="text-xs text-zinc-500">
                              {era.completedCount}/{era.totalCount} parts
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <div className={`text-sm font-bold tabular-nums ${allCompleted ? "text-green-400" : inProgress ? "text-amber-400" : "text-zinc-600"}`}>
                          {eraPercent}%
                        </div>
                        <ChevronDown className="w-5 h-5 text-zinc-500 group-open:rotate-180 transition-transform flex-shrink-0" />
                      </div>
                    </div>
                  </div>
                </summary>

                {/* Chapter lessons */}
                <div className="mt-3 ml-4 pl-4 border-l-2" style={{ borderColor: `${era.color}50` }}>
                  <div className="space-y-2">
                  {era.parts.slice(0, 5).map((part) => {
                    const status = getPartStatus(part.partNumber);
                    const isCompleted = status === "completed";
                    const isInProgress = status === "in_progress";
                    const pProgress = progressMap[part.partNumber];
                    const dbStatus = pProgress?.status ?? "not_started";
                    const isMastered = dbStatus === "mastered";

                    return (
                      <Link
                        key={part.id}
                        href={`/seerah/part-${part.partNumber}`}
                        className="group block p-4 rounded-xl border transition-all bg-zinc-900/50 border-zinc-800 hover:border-amber-500/30 hover:bg-zinc-900"
                      >
                        <div className="flex items-center gap-4">
                          {/* Icon */}
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isMastered   ? "bg-yellow-500/15 border border-yellow-500/30" :
                            isCompleted  ? "bg-green-500/10  border border-green-500/20"  :
                            isInProgress ? "bg-amber-500/10  border border-amber-500/20"  :
                            "bg-zinc-800 border border-zinc-700"
                          }`}>
                            {isMastered ? (
                              <span className="text-base">✦</span>
                            ) : isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-green-400" />
                            ) : (
                              <Play className={`w-5 h-5 ${isInProgress ? "text-amber-500" : "text-zinc-500"}`} />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-amber-500">
                                Part {part.partNumber}
                              </span>
                              {isMastered && (
                                <span className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/25 text-yellow-400 text-xs font-semibold rounded">
                                  Mastered
                                </span>
                              )}
                              {isCompleted && !isMastered && (
                                <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium rounded">
                                  Completed
                                </span>
                              )}
                              {isInProgress && (
                                <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium rounded">
                                  In Progress
                                </span>
                              )}
                            </div>
                            <p className="font-medium mb-1 truncate text-white group-hover:text-amber-400">
                              {part.title}
                            </p>
                            {part.subtitle && (
                              <p className="text-sm text-zinc-500 truncate mb-2">
                                {part.subtitle}
                              </p>
                            )}

                            {/* Resources — green=done, amber=in-progress, zinc=untouched */}
                            {partAssetBadges(pProgress)}
                          </div>

                          <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-amber-500 transition-colors flex-shrink-0" />
                        </div>
                      </Link>
                    );
                  })}
                  </div>
                  {era.parts.length > 5 && (
                    <div className="space-y-2 mt-2">
                        {era.parts.slice(5).map((part) => {
                          const status = getPartStatus(part.partNumber);
                          const isCompleted2 = status === "completed";
                          const isInProgress2 = status === "in_progress";
                          const pProgress2 = progressMap[part.partNumber];
                          const isMastered2 = (pProgress2?.status ?? "") === "mastered";
                          return (
                            <Link
                              key={part.id}
                              href={`/seerah/part-${part.partNumber}`}
                              className="group block p-4 rounded-xl border transition-all bg-zinc-900/50 border-zinc-800 hover:border-amber-500/30 hover:bg-zinc-900"
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  isMastered2   ? "bg-yellow-500/15 border border-yellow-500/30" :
                                  isCompleted2  ? "bg-green-500/10  border border-green-500/20"  :
                                  isInProgress2 ? "bg-amber-500/10  border border-amber-500/20"  :
                                  "bg-zinc-800 border border-zinc-700"
                                }`}>
                                  {isMastered2 ? <span className="text-base">✦</span> : isCompleted2 ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Play className={`w-5 h-5 ${isInProgress2 ? "text-amber-500" : "text-zinc-500"}`} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-amber-500">Part {part.partNumber}</span>
                                    {isCompleted2 && !isMastered2 && <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium rounded">Completed</span>}
                                    {isInProgress2 && <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium rounded">In Progress</span>}
                                  </div>
                                  <p className="font-medium mb-0.5 truncate text-white group-hover:text-amber-400">{part.title}</p>
                                  {part.subtitle && <p className="text-sm text-zinc-500 truncate mb-1">{part.subtitle}</p>}
                                  {partAssetBadges(pProgress2)}
                                </div>
                                <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-amber-500 transition-colors flex-shrink-0" />
                              </div>
                            </Link>
                          );
                        })}
                    </div>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <StudentLayout userPlan={userPlan} userName={user.fullName}>
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
              />
            }
            audioContent={
              <AudioResourceContent
                progressMap={audioProgressMap}
                completedCount={audioCompletedCount}
                thumbnails={thumbnails}
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
              />
            }
            quizzesContent={
              <QuizResourceContent
                progressMap={quizProgressMap}
                completedCount={quizCompletedCount}
                passedCount={quizPassedCount}
                avgScore={quizAvgScore}
                totalAttempts={quizTotalAttempts}
                thumbnails={thumbnails}
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
    </StudentLayout>
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

// Get real progress from database
async function getProgress(userId: string) {
  const partProgress = await prisma.partProgress.findMany({
    where: { userId },
    orderBy: { partNumber: 'asc' },
    select: {
      partNumber:        true,
      status:            true,
      videoWatchPercent: true,
      briefingOpened:    true,
    },
  });

  // A part is "unlocked-next" (can proceed past it) when video>=85% + briefing opened
  // A part is "completed" per DB status field (set by recomputeAndSave server action)
  const completedParts = partProgress
    .filter(p => p.status === 'completed' || p.status === 'mastered')
    .map(p => p.partNumber);

  const unlockedParts = partProgress
    .filter(p => p.videoWatchPercent >= 85 && p.briefingOpened)
    .map(p => p.partNumber);

  const startedParts = partProgress
    .filter(p => p.status === 'started' || p.status === 'in_progress')
    .map(p => p.partNumber);

  // Current part: lowest started/in-progress part, else highest unlocked+1, else 1
  const currentPart = startedParts.length > 0
    ? Math.min(...startedParts)
    : (unlockedParts.length > 0 ? Math.max(...unlockedParts) + 1 : 1);

  return {
    currentPart,
    completedParts,
    unlockedParts, // video>=85 + briefing: used for unlock gate
    inProgressParts: startedParts,
  };
}
