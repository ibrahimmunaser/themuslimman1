"use client";

import Link from "next/link";
import {
  ChevronRight,
  ChevronDown,
  Play,
  CheckCircle2,
  BookOpen,
  Lock,
} from "lucide-react";
import type { Part } from "@/lib/types";
import { ERA_MAP } from "@/lib/types";

interface PartProgressData {
  status: string;
  videoWatchPercent: number;
  briefingOpened: boolean;
  quizPassed: boolean;
  quizBestScore: number | null;
  quizAttempts: number;
  flashcardsReviewed: boolean;
  openedAssets: string[];
}

interface LessonsPathViewProps {
  parts: Part[];
  progressData: Record<number, PartProgressData>;
  currentPart: number;
}

const ERA_DESCRIPTIONS: Record<string, string> = {
  "Pre-Islamic Arabia": "Understand the world the Prophet ﷺ was sent to transform",
  "Birth & Early Life": "From his noble lineage to his character before prophethood",
  "Beginning of Revelation": "The first signs, the call to Islam, and early believers",
  "Makkah — Persecution": "See how early Muslims endured pressure, rejection, and sacrifice",
  "The Hijrah": "The migration that changed history and established a new society",
  "Madinah Period": "Building the first Islamic community and establishing the Ummah",
  "Major Campaigns": "The battles that defended Islam and shaped its expansion",
  "Final Years & Legacy": "The conquest of Makkah, Farewell Sermon, and the Prophet's ﷺ passing",
};

