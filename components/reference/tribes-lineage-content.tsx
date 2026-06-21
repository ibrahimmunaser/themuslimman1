"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Info, ChevronDown, ChevronRight } from "lucide-react";

// ── Lineage Chain ──────────────────────────────────────────────────────────────

const LINEAGE_CHAIN = [
  { name: "Muhammad ﷺ", label: "Prophet ﷺ" },
  { name: "Abdullah", label: "Abdullah" },
  { name: "Abd al-Muttalib", label: "Abd al-Muttalib" },
  { name: "Hashim", label: "Hashim (Banu Hashim)" },
  { name: "Abd Manaf", label: "Abd Manaf" },
  { name: "Qusayy", label: "Qusayy" },
  { name: "Kilab", label: "Kilab" },
  { name: "Murrah", label: "Murrah" },
  { name: "Ka'b", label: "Ka'b" },
  { name: "Lu'ayy", label: "Lu'ayy" },
  { name: "Ghalib", label: "Ghalib" },
  { name: "Fihr (Quraysh)", label: "Fihr (Quraysh)" },
  { name: "Malik", label: "Malik" },
  { name: "al-Nadr", label: "al-Nadr" },
  { name: "Kinanah", label: "Kinanah" },
  { name: "Khuzaymah", label: "Khuzaymah" },
  { name: "Mudrikah", label: "Mudrikah" },
  { name: "Ilyas", label: "Ilyas" },
  { name: "Mudar", label: "Mudar" },
  { name: "Nizar", label: "Nizar" },
  { name: "Ma'add", label: "Ma'add" },
  { name: "Adnan", label: "Adnan" },
  { name: "Traditionally connected to Isma'il عليه السلام", label: "→ Isma'il عليه السلام" },
  { name: "Son of Ibrahim عليه السلام", label: "→ Ibrahim عليه السلام" },
];

// ── Tribal Data ────────────────────────────────────────────────────────────────

interface Tribe {
  name: string;
  type: string;
  connection: string;
  description: string;
  category: string;
}

const QURAYSH_CLANS: Tribe[] = [
  { name: "Banu Hashim", type: "Clan of Quraysh", connection: "Clan of the Prophet ﷺ", description: "The Prophet ﷺ belonged to Banu Hashim. Abu Talib, Hamzah, al-Abbas, Ali, and Fatimah رضي الله عنهم are connected to this household.", category: "Banu Hashim" },
  { name: "Banu al-Muttalib", type: "Clan of Quraysh", connection: "Close allies of Banu Hashim", description: "Closely tied to Banu Hashim and supported them during major moments.", category: "Quraysh" },
  { name: "Banu Abd Shams", type: "Clan of Quraysh", connection: "Related Qurayshi branch", description: "A powerful branch of Quraysh connected to major Makkan leaders.", category: "Quraysh" },
  { name: "Banu Umayyah", type: "Clan of Quraysh", connection: "Branch of Abd Shams", description: "The clan of Abu Sufyan, Uthman ibn Affan, Mu'awiyah, and other major figures.", category: "Quraysh" },
  { name: "Banu Nawfal", type: "Clan of Quraysh", connection: "Qurayshi clan", description: "One of the clans of Quraysh with social and political influence.", category: "Quraysh" },
  { name: "Banu Zuhrah", type: "Clan of Quraysh", connection: "Maternal connection", description: "The clan of Aminah bint Wahb, the mother of the Prophet ﷺ.", category: "Quraysh" },
  { name: "Banu Makhzum", type: "Clan of Quraysh", connection: "Major Makkan power clan", description: "The clan of Abu Jahl and Khalid ibn al-Walid. It was influential in Makkan opposition and later Islamic history.", category: "Quraysh" },
  { name: "Banu Taym", type: "Clan of Quraysh", connection: "Clan of Abu Bakr", description: "The clan of Abu Bakr al-Siddiq رضي الله عنه.", category: "Quraysh" },
  { name: "Banu Adi", type: "Clan of Quraysh", connection: "Clan of Umar", description: "The clan of Umar ibn al-Khattab رضي الله عنه.", category: "Quraysh" },
  { name: "Banu Asad", type: "Clan of Quraysh", connection: "Clan of Khadijah", description: "The clan of Khadijah bint Khuwaylid رضي الله عنها.", category: "Quraysh" },
  { name: "Banu Jumah", type: "Clan of Quraysh", connection: "Clan of Umayyah ibn Khalaf", description: "Connected to some major opponents of the early Muslims.", category: "Quraysh" },
  { name: "Banu Sahm", type: "Clan of Quraysh", connection: "Qurayshi clan", description: "A clan connected to Makkan society and leadership.", category: "Quraysh" },
  { name: "Banu Amir ibn Lu'ayy", type: "Clan of Quraysh", connection: "Qurayshi clan", description: "Another clan within the wider Quraysh structure.", category: "Quraysh" },
];

