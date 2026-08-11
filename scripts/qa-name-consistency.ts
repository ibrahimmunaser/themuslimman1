/**
 * Scan PART_CONTENT_AR for inconsistent spellings of key proper nouns/terms
 * across the corpus. With 10 independent translation batches, spelling drift
 * (hamza placement, alif variants, etc.) is the most likely real bug class.
 */
import { PART_CONTENT_AR } from "../lib/part-content-data-ar";

// Groups of variant spellings that SHOULD be unified. Each group = [canonical, ...variants]
// we search for ALL variants and report which parts use which variant.
const NAME_GROUPS: Record<string, string[]> = {
  "Muhammad+SAW": ["محمد ﷺ", "محمد صلى الله عليه وسلم"],
  "Abu Bakr": ["أبو بكر الصديق", "أبو بكر"],
  Umar: ["عمر بن الخطاب", "عمر بن الخطّاب"],
  Uthman: ["عثمان بن عفان", "عثمان بن عفّان"],
  Ali: ["علي بن أبي طالب", "عليّ بن أبي طالب"],
  Khadijah: ["خديجة بنت خويلد", "خديجة"],
  Aisha: ["عائشة", "عائشه"],
  Khalid: ["خالد بن الوليد"],
  Muadh: ["معاذ بن جبل"],
  Hamzah: ["حمزة بن عبد المطلب", "حمزة"],
  Quraysh: ["قريش"],
  Makkah: ["مكة المكرمة", "مكة"],
  Madinah: ["المدينة المنورة", "المدينة"],
  Badr: ["بدر"],
  Uhud: ["أُحد", "أحد"],
  Khaybar: ["خيبر"],
  BanuQurayzah: ["بني قريظة", "بني قريظه", "بنو قريظة"],
  Abyssinia: ["الحبشة", "الحبشه"],
  Negus: ["النجاشي", "النجاشى"],
  Hijrah: ["الهجرة", "الهجره"],
};

const HAMZA_RISK_PAIRS: [string, string][] = [
  ["إسلام", "اسلام"],
  ["إيمان", "ايمان"],
  ["أمة", "امة"],
  ["إذن", "اذن"],
];

console.log("=== Proper noun / term spelling distribution across 100 parts ===\n");

for (const [label, variants] of Object.entries(NAME_GROUPS)) {
  const perVariantParts: Record<string, number[]> = {};
  for (const v of variants) perVariantParts[v] = [];

  for (let n = 1; n <= 100; n++) {
    const text = (PART_CONTENT_AR[n]?.briefingText ?? "") + "\n" + (PART_CONTENT_AR[n]?.statementOfFactsText ?? "");
    for (const v of variants) {
      if (text.includes(v)) perVariantParts[v].push(n);
    }
  }

  const used = Object.entries(perVariantParts).filter(([, parts]) => parts.length > 0);
  if (used.length > 1) {
    console.log(`[VARIANT SPELLINGS] ${label}:`);
    for (const [v, parts] of used) {
      console.log(`  "${v}" → ${parts.length} parts (e.g. ${parts.slice(0, 6).join(",")})`);
    }
    console.log();
  }
}

console.log("\n=== Common hamza-drop typo risk scan (اسلام vs إسلام etc.) ===\n");
for (const [correct, risky] of HAMZA_RISK_PAIRS) {
  const partsWithRisky: number[] = [];
  for (let n = 1; n <= 100; n++) {
    const text = (PART_CONTENT_AR[n]?.briefingText ?? "") + "\n" + (PART_CONTENT_AR[n]?.statementOfFactsText ?? "");
    // word-boundary-ish check via space/punct lookaround using simple includes on padded text
    const re = new RegExp(`(^|[\\s(])${risky}([\\s).,؛:،]|$)`, "g");
    if (re.test(text)) partsWithRisky.push(n);
  }
  if (partsWithRisky.length > 0) {
    console.log(`Possible typo "${risky}" (should be "${correct}") in parts: ${partsWithRisky.join(",")}`);
  }
}
