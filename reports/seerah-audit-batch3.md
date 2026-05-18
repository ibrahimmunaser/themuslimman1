# Seerah Briefing Audit — Batch 3 (Parts 85–89)

Audited: 2026-05-18  
File: `lib/part-content-data.ts`  
Auditor: AI content audit

---

## Part 85

```
---
Part: 85
Title: The Third Stage of the Prophetic Mission: The Battles of Ḥunayn and Ṭā'if
Score: 8.5
Verdict: GOOD_ENOUGH
Clear errors: no
Encoding issues: no
Safe for public: yes
Safe for influencer: yes

Issues:
1. Severity: LOW | Category: Wording
   Text: "...is alluded to in the Qur'ān: [9:25–26]"
   Why: Surah 9:25–26 explicitly names "yawma Ḥunayn" — it is not an allusion
         but a direct reference. Saying "alluded to" understates the verse.
   Fix: Change to "is directly referenced in the Qur'ān" or "as Allāh mentions
         in the Qur'ān."
   Note: The citation itself (9:25–26) is correct and the quote is labeled
         "(approximate meaning)," which is good hedging on the translation.

2. Severity: LOW | Category: Rendering quality (HTML layer only)
   Text: Several prose narrative labels (e.g., "Durayd ibn al-Ṣimmah, an aged
         war expert, objected", "Two significant events during the march",
         "Amid the chaos, the Prophet ﷺ remained steadfast…") are rendered as
         <h2> elements in briefingHtml despite not being section headings in the
         markdown source.
   Why: Creates false visual hierarchy — minor UX issue.
   Fix: Render these as <p class="seerah-label"> or similar, not <h2>.
   Note: The briefingText markdown itself is correctly structured; this is a
         conversion/templating artifact.
---
```

### Detailed notes — Part 85

- **Text present:** Yes. Rich, multi-section lesson covering Ḥunayn and Ṭā'if.
- **Headings:** `##` and `###` used correctly throughout the markdown source.
- **Bullet lists:** Properly formatted with `-` prefix.
- **Tables:** Spoils table (`| Category | Quantity |`) is correct markdown syntax.
- **Callouts:** `> Historical Note:` / `> text` pattern used appropriately (×2).
- **Encoding:** Clean. All Arabic transliterations intact; no Ã/Â corruption.
- **Qur'anic citations:**
  - `[9:25–26]` — Surah At-Tawbah verse on Ḥunayn: **CORRECT** (explicitly names "yawma Ḥunayn").
  - `[Al-Qur'ān 110:1–3]` — Surah An-Naṣr: **CORRECT** (content and surah match).
- **Historical facts:** All standard, well-sourced Seerah content consistent with Ibn Hishām and al-Bukhārī:
  - Army of 12,000 ✓ | Ṣafwān's armor loan ✓ | ʿItāb ibn Usayd governor ✓
  - Dust-throwing at Ḥunayn ✓ | Al-Shaimā' foster sister ✓
  - Siege duration 10–20 days (hedged) ✓ | Manjanīq use ✓
  - Dhāt Anwāṭ incident and Prophet's rebuke ✓
- **Wording/hedging:** Historical Note callouts appropriately acknowledge source variation.

---

## Part 86

```
---
Part: 86
Title: The Distribution of Booty at al-Jiʿrānah and the Address to the Anṣār
Score: 9.0
Verdict: GOOD_ENOUGH
Clear errors: no
Encoding issues: no
Safe for public: yes
Safe for influencer: yes

Issues:
1. Severity: LOW | Category: Wording
   Text: "Ibn Isḥāq reports someone saying: 'By Allāh, the Messenger of Allāh
         ﷺ has been more kind to his own people.'"
   Why: Accurately attributed to Ibn Isḥāq as narrator, but no grading of the
         chain is given. The statement is already clearly attributed to "someone"
         (not a named Companion), which is adequate hedging.
   Fix: Could add "as a reported sentiment" or "(reported chain)" for
         completeness, but current phrasing is acceptable.
   Note: Not a fabrication; properly attributed to Ibn Isḥāq's sīrah narrative.
---
```

### Detailed notes — Part 86

