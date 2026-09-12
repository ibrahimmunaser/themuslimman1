/**
 * Safely inject French into app_strings.dart (one entry per line).
 */
import fs from "fs";

const path = new URL("../lib/l10n/app_strings.dart", import.meta.url);
let src = fs.readFileSync(path, "utf8");

const FR = {
  navHome: "Accueil",
  navLessons: "Leçons",
  navResources: "Ressources",
  navReference: "Référence",
  navProgress: "Progression",
  back: "Retour",
  language: "Langue",
  cancel: "Annuler",
  save: "Enregistrer",
  done: "Terminé",
  edit: "Modifier",
  delete: "Supprimer",
  close: "Fermer",
  ok: "OK",
  clear: "Effacer",
  retry: "Réessayer",
  tryAgain: "Réessayer",
  viewPlans: "Voir les formules",
  continueLearning: "Continuer l'apprentissage",
  goBack: "Retour",
  next: "Suivant",
  prev: "Préc.",
  searchEllipsis: "Rechercher…",
  parts: "parties",
  partsLabel: "Parties",
  nPartsSuffix: "{n} parties",
  locked: "Verrouillé",
  studied: "Étudié",
  completed: "Terminé",
  signIn: "Se connecter",
  claim: "Réclamer",
  offlineBannerBody:
    "Impossible d'atteindre le serveur — affichage de votre dernière progression. Tirez vers le bas pour réessayer.",
  welcomeTitleLine1: "Sîra complète",
  welcomeReturning: "Déjà inscrit ?",
  welcomeCourseHeadline: "Cours de Sîra en 100 parties",
  welcomeTagline:
    "Apprenez la vie du\nProphète Muhammad ﷺ\nen 100 parties structurées",
  welcomeFormats: "Regarder, écouter ou lire",
  welcomeStartFree: "Commencer la partie 1 gratuitement",
  welcomeStartFull: "Commencer le cours complet",
  welcomeAlreadyAccess: "Vous avez déjà accès ? Connectez-vous",
  welcomeRestore: "Restaurer l'achat",
  welcomeRestoreSuccess: "Achat restauré ! Accès complet débloqué.",
  welcomeRestoreNone: "Aucun achat précédent trouvé.",
  welcomeRestoreError:
    "Impossible de restaurer les achats. Veuillez réessayer.",
  welcomeSubtext:
    "Leçons vidéo, quiz, flashcards et suivi de progression — pour apprendre étape par étape.",
  featureWatchListenRead: "Regarder, écouter ou lire",
  featureWatchListenReadDetail: "Vidéo · Audio · Lecture",
  featurePracticeReview: "S'exercer et réviser",
  featurePracticeReviewDetail: "Flashcards · Quiz · Diapositives",
  featureTrackProgress: "Suivre votre progression",
  featureTrackProgressDetail: "Reprenez où vous vous êtes arrêté",
  choosePlan: "Choisissez votre formule",
  purchaseCancelled: "Achat annulé.",
  noPurchasesToRestore: "Aucun achat précédent à restaurer.",
  jazakAllahKhayran: "JazakAllahu Khayran !",
  purchaseSuccessBody:
    "Votre achat a réussi. L'accès complet est débloqué. Qu'Allah bénisse votre apprentissage.",
  startLearning: "Commencer à apprendre",
  whatsIncluded: "Ce qui est inclus",
  includedVideos: "100 leçons vidéo structurées",
  includedNotes: "Notes de lecture et briefings",
  includedQuizzes: "Quiz et flashcards",
  includedLifetime: "Option d'accès à vie disponible",
  includedProgress: "Suivi de progression",
  couldNotStartCheckout:
    "Impossible de démarrer le paiement. Veuillez réessayer.",
  purchaseAlreadyProcessing:
    "Un achat est déjà en cours. Veuillez patienter.",
  noAccountRequired:
    "Aucun compte requis pour acheter. Touchez une formule pour acheter.",
  restorePurchases: "Restaurer les achats",
  alreadyLearningSignIn:
    "Vous apprenez déjà sur un autre appareil ? Connectez-vous",
  planMonthly: "Mensuel",
  planLifetime: "À vie",
  mostPopular: "Le plus populaire",
  oneLearnerPayOnce: "1 apprenant • payer une fois, pour toujours",
  oneLearnerCancelAnytime: "1 apprenant • annuler à tout moment",
  payOnce: "payer une fois",
  perMonth: "/mois",
  instantAccess: "Accès immédiat",
  cancelAnytime: "Annuler à tout moment",
  watchPart1: "Voir la partie 1",
  part1NoAccountNeeded:
    "Le contexte arabique préislamique · Aucun compte requis",
  part1AlwaysFree: "Partie 1 — Toujours gratuite",
  lessons: "Leçons",
  searchPartsEllipsis: "Rechercher des parties…",
  noPartsFound: "Aucune partie trouvée",
  tryDifferentSearch: "Essayez une autre recherche",
  profile: "Profil",
  settings: "Paramètres",
  account: "Compte",
  signOut: "Se déconnecter",
  pageNotFound: "Page introuvable",
  goHome: "Accueil",
  theMuslimMan: "The Muslim Man",
};

