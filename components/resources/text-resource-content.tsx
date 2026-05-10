"use client";

import { useState, useEffect } from "react";
import { PARTS } from "@/lib/content";
import { ERA_MAP } from "@/lib/types";
import { eraGradient } from "./era-gradient";
import { ResourcePageClient } from "./resource-page-client";
import { ArrowLeft, FileText, CheckCircle2, BookOpen, GraduationCap, BarChart2, Clock, X } from "lucide-react";
import Link from "next/link";
import { formatSeerahContent } from "@/lib/text-formatter";
import { trackAssetOpened } from "@/app/actions/progress";

// Format a single fact line with semantic highlighting
function formatFactLine(text: string): string {
  let processed = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  processed = processed
    .replace(/\b(Muhammad|Prophet\s+Muhammad)\s*(ﷺ)?/gi, '<span class="text-amber-400 font-semibold">$1 ﷺ</span>')
    .replace(/\b(Makkah|Mecca|Madinah|Medina|Yemen|Syria|Iraq|Hijaz|Arabia|Abyssinia|Ethiopia|Byzantine|Persia|Persian|Constantinople|Jerusalem|Ta&#039;if|Taif|Khaybar|Badr|Uhud|Hunayn|Tabuk|Najran|Bahrain|Oman|Egypt|Rome)\b/gi, '<span class="text-blue-400 font-medium">$1</span>')
    .replace(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*(ﷺ|رضي الله عنه|رضي الله عنها|عليه السلام)/g, '<span class="text-green-400 font-medium">$1 $2</span>')
    .replace(/\b(Allah|Quran|Qur&#039;an|Islam|Islamic|Muslim|Muslims|Hadith|Sunnah|Sahaba|Hijrah|Revelation)\b/gi, '<span class="text-cyan-400 font-medium">$1</span>')
    .replace(/(\d{1,4}\s?(?:CE|AH|AD|BC|BCE))/gi, '<span class="text-amber-300 font-medium">$1</span>')
    .replace(/&quot;([^&]+?)&quot;/g, '<span class="text-zinc-400 italic">&quot;$1&quot;</span>');

  return processed;
}

interface TextResourceContentProps {
  title: string;
  description: string;
  resourceType: "briefing" | "report" | "study-guide" | "statement-of-facts";
  progressMap: Record<number, boolean>;
  completedCount: number;
}

export function TextResourceContent({
  title,
  description,
  resourceType,
  progressMap,
  completedCount,
}: TextResourceContentProps) {
  const [selectedPart, setSelectedPart] = useState<{ partNumber: number; title: string; subtitle?: string } | null>(null);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [localProgressMap, setLocalProgressMap] = useState(progressMap);
  const [localReadCount, setLocalReadCount] = useState(completedCount);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedPart) {
      // Save original overflow value
      const originalOverflow = document.body.style.overflow;
      // Lock scroll
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore original overflow
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [selectedPart]);

  const totalResources = PARTS.length;
  const unreadCount = totalResources - localReadCount;

  const filterByStatus = (part: any, status: string) => {
    const isRead = localProgressMap[part.partNumber] || false;
    if (status === "completed") return isRead;
    if (status === "not-started") return !isRead;
    return true;
  };

  const IconComponent = {
    briefing: FileText,
    report: BookOpen,
    "study-guide": GraduationCap,
    "statement-of-facts": BarChart2,
  }[resourceType];

  // Map resourceType to assetId for tracking
  const getAssetId = (type: string) => {
    const assetIdMap: Record<string, string> = {
      briefing: "briefing",
      "study-guide": "study_guide",
      report: "report",
      "statement-of-facts": "statement_of_facts",
    };
    return assetIdMap[type] || type;
  };

  const handleOpenContent = async (part: typeof PARTS[0]) => {
    setSelectedPart({ partNumber: part.partNumber, title: part.title, subtitle: part.subtitle });
    setLoading(true);
    
    // Track asset opened and update local progress
    const wasAlreadyRead = localProgressMap[part.partNumber];
    const assetId = getAssetId(resourceType);
    
    // Update local state immediately for better UX
    if (!wasAlreadyRead) {
      setLocalProgressMap(prev => ({
        ...prev,
        [part.partNumber]: true
      }));
      setLocalReadCount(prev => prev + 1);
    }
    
    // Track in database (fire and forget)
    trackAssetOpened(part.partNumber, assetId).catch(err => {
      console.error("Failed to track asset:", err);
      // Revert local state if failed
      if (!wasAlreadyRead) {
        setLocalProgressMap(prev => ({
          ...prev,
          [part.partNumber]: false
        }));
        setLocalReadCount(prev => prev - 1);
      }
    });
    
    try {
      const response = await fetch(`/api/part/${part.partNumber}/content`);
      if (!response.ok) throw new Error("Failed to fetch content");
      const data = await response.json();
      
      // Get the appropriate content based on resource type
      const contentMap: Record<string, string> = {
        briefing: data.briefingText || "",
        "study-guide": data.studyGuideText || "",
        report: data.reportText || "",
        "statement-of-facts": data.statementOfFactsText || "",
      };
      
      setContent(contentMap[resourceType] || "Content not available");
    } catch (error) {
      console.error("Error loading content:", error);
      setContent("Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedPart(null);
    setContent("");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero Section */}
      <div className="border-b border-zinc-800 bg-gradient-to-b from-zinc-900 to-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <IconComponent className="w-7 h-7 text-amber-500" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">{title}</h1>
              <p className="text-zinc-400 mt-1">{description}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-1">Total</p>
              <p className="text-3xl font-bold text-white">{totalResources}</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-1">Read</p>
              <p className="text-3xl font-bold text-green-400">{localReadCount}</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-1">Unread</p>
              <p className="text-3xl font-bold text-zinc-400">{unreadCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedPart && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={handleClose}
          onWheel={(e) => e.stopPropagation()}
        >
          <div 
            className="relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border-2 border-amber-500/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative glow */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <IconComponent className="w-5 h-5 text-amber-500" />
                  <span className="text-sm font-medium text-amber-500">Part {selectedPart.partNumber}</span>
                </div>
                <h2 className="text-2xl font-bold text-white">{selectedPart.title}</h2>
                {selectedPart.subtitle && (
                  <p className="text-sm text-zinc-400 mt-1">{selectedPart.subtitle}</p>
                )}
              </div>
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-lg hover:bg-zinc-800 flex items-center justify-center transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-zinc-900 to-zinc-950 overscroll-contain">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-zinc-400">Loading...</div>
                </div>
              ) : resourceType === "statement-of-facts" ? (
                <div className="max-w-none">
                  {(() => {
                    const facts = content
                      .split("\n")
                      .map((l) => l.trim())
                      .filter((l) => l.length > 0);
                    
                    return (
                      <div className="space-y-3">
                        {facts.map((fact, i) => (
                          <div 
                            key={i} 
                            className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900/80 via-zinc-900/60 to-zinc-950/80 hover:border-amber-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5"
                          >
                            {/* Subtle glow effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 via-amber-500/0 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            
                            <div className="relative flex gap-5 p-5">
                              {/* Number badge */}
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10 group-hover:scale-110 group-hover:shadow-amber-500/20 transition-all duration-300">
                                  <span className="text-base font-bold text-amber-400 tabular-nums">
                                    {i + 1}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Fact content */}
                              <div className="flex-1 min-w-0 pt-1">
                                <p 
                                  className="text-[15px] text-zinc-100 leading-[1.8] group-hover:text-white transition-colors"
                                  dangerouslySetInnerHTML={{ __html: formatFactLine(fact) }}
                                />
                              </div>
                              
                              {/* Decorative corner element */}
                              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-bl-[3rem]" />
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="max-w-none">
                  <div 
                    className="formatted-content"
                    dangerouslySetInnerHTML={{ __html: formatSeerahContent(content) }}
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end p-6 border-t border-zinc-800 bg-zinc-900/50 backdrop-blur">
              <button
                onClick={handleClose}
                className="px-6 py-2 rounded-lg bg-amber-500 text-black hover:bg-amber-400 text-sm font-semibold transition-all hover:scale-105 shadow-lg shadow-amber-500/20"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ResourcePageClient
          showStatusFilter
          filterByStatus={filterByStatus}
        >
          {(parts) => (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {parts.map((part) => {
                const isRead = localProgressMap[part.partNumber] || false;

                return (
                  <div
                    key={part.id}
                    onClick={() => handleOpenContent(part)}
                    className="group cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-amber-500/30 transition-all overflow-hidden"
                  >
                    {/* Thumbnail */}
                    <div
                      className="aspect-video relative flex items-center justify-center overflow-hidden"
                      style={eraGradient(part.era)}
                    >
                      {/* Large part number watermark */}
                      <span className="absolute inset-0 flex items-center justify-center opacity-[0.12] text-[5rem] font-black text-white select-none pointer-events-none leading-none">
                        {part.partNumber}
                      </span>
                      {/* Era label */}
                      <span className="absolute bottom-8 left-0 right-0 text-center text-[10px] font-semibold uppercase tracking-widest text-white/40 select-none">
                        {ERA_MAP[part.era as keyof typeof ERA_MAP]?.label ?? part.era}
                      </span>

                      {isRead && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500/30 border border-green-500/50 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        </div>
                      )}

                      <div className="relative z-10 w-14 h-14 rounded-full bg-black/40 border border-white/25 flex items-center justify-center group-hover:bg-white/20 group-hover:border-white/40 transition-all">
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-amber-500">Part {part.partNumber}</span>
                        {isRead && (
                          <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium rounded">
                            Read
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2 group-hover:text-amber-400 transition-colors">
                        {part.title}
                      </h3>
                      {part.subtitle && (
                        <p className="text-xs text-zinc-500 line-clamp-1 mb-2">{part.subtitle}</p>
                      )}
                      {part.duration && (
                        <div className="flex items-center gap-1 text-xs text-zinc-500">
                          <Clock className="w-3 h-3" />
                          ~{part.duration} read
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ResourcePageClient>
      </div>
    </div>
  );
}
