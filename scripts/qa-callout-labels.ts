import { PART_CONTENT_AR } from "../lib/part-content-data-ar";

const RECOGNIZED =
  /^(Authenticity Note|Scholarly Caution|Historical Note|Source Note|Study Note|Editor Review Needed|تنبيه تاريخي|ملاحظة دراسية|ملاحظة مصدر|تنبيه علمي):?$/i;

const labelCounts = new Map<string, number[]>();

for (let n = 1; n <= 100; n++) {
  const text = PART_CONTENT_AR[n]?.briefingText;
  if (!text) continue;
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("> ") || line === ">") {
      const label = line.replace(/^>\s?/, "").trim();
      // Only consider first line of a blockquote block that looks like a short label
      if (label.length > 0 && label.length < 40 && !label.startsWith("«")) {
        const key = label.replace(/:$/, "");
        if (!labelCounts.has(key)) labelCounts.set(key, []);
        labelCounts.get(key)!.push(n);
      }
    }
  }
}

console.log("=== Blockquote label-like first-lines found across corpus ===\n");
for (const [label, parts] of [...labelCounts.entries()].sort((a, b) => b[1].length - a[1].length)) {
  const recognized = RECOGNIZED.test(label + ":");
  console.log(`${recognized ? "OK    " : "UNRECOGNIZED"} "${label}" → ${parts.length}x (parts: ${parts.slice(0, 8).join(",")}${parts.length > 8 ? "..." : ""})`);
}
