import { PART_CONTENT_AR } from "../lib/part-content-data-ar";

let calloutCount = 0;
let plainBlockquoteWithShortLabelCount = 0;
const stillPlain: { part: number; snippet: string }[] = [];

for (let n = 1; n <= 100; n++) {
  const html = PART_CONTENT_AR[n]?.briefingHtml;
  if (!html) continue;
  calloutCount += (html.match(/seerah-callout-label/g) || []).length;

  // Find plain <blockquote>...</blockquote> (not seerah-verse) whose text starts
  // with a short label-like Arabic word — these are the ones that should have
  // been converted to seerah-callout but weren't.
  const plainBqRe = /<blockquote>((?:ملاحظ|تنبيه)[^<]{0,60})<\/blockquote>/g;
  let m;
  while ((m = plainBqRe.exec(html))) {
    plainBlockquoteWithShortLabelCount++;
    stillPlain.push({ part: n, snippet: m[1].slice(0, 60) });
  }
}

console.log("Total seerah-callout labels rendered:", calloutCount);
console.log("Plain blockquotes still starting with ملاحظ/تنبيه:", plainBlockquoteWithShortLabelCount);
for (const s of stillPlain.slice(0, 20)) {
  console.log(`  Part ${s.part}: "${s.snippet}"`);
}