const MADINAH_TRIBES: Tribe[] = [
  { name: "Aws", type: "Arab tribe of Madinah", connection: "Ansar", description: "One of the two major Arab tribes of Madinah. Many members supported the Prophet ﷺ after the Hijrah.", category: "Ansar" },
  { name: "Khazraj", type: "Arab tribe of Madinah", connection: "Ansar", description: "One of the two major Arab tribes of Madinah. Many early Madinan Muslims came from Khazraj.", category: "Ansar" },
  { name: "Banu Najjar", type: "Clan of Khazraj", connection: "Maternal relatives and hosts in Madinah", description: "The Prophet ﷺ had family ties through his mother's side, and Abu Ayyub al-Ansari رضي الله عنه hosted him in Madinah.", category: "Ansar" },
  { name: "Banu Sa'idah", type: "Clan of Khazraj", connection: "Ansar", description: "Connected to important Ansari leadership and later political events.", category: "Ansar" },
  { name: "Banu Abdul Ashhal", type: "Clan of Aws", connection: "Ansar", description: "The clan of Sa'd ibn Mu'adh and Usaid ibn Hudayr رضي الله عنهما.", category: "Ansar" },
  { name: "Banu Harithah", type: "Clan of Aws", connection: "Ansar", description: "A Madinan clan involved in the events of the Seerah.", category: "Ansar" },
  { name: "Banu Salimah", type: "Clan of Khazraj", connection: "Ansar", description: "A Madinan clan connected to the Ansar and the events around Madinah.", category: "Ansar" },
  { name: "Banu Qaynuqa", type: "Jewish tribe of Madinah", connection: "Madinan treaty politics", description: "One of the Jewish tribes living in Madinah during the Prophet's ﷺ time.", category: "Jewish Tribes of Madinah" },
  { name: "Banu Nadir", type: "Jewish tribe of Madinah", connection: "Madinan treaty politics", description: "A Jewish tribe involved in major political events in Madinah.", category: "Jewish Tribes of Madinah" },
  { name: "Banu Qurayzah", type: "Jewish tribe of Madinah", connection: "Madinan treaty politics", description: "A Jewish tribe connected to the events after the Battle of the Trench.", category: "Jewish Tribes of Madinah" },
];

