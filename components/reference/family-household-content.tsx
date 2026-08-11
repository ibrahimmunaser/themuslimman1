import Link from "next/link";
import { Info } from "lucide-react";
import type { CourseLang } from "@/lib/course-lang";

// ── Data ───────────────────────────────────────────────────────────────────────

interface Wife {
  name: string;
  nameAr: string;
  children: "Yes" | "No";
  notes: string;
  notesAr: string;
}

interface Child {
  child: string;
  childAr: string;
  mother: string;
  motherAr: string;
  notes: string;
  notesAr: string;
}

const wives: Wife[] = [
  { name: "Khadijah bint Khuwaylid",   nameAr: "خديجة بنت خويلد",   children: "Yes", notes: "Mother of all his children except Ibrahim", notesAr: "أم جميع أبنائه ﷺ إلا إبراهيم" },
  { name: "Sawdah bint Zam'ah",        nameAr: "سودة بنت زمعة",     children: "No",  notes: "One of the Mothers of the Believers", notesAr: "إحدى أمهات المؤمنين" },
  { name: "Aishah bint Abi Bakr",      nameAr: "عائشة بنت أبي بكر", children: "No",  notes: "One of the major transmitters of hadith", notesAr: "من كبار رواة الحديث" },
  { name: "Hafsah bint Umar",          nameAr: "حفصة بنت عمر",      children: "No",  notes: "Daughter of Umar ibn al-Khattab", notesAr: "ابنة عمر بن الخطاب" },
  { name: "Zaynab bint Khuzaymah",     nameAr: "زينب بنت خزيمة",    children: "No",  notes: "Known for generosity", notesAr: "عُرفت بالكرم والسخاء" },
  { name: "Umm Salamah",               nameAr: "أم سلمة",           children: "No",  notes: "Known for wisdom and knowledge", notesAr: "عُرفت بالحكمة والعلم" },
  { name: "Zaynab bint Jahsh",         nameAr: "زينب بنت جحش",      children: "No",  notes: "Her marriage is mentioned in the Quran", notesAr: "ذُكر زواجها في القرآن الكريم" },
  { name: "Juwayriyah bint al-Harith", nameAr: "جويرية بنت الحارث", children: "No",  notes: "From Banu al-Mustaliq", notesAr: "من بني المصطلق" },
  { name: "Umm Habibah",               nameAr: "أم حبيبة",          children: "No",  notes: "Daughter of Abu Sufyan", notesAr: "ابنة أبي سفيان" },
  { name: "Safiyyah bint Huyayy",      nameAr: "صفية بنت حيي",      children: "No",  notes: "From Banu al-Nadir", notesAr: "من بني النضير" },
  { name: "Maymunah bint al-Harith",   nameAr: "ميمونة بنت الحارث", children: "No",  notes: "The last wife he married", notesAr: "آخر من تزوجها ﷺ" },
];

