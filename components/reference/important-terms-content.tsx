"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Info, Book, Users, Map, Swords, Heart, FileText, Globe, Shield } from "lucide-react";
import type { CourseLang } from "@/lib/course-lang";

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
    whyItMattersAr: "وهي الموضوع الأساسي لهذا المنهج.",
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
    whyItMattersAr: "يُشار بها على وجه التحديد إلى حياة النبي ﷺ.",
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
    whyItMattersAr: "النبي محمد ﷺ هو خاتم رسل الله.",
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
    whyItMattersAr: "النبي ﷺ نبيٌّ ورسولٌ في آنٍ واحد.",
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
    whyItMattersAr: "يعني أن النبي محمد ﷺ هو آخر الأنبياء، فلا نبي بعده.",
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
    whyItMattersAr: "أُنزل القرآن على النبي ﷺ عن طريق الوحي.",
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
    whyItMattersAr: "وهو أعظم معجزة، والمصدر الأول للهداية.",
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
    whyItMattersAr: "جاء جبريل عليه السلام إلى النبي ﷺ بالقرآن الكريم.",
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
    whyItMattersAr: "تساعد السيرة المتعلمين على رؤية السنة في واقع الحياة.",
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
    whyItMattersAr: "تحفظ الأحاديث كثيرًا من تفاصيل حياة النبي ﷺ.",
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
    whyItMattersAr: "يساعد العلماء على تقييم مدى صحة الرواية.",
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
    whyItMattersAr: "وهو المحتوى الفعلي الذي يُروى.",
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
    whyItMattersAr: "تُعطى الأولوية للروايات الصحيحة عند تعليم السيرة.",
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
    whyItMattersAr: "بعض تفاصيل السيرة ثابتة عن طريق روايات حسنة.",
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
    whyItMattersAr: "لا ينبغي التعامل مع القصص الضعيفة كحقائق مؤكدة.",
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
    whyItMattersAr: "شهدوا أحداث السيرة، ونصروها، وحفظوها، ونقلوها.",
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
    whyItMattersAr: "تتمحور كثير من أحداث السيرة حول أفراد من الصحابة.",
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
    whyItMattersAr: "كان للنساء دور عظيم في الإيمان والتضحية والعلم والدعم.",
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
    whyItMattersAr: "أسرة النبي ﷺ محورية في كثير من أحداث السيرة.",
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
    whyItMattersAr: "حفظن العلم، وكنّ جزءًا من بيت النبي ﷺ.",
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
    whyItMattersAr: "تضحيتهم من أبرز الموضوعات الأساسية في السيرة.",
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
    whyItMattersAr: "أتاح دعمهم للمجتمع المسلم أن يترسّخ ويستقر.",
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
    whyItMattersAr: "لهم مكانة خاصة في التاريخ الإسلامي.",
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
    whyItMattersAr: "تسبّب المنافقون في ضرر داخلي في المدينة.",
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
    whyItMattersAr: "كانت معارضة قريش الأولى في مكة قائمة على الشرك وعبادة الأوثان.",
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
    whyItMattersAr: "بدأت رسالة النبي ﷺ بدعوة الناس للبعد عن الشرك.",
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
    whyItMattersAr: "التوحيد هو أساس رسالة النبي ﷺ.",
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
    whyItMattersAr: "تُظهر السيرة كيف حوّل الإسلام المجتمع من الجاهلية إلى الهدى.",
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
    whyItMattersAr: "تمحورت حياة النبي ﷺ حول دعوة الناس لعبادة الله وحده.",
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
    whyItMattersAr: "ركّزت الفترة المكية بشكل كبير على بناء الإيمان.",
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
    whyItMattersAr: "دعا النبي ﷺ الناس إلى الإسلام.",
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
    whyItMattersAr: "تُظهر السيرة إحسان النبي ﷺ في عبادته وأخلاقه.",
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
    whyItMattersAr: "كانت الهجرة نقطة تحوّل كبرى في السيرة.",
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
    whyItMattersAr: "مهّدت البيعات قبل الهجرة الطريق لدخول الإسلام إلى المدينة.",
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
    whyItMattersAr: "مهّدت هذه البيعات الطريق للهجرة.",
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
    whyItMattersAr: "شكّلت المواثيق والمعاهدات ملامح الفترة المدنية.",
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
    whyItMattersAr: "صلح الحديبية مثال بارز على الصلح.",
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
    whyItMattersAr: "أثّرت الهدنات في العلاقة بين المسلمين وقريش.",
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
    whyItMattersAr: "تُظهر السيرة تكوّن الأمة المسلمة.",
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
    whyItMattersAr: "تمثّل مرحلة الدعوة السرية الأولى.",
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
    whyItMattersAr: "في مكة تشكّلت ملامح الدعوة الأولى وبداية الرسالة.",
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
    whyItMattersAr: "في العهد المدني تشكّلت معالم العبادة والحكم والحياة الاجتماعية للمسلمين.",
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
    whyItMattersAr: "هي المدينة التي أصبحت موطن المجتمع المسلم بعد الهجرة.",
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
    whyItMattersAr: "تحتل مكانة مركزية في العبادة والحج، وترتبط بقصة إبراهيم عليه السلام.",
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
    whyItMattersAr: "لمكة حَرَم مقدّس له أحكام خاصة ومكانة عظيمة.",
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
    whyItMattersAr: "فيه بدأ الوحي على النبي ﷺ.",
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
    whyItMattersAr: "يرتبط بحفظ الله سبحانه وتعالى لهما خلال رحلة الهجرة.",
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
    whyItMattersAr: "يرتبط بأول مسجد بُني في الإسلام.",
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
    whyItMattersAr: "كانت غزوة بدر نقطة تحوّل عظيمة للمسلمين.",
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
    whyItMattersAr: "كان مسرحاً لغزوة أحد.",
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
    whyItMattersAr: "يُظهر التخطيط الدفاعي والتشاور الذي اتّبعه المسلمون.",
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
    whyItMattersAr: "تُسمّى غزوة الخندق أيضاً غزوة الأحزاب.",
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
    whyItMattersAr: "أصبح فتحاً عظيماً مهّد الطريق لانتشار الإسلام.",
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
    whyItMattersAr: "كانت مسرحاً لغزوة كبرى في العهد المدني.",
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
    whyItMattersAr: "علّمت المسلمين أن النصر من عند الله لا بكثرة العدد.",
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
    whyItMattersAr: "توجّه إليها النبي ﷺ طالباً النصرة بعد عام الحزن.",
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
    whyItMattersAr: "كانت من آخر الغزوات الكبرى التي قادها النبي ﷺ.",
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
    whyItMattersAr: "تُظهر شدة الأذى الذي تعرّض له المسلمون الأوائل في مكة.",
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
    whyItMattersAr: "كان النبي ﷺ منها، وكانت قريش في طليعة من عارض الدعوة في بدايتها.",
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
    whyItMattersAr: "شكّلت حماية بني هاشم للنبي ﷺ عاملاً مهماً في العهد المكي.",
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
    whyItMattersAr: "وقفوا مع بني هاشم في أوقات الشدة والحصار.",
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
    whyItMattersAr: "انتسب إليه شخصيات بارزة مثل عثمان وأبي سفيان ومعاوية رضي الله عنهم.",
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
    whyItMattersAr: "انتسب إليه أبو جهل وخالد بن الوليد رضي الله عنه.",
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
    whyItMattersAr: "أصبح كثير من الأوس من الأنصار.",
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
    whyItMattersAr: "أصبح كثير من الخزرج من الأنصار.",
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
    whyItMattersAr: "كانوا جزءاً من المشهد السياسي في المدينة.",
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
    whyItMattersAr: "كانت لهم صلة بأحداث مهمة تتعلق بنقض العهود.",
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
    whyItMattersAr: "ترتبط بأحداث وقعت بعد غزوة الخندق.",
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
    whyItMattersAr: "يُنسب النبي ﷺ إليه بثقة وصحة، وهو الحد الذي يُتوقف عنده غالباً في تحقيق النسب.",
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
    whyItMattersAr: "يمتد نسب قريش صعوداً عبر كنانة.",
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
    whyItMattersAr: "يُنسب النبي ﷺ في الروايات إلى إسماعيل عليه السلام.",
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
    whyItMattersAr: "ترتبط الكعبة ونسب النبي ﷺ بإبراهيم عليه السلام.",
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
    whyItMattersAr: "كثير من الأحداث العسكرية الكبرى في السيرة تُسمّى غزوات.",
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
    whyItMattersAr: "لم تكن كل البعثات بقيادة النبي ﷺ شخصياً.",
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
    whyItMattersAr: "ركّزت بعض كتب السيرة المبكرة بشكل كبير على المغازي.",
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
    whyItMattersAr: "له معانٍ وأحكام شرعية محددة، ولا ينبغي تحويره إلى شعارات سياسية معاصرة.",
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
    whyItMattersAr: "يُسمّى فتح مكة بهذا الاسم.",
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
    whyItMattersAr: "أظهر رحمة النبي ﷺ وعفوه عند النصر.",
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
    whyItMattersAr: "بدا صعباً في ظاهره، لكنه أصبح فتحاً عظيماً.",
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
    whyItMattersAr: "تُظهر حكمة النبي ﷺ في القيادة وتنظيم المجتمع.",
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
    whyItMattersAr: "تغيّرت القبلة من بيت المقدس إلى الكعبة في العهد المدني.",
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
    whyItMattersAr: "فُرضت الصلوات الخمس في اليوم والليلة لتكون عماد العبادة في الإسلام.",
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
    whyItMattersAr: "وردت أحاديث كثيرة في السيرة تتحدث عن الصلاة والطهارة وأهميتها.",
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
    whyItMattersAr: "يُعد الغسل جزءًا من أحكام الطهارة في الشريعة الإسلامية.",
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
    whyItMattersAr: "عُرف بلال رضي الله عنه بأنه مؤذن رسول الله ﷺ.",
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
    whyItMattersAr: "أصبح هذا الدور جزءًا من حياة المجتمع المسلم في المدينة.",
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
    whyItMattersAr: "أصبح المسجد النبوي مركزًا للعبادة والتعليم والقيادة.",
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
    whyItMattersAr: "أدى النبي ﷺ حجة الوداع قرب نهاية حياته.",
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
    whyItMattersAr: "ترتبط صلح الحديبية وعمرة القضاء بالعمرة.",
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
    whyItMattersAr: "يظهر ذكر الإحرام في أحداث صلح الحديبية والحج والعمرة.",
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
    whyItMattersAr: "يُعد الطواف ركنًا أساسيًا في الحج والعمرة.",
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
    whyItMattersAr: "يُعد السعي جزءًا من مناسك الحج والعمرة.",
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
    whyItMattersAr: "وقعت بيعتا العقبة قرب منى.",
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
    whyItMattersAr: "خطب النبي ﷺ خطبة الوداع في عرفة خلال حجة الوداع.",
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
    whyItMattersAr: "تُعد مزدلفة جزءًا من مسار مناسك الحج.",
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
    whyItMattersAr: "كانت الإسراء آية عظيمة وتكريمًا خاصًا من الله للنبي ﷺ.",
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
    whyItMattersAr: "فُرضت الصلوات الخمس على النبي ﷺ خلال هذه الرحلة.",
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
    whyItMattersAr: "يحتوي المسجد الحرام على الكعبة، وله مكانة محورية في السيرة النبوية.",
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
    whyItMattersAr: "يرتبط المسجد الأقصى برحلتي الإسراء والمعراج.",
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
    whyItMattersAr: "أصبح المسجد النبوي مركزًا للعبادة والتعليم والقيادة والحياة الاجتماعية.",
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
    whyItMattersAr: "دُفن فيها كثير من الصحابة وأهل بيت النبي ﷺ.",
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
    whyItMattersAr: "تُظهر كثير من معجزات السيرة وأحداثها كيف يضع الله البركة في الأشياء القليلة.",
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
    whyItMattersAr: "يُعد الصبر من أبرز المعاني التي تميّز العهد المكي.",
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
    whyItMattersAr: "تُظهر الهجرة وكثير من الغزوات نموذجًا حقيقيًا للتوكل على الله.",
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
    whyItMattersAr: "واجه المسلمون الأوائل الفتنة والأذى في مكة.",
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
    whyItMattersAr: "أصبح النفاق قضية داخلية كبرى في المدينة.",
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
    whyItMattersAr: "عُرف النبي ﷺ بالأمانة حتى قبل بعثته.",
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
    whyItMattersAr: "عرفت قريش النبي ﷺ بصدقه وأمانته قبل بعثته.",
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
    whyItMattersAr: "كان الصدق صفة محورية في شخصية النبي ﷺ.",
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
    whyItMattersAr: "استشار النبي ﷺ أصحابه في كثير من الأحداث المهمة.",
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
    whyItMattersAr: "تظهر القيادة في العبادة والمجتمع في مواضع كثيرة من السيرة.",
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
    whyItMattersAr: "تبدأ الخلافة بعد وفاة النبي ﷺ.",
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
    whyItMattersAr: "كان النبي ﷺ يُعيّن أميرًا على السرايا والبعثات.",
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
    whyItMattersAr: "يظهر هذا المصطلح في مواضع تتحدث عن الولاء والحماية والسلطة.",
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
    whyItMattersAr: "أصبحت الزكاة جزءًا من تنظيم المجتمع المسلم.",
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
    whyItMattersAr: "كان الجود والكرم صفة بارزة في النبي ﷺ وأصحابه.",
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
    whyItMattersAr: "ورد ذكرها في عدد من أحداث العهد المدني وأحكامه الشرعية.",
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
    whyItMattersAr: "ظهر ذكره في التنظيم السياسي والمالي للمجتمع المدني.",
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
    whyItMattersAr: "وردت في نقاشات الحكم في أواخر العهد المدني وما بعد السيرة.",
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
    whyItMattersAr: "تعامل النبي ﷺ مع مجتمعات اليهود والنصارى وحكامهم.",
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
          (isRtl && term.definitionAr && term.definitionAr.includes(query)) ||
          (isRtl && term.whyItMattersAr && term.whyItMattersAr.includes(query)) ||
          (isRtl && CATEGORY_LABELS_AR[term.category]?.includes(query))
      );
    }

    return terms;
  }, [searchQuery, selectedCategory, isRtl]);

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

  return (
    <main className="min-h-screen bg-ink py-16" dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Back link */}
        <Link
          href="/reference"
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {isRtl ? "العودة إلى مكتبة المراجع" : "Back to Reference Library"}
        </Link>

        {/* Page header */}
        <div className="mb-8">
          <p className="text-sm text-gold font-medium mb-3 uppercase tracking-wide">
            {isRtl ? "مكتبة المراجع" : "Reference Library"}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-text mb-4">
            {isRtl ? "المصطلحات المهمة" : "Important Terms"}
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed max-w-3xl mb-6">
            {isRtl
              ? "تستخدم السيرة الكثير من المصطلحات العربية والقبلية والتاريخية. يشرح هذا المسرد أهم الكلمات لمساعدة القارئ على متابعة سيرة النبي ﷺ بوضوح أكبر."
              : "The Seerah uses many Arabic, tribal, and historical terms. This glossary explains the most important words so users can follow the life of the Prophet ﷺ with more clarity."}
          </p>

          {/* Context note */}
          <div className="flex gap-3 p-4 rounded-xl bg-surface border border-border/50">
            <Info className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-text-secondary leading-relaxed">
                {isRtl
                  ? "قد يكون لبعض المصطلحات العربية معانٍ أوسع خارج نطاق السيرة. تركّز هذه التعريفات على كيفية استخدام المصطلحات عادةً في دراسة سيرة النبي ﷺ."
                  : "Some Arabic terms can have broader meanings outside the Seerah. These definitions focus on how the terms are commonly used in the study of the Prophet's ﷺ life."}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-2xl font-bold text-gold">{totalCount}+</p>
            <p className="text-xs text-text-secondary mt-1">{isRtl ? "مصطلح مهم" : "Important terms"}</p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-2xl font-bold text-gold">{totalCount}</p>
            <p className="text-xs text-text-secondary mt-1">
              {isRtl ? "عربي + نقل حرفي" : "Arabic + transliteration"}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-2xl font-bold text-gold">100%</p>
            <p className="text-xs text-text-secondary mt-1">
              {isRtl ? "مناسب للمبتدئين" : "Beginner-friendly"}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-2xl font-bold text-gold">{isRtl ? "قابل للبحث" : "Searchable"}</p>
            <p className="text-xs text-text-secondary mt-1">
              {isRtl ? "في جميع أنحاء الدورة" : "Throughout course"}
            </p>
          </div>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder={isRtl ? "ابحث عن مصطلحات مثل الهجرة، الأنصار، بدر، الوحي…" : "Search terms like Hijrah, Ansar, Badr, Wahy…"}
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
                {isRtl ? CATEGORY_LABELS_AR[category] ?? category : category}
              </button>
            );
          })}
        </div>

        {/* Terms grid */}
        {filteredTerms.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-text-muted">
              {isRtl ? "لا توجد مصطلحات مطابقة لبحثك أو التصفية المحددة." : "No terms match your search or filter."}
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
                        {isRtl ? (
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
                        {isRtl ? CATEGORY_LABELS_AR[term.category] ?? term.category : term.category}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-medium text-text-muted mb-1">
                          {isRtl ? "التعريف:" : "Definition:"}
                        </p>
                        <p className="text-sm text-text-secondary leading-relaxed">
                          {isRtl ? term.definitionAr ?? term.definition : term.definition}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-text-muted mb-1">
                          {isRtl ? "لماذا هو مهم:" : "Why it matters:"}
                        </p>
                        <p className="text-sm text-text-secondary leading-relaxed">
                          {isRtl ? term.whyItMattersAr ?? term.whyItMatters : term.whyItMatters}
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
                    ? (isRtl ? "عرض أقل" : "Show Less")
                    : (isRtl ? `عرض جميع المصطلحات (${filteredTerms.length})` : `View All ${filteredTerms.length} Terms`)}
                </button>
              </div>
            )}
          </>
        )}

        {/* CTA */}
        <div className="mt-16 pt-8 border-t border-border">
          <div className="p-6 rounded-2xl bg-surface border border-border text-center">
            <h2 className="text-lg font-semibold text-text mb-2">
              {isRtl ? "تابع تعلم السيرة النبوية" : "Continue Learning the Seerah"}
            </h2>
            <p className="text-sm text-text-secondary mb-4">
              {isRtl
                ? "عد إلى دورة السيرة الكاملة لرؤية هذه المصطلحات في سياقها طوال سيرة النبي ﷺ."
                : "Go back to the full Seerah course to see these terms in context throughout the Prophet's ﷺ life."}
            </p>
            <Link
              href="/seerah"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold text-ink font-semibold hover:bg-gold-light transition-colors"
            >
              {isRtl ? "الذهاب إلى دورة السيرة" : "Go to Seerah Course"}
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
            {isRtl ? "العودة إلى مكتبة المراجع" : "Back to Reference Library"}
          </Link>
        </div>
      </div>
    </main>
  );
}
