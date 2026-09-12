import fs from "fs";

const src = fs.readFileSync(
  new URL("../../../lib/part-titles-fr.ts", import.meta.url),
  "utf8",
);

const titles = {};
for (const m of src.matchAll(
  /(\d+)\s*:\s*\{\s*title:\s*"((?:\\.|[^"\\])*)"\s*,\s*subtitle:\s*"((?:\\.|[^"\\])*)"/g,
)) {
  titles[m[1]] = {
    title: m[2].replace(/\\"/g, '"').replace(/\\'/g, "'"),
    subtitle: m[3].replace(/\\"/g, '"').replace(/\\'/g, "'"),
  };
}

const eras = {};
const eraBlock = src.slice(src.indexOf("ERA_LABELS_FR"));
for (const m of eraBlock.matchAll(
  /"([^"]+)"\s*:\s*\{\s*label:\s*"((?:\\.|[^"\\])*)"/g,
)) {
  eras[m[1]] = m[2].replace(/\\"/g, '"').replace(/\\'/g, "'");
}

function dartStr(s) {
  return `'${s.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

let out =
  "/// French part titles/subtitles — mirrored from lib/part-titles-fr.ts\n";
out +=
  "const Map<int, ({String title, String subtitle})> kPartTitlesFr = {\n";
for (const n of Object.keys(titles).sort((a, b) => +a - +b)) {
  const v = titles[n];
  out += `  ${n}: (title: ${dartStr(v.title)}, subtitle: ${dartStr(v.subtitle)}),\n`;
}
out += "};\n\n";
out += "const Map<String, String> kEraNamesFr = {\n";
for (const [id, label] of Object.entries(eras)) {
  out += `  '${id}': ${dartStr(label)},\n`;
}
out += "};\n";

const dest = new URL("../lib/core/data/parts_titles_fr.dart", import.meta.url);
fs.writeFileSync(dest, out);
console.log(
  "wrote",
  dest.pathname,
  "parts",
  Object.keys(titles).length,
  "eras",
  Object.keys(eras).length,
);
