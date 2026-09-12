"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Info, Book, Users, Map, Swords, Heart, FileText, Globe, Shield } from "lucide-react";
import type { CourseLang } from "@/lib/course-lang";
import { loc } from "@/lib/loc";

// IMPORTANT: Future editors should not add technical terms without a plain-English
// definition and a Seerah-specific explanation.

interface Term {
  id: number;
  term: string;
  arabic: string;
  transliteration: string;
  category: string;
  definition: string;
  whyItMatters: string;
  definitionAr?: string;
  whyItMattersAr?: string;
  definitionFr?: string;
  whyItMattersFr?: string;
  relatedTerms?: string[];
  priority: boolean; // Show in initial view
}

const TERMS_DATA: Term[] = [
  {
    id: 1,
    term: "Seerah",
    arabic: "السيرة",
    transliteration: "Seerah / Sirah",
    category: "Core Seerah Terms",
    definition: "The biography or life story of the Prophet ﷺ.",
    whyItMatters: "It is the main subject of the course.",
    definitionAr: "السيرة أو قصة حياة النبي ﷺ.",
    definitionFr: "La biographie ou l'histoire de la vie du Prophète ﷺ.",
    whyItMattersAr: "وهي الموضوع الأساسي لهذا المنهج.",
    whyItMattersFr: "C'est le sujet principal du cours.",
    priority: true,
  },
  {
    id: 2,
    term: "Al-Seerah al-Nabawiyyah",
    arabic: "السيرة النبوية",
    transliteration: "Al-Seerah al-Nabawiyyah",
    category: "Core Seerah Terms",
    definition: "The Prophetic biography.",
    whyItMatters: "This refers specifically to the life of the Prophet ﷺ.",
    definitionAr: "السيرة النبوية.",
    definitionFr: "La biographie prophétique.",
    whyItMattersAr: "يُشار بها على وجه التحديد إلى حياة النبي ﷺ.",
    whyItMattersFr: "Cela désigne spécifiquement la vie du Prophète ﷺ.",
    priority: false,
  },
  {
    id: 3,
    term: "Rasul",
    arabic: "رسول",
    transliteration: "Rasul",
    category: "Core Seerah Terms",
    definition: "A messenger sent by Allah with revelation.",
    whyItMatters: "The Prophet Muhammad ﷺ is the final Messenger of Allah.",
    definitionAr: "رسول أرسله الله وأوحى إليه بشرع.",
    definitionFr: "Un messager envoyé par Allah avec une révélation.",
    whyItMattersAr: "النبي محمد ﷺ هو خاتم رسل الله.",
    whyItMattersFr: "Le Prophète Muhammad ﷺ est le dernier Messager d'Allah.",
    priority: true,
  },
  {
    id: 4,
    term: "Nabi",
    arabic: "نبي",
    transliteration: "Nabi",
    category: "Core Seerah Terms",
    definition: "A prophet chosen by Allah.",
    whyItMatters: "The Prophet ﷺ is both a Nabi and Rasul.",
    definitionAr: "نبي اختاره الله واصطفاه.",
    definitionFr: "Un prophète choisi par Allah.",
    whyItMattersAr: "النبي ﷺ نبيٌّ ورسولٌ في آنٍ واحد.",
    whyItMattersFr: "Le Prophète ﷺ est à la fois un Nabi et un Rasul.",
    priority: true,
  },
  {
    id: 5,
    term: "Khatam al-Nabiyyin",
    arabic: "خاتم النبيين",
    transliteration: "Khatam al-Nabiyyin",
    category: "Core Seerah Terms",
    definition: "The Seal of the Prophets.",
    whyItMatters: "It means the Prophet Muhammad ﷺ is the final prophet.",
    definitionAr: "خاتم الأنبياء.",
    definitionFr: "Le Sceau des Prophètes.",
    whyItMattersAr: "يعني أن النبي محمد ﷺ هو آخر الأنبياء، فلا نبي بعده.",
    whyItMattersFr: "Cela signifie que le Prophète Muhammad ﷺ est le dernier prophète.",
    priority: false,
  },
  {
    id: 6,
    term: "Wahy",
    arabic: "وحي",
    transliteration: "Wahy",
    category: "Revelation",
    definition: "Revelation from Allah.",
    whyItMatters: "The Qur'an was revealed to the Prophet ﷺ through wahy.",
    definitionAr: "الوحي من الله سبحانه وتعالى.",
    definitionFr: "La révélation venant d'Allah.",
    whyItMattersAr: "أُنزل القرآن على النبي ﷺ عن طريق الوحي.",
    whyItMattersFr: "Le Coran a été révélé au Prophète ﷺ par le wahy.",
    priority: true,
  },
  {
    id: 7,
    term: "Qur'an",
    arabic: "القرآن",
    transliteration: "Qur'an",
    category: "Revelation",
    definition: "The speech of Allah revealed to the Prophet ﷺ.",
    whyItMatters: "It is the greatest miracle and main source of guidance.",
    definitionAr: "كلام الله سبحانه وتعالى الذي أُنزل على النبي ﷺ.",
    definitionFr: "La parole d'Allah révélée au Prophète ﷺ.",
    whyItMattersAr: "وهو أعظم معجزة، والمصدر الأول للهداية.",
    whyItMattersFr: "C'est le plus grand miracle et la principale source de guidance.",
    priority: true,
  },
  {
    id: 8,
    term: "Jibril",
    arabic: "جبريل",
    transliteration: "Jibril",
    category: "Revelation",
    definition: "The angel who brought revelation to the Prophet ﷺ.",
    whyItMatters: "Jibril عليه السلام came to the Prophet ﷺ with the Qur'an.",
    definitionAr: "الملَك الذي كان ينزل بالوحي على النبي ﷺ.",
    definitionFr: "L'ange qui apportait la révélation au Prophète ﷺ.",
    whyItMattersAr: "جاء جبريل عليه السلام إلى النبي ﷺ بالقرآن الكريم.",
    whyItMattersFr: "Jibril عليه السلام est venu au Prophète ﷺ avec le Coran.",
    priority: false,
  },
  {
    id: 9,
    term: "Sunnah",
    arabic: "السنة",
    transliteration: "Sunnah",
    category: "Hadith & Sources",
    definition: "The guidance, way, teachings, actions, and approvals of the Prophet ﷺ.",
    whyItMatters: "The Seerah helps users see the Sunnah in real life.",
    definitionAr: "هدي النبي ﷺ وطريقته، وأقواله وأفعاله وما أقرّه.",
    definitionFr: "La guidance, la voie, les enseignements, les actes et les approbations du Prophète ﷺ.",
    whyItMattersAr: "تساعد السيرة المتعلمين على رؤية السنة في واقع الحياة.",
    whyItMattersFr: "La Sîra aide les apprenants à voir la Sunnah dans la vie réelle.",
    priority: true,
  },
  {
    id: 10,
    term: "Hadith",
    arabic: "حديث",
    transliteration: "Hadith",
    category: "Hadith & Sources",
    definition: "A report about the statements, actions, approvals, or descriptions of the Prophet ﷺ.",
    whyItMatters: "Hadith reports preserve many details from the Prophet's ﷺ life.",
    definitionAr: "خبر يروي أقوال النبي ﷺ أو أفعاله أو ما أقرّه أو صفاته.",
    definitionFr: "Un récit concernant les paroles, actes, approbations ou descriptions du Prophète ﷺ.",
    whyItMattersAr: "تحفظ الأحاديث كثيرًا من تفاصيل حياة النبي ﷺ.",
    whyItMattersFr: "Les hadiths préservent de nombreux détails de la vie du Prophète ﷺ.",
    priority: true,
  },
  {
    id: 11,
    term: "Isnad",
    arabic: "إسناد",
    transliteration: "Isnad",
    category: "Hadith & Sources",
    definition: "The chain of narrators for a hadith.",
    whyItMatters: "It helps scholars evaluate whether a narration is reliable.",
    definitionAr: "سلسلة الرواة الذين نقلوا الحديث.",
    definitionFr: "La chaîne des rapporteurs d'un hadith.",
    whyItMattersAr: "يساعد العلماء على تقييم مدى صحة الرواية.",
    whyItMattersFr: "Elle aide les savants à évaluer si une narration est fiable.",
    priority: false,
  },
  {
    id: 12,
    term: "Matn",
    arabic: "متن",
    transliteration: "Matn",
    category: "Hadith & Sources",
    definition: "The text or wording of a hadith.",
    whyItMatters: "It is the actual content being narrated.",
    definitionAr: "نص الحديث ومتنه.",
    definitionFr: "Le texte ou le libellé d'un hadith.",
    whyItMattersAr: "وهو المحتوى الفعلي الذي يُروى.",
    whyItMattersFr: "C'est le contenu réel qui est rapporté.",
    priority: false,
  },
  {
    id: 13,
    term: "Sahih",
    arabic: "صحيح",
    transliteration: "Sahih",
    category: "Hadith & Sources",
    definition: "Authentic or sound.",
    whyItMatters: "Strong narrations are prioritized when teaching the Seerah.",
    definitionAr: "الحديث الصحيح الثابت.",
    definitionFr: "Authentique ou sain.",
    whyItMattersAr: "تُعطى الأولوية للروايات الصحيحة عند تعليم السيرة.",
    whyItMattersFr: "Les narrations solides sont prioritaires dans l'enseignement de la Sîra.",
    priority: false,
  },
  {
    id: 14,
    term: "Hasan",
    arabic: "حسن",
    transliteration: "Hasan",
    category: "Hadith & Sources",
    definition: "Good or acceptable in hadith grading.",
    whyItMatters: "Some Seerah details come through hasan reports.",
    definitionAr: "الحديث الحسن المقبول في درجات التصحيح.",
    definitionFr: "Bon ou acceptable selon le classement des hadiths.",
    whyItMattersAr: "بعض تفاصيل السيرة ثابتة عن طريق روايات حسنة.",
    whyItMattersFr: "Certains détails de la Sîra proviennent de rapports hasan.",
    priority: false,
  },
  {
    id: 15,
    term: "Da'if",
    arabic: "ضعيف",
    transliteration: "Da'if",
    category: "Hadith & Sources",
    definition: "Weak in hadith grading.",
    whyItMatters: "Weak stories should not be treated like confirmed facts.",
    definitionAr: "الحديث الضعيف في درجات التصحيح.",
    definitionFr: "Faible selon le classement des hadiths.",
    whyItMattersAr: "لا ينبغي التعامل مع القصص الضعيفة كحقائق مؤكدة.",
    whyItMattersFr: "Les récits faibles ne doivent pas être traités comme des faits confirmés.",
    priority: false,
  },
  {
    id: 16,
    term: "Sahabah",
    arabic: "الصحابة",
    transliteration: "Sahabah",
    category: "People & Groups",
    definition: "The companions of the Prophet ﷺ.",
    whyItMatters: "They witnessed, supported, preserved, and transmitted the Seerah.",
    definitionAr: "أصحاب النبي ﷺ رضي الله عنهم.",
    definitionFr: "Les compagnons du Prophète ﷺ.",
    whyItMattersAr: "شهدوا أحداث السيرة، ونصروها، وحفظوها، ونقلوها.",
    whyItMattersFr: "Ils ont été témoins, ont soutenu, préservé et transmis la Sîra.",
    priority: true,
  },
  {
    id: 17,
    term: "Sahabi",
    arabic: "صحابي",
    transliteration: "Sahabi",
    category: "People & Groups",
    definition: "A male companion of the Prophet ﷺ.",
    whyItMatters: "Many Seerah events center around individual companions.",
    definitionAr: "صحابي، أي رجل من أصحاب النبي ﷺ.",
    definitionFr: "Un compagnon masculin du Prophète ﷺ.",
    whyItMattersAr: "تتمحور كثير من أحداث السيرة حول أفراد من الصحابة.",
    whyItMattersFr: "De nombreux événements de la Sîra tournent autour de compagnons individuels.",
    priority: false,
  },
  {
    id: 18,
    term: "Sahabiyyah",
    arabic: "صحابية",
    transliteration: "Sahabiyyah",
    category: "People & Groups",
    definition: "A female companion of the Prophet ﷺ.",
    whyItMatters: "Women played major roles in belief, sacrifice, knowledge, and support.",
    definitionAr: "صحابية، أي امرأة من صحابيات النبي ﷺ.",
    definitionFr: "Une compagne féminine du Prophète ﷺ.",
    whyItMattersAr: "كان للنساء دور عظيم في الإيمان والتضحية والعلم والدعم.",
    whyItMattersFr: "Les femmes ont joué des rôles majeurs dans la foi, le sacrifice, le savoir et le soutien.",
    priority: false,
  },
  {
    id: 19,
    term: "Ahl al-Bayt",
    arabic: "أهل البيت",
    transliteration: "Ahl al-Bayt",
    category: "People & Groups",
    definition: "The household or family of the Prophet ﷺ.",
    whyItMatters: "The Prophet's ﷺ family is central to many Seerah events.",
    definitionAr: "أهل بيت النبي ﷺ وأسرته.",
    definitionFr: "La famille ou le foyer du Prophète ﷺ.",
    whyItMattersAr: "أسرة النبي ﷺ محورية في كثير من أحداث السيرة.",
    whyItMattersFr: "La famille du Prophète ﷺ est centrale dans de nombreux événements de la Sîra.",
    priority: false,
  },
  {
    id: 20,
    term: "Ummahat al-Mu'minin",
    arabic: "أمهات المؤمنين",
    transliteration: "Ummahat al-Mu'minin",
    category: "People & Groups",
    definition: "The Mothers of the Believers, meaning the wives of the Prophet ﷺ.",
    whyItMatters: "They preserved knowledge and were part of the Prophet's ﷺ household.",
    definitionAr: "أمهات المؤمنين، أي زوجات النبي ﷺ.",
    definitionFr: "Les Mères des Croyants, c'est-à-dire les épouses du Prophète ﷺ.",
    whyItMattersAr: "حفظن العلم، وكنّ جزءًا من بيت النبي ﷺ.",
    whyItMattersFr: "Elles ont préservé le savoir et faisaient partie du foyer du Prophète ﷺ.",
    priority: false,
  },
  {
    id: 21,
    term: "Muhajirun",
    arabic: "المهاجرون",
    transliteration: "Muhajirun",
    category: "People & Groups",
    definition: "The Muslims who migrated from Makkah to Madinah.",
    whyItMatters: "Their sacrifice is one of the main themes of the Seerah.",
    definitionAr: "المسلمون الذين هاجروا من مكة إلى المدينة.",
    definitionFr: "Les musulmans qui ont émigré de La Mecque vers Médine.",
    whyItMattersAr: "تضحيتهم من أبرز الموضوعات الأساسية في السيرة.",
    whyItMattersFr: "Leur sacrifice est l'un des thèmes principaux de la Sîra.",
    priority: true,
  },
  {
    id: 22,
    term: "Ansar",
    arabic: "الأنصار",
    transliteration: "Ansar",
    category: "People & Groups",
    definition: "The Muslims of Madinah who supported the Prophet ﷺ and the Muhajirun.",
    whyItMatters: "Their support allowed the Muslim community to become established.",
    definitionAr: "مسلمو المدينة الذين نصروا النبي ﷺ والمهاجرين.",
    definitionFr: "Les musulmans de Médine qui ont soutenu le Prophète ﷺ et les Muhajirun.",
    whyItMattersAr: "أتاح دعمهم للمجتمع المسلم أن يترسّخ ويستقر.",
    whyItMattersFr: "Leur soutien a permis à la communauté musulmane de s'établir.",
    priority: true,
  },
  {
    id: 23,
    term: "Badriyyun",
    arabic: "البدريون",
    transliteration: "Badriyyun",
    category: "People & Groups",
    definition: "The companions who participated in the Battle of Badr.",
    whyItMatters: "They hold a special status in Islamic history.",
    definitionAr: "الصحابة الذين شهدوا غزوة بدر.",
    definitionFr: "Les compagnons qui ont participé à la bataille de Badr.",
    whyItMattersAr: "لهم مكانة خاصة في التاريخ الإسلامي.",
    whyItMattersFr: "Ils occupent un statut particulier dans l'histoire islamique.",
    priority: false,
  },
  {
    id: 24,
    term: "Munafiq",
    arabic: "منافق",
    transliteration: "Munafiq",
    category: "Society & Culture",
    definition: "A hypocrite who outwardly claims Islam while hiding disbelief.",
    whyItMatters: "The hypocrites caused internal harm in Madinah.",
    definitionAr: "منافق يُظهر الإسلام ظاهرًا ويُخفي الكفر باطنًا.",
    definitionFr: "Un hypocrite qui se dit musulman en apparence tout en cachant la mécréance.",
    whyItMattersAr: "تسبّب المنافقون في ضرر داخلي في المدينة.",
    whyItMattersFr: "Les hypocrites ont causé un préjudice interne à Médine.",
    priority: false,
  },
  {
    id: 25,
    term: "Mushrik",
    arabic: "مشرك",
    transliteration: "Mushrik",
    category: "Society & Culture",
    definition: "One who commits shirk by associating partners with Allah.",
    whyItMatters: "The early Makkan opposition was rooted in shirk and idol worship.",
    definitionAr: "من يقع في الشرك بأن يجعل لله شريكًا في العبادة.",
    definitionFr: "Celui qui commet le shirk en associant des partenaires à Allah.",
    whyItMattersAr: "كانت معارضة قريش الأولى في مكة قائمة على الشرك وعبادة الأوثان.",
    whyItMattersFr: "L'opposition mecquoise primitive était enracinée dans le shirk et l'idolâtrie.",
    priority: false,
  },
  {
    id: 26,
    term: "Shirk",
    arabic: "شرك",
    transliteration: "Shirk",
    category: "Core Seerah Terms",
    definition: "Associating partners with Allah in worship.",
    whyItMatters: "The Prophet's ﷺ mission began by calling people away from shirk.",
    definitionAr: "جعل شريك لله سبحانه وتعالى في العبادة.",
    definitionFr: "Associer des partenaires à Allah dans l'adoration.",
    whyItMattersAr: "بدأت رسالة النبي ﷺ بدعوة الناس للبعد عن الشرك.",
    whyItMattersFr: "La mission du Prophète ﷺ a commencé en appelant les gens à quitter le shirk.",
    priority: true,
  },
  {
    id: 27,
    term: "Tawhid",
    arabic: "توحيد",
    transliteration: "Tawhid",
    category: "Core Seerah Terms",
    definition: "Singling out Allah alone in worship.",
    whyItMatters: "Tawhid is the foundation of the Prophet's ﷺ message.",
    definitionAr: "إفراد الله سبحانه وتعالى وحده بالعبادة.",
    definitionFr: "Réserver l'adoration à Allah seul.",
    whyItMattersAr: "التوحيد هو أساس رسالة النبي ﷺ.",
    whyItMattersFr: "Le tawhid est le fondement du message du Prophète ﷺ.",
    priority: true,
  },
  {
    id: 28,
    term: "Jahiliyyah",
    arabic: "الجاهلية",
    transliteration: "Jahiliyyah",
    category: "Society & Culture",
    definition: "The pre-Islamic age of ignorance.",
    whyItMatters: "The Seerah shows how Islam transformed society from Jahiliyyah to guidance.",
    definitionAr: "عصر الجاهلية الذي سبق الإسلام.",
    definitionFr: "L'âge de l'ignorance préislamique.",
    whyItMattersAr: "تُظهر السيرة كيف حوّل الإسلام المجتمع من الجاهلية إلى الهدى.",
    whyItMattersFr: "La Sîra montre comment l'islam a transformé la société de la Jahiliyyah vers la guidance.",
    priority: true,
  },
  {
    id: 29,
    term: "Da'wah",
    arabic: "دعوة",
    transliteration: "Da'wah",
    category: "Core Seerah Terms",
    definition: "Calling people to Islam.",
    whyItMatters: "The Prophet's ﷺ life was centered on calling people to worship Allah alone.",
    definitionAr: "دعوة الناس إلى الإسلام.",
    definitionFr: "Appeler les gens à l'islam.",
    whyItMattersAr: "تمحورت حياة النبي ﷺ حول دعوة الناس لعبادة الله وحده.",
    whyItMattersFr: "La vie du Prophète ﷺ était centrée sur l'appel des gens à adorer Allah seul.",
    priority: true,
  },
  {
    id: 30,
    term: "Iman",
    arabic: "إيمان",
    transliteration: "Iman",
    category: "Core Seerah Terms",
    definition: "Faith or belief.",
    whyItMatters: "The Makkan period focused heavily on building iman.",
    definitionAr: "الإيمان، وهو التصديق واليقين.",
    definitionFr: "La foi ou la croyance.",
    whyItMattersAr: "ركّزت الفترة المكية بشكل كبير على بناء الإيمان.",
    whyItMattersFr: "La période mecquoise s'est beaucoup concentrée sur la construction de l'iman.",
    priority: false,
  },
  {
    id: 31,
    term: "Islam",
    arabic: "إسلام",
    transliteration: "Islam",
    category: "Core Seerah Terms",
    definition: "Submission to Allah through tawhid and obedience.",
    whyItMatters: "The Prophet ﷺ called people to Islam.",
    definitionAr: "الاستسلام لله بالتوحيد والطاعة.",
    definitionFr: "La soumission à Allah par le tawhid et l'obéissance.",
    whyItMattersAr: "دعا النبي ﷺ الناس إلى الإسلام.",
    whyItMattersFr: "Le Prophète ﷺ a appelé les gens à l'islam.",
    priority: false,
  },
  {
    id: 32,
    term: "Ihsan",
    arabic: "إحسان",
    transliteration: "Ihsan",
    category: "Core Seerah Terms",
    definition: "Worshiping Allah with excellence and awareness.",
    whyItMatters: "The Seerah shows the Prophet's ﷺ excellence in worship and character.",
    definitionAr: "عبادة الله بإتقان وحضور القلب.",
    definitionFr: "Adorer Allah avec excellence et conscience.",
    whyItMattersAr: "تُظهر السيرة إحسان النبي ﷺ في عبادته وأخلاقه.",
    whyItMattersFr: "La Sîra montre l'excellence du Prophète ﷺ dans l'adoration et le caractère.",
    priority: false,
  },
  {
    id: 33,
    term: "Hijrah",
    arabic: "الهجرة",
    transliteration: "Hijrah",
    category: "Core Seerah Terms",
    definition: "Migration for the sake of Allah, especially the migration from Makkah to Madinah.",
    whyItMatters: "The Hijrah was a turning point in the Seerah.",
    definitionAr: "الهجرة في سبيل الله، وخاصة الهجرة من مكة إلى المدينة.",
    definitionFr: "L'émigration pour Allah, en particulier celle de La Mecque vers Médine.",
    whyItMattersAr: "كانت الهجرة نقطة تحوّل كبرى في السيرة.",
    whyItMattersFr: "La Hijrah a été un tournant dans la Sîra.",
    priority: true,
  },
  {
    id: 34,
    term: "Bay'ah",
    arabic: "بيعة",
    transliteration: "Bay'ah",
    category: "Governance & Treaties",
    definition: "A pledge of allegiance or commitment.",
    whyItMatters: "The pledges before Hijrah helped prepare Madinah for Islam.",
    definitionAr: "بيعة، أي عهد وموافقة على الولاء.",
    definitionFr: "Un serment d'allégeance ou d'engagement.",
    whyItMattersAr: "مهّدت البيعات قبل الهجرة الطريق لدخول الإسلام إلى المدينة.",
    whyItMattersFr: "Les serments avant la Hijrah ont préparé Médine à l'islam.",
    priority: true,
  },
  {
    id: 35,
    term: "Bay'at al-Aqabah",
    arabic: "بيعة العقبة",
    transliteration: "Bay'at al-Aqabah",
    category: "Governance & Treaties",
    definition: "The pledges made by people of Madinah to support the Prophet ﷺ.",
    whyItMatters: "These pledges paved the way for the Hijrah.",
    definitionAr: "البيعات التي قدّمها أهل المدينة لنصرة النبي ﷺ.",
    definitionFr: "Les serments faits par les habitants de Médine pour soutenir le Prophète ﷺ.",
    whyItMattersAr: "مهّدت هذه البيعات الطريق للهجرة.",
    whyItMattersFr: "Ces serments ont ouvert la voie à la Hijrah.",
    priority: false,
  },
  {
    id: 36,
    term: "Mithaq",
    arabic: "ميثاق",
    transliteration: "Mithaq",
    category: "Governance & Treaties",
    definition: "A covenant or agreement.",
    whyItMatters: "Covenants and treaties shaped the Madinan period.",
    definitionAr: "ميثاق أو عهد.",
    definitionFr: "Une alliance ou un accord.",
    whyItMattersAr: "شكّلت المواثيق والمعاهدات ملامح الفترة المدنية.",
    whyItMattersFr: "Les alliances et traités ont façonné la période médinoise.",
    priority: false,
  },
  {
    id: 37,
    term: "Sulh",
    arabic: "صلح",
    transliteration: "Sulh",
    category: "Governance & Treaties",
    definition: "Peace agreement or reconciliation.",
    whyItMatters: "The Treaty of Hudaybiyyah is a major example of sulh.",
    definitionAr: "اتفاق سلام أو مصالحة.",
    definitionFr: "Accord de paix ou réconciliation.",
    whyItMattersAr: "صلح الحديبية مثال بارز على الصلح.",
    whyItMattersFr: "Le traité de Hudaybiyyah est un exemple majeur de sulh.",
    priority: false,
  },
  {
    id: 38,
    term: "Hudnah",
    arabic: "هدنة",
    transliteration: "Hudnah",
    category: "Governance & Treaties",
    definition: "A truce or temporary peace.",
    whyItMatters: "Truces affected the relationship between Muslims and Quraysh.",
    definitionAr: "هدنة أو سلام مؤقت.",
    definitionFr: "Une trêve ou une paix temporaire.",
    whyItMattersAr: "أثّرت الهدنات في العلاقة بين المسلمين وقريش.",
    whyItMattersFr: "Les trêves ont influencé la relation entre les musulmans et Quraysh.",
    priority: false,
  },
  {
    id: 39,
    term: "Ummah",
    arabic: "أمة",
    transliteration: "Ummah",
    category: "Society & Culture",
    definition: "A community united by faith.",
    whyItMatters: "The Seerah shows the formation of the Muslim Ummah.",
    definitionAr: "أمة يجمعها الإيمان.",
    definitionFr: "Une communauté unie par la foi.",
    whyItMattersAr: "تُظهر السيرة تكوّن الأمة المسلمة.",
    whyItMattersFr: "La Sîra montre la formation de l'Oumma musulmane.",
    priority: false,
  },
  {
    id: 40,
    term: "Dar al-Arqam",
    arabic: "دار الأرقم",
    transliteration: "Dar al-Arqam",
    category: "Places",
    definition: "The house where early Muslims secretly learned Islam in Makkah.",
    whyItMatters: "It represents the early private stage of da'wah.",
    definitionAr: "الدار التي كان المسلمون الأوائل يتعلمون فيها الإسلام سرًا في مكة.",
    definitionFr: "La maison où les premiers musulmans apprenaient l'islam en secret à La Mecque.",
    whyItMattersAr: "تمثّل مرحلة الدعوة السرية الأولى.",
    whyItMattersFr: "Elle représente la première étape privée de la da'wah.",
    priority: false,
  },
  {
    id: 41,
    term: "Makkah",
    arabic: "مكة",
    transliteration: "Makkah",
    category: "Places",
    definition: "The birthplace of the Prophet ﷺ and the city of the Ka'bah.",
    whyItMatters: "The Makkan period shaped the early mission.",
    definitionAr: "مسقط رأس النبي ﷺ، والمدينة التي تضم الكعبة المشرّفة.",
    definitionFr: "Le lieu de naissance du Prophète ﷺ et la ville de la Ka'bah.",
    whyItMattersAr: "في مكة تشكّلت ملامح الدعوة الأولى وبداية الرسالة.",
    whyItMattersFr: "La période mecquoise a façonné la mission naissante.",
    priority: true,
  },
  {
    id: 42,
    term: "Madinah",
    arabic: "المدينة",
    transliteration: "Madinah",
    category: "Places",
    definition: "The city where the Prophet ﷺ migrated and established the Muslim community.",
    whyItMatters: "The Madinan period shaped worship, governance, and community life.",
    definitionAr: "المدينة التي هاجر إليها النبي ﷺ وأسّس فيها المجتمع المسلم.",
    definitionFr: "La ville où le Prophète ﷺ a émigré et établi la communauté musulmane.",
    whyItMattersAr: "في العهد المدني تشكّلت معالم العبادة والحكم والحياة الاجتماعية للمسلمين.",
    whyItMattersFr: "La période médinoise a façonné l'adoration, la gouvernance et la vie communautaire.",
    priority: true,
  },
  {
    id: 43,
    term: "Yathrib",
    arabic: "يثرب",
    transliteration: "Yathrib",
    category: "Places",
    definition: "The earlier name of Madinah.",
    whyItMatters: "It was the city that became the home of the Muslim community after Hijrah.",
    definitionAr: "الاسم القديم لمدينة المدينة المنورة.",
    definitionFr: "L'ancien nom de Médine.",
    whyItMattersAr: "هي المدينة التي أصبحت موطن المجتمع المسلم بعد الهجرة.",
    whyItMattersFr: "C'était la ville qui est devenue le foyer de la communauté musulmane après la Hijrah.",
    priority: false,
  },
  {
    id: 44,
    term: "Ka'bah",
    arabic: "الكعبة",
    transliteration: "Ka'bah",
    category: "Places",
    definition: "The sacred House in Makkah.",
    whyItMatters: "It is central to worship, Hajj, and the history of Ibrahim عليه السلام.",
    definitionAr: "البيت المقدَّس في مكة المكرمة.",
    definitionFr: "La Maison sacrée à La Mecque.",
    whyItMattersAr: "تحتل مكانة مركزية في العبادة والحج، وترتبط بقصة إبراهيم عليه السلام.",
    whyItMattersFr: "Elle est centrale pour l'adoration, le Hajj et l'histoire d'Ibrahim عليه السلام.",
    priority: false,
  },
  {
    id: 45,
    term: "Haram",
    arabic: "الحرم",
    transliteration: "Haram",
    category: "Places",
    definition: "A sacred sanctuary area.",
    whyItMatters: "Makkah has a sacred sanctuary with special rulings and honor.",
    definitionAr: "منطقة مقدّسة ذات حرمة خاصة.",
    definitionFr: "Une zone de sanctuaire sacré.",
    whyItMattersAr: "لمكة حَرَم مقدّس له أحكام خاصة ومكانة عظيمة.",
    whyItMattersFr: "La Mecque possède un sanctuaire sacré avec des règles et un honneur particuliers.",
    priority: false,
  },
  {
    id: 46,
    term: "Hira",
    arabic: "حراء",
    transliteration: "Hira",
    category: "Places",
    definition: "The cave where the first revelation came.",
    whyItMatters: "Revelation began there.",
    definitionAr: "الغار الذي نزل فيه الوحي لأول مرة.",
    definitionFr: "La grotte où est venue la première révélation.",
    whyItMattersAr: "فيه بدأ الوحي على النبي ﷺ.",
    whyItMattersFr: "La révélation y a commencé.",
    priority: false,
  },
  {
    id: 47,
    term: "Thawr",
    arabic: "ثور",
    transliteration: "Thawr",
    category: "Places",
    definition: "The cave where the Prophet ﷺ and Abu Bakr رضي الله عنه hid during the Hijrah.",
    whyItMatters: "It is connected to Allah's protection during migration.",
    definitionAr: "الغار الذي اختفى فيه النبي ﷺ وأبو بكر رضي الله عنه خلال الهجرة.",
    definitionFr: "La grotte où le Prophète ﷺ et Abu Bakr رضي الله عنه se sont cachés pendant la Hijrah.",
    whyItMattersAr: "يرتبط بحفظ الله سبحانه وتعالى لهما خلال رحلة الهجرة.",
    whyItMattersFr: "Elle est liée à la protection d'Allah pendant l'émigration.",
    priority: false,
  },
  {
    id: 48,
    term: "Quba",
    arabic: "قباء",
    transliteration: "Quba",
    category: "Places",
    definition: "A place near Madinah where the Prophet ﷺ stopped after the Hijrah.",
    whyItMatters: "It is connected to the first mosque built in Islam.",
    definitionAr: "موضع قريب من المدينة توقف فيه النبي ﷺ بعد الهجرة.",
    definitionFr: "Un lieu près de Médine où le Prophète ﷺ s'est arrêté après la Hijrah.",
    whyItMattersAr: "يرتبط بأول مسجد بُني في الإسلام.",
    whyItMattersFr: "Il est lié à la première mosquée construite en islam.",
    priority: false,
  },
  {
    id: 49,
    term: "Badr",
    arabic: "بدر",
    transliteration: "Badr",
    category: "Places",
    definition: "A location where the first major battle occurred.",
    whyItMatters: "Badr was a major turning point for the Muslims.",
    definitionAr: "موضع وقعت فيه أول معركة كبرى في الإسلام.",
    definitionFr: "Un lieu où s'est déroulée la première grande bataille.",
    whyItMattersAr: "كانت غزوة بدر نقطة تحوّل عظيمة للمسلمين.",
    whyItMattersFr: "Badr a été un tournant majeur pour les musulmans.",
    priority: false,
  },
  {
    id: 50,
    term: "Uhud",
    arabic: "أحد",
    transliteration: "Uhud",
    category: "Places",
    definition: "A mountain near Madinah.",
    whyItMatters: "It was the site of the Battle of Uhud.",
    definitionAr: "جبل قريب من المدينة المنورة.",
    definitionFr: "Une montagne près de Médine.",
    whyItMattersAr: "كان مسرحاً لغزوة أحد.",
    whyItMattersFr: "C'était le site de la bataille de Uhud.",
    priority: false,
  },
  {
    id: 51,
    term: "Khandaq",
    arabic: "الخندق",
    transliteration: "Khandaq",
    category: "Battles & Expeditions",
    definition: "The trench dug around Madinah during the Battle of the Trench.",
    whyItMatters: "It shows strategy, consultation, and defensive planning.",
    definitionAr: "الخندق الذي حُفر حول المدينة في غزوة الخندق.",
    definitionFr: "Le fossé creusé autour de Médine pendant la bataille du Fossé.",
    whyItMattersAr: "يُظهر التخطيط الدفاعي والتشاور الذي اتّبعه المسلمون.",
    whyItMattersFr: "Il montre la stratégie, la consultation et la planification défensive.",
    priority: false,
  },
  {
    id: 52,
    term: "Ahzab",
    arabic: "الأحزاب",
    transliteration: "Ahzab",
    category: "Battles & Expeditions",
    definition: "The confederate groups that gathered against Madinah.",
    whyItMatters: "The Battle of the Trench is also called the Battle of al-Ahzab.",
    definitionAr: "الأحلاف والقبائل التي تجمّعت لمحاربة المدينة.",
    definitionFr: "Les groupes confédérés qui se sont rassemblés contre Médine.",
    whyItMattersAr: "تُسمّى غزوة الخندق أيضاً غزوة الأحزاب.",
    whyItMattersFr: "La bataille du Fossé est aussi appelée la bataille des al-Ahzab.",
    priority: false,
  },
  {
    id: 53,
    term: "Hudaybiyyah",
    arabic: "الحديبية",
    transliteration: "Hudaybiyyah",
    category: "Places",
    definition: "The place where the famous treaty with Quraysh occurred.",
    whyItMatters: "It became a major opening for Islam.",
    definitionAr: "الموضع الذي تمّ فيه الصلح المشهور مع قريش.",
    definitionFr: "Le lieu où s'est déroulé le célèbre traité avec Quraysh.",
    whyItMattersAr: "أصبح فتحاً عظيماً مهّد الطريق لانتشار الإسلام.",
    whyItMattersFr: "Cela est devenu une ouverture majeure pour l'islam.",
    priority: false,
  },
  {
    id: 54,
    term: "Khaybar",
    arabic: "خيبر",
    transliteration: "Khaybar",
    category: "Places",
    definition: "A fortified oasis north of Madinah.",
    whyItMatters: "It was the site of a major campaign in the Madinan period.",
    definitionAr: "واحة محصّنة تقع شمال المدينة المنورة.",
    definitionFr: "Une oasis fortifiée au nord de Médine.",
    whyItMattersAr: "كانت مسرحاً لغزوة كبرى في العهد المدني.",
    whyItMattersFr: "Ce fut le site d'une campagne majeure de la période médinoise.",
    priority: false,
  },
  {
    id: 55,
    term: "Hunayn",
    arabic: "حنين",
    transliteration: "Hunayn",
    category: "Places",
    definition: "A valley where a major battle occurred after the conquest of Makkah.",
    whyItMatters: "It taught that victory comes from Allah, not numbers.",
    definitionAr: "وادٍ وقعت فيه معركة كبرى بعد فتح مكة.",
    definitionFr: "Une vallée où s'est déroulée une grande bataille après la conquête de La Mecque.",
    whyItMattersAr: "علّمت المسلمين أن النصر من عند الله لا بكثرة العدد.",
    whyItMattersFr: "Elle a enseigné que la victoire vient d'Allah, non du nombre.",
    priority: false,
  },
  {
    id: 56,
    term: "Ta'if",
    arabic: "الطائف",
    transliteration: "Ta'if",
    category: "Places",
    definition: "A city near Makkah.",
    whyItMatters: "The Prophet ﷺ went there seeking support after the Year of Sorrow.",
    definitionAr: "مدينة قريبة من مكة المكرمة.",
    definitionFr: "Une ville près de La Mecque.",
    whyItMattersAr: "توجّه إليها النبي ﷺ طالباً النصرة بعد عام الحزن.",
    whyItMattersFr: "Le Prophète ﷺ s'y est rendu pour chercher du soutien après l'Année de la Tristesse.",
    priority: false,
  },
  {
    id: 57,
    term: "Tabuk",
    arabic: "تبوك",
    transliteration: "Tabuk",
    category: "Places",
    definition: "A northern expedition destination.",
    whyItMatters: "It was one of the last major expeditions of the Prophet ﷺ.",
    definitionAr: "وجهة غزوة في أقصى شمال الجزيرة العربية.",
    definitionFr: "Une destination d'expédition au nord.",
    whyItMattersAr: "كانت من آخر الغزوات الكبرى التي قادها النبي ﷺ.",
    whyItMattersFr: "Ce fut l'une des dernières grandes expéditions du Prophète ﷺ.",
    priority: false,
  },
  {
    id: 58,
    term: "Abyssinia",
    arabic: "الحبشة",
    transliteration: "Al-Habashah",
    category: "Places",
    definition: "The land where early Muslims migrated for safety.",
    whyItMatters: "It shows the persecution early Muslims faced in Makkah.",
    definitionAr: "الأرض التي هاجر إليها أوائل المسلمين طلباً للأمان.",
    definitionFr: "Le pays où les premiers musulmans ont émigré pour se mettre en sécurité.",
    whyItMattersAr: "تُظهر شدة الأذى الذي تعرّض له المسلمون الأوائل في مكة.",
    whyItMattersFr: "Cela montre la persécution que les premiers musulmans ont subie à La Mecque.",
    priority: false,
  },
  {
    id: 59,
    term: "Quraysh",
    arabic: "قريش",
    transliteration: "Quraysh",
    category: "Tribes & Lineage",
    definition: "The major tribe of Makkah.",
    whyItMatters: "The Prophet ﷺ was from Quraysh, and Quraysh led much of the early opposition.",
    definitionAr: "القبيلة الكبرى في مكة المكرمة.",
    definitionFr: "La grande tribu de La Mecque.",
    whyItMattersAr: "كان النبي ﷺ منها، وكانت قريش في طليعة من عارض الدعوة في بدايتها.",
    whyItMattersFr: "Le Prophète ﷺ était de Quraysh, et Quraysh a mené une grande partie de l'opposition initiale.",
    priority: true,
  },
  {
    id: 60,
    term: "Banu Hashim",
    arabic: "بنو هاشم",
    transliteration: "Banu Hashim",
    category: "Tribes & Lineage",
    definition: "The clan of the Prophet ﷺ within Quraysh.",
    whyItMatters: "Tribal protection from Banu Hashim shaped the Makkan period.",
    definitionAr: "بطن النبي ﷺ من قبيلة قريش.",
    definitionFr: "Le clan du Prophète ﷺ au sein de Quraysh.",
    whyItMattersAr: "شكّلت حماية بني هاشم للنبي ﷺ عاملاً مهماً في العهد المكي.",
    whyItMattersFr: "La protection tribale des Banu Hashim a façonné la période mecquoise.",
    priority: true,
  },
  {
    id: 61,
    term: "Banu Muttalib",
    arabic: "بنو المطلب",
    transliteration: "Banu al-Muttalib",
    category: "Tribes & Lineage",
    definition: "A clan closely connected to Banu Hashim.",
    whyItMatters: "They supported Banu Hashim during major hardships.",
    definitionAr: "بطن وثيق الصلة ببني هاشم.",
    definitionFr: "Un clan étroitement lié aux Banu Hashim.",
    whyItMattersAr: "وقفوا مع بني هاشم في أوقات الشدة والحصار.",
    whyItMattersFr: "Ils ont soutenu les Banu Hashim durant les grandes épreuves.",
    priority: false,
  },
  {
    id: 62,
    term: "Banu Umayyah",
    arabic: "بنو أمية",
    transliteration: "Banu Umayyah",
    category: "Tribes & Lineage",
    definition: "A powerful clan of Quraysh.",
    whyItMatters: "Major figures like Uthman, Abu Sufyan, and Mu'awiyah were connected to this clan.",
    definitionAr: "بطن قوي من قبيلة قريش.",
    definitionFr: "Un clan puissant de Quraysh.",
    whyItMattersAr: "انتسب إليه شخصيات بارزة مثل عثمان وأبي سفيان ومعاوية رضي الله عنهم.",
    whyItMattersFr: "Des figures majeures comme Uthman, Abu Sufyan et Mu'awiyah étaient liées à ce clan.",
    priority: false,
  },
  {
    id: 63,
    term: "Banu Makhzum",
    arabic: "بنو مخزوم",
    transliteration: "Banu Makhzum",
    category: "Tribes & Lineage",
    definition: "A powerful Qurayshi clan.",
    whyItMatters: "Abu Jahl and Khalid ibn al-Walid were connected to this clan.",
    definitionAr: "بطن قوي من بطون قريش.",
    definitionFr: "Un clan qurayshite puissant.",
    whyItMattersAr: "انتسب إليه أبو جهل وخالد بن الوليد رضي الله عنه.",
    whyItMattersFr: "Abu Jahl et Khalid ibn al-Walid étaient liés à ce clan.",
    priority: false,
  },
  {
    id: 64,
    term: "Aws",
    arabic: "الأوس",
    transliteration: "Aws",
    category: "Tribes & Lineage",
    definition: "One of the two major Arab tribes of Madinah.",
    whyItMatters: "Many from Aws became Ansar.",
    definitionAr: "إحدى القبيلتين العربيتين الكبريين في المدينة.",
    definitionFr: "L'une des deux grandes tribus arabes de Médine.",
    whyItMattersAr: "أصبح كثير من الأوس من الأنصار.",
    whyItMattersFr: "Beaucoup d'Aws sont devenus Ansar.",
    priority: false,
  },
  {
    id: 65,
    term: "Khazraj",
    arabic: "الخزرج",
    transliteration: "Khazraj",
    category: "Tribes & Lineage",
    definition: "One of the two major Arab tribes of Madinah.",
    whyItMatters: "Many from Khazraj became Ansar.",
    definitionAr: "إحدى القبيلتين العربيتين الكبريين في المدينة.",
    definitionFr: "L'une des deux grandes tribus arabes de Médine.",
    whyItMattersAr: "أصبح كثير من الخزرج من الأنصار.",
    whyItMattersFr: "Beaucoup de Khazraj sont devenus Ansar.",
    priority: false,
  },
  {
    id: 66,
    term: "Banu Qaynuqa",
    arabic: "بنو قينقاع",
    transliteration: "Banu Qaynuqa",
    category: "Tribes & Lineage",
    definition: "A Jewish tribe in Madinah.",
    whyItMatters: "They were part of the political landscape of Madinah.",
    definitionAr: "قبيلة يهودية كانت تسكن المدينة.",
    definitionFr: "Une tribu juive de Médine.",
    whyItMattersAr: "كانوا جزءاً من المشهد السياسي في المدينة.",
    whyItMattersFr: "Ils faisaient partie du paysage politique de Médine.",
    priority: false,
  },
  {
    id: 67,
    term: "Banu Nadir",
    arabic: "بنو النضير",
    transliteration: "Banu Nadir",
    category: "Tribes & Lineage",
    definition: "A Jewish tribe in Madinah.",
    whyItMatters: "They were involved in major treaty-related events.",
    definitionAr: "قبيلة يهودية كانت تسكن المدينة.",
    definitionFr: "Une tribu juive de Médine.",
    whyItMattersAr: "كانت لهم صلة بأحداث مهمة تتعلق بنقض العهود.",
    whyItMattersFr: "Ils ont été impliqués dans d'importants événements liés aux traités.",
    priority: false,
  },
  {
    id: 68,
    term: "Banu Qurayzah",
    arabic: "بنو قريظة",
    transliteration: "Banu Qurayzah",
    category: "Tribes & Lineage",
    definition: "A Jewish tribe in Madinah.",
    whyItMatters: "They are connected to events after the Battle of the Trench.",
    definitionAr: "قبيلة يهودية كانت تسكن المدينة.",
    definitionFr: "Une tribu juive de Médine.",
    whyItMattersAr: "ترتبط بأحداث وقعت بعد غزوة الخندق.",
    whyItMattersFr: "Ils sont liés aux événements après la bataille du Fossé.",
    priority: false,
  },
  {
    id: 69,
    term: "Adnan",
    arabic: "عدنان",
    transliteration: "Adnan",
    category: "Tribes & Lineage",
    definition: "An ancestor in the Prophet's ﷺ lineage.",
    whyItMatters: "The Prophet's ﷺ lineage is commonly traced with certainty up to Adnan.",
    definitionAr: "جدّ من أجداد النبي ﷺ.",
    definitionFr: "Un ancêtre dans la lignée du Prophète ﷺ.",
    whyItMattersAr: "يُنسب النبي ﷺ إليه بثقة وصحة، وهو الحد الذي يُتوقف عنده غالباً في تحقيق النسب.",
    whyItMattersFr: "La lignée du Prophète ﷺ est généralement retracée avec certitude jusqu'à Adnan.",
    priority: false,
  },
  {
    id: 70,
    term: "Kinanah",
    arabic: "كنانة",
    transliteration: "Kinanah",
    category: "Tribes & Lineage",
    definition: "An ancestral tribe above Quraysh.",
    whyItMatters: "Quraysh traces upward through Kinanah.",
    definitionAr: "قبيلة من أجداد قريش.",
    definitionFr: "Une tribu ancestrale au-dessus de Quraysh.",
    whyItMattersAr: "يمتد نسب قريش صعوداً عبر كنانة.",
    whyItMattersFr: "Quraysh remonte par Kinanah.",
    priority: false,
  },
  {
    id: 71,
    term: "Isma'il",
    arabic: "إسماعيل",
    transliteration: "Isma'il",
    category: "Tribes & Lineage",
    definition: "The son of Ibrahim عليه السلام.",
    whyItMatters: "The Prophet's ﷺ lineage is traditionally connected to Isma'il عليه السلام.",
    definitionAr: "ابن النبي إبراهيم عليه السلام.",
    definitionFr: "Le fils d'Ibrahim عليه السلام.",
    whyItMattersAr: "يُنسب النبي ﷺ في الروايات إلى إسماعيل عليه السلام.",
    whyItMattersFr: "La lignée du Prophète ﷺ est traditionnellement liée à Isma'il عليه السلام.",
    priority: false,
  },
  {
    id: 72,
    term: "Ibrahim",
    arabic: "إبراهيم",
    transliteration: "Ibrahim",
    category: "Tribes & Lineage",
    definition: "The prophet Ibrahim عليه السلام.",
    whyItMatters: "The Ka'bah and the Prophet's ﷺ lineage are connected to Ibrahim عليه السلام.",
    definitionAr: "النبي إبراهيم عليه السلام.",
    definitionFr: "Le prophète Ibrahim عليه السلام.",
    whyItMattersAr: "ترتبط الكعبة ونسب النبي ﷺ بإبراهيم عليه السلام.",
    whyItMattersFr: "La Ka'bah et la lignée du Prophète ﷺ sont liées à Ibrahim عليه السلام.",
    priority: false,
  },
  {
    id: 73,
    term: "Ghazwah",
    arabic: "غزوة",
    transliteration: "Ghazwah",
    category: "Battles & Expeditions",
    definition: "An expedition the Prophet ﷺ personally went out on.",
    whyItMatters: "Many major Seerah campaigns are called ghazawat.",
    definitionAr: "غزوة خرج فيها النبي ﷺ بنفسه.",
    definitionFr: "Une expédition à laquelle le Prophète ﷺ a personnellement participé.",
    whyItMattersAr: "كثير من الأحداث العسكرية الكبرى في السيرة تُسمّى غزوات.",
    whyItMattersFr: "De nombreuses grandes campagnes de la Sîra sont appelées ghazawat.",
    priority: true,
  },
  {
    id: 74,
    term: "Sariyyah",
    arabic: "سرية",
    transliteration: "Sariyyah",
    category: "Battles & Expeditions",
    definition: "An expedition sent by the Prophet ﷺ but led by a companion.",
    whyItMatters: "Not every expedition was personally led by the Prophet ﷺ.",
    definitionAr: "بعثة أرسلها النبي ﷺ بقيادة أحد الصحابة.",
    definitionFr: "Une expédition envoyée par le Prophète ﷺ mais dirigée par un compagnon.",
    whyItMattersAr: "لم تكن كل البعثات بقيادة النبي ﷺ شخصياً.",
    whyItMattersFr: "Toutes les expéditions n'étaient pas personnellement dirigées par le Prophète ﷺ.",
    priority: true,
  },
  {
    id: 75,
    term: "Maghazi",
    arabic: "المغازي",
    transliteration: "Maghazi",
    category: "Battles & Expeditions",
    definition: "Literature or reports about the Prophet's ﷺ campaigns.",
    whyItMatters: "Some early Seerah works focused heavily on maghazi.",
    definitionAr: "المصنّفات والأخبار المتعلقة بغزوات النبي ﷺ.",
    definitionFr: "La littérature ou les récits concernant les campagnes du Prophète ﷺ.",
    whyItMattersAr: "ركّزت بعض كتب السيرة المبكرة بشكل كبير على المغازي.",
    whyItMattersFr: "Certaines œuvres précoces de Sîra se concentraient beaucoup sur les maghazi.",
    priority: false,
  },
  {
    id: 76,
    term: "Jihad",
    arabic: "جهاد",
    transliteration: "Jihad",
    category: "Battles & Expeditions",
    definition: "Striving in the path of Allah.",
    whyItMatters: "It has specific meanings and rulings, and should not be reduced to modern political slogans.",
    definitionAr: "المجاهدة والسعي في سبيل الله سبحانه وتعالى.",
    definitionFr: "S'efforcer dans le chemin d'Allah.",
    whyItMattersAr: "له معانٍ وأحكام شرعية محددة، ولا ينبغي تحويره إلى شعارات سياسية معاصرة.",
    whyItMattersFr: "Il a des sens et des règles spécifiques, et ne doit pas être réduit à des slogans politiques modernes.",
    priority: false,
  },
  {
    id: 77,
    term: "Fath",
    arabic: "فتح",
    transliteration: "Fath",
    category: "Battles & Expeditions",
    definition: "Opening or conquest.",
    whyItMatters: "The Conquest of Makkah is called Fath Makkah.",
    definitionAr: "الفتح أو النصر المُبين.",
    definitionFr: "Ouverture ou conquête.",
    whyItMattersAr: "يُسمّى فتح مكة بهذا الاسم.",
    whyItMattersFr: "La conquête de La Mecque est appelée Fath Makkah.",
    priority: false,
  },
  {
    id: 78,
    term: "Fath Makkah",
    arabic: "فتح مكة",
    transliteration: "Fath Makkah",
    category: "Battles & Expeditions",
    definition: "The opening or conquest of Makkah.",
    whyItMatters: "It showed the Prophet's ﷺ mercy and forgiveness at victory.",
    definitionAr: "فتح مكة المكرمة ودخول المسلمين إليها.",
    definitionFr: "L'ouverture ou la conquête de La Mecque.",
    whyItMattersAr: "أظهر رحمة النبي ﷺ وعفوه عند النصر.",
    whyItMattersFr: "Elle a montré la miséricorde et le pardon du Prophète ﷺ dans la victoire.",
    priority: false,
  },
  {
    id: 79,
    term: "Treaty of Hudaybiyyah",
    arabic: "صلح الحديبية",
    transliteration: "Sulh al-Hudaybiyyah",
    category: "Governance & Treaties",
    definition: "The treaty between the Muslims and Quraysh.",
    whyItMatters: "It looked difficult at first but became a major opening.",
    definitionAr: "الصلح الذي عُقد بين المسلمين وقريش.",
    definitionFr: "Le traité entre les musulmans et Quraysh.",
    whyItMattersAr: "بدا صعباً في ظاهره، لكنه أصبح فتحاً عظيماً.",
    whyItMattersFr: "Il semblait difficile au début, mais est devenu une ouverture majeure.",
    priority: false,
  },
  {
    id: 80,
    term: "Constitution of Madinah",
    arabic: "صحيفة المدينة",
    transliteration: "Sahifat al-Madinah",
    category: "Governance & Treaties",
    definition: "A foundational agreement organizing the Madinan community.",
    whyItMatters: "It shows the Prophet's ﷺ leadership and community organization.",
    definitionAr: "وثيقة تأسيسية نظّمت شؤون مجتمع المدينة.",
    definitionFr: "Un accord fondateur organisant la communauté médinoise.",
    whyItMattersAr: "تُظهر حكمة النبي ﷺ في القيادة وتنظيم المجتمع.",
    whyItMattersFr: "Il montre le leadership et l'organisation communautaire du Prophète ﷺ.",
    priority: false,
  },
  {
    id: 81,
    term: "Qiblah",
    arabic: "قبلة",
    transliteration: "Qiblah",
    category: "Worship & Rituals",
    definition: "The direction Muslims face in prayer.",
    whyItMatters: "The qiblah changed from Jerusalem to the Ka'bah during the Madinan period.",
    definitionAr: "الجهة التي يتوجه إليها المسلمون في الصلاة.",
    definitionFr: "La direction vers laquelle les musulmans se tournent pour prier.",
    whyItMattersAr: "تغيّرت القبلة من بيت المقدس إلى الكعبة في العهد المدني.",
    whyItMattersFr: "La qiblah a changé de Jérusalem vers la Ka'bah pendant la période médinoise.",
    priority: false,
  },
  {
    id: 82,
    term: "Salah",
    arabic: "صلاة",
    transliteration: "Salah",
    category: "Worship & Rituals",
    definition: "The prescribed prayer.",
    whyItMatters: "The five daily prayers were established as central worship.",
    definitionAr: "الصلاة المفروضة التي شرعها الله على المسلمين.",
    definitionFr: "La prière prescrite.",
    whyItMattersAr: "فُرضت الصلوات الخمس في اليوم والليلة لتكون عماد العبادة في الإسلام.",
    whyItMattersFr: "Les cinq prières quotidiennes ont été établies comme adoration centrale.",
    priority: false,
  },
  {
    id: 83,
    term: "Wudu",
    arabic: "وضوء",
    transliteration: "Wudu",
    category: "Worship & Rituals",
    definition: "Ritual washing before prayer.",
    whyItMatters: "Many Seerah and hadith reports mention prayer and purification.",
    definitionAr: "الطهارة المائية التي يؤديها المسلم قبل الصلاة.",
    definitionFr: "L'ablution rituelle avant la prière.",
    whyItMattersAr: "وردت أحاديث كثيرة في السيرة تتحدث عن الصلاة والطهارة وأهميتها.",
    whyItMattersFr: "De nombreux récits de Sîra et de hadith mentionnent la prière et la purification.",
    priority: false,
  },
  {
    id: 84,
    term: "Ghusl",
    arabic: "غسل",
    transliteration: "Ghusl",
    category: "Worship & Rituals",
    definition: "Full ritual washing.",
    whyItMatters: "It is part of purification in Islamic law.",
    definitionAr: "غسل كامل للبدن للتطهر.",
    definitionFr: "Le lavage rituel complet.",
    whyItMattersAr: "يُعد الغسل جزءًا من أحكام الطهارة في الشريعة الإسلامية.",
    whyItMattersFr: "Il fait partie de la purification en droit islamique.",
    priority: false,
  },
  {
    id: 85,
    term: "Adhan",
    arabic: "أذان",
    transliteration: "Adhan",
    category: "Worship & Rituals",
    definition: "The call to prayer.",
    whyItMatters: "Bilal رضي الله عنه became known as the mu'adhdhin of the Prophet ﷺ.",
    definitionAr: "النداء الذي يُعلن به عن دخول وقت الصلاة.",
    definitionFr: "L'appel à la prière.",
    whyItMattersAr: "عُرف بلال رضي الله عنه بأنه مؤذن رسول الله ﷺ.",
    whyItMattersFr: "Bilal رضي الله عنه est devenu connu comme le mu'adhdhin du Prophète ﷺ.",
    priority: false,
  },
  {
    id: 86,
    term: "Mu'adhdhin",
    arabic: "مؤذن",
    transliteration: "Mu'adhdhin",
    category: "Worship & Rituals",
    definition: "The one who calls the adhan.",
    whyItMatters: "This role became part of Muslim community life in Madinah.",
    definitionAr: "الشخص الذي يرفع الأذان لإعلام الناس بوقت الصلاة.",
    definitionFr: "Celui qui lance l'adhan.",
    whyItMattersAr: "أصبح هذا الدور جزءًا من حياة المجتمع المسلم في المدينة.",
    whyItMattersFr: "Ce rôle est devenu partie de la vie communautaire musulmane à Médine.",
    priority: false,
  },
  {
    id: 87,
    term: "Masjid",
    arabic: "مسجد",
    transliteration: "Masjid",
    category: "Worship & Rituals",
    definition: "A mosque or place of prostration.",
    whyItMatters: "Masjid al-Nabawi became the center of worship, teaching, and leadership.",
    definitionAr: "مكان العبادة الذي يُسجد فيه لله.",
    definitionFr: "Une mosquée ou un lieu de prosternation.",
    whyItMattersAr: "أصبح المسجد النبوي مركزًا للعبادة والتعليم والقيادة.",
    whyItMattersFr: "Masjid al-Nabawi est devenu le centre de l'adoration, de l'enseignement et du leadership.",
    priority: false,
  },
  {
    id: 88,
    term: "Hajj",
    arabic: "حج",
    transliteration: "Hajj",
    category: "Worship & Rituals",
    definition: "The pilgrimage to Makkah.",
    whyItMatters: "The Prophet ﷺ performed the Farewell Hajj near the end of his life.",
    definitionAr: "فريضة الحج إلى مكة المكرمة.",
    definitionFr: "Le pèlerinage à La Mecque.",
    whyItMattersAr: "أدى النبي ﷺ حجة الوداع قرب نهاية حياته.",
    whyItMattersFr: "Le Prophète ﷺ a accompli le Hajj d'Adieu vers la fin de sa vie.",
    priority: false,
  },
  {
    id: 89,
    term: "Umrah",
    arabic: "عمرة",
    transliteration: "Umrah",
    category: "Worship & Rituals",
    definition: "The lesser pilgrimage to Makkah.",
    whyItMatters: "Hudaybiyyah and Umrat al-Qada are connected to Umrah.",
    definitionAr: "العمرة، وهي الحج الأصغر إلى مكة.",
    definitionFr: "Le petit pèlerinage à La Mecque.",
    whyItMattersAr: "ترتبط صلح الحديبية وعمرة القضاء بالعمرة.",
    whyItMattersFr: "Hudaybiyyah et Umrat al-Qada sont liés à l'Umrah.",
    priority: false,
  },
  {
    id: 90,
    term: "Ihram",
    arabic: "إحرام",
    transliteration: "Ihram",
    category: "Worship & Rituals",
    definition: "The sacred state entered for Hajj or Umrah.",
    whyItMatters: "It appears in the events around Hudaybiyyah and pilgrimage.",
    definitionAr: "حالة التقديس والتحريم التي يدخل فيها المعتمر أو الحاج.",
    definitionFr: "L'état de sacralité entré pour le Hajj ou l'Umrah.",
    whyItMattersAr: "يظهر ذكر الإحرام في أحداث صلح الحديبية والحج والعمرة.",
    whyItMattersFr: "Il apparaît dans les événements autour de Hudaybiyyah et du pèlerinage.",
    priority: false,
  },
  {
    id: 91,
    term: "Tawaf",
    arabic: "طواف",
    transliteration: "Tawaf",
    category: "Worship & Rituals",
    definition: "Circling the Ka'bah in worship.",
    whyItMatters: "It is central to Hajj and Umrah.",
    definitionAr: "الطواف حول الكعبة تعبدًا لله.",
    definitionFr: "Circuler autour de la Ka'bah en adoration.",
    whyItMattersAr: "يُعد الطواف ركنًا أساسيًا في الحج والعمرة.",
    whyItMattersFr: "Il est central au Hajj et à l'Umrah.",
    priority: false,
  },
  {
    id: 92,
    term: "Sa'i",
    arabic: "سعي",
    transliteration: "Sa'i",
    category: "Worship & Rituals",
    definition: "Walking between Safa and Marwah.",
    whyItMatters: "It is part of Hajj and Umrah.",
    definitionAr: "السعي بين الصفا والمروة.",
    definitionFr: "Marcher entre Safa et Marwah.",
    whyItMattersAr: "يُعد السعي جزءًا من مناسك الحج والعمرة.",
    whyItMattersFr: "Il fait partie du Hajj et de l'Umrah.",
    priority: false,
  },
  {
    id: 93,
    term: "Mina",
    arabic: "منى",
    transliteration: "Mina",
    category: "Places",
    definition: "A valley near Makkah connected to Hajj.",
    whyItMatters: "The pledges of Aqabah occurred near Mina.",
    definitionAr: "وادٍ قريب من مكة يرتبط بمناسك الحج.",
    definitionFr: "Une vallée près de La Mecque liée au Hajj.",
    whyItMattersAr: "وقعت بيعتا العقبة قرب منى.",
    whyItMattersFr: "Les serments d'Aqabah ont eu lieu près de Mina.",
    priority: false,
  },
  {
    id: 94,
    term: "Arafah",
    arabic: "عرفة",
    transliteration: "Arafah",
    category: "Places",
    definition: "A major plain connected to Hajj.",
    whyItMatters: "The Prophet ﷺ delivered his Farewell Sermon during the Farewell Hajj.",
    definitionAr: "صعيد عظيم يرتبط بأعمال الحج.",
    definitionFr: "Une grande plaine liée au Hajj.",
    whyItMattersAr: "خطب النبي ﷺ خطبة الوداع في عرفة خلال حجة الوداع.",
    whyItMattersFr: "Le Prophète ﷺ a prononcé son Sermon d'Adieu durant le Hajj d'Adieu.",
    priority: false,
  },
  {
    id: 95,
    term: "Muzdalifah",
    arabic: "مزدلفة",
    transliteration: "Muzdalifah",
    category: "Places",
    definition: "A Hajj location between Arafah and Mina.",
    whyItMatters: "It is part of the Hajj route.",
    definitionAr: "موضع من مواضع الحج يقع بين عرفة ومنى.",
    definitionFr: "Un lieu du Hajj entre Arafah et Mina.",
    whyItMattersAr: "تُعد مزدلفة جزءًا من مسار مناسك الحج.",
    whyItMattersFr: "Il fait partie du parcours du Hajj.",
    priority: false,
  },
  {
    id: 96,
    term: "Isra",
    arabic: "الإسراء",
    transliteration: "Isra",
    category: "Revelation",
    definition: "The Night Journey from al-Masjid al-Haram to al-Masjid al-Aqsa.",
    whyItMatters: "It was a major sign and honor given to the Prophet ﷺ.",
    definitionAr: "الرحلة الليلية من المسجد الحرام إلى المسجد الأقصى.",
    definitionFr: "Le Voyage Nocturne d'al-Masjid al-Haram à al-Masjid al-Aqsa.",
    whyItMattersAr: "كانت الإسراء آية عظيمة وتكريمًا خاصًا من الله للنبي ﷺ.",
    whyItMattersFr: "Ce fut un signe majeur et un honneur accordé au Prophète ﷺ.",
    priority: true,
  },
  {
    id: 97,
    term: "Mi'raj",
    arabic: "المعراج",
    transliteration: "Mi'raj",
    category: "Revelation",
    definition: "The ascension through the heavens.",
    whyItMatters: "The five daily prayers were given during this event.",
    definitionAr: "العروج بالنبي ﷺ عبر السماوات.",
    definitionFr: "L'ascension à travers les cieux.",
    whyItMattersAr: "فُرضت الصلوات الخمس على النبي ﷺ خلال هذه الرحلة.",
    whyItMattersFr: "Les cinq prières quotidiennes ont été prescrites durant cet événement.",
    priority: true,
  },
  {
    id: 98,
    term: "Al-Masjid al-Haram",
    arabic: "المسجد الحرام",
    transliteration: "Al-Masjid al-Haram",
    category: "Places",
    definition: "The sacred mosque in Makkah.",
    whyItMatters: "It contains the Ka'bah and is central to the Seerah.",
    definitionAr: "المسجد المقدس في مكة المكرمة.",
    definitionFr: "La mosquée sacrée de La Mecque.",
    whyItMattersAr: "يحتوي المسجد الحرام على الكعبة، وله مكانة محورية في السيرة النبوية.",
    whyItMattersFr: "Elle contient la Ka'bah et est centrale dans la Sîra.",
    priority: false,
  },
  {
    id: 99,
    term: "Al-Masjid al-Aqsa",
    arabic: "المسجد الأقصى",
    transliteration: "Al-Masjid al-Aqsa",
    category: "Places",
    definition: "The sacred mosque in Jerusalem.",
    whyItMatters: "It is connected to the Isra and Mi'raj.",
    definitionAr: "المسجد المقدس في بيت المقدس.",
    definitionFr: "La mosquée sacrée de Jérusalem.",
    whyItMattersAr: "يرتبط المسجد الأقصى برحلتي الإسراء والمعراج.",
    whyItMattersFr: "Elle est liée à l'Isra et au Mi'raj.",
    priority: false,
  },
  {
    id: 100,
    term: "Masjid al-Nabawi",
    arabic: "المسجد النبوي",
    transliteration: "Masjid al-Nabawi",
    category: "Places",
    definition: "The Prophet's ﷺ mosque in Madinah.",
    whyItMatters: "It became the center of worship, teaching, leadership, and community life.",
    definitionAr: "مسجد النبي ﷺ في المدينة المنورة.",
    definitionFr: "La mosquée du Prophète ﷺ à Médine.",
    whyItMattersAr: "أصبح المسجد النبوي مركزًا للعبادة والتعليم والقيادة والحياة الاجتماعية.",
    whyItMattersFr: "Elle est devenue le centre de l'adoration, de l'enseignement, du leadership et de la vie communautaire.",
    priority: false,
  },
  {
    id: 101,
    term: "Jannat al-Baqi'",
    arabic: "جنة البقيع",
    transliteration: "Jannat al-Baqi'",
    category: "Places",
    definition: "The famous cemetery in Madinah.",
    whyItMatters: "Many companions and family members of the Prophet ﷺ are buried there.",
    definitionAr: "المقبرة المشهورة في المدينة المنورة.",
    definitionFr: "Le célèbre cimetière de Médine.",
    whyItMattersAr: "دُفن فيها كثير من الصحابة وأهل بيت النبي ﷺ.",
    whyItMattersFr: "De nombreux compagnons et membres de la famille du Prophète ﷺ y sont enterrés.",
    priority: false,
  },
  {
    id: 102,
    term: "Barakah",
    arabic: "بركة",
    transliteration: "Barakah",
    category: "Core Seerah Terms",
    definition: "Blessing from Allah.",
    whyItMatters: "Many miracles and events in the Seerah show Allah placing barakah in small things.",
    definitionAr: "البركة، وهي الخير والزيادة التي يمنحها الله.",
    definitionFr: "La bénédiction d'Allah.",
    whyItMattersAr: "تُظهر كثير من معجزات السيرة وأحداثها كيف يضع الله البركة في الأشياء القليلة.",
    whyItMattersFr: "De nombreux miracles et événements de la Sîra montrent Allah plaçant la barakah dans de petites choses.",
    priority: false,
  },
  {
    id: 103,
    term: "Sabr",
    arabic: "صبر",
    transliteration: "Sabr",
    category: "Core Seerah Terms",
    definition: "Patience and steadfastness.",
    whyItMatters: "Sabr is one of the strongest themes of the Makkan period.",
    definitionAr: "الصبر، وهو التحمل والثبات في مواجهة الشدائد.",
    definitionFr: "La patience et la constance.",
    whyItMattersAr: "يُعد الصبر من أبرز المعاني التي تميّز العهد المكي.",
    whyItMattersFr: "Le sabr est l'un des thèmes les plus forts de la période mecquoise.",
    priority: false,
  },
  {
    id: 104,
    term: "Tawakkul",
    arabic: "توكل",
    transliteration: "Tawakkul",
    category: "Core Seerah Terms",
    definition: "Reliance upon Allah.",
    whyItMatters: "The Hijrah and many battles show true tawakkul.",
    definitionAr: "التوكل، وهو الاعتماد على الله والثقة به مع الأخذ بالأسباب.",
    definitionFr: "La confiance et le recours à Allah.",
    whyItMattersAr: "تُظهر الهجرة وكثير من الغزوات نموذجًا حقيقيًا للتوكل على الله.",
    whyItMattersFr: "La Hijrah et de nombreuses batailles montrent un vrai tawakkul.",
    priority: false,
  },
  {
    id: 105,
    term: "Fitnah",
    arabic: "فتنة",
    transliteration: "Fitnah",
    category: "Society & Culture",
    definition: "Trial, temptation, persecution, or turmoil depending on context.",
    whyItMatters: "Early Muslims faced fitnah in Makkah.",
    definitionAr: "الفتنة، وتعني الابتلاء أو الإغراء أو الأذى أو الاضطراب حسب السياق.",
    definitionFr: "Épreuve, tentation, persécution ou trouble selon le contexte.",
    whyItMattersAr: "واجه المسلمون الأوائل الفتنة والأذى في مكة.",
    whyItMattersFr: "Les premiers musulmans ont affronté la fitnah à La Mecque.",
    priority: false,
  },
  {
    id: 106,
    term: "Nifaq",
    arabic: "نفاق",
    transliteration: "Nifaq",
    category: "Society & Culture",
    definition: "Hypocrisy.",
    whyItMatters: "Nifaq became a major internal issue in Madinah.",
    definitionAr: "النفاق، وهو إظهار الإيمان وإخفاء الكفر أو الشك.",
    definitionFr: "L'hypocrisie.",
    whyItMattersAr: "أصبح النفاق قضية داخلية كبرى في المدينة.",
    whyItMattersFr: "Le nifaq est devenu un problème interne majeur à Médine.",
    priority: false,
  },
  {
    id: 107,
    term: "Amanah",
    arabic: "أمانة",
    transliteration: "Amanah",
    category: "Society & Culture",
    definition: "Trust or responsibility.",
    whyItMatters: "The Prophet ﷺ was known as trustworthy even before revelation.",
    definitionAr: "الأمانة، وهي الثقة والمسؤولية الموضوعة على الشخص.",
    definitionFr: "La confiance ou la responsabilité.",
    whyItMattersAr: "عُرف النبي ﷺ بالأمانة حتى قبل بعثته.",
    whyItMattersFr: "Le Prophète ﷺ était connu comme digne de confiance même avant la révélation.",
    priority: false,
  },
  {
    id: 108,
    term: "Al-Amin",
    arabic: "الأمين",
    transliteration: "Al-Amin",
    category: "Core Seerah Terms",
    definition: "The trustworthy one.",
    whyItMatters: "Quraysh knew the Prophet ﷺ for his honesty before prophethood.",
    definitionAr: "الأمين، وهو اللقب الذي اشتهر به النبي ﷺ لصدقه وأمانته.",
    definitionFr: "Le digne de confiance.",
    whyItMattersAr: "عرفت قريش النبي ﷺ بصدقه وأمانته قبل بعثته.",
    whyItMattersFr: "Quraysh connaissait le Prophète ﷺ pour son honnêteté avant la prophétie.",
    priority: false,
  },
  {
    id: 109,
    term: "Al-Sadiq",
    arabic: "الصادق",
    transliteration: "Al-Sadiq",
    category: "Core Seerah Terms",
    definition: "The truthful one.",
    whyItMatters: "Truthfulness was central to the Prophet's ﷺ character.",
    definitionAr: "الصادق، وهو لقب يدل على صدق النبي ﷺ في قوله وفعله.",
    definitionFr: "Le véridique.",
    whyItMattersAr: "كان الصدق صفة محورية في شخصية النبي ﷺ.",
    whyItMattersFr: "La véracité était centrale dans le caractère du Prophète ﷺ.",
    priority: false,
  },
  {
    id: 110,
    term: "Shura",
    arabic: "شورى",
    transliteration: "Shura",
    category: "Governance & Treaties",
    definition: "Consultation.",
    whyItMatters: "The Prophet ﷺ consulted his companions in major events.",
    definitionAr: "الشورى، وهي التداول في الرأي قبل اتخاذ القرار.",
    definitionFr: "La consultation.",
    whyItMattersAr: "استشار النبي ﷺ أصحابه في كثير من الأحداث المهمة.",
    whyItMattersFr: "Le Prophète ﷺ consultait ses compagnons lors des événements majeurs.",
    priority: false,
  },
  {
    id: 111,
    term: "Imam",
    arabic: "إمام",
    transliteration: "Imam",
    category: "Worship & Rituals",
    definition: "A leader, especially one who leads prayer.",
    whyItMatters: "Leadership in worship and community appears throughout the Seerah.",
    definitionAr: "الإمام، وهو القائد، وخاصة من يتقدم الناس في الصلاة.",
    definitionFr: "Un dirigeant, surtout celui qui dirige la prière.",
    whyItMattersAr: "تظهر القيادة في العبادة والمجتمع في مواضع كثيرة من السيرة.",
    whyItMattersFr: "Le leadership dans l'adoration et la communauté apparaît tout au long de la Sîra.",
    priority: false,
  },
  {
    id: 112,
    term: "Khalifah",
    arabic: "خليفة",
    transliteration: "Khalifah",
    category: "Governance & Treaties",
    definition: "Successor or leader after the Prophet ﷺ.",
    whyItMatters: "The caliphate begins after the Prophet's ﷺ passing.",
    definitionAr: "الخليفة، وهو القائد الذي يخلف النبي ﷺ في قيادة الأمة.",
    definitionFr: "Successeur ou dirigeant après le Prophète ﷺ.",
    whyItMattersAr: "تبدأ الخلافة بعد وفاة النبي ﷺ.",
    whyItMattersFr: "Le califat commence après le décès du Prophète ﷺ.",
    priority: false,
  },
  {
    id: 113,
    term: "Ameer",
    arabic: "أمير",
    transliteration: "Ameer",
    category: "Governance & Treaties",
    definition: "Leader or commander.",
    whyItMatters: "The Prophet ﷺ appointed leaders for expeditions and missions.",
    definitionAr: "الأمير، وهو القائد أو الرئيس على جماعة أو مهمة.",
    definitionFr: "Chef ou commandant.",
    whyItMattersAr: "كان النبي ﷺ يُعيّن أميرًا على السرايا والبعثات.",
    whyItMattersFr: "Le Prophète ﷺ nommait des chefs pour les expéditions et missions.",
    priority: false,
  },
  {
    id: 114,
    term: "Wali",
    arabic: "ولي",
    transliteration: "Wali",
    category: "Governance & Treaties",
    definition: "Guardian, ally, or authority depending on context.",
    whyItMatters: "It appears in discussions of loyalty, protection, and authority.",
    definitionAr: "الولي، وله معنى الحامي أو الناصر أو صاحب السلطة حسب السياق.",
    definitionFr: "Gardien, allié ou autorité selon le contexte.",
    whyItMattersAr: "يظهر هذا المصطلح في مواضع تتحدث عن الولاء والحماية والسلطة.",
    whyItMattersFr: "Il apparaît dans les discussions sur la loyauté, la protection et l'autorité.",
    priority: false,
  },
  {
    id: 115,
    term: "Zakat",
    arabic: "زكاة",
    transliteration: "Zakat",
    category: "Worship & Rituals",
    definition: "Obligatory charity.",
    whyItMatters: "It became part of the organized Muslim community.",
    definitionAr: "الزكاة، وهي الصدقة المفروضة على المسلمين.",
    definitionFr: "L'aumône obligatoire.",
    whyItMattersAr: "أصبحت الزكاة جزءًا من تنظيم المجتمع المسلم.",
    whyItMattersFr: "Elle est devenue partie de la communauté musulmane organisée.",
    priority: false,
  },
  {
    id: 116,
    term: "Sadaqah",
    arabic: "صدقة",
    transliteration: "Sadaqah",
    category: "Worship & Rituals",
    definition: "Charity.",
    whyItMatters: "Generosity was a major trait of the Prophet ﷺ and his companions.",
    definitionAr: "الصدقة، وهي العطاء تطوعًا في سبيل الله.",
    definitionFr: "La charité.",
    whyItMattersAr: "كان الجود والكرم صفة بارزة في النبي ﷺ وأصحابه.",
    whyItMattersFr: "La générosité était un trait majeur du Prophète ﷺ et de ses compagnons.",
    priority: false,
  },
  {
    id: 117,
    term: "Ghanimah",
    arabic: "غنيمة",
    transliteration: "Ghanimah",
    category: "Battles & Expeditions",
    definition: "Spoils taken after battle under Islamic rulings.",
    whyItMatters: "It appears in several Madinan events and legal rulings.",
    definitionAr: "الغنيمة، وهي ما يُؤخذ من العدو بعد المعركة وفق أحكام الشريعة.",
    definitionFr: "Le butin pris après une bataille selon les règles islamiques.",
    whyItMattersAr: "ورد ذكرها في عدد من أحداث العهد المدني وأحكامه الشرعية.",
    whyItMattersFr: "Il apparaît dans plusieurs événements médinois et décisions juridiques.",
    priority: false,
  },
  {
    id: 118,
    term: "Fay'",
    arabic: "فيء",
    transliteration: "Fay'",
    category: "Governance & Treaties",
    definition: "Property gained without direct battle under Islamic rulings.",
    whyItMatters: "It appears in Madinan political and financial organization.",
    definitionAr: "الفيء، وهو ما يُحصَّل من مال دون قتال مباشر وفق أحكام الشريعة.",
    definitionFr: "Bien obtenu sans combat direct selon les règles islamiques.",
    whyItMattersAr: "ظهر ذكره في التنظيم السياسي والمالي للمجتمع المدني.",
    whyItMattersFr: "Il apparaît dans l'organisation politique et financière médinoise.",
    priority: false,
  },
  {
    id: 119,
    term: "Jizyah",
    arabic: "جزية",
    transliteration: "Jizyah",
    category: "Governance & Treaties",
    definition: "A tax historically paid by non-Muslim subjects under Muslim rule.",
    whyItMatters: "It appears in later Madinan and post-Seerah governance discussions.",
    definitionAr: "الجزية، وهي ضريبة كانت تُفرض تاريخيًا على غير المسلمين تحت الحكم الإسلامي.",
    definitionFr: "Une taxe historiquement payée par les sujets non musulmans sous autorité musulmane.",
    whyItMattersAr: "وردت في نقاشات الحكم في أواخر العهد المدني وما بعد السيرة.",
    whyItMattersFr: "Elle apparaît dans les discussions de gouvernance de la fin de la période médinoise et après la Sîra.",
    priority: false,
  },
  {
    id: 120,
    term: "Ahl al-Kitab",
    arabic: "أهل الكتاب",
    transliteration: "Ahl al-Kitab",
    category: "Society & Culture",
    definition: "The People of the Book, mainly Jews and Christians.",
    whyItMatters: "The Prophet ﷺ interacted with Jewish and Christian communities and rulers.",
    definitionAr: "أهل الكتاب، وهم اليهود والنصارى بشكل أساسي.",
    definitionFr: "Les Gens du Livre, principalement les juifs et les chrétiens.",
    whyItMattersAr: "تعامل النبي ﷺ مع مجتمعات اليهود والنصارى وحكامهم.",
    whyItMattersFr: "Le Prophète ﷺ a interagi avec des communautés et souverains juifs et chrétiens.",
    priority: false,
  },
];