- **Text present:** Yes. Well-structured with Summary, Lesson Purpose, Important Terms, Key Takeaways, and 4 numbered content sections.
- **Headings:** `##` for main sections, `###` for sub-sections — correct.
- **Bullet lists:** Properly formatted throughout.
- **Tables:** Specific Grants table (`| Recipient | Tribe/Status | Gift Received |`) correct markdown syntax.
- **Callouts:** All 5 Prophetic speech excerpts presented in `> blockquote` format, well labeled.
- **Encoding:** Clean.
- **Source attribution:**
  - Source Note cites Ibn Hishām 2/499–500 and Ṣaḥīḥ al-Bukhārī 2/620–621 — **CORRECT** references.
- **Historical facts:** All standard, well-established:
  - Ḥakīm ibn Ḥizām: 100 + 100 camels ✓ | Ṣafwān: 300 in batches of 100 ✓
  - Abū Sufyān: 100 camels + gold ✓
  - Zayd ibn Thābit distributing shares ✓
  - Saʿd ibn ʿUbādah as intermediary ✓
  - The full address to the Anṣār with all key points matches Bukhārī narration ✓
  - Khums explanation ("even this fifth is returned to you") matches hadith ✓
- **Wording:** All Prophetic quotes appropriately framed as reported speech. "Wordings vary across narrations" hedge at end is correct practice.
- **Religious safety:** The khums explanation is theologically accurate and not misleading.

---

## Part 87

```
---
Part: 87
Title: Briefing on Post-Ḥunayn Events: The Hawāzin Delegation and Return to Madīnah
Score: 8.5
Verdict: GOOD_ENOUGH
Clear errors: no
Encoding issues: no
Safe for public: yes
Safe for influencer: yes

Issues:
1. Severity: LOW | Category: Rendering quality (markdown structure)
   Text: "### Lesson Purpose" (uses ### instead of ##)
   Why: The Lesson Purpose section is a top-level section but marked with ###
         (h3) while all major sections below it use ## (h2). Minor structural
         inconsistency — Lesson Purpose appears visually subordinate to the
         Executive Summary that precedes it.
   Fix: Change "### Lesson Purpose" to "## Lesson Purpose" for structural
         consistency.

2. Severity: LOW | Category: Rendering quality (HTML layer only)
   Text: Several prose narrative labels ("The Prophet ﷺ asked a clarifying
         question", "They replied", "Initial dissent came from several leaders",
         "A contrast between two moments is highlighted") rendered as <h2> in
         briefingHtml.
   Why: Same conversion artifact as Part 85 — prose context in markdown becomes
         h2 in HTML.
   Fix: Render as labeled paragraphs rather than section headings.
---
```

### Detailed notes — Part 87

- **Text present:** Yes. Covers Hawāzin delegation negotiation, captive release, ʿumrah, and return to Madīnah.
- **Headings:** Mostly correct; one structural mismatch (`### Lesson Purpose` vs. `##` for main sections).
- **Bullet lists:** Correct throughout.
- **Numbered list (Chronology):** Properly formatted (7-step sequence).
- **Callouts:** `> blockquote` format used correctly for all Prophetic quotes.
- **Referenced Sources section:** Lists four standard references — appropriate for a briefing.
- **Encoding:** Clean.
- **Qur'anic citation:**
  - Yūsuf 12:90 — "Verily, he who fears Allāh and is patient…" — **CORRECT** citation and content; this verse appears during the Yusuf story in the Qur'an and is contextually appropriate here.
  - Minor note: The parenthetical gloss "(by obeying Him and avoiding sins)" is tafsir interpretation inserted into the translation — common educational practice, acceptable.
- **Historical facts:**
  - Delegation of 14 led by Zuhayr ibn Ṣard ✓ | 6,000 captives ✓
  - Six-fold compensation offer ✓ | ʿUyaynah's hesitation over elderly woman ✓
  - Garment given to each freed captive ✓
  - ʿUmrah from al-Jiʿrānah ✓ | ʿItāb ibn Usayd as governor ✓
  - Return in last six nights of Dhū al-Qaʿdah 8 AH ✓
