/**
 * EN→FR for sidebar explorer widgets (facts, miracles, prophecies).
 *
 *   node scripts/fr-source/translate-explorer-widgets.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { translate } from "google-translate-api-x";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const lib = path.join(root, "lib");
const cachePath = path.join(__dirname, "gt-cache.json");
const cache = fs.existsSync(cachePath)
  ? JSON.parse(fs.readFileSync(cachePath, "utf8"))
  : {};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function saveCache() {
  fs.writeFileSync(cachePath, JSON.stringify(cache));
}

async function tr(text) {
  if (text == null) return text;
  if (!String(text).trim()) return text;
  if (cache[text]) return cache[text];
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const res = await translate(text, { from: "en", to: "fr", forceBatch: false });
      const translated = typeof res.text === "string" ? res.text : String(res);
      if (translated && translated.trim()) {
        // Preserve ﷺ if the API strips it
        let out = translated;
        if (text.includes("ﷺ") && !out.includes("ﷺ")) {
          out = out.replace(/\b(le )?Prophète\b/gi, (m) => `${m} ﷺ`);
        }
        cache[text] = out;
        await sleep(60);
        return out;
      }
    } catch (e) {
      console.warn(`retry ${attempt + 1}:`, e?.message || e);
      await sleep(400 * (attempt + 1));
    }
  }
  console.warn("FAILED, keeping EN:", text.slice(0, 80));
  cache[text] = text;
  return text;
}

const CATEGORY_FR = {
  "Names and Titles": "Noms et titres",
  "Daily Life": "Vie quotidienne",
  Character: "Caractère",
  Worship: "Adoration",
  Mercy: "Miséricorde",
  Manners: "Bonnes manières",
  Family: "Famille",
  Legacy: "Héritage",
  "Warnings and Advice": "Avertissements et conseils",
  "Da'wah": "Daʿwa",
  "Speech and Communication": "Parole et communication",
  "Special Qualities": "Qualités particulières",
  Leadership: "Leadership",
  Companions: "Compagnons",
  "Qur'an Descriptions": "Descriptions coraniques",
  Children: "Enfants",
  Wives: "Épouses",
};

const TYPE_FR = {
  "Eternal Miracle": "Miracle éternel",
  "Cosmic Sign": "Signe cosmique",
  "Night Journey": "Voyage nocturne",
  Miʿraj: "Miʿrāj",
  "Divine Gift": "Don divin",
  "Water Miracle": "Miracle de l'eau",
  "Water Blessing": "Bénédiction de l'eau",
  "Answered Duʿāʾ": "Duʿāʾ exaucé",
  "Food Multiplication": "Multiplication de nourriture",
  "Food Blessing": "Bénédiction de nourriture",
  "Barakah in Wealth": "Baraka dans la richesse",
  "Barakah in Provision": "Baraka dans la provision",
  "Healing Miracle": "Miracle de guérison",
  "Sign from Creation": "Signe de la création",
  "Tree Miracle": "Miracle de l'arbre",
  "Divine Protection": "Protection divine",
  Prophecy: "Prophétie",
};

async function translateFacts() {
  const en = JSON.parse(fs.readFileSync(path.join(lib, "prophet-facts.json"), "utf8"));
  const out = [];
  for (let i = 0; i < en.length; i++) {
    const row = en[i];
    const clean_fact = await tr(row.clean_fact);
    const category = CATEGORY_FR[row.category] || (await tr(row.category));
    out.push({ id: row.id, clean_fact, category });
    if ((i + 1) % 25 === 0) {
      console.log(`facts ${i + 1}/${en.length}`);
      saveCache();
      fs.writeFileSync(path.join(lib, "prophet-facts-fr.json"), JSON.stringify(out, null, 2) + "\n");
    }
  }
  fs.writeFileSync(path.join(lib, "prophet-facts-fr.json"), JSON.stringify(out, null, 2) + "\n");
  console.log(`Wrote prophet-facts-fr.json (${out.length})`);
}

async function translateMiracles() {
  const en = JSON.parse(fs.readFileSync(path.join(lib, "prophet-miracles.json"), "utf8"));
  const out = [];
  for (let i = 0; i < en.length; i++) {
    const row = en[i];
    const fact = await tr(row.fact);
    const type = TYPE_FR[row.type] || (await tr(row.type));
    out.push({ id: row.id, fact, type, reference: row.reference });
    if ((i + 1) % 10 === 0) console.log(`miracles ${i + 1}/${en.length}`);
  }
  fs.writeFileSync(path.join(lib, "prophet-miracles-fr.json"), JSON.stringify(out, null, 2) + "\n");
  console.log(`Wrote prophet-miracles-fr.json (${out.length})`);
}

async function translateProphecies() {
  const en = JSON.parse(fs.readFileSync(path.join(lib, "prophet-prophecies.json"), "utf8"));
  const out = [];
  for (let i = 0; i < en.length; i++) {
    const row = en[i];
    const fact = await tr(row.fact);
    const fulfillment = await tr(row.fulfillment);
    out.push({ id: row.id, fact, fulfillment, reference: row.reference });
    if ((i + 1) % 10 === 0) console.log(`prophecies ${i + 1}/${en.length}`);
  }
  fs.writeFileSync(path.join(lib, "prophet-prophecies-fr.json"), JSON.stringify(out, null, 2) + "\n");
  console.log(`Wrote prophet-prophecies-fr.json (${out.length})`);
}

const mode = process.argv[2] || "all";
try {
  if (mode === "facts" || mode === "all") await translateFacts();
  if (mode === "miracles" || mode === "all") await translateMiracles();
  if (mode === "prophecies" || mode === "all") await translateProphecies();
  saveCache();
  console.log("DONE");
} catch (e) {
  saveCache();
  console.error(e);
  process.exit(1);
}