const FILTER_CATEGORIES = [
  "All",
  "Core Seerah Terms",
  "Revelation",
  "People & Groups",
  "Tribes & Lineage",
  "Places",
  "Battles & Expeditions",
  "Worship & Rituals",
  "Hadith & Sources",
  "Society & Culture",
  "Governance & Treaties",
];

const CATEGORY_LABELS_AR: Record<string, string> = {
  "All": "الكل",
  "Core Seerah Terms": "مصطلحات السيرة الأساسية",
  "Revelation": "الوحي",
  "People & Groups": "الأشخاص والجماعات",
  "Tribes & Lineage": "القبائل والنسب",
  "Places": "الأماكن",
  "Battles & Expeditions": "الغزوات والسرايا",
  "Worship & Rituals": "العبادات والشعائر",
  "Hadith & Sources": "الحديث والمصادر",
  "Society & Culture": "المجتمع والثقافة",
  "Governance & Treaties": "الحكم والمعاهدات",
};

const CATEGORY_LABELS_FR: Record<string, string> = {
  "All": "Tous",
  "Core Seerah Terms": "Termes essentiels de la Sîra",
  "Revelation": "Révélation",
  "People & Groups": "Personnes et groupes",
  "Tribes & Lineage": "Tribus et lignée",
  "Places": "Lieux",
  "Battles & Expeditions": "Batailles et expéditions",
  "Worship & Rituals": "Adoration et rites",
  "Hadith & Sources": "Hadith et sources",
  "Society & Culture": "Société et culture",
  "Governance & Treaties": "Gouvernance et traités",
};

