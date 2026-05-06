/**
 * Era visual configuration — drives the cinematic look of each timeline page.
 * Each era gets its own atmosphere, color identity, and mood text.
 */

export interface EraVisual {
  id: string;
  mood: string;
  themeWords: string[];
  /** Primary accent (lighter) */
  colorA: string;
  /** Secondary accent (darker) */
  colorB: string;
  /** Background dot/grid pattern color (with opacity in hex) */
  patternColor: string;
  /** Short poetic descriptor shown under the era label */
  atmosphere: string;
}

export const ERA_VISUALS: Record<string, EraVisual> = {
  "pre-islamic": {
    id: "pre-islamic",
    mood: "The world awaiting transformation",
    themeWords: ["Tribes", "Trade Routes", "Desert Arabia", "Jahiliyyah"],
    colorA: "#A07840",
    colorB: "#5A3A18",
    patternColor: "#8B6F4520",
    atmosphere: "A vast Arabian landscape — tribal fires, ancient trade routes, and a people without a guide.",
  },
  "birth-early-life": {
    id: "birth-early-life",
    mood: "A life chosen before time",
    themeWords: ["Lineage", "Noble Birth", "Providence", "Early Signs"],
    colorA: "#8A7AB0",
    colorB: "#3D3060",
    patternColor: "#7A6B9E20",
    atmosphere: "The arrival of a man whose life would become the light of the world.",
  },
  "early-revelation": {
    id: "early-revelation",
    mood: "The first light descends on the mountain",
    themeWords: ["Revelation", "Iqra", "Cave Hira", "The Call"],
    colorA: "#4AA87E",
    colorB: "#245040",
    patternColor: "#4A8C6E20",
    atmosphere: "A silent cave. A trembling heart. The word that split history in two.",
  },
  "makkah-persecution": {
    id: "makkah-persecution",
    mood: "Tested by fire, refined by faith",
    themeWords: ["Persecution", "Steadfastness", "Sacrifice", "Resilience"],
    colorA: "#C06060",
    colorB: "#602828",
    patternColor: "#8C4A4A20",
    atmosphere: "Every stone thrown, every taunt endured — a community forged under the most intense pressure.",
  },
  "hijrah": {
    id: "hijrah",
    mood: "A journey that changed the course of history",
    themeWords: ["Migration", "The Route", "Desert Path", "New Beginning"],
    colorA: "#5A90B0",
    colorB: "#2A4060",
    patternColor: "#4A6E8C20",
    atmosphere: "By night they left. By dawn they had changed history. The road to Madinah was the road to civilization.",
  },
  "madinah": {
    id: "madinah",
    mood: "Building the first Islamic civilization",
    themeWords: ["Brotherhood", "Governance", "The Mosque", "Constitution"],
    colorA: "#6AAE50",
    colorB: "#305828",
    patternColor: "#6E8C4A20",
    atmosphere: "From a city of welcome, the Prophet ﷺ built a society — brick by brick, heart by heart.",
  },
  "campaigns": {
    id: "campaigns",
    mood: "The trials of the Ummah in the arena of history",
    themeWords: ["Badr", "Uhud", "Strategy", "Defense", "Expansion"],
    colorA: "#B08040",
    colorB: "#604020",
    patternColor: "#8C6E4A20",
    atmosphere: "On the plains of history, the Ummah was tested — and through every trial, something enduring was built.",
  },
  "final-years": {
    id: "final-years",
    mood: "The mission fulfilled — the legacy eternal",
    themeWords: ["Conquest", "Farewell", "Completion", "Eternity"],
    colorA: "#D4AA60",
    colorB: "#806030",
    patternColor: "#C8A96E25",
    atmosphere: "The journey reaches its horizon. A final sermon. A final breath. And a message that would last forever.",
  },
};

export function getEraVisual(eraId: string): EraVisual {
  return ERA_VISUALS[eraId] ?? ERA_VISUALS["pre-islamic"];
}