const OTHER_TRIBES: Tribe[] = [
  { name: "Thaqif", type: "Tribe of Ta'if", connection: "Ta'if and later Islam", description: "The tribe of Ta'if. They opposed the Prophet ﷺ during his visit to Ta'if but later entered Islam.", category: "Allies" },
  { name: "Hawazin", type: "Arab tribal confederation", connection: "Battle of Hunayn", description: "A major tribal group involved in the Battle of Hunayn after the conquest of Makkah.", category: "Opponents" },
  { name: "Ghatafan", type: "Najdi tribal confederation", connection: "Battle of the Trench", description: "One of the groups involved in the coalition against Madinah during the Battle of the Trench.", category: "Opponents" },
  { name: "Banu Sulaym", type: "Arab tribe", connection: "Arabian tribal politics", description: "A tribe involved in the wider political landscape of Arabia.", category: "Neighboring Tribes" },
  { name: "Banu Tamim", type: "Arab tribe", connection: "Delegations to the Prophet ﷺ", description: "A major Arab tribe connected to the Year of Delegations.", category: "Neighboring Tribes" },
  { name: "Banu Hanifah", type: "Tribe of Yamamah", connection: "Musaylimah", description: "The tribe connected to Musaylimah al-Kadhdhab, who falsely claimed prophethood.", category: "Opponents" },
  { name: "Daws", type: "Yemeni Arab tribe", connection: "Tribe of Abu Hurairah and al-Tufayl", description: "The tribe of Abu Hurairah رضي الله عنه and al-Tufayl ibn Amr al-Dawsi رضي الله عنه.", category: "Allies" },
  { name: "Ash'ar", type: "Yemeni Arab tribe", connection: "Tribe of Abu Musa", description: "The tribe of Abu Musa al-Ash'ari رضي الله عنه.", category: "Allies" },
  { name: "Khuza'ah", type: "Arab tribe near Makkah", connection: "Ally of the Muslims", description: "Their alliance and conflict with Banu Bakr helped lead to the conquest of Makkah.", category: "Allies" },
  { name: "Banu Bakr", type: "Arab tribe near Makkah", connection: "Ally of Quraysh", description: "Their attack on Khuza'ah became one of the events leading to the conquest of Makkah.", category: "Opponents" },
  { name: "Ghifar", type: "Arab tribe", connection: "Tribe of Abu Dharr", description: "The tribe of Abu Dharr al-Ghifari رضي الله عنه.", category: "Allies" },
  { name: "Aslam", type: "Arab tribe", connection: "Later support for Islam", description: "A tribe that became connected to the growing Muslim community.", category: "Allies" },
  { name: "Muzaynah", type: "Arab tribe", connection: "Delegations and support", description: "One of the Arab tribes connected to the Prophet's ﷺ later Madinan period.", category: "Allies" },
  { name: "Juhaynah", type: "Arab tribe", connection: "Arabian tribal network", description: "A tribe involved in the broader tribal world around Madinah.", category: "Neighboring Tribes" },
  { name: "Lihyan", type: "Arab tribe", connection: "Conflict in the Seerah", description: "Connected to difficult events faced by the Muslims.", category: "Opponents" },
  { name: "Banu Mustaliq", type: "Branch of Khuza'ah", connection: "Campaign of Banu Mustaliq", description: "Connected to the campaign during the Madinan period.", category: "Neighboring Tribes" },
  { name: "Tayy", type: "Arab tribe", connection: "Adi ibn Hatim", description: "The tribe of Adi ibn Hatim, a former Christian Arab leader who accepted Islam.", category: "Allies" },
  { name: "Kindah", type: "Arab tribe", connection: "Arabian delegations", description: "A major Arab tribe connected to later delegations and Arabian leadership.", category: "Neighboring Tribes" },
  { name: "Azd", type: "Yemeni tribal group", connection: "Ansar ancestry", description: "Aws and Khazraj are commonly connected to the larger Azd tribal background.", category: "Neighboring Tribes" },
  { name: "Kinanah", type: "Ancestral tribe", connection: "Ancestors of Quraysh", description: "Quraysh traces upward through Kinanah in the Prophet's ﷺ lineage.", category: "Prophet's Lineage" },
];

const FILTER_CATEGORIES = [
  "All",
  "Prophet's Lineage",
  "Quraysh",
  "Banu Hashim",
  "Madinah",
  "Ansar",
  "Jewish Tribes of Madinah",
  "Allies",
  "Opponents",
  "Neighboring Tribes",
];

// ── Component ──────────────────────────────────────────────────────────────────

