"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Info, ChevronDown, ChevronRight } from "lucide-react";
import type { CourseLang } from "@/lib/course-lang";

// ── Lineage Chain ──────────────────────────────────────────────────────────────

const LINEAGE_CHAIN = [
  { name: "Muhammad ﷺ", label: "Prophet ﷺ", labelAr: "النبي محمد ﷺ" },
  { name: "Abdullah", label: "Abdullah", labelAr: "عبد الله" },
  { name: "Abd al-Muttalib", label: "Abd al-Muttalib", labelAr: "عبد المطلب" },
  { name: "Hashim", label: "Hashim (Banu Hashim)", labelAr: "هاشم (بنو هاشم)" },
  { name: "Abd Manaf", label: "Abd Manaf", labelAr: "عبد مناف" },
  { name: "Qusayy", label: "Qusayy", labelAr: "قصي" },
  { name: "Kilab", label: "Kilab", labelAr: "كلاب" },
  { name: "Murrah", label: "Murrah", labelAr: "مرة" },
  { name: "Ka'b", label: "Ka'b", labelAr: "كعب" },
  { name: "Lu'ayy", label: "Lu'ayy", labelAr: "لؤي" },
  { name: "Ghalib", label: "Ghalib", labelAr: "غالب" },
  { name: "Fihr (Quraysh)", label: "Fihr (Quraysh)", labelAr: "فهر (قريش)" },
  { name: "Malik", label: "Malik", labelAr: "مالك" },
  { name: "al-Nadr", label: "al-Nadr", labelAr: "النضر" },
  { name: "Kinanah", label: "Kinanah", labelAr: "كنانة" },
  { name: "Khuzaymah", label: "Khuzaymah", labelAr: "خزيمة" },
  { name: "Mudrikah", label: "Mudrikah", labelAr: "مدركة" },
  { name: "Ilyas", label: "Ilyas", labelAr: "إلياس" },
  { name: "Mudar", label: "Mudar", labelAr: "مضر" },
  { name: "Nizar", label: "Nizar", labelAr: "نزار" },
  { name: "Ma'add", label: "Ma'add", labelAr: "معد" },
  { name: "Adnan", label: "Adnan", labelAr: "عدنان" },
  { name: "Traditionally connected to Isma'il عليه السلام", label: "→ Isma'il عليه السلام", labelAr: "← إسماعيل عليه السلام" },
  { name: "Son of Ibrahim عليه السلام", label: "→ Ibrahim عليه السلام", labelAr: "← إبراهيم عليه السلام" },
];

// ── Tribal Data ────────────────────────────────────────────────────────────────

interface Tribe {
  name: string;
  nameAr: string;
  type: string;
  typeAr: string;
  connection: string;
  connectionAr: string;
  description: string;
  descriptionAr: string;
  category: string;
}

