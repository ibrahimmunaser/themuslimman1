import { redirect } from "next/navigation";
import Link from "next/link";
import { requireStudent } from "@/lib/auth";
import { PARTS } from "@/lib/content";
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

export const metadata = { title: "Seerah Masterclass" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LearnIndexPage() {
  const user = await requireStudent();
  if (!user.studentProfileId) redirect("/");

  // Any succeeded purchase grants full access
  const purchase = await prisma.purchase.findFirst({
    where: { userId: user.id, status: "succeeded" },
  });

  if (!purchase) {
    redirect("/pricing");
  }

  const userPlan = "complete" as const;

  const progress = await getProgress(user.id);
  const currentPart    = progress.currentPart    || 1;
  const completedParts = progress.completedParts  || [];
  const unlockedParts  = progress.unlockedParts   || [];
  const inProgressParts = progress.inProgressParts || [];

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
  const quizAvgScore = quizCompletedCount > 0
    ? allPartProgress.reduce((sum, p) => sum + (p.quizBestScore || 0), 0) / quizCompletedCount
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
  const partialProgress = currentPartProgress / 100; // Convert 60% to 0.6
  const totalProgress = completedCount + partialProgress;
  const progressPercentage = Math.round((totalProgress / totalParts) * 100);

  const partsByEra = accessibleParts.reduce((acc, part) => {
    const era = ERA_MAP[part.era as keyof typeof ERA_MAP]?.label || part.era;
    if (!acc[era]) {
      acc[era] = {
        label: era,
        description: getEraDescription(era),
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
  }, {} as Record<string, { label: string; description: string; parts: typeof PARTS; completedCount: number; totalCount: number }>);

  // All parts are available for paid users — progress is a guide, not a gate
  const getPartStatus = (partNumber: number) => {
    if (completedParts.includes(partNumber)) return "completed";
    if (inProgressParts.includes(partNumber)) return "in_progress";
    return "available";
  };

  // Get user's first name for header
  const userFirstName = user.fullName.split(" ")[0];

  // Lessons content
  const lessonsContent = (
    <div className="min-h-screen bg-[#0a0a0a]">

      {/* Course Hero */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Back Section */}
          <div className="mb-6">
            <p className="text-zinc-400 text-sm mb-2">Welcome back, {user.fullName}</p>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white">
                  Seerah Masterclass
                </h1>
                <p className="text-zinc-400 mt-2">
                  Master the complete biography of Prophet Muhammad ﷺ through video lessons, quizzes, and interactive study tools
                </p>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium whitespace-nowrap">
                Complete Access
              </div>
            </div>
          </div>

          {/* Continue Learning Block */}
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-2xl p-6 mb-6">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <p className="text-amber-400 text-sm font-medium mb-2">Continue where you left off</p>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Part {currentPart}: {currentPartData?.title || "Getting Started"}
                </h3>
                <p className="text-zinc-400 text-sm mb-4">
                  {currentPartData?.subtitle}
                </p>
                
                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-zinc-400">Lesson progress</span>
                    <span className="text-xs text-amber-400 font-medium">{currentPartProgress}% complete</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-300"
                      style={{ width: `${currentPartProgress}%` }}
                    />
                  </div>
                </div>

                <Link 
                  href={`/seerah/part-${currentPart}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Continue Lesson
                </Link>
              </div>

              {/* Today's Goal */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 min-w-[240px]">
                <p className="text-sm font-medium text-white mb-1">Today's Goal for Part {currentPart}</p>
                <p className="text-xs text-zinc-500 mb-3">Complete this lesson today</p>
                <div className="space-y-2 text-sm text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-amber-500" />
                    <span>Watch the video</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-500" />
                    <span>Read the briefing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-amber-500" />
                    <span>Review flashcards</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-amber-500" />
                    <span>Complete the quiz</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-zinc-800">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-zinc-500" />
                    <span className="text-zinc-400">Estimated: <span className="text-white font-medium">25 min</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Course Progress */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">Course Progress</h3>
              <span className="text-2xl font-bold text-amber-500">{progressPercentage}%</span>
            </div>
            <div className="h-3 bg-zinc-800 rounded-full overflow-hidden mb-3">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-amber-600"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-zinc-400">
                {completedCount} of {totalParts} lessons completed
              </p>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              💡 Recommended: Complete lessons in order. Each part builds on the previous one.
            </p>
          </div>

        </div>
      </div>

      {/* Chapters */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Chapters</h2>
          <p className="text-zinc-400 text-sm">
            Explore the life of Prophet Muhammad ﷺ chronologically, from pre-Islamic Arabia to his final days
          </p>
        </div>

        <div className="space-y-4">
          {Object.entries(partsByEra).map(([eraKey, era]) => {
            const allCompleted = era.completedCount === era.totalCount;
            const inProgress = era.completedCount > 0 && era.completedCount < era.totalCount;
            const hasCurrentPart = era.parts.some(p => p.partNumber === currentPart);

            return (
              <details key={eraKey} className="group" open={hasCurrentPart || inProgress}>
                <summary className="cursor-pointer list-none">
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          allCompleted ? "bg-green-500/10 border border-green-500/20" :
                          inProgress ? "bg-amber-500/10 border border-amber-500/20" :
                          "bg-zinc-800 border border-zinc-700"
                        }`}>
                          {allCompleted ? (
                            <CheckCircle2 className="w-6 h-6 text-green-400" />
                          ) : (
                            <BookOpen className={`w-6 h-6 ${inProgress ? "text-amber-500" : "text-zinc-500"}`} />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-semibold text-white">{era.label}</h3>
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
                          <p className="text-sm text-zinc-400 mb-2">{era.description}</p>
                          <div className="flex items-center gap-4 text-xs text-zinc-500">
                            <span>{era.totalCount} lessons</span>
                            <span>•</span>
                            <span>{era.completedCount} of {era.totalCount} completed</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-semibold text-white">
                            {era.totalCount > 0 ? Math.round((era.completedCount / era.totalCount) * 100) : 0}%
                          </div>
                        </div>
                        <ChevronDown className="w-5 h-5 text-zinc-500 group-open:rotate-180 transition-transform" />
                      </div>
                    </div>
                  </div>
                </summary>

                {/* Chapter lessons */}
                <div className="mt-3 ml-4 pl-4 border-l-2 border-zinc-800 space-y-2">
                  {era.parts.map((part) => {
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

                            {/* Progress indicators */}
                            <div className="flex items-center gap-3 text-xs text-zinc-400 flex-wrap">
                              {/* Video */}
                              <div className={`flex items-center gap-1 ${pProgress?.videoWatchPercent >= 85 ? "text-green-400" : ""}`}>
                                <Video className="w-3.5 h-3.5" />
                                <span>{pProgress?.videoWatchPercent > 0 ? `${pProgress.videoWatchPercent}%` : "—"}</span>
                              </div>
                              {/* Audio */}
                              {(() => {
                                const opened = pProgress?.openedAssets ? JSON.parse(pProgress.openedAssets) : [];
                                const hasAudio = opened.includes("audio");
                                return (
                                  <div className={`flex items-center gap-1 ${hasAudio ? "text-green-400" : ""}`}>
                                    <Headphones className="w-3.5 h-3.5" />
                                    <span>{hasAudio ? "✓" : "—"}</span>
                                  </div>
                                );
                              })()}
                              {/* Briefing */}
                              <div className={`flex items-center gap-1 ${pProgress?.briefingOpened ? "text-green-400" : ""}`}>
                                <FileText className="w-3.5 h-3.5" />
                                <span>{pProgress?.briefingOpened ? "✓" : "—"}</span>
                              </div>
                              {/* Study Guide */}
                              {(() => {
                                const opened = pProgress?.openedAssets ? JSON.parse(pProgress.openedAssets) : [];
                                const hasGuide = opened.includes("study_guide");
                                return (
                                  <div className={`flex items-center gap-1 ${hasGuide ? "text-green-400" : ""}`}>
                                    <GraduationCap className="w-3.5 h-3.5" />
                                    <span>{hasGuide ? "✓" : "—"}</span>
                                  </div>
                                );
                              })()}
                              {/* Facts */}
                              {(() => {
                                const opened = pProgress?.openedAssets ? JSON.parse(pProgress.openedAssets) : [];
                                const hasFacts = opened.includes("facts");
                                return (
                                  <div className={`flex items-center gap-1 ${hasFacts ? "text-green-400" : ""}`}>
                                    <BarChart2 className="w-3.5 h-3.5" />
                                    <span>{hasFacts ? "✓" : "—"}</span>
                                  </div>
                                );
                              })()}
                              {/* Report */}
                              {(() => {
                                const opened = pProgress?.openedAssets ? JSON.parse(pProgress.openedAssets) : [];
                                const hasReport = opened.includes("report");
                                return (
                                  <div className={`flex items-center gap-1 ${hasReport ? "text-green-400" : ""}`}>
                                    <BookOpen className="w-3.5 h-3.5" />
                                    <span>{hasReport ? "✓" : "—"}</span>
                                  </div>
                                );
                              })()}
                              {/* Slides */}
                              {(() => {
                                const opened = pProgress?.openedAssets ? JSON.parse(pProgress.openedAssets) : [];
                                const hasSlides = opened.includes("slides");
                                return (
                                  <div className={`flex items-center gap-1 ${hasSlides ? "text-green-400" : ""}`}>
                                    <Layers className="w-3.5 h-3.5" />
                                    <span>{hasSlides ? "✓" : "—"}</span>
                                  </div>
                                );
                              })()}
                              {/* Mindmap */}
                              {(() => {
                                const opened = pProgress?.openedAssets ? JSON.parse(pProgress.openedAssets) : [];
                                const hasMindmap = opened.includes("mindmap");
                                return (
                                  <div className={`flex items-center gap-1 ${hasMindmap ? "text-green-400" : ""}`}>
                                    <Map className="w-3.5 h-3.5" />
                                    <span>{hasMindmap ? "✓" : "—"}</span>
                                  </div>
                                );
                              })()}
                              {/* Infographic */}
                              {(() => {
                                const opened = pProgress?.openedAssets ? JSON.parse(pProgress.openedAssets) : [];
                                const hasInfographic = opened.includes("infographic");
                                return (
                                  <div className={`flex items-center gap-1 ${hasInfographic ? "text-green-400" : ""}`}>
                                    <Image className="w-3.5 h-3.5" />
                                    <span>{hasInfographic ? "✓" : "—"}</span>
                                  </div>
                                );
                              })()}
                              {/* Flashcards */}
                              <div className={`flex items-center gap-1 ${pProgress?.flashcardsReviewed ? "text-green-400" : ""}`}>
                                <Brain className="w-3.5 h-3.5" />
                                <span>{pProgress?.flashcardsReviewed ? "✓" : "—"}</span>
                              </div>
                              {/* Quiz */}
                              <div className={`flex items-center gap-1 ${pProgress?.quizPassed ? "text-green-400" : ""}`}>
                                <ClipboardCheck className="w-3.5 h-3.5" />
                                <span>
                                  {pProgress?.quizBestScore != null
                                    ? `${pProgress.quizBestScore}%${pProgress.quizPassed ? " ✓" : ""}`
                                    : "—"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-amber-500 transition-colors flex-shrink-0" />
                        </div>
                      </Link>
                    );
                  })}
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
              />
            }
            audioContent={
              <AudioResourceContent
                progressMap={audioProgressMap}
                completedCount={audioCompletedCount}
              />
            }
            briefingsContent={
              <TextResourceContent
                title="Briefings"
                description="Concise summaries of each lesson"
                resourceType="briefing"
                progressMap={briefingsProgressMap}
                completedCount={briefingsCompletedCount}
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
              />
            }
            quizzesContent={
              <QuizResourceContent
                progressMap={quizProgressMap}
                completedCount={quizCompletedCount}
                passedCount={quizPassedCount}
                avgScore={quizAvgScore}
                totalAttempts={quizTotalAttempts}
              />
            }
            factsContent={
              <TextResourceContent
                title="Facts"
                description="Key facts and information from each lesson"
                resourceType="statement-of-facts"
                progressMap={factsProgressMap}
                completedCount={factsCompletedCount}
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
