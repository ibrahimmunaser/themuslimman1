import { PART_CONTENT_AR } from "../lib/part-content-data-ar";

function checkTag(html: string, tag: string): { open: number; close: number } {
  const open = (html.match(new RegExp(`<${tag}(\\s[^>]*)?>`, "g")) || []).length;
  const close = (html.match(new RegExp(`</${tag}>`, "g")) || []).length;
  return { open, close };
}

let bad = 0;
for (let n = 1; n <= 100; n++) {
  const html = PART_CONTENT_AR[n]?.briefingHtml;
  if (!html) continue;
  for (const tag of ["div", "span", "ul", "li", "table", "thead", "tbody", "tr", "blockquote", "strong", "em", "a", "h2", "h3", "p"]) {
    const { open, close } = checkTag(html, tag);
    if (open !== close) {
      bad++;
      console.log(`Part ${n}: <${tag}> mismatch open=${open} close=${close}`);
    }
  }
}
console.log(bad === 0 ? "\nAll tag pairs balanced across all 100 parts." : `\n${bad} mismatches found.`);
