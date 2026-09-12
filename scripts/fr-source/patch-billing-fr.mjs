/**
 * One-shot: patch billing page AR/EN ternaries to loc(lang, en, ar, fr).
 * Run: node scripts/fr-source/patch-billing-fr.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, "..", "..", "app", "billing", "page.tsx");
let s = fs.readFileSync(file, "utf8");

if (!s.includes('from "@/lib/loc"')) {
  s = s.replace(
    'import { parseLang, COURSE_LANG_COOKIE } from "@/lib/course-lang";',
    'import { parseLang, COURSE_LANG_COOKIE } from "@/lib/course-lang";\nimport { loc } from "@/lib/loc";',
  );
}

// Replace formatDate signature usage: formatDate(x, ar) -> formatDate(x, lang)
s = s.replace(
  /function formatDate\(d: Date, ar: boolean\) \{[\s\S]*?^\}/m,
  `function formatDate(d: Date, lang: "en" | "ar" | "fr") {
  if (lang === "ar") {
    return new Intl.DateTimeFormat("ar", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
      numberingSystem: "arab",
    }).format(d);
  }
  if (lang === "fr") {
    return new Intl.DateTimeFormat("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    }).format(d);
  }
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return \`\${months[d.getUTCMonth()]} \${d.getUTCDate()}, \${d.getUTCFullYear()}\`;
}`,
);

s = s.replace(/formatDate\(([^,]+),\s*ar\)/g, "formatDate($1, lang)");

// Keep `ar` for RTL dir only
// Plan names — replace block
s = s.replace(
  /const planName = isFamilyMonthly && isTrial\n[\s\S]*?: \(ar \? "السيرة النبوية الكاملة" : PLANS\.complete\.name\);/,
  `const planName = isFamilyMonthly && isTrial
    ? loc(lang, PLANS.familyTrial.name, "تجربة العائلة", "Essai Famille")
    : isFamilyMonthly
    ? loc(lang, PLANS.familyMonthly.name, "عضوية العائلة", "Abonnement Famille")
    : isFamilyLifetime
    ? loc(lang, PLANS.family.name, "وصول العائلة", "Accès Famille")
    : isMonthly && isTrial
    ? loc(lang, PLANS.individualTrial.name, "تجربة فردية", "Essai Individuel")
    : isMonthly
    ? loc(lang, PLANS.monthly.name, "العضوية الفردية", "Abonnement Individuel")
    : loc(lang, PLANS.complete.name, "السيرة النبوية الكاملة", "Complete Seerah");`,
);

s = s.replace(
  /const planSubtitle = isFamilyMonthly \|\| isFamilyLifetime\n[\s\S]*?: \(ar \? "وصول كامل إلى رحلة السيرة المنظمة في ١٠٠ جزء" : PLANS\.complete\.subtitle\);/,
  `const planSubtitle = isFamilyMonthly || isFamilyLifetime
    ? loc(lang, PLANS.family.subtitle, "حساب واحد للأسرة مع حتى ٥ ملفات متعلّمين", "Un compte foyer avec jusqu'à 5 profils d'apprenants")
    : isTrial
    ? loc(lang, PLANS.individualTrial.subtitle, "٧ أيام من الوصول الكامل", "7 jours d'accès complet")
    : isMonthly
    ? loc(lang, PLANS.monthly.subtitle, "وصول كامل طوال فترة الاشتراك", "Accès complet pendant toute la durée de l'abonnement")
    : loc(lang, PLANS.complete.subtitle, "وصول كامل إلى رحلة السيرة المنظمة في ١٠٠ جزء", "Accès complet au parcours structuré de la Sîra en 100 parties");`,
);

// FEATURES maps
if (!s.includes("FEATURES_FR")) {
  s = s.replace(
    /const FEATURES_AR: Record<string, string> = \{[\s\S]*?\};\n\n  const planFeatures/,
    (match) => {
      const fr = `const FEATURES_FR: Record<string, string> = {
    "All 100 Seerah parts": "Les 100 parties de la Sîra",
    "Video lessons": "Leçons vidéo",
    "Audio lessons": "Leçons audio",
    "Summaries and briefings": "Résumés et briefings",
    "Quizzes": "Quiz",
    "Flashcards": "Flashcards",
    "Mind maps": "Cartes mentales",
    "Visual learning resources": "Ressources d'apprentissage visuelles",
    "Progress tracking": "Suivi de progression",
    "Lifetime access to the full course": "Accès à vie au cours complet",
    "Start today. Continue at your own pace.": "Commencez aujourd'hui. Continuez à votre rythme.",
    "Videos, quizzes, flashcards, mind maps": "Vidéos, quiz, flashcards, cartes mentales",
    "Progress dashboard · Mobile friendly": "Tableau de progression · Compatible mobile",
    "Cancel anytime": "Résiliez à tout moment",
    "One household account": "Un compte foyer",
    "Up to 5 learner profiles": "Jusqu'à 5 profils d'apprenants",
    "Separate progress for every course asset": "Progression séparée pour chaque ressource",
    "Video, audio, briefings, slides, infographics": "Vidéo, audio, briefings, diapositives, infographies",
    "Quizzes, flashcards, and mind maps": "Quiz, flashcards et cartes mentales",
    "Parent progress dashboard": "Tableau de progression parental",
    "Easy profile switching": "Changement de profil facile",
    "Start today. Everyone learns at their own pace.": "Commencez aujourd'hui. Chacun apprend à son rythme.",
    "Up to 5 separate learner profiles": "Jusqu'à 5 profils d'apprenants distincts",
    "Each profile tracks progress independently": "Chaque profil suit sa progression indépendamment",
  };

  const planFeatures`;
      return match.replace("const planFeatures", fr);
    },
  );
}

s = s.replace(
  /\.slice\(0, 8\)\.map\(\(f\) => \(ar \? \(FEATURES_AR\[f\] \?\? f\) : f\)\);/,
  `.slice(0, 8).map((f) => (lang === "ar" ? (FEATURES_AR[f] ?? f) : lang === "fr" ? (FEATURES_FR[f] ?? f) : f));`,
);

// Simple string ternaries: (ar ? "AR" : "EN") -> loc(lang, "EN", "AR", "FR")
// We'll do known pairs via a map
const pairs = [
  ["Billing & Plan", "الفواتير والخطة", "Facturation et plan"],
  ["Your plan details and billing history.", "تفاصيل خطتك وسجل الفواتير.", "Détails de votre plan et historique de facturation."],
  ["Upgraded to Family Monthly", "تمت الترقية إلى عضوية العائلة الشهرية", "Passage à Famille Mensuel"],
  ["Payment failed — please update your card", "فشل الدفع — يرجى تحديث بطاقتك", "Échec du paiement — veuillez mettre à jour votre carte"],
  ["Update payment method", "تحديث طريقة الدفع", "Mettre à jour le moyen de paiement"],
  ["Contact support", "تواصل مع الدعم", "Contacter le support"],
  ["Past due", "متأخر", "En retard"],
  ["Active", "نشط", "Actif"],
  ["month", "شهر", "mois"],
  ["One-time payment", "دفعة واحدة", "Paiement unique"],
  ["Lifetime access", "وصول مدى الحياة", "Accès à vie"],
  ["Update your card, view invoices, or change billing details.", "حدّث بطاقتك، اعرض الفواتير، أو غيّر تفاصيل الفوترة.", "Mettez à jour votre carte, consultez les factures ou modifiez les détails de facturation."],
  ["Manage billing", "إدارة الفواتير", "Gérer la facturation"],
  ["Upgrade to Family Lifetime", "الترقية إلى وصول العائلة مدى الحياة", "Passer à Famille à vie"],
  ["Upgrade for $79", "الترقية بـ $79", "Passer à $79"],
  ["One-time · Monthly subscription cancelled automatically", "دفعة واحدة · يُلغى الاشتراك الشهري تلقائيًا", "Paiement unique · Abonnement mensuel annulé automatiquement"],
  ["Upgrade to Individual Lifetime", "الترقية إلى الوصول الفردي مدى الحياة", "Passer à Individuel à vie"],
  ["Lifetime Access — $49", "وصول مدى الحياة — $49", "Accès à vie — $49"],
  ["One-time · Subscription cancelled automatically", "دفعة واحدة · يُلغى الاشتراك تلقائيًا", "Paiement unique · Abonnement annulé automatiquement"],
  ["Purchase History", "سجل المشتريات", "Historique des achats"],
  ["Paid", "مدفوع", "Payé"],
  ["Questions about billing?", "أسئلة حول الفواتير؟", "Questions sur la facturation ?"],
];

for (const [en, ar, fr] of pairs) {
  const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`\\(ar \\? "${esc(ar)}" : "${esc(en)}"\\)`, "g");
  s = s.replace(re, `loc(lang, "${en}", "${ar}", "${fr}")`);
  // also without parens when used as JSX child expression
  const re2 = new RegExp(`\\{ar \\? "${esc(ar)}" : "${esc(en)}"\\}`, "g");
  s = s.replace(re2, `{loc(lang, "${en}", "${ar}", "${fr}")}`);
}

fs.writeFileSync(file, s);
console.log("patched billing page length", s.length);
console.log("loc count", (s.match(/loc\(lang,/g) || []).length);
console.log("remaining ar ?", (s.match(/ar \?/g) || []).length);
