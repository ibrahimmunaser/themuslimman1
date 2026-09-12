import Link from "next/link";
import { Info } from "lucide-react";
import type { CourseLang } from "@/lib/course-lang";
import { loc } from "@/lib/loc";

// ── Data ───────────────────────────────────────────────────────────────────────

interface Wife {
  name: string;
  nameAr: string;
  nameFr: string;
  children: "Yes" | "No";
  notes: string;
  notesAr: string;
  notesFr: string;
}

interface Child {
  child: string;
  childAr: string;
  childFr: string;
  mother: string;
  motherAr: string;
  motherFr: string;
  notes: string;
  notesAr: string;
  notesFr: string;
}

const wives: Wife[] = [
  {
    name: "Khadijah bint Khuwaylid",
    nameAr: "خديجة بنت خويلد",
    nameFr: "Khadijah bint Khuwaylid",
    children: "Yes",
    notes: "Mother of all his children except Ibrahim",
    notesAr: "أم جميع أبنائه ﷺ إلا إبراهيم",
    notesFr: "Mère de tous ses enfants sauf Ibrāhīm",
  },
  {
    name: "Sawdah bint Zam'ah",
    nameAr: "سودة بنت زمعة",
    nameFr: "Sawdah bint Zam'ah",
    children: "No",
    notes: "One of the Mothers of the Believers",
    notesAr: "إحدى أمهات المؤمنين",
    notesFr: "L'une des Mères des Croyants",
  },
  {
    name: "Aishah bint Abi Bakr",
    nameAr: "عائشة بنت أبي بكر",
    nameFr: "Aishah bint Abi Bakr",
    children: "No",
    notes: "One of the major transmitters of hadith",
    notesAr: "من كبار رواة الحديث",
    notesFr: "L'une des principales transmettrices de hadith",
  },
  {
    name: "Hafsah bint Umar",
    nameAr: "حفصة بنت عمر",
    nameFr: "Hafsah bint Umar",
    children: "No",
    notes: "Daughter of Umar ibn al-Khattab",
    notesAr: "ابنة عمر بن الخطاب",
    notesFr: "Fille de ʿUmar ibn al-Khaṭṭāb",
  },
  {
    name: "Zaynab bint Khuzaymah",
    nameAr: "زينب بنت خزيمة",
    nameFr: "Zaynab bint Khuzaymah",
    children: "No",
    notes: "Known for generosity",
    notesAr: "عُرفت بالكرم والسخاء",
    notesFr: "Connue pour sa générosité",
  },
  {
    name: "Umm Salamah",
    nameAr: "أم سلمة",
    nameFr: "Umm Salamah",
    children: "No",
    notes: "Known for wisdom and knowledge",
    notesAr: "عُرفت بالحكمة والعلم",
    notesFr: "Connue pour sa sagesse et son savoir",
  },
  {
    name: "Zaynab bint Jahsh",
    nameAr: "زينب بنت جحش",
    nameFr: "Zaynab bint Jahsh",
    children: "No",
    notes: "Her marriage is mentioned in the Quran",
    notesAr: "ذُكر زواجها في القرآن الكريم",
    notesFr: "Son mariage est mentionné dans le Coran",
  },
  {
    name: "Juwayriyah bint al-Harith",
    nameAr: "جويرية بنت الحارث",
    nameFr: "Juwayriyah bint al-Harith",
    children: "No",
    notes: "From Banu al-Mustaliq",
    notesAr: "من بني المصطلق",
    notesFr: "De Banū al-Muṣṭaliq",
  },
  {
    name: "Umm Habibah",
    nameAr: "أم حبيبة",
    nameFr: "Umm Habibah",
    children: "No",
    notes: "Daughter of Abu Sufyan",
    notesAr: "ابنة أبي سفيان",
    notesFr: "Fille d'Abū Sufyān",
  },
  {
    name: "Safiyyah bint Huyayy",
    nameAr: "صفية بنت حيي",
    nameFr: "Safiyyah bint Huyayy",
    children: "No",
    notes: "From Banu al-Nadir",
    notesAr: "من بني النضير",
    notesFr: "De Banū al-Naḍīr",
  },
  {
    name: "Maymunah bint al-Harith",
    nameAr: "ميمونة بنت الحارث",
    nameFr: "Maymunah bint al-Harith",
    children: "No",
    notes: "The last wife he married",
    notesAr: "آخر من تزوجها ﷺ",
    notesFr: "La dernière épouse qu'il a épousée",
  },
];