const QURAYSH_CLANS: Tribe[] = [
  { name: "Banu Hashim", nameAr: "بنو هاشم", type: "Clan of Quraysh", typeAr: "بطن من قريش", connection: "Clan of the Prophet ﷺ", connectionAr: "عشيرة النبي ﷺ", description: "The Prophet ﷺ belonged to Banu Hashim. Abu Talib, Hamzah, al-Abbas, Ali, and Fatimah رضي الله عنهم are connected to this household.", descriptionAr: "كان النبي ﷺ من بني هاشم. ويُنسب إلى هذا البيت أبو طالب وحمزة والعباس وعلي وفاطمة رضي الله عنهم.", category: "Banu Hashim" },
  { name: "Banu al-Muttalib", nameAr: "بنو المطلب", type: "Clan of Quraysh", typeAr: "بطن من قريش", connection: "Close allies of Banu Hashim", connectionAr: "حلفاء مقرّبون لبني هاشم", description: "Closely tied to Banu Hashim and supported them during major moments.", descriptionAr: "كانوا وثيقي الصلة ببني هاشم، ووقفوا معهم في المواقف الكبرى.", category: "Quraysh" },
  { name: "Banu Abd Shams", nameAr: "بنو عبد شمس", type: "Clan of Quraysh", typeAr: "بطن من قريش", connection: "Related Qurayshi branch", connectionAr: "فرع قرشي ذو صلة", description: "A powerful branch of Quraysh connected to major Makkan leaders.", descriptionAr: "فرع قوي من قريش مرتبط بكبار زعماء مكة.", category: "Quraysh" },
  { name: "Banu Umayyah", nameAr: "بنو أمية", type: "Clan of Quraysh", typeAr: "بطن من قريش", connection: "Branch of Abd Shams", connectionAr: "فرع من عبد شمس", description: "The clan of Abu Sufyan, Uthman ibn Affan, Mu'awiyah, and other major figures.", descriptionAr: "عشيرة أبي سفيان وعثمان بن عفان ومعاوية وغيرهم من كبار الشخصيات.", category: "Quraysh" },
  { name: "Banu Nawfal", nameAr: "بنو نوفل", type: "Clan of Quraysh", typeAr: "بطن من قريش", connection: "Qurayshi clan", connectionAr: "بطن قرشي", description: "One of the clans of Quraysh with social and political influence.", descriptionAr: "إحدى بطون قريش ذات نفوذ اجتماعي وسياسي.", category: "Quraysh" },
  { name: "Banu Zuhrah", nameAr: "بنو زهرة", type: "Clan of Quraysh", typeAr: "بطن من قريش", connection: "Maternal connection", connectionAr: "صلة عبر الأم", description: "The clan of Aminah bint Wahb, the mother of the Prophet ﷺ.", descriptionAr: "عشيرة آمنة بنت وهب، والدة النبي ﷺ.", category: "Quraysh" },
  { name: "Banu Makhzum", nameAr: "بنو مخزوم", type: "Clan of Quraysh", typeAr: "بطن من قريش", connection: "Major Makkan power clan", connectionAr: "عشيرة مكية كبرى", description: "The clan of Abu Jahl and Khalid ibn al-Walid. It was influential in Makkan opposition and later Islamic history.", descriptionAr: "عشيرة أبي جهل وخالد بن الوليد، وكانت ذات تأثير في معارضة مكة وفي التاريخ الإسلامي لاحقًا.", category: "Quraysh" },
  { name: "Banu Taym", nameAr: "بنو تيم", type: "Clan of Quraysh", typeAr: "بطن من قريش", connection: "Clan of Abu Bakr", connectionAr: "عشيرة أبي بكر", description: "The clan of Abu Bakr al-Siddiq رضي الله عنه.", descriptionAr: "عشيرة أبي بكر الصديق رضي الله عنه.", category: "Quraysh" },
  { name: "Banu Adi", nameAr: "بنو عدي", type: "Clan of Quraysh", typeAr: "بطن من قريش", connection: "Clan of Umar", connectionAr: "عشيرة عمر", description: "The clan of Umar ibn al-Khattab رضي الله عنه.", descriptionAr: "عشيرة عمر بن الخطاب رضي الله عنه.", category: "Quraysh" },
  { name: "Banu Asad", nameAr: "بنو أسد", type: "Clan of Quraysh", typeAr: "بطن من قريش", connection: "Clan of Khadijah", connectionAr: "عشيرة خديجة", description: "The clan of Khadijah bint Khuwaylid رضي الله عنها.", descriptionAr: "عشيرة خديجة بنت خويلد رضي الله عنها.", category: "Quraysh" },
  { name: "Banu Jumah", nameAr: "بنو جمح", type: "Clan of Quraysh", typeAr: "بطن من قريش", connection: "Clan of Umayyah ibn Khalaf", connectionAr: "عشيرة أمية بن خلف", description: "Connected to some major opponents of the early Muslims.", descriptionAr: "ارتبطت ببعض كبار معارضي المسلمين الأوائل.", category: "Quraysh" },
  { name: "Banu Sahm", nameAr: "بنو سهم", type: "Clan of Quraysh", typeAr: "بطن من قريش", connection: "Qurayshi clan", connectionAr: "بطن قرشي", description: "A clan connected to Makkan society and leadership.", descriptionAr: "بطن مرتبط بمجتمع مكة وقيادتها.", category: "Quraysh" },
  { name: "Banu Amir ibn Lu'ayy", nameAr: "بنو عامر بن لؤي", type: "Clan of Quraysh", typeAr: "بطن من قريش", connection: "Qurayshi clan", connectionAr: "بطن قرشي", description: "Another clan within the wider Quraysh structure.", descriptionAr: "بطن آخر ضمن بنية قريش الأوسع.", category: "Quraysh" },
];

