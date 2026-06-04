"use client";

import { useState, useEffect, useCallback } from "react";
import { PARTS } from "@/lib/content";
import { ERA_MAP, type Part } from "@/lib/types";
import { eraGradient } from "./era-gradient";
import { ResourcePageClient } from "./resource-page-client";
import { ClipboardCheck, Trophy, CheckCircle2, XCircle, X, Lock } from "lucide-react";
import { QuizViewer } from "@/components/part/quiz-viewer";
import type { Quiz } from "@/lib/types";
import { trackAssetOpened } from "@/app/actions/progress";
import { getCachedResource, setCachedResource, prefetchResource } from "@/lib/resource-cache";

interface QuizResourceContentProps {
  progressMap: Record<number, {
    quizCompleted: boolean;
    quizBestScore: number | null;
    quizPassed: boolean;
    quizAttempts: number;
  }>;
  /** Video progress map — quiz is locked until video reaches 85% */
  videoProgressMap?: Record<number, { videoWatchPercent: number; videoCompleted: boolean }>;
  completedCount: number;
  passedCount: number;
  avgScore: number;
  totalAttempts: number;
  thumbnails?: Record<number, string>;
  lockedPartNumbers?: number[];
}

export function QuizResourceContent({
  progressMap,
  videoProgressMap = {},
  completedCount,
  passedCount,
  avgScore,
  totalAttempts,
  thumbnails = {},
  lockedPartNumbers = [],
}: QuizResourceContentProps) {
  const lockedSet = new Set(lockedPartNumbers);
  const totalQuizzes = PARTS.length;
  const _notAttemptedCount = totalQuizzes - completedCount;

  // Modal state
  const [selectedPart, setSelectedPart] = useState<typeof PARTS[0] | null>(null);
  const [quizData, setQuizData] = useState<Quiz | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Body scroll lock
  useEffect(() => {
    if (selectedPart && mounted) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [selectedPart, mounted]);

  // Prefetch quiz data on hover
  const handlePrefetch = useCallback((partId: string) => {
    prefetchResource("quiz", partId);
  }, []);

  const handleOpenQuiz = async (part: typeof PARTS[0]) => {
    // Mirror the part page: quiz is locked until video reaches 85%
    const videoProgress = videoProgressMap[part.partNumber];
    const videoCompleted = videoProgress?.videoCompleted || (videoProgress?.videoWatchPercent ?? 0) >= 85;
    if (!videoCompleted) {
      alert(`Watch the Part ${part.partNumber} video to at least 85% before taking the quiz.`);
      return;
    }

    setSelectedPart(part);

    // Check cache first
    const cacheKey = `quiz-${part.id}`;
    const cached = getCachedResource<Quiz>(cacheKey);
    
    if (cached) {
      setQuizData(cached);
      await trackAssetOpened(part.partNumber, "quiz");
      return;
    }
    
    setIsLoadingQuiz(true);
    setQuizData(null);

    try {
      // Track asset opened
      await trackAssetOpened(part.partNumber, "quiz");

      const response = await fetch(`/api/quiz/${part.id}`);
      if (!response.ok) throw new Error("Failed to fetch quiz");
      const data = await response.json();
      setQuizData(data);
      setCachedResource(cacheKey, data); // Cache for next time
    } catch (error) {
      console.error("Error loading quiz:", error);
      setSelectedPart(null);
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedPart(null);
    setQuizData(null);
  };

  const filterByStatus = (part: Part, status: string) => {
    const progress = progressMap[part.partNumber];
    if (status === "completed") return progress?.quizPassed || false;
    if (status === "in-progress") return progress && progress.quizCompleted && !progress.quizPassed;
    if (status === "not-started") return !progress || !progress.quizCompleted;
    return true;
  };

  return (
    <div className="min-h-screen bg-ink">
      {/* Hero Section */}
      <div className="border-b border-zinc-800 bg-gradient-to-b from-zinc-900 to-ink">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <ClipboardCheck className="w-7 h-7 text-amber-500" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Quizzes</h1>
              <p className="text-zinc-400 mt-1">Test your knowledge with quizzes for each part</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-1">Completed</p>
              <p className="text-3xl font-bold text-white">{completedCount}/{totalQuizzes}</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-1">Passed</p>
              <p className={`text-3xl font-bold ${passedCount > 0 ? "text-green-400" : "text-zinc-400"}`}>{passedCount}</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-1">Average Score</p>
              <p className={`text-3xl font-bold ${avgScore > 0 ? "text-amber-400" : "text-zinc-400"}`}>{avgScore}%</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-1">Total Attempts</p>
              <p className="text-3xl font-bold text-zinc-400">{totalAttempts}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ResourcePageClient
          showStatusFilter
          filterByStatus={filterByStatus}
        >
          {(parts) => (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {parts.map((part) => {
                const progress = progressMap[part.partNumber];
                const bestScore = progress?.quizBestScore;
                const isPassed = progress?.quizPassed || false;
                const attempts = progress?.quizAttempts || 0;
                const isPerfect = bestScore === 100;
                const isLocked = lockedSet.has(part.partNumber);

                return (
                  <div
                    key={part.id}
                    onClick={mounted && !isLocked ? () => handleOpenQuiz(part) : undefined}
                    onMouseEnter={mounted && !isLocked ? () => handlePrefetch(part.id) : undefined}
                    className={`group rounded-xl border border-zinc-800 bg-zinc-900/50 transition-all overflow-hidden ${
                      isLocked
                        ? "cursor-not-allowed opacity-60"
                        : "cursor-pointer hover:bg-zinc-900 hover:border-amber-500/30"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div
                      className="aspect-video relative flex items-center justify-center overflow-hidden"
                      style={eraGradient(part.era)}
                    >
                      {/* Lock overlay */}
                      {isLocked && (
                        <div className="absolute inset-0 z-20 bg-black/70 flex items-center justify-center">
                          <Lock className="w-5 h-5 text-zinc-500" />
                        </div>
                      )}
                      {thumbnails[part.partNumber] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumbnails[part.partNumber]}
                          alt=""
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500"
                          onLoad={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "1"; }}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                      )}
                      {/* Large part number watermark */}
                      <span className="absolute inset-0 flex items-center justify-center opacity-[0.12] text-[5rem] font-black text-white select-none pointer-events-none leading-none">
                        {part.partNumber}
                      </span>
                      {/* Era label */}
                      <span className="absolute bottom-8 left-0 right-0 text-center text-[10px] font-semibold uppercase tracking-widest text-white/40 select-none">
                        {ERA_MAP[part.era as keyof typeof ERA_MAP]?.label ?? part.era}
                      </span>

                      {isPerfect && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-500/30 border border-amber-500/50 flex items-center justify-center">
                          <Trophy className="w-4 h-4 text-amber-400" />
                        </div>
                      )}
                      {!isPerfect && isPassed && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500/30 border border-green-500/50 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        </div>
                      )}
                      {bestScore != null && !isPassed && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/30 border border-red-500/50 flex items-center justify-center">
                          <XCircle className="w-4 h-4 text-red-400" />
                        </div>
                      )}

                      <div className="relative z-10 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-black/40 border border-white/25 flex items-center justify-center group-hover:bg-white/20 group-hover:border-white/40 transition-all">
                          <ClipboardCheck className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-amber-500">Part {part.partNumber}</span>
                        {bestScore != null && (
                          <span className={`px-2 py-0.5 border text-xs font-semibold rounded ${
                            isPerfect
                              ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                              : isPassed
                              ? "bg-green-500/10 border-green-500/20 text-green-400"
                              : "bg-red-500/10 border-red-500/20 text-red-400"
                          }`}>
                            {bestScore}% — {isPerfect ? "Perfect" : isPassed ? "Passed" : "Failed"}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2 group-hover:text-amber-400 transition-colors">
                        {part.title}
                      </h3>
                      {part.subtitle && (
                        <p className="text-xs text-zinc-500 line-clamp-1 mb-2">{part.subtitle}</p>
                      )}
                      {attempts > 0 && (
                        <p className="text-xs text-zinc-500">
                          {attempts} {attempts === 1 ? "attempt" : "attempts"}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ResourcePageClient>
      </div>

      {/* Quiz Modal — full-screen sheet on mobile, centered dialog on desktop */}
      {mounted && selectedPart && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm sm:p-4"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
          aria-label={`Part ${selectedPart.partNumber} Quiz`}
        >
          <div
            className="relative flex flex-col overflow-hidden w-full sm:max-w-4xl h-[100dvh] sm:h-[90vh] bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border-0 sm:border-2 border-amber-500/20 rounded-none sm:rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950 flex-shrink-0">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-lg sm:text-xl font-bold text-white truncate">
                  Part {selectedPart.partNumber} Quiz
                </h2>
                <p className="text-sm text-zinc-400 truncate mt-0.5">
                  {selectedPart.title}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="flex-shrink-0 min-w-[44px] min-h-[44px] rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
                aria-label="Close quiz"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            {/* Content */}
            <div
              className="flex-1 overflow-y-auto p-5 sm:p-6 bg-gradient-to-b from-zinc-900 to-zinc-950"
              style={{ overscrollBehavior: "contain" }}
              onClick={(e) => e.stopPropagation()}
            >
              {isLoadingQuiz && (
                <div className="flex items-center justify-center py-16">
                  <div className="text-zinc-400">Loading quiz...</div>
                </div>
              )}
              {!isLoadingQuiz && quizData && (
                <QuizViewer
                  quiz={quizData}
                  partNumber={selectedPart.partNumber}
                  previewMode={false}
                  initialBestScore={progressMap[selectedPart.partNumber]?.quizBestScore ?? undefined}
                />
              )}
              {!isLoadingQuiz && !quizData && (
                <div className="flex items-center justify-center py-16">
                  <div className="text-zinc-400">Quiz not available</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
