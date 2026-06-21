import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Info } from "lucide-react";

export const metadata: Metadata = {
  title: "Family & Household of the Prophet ﷺ — Seerah Reference",
  description:
    "A clear reference guide to the wives, children, and household of the Prophet Muhammad ﷺ, including important historical notes where scholars differed.",
};

// ── Data ───────────────────────────────────────────────────────────────────────

interface Wife {
  name: string;
  children: "Yes" | "No";
  notes: string;
}

interface Child {
  child: string;
  mother: string;
  notes: string;
}

const wives: Wife[] = [
  { name: "Khadijah bint Khuwaylid",   children: "Yes", notes: "Mother of all his children except Ibrahim" },
  { name: "Sawdah bint Zam'ah",        children: "No",  notes: "One of the Mothers of the Believers" },
  { name: "Aishah bint Abi Bakr",      children: "No",  notes: "One of the major transmitters of hadith" },
  { name: "Hafsah bint Umar",          children: "No",  notes: "Daughter of Umar ibn al-Khattab" },
  { name: "Zaynab bint Khuzaymah",     children: "No",  notes: "Known for generosity" },
  { name: "Umm Salamah",               children: "No",  notes: "Known for wisdom and knowledge" },
  { name: "Zaynab bint Jahsh",         children: "No",  notes: "Her marriage is mentioned in the Quran" },
  { name: "Juwayriyah bint al-Harith", children: "No",  notes: "From Banu al-Mustaliq" },
  { name: "Umm Habibah",               children: "No",  notes: "Daughter of Abu Sufyan" },
  { name: "Safiyyah bint Huyayy",      children: "No",  notes: "From Banu al-Nadir" },
  { name: "Maymunah bint al-Harith",   children: "No",  notes: "The last wife he married" },
];

const children: Child[] = [
  { child: "Al-Qasim",    mother: "Khadijah",               notes: "Died young" },
  { child: "Zaynab",      mother: "Khadijah",               notes: "Daughter" },
  { child: "Ruqayyah",    mother: "Khadijah",               notes: "Daughter" },
  { child: "Umm Kulthum", mother: "Khadijah",               notes: "Daughter" },
  { child: "Fatimah",     mother: "Khadijah",               notes: "Daughter; the Prophet's lineage continued through her" },
  { child: "Abdullah",    mother: "Khadijah",               notes: "Also known as al-Tayyib and al-Tahir according to the stronger view" },
  { child: "Ibrahim",     mother: "Māriyah al-Qibṭiyyah",  notes: "Died young" },
];

// ── Page ───────────────────────────────────────────────────────────────────────

