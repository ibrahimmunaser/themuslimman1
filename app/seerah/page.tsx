import { redirect } from "next/navigation";
import Link from "next/link";
import { requireStudent } from "@/lib/auth";
import { PARTS } from "@/lib/content";
import { ERA_MAP } from "@/lib/types";
import { ChevronRight, ChevronDown, Play, CheckCircle2, BookOpen, Lock, Clock, Video, FileText, Brain, ClipboardCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { StudentLayout } from "@/components/student/student-layout";
import { CourseDashboardTabs } from "@/components/course/course-dashboard-tabs";
import { CourseHomeContent } from "@/components/course/course-home-content";
import { CourseResourcesContent } from "@/components/course/course-resources-content";
import { CourseProgressContent } from "@/components/course/course-progress-content";

export const metadata = { title: "Seerah Masterclass" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LearnIndexPage() {
  const user = await requireStudent();
  if (!user.studentProfileId) redirect("/");

  // Check user's purchases
  const purchases = await prisma.purchase.findMany({
    where: {
      userId: user.id,
      status: "succeeded",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (purchases.length === 0) {
    redirect("/pricing");
  }

  // Get the highest tier plan purchased (complete > essentials)
  const hasCompletePlan = purchases.some(p => p.planId === "complete");
  const hasEssentialsPlan = purchases.some(p => p.planId === "essentials");
  const userPlan = hasCompletePlan ? "complete" : hasEssentialsPlan ? "essentials" : null;

  if (!userPlan) {
    redirect("/pricing");
  }

  const progress = await getProgress(user.id);
  const currentPart    = progress.currentPart    || 1;
  const completedParts = progress.completedParts  || [];
  const unlockedParts  = progress.unlockedParts   || [];
  const inProgressParts = progress.inProgressParts || [];

  // Per-part progress map for UI badges
  const allPartProgress = await prisma.partProgress.findMany({
    where: { userId: user.id },
    select: {
      partNumber:        true,
      status:            true,
      videoWatchPercent: true,
      briefingOpened:    true,
      quizPassed:        true,
      quizBestScore:     true,
    },
  });
  const progressMap = Object.fromEntries(
    allPartProgress.map(p => [p.partNumber, p])
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

  // Calculate progress (include partial progress of current lesson)
  // Only count parts included in the user's plan
  const partsInPlan = accessibleParts.filter(p => userPlan === "complete" || p.includedInEssentials);
  const totalParts = partsInPlan.length;
  const completedCount = completedParts.length;
  const partialProgress = currentPartProgress / 100; // Convert 60% to 0.6
  const totalProgress = completedCount + partialProgress;
  const progressPercentage = Math.round((totalProgress / totalParts) * 100);

  // Group all parts by era (including plan-locked for upsell)
  const partsByEra = accessibleParts.reduce((acc, part) => {
    const era = ERA_MAP[part.era as keyof typeof ERA_MAP]?.label || part.era;
    const isIncludedInUserPlan = userPlan === "complete" || part.includedInEssentials;
    
    if (!acc[era]) {
      acc[era] = {
        label: era,
        description: getEraDescription(era),
        parts: [],
        completedCount: 0,
        totalCount: 0,
        includedCount: 0,
      };
    }
    acc[era].parts.push(part);
    acc[era].totalCount++;
    if (isIncludedInUserPlan) {
      acc[era].includedCount++;
      if (completedParts.includes(part.partNumber)) {
        acc[era].completedCount++;
      }
    }
    return acc;
  }, {} as Record<string, { label: string; description: string; parts: typeof PARTS; completedCount: number; totalCount: number; includedCount: number }>);

  // Get part status with lock type distinction
  const getPartStatus = (partNumber: number) => {
    const part = PARTS.find(p => p.partNumber === partNumber);
    const isIncludedInPlan = userPlan === "complete" || part?.includedInEssentials;

    if (completedParts.includes(partNumber)) return "completed";
    if (inProgressParts.includes(partNumber)) return "in_progress";

    // Not included in user's plan - plan locked
    if (!isIncludedInPlan) return "plan_locked";

    // Part 1 is always available
    if (partNumber === 1) return "available";

    // Included in plan — check if previous accessible part is unlocked
    // Find the nearest previous part that is also in the user's plan
    const prevAccessiblePart = PARTS
      .filter(p => p.partNumber < partNumber && (userPlan === "complete" || p.includedInEssentials))
      .at(-1);

    if (!prevAccessiblePart) return "available"; // No predecessor → available

    // Unlock gate: previous part needs video>=85% + briefing opened
    if (unlockedParts.includes(prevAccessiblePart.partNumber)) return "available";

    return "progress_locked";
  };

  // Get the previous required lesson number for progress locks
  const getPreviousRequiredPart = (partNumber: number) => {
    // Find the previous part that is included in the user's plan
    const allParts = PARTS.filter(p => {
      if (userPlan === "complete") return p.partNumber < partNumber;
      return p.includedInEssentials && p.partNumber < partNumber;
    });
    
    if (allParts.length === 0) return null;
    return allParts[allParts.length - 1].partNumber;
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
                  {userPlan === "complete" ? "Seerah Masterclass" : "The Life of the Prophet ﷺ"}
                </h1>
                <p className="text-zinc-400 mt-2">
                  {userPlan === "complete" 
                    ? "Master the complete biography of Prophet Muhammad ﷺ through video lessons, quizzes, and interactive study tools"
                    : "Learn the Prophet's ﷺ life in order, understand the lessons, and remember the major events with guided review"
                  }
                </p>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium whitespace-nowrap">
                {userPlan === "complete" ? "Complete Access" : "Current Plan: Essentials"}
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
                  href={`/learn/part-${currentPart}`}
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
                  {userPlan === "complete" && (
                    <>
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-amber-500" />
                        <span>Review flashcards</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ClipboardCheck className="w-4 h-4 text-amber-500" />
                        <span>Complete the quiz</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-zinc-800">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-zinc-500" />
                    <span className="text-zinc-400">Estimated: <span className="text-white font-medium">{userPlan === "essentials" ? "10" : "25"} min</span></span>
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

          {/* Upgrade Banner for Essentials */}
          {userPlan === "essentials" && (
            <div className="mt-6 bg-gradient-to-br from-amber-500/5 to-amber-600/10 border border-amber-500/20 rounded-xl p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-amber-400 font-semibold mb-2">Unlock the Full Mastery System</p>
                  <p className="text-zinc-300 text-sm mb-2">
                    <span className="text-white font-medium">You have all 100 video lessons.</span> Upgrade to Complete Seerah to unlock the full mastery toolkit for every lesson.
                  </p>
                  <p className="text-zinc-400 text-xs mb-3">
                    Unlock slides, infographics, mind maps, flashcards, quizzes, reports, study guides, and statement of facts for all 100 parts.
                  </p>
                  <ul className="space-y-1 text-xs text-zinc-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                      3 slide formats & 3 infographic formats for teaching
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                      Mind maps for visual learning & connections
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                      Easy/Medium/Hard flashcards for retention
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                      Quizzes, reports, study guides & statement of facts
                    </li>
                  </ul>
                  <p className="text-amber-400 text-sm font-semibold mt-3">
                    Upgrade for just $30
                  </p>
                </div>
                <Link 
                  href="/pricing"
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg transition-colors whitespace-nowrap flex-shrink-0"
                >
                  Upgrade Now
                </Link>
              </div>
            </div>
          )}
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
                            <span>{era.includedCount} lessons</span>
                            {userPlan === "essentials" && era.totalCount > era.includedCount && (
                              <>
                                <span>•</span>
                                <span className="text-amber-500/70">{era.totalCount - era.includedCount} locked</span>
                              </>
                            )}
                            <span>•</span>
                            <span>{era.completedCount} of {era.includedCount} completed</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-semibold text-white">
                            {era.includedCount > 0 ? Math.round((era.completedCount / era.includedCount) * 100) : 0}%
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
                    const isProgressLocked = status === "progress_locked";
                    const isPlanLocked = status === "plan_locked";
                    const isCompleted = status === "completed";
                    const isInProgress = status === "in_progress";
                    const previousPart = isProgressLocked ? getPreviousRequiredPart(part.partNumber) : null;
                    const pProgress = progressMap[part.partNumber];
                    const dbStatus = pProgress?.status ?? "not_started";
                    const isMastered = dbStatus === "mastered";

                    if (isProgressLocked || isPlanLocked) {
                      return (
                        <div
                          key={part.id}
                          className="group block p-4 rounded-xl border transition-all bg-zinc-900/30 border-zinc-800/50 cursor-not-allowed"
                        >
                        <div className="flex items-center gap-4">
                          {/* Icon */}
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-zinc-800 border border-zinc-700">
                            <Lock className="w-5 h-5 text-zinc-600" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-zinc-600">
                                Part {part.partNumber}
                              </span>
                            </div>
                            <p className="font-medium mb-1 truncate text-zinc-600">
                              {part.title}
                            </p>
                            {part.subtitle && (
                              <p className="text-sm text-zinc-600 truncate mb-2">
                                {part.subtitle}
                              </p>
                            )}

                            {/* Locked Message */}
                            {isProgressLocked ? (
                              <p className="text-xs text-zinc-500">
                                🔒 {previousPart ? `Watch Part ${previousPart} (85%+) and read the briefing to unlock` : "Complete the previous lesson to unlock"}
                              </p>
                            ) : (
                              <div>
                                <p className="text-xs text-amber-500/80 font-medium mb-0.5">
                                  Complete Seerah Only
                                </p>
                                <p className="text-xs text-zinc-600">
                                  Unlock Complete Seerah to access this lesson
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      );
                    }

                    return (
                      <Link
                        key={part.id}
                        href={`/learn/part-${part.partNumber}`}
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
                            <div className="flex items-center gap-3 text-xs text-zinc-400">
                              {/* Video */}
                              <div className={`flex items-center gap-1 ${pProgress?.videoWatchPercent >= 85 ? "text-green-400" : ""}`}>
                                <Video className="w-3.5 h-3.5" />
                                <span>{pProgress?.videoWatchPercent > 0 ? `${pProgress.videoWatchPercent}%` : "Video"}</span>
                              </div>
                              {/* Briefing */}
                              <div className={`flex items-center gap-1 ${pProgress?.briefingOpened ? "text-green-400" : ""}`}>
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>Briefing{pProgress?.briefingOpened ? " ✓" : ""}</span>
                              </div>
                              {/* Quiz — Complete users only */}
                              {userPlan === "complete" && (
                                <div className={`flex items-center gap-1 ${pProgress?.quizPassed ? "text-green-400" : ""}`}>
                                  <ClipboardCheck className="w-3.5 h-3.5" />
                                  <span>
                                    {pProgress?.quizBestScore != null
                                      ? `Quiz ${pProgress.quizBestScore}%${pProgress.quizPassed ? " ✓" : ""}`
                                      : "Quiz"}
                                  </span>
                                </div>
                              )}
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
        resourcesContent={<CourseResourcesContent userPlan={userPlan} />}
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