- **Wording:** "Historical note" on source variation appropriately included.
- **References:** Ibn Hishām 2/389–501, Zād al-Maʿād 2/160–201, Fatḥ al-Bārī 8/3–58 — correct and standard references for this period.

---

## Part 88

```
---
Part: 88
Title: Strategic Consolidation of Arabia in the Ninth Year A.H.
Score: 9.0
Verdict: GOOD_ENOUGH
Clear errors: no
Encoding issues: no
Safe for public: yes
Safe for influencer: yes

Issues:
1. Severity: LOW | Category: Rendering quality (HTML layer only)
   Text: "The events of 9 A.H. show a coordinated strategy that combined" and
         "This dual approach" rendered as <h2> in briefingHtml.
   Why: Same prose-to-heading conversion artifact as other parts in this batch.
   Fix: Render as labeled paragraphs.
---
```

### Detailed notes — Part 88

- **Text present:** Yes. Comprehensive coverage of emissary missions and military expeditions of 9 A.H., including the ʿAdī ibn Ḥātim case study.
- **Headings:** ## for main sections (I–V), ### for sub-sections — correctly applied in markdown source.
- **Bullet lists:** Properly formatted with `-` prefix throughout.
- **Tables:** Emissaries table (16-row, 2-column) correctly formatted markdown. No encoding issues.
- **Callouts:** Two Historical Note callouts properly placed with `>` syntax.
- **Encoding:** Clean.
- **Qur'anic citations:**
  - `Sūrat an-Naṣr 110:1–2` — **CORRECT** (content and reference match).
  - `al-Ḥujurāt 49:4` — "Indeed, those who call you from behind the chambers — most of them do not reason." — **CORRECT**. This verse was revealed specifically about the Banū Tamīm delegation's conduct; its placement here is historically accurate.