const MADINAH_TRIBES: Tribe[] = [
  { name: "Aws", nameAr: "الأوس", type: "Arab tribe of Madinah", typeAr: "قبيلة عربية من المدينة", connection: "Ansar", connectionAr: "الأنصار", description: "One of the two major Arab tribes of Madinah. Many members supported the Prophet ﷺ after the Hijrah.", descriptionAr: "إحدى القبيلتين العربيتين الكبريين في المدينة. أيّد كثير من أفرادها النبي ﷺ بعد الهجرة.", category: "Ansar" },
  { name: "Khazraj", nameAr: "الخزرج", type: "Arab tribe of Madinah", typeAr: "قبيلة عربية من المدينة", connection: "Ansar", connectionAr: "الأنصار", description: "One of the two major Arab tribes of Madinah. Many early Madinan Muslims came from Khazraj.", descriptionAr: "إحدى القبيلتين العربيتين الكبريين في المدينة. جاء كثير من مسلمي المدينة الأوائل من الخزرج.", category: "Ansar" },
  { name: "Banu Najjar", nameAr: "بنو النجار", type: "Clan of Khazraj", typeAr: "بطن من الخزرج", connection: "Maternal relatives and hosts in Madinah", connectionAr: "أقارب عبر الأم ومستضيفون في المدينة", description: "The Prophet ﷺ had family ties through his mother's side, and Abu Ayyub al-Ansari رضي الله عنه hosted him in Madinah.", descriptionAr: "كانت للنبي ﷺ صلة قرابة معهم من جهة أمه، واستضافه أبو أيوب الأنصاري رضي الله عنه في المدينة.", category: "Ansar" },
  { name: "Banu Sa'idah", nameAr: "بنو ساعدة", type: "Clan of Khazraj", typeAr: "بطن من الخزرج", connection: "Ansar", connectionAr: "الأنصار", description: "Connected to important Ansari leadership and later political events.", descriptionAr: "ارتبطوا بقيادة أنصارية مهمة وبأحداث سياسية لاحقة.", category: "Ansar" },
  { name: "Banu Abdul Ashhal", nameAr: "بنو عبد الأشهل", type: "Clan of Aws", typeAr: "بطن من الأوس", connection: "Ansar", connectionAr: "الأنصار", description: "The clan of Sa'd ibn Mu'adh and Usaid ibn Hudayr رضي الله عنهما.", descriptionAr: "عشيرة سعد بن معاذ وأسيد بن حضير رضي الله عنهما.", category: "Ansar" },
  { name: "Banu Harithah", nameAr: "بنو حارثة", type: "Clan of Aws", typeAr: "بطن من الأوس", connection: "Ansar", connectionAr: "الأنصار", description: "A Madinan clan involved in the events of the Seerah.", descriptionAr: "بطن من المدينة كان له دور في أحداث السيرة.", category: "Ansar" },
  { name: "Banu Salimah", nameAr: "بنو سلمة", type: "Clan of Khazraj", typeAr: "بطن من الخزرج", connection: "Ansar", connectionAr: "الأنصار", description: "A Madinan clan connected to the Ansar and the events around Madinah.", descriptionAr: "بطن من المدينة مرتبط بالأنصار والأحداث حول المدينة.", category: "Ansar" },
  { name: "Banu Qaynuqa", nameAr: "بنو قينقاع", type: "Jewish tribe of Madinah", typeAr: "قبيلة يهودية من المدينة", connection: "Madinan treaty politics", connectionAr: "سياسات المعاهدات في المدينة", description: "One of the Jewish tribes living in Madinah during the Prophet's ﷺ time.", descriptionAr: "إحدى القبائل اليهودية التي عاشت في المدينة في زمن النبي ﷺ.", category: "Jewish Tribes of Madinah" },
  { name: "Banu Nadir", nameAr: "بنو النضير", type: "Jewish tribe of Madinah", typeAr: "قبيلة يهودية من المدينة", connection: "Madinan treaty politics", connectionAr: "سياسات المعاهدات في المدينة", description: "A Jewish tribe involved in major political events in Madinah.", descriptionAr: "قبيلة يهودية شاركت في أحداث سياسية كبرى في المدينة.", category: "Jewish Tribes of Madinah" },
  { name: "Banu Qurayzah", nameAr: "بنو قريظة", type: "Jewish tribe of Madinah", typeAr: "قبيلة يهودية من المدينة", connection: "Madinan treaty politics", connectionAr: "سياسات المعاهدات في المدينة", description: "A Jewish tribe connected to the events after the Battle of the Trench.", descriptionAr: "قبيلة يهودية مرتبطة بالأحداث التي تلت غزوة الخندق.", category: "Jewish Tribes of Madinah" },
];