const children: Child[] = [
  {
    child: "Al-Qasim",
    childAr: "القاسم",
    childFr: "Al-Qasim",
    mother: "Khadijah",
    motherAr: "خديجة",
    motherFr: "Khadijah",
    notes: "Died young",
    notesAr: "توفي طفلاً",
    notesFr: "Mort en bas âge",
  },
  {
    child: "Zaynab",
    childAr: "زينب",
    childFr: "Zaynab",
    mother: "Khadijah",
    motherAr: "خديجة",
    motherFr: "Khadijah",
    notes: "Daughter",
    notesAr: "ابنته",
    notesFr: "Fille",
  },
  {
    child: "Ruqayyah",
    childAr: "رقية",
    childFr: "Ruqayyah",
    mother: "Khadijah",
    motherAr: "خديجة",
    motherFr: "Khadijah",
    notes: "Daughter",
    notesAr: "ابنته",
    notesFr: "Fille",
  },
  {
    child: "Umm Kulthum",
    childAr: "أم كلثوم",
    childFr: "Umm Kulthum",
    mother: "Khadijah",
    motherAr: "خديجة",
    motherFr: "Khadijah",
    notes: "Daughter",
    notesAr: "ابنته",
    notesFr: "Fille",
  },
  {
    child: "Fatimah",
    childAr: "فاطمة",
    childFr: "Fatimah",
    mother: "Khadijah",
    motherAr: "خديجة",
    motherFr: "Khadijah",
    notes: "Daughter; the Prophet's lineage continued through her",
    notesAr: "ابنته؛ واستمر نسل النبي ﷺ من طريقها",
    notesFr: "Fille ; la lignée du Prophète ﷺ s'est poursuivie par elle",
  },
  {
    child: "Abdullah",
    childAr: "عبد الله",
    childFr: "Abdullah",
    mother: "Khadijah",
    motherAr: "خديجة",
    motherFr: "Khadijah",
    notes: "Also known as al-Tayyib and al-Tahir according to the stronger view",
    notesAr: "يُعرف أيضًا بالطيب والطاهر على الرأي الأقوى",
    notesFr: "Aussi connu sous les noms d'al-Ṭayyib et d'al-Ṭāhir selon l'avis le plus fort",
  },
  {
    child: "Ibrahim",
    childAr: "إبراهيم",
    childFr: "Ibrahim",
    mother: "Māriyah al-Qibṭiyyah",
    motherAr: "مارية القبطية",
    motherFr: "Māriyah al-Qibṭiyyah",
    notes: "Died young",
    notesAr: "توفي طفلاً",
    notesFr: "Mort en bas âge",
  },
];

// ── Component ──────────────────────────────────────────────────────────────────

