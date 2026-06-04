import type { AudiencePath } from "./types";

/**
 * Editorial mapping: which learning paths each part belongs to.
 *
 * children — simplified path for children and families. Focuses on the main
 *            story, major events, character lessons, mercy, patience, courage,
 *            and family lessons. Skips heavy geopolitics, dense tribal background,
 *            advanced military detail, and complex historical analysis.
 *
 * complete — the full course for adults, parents, reverts, students, and
 *            serious learners. Includes all 100 parts.
 *
 * Every part includes "complete". Edit only this file to adjust path
 * assignments without touching the part catalog in content.ts.
 */
export const PART_AUDIENCES: Record<number, AudiencePath[]> = {
  // ── Pre-Islamic Arabia ────────────────────────────────────────────────────
  1:  ["complete"],                      // Arabian context — geographic detail
  2:  ["complete"],                      // Dense tribal migrations
  3:  ["complete"],                      // Yemen geopolitics
  4:  ["complete"],                      // Hirah / Persian buffer state
  5:  ["complete"],                      // Ghassanids / Byzantine geopolitics
  6:  ["complete"],                      // Makkah's guardians — political detail
  7:  ["children", "complete"],          // Monotheism → idolatry — essential religious setup
  8:  ["complete"],                      // Full religious landscape of Arabia
  9:  ["complete"],                      // Arabian society, tribes, honor code
  10: ["complete"],                      // Socio-economic detail

  // ── Birth & Early Life ────────────────────────────────────────────────────
  11: ["children", "complete"],          // Lineage of the Prophet ﷺ
  12: ["complete"],                      // Family of Hashim — detail
  13: ["children", "complete"],          // Early life and childhood
  14: ["children", "complete"],          // Character before prophethood — al-Ameen

  // ── Beginning of Revelation ───────────────────────────────────────────────
  15: ["children", "complete"],          // The First Revelation
  16: ["complete"],                      // Technical nature of revelation
  17: ["children", "complete"],          // Early phases of the call
  18: ["children", "complete"],          // Establishment of prayer
  19: ["children", "complete"],          // Transition to open preaching
  20: ["children", "complete"],          // Public proclamation in Makkah

  // ── Makkah — Persecution ──────────────────────────────────────────────────
  21: ["children", "complete"],          // Quraysh's opposition — mockery and pressure
  22: ["children", "complete"],          // Persecution — Bilal, Sumayyah, Yasir
  23: ["children", "complete"],          // Secrecy, Dar al-Arqam, first migration to Abyssinia
  24: ["complete"],                      // Quraysh diplomatic mission to Abyssinia — political detail
  25: ["complete"],                      // Escalation of hostilities — political
  26: ["children", "complete"],          // Conversions of Hamzah and Umar رضي الله عنهما
  27: ["complete"],                      // Clan politics and shifting strategies
  28: ["children", "complete"],          // The boycott — three years in Shi'b Abi Talib
  29: ["complete"],                      // Final negotiations — political offers
  30: ["children", "complete"],          // Year of Grief — Khadijah and Abu Talib
  31: ["children", "complete"],          // Journey to Taif — rejection and mercy
  32: ["complete"],                      // Pre-Hijrah da'wah to tribes — political detail
  33: ["complete"],                      // Transitional detail — eleventh year
  34: ["children", "complete"],          // Isra and Mi'raj

  // ── The Hijrah ────────────────────────────────────────────────────────────
  35: ["complete"],                      // First Pledge of Aqabah — political covenant
  36: ["complete"],                      // Second Pledge of Aqabah — political detail
  37: ["children", "complete"],          // Quraysh plot and the night of departure
  38: ["children", "complete"],          // The Migration to Madinah

  // ── Madinah Period ────────────────────────────────────────────────────────
  39: ["children", "complete"],          // Foundation of the Madinan community
  40: ["complete"],                      // Foundation of Islamic society — detail
  41: ["children", "complete"],          // Charter and ethical foundations / Constitution
  42: ["complete"],                      // In-depth Pact of Madinah analysis
  43: ["complete"],                      // Transition to armed defense — legal/theological
  44: ["complete"],                      // Pre-Badr military developments

  // ── Major Campaigns ───────────────────────────────────────────────────────
  45: ["children", "complete"],          // Battle of Badr — the defining battle
  46: ["complete"],                      // Badr — loyalty and family splits — detail
  47: ["complete"],                      // Aftermath of Badr — prisoners and policy
  48: ["complete"],                      // Strategic environment after Badr
  49: ["complete"],                      // Political/social landscape after Badr
  50: ["complete"],                      // Post-Badr conflicts
  51: ["complete"],                      // Early community actions year 3 AH
  52: ["complete"],                      // Military confrontations preceding Uhud
  53: ["children", "complete"],          // Battle of Uhud — overview and lessons
  54: ["complete"],                      // Preparations for Uhud — military detail
  55: ["complete"],                      // Force dispositions at Uhud — military detail
  56: ["complete"],                      // Opening of the battle of Uhud
  57: ["children", "complete"],          // The Great Reversal at Uhud — the core lesson
  58: ["children", "complete"],          // Defense of the Prophet ﷺ — sacrifice and loyalty
  59: ["children", "complete"],          // Aftermath of Uhud — grief, resolve, and lessons
  60: ["complete"],                      // Expedition of Hamra' al-Asad
  61: ["complete"],                      // Post-Uhud military engagements
  62: ["complete"],                      // Military/diplomatic years 4–5 AH
  63: ["children", "complete"],          // Battle of the Confederates — the Trench
  64: ["complete"],                      // Expedition against Banu Quraydhah
  65: ["children", "complete"],          // Banu al-Mustaliq — slander of Aisha + hypocrites
  66: ["complete"],                      // Strategic/diplomatic operations 6 AH
  67: ["children", "complete"],          // Treaty of Hudaybiyah
  68: ["complete"],                      // Socio-political impact of Hudaybiyah
  69: ["complete"],                      // Post-Hudaybiyah diplomatic outreach
  70: ["complete"],                      // Correspondence with Egypt — Muqawqas
  71: ["complete"],                      // Letters to Kisra and Yemen
  72: ["complete"],                      // Letter to Heraclius
  73: ["complete"],                      // Correspondence with Bahrayn
  74: ["complete"],                      // Correspondence with Yamamah
  75: ["complete"],                      // Letter to the Ghassanid
  76: ["complete"],                      // Kings of Oman
  77: ["complete"],                      // Dhu Qarad expedition
  78: ["complete"],                      // Conquest of Khaybar — strategic analysis
  79: ["complete"],                      // Khaybar strategic analysis
  80: ["complete"],                      // Khaybar aftermath
  81: ["complete"],                      // Post-coalition military campaigns
  82: ["complete"],                      // Northern expeditions 8th year AH

  // ── Final Years & Legacy ──────────────────────────────────────────────────
  83: ["children", "complete"],          // Road to the Conquest of Makkah
  84: ["children", "complete"],          // The Conquest of Makkah
  85: ["children", "complete"],          // Battles of Hunayn and Ta'if — pride, mercy, victory
  86: ["complete"],                      // Distribution at al-Ji'ranah — political detail
  87: ["children", "complete"],          // Hawazin delegation — mercy and forgiveness
  88: ["complete"],                      // Strategic consolidation 9th year AH
  89: ["complete"],                      // Tabuk — political/strategic context
  90: ["children", "complete"],          // Tabuk — hardship, sacrifice, extraordinary faith
  91: ["complete"],                      // Tabuk consequences and revelations
  92: ["complete"],                      // Proclamation of Bara'ah
  93: ["complete"],                      // Military leadership and ethics — analytical
  94: ["children", "complete"],          // Mass embrace of Islam
  95: ["complete"],                      // Year of Delegations
  96: ["children", "complete"],          // Impact and legacy of the Islamic call
  97: ["children", "complete"],          // The Farewell Pilgrimage
  98: ["complete"],                      // Expedition of Usamah ibn Zayd
  99: ["children", "complete"],          // The Final Days of the Prophet ﷺ
  100:["children", "complete"],          // The Household of the Prophet ﷺ
};
