"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Info, Book, Moon, Droplet, Utensils, Shield, Mountain, Sparkles, Heart } from "lucide-react";

// IMPORTANT: Do not add miracle reports without a source and authenticity grading.
// This section prioritizes narrations from the Qur'an, Sahih al-Bukhari, Sahih Muslim,
// and reports graded authentic by recognized scholars.

interface Miracle {
  id: number;
  title: string;
  category: string;
  summary: string;
  source: string;
  authenticity: "Qur'an" | "Sahih" | "Authentic Report" | "Needs Scholar Review";
  seerahPeriod: string;
  keyLesson: string;
  tags: string[];
  displayPriority: boolean; // Show in initial view
  verificationStatus: "verified" | "authentic-report" | "needs-review" | "excluded";
  section: "quran" | "cosmic" | "provision" | "objects" | "knowledge";
}

const MIRACLES_DATA: Miracle[] = [
  // SECTION 1: THE QUR'AN — THE GREATEST MIRACLE
  {
    id: 1,
    title: "The Qur'an as the lasting miracle",
    category: "Qur'an",
    summary: "The Prophet ﷺ said that what he was given was Divine Revelation, and he hoped to have the most followers on the Day of Resurrection.",
    source: "Sahih al-Bukhari 4981",
    authenticity: "Sahih",
    seerahPeriod: "Entire mission",
    keyLesson: "The Qur'an is the greatest and continuing miracle of the Prophet ﷺ.",
    tags: ["Qur'an", "Sahih al-Bukhari"],
    displayPriority: true,
    verificationStatus: "verified",
    section: "quran",
  },
  {
    id: 2,
    title: "The challenge to produce a surah like it",
    category: "Qur'an",
    summary: "Allah challenges those in doubt to produce a surah like what was revealed.",
    source: "Qur'an 2:23",
    authenticity: "Qur'an",
    seerahPeriod: "Makkan/Madinan message",
    keyLesson: "The Qur'an itself stands as proof and guidance.",
    tags: ["Qur'an", "Qur'anic Evidence"],
    displayPriority: true,
    verificationStatus: "verified",
    section: "quran",
  },
  {
    id: 3,
    title: "The Qur'an's unmatched nature",
    category: "Qur'an",
    summary: "Allah states that mankind and jinn could not produce the like of the Qur'an even if they supported one another.",
    source: "Qur'an 17:88",
    authenticity: "Qur'an",
    seerahPeriod: "Makkan revelation",
    keyLesson: "The Qur'an is beyond human imitation.",
    tags: ["Qur'an", "Qur'anic Evidence"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "quran",
  },
  {
    id: 4,
    title: "Preservation of revelation",
    category: "Qur'an",
    summary: "Allah promises to preserve the Reminder.",
    source: "Qur'an 15:9",
    authenticity: "Qur'an",
    seerahPeriod: "Entire Ummah",
    keyLesson: "The Qur'an remains protected as guidance for every generation.",
    tags: ["Qur'an", "Qur'anic Evidence"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "quran",
  },

  // SECTION 2: HEAVENLY AND COSMIC SIGNS
  {
    id: 5,
    title: "Splitting of the moon",
    category: "Cosmic Signs",
    summary: "The moon was split as a sign during the lifetime of the Prophet ﷺ.",
    source: "Qur'an 54:1; Sahih al-Bukhari 4864; Sahih al-Bukhari 3637",
    authenticity: "Qur'an",
    seerahPeriod: "Makkan period",
    keyLesson: "Allah supported His Messenger ﷺ with clear signs.",
    tags: ["Cosmic Signs", "Qur'an", "Sahih al-Bukhari", "Qur'anic Evidence"],
    displayPriority: true,
    verificationStatus: "verified",
    section: "cosmic",
  },
  {
    id: 6,
    title: "Isra: The Night Journey",
    category: "Isra and Mi'raj",
    summary: "Allah took His servant by night from al-Masjid al-Haram to al-Masjid al-Aqsa.",
    source: "Qur'an 17:1",
    authenticity: "Qur'an",
    seerahPeriod: "Late Makkan period",
    keyLesson: "Allah honored His Messenger ﷺ after hardship.",
    tags: ["Isra and Mi'raj", "Qur'an", "Qur'anic Evidence", "Cosmic Signs"],
    displayPriority: true,
    verificationStatus: "verified",
    section: "cosmic",
  },
  {
    id: 7,
    title: "Mi'raj: Ascension through the heavens",
    category: "Isra and Mi'raj",
    summary: "Authentic hadith describe the Prophet's ﷺ ascension and what he witnessed.",
    source: "Sahih al-Bukhari 7517",
    authenticity: "Sahih",
    seerahPeriod: "Late Makkan period",
    keyLesson: "The five daily prayers were given during this great event.",
    tags: ["Isra and Mi'raj", "Sahih al-Bukhari", "Cosmic Signs"],
    displayPriority: true,
    verificationStatus: "verified",
    section: "cosmic",
  },
  {
    id: 8,
    title: "The coming of the Prophet ﷺ near the Hour",
    category: "Prophetic Knowledge",
    summary: "The Prophet ﷺ indicated that his coming and the Hour are close, like two fingers.",
    source: "Sahih al-Bukhari 4936",
    authenticity: "Sahih",
    seerahPeriod: "General teaching",
    keyLesson: "His mission is connected to the final stage of human history.",
    tags: ["Prophetic Knowledge", "Sahih al-Bukhari"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "knowledge",
  },

  // SECTION 3: MIRACLES OF PROVISION AND WATER
  {
    id: 9,
    title: "Water flowing from between his fingers",
    category: "Water",
    summary: "A small amount of water became enough for many companions to drink and perform wudu.",
    source: "Sahih al-Bukhari 3576; Sahih al-Bukhari 5639",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    keyLesson: "Blessing comes from Allah.",
    tags: ["Water", "Sahih al-Bukhari"],
    displayPriority: true,
    verificationStatus: "verified",
    section: "provision",
  },
  {
    id: 10,
    title: "Water miracle narrated by Ibn Mas'ud",
    category: "Water",
    summary: "Ibn Mas'ud رضي الله عنه reported water coming from between the Prophet's ﷺ fingers and the food glorifying Allah.",
    source: "Sahih al-Bukhari 3579",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    keyLesson: "Allah can place barakah in what appears small.",
    tags: ["Water", "Objects", "Sahih al-Bukhari"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "provision",
  },
  {
    id: 11,
    title: "Food increased during the digging of the Trench",
    category: "Food",
    summary: "A small amount of food prepared by Jabir رضي الله عنه fed many during the Battle of the Trench.",
    source: "Sahih al-Bukhari 4101; Sahih al-Bukhari 4102",
    authenticity: "Sahih",
    seerahPeriod: "Battle of the Trench",
    keyLesson: "Allah supported the believers during severe hardship.",
    tags: ["Food", "Sahih al-Bukhari"],
    displayPriority: true,
    verificationStatus: "verified",
    section: "provision",
  },
  {
    id: 12,
    title: "Milk became enough for Ahl al-Suffah",
    category: "Food",
    summary: "A bowl of milk was enough for the people of al-Suffah, Abu Hurairah رضي الله عنه, and the Prophet ﷺ.",
    source: "Sahih al-Bukhari 6452",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    keyLesson: "Barakah can transform scarcity into sufficiency.",
    tags: ["Food", "Sahih al-Bukhari"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "provision",
  },
  {
    id: 13,
    title: "Food increased for Abu Bakr's guests",
    category: "Food",
    summary: "Food served to guests increased rather than decreased.",
    source: "Sahih al-Bukhari, Book of Prayer Times / related narration",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    keyLesson: "Allah places blessing where He wills.",
    tags: ["Food", "Sahih al-Bukhari"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "provision",
  },
  {
    id: 14,
    title: "Supplication for rain",
    category: "Prophetic Supplication",
    summary: "The companions would seek rain through the Prophet's ﷺ supplication during drought.",
    source: "Sahih al-Bukhari 1010",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    keyLesson: "Rain and relief come from Allah.",
    tags: ["Prophetic Knowledge", "Sahih al-Bukhari"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "knowledge",
  },

  // SECTION 4: SIGNS INVOLVING OBJECTS, ANIMALS, AND PLACES
  {
    id: 15,
    title: "The crying date-palm trunk",
    category: "Objects",
    summary: "The date-palm trunk cried when the Prophet ﷺ moved to the new pulpit.",
    source: "Sahih al-Bukhari 3584",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    keyLesson: "Even objects longed for the remembrance of Allah near the Prophet ﷺ.",
    tags: ["Objects", "Sahih al-Bukhari"],
    displayPriority: true,
    verificationStatus: "verified",
    section: "objects",
  },
  {
    id: 16,
    title: "Food glorifying Allah",
    category: "Objects / Food",
    summary: "The companions heard food glorifying Allah while it was being eaten.",
    source: "Sahih al-Bukhari 3579",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    keyLesson: "Allah allows His creation to glorify Him in ways beyond our normal perception.",
    tags: ["Objects", "Food", "Sahih al-Bukhari"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "objects",
  },
  {
    id: 17,
    title: "Two companions guided by lights",
    category: "Signs for Companions",
    summary: "Two companions left the Prophet ﷺ on a dark night and were guided by lights until each reached home.",
    source: "Sahih al-Bukhari 465",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    keyLesson: "Allah honored and aided the companions.",
    tags: ["Objects", "Sahih al-Bukhari"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "objects",
  },
  {
    id: 18,
    title: "Mount Uhud shook",
    category: "Places",
    summary: "Uhud shook while the Prophet ﷺ, Abu Bakr, Umar, and Uthman رضي الله عنهم were on it, and the Prophet ﷺ told it to be firm.",
    source: "Sahih al-Bukhari 3675",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    keyLesson: "This narration also indicated the future martyrdom of Umar and Uthman رضي الله عنهما.",
    tags: ["Places", "Prophetic Knowledge", "Sahih al-Bukhari"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "objects",
  },
  {
    id: 19,
    title: "Uhud loves us and we love it",
    category: "Places",
    summary: "The Prophet ﷺ said that Uhud is a mountain that loves the believers and is loved by them.",
    source: "Sahih al-Bukhari 4084",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    keyLesson: "Certain places connected to faith carry special honor.",
    tags: ["Places", "Sahih al-Bukhari"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "objects",
  },
  {
    id: 20,
    title: "Suraqah's horse sank during the Hijrah pursuit",
    category: "Protection",
    summary: "Suraqah pursued the Prophet ﷺ during the Hijrah, and his horse's forelegs sank until he asked for safety.",
    source: "Sahih al-Bukhari, Suraqah narration",
    authenticity: "Sahih",
    seerahPeriod: "Hijrah",
    keyLesson: "Allah protected His Messenger ﷺ during migration.",
    tags: ["Animals", "Sahih al-Bukhari"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "objects",
  },

  // SECTION 5: HEALING, KNOWLEDGE, AND FULFILLED SIGNS
  {
    id: 21,
    title: "Healing of Ali's رضي الله عنه eyes at Khaybar",
    category: "Healing",
    summary: "Ali رضي الله عنه had eye trouble, and the Prophet ﷺ applied saliva and supplicated for him, and he was cured.",
    source: "Sahih al-Bukhari 3009",
    authenticity: "Sahih",
    seerahPeriod: "Khaybar",
    keyLesson: "Allah granted healing through the Prophet's ﷺ supplication and touch.",
    tags: ["Healing", "Sahih al-Bukhari"],
    displayPriority: true,
    verificationStatus: "verified",
    section: "knowledge",
  },
  {
    id: 22,
    title: "Abu Hurairah's memory strengthened",
    category: "Prophetic Supplication / Knowledge",
    summary: "Abu Hurairah رضي الله عنه complained of forgetting hadith, and after the Prophet's ﷺ instruction, he said he never forgot.",
    source: "Sahih al-Bukhari 3648",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    keyLesson: "Allah preserved knowledge through the companions.",
    tags: ["Prophetic Knowledge", "Sahih al-Bukhari"],
    displayPriority: true,
    verificationStatus: "verified",
    section: "knowledge",
  },
  {
    id: 23,
    title: "Supplication for Ibn Abbas رضي الله عنهما",
    category: "Prophetic Supplication / Knowledge",
    summary: "The Prophet ﷺ supplicated for Ibn Abbas رضي الله عنهما to be taught wisdom and understanding of the Qur'an.",
    source: "Sahih al-Bukhari 3756",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    keyLesson: "Knowledge is a gift from Allah.",
    tags: ["Prophetic Knowledge", "Sahih al-Bukhari"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "knowledge",
  },
  {
    id: 24,
    title: "Prophecy of Umar and Uthman's martyrdom",
    category: "Prophetic Knowledge",
    summary: "When Uhud shook, the Prophet ﷺ said that upon it were a Prophet, a Siddiq, and two martyrs.",
    source: "Sahih al-Bukhari 3675",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    keyLesson: "Allah informed His Messenger ﷺ of future events.",
    tags: ["Prophetic Knowledge", "Sahih al-Bukhari"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "knowledge",
  },
  {
    id: 25,
    title: "The conquest of Makkah",
    category: "Fulfilled Sign",
    summary: "Allah fulfilled His promise and allowed the Prophet ﷺ to return to Makkah in victory.",
    source: "Qur'an 48:27; Seerah event",
    authenticity: "Qur'an",
    seerahPeriod: "8 AH",
    keyLesson: "Allah's promise comes true even after years of hardship.",
    tags: ["Prophetic Knowledge", "Qur'an", "Qur'anic Evidence"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "knowledge",
  },
  {
    id: 26,
    title: "The spread of Islam through delegations",
    category: "Fulfilled Sign",
    summary: "Tribes came to Madinah in large numbers after the conquest and after Islam became established.",
    source: "Qur'an 110:1-3; Seerah event",
    authenticity: "Qur'an",
    seerahPeriod: "9 AH",
    keyLesson: "Victory belongs to Allah and should lead to praise and repentance.",
    tags: ["Prophetic Knowledge", "Qur'an", "Qur'anic Evidence"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "knowledge",
  },
  {
    id: 27,
    title: "Letters to rulers",
    category: "Prophetic Mission",
    summary: "The Prophet ﷺ sent letters to rulers beyond Arabia, showing the universal nature of his message.",
    source: "Sahih al-Bukhari 7 and Seerah reports",
    authenticity: "Sahih",
    seerahPeriod: "6-7 AH",
    keyLesson: "The message of Islam was not tribal or local; it was universal.",
    tags: ["Prophetic Knowledge", "Sahih al-Bukhari"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "knowledge",
  },
  {
    id: 28,
    title: "Protection in the cave during Hijrah",
    category: "Protection",
    summary: "The Qur'an mentions Allah supporting the Prophet ﷺ when he was with his companion in the cave.",
    source: "Qur'an 9:40",
    authenticity: "Qur'an",
    seerahPeriod: "Hijrah",
    keyLesson: "Allah's help is greater than visible means.",
    tags: ["Qur'an", "Qur'anic Evidence"],
    displayPriority: true,
    verificationStatus: "verified",
    section: "knowledge",
  },
  {
    id: 29,
    title: "Victory at Badr",
    category: "Divine Support",
    summary: "Allah supported the believers at Badr when they were few.",
    source: "Qur'an 3:123-125; Seerah event",
    authenticity: "Qur'an",
    seerahPeriod: "2 AH",
    keyLesson: "Victory comes from Allah, not numbers.",
    tags: ["Qur'an", "Qur'anic Evidence"],
    displayPriority: true,
    verificationStatus: "verified",
    section: "knowledge",
  },
  {
    id: 30,
    title: "Calmness during danger",
    category: "Protection / Trust",
    summary: "During the Hijrah, the Prophet ﷺ remained calm and trusted Allah while Quraysh searched for him.",
    source: "Qur'an 9:40; Sahih Hijrah narrations",
    authenticity: "Qur'an",
    seerahPeriod: "Hijrah",
    keyLesson: "Tawakkul is strongest when danger is closest.",
    tags: ["Qur'an", "Qur'anic Evidence", "Sahih al-Bukhari"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "knowledge",
  },
];

const FILTER_CATEGORIES = [
  "All",
  "Qur'an",
  "Cosmic Signs",
  "Isra and Mi'raj",
  "Water",
  "Food",
  "Healing",
  "Objects",
  "Animals",
  "Places",
  "Prophetic Knowledge",
  "Sahih al-Bukhari",
  "Sahih Muslim",
  "Qur'anic Evidence",
];

export function MiraclesSignsContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showAll, setShowAll] = useState(false);

  // Filter verified miracles only
  const verifiedMiracles = MIRACLES_DATA.filter(
    (m) => m.verificationStatus === "verified" || m.verificationStatus === "authentic-report"
  );

  const filteredMiracles = useMemo(() => {
    let miracles = verifiedMiracles;

    // Filter by category
    if (selectedCategory !== "All") {
      miracles = miracles.filter((miracle) =>
        miracle.tags.includes(selectedCategory)
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      miracles = miracles.filter(
        (miracle) =>
          miracle.title.toLowerCase().includes(query) ||
          miracle.category.toLowerCase().includes(query) ||
          miracle.summary.toLowerCase().includes(query) ||
          miracle.source.toLowerCase().includes(query) ||
          miracle.keyLesson.toLowerCase().includes(query)
      );
    }

    return miracles;
  }, [searchQuery, selectedCategory, verifiedMiracles]);

  const displayedMiracles = showAll
    ? filteredMiracles
    : filteredMiracles.filter((m) => m.displayPriority);

  const hasMore = filteredMiracles.length > filteredMiracles.filter((m) => m.displayPriority).length;
  const isFiltered = searchQuery.trim() || selectedCategory !== "All";

  // Stats
  const quranCount = verifiedMiracles.filter((m) => m.authenticity === "Qur'an").length;
  const sahihBukhariCount = verifiedMiracles.filter((m) => m.tags.includes("Sahih al-Bukhari")).length;
  const totalCount = verifiedMiracles.length;

  // Get icon for miracle category
  const getMiracleIcon = (miracle: Miracle) => {
    if (miracle.tags.includes("Qur'an")) return Book;
    if (miracle.tags.includes("Cosmic Signs")) return Moon;
    if (miracle.tags.includes("Water")) return Droplet;
    if (miracle.tags.includes("Food")) return Utensils;
    if (miracle.tags.includes("Places")) return Mountain;
    if (miracle.tags.includes("Healing")) return Heart;
    if (miracle.tags.includes("Objects")) return Sparkles;
    return Shield;
  };

  // Get badge color for authenticity
  const getAuthenticityBadge = (authenticity: string) => {
    switch (authenticity) {
      case "Qur'an":
        return "bg-gold/10 text-gold border-gold/20";
      case "Sahih":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "Authentic Report":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    }
  };

  return (
    <main className="min-h-screen bg-ink py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Back link */}
        <Link
          href="/reference"
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Reference Library
        </Link>

        {/* Page header */}
        <div className="mb-8">
          <p className="text-sm text-gold font-medium mb-3 uppercase tracking-wide">
            Reference Library
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-text mb-4">
            Miracles and Signs
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed max-w-3xl mb-6">
            Allah supported His Messenger ﷺ with signs and miracles that confirmed
            his truthfulness and strengthened the believers. The greatest and
            lasting miracle is the Qur'an. Other miracles were witnessed by the
            companions and preserved in authentic narrations.
          </p>

          {/* Verification note */}
          <div className="flex gap-3 p-4 rounded-xl bg-surface border border-border/50">
            <Info className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-text-secondary leading-relaxed">
                This section prioritizes narrations from the Qur'an, Sahih
                al-Bukhari, Sahih Muslim, and reports graded authentic by
                recognized scholars. Popular stories without strong verification
                are not included here.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-2xl font-bold text-gold">{quranCount}</p>
            <p className="text-xs text-text-secondary mt-1">
              Qur'anic references
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-2xl font-bold text-gold">{sahihBukhariCount}</p>
            <p className="text-xs text-text-secondary mt-1">
              From Sahih al-Bukhari
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-2xl font-bold text-gold">{totalCount}+</p>
            <p className="text-xs text-text-secondary mt-1">
              Verified signs included
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-2xl font-bold text-gold">100%</p>
            <p className="text-xs text-text-secondary mt-1">
              Sources shown
            </p>
          </div>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder="Search miracles, signs, sources, or lessons…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface border border-border text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all"
            />
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 mb-8">
          {FILTER_CATEGORIES.map((category) => {
            const isActive = selectedCategory === category;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-gold/10 border-gold/20 text-gold"
                    : "bg-surface border-border text-text-secondary hover:border-gold/40 hover:text-text"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* Miracles grid */}
        {filteredMiracles.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-text-muted">
              No miracles match your search or filter.
            </p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {displayedMiracles.map((miracle) => {
                const Icon = getMiracleIcon(miracle);
                return (
                  <div
                    key={miracle.id}
                    className="p-5 rounded-xl bg-surface border border-border hover:border-gold/30 transition-colors"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-gold/10 border border-gold/20 flex-shrink-0">
                        <Icon className="w-4 h-4 text-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-text leading-snug">
                          {miracle.title}
                        </h3>
                        <p className="text-xs text-text-muted mt-0.5">
                          {miracle.category}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-text-secondary leading-relaxed mb-3">
                      {miracle.summary}
                    </p>

                    <div className="space-y-2 mb-3 pt-3 border-t border-border">
                      <div>
                        <p className="text-xs font-medium text-text-muted mb-1">
                          Source:
                        </p>
                        <p className="text-xs text-text-secondary leading-relaxed">
                          {miracle.source}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-text-muted mb-1">
                          Key Lesson:
                        </p>
                        <p className="text-xs text-text-secondary leading-relaxed">
                          {miracle.keyLesson}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded border text-xs font-medium ${getAuthenticityBadge(
                          miracle.authenticity
                        )}`}
                      >
                        {miracle.authenticity}
                      </span>
                      <span className="px-2 py-1 rounded border text-xs font-medium bg-surface-raised text-text-muted border-border/50">
                        {miracle.seerahPeriod}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Show more/less button */}
            {hasMore && !isFiltered && (
              <div className="text-center">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="px-6 py-3 rounded-xl bg-surface border border-border text-sm font-semibold text-text hover:border-gold/40 hover:bg-surface-raised transition-colors"
                >
                  {showAll
                    ? "Show Less"
                    : `View All ${filteredMiracles.length} Miracles and Signs`}
                </button>
              </div>
            )}
          </>
        )}

        {/* Excluded/Needs Verification section */}
        <div className="mt-16 pt-8 border-t border-border">
          <div className="p-6 rounded-xl bg-surface/50 border border-border/50">
            <h2 className="text-lg font-semibold text-text mb-3">
              Popular Stories That Need Verification
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              Some miracle stories are popular in lectures and children's books,
              but this section does not include them unless a reliable source and
              authenticity grading are added. Examples include: the spider web
              over the cave, the dove/nest story, the Prophet ﷺ casting no shadow,
              clouds constantly shading him, and overly detailed birth miracles —
              unless verified with grading and source.
            </p>
            <p className="text-xs text-text-muted">
              This approach keeps the reference accurate and trustworthy.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 pt-8 border-t border-border">
          <div className="p-6 rounded-2xl bg-surface border border-border text-center">
            <h2 className="text-lg font-semibold text-text mb-2">
              Continue Learning the Seerah
            </h2>
            <p className="text-sm text-text-secondary mb-4">
              Go back to the full Seerah course to study the context and details
              of these miracles and signs.
            </p>
            <Link
              href="/seerah"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold text-ink font-semibold hover:bg-gold-light transition-colors"
            >
              Go to Seerah Course
            </Link>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-8 text-center">
          <Link
            href="/reference"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reference Library
          </Link>
        </div>
      </div>
    </main>
  );
}