export function FamilyHouseholdContent({ lang = "en" }: { lang?: CourseLang }) {
  const isRtl = lang === "ar";

  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-ink py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {/* Page header */}
        <div className="mb-12">
          <p className="text-sm text-gold font-medium mb-3 uppercase tracking-wide">
            {loc(lang, "Reference Library", "مكتبة المراجع", "Bibliothèque de référence")}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-text mb-4">
            {loc(
              lang,
              "Family & Household of the Prophet ﷺ",
              "الأسرة والبيت",
              "Famille et foyer du Prophète ﷺ",
            )}
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed">
            {loc(
              lang,
              "A clear reference guide to the wives, children, and household of the Prophet Muhammad ﷺ, including important historical notes where scholars differed.",
              "دليل واضح لزوجات النبي ﷺ وأبنائه وأسرته، مع جداول بسيطة وملاحظات تاريخية.",
              "Un guide de référence clair sur les épouses, les enfants et le foyer du Prophète Muhammad ﷺ, avec des notes historiques importantes là où les savants divergent.",
            )}
          </p>
        </div>

        <div className="space-y-14">

          {/* ── Section 1: Wives ───────────────────────────────────────────── */}
          <section>
            <h2 className="text-xl font-bold text-text mb-4 pb-2 border-b border-border">
              {loc(lang, "Wives of the Prophet ﷺ", "زوجات النبي ﷺ", "Épouses du Prophète ﷺ")}
            </h2>
            <p className="text-text-secondary leading-relaxed mb-6">
              {loc(
                lang,
                "The wives of the Prophet ﷺ are known as the Mothers of the Believers. They had a major role in preserving his Sunnah, teaching the Ummah, supporting the early Muslim community, and transmitting knowledge after his death.",
                "تُعرف زوجات النبي ﷺ بأمهات المؤمنين. وكان لهن دور كبير في حفظ سنته، وتعليم الأمة، ونصرة المجتمع المسلم في عهده الأول، ونقل العلم بعد وفاته.",
                "Les épouses du Prophète ﷺ sont connues comme les Mères des Croyants. Elles ont joué un rôle majeur dans la préservation de sa Sunna, l'enseignement de la Oumma, le soutien à la première communauté musulmane et la transmission du savoir après sa mort.",
              )}
            </p>

            {/* Desktop / tablet table */}
            <div className="hidden sm:block overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm text-start border-collapse">
                <thead>
                  <tr className="bg-surface-raised">
                    <th className="px-4 py-3 font-semibold text-text-secondary border-b border-border w-[40%]">
                      {loc(lang, "Name", "الاسم", "Nom")}
                    </th>
                    <th className="px-4 py-3 font-semibold text-text-secondary border-b border-border w-[20%]">
                      {loc(
                        lang,
                        "Children with the Prophet ﷺ",
                        "الأبناء من النبي ﷺ",
                        "Enfants avec le Prophète ﷺ",
                      )}
                    </th>
                    <th className="px-4 py-3 font-semibold text-text-secondary border-b border-border">
                      {loc(lang, "Notes", "ملاحظات", "Notes")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {wives.map((wife, i) => (
                    <tr
                      key={wife.name}
                      className={i % 2 === 0 ? "bg-surface" : "bg-surface-raised/50"}
                    >
                      <td className="px-4 py-3 font-medium text-text">
                        {loc(lang, wife.name, wife.nameAr, wife.nameFr)}
                      </td>
                      <td className="px-4 py-3">
                        {wife.children === "Yes" ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {loc(lang, "Yes", "نعم", "Oui")}
                          </span>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {loc(lang, wife.notes, wife.notesAr, wife.notesFr)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile stacked cards */}
            <div className="sm:hidden space-y-3">
              {wives.map((wife) => (
                <div
                  key={wife.name}
                  className="p-4 rounded-xl border border-border bg-surface"
                >
                  <p className="font-semibold text-text text-sm mb-2">
                    {loc(lang, wife.name, wife.nameAr, wife.nameFr)}
                  </p>
                  <div className="flex items-start gap-2 text-xs text-text-secondary">
                    <span className="text-text-muted flex-shrink-0">
                      {loc(lang, "Children:", "الأبناء:", "Enfants :")}
                    </span>
                    {wife.children === "Yes" ? (
                      <span className="font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {loc(lang, "Yes", "نعم", "Oui")}
                      </span>
                    ) : (
                      <span className="text-text-muted">
                        {loc(lang, "None recorded", "لم يُسجَّل", "Aucun enregistré")}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-text-secondary leading-relaxed">
                    {loc(lang, wife.notes, wife.notesAr, wife.notesFr)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Section 2: Children ────────────────────────────────────────── */}
          <section>
            <h2 className="text-xl font-bold text-text mb-4 pb-2 border-b border-border">
              {loc(lang, "Children of the Prophet ﷺ", "أبناء النبي ﷺ", "Enfants du Prophète ﷺ")}
            </h2>
            <p className="text-text-secondary leading-relaxed mb-6">
              {loc(
                lang,
                "The Prophet ﷺ had seven children according to the well-known view: three sons and four daughters. All of them were from Khadijah except Ibrahim, who was from Māriyah al-Qibṭiyyah.",
                "كان للنبي ﷺ سبعة أبناء على القول المشهور: ثلاثة أبناء وأربع بنات، وكلهم من خديجة إلا إبراهيم، فهو من مارية القبطية.",
                "Selon l'avis le plus répandu, le Prophète ﷺ eut sept enfants : trois fils et quatre filles. Tous étaient de Khadijah, sauf Ibrāhīm, qui était de Māriyah al-Qibṭiyyah.",
              )}
            </p>

            {/* Desktop / tablet table */}
            <div className="hidden sm:block overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm text-start border-collapse">
                <thead>
                  <tr className="bg-surface-raised">
                    <th className="px-4 py-3 font-semibold text-text-secondary border-b border-border w-[25%]">
                      {loc(lang, "Child", "الابن", "Enfant")}
                    </th>
                    <th className="px-4 py-3 font-semibold text-text-secondary border-b border-border w-[35%]">
                      {loc(lang, "Mother", "الأم", "Mère")}
                    </th>
                    <th className="px-4 py-3 font-semibold text-text-secondary border-b border-border">
                      {loc(lang, "Notes", "ملاحظات", "Notes")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {children.map((row, i) => (
                    <tr
                      key={row.child}
                      className={i % 2 === 0 ? "bg-surface" : "bg-surface-raised/50"}
                    >
                      <td className="px-4 py-3 font-medium text-text">
                        {loc(lang, row.child, row.childAr, row.childFr)}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {loc(lang, row.mother, row.motherAr, row.motherFr)}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {loc(lang, row.notes, row.notesAr, row.notesFr)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile stacked cards */}
            <div className="sm:hidden space-y-3">
              {children.map((row) => (
                <div
                  key={row.child}
                  className="p-4 rounded-xl border border-border bg-surface"
                >
                  <p className="font-semibold text-text text-sm mb-1.5">
                    {loc(lang, row.child, row.childAr, row.childFr)}
                  </p>
                  <p className="text-xs text-text-muted mb-1">
                    <span className="text-text-secondary/60">
                      {loc(lang, "Mother: ", "الأم: ", "Mère : ")}
                    </span>
                    {loc(lang, row.mother, row.motherAr, row.motherFr)}
                  </p>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {loc(lang, row.notes, row.notesAr, row.notesFr)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Section 3: Māriyah al-Qibṭiyyah ───────────────────────────── */}
          <section>
            <h2 className="text-xl font-bold text-text mb-4 pb-2 border-b border-border">
              {loc(lang, "Māriyah al-Qibṭiyyah", "مارية القبطية", "Māriyah al-Qibṭiyyah")}
            </h2>
            <div className="p-5 rounded-xl border border-border bg-surface-raised text-text-secondary leading-relaxed text-sm sm:text-base">
              <p>
                {loc(
                  lang,
                  "Māriyah al-Qibṭiyyah was from Egypt and was given to the Prophet ﷺ. She was not counted among the Mothers of the Believers because she was not one of his wives. She bore him his son Ibrahim, and because of this she became an ",
                  "كانت مارية القبطية من مصر، وأُهديت إلى النبي ﷺ. ولم تُحسب من أمهات المؤمنين لأنها لم تكن من زوجاته. وولدت له ابنه إبراهيم، ولذلك صارت ",
                  "Māriyah al-Qibṭiyyah était d'Égypte et fut offerte au Prophète ﷺ. Elle n'est pas comptée parmi les Mères des Croyants car elle n'était pas l'une de ses épouses. Elle lui donna son fils Ibrāhīm, et de ce fait elle devint une ",
                )}
                <em>{loc(lang, "umm walad", "أم ولد", "umm walad")}</em>
                {loc(
                  lang,
                  " — meaning a slave woman who gave birth to her master\u2019s child. Ibrahim died in childhood.",
                  " — أي الجارية التي تلد من سيدها. وتوفي إبراهيم في طفولته.",
                  " — c'est-à-dire une esclave qui donna naissance à l'enfant de son maître. Ibrāhīm mourut en bas âge.",
                )}
              </p>
            </div>
          </section>

          {/* ── Section 4: Historical Notes ────────────────────────────────── */}
          <section>
            <h2 className="text-xl font-bold text-text mb-4 pb-2 border-b border-border">
              {loc(lang, "Historical Notes", "ملاحظات تاريخية", "Notes historiques")}
            </h2>
            <div className="flex gap-3 p-5 rounded-xl border border-gold/20 bg-gold-bg/30 text-sm sm:text-base">
              <Info className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
              <p className="text-text-secondary leading-relaxed">
                {loc(
                  lang,
                  "Some historical reports mention ",
                  "تختلف بعض الروايات التاريخية في ذكر ",
                  "Certaines sources historiques mentionnent ",
                )}
                <strong className="text-text">
                  {loc(lang, "Rayḥānah bint Zayd", "ريحانة بنت زيد", "Rayḥānah bint Zayd")}
                </strong>
                {loc(
                  lang,
                  " differently: some scholars counted her among the wives of the Prophet ﷺ, while others regarded her as being from those whom he possessed. Because of this difference, she should be listed in a separate historical note rather than presented with the same certainty as the agreed-upon wives.",
                  ": فبعض العلماء عدّها من زوجات النبي ﷺ، وآخرون اعتبروها ممن كان في ملكه. ولهذا الاختلاف، تُذكر في ملاحظة تاريخية مستقلة، ولا تُعرض بنفس القطع المصاحب للزوجات المتفق عليهن.",
                  " de façon différente : certains savants l'ont comptée parmi les épouses du Prophète ﷺ, tandis que d'autres l'ont considérée comme faisant partie de celles qu'il possédait. En raison de cette divergence, elle est mentionnée dans une note historique distincte, plutôt que présentée avec la même certitude que les épouses sur lesquelles il y a consensus.",
                )}
              </p>
            </div>
          </section>

          {/* ── CTA ────────────────────────────────────────────────────────── */}
          <section className="pt-2 border-t border-border">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div>
                <p className="text-sm text-text-muted mb-1">
                  {loc(lang, "Ready to go deeper?", "تريد التعمق أكثر؟", "Prêt à aller plus loin ?")}
                </p>
                <p className="text-base font-semibold text-text">
                  {loc(
                    lang,
                    "Continue learning the full life of the Prophet ﷺ in order.",
                    "تابع تعلّم السيرة الكاملة للنبي ﷺ بالترتيب.",
                    "Continuez à apprendre la vie complète du Prophète ﷺ dans l'ordre.",
                  )}
                </p>
              </div>
              <Link
                href="/seerah"
                className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-ink font-semibold text-sm hover:bg-gold-light transition-colors"
              >
                {loc(
                  lang,
                  "Continue Learning the Seerah",
                  "استمر في تعلّم السيرة",
                  "Continuer à apprendre la Sîra",
                )}
              </Link>
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}
