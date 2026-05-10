const ERA_COLORS: Record<string, [string, string]> = {
  "pre-islamic":        ["#3d2a12", "#8B6F45"],
  "birth-early-life":   ["#1e1a35", "#7A6B9E"],
  "early-revelation":   ["#0d2e22", "#4A8C6E"],
  "makkah-persecution": ["#2e0d0d", "#8C4A4A"],
  "hijrah":             ["#0d1e2e", "#4A6E8C"],
  "madinah":            ["#1a2e0d", "#6E8C4A"],
  "campaigns":          ["#2e1a0d", "#8C6E4A"],
  "final-years":        ["#2e240d", "#C8A96E"],
};

export function eraGradient(era: string): { background: string } {
  const [from, to] = ERA_COLORS[era] ?? ["#18181b", "#3f3f46"];
  return { background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` };
}
