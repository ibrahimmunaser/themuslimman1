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

// Apply inline markdown (bold, italic) and real markdown links.
// Must run AFTER HTML-escaping so we don't accidentally break tags.
function applyInlineFormatting(text: string): string {
  // Step 1 — escape HTML
  let processed = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Step 2 — real Markdown links [text](url)
  // External URLs open in new tab; internal relative paths navigate within the app.
  // Must come before bold/italic so URLs with * or _ are not corrupted.
  processed = processed.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_, linkText, url) => {
      const isExternal = /^https?:\/\//.test(url);
      return isExternal
        ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`
        : `<a href="${url}">${linkText}</a>`;
    }
  );

  // Step 3 — inline markdown (order matters: *** before ** before *)
  processed = processed
    // ***bold italic***
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    // **bold**
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // *italic*  (not preceded/followed by another *)
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    // __bold__ (alternate syntax)
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    // _italic_ (alternate syntax)
    .replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em>$1</em>');

  // Step 4 — Prophet ﷺ references — gold, semibold, NOT underlined, NOT a link.
  // Longest patterns first to prevent partial overlaps.
  // "Prophet Muhammad" is always matched (unambiguous proper name);
  // bare "the Prophet" and "Messenger" only when the ﷺ symbol is present.
  processed = processed.replace(
    /(Messenger\s+of\s+Allah\s+ﷺ|Prophet\s+Muhammad(?:\s+ﷺ)?|the\s+Prophet\s+ﷺ|Messenger\s+ﷺ)/g,
    '<span class="seerah-prophet">$1</span>'
  );

  // Step 5 — Qur'an / Revelation terms — semibold, inherits colour, NOT a link.
  // "revelation/Revelation" included: in Seerah content it always means waḥy,
  // never generic disclosure. All other terms are specific transliterations.
  processed = processed.replace(
    /(Qur[''ʾ]?[aā]n|[Rr]evelation|waḥy|Jibrīl|Sūrah|āyah|al-Isrā[''ʾ]|Miʿrāj)/g,
    '<span class="seerah-revelation">$1</span>'
  );

  // Step 6 — Core Islamic concepts — slightly brightened semibold, NOT a link.
  // Both capitalisation variants kept where the term appears in various styles.
  processed = processed.replace(
    /(tawḥīd|shirk|īmān|daʿwah|[Hh]ijrah|Sunnah|ṣalāh|[Hh]ajj|tawāf|Kaʿbah)/g,
    '<span class="seerah-concept">$1</span>'
  );

  // Step 7 — Quoted text — muted italic
  processed = processed.replace(
    /&quot;([^&]+?)&quot;/g,
    '<span class="seerah-quote">&quot;$1&quot;</span>'
  );

  return processed;
}

/**
 * Format Seerah text content with semantic highlighting and beautiful typography
 * @param text - Raw text content
 * @returns HTML string with formatted content
 */
export function formatSeerahContent(text: string): string {
  if (!text) return "";

  const lines = text.split('\n');
  const formatted: string[] = [];
  let inList = false;
  let inNestedList = false;
  let inTable = false;
  let firstContentSeen = false;

  const closeNestedList = () => {
    if (inNestedList) { formatted.push('</ul>'); inNestedList = false; }
  };
  const closeList = () => {
    closeNestedList();
    if (inList) { formatted.push('</ul>'); inList = false; }
  };
  const closeTable = () => {
    if (inTable) { formatted.push('</tbody></table>'); inTable = false; }
  };

  // Returns true if a line looks like a section heading.
  // Handles mixed-case headings like "Location and Boundaries" or "Hub of Exchange".
  const isSectionHeading = (ln: string): boolean => {
    if (ln.length >= 80 || ln.match(/[.!?]$/)) return false;
    const words = ln.split(/\s+/);
    if (words.length < 2 || words.length > 10) return false;
    // First word and last word must start with uppercase
    if (!/^[A-Z]/.test(words[0]) || !/^[A-Z]/.test(words[words.length - 1])) return false;
    // At least 60% of words must start with uppercase (allows "and", "of", "the" in middle)
    const capCount = words.filter(w => /^[A-Z]/.test(w)).length;
    return capCount / words.length >= 0.5;
  };

  // Extra state for pipe-table header tracking
  let pipeTableHeaderOpen = false; // true between <thead> and </thead>

  const closePipeTableHeader = () => {
    if (pipeTableHeaderOpen) {
      formatted.push('</tr></thead><tbody>');
      pipeTableHeaderOpen = false;
    }
  };
  const closeTableFull = () => {
    closePipeTableHeader();
    if (inTable) { formatted.push('</tbody></table>'); inTable = false; }
  };
  // Override the earlier closeTable with the full version
  // (reassign via wrapper — closeTable is already declared above)

  for (let i = 0; i < lines.length; i++) {
    // Keep raw line (minus CR) to preserve leading whitespace for indent detection
    // and to preserve trailing tabs that trim() would remove.
    const rawLine = lines[i].replace(/\r$/, '');
    const line = rawLine.trim();
    const indent = rawLine.length - rawLine.trimStart().length;

    // Empty line — close open structures, add spacing
    if (!line) {
      closeList();
      closeTableFull();
      formatted.push('<div class="h-4"></div>');
      continue;
    }

    // Separator lines (---, ===, etc. but NOT markdown --- inside tables)
    if (line.match(/^[-=_]{3,}$/) && !inTable) {
      closeList();
      closeTableFull();
      continue;
    }

    // ── Markdown blockquotes: > text ─────────────────────────────────────────
    // Consecutive > lines are grouped into one block so multi-line notes render
    // correctly. If the first line is a recognised source/caution label it is
    // rendered as a styled callout; otherwise a plain blockquote.
    if (line.startsWith('> ') || line === '>') {
      closeList();
      closeTableFull();

      // Collect all consecutive > lines (including the current one at index i)
      const bqLines: string[] = [];
      while (i < lines.length) {
        const rawL = lines[i].replace(/\r$/, '');
        const l = rawL.trim();
        if (l.startsWith('> ') || l === '>') {
          bqLines.push(l.replace(/^>\s?/, ''));
          i++;
        } else {
          break;
        }
      }
      i--; // outer for-loop will i++ at end of iteration

      // Detect source/caution note label on the first line
      const NOTE_PATTERN =
        /^(Authenticity Note|Scholarly Caution|Historical Note|Source Note|Study Note|Editor Review Needed):?$/i;
      const labelMatch = bqLines[0]?.match(NOTE_PATTERN);

      if (labelMatch) {
        const labelText = labelMatch[1];
        const rest = bqLines.slice(1).filter(l => l.trim());
        const bodyHtml = rest.map(l => applyInlineFormatting(l)).join(' ');
        formatted.push(
          `<div class="seerah-callout">` +
          `<span class="seerah-callout-label">${escapeHtml(labelText)}</span>` +
          (bodyHtml ? `<span class="seerah-callout-body">${bodyHtml}</span>` : '') +
          `</div>`
        );
      } else {
        const bqHtml = bqLines.map(l => applyInlineFormatting(l)).join(' ');
        formatted.push(`<blockquote>${bqHtml}</blockquote>`);
      }

      firstContentSeen = true;
      continue;
    }

    // ── Markdown headings: #, ##, ### ────────────────────────────────────────
    const mdHeading = line.match(/^(#{1,6})\s+(.*)/);
    if (mdHeading) {
      closeList();
      closeTableFull();
      const level = mdHeading[1].length;
      const headingText = mdHeading[2].trim();
      if (level === 1) {
        // H1 = document title — skip (TextViewer shows its own article header)
        firstContentSeen = true;
        continue;
      } else if (level === 2) {
        formatted.push(`<h2 class="seerah-h2">${escapeHtml(headingText)}</h2>`);
      } else {
        formatted.push(`<h3 class="seerah-h3"><span class="seerah-h3-bar"></span>${escapeHtml(headingText)}</h3>`);
      }
      firstContentSeen = true;
      continue;
    }

    // ── Markdown pipe tables: | col | col | ──────────────────────────────────
    if (line.startsWith('|')) {
      closeList();
      firstContentSeen = true;

      // Separator row (|---|---| or |:---:|---:| etc.) — closes thead, opens tbody
      if (line.match(/^\|[\s\-:|]+\|/)) {
        closePipeTableHeader();
        continue;
      }

      // Parse cells: split on | and discard first/last empty segments
      const cells = line.split('|').slice(1, -1).map(c => c.trim());

      if (!inTable) {
        // First row = header
        formatted.push('<table class="seerah-data-table"><thead><tr>');
        cells.forEach(c => formatted.push(`<th>${escapeHtml(c)}</th>`));
        inTable = true;
        pipeTableHeaderOpen = true;
      } else if (pipeTableHeaderOpen) {
        // Shouldn't happen in standard markdown, but handle extra header rows gracefully
        cells.forEach(c => formatted.push(`<th>${escapeHtml(c)}</th>`));
      } else {
        // Data row
        const rowCells = cells.map(c => `<td>${applyInlineFormatting(c)}</td>`).join('');
        formatted.push(`<tr>${rowCells}</tr>`);
      }
      continue;
    }

    // ── Tab-separated table rows ──────────────────────────────────────────────
    // IMPORTANT: check rawLine (not trimmed line) — trailing tabs are stripped by trim()
    // e.g. "bin Abdullah\t" becomes "bin Abdullah" after trim, hiding the tab.
    if (rawLine.includes('\t')) {
      closeList();
      closePipeTableHeader();
      // Split rawLine and trim each cell individually
      const cols = rawLine.split('\t').map(c => c.trim());

      if (!inTable) {
        // Look ahead: if the next non-empty line is also tab-delimited → this row is a header
        let nextIsTab = false;
        for (let j = i + 1; j < lines.length; j++) {
          const nextRaw = lines[j].replace(/\r$/, '');
          const nextLine = nextRaw.trim();
          if (nextLine) { nextIsTab = nextRaw.includes('\t'); break; }
        }

        if (nextIsTab) {
          formatted.push('<table class="seerah-data-table"><thead><tr>');
          cols.forEach(c => formatted.push(c ? `<th>${escapeHtml(c)}</th>` : '<th></th>'));
          formatted.push('</tr></thead><tbody>');
          inTable = true;
        } else {
          // Single isolated tab row — render as a one-row table body
          formatted.push('<table class="seerah-data-table"><tbody><tr>');
          cols.forEach(c => formatted.push(`<td>${applyInlineFormatting(c)}</td>`));
          formatted.push('</tr></tbody></table>');
        }
      } else {
        const rowCells = cols.map(c => `<td>${applyInlineFormatting(c)}</td>`).join('');
        formatted.push(`<tr>${rowCells}</tr>`);
      }
      firstContentSeen = true;
      continue;
    }

    // Non-table/non-heading content — close any open table
    closeTableFull();

    // Skip document title line in plain-text format (e.g. "Briefing: The Pre-Islamic Arabian Context").
    // TextViewer already renders its own article header.
    if (!firstContentSeen && line.match(/^(Briefing|Study Guide|Report)\s*[:\-–]/i)) {
      firstContentSeen = true;
      continue;
    }
    firstContentSeen = true;

    // ── H2 Headings (plain-text format) ──────────────────────────────────────
    if (
      (line === line.toUpperCase() && line.length > 3 && !line.match(/^\d/)) ||
      line.match(/^(Executive Summary|Summary|Introduction|Conclusion|Background|Overview|Key Points|Important Notes?|Context|Analysis):?$/i) ||
      (line.match(/^[A-Z]/) && line.endsWith(':') && line.length < 80)
    ) {
      closeList();
      formatted.push(`<h2 class="seerah-h2">${escapeHtml(line.replace(/:$/, ''))}</h2>`);
      continue;
    }

    // ── H3 Section headings (plain-text format) ───────────────────────────────
    if (isSectionHeading(line)) {
      closeList();
      formatted.push(`<h3 class="seerah-h3"><span class="seerah-h3-bar"></span>${escapeHtml(line)}</h3>`);
      continue;
    }

    // ── Lists ─────────────────────────────────────────────────────────────────

    // Nested bullet (≥2 spaces of indentation + bullet marker)
    if (indent >= 2 && line.match(/^[*\-•]\s/)) {
      if (!inList) {
        formatted.push('<ul class="seerah-list">');
        inList = true;
      }
      if (!inNestedList) {
        formatted.push('<ul class="seerah-nested-list">');
        inNestedList = true;
      }
      const cleanLine = line.replace(/^[*\-•]\s*/, '');
      formatted.push(`<li class="seerah-li seerah-nested-li">${applyInlineFormatting(cleanLine)}</li>`);
      continue;
    }

    // Top-level bullet or numbered list item
    if (line.match(/^[•\-*]\s/) || line.match(/^\d+[.)]\s/)) {
      closeNestedList();
      if (!inList) {
        formatted.push('<ul class="seerah-list">');
        inList = true;
      }
      const cleanLine = line.replace(/^[*\-•]\s*/, '').replace(/^\d+[.)]\s*/, '');
      // Label bullets: short text ending with ":" act as mini sub-headings
      const isLabel = cleanLine.endsWith(':') && cleanLine.length <= 50 && !cleanLine.includes('.');
      if (isLabel) {
        formatted.push(`<li class="seerah-li seerah-li-label">${applyInlineFormatting(cleanLine)}</li>`);
      } else {
        formatted.push(`<li class="seerah-li">${applyInlineFormatting(cleanLine)}</li>`);
      }
      continue;
    }

    // Non-list content — close any open list
    closeList();

    // ── Quranic verse / Hadith quote ─────────────────────────────────────────
    // Paragraphs starting with an opening quote that end with a known citation.
    const isQuranRef = /\(\s*(?:[A-Z][a-zA-Z\s\u00C0-\u024F-]*\s+)?\d+:\d+[^)]*\)\s*$/.test(line);
    const isHadithRef = /\(\s*(?:Ṣaḥīḥ\s+|Sahih\s+|Sunan\s+|Musnad\s+)?(?:Bukh[aā]r[iī]|Muslim|Tirmidh[iī]|Abu\s+Dawud|Nas[aā][iī]|Ibn\s+Majah|Ahmad|Muwatt[aā])[^)]*\)\s*$/i.test(line);
    if (/^["""]/.test(line) && (isQuranRef || isHadithRef)) {
      const label = isQuranRef ? 'Quranic Verse' : 'Hadith';
      formatted.push(`<blockquote class="seerah-verse"><span class="seerah-verse-label">${label}</span>${applyInlineFormatting(line)}</blockquote>`);
      continue;
    }

    // Regular paragraph
    formatted.push(`<p class="seerah-p">${applyInlineFormatting(line)}</p>`);
  }

  // Close any still-open structures
  closeList();
  closeTableFull();

  return formatted.join('\n');
}
