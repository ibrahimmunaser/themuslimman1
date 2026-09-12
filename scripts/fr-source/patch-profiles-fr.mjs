/**
 * Patch profile picker + profiles client for French via loc().
 *   node scripts/fr-source/patch-profiles-fr.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function patchFile(rel, transform) {
  const file = path.join(root, rel);
  let s = fs.readFileSync(file, "utf8");
  s = transform(s);
  fs.writeFileSync(file, s);
  console.log("patched", rel, "loc=", (s.match(/loc\(/g) || []).length, "isRtl=", (s.match(/isRtl/g) || []).length);
}

function replacePair(s, ar, en, fr) {
  const patterns = [
    `isRtl ? "${ar}" : "${en}"`,
    `isRtl ? '${ar}' : '${en}'`,
  ];
  for (const p of patterns) {
    if (s.includes(p)) {
      s = s.split(p).join(`loc(lang, "${en}", "${ar}", "${fr}")`);
    }
  }
  return s;
}

patchFile("components/profiles/profile-picker-client.tsx", (s) => {
  if (!s.includes("@/lib/loc")) {
    s = s.replace(
      'import { IslamicPatternBackground } from "@/components/motion";',
      'import { IslamicPatternBackground } from "@/components/motion";\nimport type { CourseLang } from "@/lib/course-lang";\nimport { loc } from "@/lib/loc";',
    );
  }

  s = s.replace(
    /interface ProfilePickerClientProps \{[\s\S]*?\}/,
    `interface ProfilePickerClientProps {
  profiles: Profile[];
  profileLimit: number;
  isFamily: boolean;
  activeProfileId: string | null;
  lang?: CourseLang;
}`,
  );

  s = s.replace(
    /export function ProfilePickerClient\(\{[\s\S]*?\}: ProfilePickerClientProps\) \{/,
    `export function ProfilePickerClient({
  profiles,
  profileLimit,
  isFamily,
  activeProfileId,
  lang = "en",
}: ProfilePickerClientProps) {
  const isRtl = lang === "ar";
`,
  );

  const pairs = [
    ["تعذّر تبديل الملف الشخصي. حاول مرة أخرى.", "Could not switch profile. Please try again.", "Impossible de changer de profil. Veuillez réessayer."],
    ["حدث خطأ ما. حاول مرة أخرى.", "Something went wrong. Please try again.", "Une erreur s'est produite. Veuillez réessayer."],
    ["من يتعلّم اليوم؟", "Who is learning today?", "Qui apprend aujourd'hui ?"],
    ["اختر ملفك الشخصي التعليمي — يحتفظ كل ملف بتقدمه الخاص.", "Select your learner profile — each one keeps its own progress.", "Choisissez votre profil d'apprenant — chacun conserve sa propre progression."],
    ["إدارة الملفات الشخصية", "Manage profiles", "Gérer les profils"],
    ["تسجيل الخروج", "Sign out", "Se déconnecter"],
    ["أساسي", "Primary", "Principal"],
    ["جارٍ التحميل…", "Loading…", "Chargement…"],
    ["إضافة ملف شخصي جديد", "Add new profile", "Ajouter un nouveau profil"],
    ["إضافة ملف شخصي", "Add Profile", "Ajouter un profil"],
  ];
  for (const [ar, en, fr] of pairs) s = replacePair(s, ar, en, fr);

  s = s.replace(
    "isRtl ? `اختر ${profile.displayName}` : `Select ${profile.displayName}`",
    "loc(lang, `Select ${profile.displayName}`, `اختر ${profile.displayName}`, `Sélectionner ${profile.displayName}`)",
  );

  // Child components: accept lang
  s = s.replace(/isRtl\?: boolean;/g, "lang?: CourseLang;");
  s = s.replace(/isRtl=\{isRtl\}/g, "lang={lang}");
  s = s.replace(
    /function ProfileSlot\(\{([\s\S]*?)isRtl,\n\}: ProfileSlotProps\)/,
    "function ProfileSlot({$1lang = \"en\",\n}: ProfileSlotProps)",
  );
  s = s.replace(
    /function AddProfileSlot\(\{ anySelecting, isRtl \}: \{ anySelecting: boolean; isRtl\?: boolean \}\)/,
    'function AddProfileSlot({ anySelecting, lang = "en" }: { anySelecting: boolean; lang?: CourseLang })',
  );
  // If AddProfileSlot still has old signature
  s = s.replace(
    /function AddProfileSlot\(\{ anySelecting, isRtl \}: \{ anySelecting: boolean; lang\?: CourseLang \}\)/,
    'function AddProfileSlot({ anySelecting, lang = "en" }: { anySelecting: boolean; lang?: CourseLang })',
  );
  s = s.replace(
    /onSelect,\n  isRtl,\n\}: ProfileSlotProps\)/,
    'onSelect,\n  lang = "en",\n}: ProfileSlotProps)',
  );

  return s;
});

patchFile("app/profiles/page.tsx", (s) => {
  s = s.replace(
    'title: lang === "ar" ? "من يتعلّم اليوم؟ | Complete Seerah" : "Who is learning today? | Complete Seerah"',
    'title: lang === "ar" ? "من يتعلّم اليوم؟ | Complete Seerah" : lang === "fr" ? "Qui apprend aujourd\'hui ? | Complete Seerah" : "Who is learning today? | Complete Seerah"',
  );
  s = s.replace("isRtl={lang === \"ar\"}", "lang={lang}");
  return s;
});

patchFile("app/student/profiles/page.tsx", (s) => {
  s = s.replace("isRtl={lang === \"ar\"}", "lang={lang}");
  return s;
});

patchFile("app/student/profiles/profiles-client.tsx", (s) => {
  if (!s.includes("@/lib/loc")) {
    s = s.replace(
      'from "@/app/actions/profiles";',
      'from "@/app/actions/profiles";\nimport type { CourseLang } from "@/lib/course-lang";\nimport { loc } from "@/lib/loc";',
    );
  }

  s = s.replace(
    /interface ProfilesClientProps \{([\s\S]*?)isRtl\?: boolean;\n\}/,
    `interface ProfilesClientProps {$1lang?: CourseLang;\n}`,
  );

  s = s.replace(
    /export function ProfilesClient\(\{([\s\S]*?)isRtl,\n\}/,
    "export function ProfilesClient({$1lang = \"en\",\n}",
  );

  // After function open brace, ensure isRtl derived
  if (!s.includes("const isRtl = lang === \"ar\"")) {
    s = s.replace(
      /export function ProfilesClient\(\{[\s\S]*?lang = "en",\n\}: ProfilesClientProps\) \{/,
      (m) => m + '\n  const isRtl = lang === "ar";',
    );
  }

  const pairs = [
    ["يرجى إدخال اسم.", "Please enter a name.", "Veuillez saisir un nom."],
    ["تم إنشاء الملف الشخصي.", "Profile created.", "Profil créé."],
    ["فشل إنشاء الملف الشخصي.", "Failed to create profile.", "Échec de la création du profil."],
    ["تم تحديث الملف الشخصي.", "Profile updated.", "Profil mis à jour."],
    ["فشل تحديث الملف الشخصي.", "Failed to update profile.", "Échec de la mise à jour du profil."],
    ["تم حذف الملف الشخصي.", "Profile deleted.", "Profil supprimé."],
    ["فشل حذف الملف الشخصي.", "Failed to delete profile.", "Échec de la suppression du profil."],
    ["الفيديوهات", "Videos", "Vidéos"],
    ["الملخصات", "Briefings", "Briefings"],
    ["الشرائح", "Slides", "Diapositives"],
    ["الرسوم المعلوماتية", "Infographics", "Infographies"],
    ["الصوت", "Audio", "Audio"],
    ["البطاقات التعليمية", "Flashcards", "Flashcards"],
    ["الاختبارات", "Quizzes", "Quiz"],
    ["المعلومات", "Facts", "Faits"],
    ["العودة إلى الملفات", "Back to profiles", "Retour aux profils"],
    ["الملف الرئيسي", "Primary profile", "Profil principal"],
    ["ملف متعلّم", "Learner profile", "Profil d'apprenant"],
    ["التقدم العام", "Overall Progress", "Progression globale"],
    ["تعديل الملف", "Edit Profile", "Modifier le profil"],
    ["رجوع", "Back", "Retour"],
    ["تعديل الملف الشخصي", "Edit Profile", "Modifier le profil"],
    ["إنشاء ملف شخصي جديد", "Create New Profile", "Créer un nouveau profil"],
    ["الاسم", "Name", "Nom"],
    ["الصورة الرمزية (اختياري)", "Avatar (optional)", "Avatar (facultatif)"],
    ["مسح الصورة الرمزية", "Clear avatar", "Effacer l'avatar"],
    ["إلغاء", "Cancel", "Annuler"],
    ["جارٍ الحفظ…", "Saving…", "Enregistrement…"],
    ["حفظ التغييرات", "Save Changes", "Enregistrer les modifications"],
    ["إنشاء الملف", "Create Profile", "Créer le profil"],
    ["جارٍ الحذف…", "Deleting…", "Suppression…"],
    ["حذف الملف", "Delete Profile", "Supprimer le profil"],
    ["حذف هذا الملف", "Delete this profile", "Supprimer ce profil"],
    ["من يتعلّم؟", "Who's learning?", "Qui apprend ?"],
    ["تعديل الملف", "Edit profile", "Modifier le profil"],
    ["عرض التقدم", "View progress", "Voir la progression"],
    ["نشط", "Active", "Actif"],
    ["رئيسي", "Primary", "Principal"],
    ["إضافة ملف", "Add Profile", "Ajouter un profil"],
  ];
  for (const [ar, en, fr] of pairs) s = replacePair(s, ar, en, fr);

  // Template literals
  const templates = [
    [
      "isRtl ? `${s.completedParts}/${s.totalParts} درس` : `${s.completedParts}/${s.totalParts} lessons`",
      "loc(lang, `${s.completedParts}/${s.totalParts} lessons`, `${s.completedParts}/${s.totalParts} درس`, `${s.completedParts}/${s.totalParts} leçons`)",
    ],
    [
      'isRtl ? "آخر نشاط: " : "Last active: "',
      'loc(lang, "Last active: ", "آخر نشاط: ", "Dernière activité : ")',
    ],
    [
      "isRtl ? `تعلّم كـ ${selectedProfile.displayName}` : `Learn as ${selectedProfile.displayName}`",
      "loc(lang, `Learn as ${selectedProfile.displayName}`, `تعلّم كـ ${selectedProfile.displayName}`, `Apprendre en tant que ${selectedProfile.displayName}`)",
    ],
    [
      'placeholder={isRtl ? "مثال: أحمد، مريم، أبي…" : "e.g. Ahmad, Maryam, Dad…"}',
      'placeholder={loc(lang, "e.g. Ahmad, Maryam, Dad…", "مثال: أحمد، مريم، أبي…", "ex. Ahmad, Maryam, Papa…")}',
    ],
    [
      "isRtl\n                    ? `حذف «${selectedProfile.displayName}»؟ ستُحذف بيانات تقدّمه نهائيًا.`\n                    : `Delete \"${selectedProfile.displayName}\"? Their progress data will be permanently removed.`",
      "loc(lang, `Delete \"${selectedProfile.displayName}\"? Their progress data will be permanently removed.`, `حذف «${selectedProfile.displayName}»؟ ستُحذف بيانات تقدّمه نهائيًا.`, `Supprimer « ${selectedProfile.displayName} » ? Ses données de progression seront définitivement effacées.`)",
    ],
    [
      "isRtl\n              ? `وصول العائلة · حتى ${profileLimit} ملفات متعلّمين`\n              : `Family Access · up to ${profileLimit} learner profiles`",
      "loc(lang, `Family Access · up to ${profileLimit} learner profiles`, `وصول العائلة · حتى ${profileLimit} ملفات متعلّمين`, `Accès Famille · jusqu'à ${profileLimit} profils d'apprenants`)",
    ],
    [
      "isRtl ? `تعلّم كـ ${profile.displayName}` : `Learn as ${profile.displayName}`",
      "loc(lang, `Learn as ${profile.displayName}`, `تعلّم كـ ${profile.displayName}`, `Apprendre en tant que ${profile.displayName}`)",
    ],
    [
      'isRtl\n              ? "انقر على ملف لبدء التعلم · مرّر للتعديل أو عرض التقدم"\n              : "Click a profile to start learning · hover to edit or view progress"',
      'loc(lang, "Click a profile to start learning · hover to edit or view progress", "انقر على ملف لبدء التعلم · مرّر للتعديل أو عرض التقدم", "Cliquez sur un profil pour commencer · survolez pour modifier ou voir la progression")',
    ],
  ];
  for (const [from, to] of templates) {
    if (s.includes(from)) s = s.split(from).join(to);
  }

  // Mind maps row for FR
  s = s.replace(
    '...(isRtl ? [] : [{ label: "Mind Maps", value: s.mindmapsViewed, icon: Map, color: "text-teal-400" }]),',
    '...[{ label: loc(lang, "Mind Maps", "الخرائط الذهنية", "Cartes mentales"), value: s.mindmapsViewed, icon: Map, color: "text-teal-400" }],',
  );

  // locale for dates
  s = s.replace(
    'toLocaleDateString(isRtl ? "ar" : "en")',
    'toLocaleDateString(lang === "ar" ? "ar" : lang === "fr" ? "fr-FR" : "en")',
  );

  return s;
});

console.log("done");
