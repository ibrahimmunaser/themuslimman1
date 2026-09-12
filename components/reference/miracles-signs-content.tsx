"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Info, Book, Moon, Droplet, Utensils, Shield, Mountain, Sparkles, Heart } from "lucide-react";
import type { CourseLang } from "@/lib/course-lang";
import { loc } from "@/lib/loc";

// IMPORTANT: Do not add miracle reports without a source and authenticity grading.
// This section prioritizes narrations from the Qur'an, Sahih al-Bukhari, Sahih Muslim,
// and reports graded authentic by recognized scholars.

interface Miracle {
  id: number;
  title: string;
  titleAr: string;
  titleFr: string;
  category: string;
  categoryAr: string;
  categoryFr: string;
  summary: string;
  summaryAr: string;
  summaryFr: string;
  source: string;
  sourceAr: string;
  sourceFr: string;
  authenticity: "Qur'an" | "Sahih" | "Authentic Report" | "Needs Scholar Review";
  seerahPeriod: string;
  seerahPeriodAr: string;
  seerahPeriodFr: string;
  keyLesson: string;
  keyLessonAr: string;
  keyLessonFr: string;
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
    titleFr: "Le Coran, le miracle durable",
    category: "Qur'an",
    categoryAr: "القرآن الكريم",
    categoryFr: "Coran",
    summary: "The Prophet ﷺ said that what he was given was Divine Revelation, and he hoped to have the most followers on the Day of Resurrection.",
    summaryAr: "قال النبي ﷺ إن ما أُعطيه هو الوحي الإلهي، وأنه يرجو أن يكون له أكثر الأتباع يوم القيامة.",
    summaryFr: "Le Prophète ﷺ a dit que ce qui lui a été donné était la Révélation divine, et qu'il espérait avoir le plus de fidèles le Jour de la Résurrection.",
    source: "Sahih al-Bukhari 4981",
    sourceAr: "صحيح البخاري، الحديث ٤٩٨١",
    sourceFr: "Sahih al-Bukhari 4981",
    authenticity: "Sahih",
    seerahPeriod: "Entire mission",
    seerahPeriodAr: "طوال الرسالة",
    seerahPeriodFr: "Toute la mission",
    keyLesson: "The Qur'an is the greatest and continuing miracle of the Prophet ﷺ.",
    keyLessonAr: "القرآن الكريم هو أعظم معجزات النبي ﷺ وأبقاها.",
    keyLessonFr: "Le Coran est le plus grand miracle du Prophète ﷺ, et il demeure.",
    tags: ["Qur'an", "Sahih al-Bukhari"],
    displayPriority: true,
    verificationStatus: "verified",
    section: "quran",
  },
  {
    id: 2,
    title: "The challenge to produce a surah like it",
    titleAr: "التحدي بالإتيان بسورة من مثله",
    titleFr: "Le défi de produire une sourate semblable",
    category: "Qur'an",
    categoryAr: "القرآن الكريم",
    categoryFr: "Coran",
    summary: "Allah challenges those in doubt to produce a surah like what was revealed.",
    summaryAr: "يتحدى الله تعالى من كانوا في شك أن يأتوا بسورة من مثل ما أُنزل.",
    summaryFr: "Allah défie ceux qui doutent de produire une sourate semblable à ce qui a été révélé.",
    source: "Qur'an 2:23",
    sourceAr: "القرآن الكريم، سورة البقرة: ٢٣",
    sourceFr: "Coran 2:23",
    authenticity: "Qur'an",
    seerahPeriod: "Makkan/Madinan message",
    seerahPeriodAr: "الرسالة المكية والمدنية",
    seerahPeriodFr: "Message mekkois et médinois",
    keyLesson: "The Qur'an itself stands as proof and guidance.",
    keyLessonAr: "القرآن نفسه دليل وهداية قائمة بذاتها.",
    keyLessonFr: "Le Coran lui-même est une preuve et une guidance.",
    tags: ["Qur'an", "Qur'anic Evidence"],
    displayPriority: true,
    verificationStatus: "verified",
    section: "quran",
  },
  {
    id: 3,
    title: "The Qur'an's unmatched nature",
    titleAr: "إعجاز القرآن الذي لا يُضاهى",
    titleFr: "L'inimitabilité du Coran",
    category: "Qur'an",
    categoryAr: "القرآن الكريم",
    categoryFr: "Coran",
    summary: "Allah states that mankind and jinn could not produce the like of the Qur'an even if they supported one another.",
    summaryAr: "يبيّن الله تعالى أن الإنس والجن لن يستطيعوا الإتيان بمثل هذا القرآن ولو كان بعضهم لبعض ظهيرًا.",
    summaryFr: "Allah affirme que les hommes et les djinns ne pourraient produire l'équivalent du Coran, même s'ils s'entraidaient.",
    source: "Qur'an 17:88",
    sourceAr: "القرآن الكريم، سورة الإسراء: ٨٨",
    sourceFr: "Coran 17:88",
    authenticity: "Qur'an",
    seerahPeriod: "Makkan revelation",
    seerahPeriodAr: "الوحي المكي",
    seerahPeriodFr: "Révélation mekkoise",
    keyLesson: "The Qur'an is beyond human imitation.",
    keyLessonAr: "القرآن فوق طاقة البشر على محاكاته.",
    keyLessonFr: "Le Coran dépasse toute imitation humaine.",
    tags: ["Qur'an", "Qur'anic Evidence"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "quran",
  },
  {
    id: 4,
    title: "Preservation of revelation",
    titleAr: "حفظ الوحي",
    titleFr: "La préservation de la Révélation",
    category: "Qur'an",
    categoryAr: "القرآن الكريم",
    categoryFr: "Coran",
    summary: "Allah promises to preserve the Reminder.",
    summaryAr: "وعد الله تعالى بحفظ الذكر.",
    summaryFr: "Allah promet de préserver le Rappel.",
    source: "Qur'an 15:9",
    sourceAr: "القرآن الكريم، سورة الحجر: ٩",
    sourceFr: "Coran 15:9",
    authenticity: "Qur'an",
    seerahPeriod: "Entire Ummah",
    seerahPeriodAr: "لجميع الأمة",
    seerahPeriodFr: "Toute l'Oumma",
    keyLesson: "The Qur'an remains protected as guidance for every generation.",
    keyLessonAr: "يبقى القرآن محفوظًا هداية لكل جيل.",
    keyLessonFr: "Le Coran reste protégé comme guidance pour chaque génération.",
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
    titleFr: "La fente de la lune",
    category: "Cosmic Signs",
    categoryAr: "الآيات الكونية",
    categoryFr: "Signes cosmiques",
    summary: "The moon was split as a sign during the lifetime of the Prophet ﷺ.",
    summaryAr: "انشق القمر آيةً في زمن النبي ﷺ.",
    summaryFr: "La lune fut fendue en signe du vivant du Prophète ﷺ.",
    source: "Qur'an 54:1; Sahih al-Bukhari 4864; Sahih al-Bukhari 3637",
    sourceAr: "القرآن الكريم، سورة القمر: ١؛ صحيح البخاري، الحديث ٤٨٦٤؛ صحيح البخاري، الحديث ٣٦٣٧",
    sourceFr: "Coran 54:1 ; Sahih al-Bukhari 4864 ; Sahih al-Bukhari 3637",
    authenticity: "Qur'an",
    seerahPeriod: "Makkan period",
    seerahPeriodAr: "العهد المكي",
    seerahPeriodFr: "Période mekkoise",
    keyLesson: "Allah supported His Messenger ﷺ with clear signs.",
    keyLessonAr: "أيّد الله تعالى رسوله ﷺ بآيات بيّنة.",
    keyLessonFr: "Allah a soutenu Son Messager ﷺ par des signes clairs.",
    tags: ["Cosmic Signs", "Qur'an", "Sahih al-Bukhari", "Qur'anic Evidence"],
    displayPriority: true,
    verificationStatus: "verified",
    section: "cosmic",
  },
  {
    id: 6,
    title: "Isra: The Night Journey",
    titleAr: "الإسراء: رحلة الليل",
    titleFr: "Isra : le Voyage nocturne",
    category: "Isra and Mi'raj",
    categoryAr: "الإسراء والمعراج",
    categoryFr: "Isra et Mi'raj",
    summary: "Allah took His servant by night from al-Masjid al-Haram to al-Masjid al-Aqsa.",
    summaryAr: "أسرى الله بعبده ليلًا من المسجد الحرام إلى المسجد الأقصى.",
    summaryFr: "Allah fit voyager Son serviteur de nuit depuis al-Masjid al-Haram jusqu'à al-Masjid al-Aqsa.",
    source: "Qur'an 17:1",
    sourceAr: "القرآن الكريم، سورة الإسراء: ١",
    sourceFr: "Coran 17:1",
    authenticity: "Qur'an",
    seerahPeriod: "Late Makkan period",
    seerahPeriodAr: "أواخر العهد المكي",
    seerahPeriodFr: "Fin de la période mekkoise",
    keyLesson: "Allah honored His Messenger ﷺ after hardship.",
    keyLessonAr: "أكرم الله رسوله ﷺ بعد شدة العسر.",
    keyLessonFr: "Allah honora Son Messager ﷺ après l'épreuve.",
    tags: ["Isra and Mi'raj", "Qur'an", "Qur'anic Evidence", "Cosmic Signs"],
    displayPriority: true,
    verificationStatus: "verified",
    section: "cosmic",
  },
  {
    id: 7,
    title: "Mi'raj: Ascension through the heavens",
    titleAr: "المعراج: العروج إلى السماوات",
    titleFr: "Mi'raj : l'ascension à travers les cieux",
    category: "Isra and Mi'raj",
    categoryAr: "الإسراء والمعراج",
    categoryFr: "Isra et Mi'raj",
    summary: "Authentic hadith describe the Prophet's ﷺ ascension and what he witnessed.",
    summaryAr: "تصف الأحاديث الصحيحة عروج النبي ﷺ وما شاهده.",
    summaryFr: "Des hadiths authentiques décrivent l'ascension du Prophète ﷺ et ce qu'il vit.",
    source: "Sahih al-Bukhari 7517",
    sourceAr: "صحيح البخاري، الحديث ٧٥١٧",
    sourceFr: "Sahih al-Bukhari 7517",
    authenticity: "Sahih",
    seerahPeriod: "Late Makkan period",
    seerahPeriodAr: "أواخر العهد المكي",
    seerahPeriodFr: "Fin de la période mekkoise",
    keyLesson: "The five daily prayers were given during this great event.",
    keyLessonAr: "فُرضت الصلوات الخمس في هذه الليلة العظيمة.",
    keyLessonFr: "Les cinq prières quotidiennes furent prescrites lors de cet événement grandiose.",
    tags: ["Isra and Mi'raj", "Sahih al-Bukhari", "Cosmic Signs"],
    displayPriority: true,
    verificationStatus: "verified",
    section: "cosmic",
  },
  {
    id: 8,
    title: "The coming of the Prophet ﷺ near the Hour",
    titleAr: "بعثة النبي ﷺ قريبة من الساعة",
    titleFr: "La venue du Prophète ﷺ proche de l'Heure",
    category: "Prophetic Knowledge",
    categoryAr: "العلم النبوي",
    categoryFr: "Savoir prophétique",
    summary: "The Prophet ﷺ indicated that his coming and the Hour are close, like two fingers.",
    summaryAr: "أشار النبي ﷺ إلى أن بعثته والساعة متقاربتان كإصبعين.",
    summaryFr: "Le Prophète ﷺ indiqua que sa venue et l'Heure sont proches, comme deux doigts.",
    source: "Sahih al-Bukhari 4936",
    sourceAr: "صحيح البخاري، الحديث ٤٩٣٦",
    sourceFr: "Sahih al-Bukhari 4936",
    authenticity: "Sahih",
    seerahPeriod: "General teaching",
    seerahPeriodAr: "تعليم عام",
    seerahPeriodFr: "Enseignement général",
    keyLesson: "His mission is connected to the final stage of human history.",
    keyLessonAr: "رسالته ﷺ مرتبطة بالمرحلة الأخيرة من تاريخ البشرية.",
    keyLessonFr: "Sa mission est liée à la dernière étape de l'histoire humaine.",
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
    titleFr: "L'eau jaillissant d'entre ses doigts",
    category: "Water",
    categoryAr: "الماء",
    categoryFr: "Eau",
    summary: "A small amount of water became enough for many companions to drink and perform wudu.",
    summaryAr: "كفت كمية قليلة من الماء عددًا كبيرًا من الصحابة للشرب والوضوء.",
    summaryFr: "Une petite quantité d'eau suffit à de nombreux compagnons pour boire et faire les ablutions (wudu).",
    source: "Sahih al-Bukhari 3576; Sahih al-Bukhari 5639",
    sourceAr: "صحيح البخاري، الحديث ٣٥٧٦؛ صحيح البخاري، الحديث ٥٦٣٩",
    sourceFr: "Sahih al-Bukhari 3576 ; Sahih al-Bukhari 5639",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    seerahPeriodAr: "العهد المدني",
    seerahPeriodFr: "Période médinoise",
    keyLesson: "Blessing comes from Allah.",
    keyLessonAr: "البركة من عند الله وحده.",
    keyLessonFr: "La bénédiction vient d'Allah.",
    tags: ["Water", "Sahih al-Bukhari"],
    displayPriority: true,
    verificationStatus: "verified",
    section: "provision",
  },
  {
    id: 10,
    title: "Water miracle narrated by Ibn Mas'ud",
    titleAr: "معجزة الماء كما رواها ابن مسعود",
    titleFr: "Miracle de l'eau rapporté par Ibn Mas'ud",
    category: "Water",
    categoryAr: "الماء",
    categoryFr: "Eau",
    summary: "Ibn Mas'ud رضي الله عنه reported water coming from between the Prophet's ﷺ fingers and the food glorifying Allah.",
    summaryAr: "روى ابن مسعود رضي الله عنه خروج الماء من بين أصابع النبي ﷺ وتسبيح الطعام بحمد الله.",
    summaryFr: "Ibn Mas'ud رضي الله عنه rapporta que l'eau jaillit d'entre les doigts du Prophète ﷺ et que la nourriture glorifia Allah.",
    source: "Sahih al-Bukhari 3579",
    sourceAr: "صحيح البخاري، الحديث ٣٥٧٩",
    sourceFr: "Sahih al-Bukhari 3579",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    seerahPeriodAr: "العهد المدني",
    seerahPeriodFr: "Période médinoise",
    keyLesson: "Allah can place barakah in what appears small.",
    keyLessonAr: "يضع الله البركة فيما يبدو قليلًا.",
    keyLessonFr: "Allah peut placer la barakah dans ce qui paraît peu.",
    tags: ["Water", "Objects", "Sahih al-Bukhari"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "provision",
  },
  {
    id: 11,
    title: "Food increased during the digging of the Trench",
    titleAr: "زيادة الطعام أثناء حفر الخندق",
    titleFr: "La nourriture multipliée durant le creusement du Fossé",
    category: "Food",
    categoryAr: "الطعام",
    categoryFr: "Nourriture",
    summary: "A small amount of food prepared by Jabir رضي الله عنه fed many during the Battle of the Trench.",
    summaryAr: "أطعمت كمية قليلة من الطعام أعدّها جابر رضي الله عنه عددًا كبيرًا في غزوة الخندق.",
    summaryFr: "Une petite quantité de nourriture préparée par Jabir رضي الله عنه nourrit beaucoup de gens durant la bataille du Fossé.",
    source: "Sahih al-Bukhari 4101; Sahih al-Bukhari 4102",
    sourceAr: "صحيح البخاري، الحديث ٤١٠١؛ صحيح البخاري، الحديث ٤١٠٢",
    sourceFr: "Sahih al-Bukhari 4101 ; Sahih al-Bukhari 4102",
    authenticity: "Sahih",
    seerahPeriod: "Battle of the Trench",
    seerahPeriodAr: "غزوة الخندق",
    seerahPeriodFr: "Bataille du Fossé",
    keyLesson: "Allah supported the believers during severe hardship.",
    keyLessonAr: "أيّد الله المؤمنين في أشد أوقات الشدة.",
    keyLessonFr: "Allah soutint les croyants dans une épreuve sévère.",
    tags: ["Food", "Sahih al-Bukhari"],
    displayPriority: true,
    verificationStatus: "verified",
    section: "provision",
  },
  {
    id: 12,
    title: "Milk became enough for Ahl al-Suffah",
    titleAr: "اللبن يكفي أهل الصُّفّة",
    titleFr: "Le lait suffit pour Ahl al-Suffah",
    category: "Food",
    categoryAr: "الطعام",
    categoryFr: "Nourriture",
    summary: "A bowl of milk was enough for the people of al-Suffah, Abu Hurairah رضي الله عنه, and the Prophet ﷺ.",
    summaryAr: "كفى قدح من اللبن أهل الصُّفّة وأبا هريرة رضي الله عنه والنبي ﷺ.",
    summaryFr: "Un bol de lait suffit pour les gens d'al-Suffah, Abu Hurairah رضي الله عنه et le Prophète ﷺ.",
    source: "Sahih al-Bukhari 6452",
    sourceAr: "صحيح البخاري، الحديث ٦٤٥٢",
    sourceFr: "Sahih al-Bukhari 6452",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    seerahPeriodAr: "العهد المدني",
    seerahPeriodFr: "Période médinoise",
    keyLesson: "Barakah can transform scarcity into sufficiency.",
    keyLessonAr: "يمكن للبركة أن تحوّل القلة إلى كفاية.",
    keyLessonFr: "La barakah peut transformer la rareté en suffisance.",
    tags: ["Food", "Sahih al-Bukhari"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "provision",
  },
  {
    id: 13,
    title: "Food increased for Abu Bakr's guests",
    titleAr: "زيادة الطعام لضيوف أبي بكر",
    titleFr: "La nourriture multipliée pour les hôtes d'Abu Bakr",
    category: "Food",
    categoryAr: "الطعام",
    categoryFr: "Nourriture",
    summary: "Food served to guests increased rather than decreased.",
    summaryAr: "زاد الطعام المقدَّم للضيوف بدلًا من أن ينقص.",
    summaryFr: "La nourriture servie aux hôtes augmenta au lieu de diminuer.",
    source: "Sahih al-Bukhari, Book of Prayer Times / related narration",
    sourceAr: "صحيح البخاري، كتاب مواقيت الصلاة / رواية متعلقة بذلك",
    sourceFr: "Sahih al-Bukhari, Livre des horaires de la prière / narration liée",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    seerahPeriodAr: "العهد المدني",
    seerahPeriodFr: "Période médinoise",
    keyLesson: "Allah places blessing where He wills.",
    keyLessonAr: "يضع الله البركة حيث يشاء.",
    keyLessonFr: "Allah place la bénédiction où Il veut.",
    tags: ["Food", "Sahih al-Bukhari"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "provision",
  },
  {
    id: 14,
    title: "Supplication for rain",
    titleAr: "الدعاء بالاستسقاء",
    titleFr: "L'invocation pour la pluie",
    category: "Prophetic Supplication",
    categoryAr: "الدعاء النبوي",
    categoryFr: "Invocation prophétique",
    summary: "The companions would seek rain through the Prophet's ﷺ supplication during drought.",
    summaryAr: "كان الصحابة يستسقون بدعاء النبي ﷺ عند الجفاف.",
    summaryFr: "Les compagnons demandaient la pluie par l'invocation du Prophète ﷺ en période de sécheresse.",
    source: "Sahih al-Bukhari 1010",
    sourceAr: "صحيح البخاري، الحديث ١٠١٠",
    sourceFr: "Sahih al-Bukhari 1010",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    seerahPeriodAr: "العهد المدني",
    seerahPeriodFr: "Période médinoise",
    keyLesson: "Rain and relief come from Allah.",
    keyLessonAr: "الغيث والفرج من عند الله.",
    keyLessonFr: "La pluie et le soulagement viennent d'Allah.",
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
    titleFr: "Le tronc de palmier qui gémissait",
    category: "Objects",
    categoryAr: "الأشياء",
    categoryFr: "Objets",
    summary: "The date-palm trunk cried when the Prophet ﷺ moved to the new pulpit.",
    summaryAr: "حنّ جذع النخلة عندما انتقل النبي ﷺ إلى المنبر الجديد.",
    summaryFr: "Le tronc de palmier gémit lorsque le Prophète ﷺ passa à la nouvelle chaire (minbar).",
    source: "Sahih al-Bukhari 3584",
    sourceAr: "صحيح البخاري، الحديث ٣٥٨٤",
    sourceFr: "Sahih al-Bukhari 3584",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    seerahPeriodAr: "العهد المدني",
    seerahPeriodFr: "Période médinoise",
    keyLesson: "Even objects longed for the remembrance of Allah near the Prophet ﷺ.",
    keyLessonAr: "حتى الجمادات اشتاقت لذكر الله قرب النبي ﷺ.",
    keyLessonFr: "Même les objets aspiraient au rappel d'Allah auprès du Prophète ﷺ.",
    tags: ["Objects", "Sahih al-Bukhari"],
    displayPriority: true,
    verificationStatus: "verified",
    section: "objects",
  },
  {
    id: 16,
    title: "Food glorifying Allah",
    titleAr: "تسبيح الطعام",
    titleFr: "La nourriture glorifiant Allah",
    category: "Objects / Food",
    categoryAr: "الأشياء / الطعام",
    categoryFr: "Objets / Nourriture",
    summary: "The companions heard food glorifying Allah while it was being eaten.",
    summaryAr: "سمع الصحابة تسبيح الطعام وهم يأكلونه.",
    summaryFr: "Les compagnons entendirent la nourriture glorifier Allah tandis qu'ils la mangeaient.",
    source: "Sahih al-Bukhari 3579",
    sourceAr: "صحيح البخاري، الحديث ٣٥٧٩",
    sourceFr: "Sahih al-Bukhari 3579",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    seerahPeriodAr: "العهد المدني",
    seerahPeriodFr: "Période médinoise",
    keyLesson: "Allah allows His creation to glorify Him in ways beyond our normal perception.",
    keyLessonAr: "يُسبّح لله ما في السماوات والأرض بطرق تفوق إدراكنا المعتاد.",
    keyLessonFr: "Allah permet à Sa création de Le glorifier d'une manière qui dépasse notre perception habituelle.",
    tags: ["Objects", "Food", "Sahih al-Bukhari"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "objects",
  },
  {
    id: 17,
    title: "Two companions guided by lights",
    titleAr: "نور يهدي صحابيين في الظلام",
    titleFr: "Deux compagnons guidés par des lumières",
    category: "Signs for Companions",
    categoryAr: "آيات للصحابة",
    categoryFr: "Signes pour les Compagnons",
    summary: "Two companions left the Prophet ﷺ on a dark night and were guided by lights until each reached home.",
    summaryAr: "خرج صحابيان من عند النبي ﷺ في ليلة مظلمة، فأضاء لهما نور حتى وصل كل منهما إلى بيته.",
    summaryFr: "Deux compagnons quittèrent le Prophète ﷺ par une nuit sombre et furent guidés par des lumières jusqu'à ce que chacun arrive chez lui.",
    source: "Sahih al-Bukhari 465",
    sourceAr: "صحيح البخاري، الحديث ٤٦٥",
    sourceFr: "Sahih al-Bukhari 465",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    seerahPeriodAr: "العهد المدني",
    seerahPeriodFr: "Période médinoise",
    keyLesson: "Allah honored and aided the companions.",
    keyLessonAr: "أكرم الله الصحابة وأعانهم.",
    keyLessonFr: "Allah honora et aida les compagnons.",
    tags: ["Objects", "Sahih al-Bukhari"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "objects",
  },
  {
    id: 18,
    title: "Mount Uhud shook",
    titleAr: "اهتزاز جبل أُحُد",
    titleFr: "Le mont Uhud trembla",
    category: "Places",
    categoryAr: "الأماكن",
    categoryFr: "Lieux",
    summary: "Uhud shook while the Prophet ﷺ, Abu Bakr, Umar, and Uthman رضي الله عنهم were on it, and the Prophet ﷺ told it to be firm.",
    summaryAr: "اهتز جبل أُحُد وعليه النبي ﷺ وأبو بكر وعمر وعثمان رضي الله عنهم، فقال له النبي ﷺ اثبت.",
    summaryFr: "Uhud trembla alors que le Prophète ﷺ, Abu Bakr, Umar et Uthman رضي الله عنهم s'y trouvaient ; le Prophète ﷺ lui dit de rester ferme.",
    source: "Sahih al-Bukhari 3675",
    sourceAr: "صحيح البخاري، الحديث ٣٦٧٥",
    sourceFr: "Sahih al-Bukhari 3675",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    seerahPeriodAr: "العهد المدني",
    seerahPeriodFr: "Période médinoise",
    keyLesson: "This narration also indicated the future martyrdom of Umar and Uthman رضي الله عنهما.",
    keyLessonAr: "أشارت هذه الرواية أيضًا إلى استشهاد عمر وعثمان رضي الله عنهما لاحقًا.",
    keyLessonFr: "Cette narration indiquait aussi le futur martyre d'Umar et d'Uthman رضي الله عنهما.",
    tags: ["Places", "Prophetic Knowledge", "Sahih al-Bukhari"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "objects",
  },
  {
    id: 19,
    title: "Uhud loves us and we love it",
    titleAr: "أُحُد جبل يحبنا ونحبه",
    titleFr: "Uhud nous aime et nous l'aimons",
    category: "Places",
    categoryAr: "الأماكن",
    categoryFr: "Lieux",
    summary: "The Prophet ﷺ said that Uhud is a mountain that loves the believers and is loved by them.",
    summaryAr: "قال النبي ﷺ إن أُحُد جبل يحب المؤمنين ويحبونه.",
    summaryFr: "Le Prophète ﷺ dit qu'Uhud est une montagne qui aime les croyants et qu'ils aiment.",
    source: "Sahih al-Bukhari 4084",
    sourceAr: "صحيح البخاري، الحديث ٤٠٨٤",
    sourceFr: "Sahih al-Bukhari 4084",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    seerahPeriodAr: "العهد المدني",
    seerahPeriodFr: "Période médinoise",
    keyLesson: "Certain places connected to faith carry special honor.",
    keyLessonAr: "لبعض الأماكن المرتبطة بالإيمان مكانة خاصة.",
    keyLessonFr: "Certains lieux liés à la foi portent un honneur particulier.",
    tags: ["Places", "Sahih al-Bukhari"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "objects",
  },
  {
    id: 20,
    title: "Suraqah's horse sank during the Hijrah pursuit",
    titleAr: "غوص فرس سراقة أثناء مطاردة الهجرة",
    titleFr: "Le cheval de Suraqah s'enfonça durant la poursuite de l'Hijra",
    category: "Protection",
    categoryAr: "الحماية",
    categoryFr: "Protection",
    summary: "Suraqah pursued the Prophet ﷺ during the Hijrah, and his horse's forelegs sank until he asked for safety.",
    summaryAr: "تتبّع سراقة النبي ﷺ أثناء الهجرة، فغاصت قوائم فرسه في الأرض حتى طلب الأمان.",
    summaryFr: "Suraqah poursuivit le Prophète ﷺ durant l'Hijra ; les antérieurs de son cheval s'enfoncèrent jusqu'à ce qu'il demande la sécurité.",
    source: "Sahih al-Bukhari, Suraqah narration",
    sourceAr: "صحيح البخاري، رواية سراقة",
    sourceFr: "Sahih al-Bukhari, narration de Suraqah",
    authenticity: "Sahih",
    seerahPeriod: "Hijrah",
    seerahPeriodAr: "الهجرة",
    seerahPeriodFr: "Hijra",
    keyLesson: "Allah protected His Messenger ﷺ during migration.",
    keyLessonAr: "حفظ الله رسوله ﷺ أثناء هجرته.",
    keyLessonFr: "Allah protégea Son Messager ﷺ durant l'émigration.",
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
    titleFr: "Guérison des yeux d'Ali رضي الله عنه à Khaybar",
    category: "Healing",
    categoryAr: "الشفاء",
    categoryFr: "Guérison",
    summary: "Ali رضي الله عنه had eye trouble, and the Prophet ﷺ applied saliva and supplicated for him, and he was cured.",
    summaryAr: "اشتكى علي رضي الله عنه من عينيه، فتفل النبي ﷺ فيهما ودعا له، فشُفي.",
    summaryFr: "Ali رضي الله عنه souffrait des yeux ; le Prophète ﷺ y appliqua sa salive, invoqua pour lui, et il fut guéri.",
    source: "Sahih al-Bukhari 3009",
    sourceAr: "صحيح البخاري، الحديث ٣٠٠٩",
    sourceFr: "Sahih al-Bukhari 3009",
    authenticity: "Sahih",
    seerahPeriod: "Khaybar",
    seerahPeriodAr: "غزوة خيبر",
    seerahPeriodFr: "Khaybar",
    keyLesson: "Allah granted healing through the Prophet's ﷺ supplication and touch.",
    keyLessonAr: "منح الله الشفاء بدعاء النبي ﷺ ولمسه.",
    keyLessonFr: "Allah accorda la guérison par l'invocation et le toucher du Prophète ﷺ.",
    tags: ["Healing", "Sahih al-Bukhari"],
    displayPriority: true,
    verificationStatus: "verified",
    section: "knowledge",
  },
  {
    id: 22,
    title: "Abu Hurairah's memory strengthened",
    titleAr: "تقوية حفظ أبي هريرة",
    titleFr: "La mémoire d'Abu Hurairah renforcée",
    category: "Prophetic Supplication / Knowledge",
    categoryAr: "الدعاء النبوي / العلم",
    categoryFr: "Invocation prophétique / Savoir",
    summary: "Abu Hurairah رضي الله عنه complained of forgetting hadith, and after the Prophet's ﷺ instruction, he said he never forgot.",
    summaryAr: "اشتكى أبو هريرة رضي الله عنه من نسيان الحديث، فأرشده النبي ﷺ، فقال إنه لم ينسَ بعدها شيئًا.",
    summaryFr: "Abu Hurairah رضي الله عنه se plaignait d'oublier les hadiths ; après l'instruction du Prophète ﷺ, il dit qu'il n'oublia plus jamais.",
    source: "Sahih al-Bukhari 3648",
    sourceAr: "صحيح البخاري، الحديث ٣٦٤٨",
    sourceFr: "Sahih al-Bukhari 3648",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    seerahPeriodAr: "العهد المدني",
    seerahPeriodFr: "Période médinoise",
    keyLesson: "Allah preserved knowledge through the companions.",
    keyLessonAr: "حفظ الله العلم عن طريق الصحابة.",
    keyLessonFr: "Allah préserva le savoir à travers les compagnons.",
    tags: ["Prophetic Knowledge", "Sahih al-Bukhari"],
    displayPriority: true,
    verificationStatus: "verified",
    section: "knowledge",
  },
  {
    id: 23,
    title: "Supplication for Ibn Abbas رضي الله عنهما",
    titleAr: "دعاء النبي ﷺ لابن عباس رضي الله عنهما",
    titleFr: "Invocation pour Ibn Abbas رضي الله عنهما",
    category: "Prophetic Supplication / Knowledge",
    categoryAr: "الدعاء النبوي / العلم",
    categoryFr: "Invocation prophétique / Savoir",
    summary: "The Prophet ﷺ supplicated for Ibn Abbas رضي الله عنهما to be taught wisdom and understanding of the Qur'an.",
    summaryAr: "دعا النبي ﷺ لابن عباس رضي الله عنهما أن يُعلَّم الحكمة وتأويل القرآن.",
    summaryFr: "Le Prophète ﷺ invoqua pour Ibn Abbas رضي الله عنهما qu'il lui soit enseigné la sagesse et la compréhension du Coran.",
    source: "Sahih al-Bukhari 3756",
    sourceAr: "صحيح البخاري، الحديث ٣٧٥٦",
    sourceFr: "Sahih al-Bukhari 3756",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    seerahPeriodAr: "العهد المدني",
    seerahPeriodFr: "Période médinoise",
    keyLesson: "Knowledge is a gift from Allah.",
    keyLessonAr: "العلم هبة من الله تعالى.",
    keyLessonFr: "Le savoir est un don d'Allah.",
    tags: ["Prophetic Knowledge", "Sahih al-Bukhari"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "knowledge",
  },
  {
    id: 24,
    title: "Prophecy of Umar and Uthman's martyrdom",
    titleAr: "نبوءة استشهاد عمر وعثمان",
    titleFr: "Prophétie du martyre d'Umar et d'Uthman",
    category: "Prophetic Knowledge",
    categoryAr: "العلم النبوي",
    categoryFr: "Savoir prophétique",
    summary: "When Uhud shook, the Prophet ﷺ said that upon it were a Prophet, a Siddiq, and two martyrs.",
    summaryAr: "لما اهتز أُحُد، قال النبي ﷺ إن عليه نبيًا وصدّيقًا وشهيدين.",
    summaryFr: "Lorsque Uhud trembla, le Prophète ﷺ dit qu'il y avait sur lui un Prophète, un Siddiq et deux martyrs.",
    source: "Sahih al-Bukhari 3675",
    sourceAr: "صحيح البخاري، الحديث ٣٦٧٥",
    sourceFr: "Sahih al-Bukhari 3675",
    authenticity: "Sahih",
    seerahPeriod: "Madinan period",
    seerahPeriodAr: "العهد المدني",
    seerahPeriodFr: "Période médinoise",
    keyLesson: "Allah informed His Messenger ﷺ of future events.",
    keyLessonAr: "أخبر الله رسوله ﷺ بأمور مستقبلية.",
    keyLessonFr: "Allah informa Son Messager ﷺ d'événements futurs.",
    tags: ["Prophetic Knowledge", "Sahih al-Bukhari"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "knowledge",
  },
  {
    id: 25,
    title: "The conquest of Makkah",
    titleAr: "فتح مكة",
    titleFr: "La conquête de La Mecque",
    category: "Fulfilled Sign",
    categoryAr: "آية تحققت",
    categoryFr: "Signe accompli",
    summary: "Allah fulfilled His promise and allowed the Prophet ﷺ to return to Makkah in victory.",
    summaryAr: "أوفى الله بوعده وأعاد النبي ﷺ إلى مكة فاتحًا.",
    summaryFr: "Allah tint Sa promesse et permit au Prophète ﷺ de revenir à La Mecque en vainqueur.",
    source: "Qur'an 48:27; Seerah event",
    sourceAr: "القرآن الكريم، سورة الفتح: ٢٧؛ حدث من السيرة",
    sourceFr: "Coran 48:27 ; événement de la Sîra",
    authenticity: "Qur'an",
    seerahPeriod: "8 AH",
    seerahPeriodAr: "السنة الثامنة للهجرة",
    seerahPeriodFr: "8 AH",
    keyLesson: "Allah's promise comes true even after years of hardship.",
    keyLessonAr: "يتحقق وعد الله ولو بعد سنوات من الشدة.",
    keyLessonFr: "La promesse d'Allah se réalise même après des années d'épreuve.",
    tags: ["Prophetic Knowledge", "Qur'an", "Qur'anic Evidence"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "knowledge",
  },
  {
    id: 26,
    title: "The spread of Islam through delegations",
    titleAr: "انتشار الإسلام عبر الوفود",
    titleFr: "La propagation de l'islam par les délégations",
    category: "Fulfilled Sign",
    categoryAr: "آية تحققت",
    categoryFr: "Signe accompli",
    summary: "Tribes came to Madinah in large numbers after the conquest and after Islam became established.",
    summaryAr: "توافدت القبائل إلى المدينة بأعداد كبيرة بعد الفتح واستقرار الإسلام.",
    summaryFr: "Les tribus vinrent à Médine en grand nombre après la conquête et l'établissement de l'islam.",
    source: "Qur'an 110:1-3; Seerah event",
    sourceAr: "القرآن الكريم، سورة النصر: ١-٣؛ حدث من السيرة",
    sourceFr: "Coran 110:1-3 ; événement de la Sîra",
    authenticity: "Qur'an",
    seerahPeriod: "9 AH",
    seerahPeriodAr: "السنة التاسعة للهجرة",
    seerahPeriodFr: "9 AH",
    keyLesson: "Victory belongs to Allah and should lead to praise and repentance.",
    keyLessonAr: "النصر من عند الله، وينبغي أن يقود إلى التسبيح والاستغفار.",
    keyLessonFr: "La victoire appartient à Allah et doit mener à la louange et au repentir.",
    tags: ["Prophetic Knowledge", "Qur'an", "Qur'anic Evidence"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "knowledge",
  },
  {
    id: 27,
    title: "Letters to rulers",
    titleAr: "الرسائل إلى الملوك",
    titleFr: "Lettres aux souverains",
    category: "Prophetic Mission",
    categoryAr: "الرسالة النبوية",
    categoryFr: "Mission prophétique",
    summary: "The Prophet ﷺ sent letters to rulers beyond Arabia, showing the universal nature of his message.",
    summaryAr: "أرسل النبي ﷺ رسائل إلى ملوك خارج الجزيرة العربية، مما يظهر عالمية رسالته.",
    summaryFr: "Le Prophète ﷺ envoya des lettres à des souverains hors d'Arabie, montrant le caractère universel de son message.",
    source: "Sahih al-Bukhari 7 and Seerah reports",
    sourceAr: "صحيح البخاري، الحديث ٧، وروايات من السيرة",
    sourceFr: "Sahih al-Bukhari 7 et rapports de la Sîra",
    authenticity: "Sahih",
    seerahPeriod: "6-7 AH",
    seerahPeriodAr: "السنة السادسة والسابعة للهجرة",
    seerahPeriodFr: "6-7 AH",
    keyLesson: "The message of Islam was not tribal or local; it was universal.",
    keyLessonAr: "رسالة الإسلام لم تكن قبلية أو محلية، بل كانت عالمية.",
    keyLessonFr: "Le message de l'islam n'était ni tribal ni local ; il était universel.",
    tags: ["Prophetic Knowledge", "Sahih al-Bukhari"],
    displayPriority: false,
    verificationStatus: "verified",
    section: "knowledge",
  },
  {
    id: 28,
    title: "Protection in the cave during Hijrah",
    titleAr: "الحماية في الغار أثناء الهجرة",
    titleFr: "Protection dans la grotte durant l'Hijra",
    category: "Protection",
    categoryAr: "الحماية",
    categoryFr: "Protection",
    summary: "The Qur'an mentions Allah supporting the Prophet ﷺ when he was with his companion in the cave.",
    summaryAr: "يذكر القرآن تأييد الله للنبي ﷺ حين كان مع صاحبه في الغار.",
    summaryFr: "Le Coran mentionne qu'Allah soutint le Prophète ﷺ lorsqu'il était avec son compagnon dans la grotte.",
    source: "Qur'an 9:40",
    sourceAr: "القرآن الكريم، سورة التوبة: ٤٠",
    sourceFr: "Coran 9:40",
    authenticity: "Qur'an",
    seerahPeriod: "Hijrah",
    seerahPeriodAr: "الهجرة",
    seerahPeriodFr: "Hijra",
    keyLesson: "Allah's help is greater than visible means.",
    keyLessonAr: "نصر الله أعظم من الأسباب الظاهرة.",
    keyLessonFr: "Le secours d'Allah est plus grand que les moyens visibles.",
    tags: ["Qur'an", "Qur'anic Evidence"],
    displayPriority: true,
    verificationStatus: "verified",
    section: "knowledge",
  },
  {
    id: 29,
    title: "Victory at Badr",
    titleAr: "النصر في غزوة بدر",
    titleFr: "Victoire à Badr",
    category: "Divine Support",
    categoryAr: "التأييد الإلهي",
    categoryFr: "Soutien divin",
    summary: "Allah supported the believers at Badr when they were few.",
    summaryAr: "أيّد الله المؤمنين في بدر وهم قلة.",
    summaryFr: "Allah soutint les croyants à Badr alors qu'ils étaient peu nombreux.",
    source: "Qur'an 3:123-125; Seerah event",
    sourceAr: "القرآن الكريم، سورة آل عمران: ١٢٣-١٢٥؛ حدث من السيرة",
    sourceFr: "Coran 3:123-125 ; événement de la Sîra",
    authenticity: "Qur'an",
    seerahPeriod: "2 AH",
    seerahPeriodAr: "السنة الثانية للهجرة",
    seerahPeriodFr: "2 AH",
    keyLesson: "Victory comes from Allah, not numbers.",
    keyLessonAr: "النصر من عند الله لا بكثرة العدد.",
    keyLessonFr: "La victoire vient d'Allah, non du nombre.",
    tags: ["Qur'an", "Qur'anic Evidence"],
    displayPriority: true,
    verificationStatus: "verified",
    section: "knowledge",
  },
  {
    id: 30,
    title: "Calmness during danger",
    titleAr: "الطمأنينة وقت الخطر",
    titleFr: "Le calme face au danger",
    category: "Protection / Trust",
    categoryAr: "الحماية / التوكل",
    categoryFr: "Protection / Confiance",
    summary: "During the Hijrah, the Prophet ﷺ remained calm and trusted Allah while Quraysh searched for him.",
    summaryAr: "أثناء الهجرة، بقي النبي ﷺ هادئًا متوكلًا على الله بينما كانت قريش تبحث عنه.",
    summaryFr: "Durant l'Hijra, le Prophète ﷺ resta calme et confiant en Allah tandis que Quraysh le cherchait.",
    source: "Qur'an 9:40; Sahih Hijrah narrations",
    sourceAr: "القرآن الكريم، سورة التوبة: ٤٠؛ روايات صحيحة عن الهجرة",
    sourceFr: "Coran 9:40 ; narrations authentiques sur l'Hijra",
    authenticity: "Qur'an",
    seerahPeriod: "Hijrah",
    seerahPeriodAr: "الهجرة",
    seerahPeriodFr: "Hijra",
    keyLesson: "Tawakkul is strongest when danger is closest.",
    keyLessonAr: "التوكل يكون أقوى حين يشتد الخطر.",
    keyLessonFr: "Le tawakkul est le plus fort quand le danger est le plus proche.",
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

const CATEGORY_LABELS_FR: Record<string, string> = {
  "All": "Tout",
  "Qur'an": "Coran",
  "Cosmic Signs": "Signes cosmiques",
  "Isra and Mi'raj": "Isra et Mi'raj",
  "Water": "Eau",
  "Food": "Nourriture",
  "Healing": "Guérison",
  "Objects": "Objets",
  "Animals": "Animaux",
  "Places": "Lieux",
  "Prophetic Knowledge": "Savoir prophétique",
  "Sahih al-Bukhari": "Sahih al-Bukhari",
  "Sahih Muslim": "Sahih Muslim",
  "Qur'anic Evidence": "Preuve coranique",
};

const AUTHENTICITY_LABELS_AR: Record<string, string> = {
  "Qur'an": "القرآن الكريم",
  "Sahih": "صحيح",
  "Authentic Report": "رواية صحيحة",
  "Needs Scholar Review": "يحتاج مراجعة علمية",
};

const AUTHENTICITY_LABELS_FR: Record<string, string> = {
  "Qur'an": "Coran",
  "Sahih": "Sahih",
  "Authentic Report": "Rapport authentique",
  "Needs Scholar Review": "Nécessite une révision savante",
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
        loc(lang, miracle.title, miracle.titleAr, miracle.titleFr).toLowerCase().includes(query) ||
        loc(lang, miracle.category, miracle.categoryAr, miracle.categoryFr).toLowerCase().includes(query) ||
        loc(lang, miracle.summary, miracle.summaryAr, miracle.summaryFr).toLowerCase().includes(query) ||
        loc(lang, miracle.source, miracle.sourceAr, miracle.sourceFr).toLowerCase().includes(query) ||
        loc(lang, miracle.keyLesson, miracle.keyLessonAr, miracle.keyLessonFr).toLowerCase().includes(query)
      );
    }

    return miracles;
  }, [searchQuery, selectedCategory, verifiedMiracles, lang]);

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
          {loc(lang, "Back to Reference Library", "العودة إلى مكتبة المراجع", "Retour à la bibliothèque de référence")}
        </Link>

        {/* Page header */}
        <div className="mb-8">
          <p className="text-sm text-gold font-medium mb-3 uppercase tracking-wide">
            {loc(lang, "Reference Library", "مكتبة المراجع", "Bibliothèque de référence")}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-text mb-4">
            {loc(lang, "Miracles and Signs", "المعجزات والآيات", "Miracles et signes")}
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed max-w-3xl mb-6">
            {loc(
              lang,
              "Verified narrations of miracles and signs granted to the Prophet ﷺ.",
              "روايات موثقة من معجزات وآيات النبي ﷺ.",
              "Récits vérifiés de miracles et de signes accordés au Prophète ﷺ."
            )}
          </p>

          {/* Verification note */}
          <div className="flex gap-3 p-4 rounded-xl bg-surface border border-border/50">
            <Info className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-text-secondary leading-relaxed">
                {loc(
                  lang,
                  "This section prioritizes narrations from the Qur'an, Sahih al-Bukhari, Sahih Muslim, and reports graded authentic by recognized scholars. Popular stories without strong verification are not included here.",
                  "تُعطي هذه الصفحة الأولوية للروايات الواردة في القرآن الكريم وصحيح البخاري وصحيح مسلم، والتقارير التي صنّفها العلماء المعتبرون بأنها صحيحة. لا تُدرج هنا القصص الشائعة التي تفتقر إلى توثيق قوي.",
                  "Cette section priorise les récits du Coran, de Sahih al-Bukhari, de Sahih Muslim, et les rapports jugés authentiques par des savants reconnus. Les histoires populaires sans vérification solide n'y figurent pas."
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-2xl font-bold text-gold">{quranCount}</p>
            <p className="text-xs text-text-secondary mt-1">
              {loc(lang, "Qur'anic references", "الإشارات القرآنية", "Références coraniques")}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-2xl font-bold text-gold">{sahihBukhariCount}</p>
            <p className="text-xs text-text-secondary mt-1">
              {loc(lang, "From Sahih al-Bukhari", "من صحيح البخاري", "Issus de Sahih al-Bukhari")}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-2xl font-bold text-gold">{totalCount}+</p>
            <p className="text-xs text-text-secondary mt-1">
              {loc(lang, "Verified signs included", "الآيات الموثقة المدرجة", "Signes vérifiés inclus")}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-2xl font-bold text-gold">100%</p>
            <p className="text-xs text-text-secondary mt-1">
              {loc(lang, "Sources shown", "المصادر الموضحة", "Sources indiquées")}
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
                "Search miracles, signs, sources, or lessons…",
                "ابحث عن المعجزات أو الآيات أو المصادر أو الدروس…",
                "Rechercher miracles, signes, sources ou leçons…"
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
                {loc(lang, category, CATEGORY_LABELS_AR[category], CATEGORY_LABELS_FR[category])}
              </button>
            );
          })}
        </div>

        {/* Miracles grid */}
        {filteredMiracles.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-text-muted">
              {loc(
                lang,
                "No miracles match your search or filter.",
                "لا توجد معجزات مطابقة لبحثك أو التصفية.",
                "Aucun miracle ne correspond à votre recherche ou filtre."
              )}
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
                          {loc(lang, miracle.title, miracle.titleAr, miracle.titleFr)}
                        </h3>
                        <p className="text-xs text-text-muted mt-0.5">
                          {loc(lang, miracle.category, miracle.categoryAr, miracle.categoryFr)}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-text-secondary leading-relaxed mb-3">
                      {loc(lang, miracle.summary, miracle.summaryAr, miracle.summaryFr)}
                    </p>

                    <div className="space-y-2 mb-3 pt-3 border-t border-border">
                      <div>
                        <p className="text-xs font-medium text-text-muted mb-1">
                          {loc(lang, "Source:", "المصدر:", "Source :")}
                        </p>
                        <p className="text-xs text-text-secondary leading-relaxed">
                          {loc(lang, miracle.source, miracle.sourceAr, miracle.sourceFr)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-text-muted mb-1">
                          {loc(lang, "Key Lesson:", "الدرس المستفاد:", "Leçon clé :")}
                        </p>
                        <p className="text-xs text-text-secondary leading-relaxed">
                          {loc(lang, miracle.keyLesson, miracle.keyLessonAr, miracle.keyLessonFr)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded border text-xs font-medium ${getAuthenticityBadge(
                          miracle.authenticity
                        )}`}
                      >
                        {loc(
                          lang,
                          miracle.authenticity,
                          AUTHENTICITY_LABELS_AR[miracle.authenticity],
                          AUTHENTICITY_LABELS_FR[miracle.authenticity]
                        )}
                      </span>
                      <span className="px-2 py-1 rounded border text-xs font-medium bg-surface-raised text-text-muted border-border/50">
                        {loc(lang, miracle.seerahPeriod, miracle.seerahPeriodAr, miracle.seerahPeriodFr)}
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
                    ? loc(lang, "Show Less", "عرض أقل", "Afficher moins")
                    : loc(
                        lang,
                        `View All ${filteredMiracles.length} Miracles and Signs`,
                        `عرض كل ${filteredMiracles.length} من المعجزات والآيات`,
                        `Voir les ${filteredMiracles.length} miracles et signes`
                      )}
                </button>
              </div>
            )}
          </>
        )}

        {/* Excluded/Needs Verification section */}
        <div className="mt-16 pt-8 border-t border-border">
          <div className="p-6 rounded-xl bg-surface/50 border border-border/50">
            <h2 className="text-lg font-semibold text-text mb-3">
              {loc(
                lang,
                "Popular Stories That Need Verification",
                "قصص شائعة تحتاج إلى توثيق",
                "Histoires populaires nécessitant une vérification"
              )}
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              {loc(
                lang,
                "Some miracle stories are popular in lectures and children's books, but this section does not include them unless a reliable source and authenticity grading are added. Examples include: the spider web over the cave, the dove/nest story, the Prophet ﷺ casting no shadow, clouds constantly shading him, and overly detailed birth miracles — unless verified with grading and source.",
                "بعض قصص المعجزات منتشرة في المحاضرات وكتب الأطفال، لكن هذه الصفحة لا تُدرجها إلا إذا توفر مصدر موثوق وتصنيف لدرجة صحتها. من الأمثلة على ذلك: قصة نسج العنكبوت على باب الغار، وقصة الحمامة وعشّها، وأن النبي ﷺ لم يكن له ظل، وأن الغيوم كانت تظلله باستمرار، وتفاصيل مبالغ فيها عن معجزات الولادة — ما لم تُوثَّق بمصدر ودرجة صحة.",
                "Certaines histoires de miracles sont populaires dans les conférences et les livres pour enfants, mais cette section ne les inclut pas sans source fiable et classement d'authenticité. Exemples : la toile d'araignée sur la grotte, l'histoire de la colombe et du nid, le Prophète ﷺ sans ombre, les nuages qui l'ombragent constamment, et des miracles de naissance trop détaillés — sauf vérification avec source et classement."
              )}
            </p>
            <p className="text-xs text-text-muted">
              {loc(
                lang,
                "This approach keeps the reference accurate and trustworthy.",
                "هذا النهج يحافظ على دقة هذا المرجع وموثوقيته.",
                "Cette approche garde la référence exacte et digne de confiance."
              )}
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 pt-8 border-t border-border">
          <div className="p-6 rounded-2xl bg-surface border border-border text-center">
            <h2 className="text-lg font-semibold text-text mb-2">
              {loc(
                lang,
                "Continue Learning the Seerah",
                "واصل تعلّم السيرة النبوية",
                "Continuer l'étude de la Sîra"
              )}
            </h2>
            <p className="text-sm text-text-secondary mb-4">
              {loc(
                lang,
                "Go back to the full Seerah course to study the context and details of these miracles and signs.",
                "عد إلى دورة السيرة الكاملة لدراسة سياق وتفاصيل هذه المعجزات والآيات.",
                "Retournez au cours complet de Sîra pour étudier le contexte et les détails de ces miracles et signes."
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
