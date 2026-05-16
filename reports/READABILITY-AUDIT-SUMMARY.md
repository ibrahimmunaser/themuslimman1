# Seerah Readability Audit Summary

**Generated:** Fri, 15 May 2026 16:24:13 GMT

---

## 1. Scan Scope

| Metric | Count |
|--------|-------|
| Parts scanned | 100 / 100 |
| Parts with issues | 100 |
| Total issues found | 742 |
| High-severity issues | 92 |
| Launch-critical issues | 69 |
| Parts missing briefing | 0 |

---

## 2. Top Recurring Issue Types

| Issue Type | Count |
|-----------|-------|
| dense_paragraph_no_headings | 315 |
| repeated_short_lines_not_bullets | 105 |
| encoding_corruption | 93 |
| genealogy_chain_unstructured | 87 |
| tab_table_unrendered | 60 |
| nested_bullets_flattened | 46 |
| name_notes_mixed_in_list | 27 |
| caution_note_buried | 9 |

---

## 3. Renderer vs Source Split

| Fix Type | Issue Count |
|----------|------------|
| Renderer fix only | 115 |
| Source content fix only | 513 |
| Both (renderer + source) | 114 |

---

## 4. Highest-Priority Parts

- Part 1
- Part 2
- Part 6
- Part 7
- Part 11
- Part 12
- Part 13
- Part 17
- Part 19
- Part 20
- Part 21
- Part 22
- Part 25
- Part 26
- Part 28
- Part 29
- Part 30
- Part 31
- Part 32
- Part 34
- Part 35
- Part 36
- Part 37
- Part 38
- Part 39
- Part 41
- Part 42
- Part 44
- Part 45
- Part 46
- Part 47
- Part 48
- Part 49
- Part 51
- Part 52
- Part 53
- Part 54
- Part 55
- Part 56
- Part 57
- Part 58
- Part 59
- Part 60
- Part 61
- Part 62
- Part 63
- Part 64
- Part 65
- Part 66
- Part 67
- Part 68
- Part 69
- Part 71
- Part 72
- Part 75
- Part 76
- Part 78
- Part 79
- Part 80
- Part 81
- Part 82
- Part 83
- Part 84
- Part 88
- Part 89
- Part 90
- Part 91
- Part 92
- Part 93
- Part 94
- Part 96
- Part 97
- Part 100

---

## 5. Parts Missing Briefing

All parts have briefing text.

---

## 6. Recommended Safe Auto-Fixes (Low-Risk)

These can be applied without human review:

- **tab_table_unrendered** — Already fixed in renderer (tab-separated table support added).
- **nested_bullets_flattened** — Already fixed in renderer (indentation-aware list parsing added).
- **repeated_short_lines_not_bullets** — Conservative: flag for review, do not auto-rewrite sentences.

---

## 7. Issues Requiring Human Review

- **genealogy_chain_unstructured** — Separating lineage from name-notes requires judgment about content boundaries.
- **encoding_corruption** — Source files need manual re-encoding; cannot be auto-fixed in renderer.
- **caution_note_buried** — Detecting caution language and adding callout labels requires editorial review.
- **dense_paragraph_no_headings** — Adding headings requires content knowledge, not just pattern matching.

---

## 8. Part 1 Status

- **HIGH** [briefing] tab_table_unrendered: Content contains tab-separated columns that render as plain text without structure.
- **LOW** [briefing] dense_paragraph_no_headings: One or more paragraphs exceed 600 characters without an internal line break.
- **LOW** [briefing] dense_paragraph_no_headings: Long content block has no discernible heading structure.
- **LOW** [briefing] nested_bullets_flattened: Source contains indented bullet items (2+ spaces + *). These were previously rendered as flat bullets.
- **MEDIUM** [facts] repeated_short_lines_not_bullets: Found 1 cluster(s) of 4+ consecutive short sentences that should be a bullet list.

---

## 9. Renderer Improvements Already Deployed

| Fix | Status |
|-----|--------|
| Tab-separated table rendering | ✅ Deployed |
| Nested bullet list (indentation-aware) | ✅ Deployed |
| FactsViewer font size (text-sm → text-base) | ✅ Deployed |
| seerah-data-table CSS class | ✅ Deployed |
| seerah-nested-list CSS class | ✅ Deployed |

---

*Full issue list: `reports/readability-audit.json` and `reports/readability-audit.csv`*
