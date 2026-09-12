import fs from "fs";
import path from "path";

const dir = "components/reference";
const files = [
  "family-household-content.tsx",
  "places-maps-content.tsx",
  "tribes-lineage-content.tsx",
  "battles-expeditions-content.tsx",
  "miracles-signs-content.tsx",
  "key-people-content.tsx",
  "important-terms-content.tsx",
];

let ok = true;
for (const f of files) {
  const c = fs.readFileSync(path.join(dir, f), "utf8");
  const hasLoc = c.includes('from "@/lib/loc"');
  const ternaries = (c.match(/isRtl \?[^\n]+/g) || []).filter(
    (x) => !x.includes('"rtl"') && !x.includes("'rtl'") && !x.includes("rotate"),
  );
  const arFields = [...c.matchAll(/(\w+)Ar:/g)].map((m) => m[1]);
  const frFields = new Set([...c.matchAll(/(\w+)Fr:/g)].map((m) => m[1]));
  const missingFr = [...new Set(arFields)].filter((b) => !frFields.has(b));
  const status = hasLoc && ternaries.length === 0 ? "OK" : "CHECK";
  if (status !== "OK" || missingFr.length) ok = false;
  console.log(
    `${status} ${f} | loc=${hasLoc} badTern=${ternaries.length} missingFrBases=${missingFr.slice(0, 8).join(",") || "none"}`,
  );
  if (ternaries.length) console.log("  ", ternaries.slice(0, 3));
}
console.log(ok ? "\nALL OK" : "\nNEEDS FIX");
process.exit(ok ? 0 : 1);
