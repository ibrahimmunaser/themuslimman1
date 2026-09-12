import fs from "fs";

const path = "lib/ui-strings.ts";
const src = fs.readFileSync(path, "utf8");

// Match { en: "...", ar: "..." } (single-line, double-quoted strings with escapes)
const out = src.replace(
  /\{\s*en:\s*("(?:\\.|[^"\\])*")\s*,\s*ar:\s*("(?:\\.|[^"\\])*")\s*\}/g,
  (_m, en, ar) => `{ en: ${en}, ar: ${ar}, fr: ${en} }`
);

fs.writeFileSync(path, out);
const withFr = (out.match(/\bfr:/g) || []).length;
const enKeys = (out.match(/\ben:/g) || []).length;
console.log({ enKeys, withFr });
