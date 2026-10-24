import fs from "fs";

const src = fs.readFileSync("lib/ui-strings.ts", "utf8");
const end = src.indexOf("export type UiStringKey");
const body = src.slice(0, end);
const re = /^\s*(\w+):\s*\{\s*en:\s*"((?:\\.|[^"\\])*)"/gm;
const uiEn = {};
let m;
while ((m = re.exec(body))) {
  uiEn[m[1]] = JSON.parse(`"${m[2]}"`);
}

function cleanup(s) {
  return s
    .replace(/XSAWS+X?/g, "ﷺ")
    .replace(/XSWSX/g, "ﷺ")
    .replace(/XAZWJX/g, "ﷻ")
    .replace(/XALAYHISX/g, "عليه السلام")
    .replace(/XRADIALLAHAHX/g, "رضي الله عنها")
    .replace(/XRADIALLAH(?:'ın|'s|X)?/g, "رضي الله عنه")
    .replace(/XP+H?N+X/g, "{n}")
    .replace(/XP+H?M+X/g, "{m}")
    .replace(/XP+H?S+X/g, "{s}")
    .replace(/XP+H?(?:PART|PAR)X/g, "{part}")
    .replace(/XP+H?PRICEX/g, "{price}")
    .replace(/XP+H?TITLEX/g, "{title}")
    .replace(/XP+H?NAMEX/g, "{name}")
    .replace(/XP+H?DATEX/g, "{date}")
    .replace(/XP+H?DURATIONX/g, "{duration}")
    .replace(/XP+H?STATUSX/g, "{status}");
}

function trimExtra(en, translated) {
  let out = cleanup(translated).replace(/\s+/g, " ").trim();
  const needed = [...en.matchAll(/\{(\w+)\}/g)].map((x) => x[1]);
  const counts = {};
  for (const k of needed) counts[k] = (counts[k] || 0) + 1;
  for (const [k, want] of Object.entries(counts)) {
    const parts = out.split(`{${k}}`);
    const found = parts.length - 1;
    let extra = found - want;
    while (extra > 0 && parts.length > want + 1) {
      parts.pop();
      extra--;
    }
    out = parts.join(`{${k}}`).replace(/\s+/g, " ").trim();
  }
  return out;
}

const langs = ["id", "ms", "zh", "ru", "sw", "es", "de", "tr", "hi", "ur", "bn", "fa"];
const missing = Object.keys(uiEn).filter((k) => !JSON.parse(fs.readFileSync("data/i18n/shell/bn.json", "utf8")).ui[k]);
console.log("source keys", Object.keys(uiEn).length, "missing from bn", missing.length);
console.log(missing.join(", "));

for (const code of langs) {
  const file = `data/i18n/shell/${code}.json`;
  const pack = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const [key, en] of Object.entries(uiEn)) {
    if (pack.ui[key]) pack.ui[key] = trimExtra(en, pack.ui[key]);
  }
  for (const [en, value] of Object.entries(pack.phrases)) {
    pack.phrases[en] = trimExtra(en, value);
  }
  fs.writeFileSync(file, JSON.stringify(pack));
  const sw = code === "sw" ? pack.ui.partN + " | " + pack.ui.stageNofM + " | " + pack.ui.nParts : "";
  if (sw) console.log("sw sample", sw);
}
console.log("cleaned");