function dartQuote(s) {
  return `'${s
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")}'`;
}

/** Extract balanced single-quoted dart string starting at index i (on '). */
function readDartString(line, i) {
  if (line[i] !== "'") return null;
  let j = i + 1;
  let out = "";
  while (j < line.length) {
    const c = line[j];
    if (c === "\\") {
      out += c + (line[j + 1] ?? "");
      j += 2;
      continue;
    }
    if (c === "'") return { value: out, end: j + 1, raw: line.slice(i, j + 1) };
    out += c;
    j++;
  }
  return null;
}

const lines = src.split(/\r?\n/);
const out = [];
let patched = 0;

for (let line of lines) {
  const keyMatch = line.match(/^(\s*)'([^']+)':\s*\{(.*)\},?\s*$/);
  if (!keyMatch) {
    out.push(line);
    continue;
  }
  const [, indent, key, body] = keyMatch;
  if (/\b'fr'\s*:/.test(body)) {
    out.push(line);
    continue;
  }

  // Find 'en': '...'
  const enIdx = body.indexOf("'en'");
  if (enIdx < 0) {
    out.push(line);
    continue;
  }
  const colon = body.indexOf(":", enIdx);
  let p = colon + 1;
  while (body[p] === " ") p++;
  const enStr = readDartString(body, p);
  if (!enStr) {
    out.push(line);
    continue;
  }

  const frLit =
    FR[key] != null ? dartQuote(FR[key]) : enStr.raw;
  // body may end without trailing comma before closing of outer — we rebuild
  const trimmedBody = body.replace(/\s*$/, "");
  const withFr = `${trimmedBody}, 'fr': ${frLit}`;
  out.push(`${indent}'${key}': {${withFr}},`);
  patched++;
}

let result = out.join("\n");
result = result.replace(
  /The app has exactly two supported languages \("en" \/ "ar", driven by\n\/\/\/ \[courseLangProvider\] in part_provider\.dart\) and no plans for a third, so\n\/\/\/ a full `flutter gen-l10n` \/ ARB pipeline would be pure overhead\. This is\n\/\/\/ a plain Dart map with a single lookup helper — `t\(lang, key\)` — used\n\/\/\/ throughout the UI instead of hardcoded English strings\./,
  `The app supports three course languages ("en" / "ar" / "fr", driven by
/// [courseLangProvider] in part_provider.dart). A full \`flutter gen-l10n\` /
/// ARB pipeline would be pure overhead — this is a plain Dart map with a
/// single lookup helper — \`t(lang, key)\` — used throughout the UI instead
/// of hardcoded English strings.`,
);

result = result.replace(
  /Looks up \[key\] for \[lang\] \("en" or "ar"\)/,
  'Looks up [key] for [lang] ("en", "ar", or "fr")',
);

fs.writeFileSync(path, result);
console.log("patched entries", patched);