export function TribesLineageContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showMoreTribes, setShowMoreTribes] = useState(false);

  const allTribes = [...QURAYSH_CLANS, ...MADINAH_TRIBES, ...OTHER_TRIBES];

  const filteredTribes = useMemo(() => {
    let results = allTribes;

    // Filter by category
    if (selectedCategory !== "All") {
      results = results.filter((t) => t.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.type.toLowerCase().includes(query) ||
          t.connection.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query)
      );
    }

    return results;
  }, [searchQuery, selectedCategory, allTribes]);

  return (
    <main className="min-h-screen bg-ink py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

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
            Tribes and Lineage
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed mb-6">
            The major Arab tribes, their relationships, and the Prophet's ﷺ lineage traced back.
          </p>
          <p className="text-sm text-text-secondary leading-relaxed">
            In the Seerah, tribes and lineage shaped protection, alliances, marriage ties, trade,
            conflict, migration, and leadership. Understanding the Prophet's ﷺ family line and
            the major tribes around Makkah and Madinah makes the events of the Seerah much easier
            to follow.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Lineage chain", value: "24 generations" },
            { label: "Quraysh clans", value: "13 clans" },
            { label: "Madinan tribes", value: "10 tribes" },
            { label: "Other tribes", value: "20+ tribes" },
          ].map((stat) => (
            <div key={stat.label} className="p-3 rounded-xl border border-border bg-surface text-center">
              <p className="text-xl font-bold text-gold">{stat.value}</p>
              <p className="text-xs text-text-muted mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Lineage Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-text mb-4">
            The Prophet's ﷺ Lineage
          </h2>
          <div className="mb-4 p-4 rounded-xl border border-gold/20 bg-gold-bg/30 text-sm text-text-secondary flex gap-3">
            <Info className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
            <p>
              The Prophet's ﷺ lineage is firmly traced through Quraysh, Kinanah, and Banu Hashim.
              The lineage is traditionally connected back to Isma'il عليه السلام and Ibrahim عليه السلام.
              Detailed chains beyond Adnan are usually treated with caution because reports differ.
            </p>
          </div>

          {/* Lineage chain */}
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-gold via-gold/40 to-gold/10" aria-hidden="true" />
            <div className="space-y-2">
              {LINEAGE_CHAIN.map((ancestor, index) => (
                <div key={index} className="relative flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full border-2 border-gold/40 bg-surface flex items-center justify-center flex-shrink-0 z-10">
                    <ChevronDown className="w-3 h-3 text-gold" />
                  </div>
                  <div className="flex-1 py-2">
                    <p className="text-sm font-medium text-text">{ancestor.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Callout Cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {[
            { title: "Why tribes mattered", text: "In Arabia, a person's tribe affected protection, marriage, trade, alliances, retaliation, and political support." },
            { title: "Why Quraysh mattered", text: "Quraysh controlled Makkah's leadership and held major influence through the Ka'bah, pilgrimage, and trade." },
            { title: "Why Banu Hashim mattered", text: "Banu Hashim was the Prophet's ﷺ clan. Even before many accepted Islam, tribal protection played a major role in the Makkan period." },
            { title: "Why Aws and Khazraj mattered", text: "Aws and Khazraj became the Ansar, the supporters of the Prophet ﷺ in Madinah after the Hijrah." },
          ].map((card) => (
            <div key={card.title} className="p-4 rounded-xl border border-border bg-surface">
              <h3 className="text-sm font-bold text-gold mb-2">{card.title}</h3>
              <p className="text-xs text-text-secondary leading-relaxed">{card.text}</p>
            </div>
          ))}
        </div>

        {/* Search and Filter */}
        <div className="mb-8">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search tribes, clans, or lineage…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-surface text-text placeholder-text-muted focus:outline-none focus:border-gold/40 transition-colors"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTER_CATEGORIES.map((category) => {
              const isActive = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    isActive
                      ? "bg-gold/10 text-gold border-gold/30"
                      : "bg-surface text-text-secondary hover:text-text border-border hover:border-gold/20"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quraysh Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-text mb-4">
            Quraysh and Makkah
          </h2>
          <p className="text-sm text-text-secondary mb-6 leading-relaxed">
            Quraysh was the major tribe of Makkah. It held religious, social, and economic
            influence because of its connection to the Ka'bah, pilgrimage, and trade. The Prophet ﷺ
            belonged to Banu Hashim, one of the noble clans of Quraysh.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {QURAYSH_CLANS.filter((t) =>
              selectedCategory === "All" ||
              t.category === selectedCategory ||
              (searchQuery && filteredTribes.includes(t))
            ).map((tribe, index) => (
              <TribeCard key={index} tribe={tribe} />
            ))}
          </div>
        </section>

        {/* Madinah Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-text mb-4">
            Madinah: Aws, Khazraj, and the Ansar
          </h2>
          <p className="text-sm text-text-secondary mb-6 leading-relaxed">
            Before the Hijrah, Madinah was known as Yathrib. Its two major Arab tribes were Aws and
            Khazraj. After supporting the Prophet ﷺ and the Muhajirun, they became known as the Ansar.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {MADINAH_TRIBES.filter((t) =>
              selectedCategory === "All" ||
              t.category === selectedCategory ||
              (searchQuery && filteredTribes.includes(t))
            ).map((tribe, index) => (
              <TribeCard key={index} tribe={tribe} />
            ))}
          </div>
          <div className="p-4 rounded-xl border border-border/50 bg-surface-raised/40 text-sm text-text-muted">
            <p className="flex gap-2">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                The Jewish tribes are included because they were part of the political and social
                landscape of Madinah during the Seerah.
              </span>
            </p>
          </div>
        </section>

        {/* Other Tribes Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-text">
              Other Important Tribes
            </h2>
            <button
              onClick={() => setShowMoreTribes(!showMoreTribes)}
              className="inline-flex items-center gap-1 text-sm font-medium text-gold hover:text-gold-light transition-colors"
            >
              {showMoreTribes ? "Show Less" : "View More Tribes"}
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showMoreTribes ? "rotate-90" : ""}`} />
            </button>
          </div>

          {showMoreTribes && (
            <div className="grid sm:grid-cols-2 gap-4">
              {OTHER_TRIBES.filter((t) =>
                selectedCategory === "All" ||
                t.category === selectedCategory ||
                (searchQuery && filteredTribes.includes(t))
              ).map((tribe, index) => (
                <TribeCard key={index} tribe={tribe} />
              ))}
            </div>
          )}
        </section>

        {/* CTA */}
        <section className="pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div>
              <p className="text-sm text-text-muted mb-1">Ready to go deeper?</p>
              <p className="text-base font-semibold text-text">
                See how these tribes and clans connect throughout the full Seerah.
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

        {/* Back link */}
        <div className="mt-12 pb-4">
          <Link
            href="/reference"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Reference Library
          </Link>
        </div>

      </div>
    </main>
  );
}

// ── Tribe Card Component ───────────────────────────────────────────────────────

function TribeCard({ tribe }: { tribe: Tribe }) {
  const categoryColors: Record<string, string> = {
    "Banu Hashim": "bg-gold/10 text-gold border-gold/20",
    "Quraysh": "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "Ansar": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    "Jewish Tribes of Madinah": "bg-purple-500/10 text-purple-400 border-purple-500/20",
    "Allies": "bg-green-500/10 text-green-400 border-green-500/20",
    "Opponents": "bg-red-500/10 text-red-400 border-red-500/20",
    "Neighboring Tribes": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "Prophet's Lineage": "bg-gold/10 text-gold border-gold/20",
  };

  const badgeColor = categoryColors[tribe.category] || "bg-surface-raised text-text-muted border-border";

  return (
    <div className="p-4 rounded-xl border border-border bg-surface hover:border-gold/20 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-base font-bold text-text">{tribe.name}</h3>
        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border flex-shrink-0 ${badgeColor}`}>
          {tribe.category}
        </span>
      </div>
      <p className="text-xs font-medium text-gold mb-2">{tribe.type}</p>
      <p className="text-xs text-text-muted mb-2">{tribe.connection}</p>
      <p className="text-xs text-text-secondary leading-relaxed">{tribe.description}</p>
    </div>
  );
}