export default function FamilyHouseholdPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ink py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">

          {/* Back link */}
          <Link
            href="/reference"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text transition-colors mb-10"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Reference Library
          </Link>

          {/* Page header */}
          <div className="mb-12">
            <p className="text-sm text-gold font-medium mb-3 uppercase tracking-wide">
              Reference Library
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-text mb-4">
              Family &amp; Household of the Prophet ﷺ
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed">
              A clear reference guide to the wives, children, and household of the Prophet
              Muhammad ﷺ, including important historical notes where scholars differed.
            </p>
          </div>

          <div className="space-y-14">

            {/* ── Section 1: Wives ───────────────────────────────────────────── */}
            <section>
              <h2 className="text-xl font-bold text-text mb-4 pb-2 border-b border-border">
                Wives of the Prophet ﷺ
              </h2>
              <p className="text-text-secondary leading-relaxed mb-6">
                The wives of the Prophet ﷺ are known as the Mothers of the Believers. They had
                a major role in preserving his Sunnah, teaching the Ummah, supporting the early
                Muslim community, and transmitting knowledge after his death.
              </p>

              {/* Desktop / tablet table */}
              <div className="hidden sm:block overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-raised">
                      <th className="px-4 py-3 font-semibold text-text-secondary border-b border-border w-[40%]">
                        Name
                      </th>
                      <th className="px-4 py-3 font-semibold text-text-secondary border-b border-border w-[20%]">
                        Children with the Prophet ﷺ
                      </th>
                      <th className="px-4 py-3 font-semibold text-text-secondary border-b border-border">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {wives.map((wife, i) => (
                      <tr
                        key={wife.name}
                        className={i % 2 === 0 ? "bg-surface" : "bg-surface-raised/50"}
                      >
                        <td className="px-4 py-3 font-medium text-text">{wife.name}</td>
                        <td className="px-4 py-3">
                          {wife.children === "Yes" ? (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Yes
                            </span>
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-text-secondary">{wife.notes}</td>
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
                    <p className="font-semibold text-text text-sm mb-2">{wife.name}</p>
                    <div className="flex items-start gap-2 text-xs text-text-secondary">
                      <span className="text-text-muted flex-shrink-0">Children:</span>
                      {wife.children === "Yes" ? (
                        <span className="font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Yes
                        </span>
                      ) : (
                        <span className="text-text-muted">None recorded</span>
                      )}
                    </div>
                    <p className="mt-1.5 text-xs text-text-secondary leading-relaxed">
                      {wife.notes}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Section 2: Children ────────────────────────────────────────── */}
            <section>
              <h2 className="text-xl font-bold text-text mb-4 pb-2 border-b border-border">
                Children of the Prophet ﷺ
              </h2>
              <p className="text-text-secondary leading-relaxed mb-6">
                The Prophet ﷺ had seven children according to the well-known view: three sons and
                four daughters. All of them were from Khadijah except Ibrahim, who was from
                Māriyah al-Qibṭiyyah.
              </p>

              {/* Desktop / tablet table */}
              <div className="hidden sm:block overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-raised">
                      <th className="px-4 py-3 font-semibold text-text-secondary border-b border-border w-[25%]">
                        Child
                      </th>
                      <th className="px-4 py-3 font-semibold text-text-secondary border-b border-border w-[35%]">
                        Mother
                      </th>
                      <th className="px-4 py-3 font-semibold text-text-secondary border-b border-border">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {children.map((row, i) => (
                      <tr
                        key={row.child}
                        className={i % 2 === 0 ? "bg-surface" : "bg-surface-raised/50"}
                      >
                        <td className="px-4 py-3 font-medium text-text">{row.child}</td>
                        <td className="px-4 py-3 text-text-secondary">{row.mother}</td>
                        <td className="px-4 py-3 text-text-secondary">{row.notes}</td>
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
                    <p className="font-semibold text-text text-sm mb-1.5">{row.child}</p>
                    <p className="text-xs text-text-muted mb-1">
                      <span className="text-text-secondary/60">Mother: </span>
                      {row.mother}
                    </p>
                    <p className="text-xs text-text-secondary leading-relaxed">{row.notes}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Section 3: Māriyah al-Qibṭiyyah ───────────────────────────── */}
            <section>
              <h2 className="text-xl font-bold text-text mb-4 pb-2 border-b border-border">
                Māriyah al-Qibṭiyyah
              </h2>
              <div className="p-5 rounded-xl border border-border bg-surface-raised text-text-secondary leading-relaxed text-sm sm:text-base">
                <p>
                  Māriyah al-Qibṭiyyah was from Egypt and was given to the Prophet ﷺ. She was
                  not counted among the Mothers of the Believers because she was not one of his
                  wives. She bore him his son Ibrahim, and because of this she became an{" "}
                  <em>umm walad</em> — meaning a slave woman who gave birth to her master&rsquo;s
                  child. Ibrahim died in childhood.
                </p>
              </div>
            </section>

            {/* ── Section 4: Historical Notes ────────────────────────────────── */}
            <section>
              <h2 className="text-xl font-bold text-text mb-4 pb-2 border-b border-border">
                Historical Notes
              </h2>
              <div className="flex gap-3 p-5 rounded-xl border border-gold/20 bg-gold-bg/30 text-sm sm:text-base">
                <Info className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                <p className="text-text-secondary leading-relaxed">
                  Some historical reports mention{" "}
                  <strong className="text-text">Rayḥānah bint Zayd</strong> differently: some
                  scholars counted her among the wives of the Prophet ﷺ, while others regarded
                  her as being from those whom he possessed. Because of this difference, she should
                  be listed in a separate historical note rather than presented with the same
                  certainty as the agreed-upon wives.
                </p>
              </div>
            </section>

            {/* ── CTA ────────────────────────────────────────────────────────── */}
            <section className="pt-2 border-t border-border">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div>
                  <p className="text-sm text-text-muted mb-1">Ready to go deeper?</p>
                  <p className="text-base font-semibold text-text">
                    Continue learning the full life of the Prophet ﷺ in order.
                  </p>
                </div>
                <Link
                  href="/seerah"
                  className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-ink font-semibold text-sm hover:bg-gold-light transition-colors"
                >
                  Continue Learning the Seerah
                </Link>
              </div>
            </section>

            {/* ── Back link ──────────────────────────────────────────────────── */}
            <div className="pb-4">
              <Link
                href="/reference"
                className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Reference Library
              </Link>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
