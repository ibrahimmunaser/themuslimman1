import { PART_CONTENT_AR } from "../lib/part-content-data-ar";

let count = 0;
for (let n = 1; n <= 100; n++) {
  const html = PART_CONTENT_AR[n]?.briefingHtml;
  if (!html) continue;
  const re = /<span class="seerah-callout-body">(-\s[^<]*)<\/span>/g;
  let m;
  while ((m = re.exec(html))) {
    count++;
    console.log(`Part ${n}: "${m[1].slice(0, 80)}"`);
  }
  const bq = /<blockquote>(-\s[^<]*)<\/blockquote>/g;
  while ((m = bq.exec(html))) {
    count++;
    console.log(`Part ${n} [plain-bq]: "${m[1].slice(0, 80)}"`);
  }
}
console.log(`\nTotal leaked-dash occurrences: ${count}`);
