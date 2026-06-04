"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ChevronDown,
  Play,
  CheckCircle2,
  BookOpen,
  Lock,
} from "lucide-react";
import type { Part, AudiencePath } from "@/lib/types";
import { ERA_MAP } from "@/lib/types";
import { LEARNING_PATHS } from "@/lib/learning-paths";

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

const PATH_STORAGE_KEY  = "seerah:lessons-path";
const PATH_COOKIE_NAME  = "seerah_path";

function setPathCookie(path: AudiencePath) {
  const maxAge = 60 * 60 * 24 * 365; // 1 year
  document.cookie = `${PATH_COOKIE_NAME}=${path}; path=/; max-age=${maxAge}; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
}

// ── Era description lookup ────────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

export function LessonsPathView({
  parts,
  progressData,
  currentPart,
}: LessonsPathViewProps) {
  // Initialise from localStorage immediately (lazy initializer) to prevent the
  // "flash of complete-path content" that occurred when the useEffect fired after paint.
  const [activePath, setActivePath] = useState<AudiencePath>(() => {
    try {
      const saved = localStorage.getItem(PATH_STORAGE_KEY) as AudiencePath | null;
      if (saved && (["children", "complete"] as string[]).includes(saved)) return saved;
    } catch {
      // localStorage unavailable (SSR guard, private browsing, etc.)
    }
    return "complete";
  });

  const selectPath = useCallback((path: AudiencePath) => {
    setActivePath(path);
    try {
      localStorage.setItem(PATH_STORAGE_KEY, path);
      setPathCookie(path);
    } catch {
      // ignore
    }
  }, []);

  // Sync cookie on first mount in case the cookie is missing but localStorage has a value.
  useEffect(() => {
    setPathCookie(activePath);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter and group by era
  const filteredParts = parts.filter((p) =>
    p.audiences.includes(activePath)
  );

  // Compute path-specific sequential locks:
  // The first part in the active path is always accessible.
  // Each subsequent part requires the previous part in THIS path to have its quiz passed.
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

  // In the Children's Seerah path the parts are a subset (e.g. parts 1, 7, 11 …).
  // Display sequential labels (Part 1, Part 2 …) so learners see a clean 1-to-39
  // numbering rather than the underlying complete-course part numbers.
  // All hrefs, progress keys, and lock logic still use the real partNumber.
  const childrenDisplayMap: Record<number, number> =
    activePath === "children"
      ? Object.fromEntries(filteredParts.map((p, i) => [p.partNumber, i + 1]))
      : {};
  const getDisplayNumber = (partNumber: number): number =>
    activePath === "children"
      ? (childrenDisplayMap[partNumber] ?? partNumber)
      : partNumber;

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
      const prog = progressData[part.partNumber];
      if (prog?.quizPassed) {
        acc[eraLabel].completedCount++;
      }
      return acc;
    },
    {} as Record<
      string,
      {
        label: string;
        description: string;
        color: string;
        parts: Part[];
        completedCount: number;
        totalCount: number;
      }
    >
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
        label:
          vp >= 85
            ? "✓ Video"
            : vp > 0
            ? `Video ${vp}%`
            : "Video",
        done: vp >= 85,
        partial: vp > 0 && vp < 85,
      },
      {
        key: "briefing",
        label: prog.briefingOpened ? "✓ Briefing" : "Briefing",
        done: prog.briefingOpened,
        partial: false,
      },
      {
        key: "slides",
        label: opened.includes("slides") ? "✓ Slides" : "Slides",
        done: opened.includes("slides"),
        partial: false,
      },
      {
        key: "audio",
        label: opened.includes("audio") ? "✓ Audio" : "Audio",
        done: opened.includes("audio"),
        partial: false,
      },
      {
        key: "mindmap",
        label: opened.includes("mindmap")
          ? "✓ Mind Map"
          : "Mind Map",
        done: opened.includes("mindmap"),
        partial: false,
      },
      {
        key: "flashcards",
        label: prog.flashcardsReviewed
          ? "✓ Flashcards"
          : "Flashcards",
        done: prog.flashcardsReviewed,
        partial: false,
      },
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
            className={
              a.done
                ? "text-green-400"
                : a.partial
                ? "text-amber-400"
                : "text-zinc-600"
            }
          >
            {a.label}
            {i < assets.length - 1 ? (
              <span className="ml-3 text-zinc-700">·</span>
            ) : null}
          </span>
        ))}
      </div>
    );
  }

  const activePathMeta = LEARNING_PATHS.find((p) => p.id === activePath)!;

  return (
    <div className="min-h-screen bg-ink">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Lessons
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Choose a learning path to customise your journey through the Seerah.
            </p>
          </div>

          {/* Path selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {LEARNING_PATHS.map((path) => {
              const count = parts.filter((p) =>
                p.audiences.includes(path.id)
              ).length;
              const isActive = activePath === path.id;
              return (
                <button
                  key={path.id}
                  onClick={() => selectPath(path.id)}
                  className={`text-left px-4 py-3.5 rounded-xl border transition-all ${
                    isActive
                      ? "border-amber-500/50 bg-amber-500/8 ring-1 ring-amber-500/20"
                      : "border-zinc-700/60 bg-zinc-900/40 hover:border-zinc-600 hover:bg-zinc-900/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-sm font-semibold ${
                        isActive ? "text-amber-400" : "text-zinc-200"
                      }`}
                    >
                      {path.label}
                    </span>
                    <span
                      className={`text-xs font-medium tabular-nums px-1.5 py-0.5 rounded ${
                        isActive
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-zinc-800 text-zinc-500"
                      }`}
                    >
                      {count}
                    </span>
                  </div>
                  <p
                    className={`text-xs mt-1 leading-relaxed ${
                      isActive ? "text-zinc-300" : "text-zinc-500"
                    }`}
                  >
                    {path.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Roadmap */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-1">
            {activePathMeta.label}
          </h2>
          <p className="text-zinc-400 text-sm max-w-2xl">
            {filteredParts.length === 100
              ? "The life of Prophet Muhammad ﷺ in eight stages — from pre-Islamic Arabia to his final days. All 100 parts, arranged chronologically."
              : `${filteredParts.length} parts selected for this path, arranged chronologically across the eight stages of the Seerah.`}
          </p>
        </div>

        <div className="space-y-4">
          {Object.entries(partsByEra).map(([eraKey, era]) => {
            const allCompleted =
              era.completedCount === era.totalCount && era.totalCount > 0;
            const inProgress =
              era.completedCount > 0 &&
              era.completedCount < era.totalCount;
            const hasCurrentPart = era.parts.some(
              (p) => p.partNumber === currentPart
            );
            const eraPercent =
              era.totalCount > 0
                ? Math.round(
                    (era.completedCount / era.totalCount) * 100
                  )
                : 0;

            return (
              <details
                key={eraKey}
                className="group"
                open={hasCurrentPart}
                style={{
                  contentVisibility: "auto",
                  containIntrinsicBlockSize: "120px",
                }}
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
                            allCompleted
                              ? "bg-green-500/10 border border-green-500/20"
                              : ""
                          }`}
                          style={
                            !allCompleted
                              ? {
                                  backgroundColor: `${era.color}18`,
                                  border: `1px solid ${era.color}40`,
                                }
                              : {}
                          }
                        >
                          {allCompleted ? (
                            <CheckCircle2 className="w-6 h-6 text-green-400" />
                          ) : (
                            <BookOpen
                              className="w-6 h-6"
                              style={{ color: era.color }}
                            />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <h3
                              className="text-base sm:text-lg font-semibold truncate min-w-0"
                              style={{ color: era.color }}
                            >
                              {era.label}
                            </h3>
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
                            <span className="text-xs text-zinc-500">
                              {era.totalCount}{" "}
                              {era.totalCount === 1 ? "part" : "parts"}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-400 mb-3">
                            {era.description}
                          </p>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden max-w-[180px]">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  allCompleted
                                    ? "bg-green-500"
                                    : "bg-amber-500"
                                }`}
                                style={{ width: `${eraPercent}%` }}
                              />
                            </div>
                            <span className="text-xs text-zinc-500">
                              {era.completedCount}/{era.totalCount}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <div
                          className={`text-sm font-bold tabular-nums ${
                            allCompleted
                              ? "text-green-400"
                              : inProgress
                              ? "text-amber-400"
                              : "text-zinc-600"
                          }`}
                        >
                          {eraPercent}%
                        </div>
                        <ChevronDown className="w-5 h-5 text-zinc-500 group-open:rotate-180 transition-transform flex-shrink-0" />
                      </div>
                    </div>
                  </div>
                </summary>

                {/* Part cards */}
                <div
                  className="mt-3 ml-4 pl-4 border-l-2"
                  style={{ borderColor: `${era.color}50` }}
                >
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
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              isLocked
                                ? "bg-zinc-800 border border-zinc-700"
                                : isMastered
                                ? "bg-yellow-500/15 border border-yellow-500/30"
                                : isCompleted
                                ? "bg-green-500/10 border border-green-500/20"
                                : isInProgress
                                ? "bg-amber-500/10 border border-amber-500/20"
                                : "bg-zinc-800 border border-zinc-700"
                            }`}
                          >
                            {isLocked ? (
                              <Lock className="w-5 h-5 text-zinc-600" />
                            ) : isMastered ? (
                              <span className="text-base">✦</span>
                            ) : isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-green-400" />
                            ) : (
                              <Play
                                className={`w-5 h-5 ${
                                  isInProgress
                                    ? "text-amber-500"
                                    : "text-zinc-500"
                                }`}
                              />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className={`text-xs font-medium ${isLocked ? "text-zinc-600" : "text-amber-500"}`}>
                                Part {getDisplayNumber(part.partNumber)}
                              </span>

                              {/* Locked badge */}
                              {isLocked && (
                                <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-600 text-xs font-medium rounded">
                                  Locked
                                </span>
                              )}

                              {/* Progress status badges — hidden when locked */}
                              {!isLocked && isCompleted && (
                                <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium rounded">
                                  Completed
                                </span>
                              )}
                              {!isLocked && isInProgress && (
                                <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium rounded">
                                  In Progress
                                </span>
                              )}
                            </div>

                            <p className={`font-medium mb-0.5 truncate ${isLocked ? "text-zinc-600" : "text-white group-hover:text-amber-400"}`}>
                              {part.title}
                            </p>
                            {part.subtitle && (
                              <p className="text-sm text-zinc-500 truncate mb-1">
                                {part.subtitle}
                              </p>
                            )}
                            {!isLocked && <AssetBadges partNumber={part.partNumber} />}
                          </div>

                          {isLocked ? (
                            <div className="w-5 h-5 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-amber-500 transition-colors flex-shrink-0" />
                          )}
                        </div>
                      );

                      return isLocked ? (
                        <div
                          key={part.id}
                          className="block p-4 rounded-xl border bg-zinc-900/30 border-zinc-800/50 opacity-50 cursor-not-allowed"
                        >
                          {cardInner}
                        </div>
                      ) : (
                        <Link
                          key={part.id}
                          href={`/seerah/part-${part.partNumber}`}
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
