import fs from "fs";
const s = fs.readFileSync("lib/l10n/app_strings.dart", "utf8");
console.log("fr count", (s.match(/'fr':/g) || []).length);
console.log(s.split(/\n/).slice(0, 16).join("\n"));
console.log("---");
console.log(s.split(/\n/).find((l) => l.includes("'theMuslimMan'")));
console.log(s.split(/\n/).find((l) => l.includes("'welcomeTagline'"))?.slice(0, 200));
// dart analyze-ish: every map entry line should end with },
const bad = s
  .split(/\n/)
  .map((l, i) => [i + 1, l])
  .filter(
    ([, l]) =>
      /^\s+'[^']+':\s*\{/.test(l) && !/\},\s*$/.test(l) && !l.trim().endsWith(","),
  );
console.log("suspicious lines", bad.slice(0, 10));
