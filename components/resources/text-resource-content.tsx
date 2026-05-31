"use client";

import { useState, useEffect } from "react";
import { PARTS } from "@/lib/content";
import { PART_CONTENT } from "@/lib/part-content-data";
import { ERA_MAP } from "@/lib/types";
import { eraGradient } from "./era-gradient";
import { ResourcePageClient } from "./resource-page-client";
import { FileText, CheckCircle2, BookOpen, GraduationCap, BarChart2, Clock, X } from "lucide-react";
import { trackAssetOpened } from "@/app/actions/progress";

// Apply semantic inline formatting to a single fact line
function formatFactLine(text: string): string {
  let processed = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  processed = processed
    .replace(/\b(Muhammad|Prophet\s+Muhammad)\s*(ﷺ)?/gi, '<span class="text-amber-400 font-bold">$1 ﷺ</span>')
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
  thumbnails?: Record<number, string>;
}

export function TextResourceContent({
  title,
  description,
  resourceType,
  progressMap,
  completedCount,
  thumbnails = {},
}: TextResourceContentProps) {
  const [selectedPart, setSelectedPart] = useState<{ partNumber: number; title: string; subtitle?: string } | null>(null);
  const [localProgressMap, setLocalProgressMap] = useState(progressMap);
  const [localReadCount, setLocalReadCount] = useState(completedCount);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedPart) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = orig; };
    }
  }, [selectedPart]);

  const totalResources = PARTS.length;
  const unreadCount = totalResources - localReadCount;

  const filterByStatus = (part: (typeof PARTS)[0], status: string) => {
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

  const getAssetId = (type: string) => ({
    briefing: "briefing",
    "study-guide": "study_guide",
    report: "report",
    "statement-of-facts": "statement-of-facts",
  }[type] ?? type);

  const handleOpenContent = (part: (typeof PARTS)[0]) => {
    setSelectedPart({ partNumber: part.partNumber, title: part.title, subtitle: part.subtitle });

    const wasAlreadyRead = localProgressMap[part.partNumber];
    if (!wasAlreadyRead) {
      setLocalProgressMap(prev => ({ ...prev, [part.partNumber]: true }));
      setLocalReadCount(prev => prev + 1);
      trackAssetOpened(part.partNumber, getAssetId(resourceType)).catch(() => {
        setLocalProgressMap(prev => ({ ...prev, [part.partNumber]: false }));
        setLocalReadCount(prev => prev - 1);
      });
    }
  };

  const handleClose = () => setSelectedPart(null);

  // Resolve content from hardcoded data (same source as lesson pages)
  const getHtml = (partNumber: number): string | null => {
    const data = PART_CONTENT[partNumber];
    if (!data) return null;
    if (resourceType === "briefing") return data.briefingHtml ?? null;
    return null;
  };

  const getFactsText = (partNumber: number): string | null => {
    const data = PART_CONTENT[partNumber];
    return data?.statementOfFactsText ?? null;
  };

  return (
    <div className="min-h-screen bg-ink">
      {/* Hero Section */}
      <div className="border-b border-zinc-800 bg-gradient-to-b from-zinc-900 to-ink">
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
              <p className={`text-3xl font-bold ${localReadCount > 0 ? "text-green-400" : "text-zinc-400"}`}>{localReadCount}</p>
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
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] bg-ink border border-border/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gold top accent */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gold mb-1">
                  Part {selectedPart.partNumber}
                </p>
                <h2 className="text-lg font-bold text-text">{selectedPart.title}</h2>
                {selectedPart.subtitle && (
                  <p className="text-sm text-text-secondary mt-0.5">{selectedPart.subtitle}</p>
                )}
              </div>
              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-lg hover:bg-surface-raised flex items-center justify-center transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 text-text-muted" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {resourceType === "statement-of-facts" ? (
                /* ── Facts — same rendering as FactsViewer in lessons ── */
                <div className="p-6">
                  {(() => {
                    const text = getFactsText(selectedPart.partNumber);
                    if (!text) return <p className="text-text-muted text-sm">No facts available.</p>;
                    const facts = text.split("\n").map(l => l.trim()).filter(Boolean);
                    return (
                      <ol className="space-y-3">
                        {facts.map((fact, i) => (
                          <li key={i} className="flex gap-4 items-baseline">
                            <span className="flex-shrink-0 w-7 text-right text-xs font-semibold text-gold/50 tabular-nums mt-[2px]">
                              {i + 1}
                            </span>
                            <span
                              className="text-base text-zinc-300 leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: formatFactLine(fact) }}
                            />
                          </li>
                        ))}
                      </ol>
                    );
                  })()}
                </div>
              ) : (
                /* ── Briefing — same article-shell rendering as TextViewer in lessons ── */
                <div className="article-shell p-6">
                  <div className="article-container">
                    <div
                      className="formatted-text"
                      dangerouslySetInnerHTML={{
                        __html: getHtml(selectedPart.partNumber) ?? "<p class='seerah-p text-text-muted'>Content not available.</p>",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end px-6 py-4 border-t border-border flex-shrink-0">
              <button
                onClick={handleClose}
                className="px-5 py-2 rounded-lg bg-gold text-ink hover:bg-gold-light text-sm font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ResourcePageClient showStatusFilter filterByStatus={filterByStatus}>
          {(parts) => (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {parts.map((part) => {
                const isRead = localProgressMap[part.partNumber] || false;
                return (
                  <div
                    key={part.id}
                    onClick={() => handleOpenContent(part)}
                    className="group cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-amber-500/30 transition-all overflow-hidden"
                  >
                    <div
                      className="aspect-video relative flex items-center justify-center overflow-hidden"
                      style={eraGradient(part.era)}
                    >
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
                      <span className="absolute inset-0 flex items-center justify-center opacity-[0.12] text-[5rem] font-black text-white select-none pointer-events-none leading-none">
                        {part.partNumber}
                      </span>
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
