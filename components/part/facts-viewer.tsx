"use client";

import { useEffect } from "react";
import { trackAssetOpened } from "@/app/actions/progress";

interface FactsViewerProps {
  content: string;
  partNumber?: number;
  previewMode?: boolean;
}

// Apply semantic inline formatting to a single line of text
function formatFactLine(text: string): string {
  // Escape HTML first
  let processed = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Apply semantic highlighting
  processed = processed
    // 1. The Prophet Muhammad - GOLD
    .replace(/\b(Muhammad|Prophet\s+Muhammad)\s*(ﷺ)?/gi, '<span class="text-amber-400 font-bold">$1 ﷺ</span>')
    
    // 2. Places - BLUE
    .replace(/\b(Makkah|Mecca|Madinah|Medina|Yemen|Syria|Iraq|Hijaz|Arabia|Abyssinia|Ethiopia|Byzantine|Persia|Persian|Constantinople|Jerusalem|Ta&#039;if|Taif|Khaybar|Badr|Uhud|Hunayn|Tabuk|Najran|Bahrain|Oman|Egypt|Rome)\b/gi, '<span class="text-blue-400 font-medium">$1</span>')
    
    // 3. Other people's names with honorifics - GREEN
    .replace(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*(ﷺ|رضي الله عنه|رضي الله عنها|عليه السلام)/g, '<span class="text-green-400 font-medium">$1 $2</span>')
    
    // 4. Key Islamic terms - CYAN
    .replace(/\b(Allah|Quran|Qur&#039;an|Islam|Islamic|Muslim|Muslims|Hadith|Sunnah|Sahaba|Hijrah|Revelation)\b/gi, '<span class="text-cyan-400 font-medium">$1</span>')
    
    // 5. Dates and years - AMBER
    .replace(/(\d{1,4}\s?(?:CE|AH|AD|BC|BCE))/gi, '<span class="text-amber-300 font-medium">$1</span>')
    
    // 6. Quoted text - ITALIC GRAY
    .replace(/&quot;([^&]+?)&quot;/g, '<span class="text-zinc-400 italic">&quot;$1&quot;</span>');

  return processed;
}

export function FactsViewer({ content, partNumber, previewMode }: FactsViewerProps) {
  const facts = content
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  useEffect(() => {
    if (!partNumber || previewMode) return;
    trackAssetOpened(partNumber, "facts").catch(() => {});
  // Run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gold/60">Statement of Facts</p>
        <p className="text-[11px] text-text-muted/50 mt-0.5">{facts.length} key points from this lesson</p>
      </div>

      <ol className="space-y-4">
        {facts.map((fact, i) => (
          <li key={i} className="flex gap-3 sm:gap-4">
            <span className="flex-shrink-0 w-6 text-right text-[11px] font-semibold text-gold/40 tabular-nums pt-[3px] select-none">
              {i + 1}
            </span>
            <span
              className="text-[0.9375rem] sm:text-base text-[#C8C4BC] leading-[1.82] flex-1 min-w-0"
              dangerouslySetInnerHTML={{ __html: formatFactLine(fact) }}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}