const OTHER_TRIBES: Tribe[] = [
  { name: "Thaqif", nameAr: "ثقيف", type: "Tribe of Ta'if", typeAr: "قبيلة الطائف", connection: "Ta'if and later Islam", connectionAr: "الطائف ودخولهم الإسلام لاحقًا", description: "The tribe of Ta'if. They opposed the Prophet ﷺ during his visit to Ta'if but later entered Islam.", descriptionAr: "قبيلة الطائف. عارضوا النبي ﷺ خلال زيارته للطائف، ثم دخلوا الإسلام لاحقًا.", category: "Allies" },
  { name: "Hawazin", nameAr: "هوازن", type: "Arab tribal confederation", typeAr: "تحالف قبلي عربي", connection: "Battle of Hunayn", connectionAr: "غزوة حنين", description: "A major tribal group involved in the Battle of Hunayn after the conquest of Makkah.", descriptionAr: "مجموعة قبلية كبرى شاركت في غزوة حنين بعد فتح مكة.", category: "Opponents" },
  { name: "Ghatafan", nameAr: "غطفان", type: "Najdi tribal confederation", typeAr: "تحالف قبلي نجدي", connection: "Battle of the Trench", connectionAr: "غزوة الخندق", description: "One of the groups involved in the coalition against Madinah during the Battle of the Trench.", descriptionAr: "إحدى الجماعات التي شاركت في التحالف ضد المدينة خلال غزوة الخندق.", category: "Opponents" },
  { name: "Banu Sulaym", nameAr: "بنو سليم", type: "Arab tribe", typeAr: "قبيلة عربية", connection: "Arabian tribal politics", connectionAr: "السياسات القبلية في الجزيرة العربية", description: "A tribe involved in the wider political landscape of Arabia.", descriptionAr: "قبيلة كانت جزءًا من المشهد السياسي الأوسع في الجزيرة العربية.", category: "Neighboring Tribes" },
  { name: "Banu Tamim", nameAr: "بنو تميم", type: "Arab tribe", typeAr: "قبيلة عربية", connection: "Delegations to the Prophet ﷺ", connectionAr: "وفود على النبي ﷺ", description: "A major Arab tribe connected to the Year of Delegations.", descriptionAr: "قبيلة عربية كبرى مرتبطة بعام الوفود.", category: "Neighboring Tribes" },
  { name: "Banu Hanifah", nameAr: "بنو حنيفة", type: "Tribe of Yamamah", typeAr: "قبيلة اليمامة", connection: "Musaylimah", connectionAr: "مسيلمة", description: "The tribe connected to Musaylimah al-Kadhdhab, who falsely claimed prophethood.", descriptionAr: "القبيلة المرتبطة بمسيلمة الكذاب، الذي زعم النبوة كذبًا.", category: "Opponents" },
  { name: "Daws", nameAr: "دوس", type: "Yemeni Arab tribe", typeAr: "قبيلة عربية يمنية", connection: "Tribe of Abu Hurairah and al-Tufayl", connectionAr: "قبيلة أبي هريرة والطفيل", description: "The tribe of Abu Hurairah رضي الله عنه and al-Tufayl ibn Amr al-Dawsi رضي الله عنه.", descriptionAr: "قبيلة أبي هريرة رضي الله عنه والطفيل بن عمرو الدوسي رضي الله عنه.", category: "Allies" },
  { name: "Ash'ar", nameAr: "الأشعريون", type: "Yemeni Arab tribe", typeAr: "قبيلة عربية يمنية", connection: "Tribe of Abu Musa", connectionAr: "قبيلة أبي موسى", description: "The tribe of Abu Musa al-Ash'ari رضي الله عنه.", descriptionAr: "قبيلة أبي موسى الأشعري رضي الله عنه.", category: "Allies" },
  { name: "Khuza'ah", nameAr: "خزاعة", type: "Arab tribe near Makkah", typeAr: "قبيلة عربية قرب مكة", connection: "Ally of the Muslims", connectionAr: "حليفة المسلمين", description: "Their alliance and conflict with Banu Bakr helped lead to the conquest of Makkah.", descriptionAr: "أدى تحالفهم وصراعهم مع بني بكر إلى فتح مكة.", category: "Allies" },
  { name: "Banu Bakr", nameAr: "بنو بكر", type: "Arab tribe near Makkah", typeAr: "قبيلة عربية قرب مكة", connection: "Ally of Quraysh", connectionAr: "حليفة قريش", description: "Their attack on Khuza'ah became one of the events leading to the conquest of Makkah.", descriptionAr: "أصبح هجومهم على خزاعة من الأحداث التي أدت إلى فتح مكة.", category: "Opponents" },
  { name: "Ghifar", nameAr: "غفار", type: "Arab tribe", typeAr: "قبيلة عربية", connection: "Tribe of Abu Dharr", connectionAr: "قبيلة أبي ذر", description: "The tribe of Abu Dharr al-Ghifari رضي الله عنه.", descriptionAr: "قبيلة أبي ذر الغفاري رضي الله عنه.", category: "Allies" },
  { name: "Aslam", nameAr: "أسلم", type: "Arab tribe", typeAr: "قبيلة عربية", connection: "Later support for Islam", connectionAr: "دعم الإسلام لاحقًا", description: "A tribe that became connected to the growing Muslim community.", descriptionAr: "قبيلة ارتبطت بالمجتمع المسلم المتنامي.", category: "Allies" },
  { name: "Muzaynah", nameAr: "مزينة", type: "Arab tribe", typeAr: "قبيلة عربية", connection: "Delegations and support", connectionAr: "الوفود والدعم", description: "One of the Arab tribes connected to the Prophet's ﷺ later Madinan period.", descriptionAr: "إحدى القبائل العربية المرتبطة بالفترة المدنية اللاحقة للنبي ﷺ.", category: "Allies" },
  { name: "Juhaynah", nameAr: "جهينة", type: "Arab tribe", typeAr: "قبيلة عربية", connection: "Arabian tribal network", connectionAr: "الشبكة القبلية في الجزيرة العربية", description: "A tribe involved in the broader tribal world around Madinah.", descriptionAr: "قبيلة كانت جزءًا من الشبكة القبلية الأوسع حول المدينة.", category: "Neighboring Tribes" },
  { name: "Lihyan", nameAr: "بنو لحيان", type: "Arab tribe", typeAr: "قبيلة عربية", connection: "Conflict in the Seerah", connectionAr: "صراع في السيرة", description: "Connected to difficult events faced by the Muslims.", descriptionAr: "ارتبطوا بأحداث صعبة واجهها المسلمون.", category: "Opponents" },
  { name: "Banu Mustaliq", nameAr: "بنو المصطلق", type: "Branch of Khuza'ah", typeAr: "فرع من خزاعة", connection: "Campaign of Banu Mustaliq", connectionAr: "غزوة بني المصطلق", description: "Connected to the campaign during the Madinan period.", descriptionAr: "ارتبطوا بالغزوة التي وقعت خلال الفترة المدنية.", category: "Neighboring Tribes" },
  { name: "Tayy", nameAr: "طيّئ", type: "Arab tribe", typeAr: "قبيلة عربية", connection: "Adi ibn Hatim", connectionAr: "عدي بن حاتم", description: "The tribe of Adi ibn Hatim, a former Christian Arab leader who accepted Islam.", descriptionAr: "قبيلة عدي بن حاتم، الزعيم العربي النصراني سابقًا الذي اعتنق الإسلام.", category: "Allies" },
  { name: "Kindah", nameAr: "كندة", type: "Arab tribe", typeAr: "قبيلة عربية", connection: "Arabian delegations", connectionAr: "وفود الجزيرة العربية", description: "A major Arab tribe connected to later delegations and Arabian leadership.", descriptionAr: "قبيلة عربية كبرى مرتبطة بالوفود والقيادة العربية لاحقًا.", category: "Neighboring Tribes" },
  { name: "Azd", nameAr: "الأزد", type: "Yemeni tribal group", typeAr: "مجموعة قبلية يمنية", connection: "Ansar ancestry", connectionAr: "نسب الأنصار", description: "Aws and Khazraj are commonly connected to the larger Azd tribal background.", descriptionAr: "يُنسب الأوس والخزرج غالبًا إلى الأصل القبلي الأكبر للأزد.", category: "Neighboring Tribes" },
  { name: "Kinanah", nameAr: "كنانة", type: "Ancestral tribe", typeAr: "قبيلة من الأجداد", connection: "Ancestors of Quraysh", connectionAr: "أجداد قريش", description: "Quraysh traces upward through Kinanah in the Prophet's ﷺ lineage.", descriptionAr: "يعود نسب قريش إلى الأعلى عبر كنانة في نسب النبي ﷺ.", category: "Prophet's Lineage" },
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

const CATEGORY_LABELS_AR: Record<string, string> = {
  "All": "الكل",
  "Prophet's Lineage": "نسب النبي ﷺ",
  "Quraysh": "قريش",
  "Banu Hashim": "بنو هاشم",
  "Madinah": "المدينة",
  "Ansar": "الأنصار",
  "Jewish Tribes of Madinah": "يهود المدينة",
  "Allies": "الحلفاء",
  "Opponents": "الخصوم",
  "Neighboring Tribes": "القبائل المجاورة",
};

// ── Component ──────────────────────────────────────────────────────────────────

export function TribesLineageContent({ lang = "en" }: { lang?: CourseLang }) {
  const isRtl = lang === "ar";
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
      results = results.filter((t) =>
        isRtl
          ? t.nameAr.toLowerCase().includes(query) ||
            t.typeAr.toLowerCase().includes(query) ||
            t.connectionAr.toLowerCase().includes(query) ||
            t.descriptionAr.toLowerCase().includes(query)
          : t.name.toLowerCase().includes(query) ||
            t.type.toLowerCase().includes(query) ||
            t.connection.toLowerCase().includes(query) ||
            t.description.toLowerCase().includes(query)
      );
    }

    return results;
  }, [searchQuery, selectedCategory, allTribes, isRtl]);

  return (
    <main className="min-h-screen bg-ink py-16" dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* Back link */}
        <Link
          href="/reference"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text transition-colors mb-10"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {isRtl ? "العودة إلى مكتبة المراجع" : "Back to Reference Library"}
        </Link>

        {/* Page header */}
        <div className="mb-12">
          <p className="text-sm text-gold font-medium mb-3 uppercase tracking-wide">
            {isRtl ? "مكتبة المراجع" : "Reference Library"}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-text mb-4">
            {isRtl ? "القبائل والنسب" : "Tribes and Lineage"}
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed mb-6">
            {isRtl
              ? "أبرز القبائل العربية وعلاقاتها، ونسب النبي ﷺ."
              : "The major Arab tribes, their relationships, and the Prophet's ﷺ lineage traced back."}
          </p>
          <p className="text-sm text-text-secondary leading-relaxed">
            {isRtl
              ? "شكّلت القبائل والأنساب في السيرة النبوية الحماية والتحالفات وصلات المصاهرة والتجارة والصراع والهجرة والقيادة. وفهم نسب النبي ﷺ وأهم القبائل حول مكة والمدينة يجعل متابعة أحداث السيرة أسهل بكثير."
              : "In the Seerah, tribes and lineage shaped protection, alliances, marriage ties, trade, conflict, migration, and leadership. Understanding the Prophet's ﷺ family line and the major tribes around Makkah and Madinah makes the events of the Seerah much easier to follow."}
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: isRtl ? "سلسلة النسب" : "Lineage chain", value: isRtl ? "٢٤ جيلًا" : "24 generations" },
            { label: isRtl ? "عشائر قريش" : "Quraysh clans", value: isRtl ? "١٣ عشيرة" : "13 clans" },
            { label: isRtl ? "قبائل المدينة" : "Madinan tribes", value: isRtl ? "١٠ قبائل" : "10 tribes" },
            { label: isRtl ? "قبائل أخرى" : "Other tribes", value: isRtl ? "+٢٠ قبيلة" : "20+ tribes" },
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
            {isRtl ? "نسب النبي ﷺ" : "The Prophet's ﷺ Lineage"}
          </h2>
          <div className="mb-4 p-4 rounded-xl border border-gold/20 bg-gold-bg/30 text-sm text-text-secondary flex gap-3">
            <Info className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
            <p>
              {isRtl
                ? "يثبت نسب النبي ﷺ بوضوح عبر قريش وكنانة وبني هاشم. ويُنسب هذا النسب تقليديًا إلى إسماعيل عليه السلام وإبراهيم عليه السلام. أما التفاصيل الدقيقة لما بعد عدنان فتُتناول غالبًا بتحفظ لاختلاف الروايات فيها."
                : "The Prophet's ﷺ lineage is firmly traced through Quraysh, Kinanah, and Banu Hashim. The lineage is traditionally connected back to Isma'il عليه السلام and Ibrahim عليه السلام. Detailed chains beyond Adnan are usually treated with caution because reports differ."}
            </p>
          </div>

          {/* Lineage chain */}
          <div className="relative">
            <div className="absolute start-4 top-0 bottom-0 w-px bg-gradient-to-b from-gold via-gold/40 to-gold/10" aria-hidden="true" />
            <div className="space-y-2">
              {LINEAGE_CHAIN.map((ancestor, index) => (
                <div key={index} className="relative flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full border-2 border-gold/40 bg-surface flex items-center justify-center flex-shrink-0 z-10">
                    <ChevronDown className="w-3 h-3 text-gold" />
                  </div>
                  <div className="flex-1 py-2">
                    <p className="text-sm font-medium text-text">{isRtl ? ancestor.labelAr : ancestor.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Callout Cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {[
            {
              title: isRtl ? "لماذا كانت القبائل مهمة" : "Why tribes mattered",
              text: isRtl
                ? "في الجزيرة العربية، كانت قبيلة الشخص تؤثر في الحماية والزواج والتجارة والتحالفات والقصاص والدعم السياسي."
                : "In Arabia, a person's tribe affected protection, marriage, trade, alliances, retaliation, and political support.",
            },
            {
              title: isRtl ? "لماذا كانت قريش مهمة" : "Why Quraysh mattered",
              text: isRtl
                ? "تحكّمت قريش في قيادة مكة، وكان لها نفوذ كبير من خلال الكعبة والحج والتجارة."
                : "Quraysh controlled Makkah's leadership and held major influence through the Ka'bah, pilgrimage, and trade.",
            },
            {
              title: isRtl ? "لماذا كان بنو هاشم مهمين" : "Why Banu Hashim mattered",
              text: isRtl
                ? "كان بنو هاشم عشيرة النبي ﷺ. وحتى قبل أن يعتنق كثير منهم الإسلام، لعبت الحماية القبلية دورًا كبيرًا في الفترة المكية."
                : "Banu Hashim was the Prophet's ﷺ clan. Even before many accepted Islam, tribal protection played a major role in the Makkan period.",
            },
            {
              title: isRtl ? "لماذا كان الأوس والخزرج مهمين" : "Why Aws and Khazraj mattered",
              text: isRtl
                ? "أصبح الأوس والخزرج الأنصار، أي أنصار النبي ﷺ في المدينة بعد الهجرة."
                : "Aws and Khazraj became the Ansar, the supporters of the Prophet ﷺ in Madinah after the Hijrah.",
            },
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
            <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder={isRtl ? "ابحث في القبائل والبطون والنسب…" : "Search tribes, clans, or lineage…"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full ps-11 pe-4 py-3 rounded-xl border border-border bg-surface text-text placeholder-text-muted focus:outline-none focus:border-gold/40 transition-colors"
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
                  {isRtl ? CATEGORY_LABELS_AR[category] : category}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quraysh Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-text mb-4">
            {isRtl ? "قريش ومكة" : "Quraysh and Makkah"}
          </h2>
          <p className="text-sm text-text-secondary mb-6 leading-relaxed">
            {isRtl
              ? "كانت قريش القبيلة الكبرى في مكة. كان لها نفوذ ديني واجتماعي واقتصادي بسبب صلتها بالكعبة والحج والتجارة. وكان النبي ﷺ من بني هاشم، إحدى العشائر النبيلة في قريش."
              : "Quraysh was the major tribe of Makkah. It held religious, social, and economic influence because of its connection to the Ka'bah, pilgrimage, and trade. The Prophet ﷺ belonged to Banu Hashim, one of the noble clans of Quraysh."}
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {QURAYSH_CLANS.filter((t) =>
              selectedCategory === "All" ||
              t.category === selectedCategory ||
              (searchQuery && filteredTribes.includes(t))
            ).map((tribe, index) => (
              <TribeCard key={index} tribe={tribe} isRtl={isRtl} />
            ))}
          </div>
        </section>

        {/* Madinah Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-text mb-4">
            {isRtl ? "المدينة: الأوس والخزرج والأنصار" : "Madinah: Aws, Khazraj, and the Ansar"}
          </h2>
          <p className="text-sm text-text-secondary mb-6 leading-relaxed">
            {isRtl
              ? "قبل الهجرة، كانت المدينة تُعرف بيثرب. وكانت قبيلتاها العربيتان الكبريان الأوس والخزرج. وبعد أن ناصروا النبي ﷺ والمهاجرين، عُرفوا بالأنصار."
              : "Before the Hijrah, Madinah was known as Yathrib. Its two major Arab tribes were Aws and Khazraj. After supporting the Prophet ﷺ and the Muhajirun, they became known as the Ansar."}
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {MADINAH_TRIBES.filter((t) =>
              selectedCategory === "All" ||
              t.category === selectedCategory ||
              (searchQuery && filteredTribes.includes(t))
            ).map((tribe, index) => (
              <TribeCard key={index} tribe={tribe} isRtl={isRtl} />
            ))}
          </div>
          <div className="p-4 rounded-xl border border-border/50 bg-surface-raised/40 text-sm text-text-muted">
            <p className="flex gap-2">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                {isRtl
                  ? "أُدرجت القبائل اليهودية لأنها كانت جزءًا من المشهد السياسي والاجتماعي في المدينة خلال أحداث السيرة."
                  : "The Jewish tribes are included because they were part of the political and social landscape of Madinah during the Seerah."}
              </span>
            </p>
          </div>
        </section>

        {/* Other Tribes Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-text">
              {isRtl ? "قبائل مهمة أخرى" : "Other Important Tribes"}
            </h2>
            <button
              onClick={() => setShowMoreTribes(!showMoreTribes)}
              className="inline-flex items-center gap-1 text-sm font-medium text-gold hover:text-gold-light transition-colors"
            >
              {showMoreTribes
                ? (isRtl ? "عرض أقل" : "Show Less")
                : (isRtl ? "عرض المزيد من القبائل" : "View More Tribes")}
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
                <TribeCard key={index} tribe={tribe} isRtl={isRtl} />
              ))}
            </div>
          )}
        </section>

        {/* CTA */}
        <section className="pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div>
              <p className="text-sm text-text-muted mb-1">{isRtl ? "تريد التعمق أكثر؟" : "Ready to go deeper?"}</p>
              <p className="text-base font-semibold text-text">
                {isRtl
                  ? "تعرّف على كيفية ارتباط هذه القبائل والعشائر عبر السيرة الكاملة."
                  : "See how these tribes and clans connect throughout the full Seerah."}
              </p>
            </div>
            <Link
              href="/seerah"
              className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-ink font-semibold text-sm hover:bg-gold-light transition-colors"
            >
              {isRtl ? "استمر في تعلّم السيرة النبوية" : "Continue Learning the Seerah"}
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
            {isRtl ? "العودة إلى مكتبة المراجع" : "Back to Reference Library"}
          </Link>
        </div>

      </div>
    </main>
  );
}

// ── Tribe Card Component ───────────────────────────────────────────────────────

function TribeCard({ tribe, isRtl }: { tribe: Tribe; isRtl: boolean }) {
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
        <h3 className="text-base font-bold text-text">{isRtl ? tribe.nameAr : tribe.name}</h3>
        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border flex-shrink-0 ${badgeColor}`}>
          {isRtl ? CATEGORY_LABELS_AR[tribe.category] : tribe.category}
        </span>
      </div>
      <p className="text-xs font-medium text-gold mb-2">{isRtl ? tribe.typeAr : tribe.type}</p>
      <p className="text-xs text-text-muted mb-2">{isRtl ? tribe.connectionAr : tribe.connection}</p>
      <p className="text-xs text-text-secondary leading-relaxed">{isRtl ? tribe.descriptionAr : tribe.description}</p>
    </div>
  );
}
