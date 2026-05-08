/**
 * Shared text formatting utility for Seerah content
 * Provides semantic highlighting and beautiful formatting for:
 * - Briefings
 * - Study Guides
 * - Reports
 * - Facts
 */

// Helper function to escape HTML
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Apply semantic inline formatting with color highlighting
function applyInlineFormatting(text: string): string {
  // First escape all HTML
  let processed = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Now apply semantic formatting with proper HTML entities already escaped
  processed = processed
    // 1. The Prophet Muhammad - GOLD (most important, special highlighting)
    .replace(/\b(Muhammad|Prophet\s+Muhammad)\s*(ﷺ)?/gi, '<span class="text-amber-400 font-bold">$1 ﷺ</span>')
    
    // 2. Places - BLUE (cities, regions, geographical locations)
    .replace(/\b(Makkah|Mecca|Madinah|Medina|Yemen|Syria|Iraq|Hijaz|Arabia|Abyssinia|Ethiopia|Byzantine|Persia|Persian|Constantinople|Jerusalem|Ta&#039;if|Taif|Khaybar|Badr|Uhud|Hunayn|Tabuk|Najran|Bahrain|Oman|Egypt|Rome)\b/gi, '<span class="text-blue-400 font-medium">$1</span>')
    
    // 3. Other people's names with honorifics - GREEN
    .replace(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*(ﷺ|رضي الله عنه|رضي الله عنها|عليه السلام)/g, '<span class="text-green-400 font-medium">$1 $2</span>')
    
    // 4. Key Islamic terms - CYAN (religious concepts)
    .replace(/\b(Allah|Quran|Qur&#039;an|Islam|Islamic|Muslim|Muslims|Hadith|Sunnah|Sahaba|Hijrah|Revelation)\b/gi, '<span class="text-cyan-400 font-medium">$1</span>')
    
    // 5. Dates and years - AMBER (historical context)
    .replace(/(\d{1,4}\s?(?:CE|AH|AD|BC|BCE))/gi, '<span class="text-amber-300 font-medium">$1</span>')
    
    // 6. Quoted text - ITALIC GRAY
    .replace(/&quot;([^&]+?)&quot;/g, '<span class="text-zinc-400 italic">&quot;$1&quot;</span>');

  return processed;
}

/**
 * Format Seerah text content with semantic highlighting and beautiful typography
 * @param text - Raw text content
 * @returns HTML string with formatted content
 */
export function formatSeerahContent(text: string): string {
  if (!text) return "";

  // Split into lines for processing
  let lines = text.split('\n');
  let formatted: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines (but preserve them for spacing)
    if (!line) {
      if (inList) {
        formatted.push('</ul>');
        inList = false;
      }
      formatted.push('<div class="h-4"></div>');
      continue;
    }

    // Skip separator lines (repeated characters like ---, ===, ___, etc.)
    if (line.match(/^[\-=_*#]{3,}$/)) {
      if (inList) {
        formatted.push('</ul>');
        inList = false;
      }
      continue;
    }

    // Main headings (all caps or ending with colon, or containing "Executive Summary", "Summary", etc.)
    if (
      line === line.toUpperCase() && line.length > 3 && !line.match(/^\d/) ||
      line.match(/^(Executive Summary|Summary|Introduction|Conclusion|Background|Overview|Key Points|Important Notes?|Context|Analysis):?$/i) ||
      (line.match(/^[A-Z]/) && line.endsWith(':') && line.length < 80)
    ) {
      if (inList) {
        formatted.push('</ul>');
        inList = false;
      }
      const escapedLine = escapeHtml(line.replace(/:$/, ''));
      formatted.push(`<h2 class="text-2xl font-bold text-amber-400 mt-8 mb-4 first:mt-0 border-b border-amber-500/20 pb-2">${escapedLine}</h2>`);
      continue;
    }

    // Section headings (Title Case and longer)
    if (line.match(/^[A-Z][a-z]+(\s+[A-Z][a-z]+)+/) && line.length < 100 && !line.match(/[.!?]$/)) {
      if (inList) {
        formatted.push('</ul>');
        inList = false;
      }
      const escapedLine = escapeHtml(line);
      formatted.push(`<h3 class="text-xl font-semibold text-amber-300 mt-6 mb-3 flex items-center gap-2"><span class="w-1 h-6 bg-amber-500 rounded"></span>${escapedLine}</h3>`);
      continue;
    }

    // Numbered or bulleted lists
    if (line.match(/^[\d•\-\*]\s/) || line.match(/^\d+\./)) {
      if (!inList) {
        formatted.push('<ul class="space-y-2 my-4">');
        inList = true;
      }
      const cleanLine = line.replace(/^[\d•\-\*]\s*/, '').replace(/^\d+\.\s*/, '');
      const processedLine = applyInlineFormatting(cleanLine);
      formatted.push(`<li class="text-zinc-300 leading-relaxed ml-6 pl-4 border-l-2 border-amber-500/30 hover:border-amber-500/50 transition-colors">${processedLine}</li>`);
      continue;
    }

    // Close list if we're in one
    if (inList) {
      formatted.push('</ul>');
      inList = false;
    }

    // Regular paragraph - apply inline formatting
    const processedLine = applyInlineFormatting(line);
    formatted.push(`<p class="text-zinc-300 leading-relaxed mb-4 text-base">${processedLine}</p>`);
  }

  // Close list if still open
  if (inList) {
    formatted.push('</ul>');
  }

  return formatted.join('\n');
}