export function ImportantTermsContent({ lang = "en" }: { lang?: CourseLang }) {
  const isRtl = lang === "ar";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showAll, setShowAll] = useState(false);

  const filteredTerms = useMemo(() => {
    let terms = TERMS_DATA;

    // Filter by category
    if (selectedCategory !== "All") {
      terms = terms.filter((term) => term.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      terms = terms.filter(
        (term) =>
          term.term.toLowerCase().includes(query) ||
          term.arabic.includes(query) ||
          term.transliteration.toLowerCase().includes(query) ||
          term.definition.toLowerCase().includes(query) ||
          term.whyItMatters.toLowerCase().includes(query) ||
          term.category.toLowerCase().includes(query) ||
          (lang === "ar" && term.definitionAr?.includes(query)) ||
          (lang === "ar" && term.whyItMattersAr?.includes(query)) ||
          (lang === "ar" && CATEGORY_LABELS_AR[term.category]?.includes(query)) ||
          (lang === "fr" && term.definitionFr?.toLowerCase().includes(query)) ||
          (lang === "fr" && term.whyItMattersFr?.toLowerCase().includes(query)) ||
          (lang === "fr" && CATEGORY_LABELS_FR[term.category]?.toLowerCase().includes(query))
      );
    }

    return terms;
  }, [searchQuery, selectedCategory, lang]);

  const displayedTerms = showAll
    ? filteredTerms
    : filteredTerms.filter((t) => t.priority);

  const hasMore = filteredTerms.length > filteredTerms.filter((t) => t.priority).length;
  const isFiltered = searchQuery.trim() || selectedCategory !== "All";

  // Stats
  const totalCount = TERMS_DATA.length;
  const priorityCount = TERMS_DATA.filter((t) => t.priority).length;

  // Get icon for category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Core Seerah Terms":
        return Book;
      case "People & Groups":
        return Users;
      case "Places":
        return Map;
      case "Battles & Expeditions":
        return Swords;
      case "Revelation":
        return Heart;
      case "Hadith & Sources":
        return FileText;
      case "Society & Culture":
        return Globe;
      case "Tribes & Lineage":
        return Users;
      case "Worship & Rituals":
        return Heart;
      case "Governance & Treaties":
        return Shield;
      default:
        return Book;
    }
  };

  const categoryLabel = (category: string) =>
    loc(lang, category, CATEGORY_LABELS_AR[category] ?? category, CATEGORY_LABELS_FR[category] ?? category);

  return (
    <main className="min-h-screen bg-ink py-16" dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Back link */}
        <Link
          href="/reference"
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {loc(lang, "Back to Reference Library", "العودة إلى مكتبة المراجع", "Retour à la bibliothèque de référence")}
        </Link>

        {/* Page header */}
        <div className="mb-8">
          <p className="text-sm text-gold font-medium mb-3 uppercase tracking-wide">
            {loc(lang, "Reference Library", "مكتبة المراجع", "Bibliothèque de référence")}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-text mb-4">
            {loc(lang, "Important Terms", "المصطلحات المهمة", "Termes importants")}
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed max-w-3xl mb-6">
            {loc(
              lang,
              "The Seerah uses many Arabic, tribal, and historical terms. This glossary explains the most important words so users can follow the life of the Prophet ﷺ with more clarity.",
              "تستخدم السيرة الكثير من المصطلحات العربية والقبلية والتاريخية. يشرح هذا المسرد أهم الكلمات لمساعدة القارئ على متابعة سيرة النبي ﷺ بوضوح أكبر.",
              "La Sîra utilise de nombreux termes arabes, tribaux et historiques. Ce glossaire explique les mots les plus importants pour aider à suivre la vie du Prophète ﷺ avec plus de clarté."
            )}
          </p>

          {/* Context note */}
          <div className="flex gap-3 p-4 rounded-xl bg-surface border border-border/50">
            <Info className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-text-secondary leading-relaxed">
                {loc(
                  lang,
                  "Some Arabic terms can have broader meanings outside the Seerah. These definitions focus on how the terms are commonly used in the study of the Prophet's ﷺ life.",
                  "قد يكون لبعض المصطلحات العربية معانٍ أوسع خارج نطاق السيرة. تركّز هذه التعريفات على كيفية استخدام المصطلحات عادةً في دراسة سيرة النبي ﷺ.",
                  "Certains termes arabes peuvent avoir des sens plus larges en dehors de la Sîra. Ces définitions se concentrent sur l'usage courant des termes dans l'étude de la vie du Prophète ﷺ."
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-2xl font-bold text-gold">{totalCount}+</p>
            <p className="text-xs text-text-secondary mt-1">
              {loc(lang, "Important terms", "مصطلح مهم", "Termes importants")}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-2xl font-bold text-gold">{totalCount}</p>
            <p className="text-xs text-text-secondary mt-1">
              {loc(lang, "Arabic + transliteration", "عربي + نقل حرفي", "Arabe + translittération")}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-2xl font-bold text-gold">100%</p>
            <p className="text-xs text-text-secondary mt-1">
              {loc(lang, "Beginner-friendly", "مناسب للمبتدئين", "Accessible aux débutants")}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-2xl font-bold text-gold">
              {loc(lang, "Searchable", "قابل للبحث", "Recherchable")}
            </p>
            <p className="text-xs text-text-secondary mt-1">
              {loc(lang, "Throughout course", "في جميع أنحاء الدورة", "Dans tout le cours")}
            </p>
          </div>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder={loc(
                lang,
                "Search terms like Hijrah, Ansar, Badr, Wahy…",
                "ابحث عن مصطلحات مثل الهجرة، الأنصار، بدر، الوحي…",
                "Rechercher des termes comme Hijrah, Ansar, Badr, Wahy…"
              )}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full ps-12 pe-4 py-3 rounded-xl bg-surface border border-border text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all"
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
                {categoryLabel(category)}
              </button>
            );
          })}
        </div>

        {/* Terms grid */}
        {filteredTerms.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-text-muted">
              {loc(
                lang,
                "No terms match your search or filter.",
                "لا توجد مصطلحات مطابقة لبحثك أو التصفية المحددة.",
                "Aucun terme ne correspond à votre recherche ou filtre."
              )}
            </p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {displayedTerms.map((term) => {
                const Icon = getCategoryIcon(term.category);
                return (
                  <div
                    key={term.id}
                    id={`term-${term.term.toLowerCase().replace(/\s+/g, "-")}`}
                    className="p-5 rounded-xl bg-surface border border-border hover:border-gold/30 transition-colors scroll-mt-20"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-gold/10 border border-gold/20 flex-shrink-0">
                        <Icon className="w-4 h-4 text-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {lang === "ar" ? (
                          <>
                            <h3 className="text-lg font-semibold text-text leading-snug font-arabic">
                              {term.arabic}
                            </h3>
                            <p className="text-xs text-text-muted mt-0.5">
                              {term.transliteration}
                            </p>
                          </>
                        ) : (
                          <>
                            <h3 className="text-lg font-semibold text-text leading-snug">
                              {term.term}
                            </h3>
                            <p className="text-sm text-gold mt-0.5 font-arabic">
                              {term.arabic}
                            </p>
                            <p className="text-xs text-text-muted mt-0.5">
                              {term.transliteration}
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mb-2">
                      <span className="inline-block px-2 py-1 rounded border text-xs font-medium bg-surface-raised text-text-muted border-border/50">
                        {categoryLabel(term.category)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-medium text-text-muted mb-1">
                          {loc(lang, "Definition:", "التعريف:", "Définition :")}
                        </p>
                        <p className="text-sm text-text-secondary leading-relaxed">
                          {loc(
                            lang,
                            term.definition,
                            term.definitionAr ?? term.definition,
                            term.definitionFr ?? term.definition
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-text-muted mb-1">
                          {loc(lang, "Why it matters:", "لماذا هو مهم:", "Pourquoi c'est important :")}
                        </p>
                        <p className="text-sm text-text-secondary leading-relaxed">
                          {loc(
                            lang,
                            term.whyItMatters,
                            term.whyItMattersAr ?? term.whyItMatters,
                            term.whyItMattersFr ?? term.whyItMatters
                          )}
                        </p>
                      </div>
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
                    ? loc(lang, "Show Less", "عرض أقل", "Afficher moins")
                    : loc(
                        lang,
                        `View All ${filteredTerms.length} Terms`,
                        `عرض جميع المصطلحات (${filteredTerms.length})`,
                        `Voir les ${filteredTerms.length} termes`
                      )}
                </button>
              </div>
            )}
          </>
        )}

        {/* CTA */}
        <div className="mt-16 pt-8 border-t border-border">
          <div className="p-6 rounded-2xl bg-surface border border-border text-center">
            <h2 className="text-lg font-semibold text-text mb-2">
              {loc(lang, "Continue Learning the Seerah", "تابع تعلم السيرة النبوية", "Continuer à apprendre la Sîra")}
            </h2>
            <p className="text-sm text-text-secondary mb-4">
              {loc(
                lang,
                "Go back to the full Seerah course to see these terms in context throughout the Prophet's ﷺ life.",
                "عد إلى دورة السيرة الكاملة لرؤية هذه المصطلحات في سياقها طوال سيرة النبي ﷺ.",
                "Revenez au cours complet de Sîra pour voir ces termes en contexte tout au long de la vie du Prophète ﷺ."
              )}
            </p>
            <Link
              href="/seerah"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold text-ink font-semibold hover:bg-gold-light transition-colors"
            >
              {loc(lang, "Go to Seerah Course", "الذهاب إلى دورة السيرة", "Aller au cours de Sîra")}
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
            {loc(lang, "Back to Reference Library", "العودة إلى مكتبة المراجع", "Retour à la bibliothèque de référence")}
          </Link>
        </div>
      </div>
    </main>
  );
}
