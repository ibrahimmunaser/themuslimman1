"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Info, Book, Moon, Droplet, Utensils, Shield, Mountain, Sparkles, Heart } from "lucide-react";
import type { CourseLang } from "@/lib/course-lang";

// IMPORTANT: Do not add miracle reports without a source and authenticity grading.
// This section prioritizes narrations from the Qur'an, Sahih al-Bukhari, Sahih Muslim,
// and reports graded authentic by recognized scholars.

interface Miracle {
  id: number;
  title: string;
  titleAr: string;
  category: string;
  categoryAr: string;
  summary: string;
  summaryAr: string;
  source: string;
  sourceAr: string;
  authenticity: "Qur'an" | "Sahih" | "Authentic Report" | "Needs Scholar Review";
  seerahPeriod: string;
  seerahPeriodAr: string;
  keyLesson: string;
  keyLessonAr: string;
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
    titleAr: "القرآن الكريم: المعجزة الباقية",
    category: "Qur'an",
    categoryAr: "القرآن الكريم",
    summary: "The Prophet ﷺ said that what he was given was Divine Revelation, and he hoped to have the most followers on the Day of Resurrection.",
    summaryAr: "قال النبي ﷺ إن ما أُعطيه هو الوحي الإلهي، وأنه يرجو أن يكون له أكثر الأتباع يوم القيامة.",
    source: "Sahih al-Bukhari 4981",
    sourceAr: "صحيح البخاري، الحديث ٤٩٨١",
    authenticity: "Sahih",
    seerahPeriod: "Entire mission",
    seerahPeriodAr: "طوال الرسالة",
    keyLesson: "The Qur'an is the greatest and continuing miracle of the Prophet ﷺ.",
    keyLessonAr: "القرآن الكريم هو أعظم معجزات النبي ﷺ وأبقاها.",
    tags: ["Qur'an", "Sahih al-Bukhari"],
    displayPriority: true,
    verificationStatus: "verified",
    section: "quran",
  },
  {
    id: 2,
    title: "The challenge to produce a surah like it",
    titleAr: "التحدي بالإتيان بسورة من مثله",
    category: "Qur'an",
    categoryAr: "القرآن الكريم",
    summary: "Allah challenges those in doubt to produce a surah like what was revealed.",
    summaryAr: "يتحدى الله تعالى من كانوا في شك أن يأتوا بسورة من مثل ما أُنزل.",
    source: "Qur'an 2:23",
    sourceAr: "القرآن الكريم، سورة البقرة: ٢٣",
    authenticity: "Qur'an",
    seerahPeriod: "Makkan/Madinan message",
    seerahPeriodAr: "الرسالة المكية والمدنية",
    keyLesson: "The Qur'an itself stands as proof and guidance.",
    keyLessonAr: "القرآن نفسه دليل وهداية قائمة بذاتها.",
    tags: ["Qur'an", "Qur'anic Evidence"],
    displayPriority: true,
    verificationStatus: "verified",
    section: "quran",
  },
  {
    id: 3,
    title: "The Qur'an's unmatched nature",
    titleAr: "إعجاز القرآن الذي لا يُضاهى",
    category: "Qur'an",
    categoryAr: "القرآن الكريم",
    summary: "Allah states that mankind and jinn could not produce the like of the Qur'an even if they supported one another.",
    summaryAr: "يبيّن الله تعالى أن الإنس والجن لن يستطيعوا الإتيان بمثل هذا القرآن ولو كان بعضهم لبعض ظهيرًا.",
    source: "Qur'an 17:88",
    sourceAr: "القرآن الكريم، سورة الإسراء: ٨٨",
    authenticity: "Qur'an",
    seerahPeriod: "Makkan revelation",
    seerahPeriodAr: "الوحي المكي",
    keyLesson: "The Qur'an is beyond human imitation.",
    keyLessonAr: "القرآن فوق طاقة البشر على محاكاته.",
    tags: ["Qur'an", "Qur'anic Evidence"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "quran",
  },
  {
    id: 4,
    title: "Preservation of revelation",
    titleAr: "حفظ الوحي",
    category: "Qur'an",
    categoryAr: "القرآن الكريم",
    summary: "Allah promises to preserve the Reminder.",
    summaryAr: "وعد الله تعالى بحفظ الذكر.",
    source: "Qur'an 15:9",
    sourceAr: "القرآن الكريم، سورة الحجر: ٩",
    authenticity: "Qur'an",
    seerahPeriod: "Entire Ummah",
    seerahPeriodAr: "لجميع الأمة",
    keyLesson: "The Qur'an remains protected as guidance for every generation.",
    keyLessonAr: "يبقى القرآن محفوظًا هداية لكل جيل.",
    tags: ["Qur'an", "Qur'anic Evidence"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "quran",
  },

  // SECTION 2: HEAVENLY AND COSMIC SIGNS
  {
    id: 5,
    title: "Splitting of the moon",
    titleAr: "انشقاق القمر",
    category: "Cosmic Signs",
    categoryAr: "الآيات الكونية",
    summary: "The moon was split as a sign during the lifetime of the Prophet ﷺ.",
    summaryAr: "انشق القمر آيةً في زمن النبي ﷺ.",
    source: "Qur'an 54:1; Sahih al-Bukhari 4864; Sahih al-Bukhari 3637",
    sourceAr: "القرآن الكريم، سورة القمر: ١؛ صحيح البخاري، الحديث ٤٨٦٤؛ صحيح البخاري، الحديث ٣٦٣٧",
    authenticity: "Qur'an",
    seerahPeriod: "Makkan period",
    seerahPeriodAr: "العهد المكي",
    keyLesson: "Allah supported His Messenger ﷺ with clear signs.",
    keyLessonAr: "أيّد الله تعالى رسوله ﷺ بآيات بيّنة.",
    tags: ["Cosmic Signs", "Qur'an", "Sahih al-Bukhari", "Qur'anic Evidence"],
    displayPriority: true,
    verificationStatus: "verified",
    section: "cosmic",
  },
  {
    id: 6,
    title: "Isra: The Night Journey",
    titleAr: "الإسراء: رحلة الليل",
    category: "Isra and Mi'raj",
    categoryAr: "الإسراء والمعراج",
    summary: "Allah took His servant by night from al-Masjid al-Haram to al-Masjid al-Aqsa.",
    summaryAr: "أسرى الله بعبده ليلًا من المسجد الحرام إلى المسجد الأقصى.",
    source: "Qur'an 17:1",
    sourceAr: "القرآن الكريم، سورة الإسراء: ١",
    authenticity: "Qur'an",
    seerahPeriod: "Late Makkan period",
    seerahPeriodAr: "أواخر العهد المكي",
    keyLesson: "Allah honored His Messenger ﷺ after hardship.",
    keyLessonAr: "أكرم الله رسوله ﷺ بعد شدة العسر.",
    tags: ["Isra and Mi'raj", "Qur'an", "Qur'anic Evidence", "Cosmic Signs"],
    displayPriority: true,
    verificationStatus: "verified",
    section: "cosmic",
  },
  {
    id: 7,
    title: "Mi'raj: Ascension through the heavens",
    titleAr: "المعراج: العروج إلى السماوات",
    category: "Isra and Mi'raj",
    categoryAr: "الإسراء والمعراج",
    summary: "Authentic hadith describe the Prophet's ﷺ ascension and what he witnessed.",
    summaryAr: "تصف الأحاديث الصحيحة عروج النبي ﷺ وما شاهده.",
    source: "Sahih al-Bukhari 7517",
    sourceAr: "صحيح البخاري، الحديث ٧٥١٧",
    authenticity: "Sahih",
    seerahPeriod: "Late Makkan period",
    seerahPeriodAr: "أواخر العهد المكي",
    keyLesson: "The five daily prayers were given during this great event.",
    keyLessonAr: "فُرضت الصلوات الخمس في هذه الليلة العظيمة.",
    tags: ["Isra and Mi'raj", "Sahih al-Bukhari", "Cosmic Signs"],
    displayPriority: true,
    verificationStatus: "verified",
    section: "cosmic",
  },
  {
    id: 8,
    title: "The coming of the Prophet ﷺ near the Hour",
    titleAr: "بعثة النبي ﷺ قريبة من الساعة",
    category: "Prophetic Knowledge",
    categoryAr: "العلم النبوي",
    summary: "The Prophet ﷺ indicated that his coming and the Hour are close, like two fingers.",
    summaryAr: "أشار النبي ﷺ إلى أن بعثته والساعة متقاربتان كإصبعين.",
    source: "Sahih al-Bukhari 4936",
    sourceAr: "صحيح البخاري، الحديث ٤٩٣٦",
    authenticity: "Sahih",
    seerahPeriod: "General teaching",
    seerahPeriodAr: "تعليم عام",
    keyLesson: "His mission is connected to the final stage of human history.",
    keyLessonAr: "رسالته ﷺ مرتبطة بالمرحلة الأخيرة من تاريخ البشرية.",
    tags: ["Prophetic Knowledge", "Sahih al-Bukhari"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "knowledge",
  },

  // SECTION 3: MIRACLES OF PROVISION AND WATER
  {
    id: 9,
    title: "Water flowing from between his fingers",
    titleAr: "الماء يتفجر من بين أصابعه ﷺ",
    category: "Water",
    categoryAr: "الماء",
    summary: "A small amount of water became enough for many companions to drink and perform wudu.",
    summaryAr: "كفت كمية قليلة من الماء عددًا كبيرًا من الصحابة للشرب والوضوء.",
    source: "Sahih al-Bukhari 3576; Sahih al-Bukhari 5639",
    sourceAr: "صحيح البخاري، الحديث ٣٥٧٦؛ صحيح البخاري، الحديث ٥٦٣٩",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    seerahPeriodAr: "العهد المدني",
    keyLesson: "Blessing comes from Allah.",
    keyLessonAr: "البركة من عند الله وحده.",
    tags: ["Water", "Sahih al-Bukhari"],
    displayPriority: true,
    verificationStatus: "verified",
    section: "provision",
  },
  {
    id: 10,
    title: "Water miracle narrated by Ibn Mas'ud",
    titleAr: "معجزة الماء كما رواها ابن مسعود",
    category: "Water",
    categoryAr: "الماء",
    summary: "Ibn Mas'ud رضي الله عنه reported water coming from between the Prophet's ﷺ fingers and the food glorifying Allah.",
    summaryAr: "روى ابن مسعود رضي الله عنه خروج الماء من بين أصابع النبي ﷺ وتسبيح الطعام بحمد الله.",
    source: "Sahih al-Bukhari 3579",
    sourceAr: "صحيح البخاري، الحديث ٣٥٧٩",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    seerahPeriodAr: "العهد المدني",
    keyLesson: "Allah can place barakah in what appears small.",
    keyLessonAr: "يضع الله البركة فيما يبدو قليلًا.",
    tags: ["Water", "Objects", "Sahih al-Bukhari"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "provision",
  },
  {
    id: 11,
    title: "Food increased during the digging of the Trench",
    titleAr: "زيادة الطعام أثناء حفر الخندق",
    category: "Food",
    categoryAr: "الطعام",
    summary: "A small amount of food prepared by Jabir رضي الله عنه fed many during the Battle of the Trench.",
    summaryAr: "أطعمت كمية قليلة من الطعام أعدّها جابر رضي الله عنه عددًا كبيرًا في غزوة الخندق.",
    source: "Sahih al-Bukhari 4101; Sahih al-Bukhari 4102",
    sourceAr: "صحيح البخاري، الحديث ٤١٠١؛ صحيح البخاري، الحديث ٤١٠٢",
    authenticity: "Sahih",
    seerahPeriod: "Battle of the Trench",
    seerahPeriodAr: "غزوة الخندق",
    keyLesson: "Allah supported the believers during severe hardship.",
    keyLessonAr: "أيّد الله المؤمنين في أشد أوقات الشدة.",
    tags: ["Food", "Sahih al-Bukhari"],
    displayPriority: true,
    verificationStatus: "verified",
    section: "provision",
  },
  {
    id: 12,
    title: "Milk became enough for Ahl al-Suffah",
    titleAr: "اللبن يكفي أهل الصُّفّة",
    category: "Food",
    categoryAr: "الطعام",
    summary: "A bowl of milk was enough for the people of al-Suffah, Abu Hurairah رضي الله عنه, and the Prophet ﷺ.",
    summaryAr: "كفى قدح من اللبن أهل الصُّفّة وأبا هريرة رضي الله عنه والنبي ﷺ.",
    source: "Sahih al-Bukhari 6452",
    sourceAr: "صحيح البخاري، الحديث ٦٤٥٢",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    seerahPeriodAr: "العهد المدني",
    keyLesson: "Barakah can transform scarcity into sufficiency.",
    keyLessonAr: "يمكن للبركة أن تحوّل القلة إلى كفاية.",
    tags: ["Food", "Sahih al-Bukhari"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "provision",
  },
  {
    id: 13,
    title: "Food increased for Abu Bakr's guests",
    titleAr: "زيادة الطعام لضيوف أبي بكر",
    category: "Food",
    categoryAr: "الطعام",
    summary: "Food served to guests increased rather than decreased.",
    summaryAr: "زاد الطعام المقدَّم للضيوف بدلًا من أن ينقص.",
    source: "Sahih al-Bukhari, Book of Prayer Times / related narration",
    sourceAr: "صحيح البخاري، كتاب مواقيت الصلاة / رواية متعلقة بذلك",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    seerahPeriodAr: "العهد المدني",
    keyLesson: "Allah places blessing where He wills.",
    keyLessonAr: "يضع الله البركة حيث يشاء.",
    tags: ["Food", "Sahih al-Bukhari"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "provision",
  },
  {
    id: 14,
    title: "Supplication for rain",
    titleAr: "الدعاء بالاستسقاء",
    category: "Prophetic Supplication",
    categoryAr: "الدعاء النبوي",
    summary: "The companions would seek rain through the Prophet's ﷺ supplication during drought.",
    summaryAr: "كان الصحابة يستسقون بدعاء النبي ﷺ عند الجفاف.",
    source: "Sahih al-Bukhari 1010",
    sourceAr: "صحيح البخاري، الحديث ١٠١٠",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    seerahPeriodAr: "العهد المدني",
    keyLesson: "Rain and relief come from Allah.",
    keyLessonAr: "الغيث والفرج من عند الله.",
    tags: ["Prophetic Knowledge", "Sahih al-Bukhari"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "knowledge",
  },

  // SECTION 4: SIGNS INVOLVING OBJECTS, ANIMALS, AND PLACES
  {
    id: 15,
    title: "The crying date-palm trunk",
    titleAr: "حنين الجذع",
    category: "Objects",
    categoryAr: "الأشياء",
    summary: "The date-palm trunk cried when the Prophet ﷺ moved to the new pulpit.",
    summaryAr: "حنّ جذع النخلة عندما انتقل النبي ﷺ إلى المنبر الجديد.",
    source: "Sahih al-Bukhari 3584",
    sourceAr: "صحيح البخاري، الحديث ٣٥٨٤",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    seerahPeriodAr: "العهد المدني",
    keyLesson: "Even objects longed for the remembrance of Allah near the Prophet ﷺ.",
    keyLessonAr: "حتى الجمادات اشتاقت لذكر الله قرب النبي ﷺ.",
    tags: ["Objects", "Sahih al-Bukhari"],
    displayPriority: true,
    verificationStatus: "verified",
    section: "objects",
  },
  {
    id: 16,
    title: "Food glorifying Allah",
    titleAr: "تسبيح الطعام",
    category: "Objects / Food",
    categoryAr: "الأشياء / الطعام",
    summary: "The companions heard food glorifying Allah while it was being eaten.",
    summaryAr: "سمع الصحابة تسبيح الطعام وهم يأكلونه.",
    source: "Sahih al-Bukhari 3579",
    sourceAr: "صحيح البخاري، الحديث ٣٥٧٩",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    seerahPeriodAr: "العهد المدني",
    keyLesson: "Allah allows His creation to glorify Him in ways beyond our normal perception.",
    keyLessonAr: "يُسبّح لله ما في السماوات والأرض بطرق تفوق إدراكنا المعتاد.",
    tags: ["Objects", "Food", "Sahih al-Bukhari"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "objects",
  },
  {
    id: 17,
    title: "Two companions guided by lights",
    titleAr: "نور يهدي صحابيين في الظلام",
    category: "Signs for Companions",
    categoryAr: "آيات للصحابة",
    summary: "Two companions left the Prophet ﷺ on a dark night and were guided by lights until each reached home.",
    summaryAr: "خرج صحابيان من عند النبي ﷺ في ليلة مظلمة، فأضاء لهما نور حتى وصل كل منهما إلى بيته.",
    source: "Sahih al-Bukhari 465",
    sourceAr: "صحيح البخاري، الحديث ٤٦٥",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    seerahPeriodAr: "العهد المدني",
    keyLesson: "Allah honored and aided the companions.",
    keyLessonAr: "أكرم الله الصحابة وأعانهم.",
    tags: ["Objects", "Sahih al-Bukhari"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "objects",
  },
  {
    id: 18,
    title: "Mount Uhud shook",
    titleAr: "اهتزاز جبل أُحُد",
    category: "Places",
    categoryAr: "الأماكن",
    summary: "Uhud shook while the Prophet ﷺ, Abu Bakr, Umar, and Uthman رضي الله عنهم were on it, and the Prophet ﷺ told it to be firm.",
    summaryAr: "اهتز جبل أُحُد وعليه النبي ﷺ وأبو بكر وعمر وعثمان رضي الله عنهم، فقال له النبي ﷺ اثبت.",
    source: "Sahih al-Bukhari 3675",
    sourceAr: "صحيح البخاري، الحديث ٣٦٧٥",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    seerahPeriodAr: "العهد المدني",
    keyLesson: "This narration also indicated the future martyrdom of Umar and Uthman رضي الله عنهما.",
    keyLessonAr: "أشارت هذه الرواية أيضًا إلى استشهاد عمر وعثمان رضي الله عنهما لاحقًا.",
    tags: ["Places", "Prophetic Knowledge", "Sahih al-Bukhari"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "objects",
  },
  {
    id: 19,
    title: "Uhud loves us and we love it",
    titleAr: "أُحُد جبل يحبنا ونحبه",
    category: "Places",
    categoryAr: "الأماكن",
    summary: "The Prophet ﷺ said that Uhud is a mountain that loves the believers and is loved by them.",
    summaryAr: "قال النبي ﷺ إن أُحُد جبل يحب المؤمنين ويحبونه.",
    source: "Sahih al-Bukhari 4084",
    sourceAr: "صحيح البخاري، الحديث ٤٠٨٤",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    seerahPeriodAr: "العهد المدني",
    keyLesson: "Certain places connected to faith carry special honor.",
    keyLessonAr: "لبعض الأماكن المرتبطة بالإيمان مكانة خاصة.",
    tags: ["Places", "Sahih al-Bukhari"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "objects",
  },
  {
    id: 20,
    title: "Suraqah's horse sank during the Hijrah pursuit",
    titleAr: "غوص فرس سراقة أثناء مطاردة الهجرة",
    category: "Protection",
    categoryAr: "الحماية",
    summary: "Suraqah pursued the Prophet ﷺ during the Hijrah, and his horse's forelegs sank until he asked for safety.",
    summaryAr: "تتبّع سراقة النبي ﷺ أثناء الهجرة، فغاصت قوائم فرسه في الأرض حتى طلب الأمان.",
    source: "Sahih al-Bukhari, Suraqah narration",
    sourceAr: "صحيح البخاري، رواية سراقة",
    authenticity: "Sahih",
    seerahPeriod: "Hijrah",
    seerahPeriodAr: "الهجرة",
    keyLesson: "Allah protected His Messenger ﷺ during migration.",
    keyLessonAr: "حفظ الله رسوله ﷺ أثناء هجرته.",
    tags: ["Animals", "Sahih al-Bukhari"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "objects",
  },

  // SECTION 5: HEALING, KNOWLEDGE, AND FULFILLED SIGNS
  {
    id: 21,
    title: "Healing of Ali's رضي الله عنه eyes at Khaybar",
    titleAr: "شفاء عيني علي رضي الله عنه يوم خيبر",
    category: "Healing",
    categoryAr: "الشفاء",
    summary: "Ali رضي الله عنه had eye trouble, and the Prophet ﷺ applied saliva and supplicated for him, and he was cured.",
    summaryAr: "اشتكى علي رضي الله عنه من عينيه، فتفل النبي ﷺ فيهما ودعا له، فشُفي.",
    source: "Sahih al-Bukhari 3009",
    sourceAr: "صحيح البخاري، الحديث ٣٠٠٩",
    authenticity: "Sahih",
    seerahPeriod: "Khaybar",
    seerahPeriodAr: "غزوة خيبر",
    keyLesson: "Allah granted healing through the Prophet's ﷺ supplication and touch.",
    keyLessonAr: "منح الله الشفاء بدعاء النبي ﷺ ولمسه.",
    tags: ["Healing", "Sahih al-Bukhari"],
    displayPriority: true,
    verificationStatus: "verified",
    section: "knowledge",
  },
  {
    id: 22,
    title: "Abu Hurairah's memory strengthened",
    titleAr: "تقوية حفظ أبي هريرة",
    category: "Prophetic Supplication / Knowledge",
    categoryAr: "الدعاء النبوي / العلم",
    summary: "Abu Hurairah رضي الله عنه complained of forgetting hadith, and after the Prophet's ﷺ instruction, he said he never forgot.",
    summaryAr: "اشتكى أبو هريرة رضي الله عنه من نسيان الحديث، فأرشده النبي ﷺ، فقال إنه لم ينسَ بعدها شيئًا.",
    source: "Sahih al-Bukhari 3648",
    sourceAr: "صحيح البخاري، الحديث ٣٦٤٨",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    seerahPeriodAr: "العهد المدني",
    keyLesson: "Allah preserved knowledge through the companions.",
    keyLessonAr: "حفظ الله العلم عن طريق الصحابة.",
    tags: ["Prophetic Knowledge", "Sahih al-Bukhari"],
    displayPriority: true,
    verificationStatus: "verified",
    section: "knowledge",
  },
  {
    id: 23,
    title: "Supplication for Ibn Abbas رضي الله عنهما",
    titleAr: "دعاء النبي ﷺ لابن عباس رضي الله عنهما",
    category: "Prophetic Supplication / Knowledge",
    categoryAr: "الدعاء النبوي / العلم",
    summary: "The Prophet ﷺ supplicated for Ibn Abbas رضي الله عنهما to be taught wisdom and understanding of the Qur'an.",
    summaryAr: "دعا النبي ﷺ لابن عباس رضي الله عنهما أن يُعلَّم الحكمة وتأويل القرآن.",
    source: "Sahih al-Bukhari 3756",
    sourceAr: "صحيح البخاري، الحديث ٣٧٥٦",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    seerahPeriodAr: "العهد المدني",
    keyLesson: "Knowledge is a gift from Allah.",
    keyLessonAr: "العلم هبة من الله تعالى.",
    tags: ["Prophetic Knowledge", "Sahih al-Bukhari"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "knowledge",
  },
  {
    id: 24,
    title: "Prophecy of Umar and Uthman's martyrdom",
    titleAr: "نبوءة استشهاد عمر وعثمان",
    category: "Prophetic Knowledge",
    categoryAr: "العلم النبوي",
    summary: "When Uhud shook, the Prophet ﷺ said that upon it were a Prophet, a Siddiq, and two martyrs.",
    summaryAr: "لما اهتز أُحُد، قال النبي ﷺ إن عليه نبيًا وصدّيقًا وشهيدين.",
    source: "Sahih al-Bukhari 3675",
    sourceAr: "صحيح البخاري، الحديث ٣٦٧٥",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    seerahPeriodAr: "العهد المدني",
    keyLesson: "Allah informed His Messenger ﷺ of future events.",
    keyLessonAr: "أخبر الله رسوله ﷺ بأمور مستقبلية.",
    tags: ["Prophetic Knowledge", "Sahih al-Bukhari"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "knowledge",
  },
  {
    id: 25,
    title: "The conquest of Makkah",
    titleAr: "فتح مكة",
    category: "Fulfilled Sign",
    categoryAr: "آية تحققت",
    summary: "Allah fulfilled His promise and allowed the Prophet ﷺ to return to Makkah in victory.",
    summaryAr: "أوفى الله بوعده وأعاد النبي ﷺ إلى مكة فاتحًا.",
    source: "Qur'an 48:27; Seerah event",
    sourceAr: "القرآن الكريم، سورة الفتح: ٢٧؛ حدث من السيرة",
    authenticity: "Qur'an",
    seerahPeriod: "8 AH",
    seerahPeriodAr: "السنة الثامنة للهجرة",
    keyLesson: "Allah's promise comes true even after years of hardship.",
    keyLessonAr: "يتحقق وعد الله ولو بعد سنوات من الشدة.",
    tags: ["Prophetic Knowledge", "Qur'an", "Qur'anic Evidence"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "knowledge",
  },
  {
    id: 26,
    title: "The spread of Islam through delegations",
    titleAr: "انتشار الإسلام عبر الوفود",
    category: "Fulfilled Sign",
    categoryAr: "آية تحققت",
    summary: "Tribes came to Madinah in large numbers after the conquest and after Islam became established.",
    summaryAr: "توافدت القبائل إلى المدينة بأعداد كبيرة بعد الفتح واستقرار الإسلام.",
    source: "Qur'an 110:1-3; Seerah event",
    sourceAr: "القرآن الكريم، سورة النصر: ١-٣؛ حدث من السيرة",
    authenticity: "Qur'an",
    seerahPeriod: "9 AH",
    seerahPeriodAr: "السنة التاسعة للهجرة",
    keyLesson: "Victory belongs to Allah and should lead to praise and repentance.",
    keyLessonAr: "النصر من عند الله، وينبغي أن يقود إلى التسبيح والاستغفار.",
    tags: ["Prophetic Knowledge", "Qur'an", "Qur'anic Evidence"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "knowledge",
  },
  {
    id: 27,
    title: "Letters to rulers",
    titleAr: "الرسائل إلى الملوك",
    category: "Prophetic Mission",
    categoryAr: "الرسالة النبوية",
    summary: "The Prophet ﷺ sent letters to rulers beyond Arabia, showing the universal nature of his message.",
    summaryAr: "أرسل النبي ﷺ رسائل إلى ملوك خارج الجزيرة العربية، مما يظهر عالمية رسالته.",
    source: "Sahih al-Bukhari 7 and Seerah reports",
    sourceAr: "صحيح البخاري، الحديث ٧، وروايات من السيرة",
    authenticity: "Sahih",
    seerahPeriod: "6-7 AH",
    seerahPeriodAr: "السنة السادسة والسابعة للهجرة",
    keyLesson: "The message of Islam was not tribal or local; it was universal.",
    keyLessonAr: "رسالة الإسلام لم تكن قبلية أو محلية، بل كانت عالمية.",
    tags: ["Prophetic Knowledge", "Sahih al-Bukhari"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "knowledge",
  },
  {
    id: 28,
    title: "Protection in the cave during Hijrah",
    titleAr: "الحماية في الغار أثناء الهجرة",
    category: "Protection",
    categoryAr: "الحماية",
    summary: "The Qur'an mentions Allah supporting the Prophet ﷺ when he was with his companion in the cave.",
    summaryAr: "يذكر القرآن تأييد الله للنبي ﷺ حين كان مع صاحبه في الغار.",
    source: "Qur'an 9:40",
    sourceAr: "القرآن الكريم، سورة التوبة: ٤٠",
    authenticity: "Qur'an",
    seerahPeriod: "Hijrah",
    seerahPeriodAr: "الهجرة",
    keyLesson: "Allah's help is greater than visible means.",
    keyLessonAr: "نصر الله أعظم من الأسباب الظاهرة.",
    tags: ["Qur'an", "Qur'anic Evidence"],
    displayPriority: true,
    verificationStatus: "verified",
    section: "knowledge",
  },
  {
    id: 29,
    title: "Victory at Badr",
    titleAr: "النصر في غزوة بدر",
    category: "Divine Support",
    categoryAr: "التأييد الإلهي",
    summary: "Allah supported the believers at Badr when they were few.",
    summaryAr: "أيّد الله المؤمنين في بدر وهم قلة.",
    source: "Qur'an 3:123-125; Seerah event",
    sourceAr: "القرآن الكريم، سورة آل عمران: ١٢٣-١٢٥؛ حدث من السيرة",
    authenticity: "Qur'an",
    seerahPeriod: "2 AH",
    seerahPeriodAr: "السنة الثانية للهجرة",
    keyLesson: "Victory comes from Allah, not numbers.",
    keyLessonAr: "النصر من عند الله لا بكثرة العدد.",
    tags: ["Qur'an", "Qur'anic Evidence"],
    displayPriority: true,
    verificationStatus: "verified",
    section: "knowledge",
  },
  {
    id: 30,
    title: "Calmness during danger",
    titleAr: "الطمأنينة وقت الخطر",
    category: "Protection / Trust",
    categoryAr: "الحماية / التوكل",
    summary: "During the Hijrah, the Prophet ﷺ remained calm and trusted Allah while Quraysh searched for him.",
    summaryAr: "أثناء الهجرة، بقي النبي ﷺ هادئًا متوكلًا على الله بينما كانت قريش تبحث عنه.",
    source: "Qur'an 9:40; Sahih Hijrah narrations",
    sourceAr: "القرآن الكريم، سورة التوبة: ٤٠؛ روايات صحيحة عن الهجرة",
    authenticity: "Qur'an",
    seerahPeriod: "Hijrah",
    seerahPeriodAr: "الهجرة",
    keyLesson: "Tawakkul is strongest when danger is closest.",
    keyLessonAr: "التوكل يكون أقوى حين يشتد الخطر.",
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

const CATEGORY_LABELS_AR: Record<string, string> = {
  "All": "الكل",
  "Qur'an": "القرآن",
  "Cosmic Signs": "الآيات الكونية",
  "Isra and Mi'raj": "الإسراء والمعراج",
  "Water": "الماء",
  "Food": "الطعام",
  "Healing": "الشفاء",
  "Objects": "الأشياء",
  "Animals": "الحيوانات",
  "Places": "الأماكن",
  "Prophetic Knowledge": "العلم النبوي",
  "Sahih al-Bukhari": "صحيح البخاري",
  "Sahih Muslim": "صحيح مسلم",
  "Qur'anic Evidence": "دليل قرآني",
};

const AUTHENTICITY_LABELS_AR: Record<string, string> = {
  "Qur'an": "القرآن الكريم",
  "Sahih": "صحيح",
  "Authentic Report": "رواية صحيحة",
  "Needs Scholar Review": "يحتاج مراجعة علمية",
};

export function MiraclesSignsContent({ lang = "en" }: { lang?: CourseLang }) {
  const isRtl = lang === "ar";
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
      miracles = miracles.filter((miracle) =>
        isRtl
          ? miracle.titleAr.toLowerCase().includes(query) ||
            miracle.categoryAr.toLowerCase().includes(query) ||
            miracle.summaryAr.toLowerCase().includes(query) ||
            miracle.sourceAr.toLowerCase().includes(query) ||
            miracle.keyLessonAr.toLowerCase().includes(query)
          : miracle.title.toLowerCase().includes(query) ||
            miracle.category.toLowerCase().includes(query) ||
            miracle.summary.toLowerCase().includes(query) ||
            miracle.source.toLowerCase().includes(query) ||
            miracle.keyLesson.toLowerCase().includes(query)
      );
    }

    return miracles;
  }, [searchQuery, selectedCategory, verifiedMiracles, isRtl]);

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
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-ink py-16">
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
            {isRtl ? "المعجزات والآيات" : "Miracles and Signs"}
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed max-w-3xl mb-6">
            {isRtl
              ? "روايات موثقة من معجزات وآيات النبي ﷺ."
              : "Verified narrations of miracles and signs granted to the Prophet ﷺ."}
          </p>

          {/* Verification note */}
          <div className="flex gap-3 p-4 rounded-xl bg-surface border border-border/50">
            <Info className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-text-secondary leading-relaxed">
                {isRtl
                  ? "تُعطي هذه الصفحة الأولوية للروايات الواردة في القرآن الكريم وصحيح البخاري وصحيح مسلم، والتقارير التي صنّفها العلماء المعتبرون بأنها صحيحة. لا تُدرج هنا القصص الشائعة التي تفتقر إلى توثيق قوي."
                  : "This section prioritizes narrations from the Qur'an, Sahih al-Bukhari, Sahih Muslim, and reports graded authentic by recognized scholars. Popular stories without strong verification are not included here."}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-2xl font-bold text-gold">{quranCount}</p>
            <p className="text-xs text-text-secondary mt-1">
              {isRtl ? "الإشارات القرآنية" : "Qur'anic references"}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-2xl font-bold text-gold">{sahihBukhariCount}</p>
            <p className="text-xs text-text-secondary mt-1">
              {isRtl ? "من صحيح البخاري" : "From Sahih al-Bukhari"}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-2xl font-bold text-gold">{totalCount}+</p>
            <p className="text-xs text-text-secondary mt-1">
              {isRtl ? "الآيات الموثقة المدرجة" : "Verified signs included"}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-2xl font-bold text-gold">100%</p>
            <p className="text-xs text-text-secondary mt-1">
              {isRtl ? "المصادر الموضحة" : "Sources shown"}
            </p>
          </div>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder={
                isRtl
                  ? "ابحث عن المعجزات أو الآيات أو المصادر أو الدروس…"
                  : "Search miracles, signs, sources, or lessons…"
              }
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
                {isRtl ? CATEGORY_LABELS_AR[category] : category}
              </button>
            );
          })}
        </div>

        {/* Miracles grid */}
        {filteredMiracles.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-text-muted">
              {isRtl ? "لا توجد معجزات مطابقة لبحثك أو التصفية." : "No miracles match your search or filter."}
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
                          {isRtl ? miracle.titleAr : miracle.title}
                        </h3>
                        <p className="text-xs text-text-muted mt-0.5">
                          {isRtl ? miracle.categoryAr : miracle.category}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-text-secondary leading-relaxed mb-3">
                      {isRtl ? miracle.summaryAr : miracle.summary}
                    </p>

                    <div className="space-y-2 mb-3 pt-3 border-t border-border">
                      <div>
                        <p className="text-xs font-medium text-text-muted mb-1">
                          {isRtl ? "المصدر:" : "Source:"}
                        </p>
                        <p className="text-xs text-text-secondary leading-relaxed">
                          {isRtl ? miracle.sourceAr : miracle.source}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-text-muted mb-1">
                          {isRtl ? "الدرس المستفاد:" : "Key Lesson:"}
                        </p>
                        <p className="text-xs text-text-secondary leading-relaxed">
                          {isRtl ? miracle.keyLessonAr : miracle.keyLesson}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded border text-xs font-medium ${getAuthenticityBadge(
                          miracle.authenticity
                        )}`}
                      >
                        {isRtl ? AUTHENTICITY_LABELS_AR[miracle.authenticity] : miracle.authenticity}
                      </span>
                      <span className="px-2 py-1 rounded border text-xs font-medium bg-surface-raised text-text-muted border-border/50">
                        {isRtl ? miracle.seerahPeriodAr : miracle.seerahPeriod}
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
                    ? isRtl
                      ? "عرض أقل"
                      : "Show Less"
                    : isRtl
                    ? `عرض كل ${filteredMiracles.length} من المعجزات والآيات`
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
              {isRtl ? "قصص شائعة تحتاج إلى توثيق" : "Popular Stories That Need Verification"}
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              {isRtl
                ? "بعض قصص المعجزات منتشرة في المحاضرات وكتب الأطفال، لكن هذه الصفحة لا تُدرجها إلا إذا توفر مصدر موثوق وتصنيف لدرجة صحتها. من الأمثلة على ذلك: قصة نسج العنكبوت على باب الغار، وقصة الحمامة وعشّها، وأن النبي ﷺ لم يكن له ظل، وأن الغيوم كانت تظلله باستمرار، وتفاصيل مبالغ فيها عن معجزات الولادة — ما لم تُوثَّق بمصدر ودرجة صحة."
                : "Some miracle stories are popular in lectures and children's books, but this section does not include them unless a reliable source and authenticity grading are added. Examples include: the spider web over the cave, the dove/nest story, the Prophet ﷺ casting no shadow, clouds constantly shading him, and overly detailed birth miracles — unless verified with grading and source."}
            </p>
            <p className="text-xs text-text-muted">
              {isRtl
                ? "هذا النهج يحافظ على دقة هذا المرجع وموثوقيته."
                : "This approach keeps the reference accurate and trustworthy."}
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 pt-8 border-t border-border">
          <div className="p-6 rounded-2xl bg-surface border border-border text-center">
            <h2 className="text-lg font-semibold text-text mb-2">
              {isRtl ? "واصل تعلّم السيرة النبوية" : "Continue Learning the Seerah"}
            </h2>
            <p className="text-sm text-text-secondary mb-4">
              {isRtl
                ? "عد إلى دورة السيرة الكاملة لدراسة سياق وتفاصيل هذه المعجزات والآيات."
                : "Go back to the full Seerah course to study the context and details of these miracles and signs."}
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