- **Historical facts:**
  - Emissary list (16 entries): Consistent with Ibn Hishām and standard sīrah sources ✓
  - Platoon to Banū Tamīm under ʿUyaynah, ~50 horsemen, Muḥarram 9 AH ✓
  - ʿUṭārid ibn Ḥājib vs. Thābit ibn Qays (oration) and az-Zabraqān vs. Ḥassān ibn Thābit (poetry) ✓
  - Al-Aqraʿ ibn Ḥābis's remark on eloquence ✓
  - Platoon to Khathʿam under Qutbah ibn ʿĀmir (~20 men), Ṣafar 9 AH ✓
  - Mission to Banū Kilāb under ad-Ḍaḥḥāk ibn Sufyān, Rabīʿ al-Awwal 9 AH ✓
  - Expedition to Jeddah coast (~300 men) against Abyssinian raiders, Rabīʿ al-Ākhir 9 AH ✓
  - ʿAlī ibn Abī Ṭālib's expedition to destroy al-Qullus (~150 men), Rabīʿ al-Awwal 9 AH ✓
  - ʿAdī ibn Ḥātim's conversion dialogue — consistent with Bukhārī's narration ✓
  - ʿAdī described as Christian and taking one-quarter (priests' tithe) — matches sources ✓
  - Prophecies (woman from Ḥīrah to Kaʿbah, treasures of Kisrā, abundance) — standard authentic narration ✓
- **Wording:** All military outcomes described factually and without triumphalism; consequences of armed resistance framed as historical fact ("illustrating the consequences of continued armed opposition at that time") — appropriate contextualizing hedge.
- **Source note:** Four source references in statementOfFactsText correctly identify Ibn Hishām 2/499–501, 2/581; Zād al-Maʿād 2/160–205; Fatḥ al-Bārī 8/3–59; Musnad Aḥmad — all credible, correct references.

---

## Part 89

```
---
Part: 89
Title: The Expedition of Tabūk: A Strategic Response to Byzantine Expansionism
Score: 9.0
Verdict: GOOD_ENOUGH
Clear errors: no
Encoding issues: no
Safe for public: yes
Safe for influencer: yes

Issues:
1. Severity: LOW | Category: Rendering quality (HTML layer only)
   Text: "The expedition was named Jaysh al-ʿUsrah due to the conditions"
         rendered as <h2> in briefingHtml (same artifact as other parts).
   Why: This is a prose lead-in sentence in the markdown source, not a section
         heading, but converts to h2 in the HTML layer.
   Fix: Render as labeled paragraph.
---
```

### Detailed notes — Part 89

- **Text present:** Yes. Full coverage of Tabūk's geopolitical context, Byzantine threat, Madīnah's internal situation, mobilization, community response (donors table), and hypocrites.
- **Headings:** ## for major sections (I–V), ### for sub-sections — correctly structured in markdown.
- **Bullet lists:** Properly formatted throughout.
- **Tables:** Contributions table (6-row, 2-column) — correct markdown syntax. Content is accurate.
- **Callouts:** Source Note on Heraclius's intentions appropriately hedges disputed figures.
- **Encoding:** Clean.
- **Qur'anic citations:**
  - At-Tawbah 9:92 — "Those who came to you for mounts…" — **CORRECT** citation and content (verse about the weeping poor who lacked mounts).
  - At-Tawbah 9:79 — "Those who criticize the believers who give voluntarily…" — **CORRECT** citation and content (verse rebuking hypocrites who mocked donors).
- **Historical facts:**
  - Tabūk in Rajab 9 A.H. ✓
  - Shuraḥbīl ibn ʿAmr al-Ghassānī killed envoy al-Ḥārith ibn ʿUmayr al-Azdī ✓
  - Zayd ibn Ḥārithah commanded the Muʾtah force ✓
  - Masjid aḍ-Ḍirār (referenced in Qur'an 9:107) ✓
  - Nabataean traders reporting Byzantine preparations, vanguard at al-Balqāʾ ✓
  - Jaysh al-ʿUsrah name ✓
  - ʿUthmān's contributions + Prophet's ﷺ statement ("Nothing that ʿUthmān does after today will harm him") — authentic hadith in Tirmidhi and others ✓
  - Abū Bakr bringing all wealth, "I left for them Allāh and His Messenger" ✓
  - ʿUmar donating half his wealth ✓
  - Women's jewelry donations ✓
- **Wording/hedging:**
  - Heraclius section appropriately hedged: "Early historians report…"; "Sources report…"; Source Note on varying accounts.
  - Historical Note on tribal responses appropriately included.
  - Muʾtah described as "not a clear military victory" — accurate and fair.
- **Religious safety:** Hypocrites described in terms consistent with Qur'anic framing (Sūrat at-Tawbah); no inappropriate generalizations.

---

## Batch 3 Summary

```
=== BATCH 3 SUMMARY (Parts 85–89) ===

GOOD_ENOUGH:                5  (Parts 85, 86, 87, 88, 89)
GOOD_ENOUGH_WITH_MINOR_EDITS: 0
NEEDS_TARGETED_FIXES:       0
NOT_GOOD_ENOUGH:            0

CRITICAL issues: none
HIGH issues:     none
MEDIUM issues:   none
LOW issues:
  - Part 85: "alluded to" should be "directly referenced" for Qur'an 9:25–26
              (the verse explicitly names Ḥunayn).
  - Part 85, 87, 88, 89: HTML briefingHtml converts prose narrative labels to
              <h2> headings (conversion artifact; markdown source is clean).
  - Part 87: "### Lesson Purpose" should be "## Lesson Purpose" for structural
              consistency with the rest of the document.
  - Part 87: Tafsir gloss inserted in Yūsuf 12:90 translation — acceptable
              educational practice but could be moved to a footnote.

Average score:  8.8 / 10

Qur'anic citations verified:
  ✓ 9:25–26 (Ḥunayn verse, At-Tawbah)
  ✓ 110:1–3 (An-Naṣr, ×2 instances in Parts 85 and 88)
  ✓ 12:90 (Yūsuf, Part 87)
  ✓ 49:4 (Al-Ḥujurāt, Banū Tamīm, Part 88)
  ✓ 9:92 (Weeping poor, At-Tawbah, Part 89)
  ✓ 9:79 (Mockers of donors, At-Tawbah, Part 89)
  — All 6 citations checked and confirmed correct.

No fabricated hadith, false attributions, wrong people/events, or inappropriate
wording found. All 5 parts are safe to publish.

=== END BATCH 3 ===
```