export function LessonsPathView({
  parts,
  progressData,
  currentPart,
}: LessonsPathViewProps) {
  // Always show the complete Seerah path
  const filteredParts = parts.filter((p) => p.audiences.includes("complete"));

  // Sequential lock: first part is always accessible; each subsequent part
  // requires the previous part's quiz to be passed.
  const pathLockedSet = new Set<number>();
  for (let i = 1; i < filteredParts.length; i++) {
    const prevQuizPassed = progressData[filteredParts[i - 1].partNumber]?.quizPassed ?? false;
    if (!prevQuizPassed) {
      for (let j = i; j < filteredParts.length; j++) {
        pathLockedSet.add(filteredParts[j].partNumber);
      }
      break;
    }
  }

  const partsByEra = filteredParts.reduce(
    (acc, part) => {
      const eraInfo = ERA_MAP[part.era];
      const eraLabel = eraInfo?.label ?? part.era;
      if (!acc[eraLabel]) {
        acc[eraLabel] = {
          label: eraLabel,
          description: ERA_DESCRIPTIONS[eraLabel] ?? "",
          color: eraInfo?.color ?? "#8B6F45",
          parts: [],
          completedCount: 0,
          totalCount: 0,
        };
      }
      acc[eraLabel].parts.push(part);
      acc[eraLabel].totalCount++;
      if (progressData[part.partNumber]?.quizPassed) {
        acc[eraLabel].completedCount++;
      }
      return acc;
    },
    {} as Record<string, {
      label: string;
      description: string;
      color: string;
      parts: Part[];
      completedCount: number;
      totalCount: number;
    }>
  );

  const getPartStatus = (partNumber: number) => {
    const prog = progressData[partNumber];
    if (!prog) return "not_started";
    if (prog.quizPassed) return "completed";
    const hasActivity =
      prog.videoWatchPercent > 0 ||
      prog.briefingOpened ||
      prog.quizAttempts > 0 ||
      prog.flashcardsReviewed;
    if (hasActivity) return "in_progress";
    return "not_started";
  };

  function AssetBadges({ partNumber }: { partNumber: number }) {
    const prog = progressData[partNumber];
    if (!prog) return null;
    const opened = prog.openedAssets;
    const vp = prog.videoWatchPercent;
    const assets = [
      {
        key: "video",
        label: vp >= 85 ? "✓ Video" : vp > 0 ? `Video ${vp}%` : "Video",
        done: vp >= 85,
        partial: vp > 0 && vp < 85,
      },
      { key: "briefing",   label: prog.briefingOpened ? "✓ Briefing" : "Briefing",           done: prog.briefingOpened,         partial: false },
      { key: "slides",     label: opened.includes("slides") ? "✓ Slides" : "Slides",         done: opened.includes("slides"),   partial: false },
      { key: "audio",      label: opened.includes("audio") ? "✓ Audio" : "Audio",            done: opened.includes("audio"),    partial: false },
      { key: "mindmap",    label: opened.includes("mindmap") ? "✓ Mind Map" : "Mind Map",    done: opened.includes("mindmap"),  partial: false },
      { key: "flashcards", label: prog.flashcardsReviewed ? "✓ Flashcards" : "Flashcards",   done: prog.flashcardsReviewed,     partial: false },
      {
        key: "quiz",
        label: prog.quizPassed
          ? `✓ Quiz ${prog.quizBestScore}%`
          : prog.quizBestScore
          ? `Quiz ${prog.quizBestScore}%`
          : "Quiz",
        done: prog.quizPassed,
        partial: !!(prog.quizBestScore && !prog.quizPassed),
      },
    ];
    return (
      <div className="hidden sm:flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs">
        {assets.map((a, i) => (
          <span
            key={a.key}
            className={a.done ? "text-green-400" : a.partial ? "text-amber-400" : "text-zinc-600"}
          >
            {a.label}
            {i < assets.length - 1 ? <span className="ml-3 text-zinc-700">·</span> : null}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Lessons</h1>
          <p className="text-zinc-400 text-sm mt-1">
            The complete Seerah of the Prophet ﷺ in 100 parts, arranged chronologically.
          </p>
        </div>
      </div>

      {/* Roadmap */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-4">
          {Object.entries(partsByEra).map(([eraKey, era]) => {
            const allCompleted = era.completedCount === era.totalCount && era.totalCount > 0;
            const inProgress = era.completedCount > 0 && era.completedCount < era.totalCount;
            const hasCurrentPart = era.parts.some((p) => p.partNumber === currentPart);
            const eraPercent = era.totalCount > 0
              ? Math.round((era.completedCount / era.totalCount) * 100)
              : 0;

            return (
              <details
                key={eraKey}
                className="group"
                open={hasCurrentPart}
                style={{ contentVisibility: "auto", containIntrinsicBlockSize: "120px" }}
              >
                <summary className="cursor-pointer list-none rounded-xl">
                  <div
                    className="bg-zinc-900/50 rounded-xl p-5 transition-colors border"
                    style={{ borderColor: `${era.color}40` }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            allCompleted ? "bg-green-500/10 border border-green-500/20" : ""
                          }`}
                          style={!allCompleted ? { backgroundColor: `${era.color}18`, border: `1px solid ${era.color}40` } : {}}
                        >
                          {allCompleted
                            ? <CheckCircle2 className="w-6 h-6 text-green-400" />
                            : <BookOpen className="w-6 h-6" style={{ color: era.color }} />
                          }
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <h3 className="text-base sm:text-lg font-semibold truncate min-w-0" style={{ color: era.color }}>
                              {era.label}
                            </h3>
                            {allCompleted && (
                              <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium rounded">Completed</span>
                            )}
                            {inProgress && !allCompleted && (
                              <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium rounded">In Progress</span>
                            )}
                            <span className="text-xs text-zinc-500">{era.totalCount} {era.totalCount === 1 ? "part" : "parts"}</span>
                          </div>
                          <p className="text-sm text-zinc-400 mb-3">{era.description}</p>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden max-w-[180px]">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${allCompleted ? "bg-green-500" : "bg-amber-500"}`}
                                style={{ width: `${eraPercent}%` }}
                              />
                            </div>
                            <span className="text-xs text-zinc-500">{era.completedCount}/{era.totalCount}</span>
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

                {/* Part cards */}
                <div className="mt-3 ml-4 pl-4 border-l-2" style={{ borderColor: `${era.color}50` }}>
                  <div className="space-y-2">
                    {era.parts.map((part) => {
                      const status = getPartStatus(part.partNumber);
                      const isCompleted = status === "completed";
                      const isInProgress = status === "in_progress";
                      const prog = progressData[part.partNumber];
                      const isMastered = (prog?.status ?? "") === "mastered";
                      const isLocked = pathLockedSet.has(part.partNumber);

                      const cardInner = (
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isLocked ? "bg-zinc-800 border border-zinc-700"
                            : isMastered ? "bg-yellow-500/15 border border-yellow-500/30"
                            : isCompleted ? "bg-green-500/10 border border-green-500/20"
                            : isInProgress ? "bg-amber-500/10 border border-amber-500/20"
                            : "bg-zinc-800 border border-zinc-700"
                          }`}>
                            {isLocked ? <Lock className="w-5 h-5 text-zinc-600" />
                            : isMastered ? <span className="text-base">✦</span>
                            : isCompleted ? <CheckCircle2 className="w-5 h-5 text-green-400" />
                            : <Play className={`w-5 h-5 ${isInProgress ? "text-amber-500" : "text-zinc-500"}`} />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className={`text-xs font-medium ${isLocked ? "text-zinc-600" : "text-amber-500"}`}>
                                Part {part.partNumber}
                              </span>
                              {isLocked && (
                                <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-600 text-xs font-medium rounded">Locked</span>
                              )}
                              {!isLocked && isCompleted && (
                                <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium rounded">Completed</span>
                              )}
                              {!isLocked && isInProgress && (
                                <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium rounded">In Progress</span>
                              )}
                            </div>
                            <p className={`font-medium mb-0.5 truncate ${isLocked ? "text-zinc-600" : "text-white group-hover:text-amber-400"}`}>
                              {part.title}
                            </p>
                            {part.subtitle && (
                              <p className="text-sm text-zinc-500 truncate mb-1">{part.subtitle}</p>
                            )}
                            {!isLocked && <AssetBadges partNumber={part.partNumber} />}
                          </div>

                          {isLocked
                            ? <div className="w-5 h-5 flex-shrink-0" />
                            : <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-amber-500 transition-colors flex-shrink-0" />
                          }
                        </div>
                      );

                      return isLocked ? (
                        <div key={part.id} className="block p-4 rounded-xl border bg-zinc-900/30 border-zinc-800/50 opacity-50 cursor-not-allowed">
                          {cardInner}
                        </div>
                      ) : (
                        <Link key={part.id} href={`/seerah/part-${part.partNumber}`}
                          className="group block p-4 rounded-xl border transition-all bg-zinc-900/50 border-zinc-800 hover:border-amber-500/30 hover:bg-zinc-900"
                        >
                          {cardInner}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </div>
  );
}
