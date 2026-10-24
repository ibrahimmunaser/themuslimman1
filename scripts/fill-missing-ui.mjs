import fs from "fs";

const LANGS = [
  ["bn", "bn"], ["fa", "fa"], ["ur", "ur"], ["hi", "hi"], ["zh", "zh-CN"],
  ["id", "id"], ["ms", "ms"], ["ru", "ru"], ["sw", "sw"], ["es", "es"], ["de", "de"], ["tr", "tr"],
];
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const src = fs.readFileSync("lib/ui-strings.ts", "utf8");
const body = src.slice(0, src.indexOf("export type UiStringKey"));
const re = /^\s*(\w+):\s*\{\s*en:\s*"((?:\\.|[^"\\])*)"/gm;
const uiEn = {};
let m;
while ((m = re.exec(body))) uiEn[m[1]] = JSON.parse(`"${m[2]}"`);

function protect(s) {
  return s
    .replace(/ﷺ/g, "XSAWSX")
    .replace(/\{(n|m|s|title|name|date|price|part|duration|status)\}/g, (_, k) => `[[${k}]]`);
}
function restore(s) {
  return s.replace(/XSAWSX/g, "ﷺ").replace(/\[\[(\w+)\]\]/g, "{$1}");
}

async function call(tl, texts) {
  const bodyText = texts.map((t) => "q=" + encodeURIComponent(t)).join("&");
  const res = await fetch(`https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=en&tl=${tl}`, {
    method: "POST",
    headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded" },
    body: bodyText,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.map((item, i) => (typeof item === "string" ? item : Array.isArray(item) ? item[0] : texts[i]));
}

const sample = JSON.parse(fs.readFileSync("data/i18n/shell/bn.json", "utf8"));
const missing = Object.keys(uiEn).filter((k) => !sample.ui[k]);
console.log("filling", missing.length, missing.join(", "));
const english = missing.map((k) => protect(uiEn[k]));

for (const [code, tl] of LANGS) {
  const translated = (await call(tl, english)).map(restore);
  const file = `data/i18n/shell/${code}.json`;
  const pack = JSON.parse(fs.readFileSync(file, "utf8"));
  missing.forEach((key, i) => {
    pack.ui[key] = translated[i];
    pack.phrases[uiEn[key]] = translated[i];
  });
  fs.writeFileSync(file, JSON.stringify(pack));
  console.log(code, pack.ui.allFormatsRetention);
}
