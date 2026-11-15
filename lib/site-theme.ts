/**
 * The site's 14 selectable appearance themes. Each one only specifies 4
 * colors (background, card/nav surface, accent, main text) — everything
 * else (secondary/muted text, borders, gold shades, surface levels) is
 * derived from these via color-mix() in globals.css's @theme block, using
 * one consistent formula for every theme. Mirrors the mobile app's
 * `AppThemeOption` / `kAppThemeOptions` (lib/core/theme/theme_options.dart)
 * so the same 14 looks are offered on both the website and the app.
 */
export interface SiteThemeOption {
  id: string;
  label: string;
  labelAr: string;
  labelFr: string;
  background: string;
  card: string;
  accent: string;
  text: string;
}

export const SITE_THEME_OPTIONS: SiteThemeOption[] = [
  { id: "blackGold", label: "Black & Gold", labelAr: "أسود وذهبي", labelFr: "Noir et or", background: "#0A0A0F", card: "#111118", accent: "#C8A96E", text: "#F0EBE3" },
  { id: "emeraldNight", label: "Emerald Night", labelAr: "ليل زمردي", labelFr: "Nuit émeraude", background: "#071A14", card: "#102A21", accent: "#6ED6A5", text: "#F0F7F2" },
  { id: "midnightBlue", label: "Midnight Blue", labelAr: "أزرق منتصف الليل", labelFr: "Bleu de minuit", background: "#080F20", card: "#14213A", accent: "#80B8FF", text: "#F2F6FF" },
  { id: "royalPlum", label: "Royal Plum", labelAr: "بنفسجي ملكي", labelFr: "Prune royale", background: "#180F20", card: "#2B1C35", accent: "#C5A3E8", text: "#F8F1FC" },
  { id: "warmMocha", label: "Warm Mocha", labelAr: "موكا دافئ", labelFr: "Moka chaleureux", background: "#191411", card: "#2B231D", accent: "#D9B38C", text: "#FAF3EA" },
  { id: "ivoryForest", label: "Ivory & Forest", labelAr: "عاجي وغابي", labelFr: "Ivoire et forêt", background: "#F7F4EB", card: "#EAE7DC", accent: "#245741", text: "#202D25" },
  { id: "softSage", label: "Soft Sage", labelAr: "أخضر مريمية هادئ", labelFr: "Sauge douce", background: "#F0F4EE", card: "#E1E9DE", accent: "#42634B", text: "#243429" },
  { id: "sandTerracotta", label: "Sand & Terracotta", labelAr: "رملي وطيني", labelFr: "Sable et terre cuite", background: "#FAF2E8", card: "#EFE1D0", accent: "#9C4934", text: "#392A23" },
  { id: "obsidianSilver", label: "Obsidian & Silver", labelAr: "سبج وفضي", labelFr: "Obsidienne et argent", background: "#101113", card: "#202226", accent: "#C5CAD3", text: "#F5F5F7" },
  { id: "oceanTeal", label: "Ocean Teal", labelAr: "أزرق محيطي", labelFr: "Bleu océan", background: "#071C22", card: "#102F36", accent: "#66D4D0", text: "#EFFBFA" },
  { id: "burgundyRose", label: "Burgundy & Rose", labelAr: "عنابي ووردي", labelFr: "Bordeaux et rose", background: "#210F16", card: "#361C26", accent: "#E5A0B4", text: "#FFF2F5" },
  { id: "pearlSapphire", label: "Pearl & Sapphire", labelAr: "لؤلؤي وياقوتي", labelFr: "Perle et saphir", background: "#F3F6FC", card: "#E5EBF5", accent: "#315BA8", text: "#1C2940" },
  { id: "blushRosewood", label: "Blush & Rosewood", labelAr: "وردي وخشب الورد", labelFr: "Rose poudré et bois de rose", background: "#FCF3F5", card: "#F2E2E7", accent: "#984C65", text: "#412B34" },
  { id: "oliveLinen", label: "Olive & Linen", labelAr: "زيتوني وكتاني", labelFr: "Olive et lin", background: "#F5F3E8", card: "#E8E5D3", accent: "#626B35", text: "#303422" },
];

export const SITE_THEME_STORAGE_KEY = "seerah_site_theme";
export const DEFAULT_SITE_THEME_ID = SITE_THEME_OPTIONS[0].id;

export function siteThemeById(id: string | null | undefined): SiteThemeOption {
  return SITE_THEME_OPTIONS.find((t) => t.id === id) ?? SITE_THEME_OPTIONS[0];
}

/** Inline script source — set as `data-theme` on <html> before paint (no
 * FOUC) by reading the same localStorage key the ThemeToggle writes to.
 * Deliberately has no dependency on React/Next.js chunks since it must run
 * synchronously in <head>, before hydration. */
export const SITE_THEME_ANTI_FLASH_SCRIPT = `
(function () {
  try {
    var id = localStorage.getItem(${JSON.stringify(SITE_THEME_STORAGE_KEY)});
    if (id) document.documentElement.setAttribute("data-theme", id);
  } catch (e) {}
})();
`;