const children: Child[] = [
  { child: "Al-Qasim",    childAr: "القاسم",    mother: "Khadijah",               motherAr: "خديجة",         notes: "Died young", notesAr: "توفي طفلاً" },
  { child: "Zaynab",      childAr: "زينب",      mother: "Khadijah",               motherAr: "خديجة",         notes: "Daughter", notesAr: "ابنته" },
  { child: "Ruqayyah",    childAr: "رقية",      mother: "Khadijah",               motherAr: "خديجة",         notes: "Daughter", notesAr: "ابنته" },
  { child: "Umm Kulthum", childAr: "أم كلثوم",  mother: "Khadijah",               motherAr: "خديجة",         notes: "Daughter", notesAr: "ابنته" },
  { child: "Fatimah",     childAr: "فاطمة",     mother: "Khadijah",               motherAr: "خديجة",         notes: "Daughter; the Prophet's lineage continued through her", notesAr: "ابنته؛ واستمر نسل النبي ﷺ من طريقها" },
  { child: "Abdullah",    childAr: "عبد الله",  mother: "Khadijah",               motherAr: "خديجة",         notes: "Also known as al-Tayyib and al-Tahir according to the stronger view", notesAr: "يُعرف أيضًا بالطيب والطاهر على الرأي الأقوى" },
  { child: "Ibrahim",     childAr: "إبراهيم",   mother: "Māriyah al-Qibṭiyyah",  motherAr: "مارية القبطية", notes: "Died young", notesAr: "توفي طفلاً" },
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
            {isRtl ? "مكتبة المراجع" : "Reference Library"}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-text mb-4">
            {isRtl ? "الأسرة والبيت" : "Family & Household of the Prophet ﷺ"}
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed">
            {isRtl
              ? "دليل واضح لزوجات النبي ﷺ وأبنائه وأسرته، مع جداول بسيطة وملاحظات تاريخية."
              : "A clear reference guide to the wives, children, and household of the Prophet Muhammad ﷺ, including important historical notes where scholars differed."}
          </p>
        </div>

        <div className="space-y-14">

          {/* ── Section 1: Wives ───────────────────────────────────────────── */}
          <section>
            <h2 className="text-xl font-bold text-text mb-4 pb-2 border-b border-border">
              {isRtl ? "زوجات النبي ﷺ" : "Wives of the Prophet ﷺ"}
            </h2>
            <p className="text-text-secondary leading-relaxed mb-6">
              {isRtl
                ? "تُعرف زوجات النبي ﷺ بأمهات المؤمنين. وكان لهن دور كبير في حفظ سنته، وتعليم الأمة، ونصرة المجتمع المسلم في عهده الأول، ونقل العلم بعد وفاته."
                : "The wives of the Prophet ﷺ are known as the Mothers of the Believers. They had a major role in preserving his Sunnah, teaching the Ummah, supporting the early Muslim community, and transmitting knowledge after his death."}
            </p>

            {/* Desktop / tablet table */}
            <div className="hidden sm:block overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm text-start border-collapse">
                <thead>
                  <tr className="bg-surface-raised">
                    <th className="px-4 py-3 font-semibold text-text-secondary border-b border-border w-[40%]">
                      {isRtl ? "الاسم" : "Name"}
                    </th>
                    <th className="px-4 py-3 font-semibold text-text-secondary border-b border-border w-[20%]">
                      {isRtl ? "الأبناء من النبي ﷺ" : "Children with the Prophet ﷺ"}
                    </th>
                    <th className="px-4 py-3 font-semibold text-text-secondary border-b border-border">
                      {isRtl ? "ملاحظات" : "Notes"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {wives.map((wife, i) => (
                    <tr
                      key={wife.name}
                      className={i % 2 === 0 ? "bg-surface" : "bg-surface-raised/50"}
                    >
                      <td className="px-4 py-3 font-medium text-text">{isRtl ? wife.nameAr : wife.name}</td>
                      <td className="px-4 py-3">
                        {wife.children === "Yes" ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {isRtl ? "نعم" : "Yes"}
                          </span>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{isRtl ? wife.notesAr : wife.notes}</td>
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
                  <p className="font-semibold text-text text-sm mb-2">{isRtl ? wife.nameAr : wife.name}</p>
                  <div className="flex items-start gap-2 text-xs text-text-secondary">
                    <span className="text-text-muted flex-shrink-0">{isRtl ? "الأبناء:" : "Children:"}</span>
                    {wife.children === "Yes" ? (
                      <span className="font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {isRtl ? "نعم" : "Yes"}
                      </span>
                    ) : (
                      <span className="text-text-muted">{isRtl ? "لم يُسجَّل" : "None recorded"}</span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-text-secondary leading-relaxed">
                    {isRtl ? wife.notesAr : wife.notes}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Section 2: Children ────────────────────────────────────────── */}
          <section>
            <h2 className="text-xl font-bold text-text mb-4 pb-2 border-b border-border">
              {isRtl ? "أبناء النبي ﷺ" : "Children of the Prophet ﷺ"}
            </h2>
            <p className="text-text-secondary leading-relaxed mb-6">
              {isRtl
                ? "كان للنبي ﷺ سبعة أبناء على القول المشهور: ثلاثة أبناء وأربع بنات، وكلهم من خديجة إلا إبراهيم، فهو من مارية القبطية."
                : "The Prophet ﷺ had seven children according to the well-known view: three sons and four daughters. All of them were from Khadijah except Ibrahim, who was from Māriyah al-Qibṭiyyah."}
            </p>

            {/* Desktop / tablet table */}
            <div className="hidden sm:block overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm text-start border-collapse">
                <thead>
                  <tr className="bg-surface-raised">
                    <th className="px-4 py-3 font-semibold text-text-secondary border-b border-border w-[25%]">
                      {isRtl ? "الابن" : "Child"}
                    </th>
                    <th className="px-4 py-3 font-semibold text-text-secondary border-b border-border w-[35%]">
                      {isRtl ? "الأم" : "Mother"}
                    </th>
                    <th className="px-4 py-3 font-semibold text-text-secondary border-b border-border">
                      {isRtl ? "ملاحظات" : "Notes"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {children.map((row, i) => (
                    <tr
                      key={row.child}
                      className={i % 2 === 0 ? "bg-surface" : "bg-surface-raised/50"}
                    >
                      <td className="px-4 py-3 font-medium text-text">{isRtl ? row.childAr : row.child}</td>
                      <td className="px-4 py-3 text-text-secondary">{isRtl ? row.motherAr : row.mother}</td>
                      <td className="px-4 py-3 text-text-secondary">{isRtl ? row.notesAr : row.notes}</td>
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
                  <p className="font-semibold text-text text-sm mb-1.5">{isRtl ? row.childAr : row.child}</p>
                  <p className="text-xs text-text-muted mb-1">
                    <span className="text-text-secondary/60">{isRtl ? "الأم: " : "Mother: "}</span>
                    {isRtl ? row.motherAr : row.mother}
                  </p>
                  <p className="text-xs text-text-secondary leading-relaxed">{isRtl ? row.notesAr : row.notes}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Section 3: Māriyah al-Qibṭiyyah ───────────────────────────── */}
          <section>
            <h2 className="text-xl font-bold text-text mb-4 pb-2 border-b border-border">
              {isRtl ? "مارية القبطية" : "Māriyah al-Qibṭiyyah"}
            </h2>
            <div className="p-5 rounded-xl border border-border bg-surface-raised text-text-secondary leading-relaxed text-sm sm:text-base">
              {isRtl ? (
                <p>
                  كانت مارية القبطية من مصر، وأُهديت إلى النبي ﷺ. ولم تُحسب من أمهات المؤمنين
                  لأنها لم تكن من زوجاته. وولدت له ابنه إبراهيم، ولذلك صارت{" "}
                  <em>أم ولد</em> — أي الجارية التي تلد من سيدها. وتوفي إبراهيم في طفولته.
                </p>
              ) : (
                <p>
                  Māriyah al-Qibṭiyyah was from Egypt and was given to the Prophet ﷺ. She was
                  not counted among the Mothers of the Believers because she was not one of his
                  wives. She bore him his son Ibrahim, and because of this she became an{" "}
                  <em>umm walad</em> — meaning a slave woman who gave birth to her master&rsquo;s
                  child. Ibrahim died in childhood.
                </p>
              )}
            </div>
          </section>

          {/* ── Section 4: Historical Notes ────────────────────────────────── */}
          <section>
            <h2 className="text-xl font-bold text-text mb-4 pb-2 border-b border-border">
              {isRtl ? "ملاحظات تاريخية" : "Historical Notes"}
            </h2>
            <div className="flex gap-3 p-5 rounded-xl border border-gold/20 bg-gold-bg/30 text-sm sm:text-base">
              <Info className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
              {isRtl ? (
                <p className="text-text-secondary leading-relaxed">
                  تختلف بعض الروايات التاريخية في ذكر{" "}
                  <strong className="text-text">ريحانة بنت زيد</strong>: فبعض العلماء عدّها من
                  زوجات النبي ﷺ، وآخرون اعتبروها ممن كان في ملكه. ولهذا الاختلاف، تُذكر في
                  ملاحظة تاريخية مستقلة، ولا تُعرض بنفس القطع المصاحب للزوجات المتفق عليهن.
                </p>
              ) : (
                <p className="text-text-secondary leading-relaxed">
                  Some historical reports mention{" "}
                  <strong className="text-text">Rayḥānah bint Zayd</strong> differently: some
                  scholars counted her among the wives of the Prophet ﷺ, while others regarded
                  her as being from those whom he possessed. Because of this difference, she should
                  be listed in a separate historical note rather than presented with the same
                  certainty as the agreed-upon wives.
                </p>
              )}
            </div>
          </section>

          {/* ── CTA ────────────────────────────────────────────────────────── */}
          <section className="pt-2 border-t border-border">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div>
                <p className="text-sm text-text-muted mb-1">{isRtl ? "تريد التعمق أكثر؟" : "Ready to go deeper?"}</p>
                <p className="text-base font-semibold text-text">
                  {isRtl
                    ? "تابع تعلّم السيرة الكاملة للنبي ﷺ بالترتيب."
                    : "Continue learning the full life of the Prophet ﷺ in order."}
                </p>
              </div>
              <Link
                href="/seerah"
                className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-ink font-semibold text-sm hover:bg-gold-light transition-colors"
              >
                {isRtl ? "استمر في تعلّم السيرة" : "Continue Learning the Seerah"}
              </Link>
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}
