"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Info, ChevronDown, ChevronRight } from "lucide-react";
import type { CourseLang } from "@/lib/course-lang";
import { loc } from "@/lib/loc";

// ── Lineage Chain ──────────────────────────────────────────────────────────────

const LINEAGE_CHAIN = [
  { name: "Muhammad ﷺ", label: "Prophet ﷺ", labelAr: "النبي محمد ﷺ", labelFr: "Prophète ﷺ" },
  { name: "Abdullah", label: "Abdullah", labelAr: "عبد الله", labelFr: "Abdullah" },
  { name: "Abd al-Muttalib", label: "Abd al-Muttalib", labelAr: "عبد المطلب", labelFr: "Abd al-Muttalib" },
  { name: "Hashim", label: "Hashim (Banu Hashim)", labelAr: "هاشم (بنو هاشم)", labelFr: "Hāshim (Banū Hāshim)" },
  { name: "Abd Manaf", label: "Abd Manaf", labelAr: "عبد مناف", labelFr: "Abd Manāf" },
  { name: "Qusayy", label: "Qusayy", labelAr: "قصي", labelFr: "Qusayy" },
  { name: "Kilab", label: "Kilab", labelAr: "كلاب", labelFr: "Kilāb" },
  { name: "Murrah", label: "Murrah", labelAr: "مرة", labelFr: "Murrah" },
  { name: "Ka'b", label: "Ka'b", labelAr: "كعب", labelFr: "Kaʿb" },
  { name: "Lu'ayy", label: "Lu'ayy", labelAr: "لؤي", labelFr: "Luʾayy" },
  { name: "Ghalib", label: "Ghalib", labelAr: "غالب", labelFr: "Ghālib" },
  { name: "Fihr (Quraysh)", label: "Fihr (Quraysh)", labelAr: "فهر (قريش)", labelFr: "Fihr (Quraysh)" },
  { name: "Malik", label: "Malik", labelAr: "مالك", labelFr: "Mālik" },
  { name: "al-Nadr", label: "al-Nadr", labelAr: "النضر", labelFr: "al-Naḍr" },
  { name: "Kinanah", label: "Kinanah", labelAr: "كنانة", labelFr: "Kinānah" },
  { name: "Khuzaymah", label: "Khuzaymah", labelAr: "خزيمة", labelFr: "Khuzaymah" },
  { name: "Mudrikah", label: "Mudrikah", labelAr: "مدركة", labelFr: "Mudrikah" },
  { name: "Ilyas", label: "Ilyas", labelAr: "إلياس", labelFr: "Ilyās" },
  { name: "Mudar", label: "Mudar", labelAr: "مضر", labelFr: "Muḍar" },
  { name: "Nizar", label: "Nizar", labelAr: "نزار", labelFr: "Nizār" },
  { name: "Ma'add", label: "Ma'add", labelAr: "معد", labelFr: "Maʿadd" },
  { name: "Adnan", label: "Adnan", labelAr: "عدنان", labelFr: "Adnān" },
  { name: "Traditionally connected to Isma'il عليه السلام", label: "→ Isma'il عليه السلام", labelAr: "← إسماعيل عليه السلام", labelFr: "→ Ismāʿīl عليه السلام" },
  { name: "Son of Ibrahim عليه السلام", label: "→ Ibrahim عليه السلام", labelAr: "← إبراهيم عليه السلام", labelFr: "→ Ibrāhīm عليه السلام" },
];

// ── Tribal Data ────────────────────────────────────────────────────────────────

interface Tribe {
  name: string;
  nameAr: string;
  nameFr: string;
  type: string;
  typeAr: string;
  typeFr: string;
  connection: string;
  connectionAr: string;
  connectionFr: string;
  description: string;
  descriptionAr: string;
  descriptionFr: string;
  category: string;
}

const QURAYSH_CLANS: Tribe[] = [
  { name: "Banu Hashim", nameAr: "بنو هاشم", nameFr: "Banū Hāshim", type: "Clan of Quraysh", typeAr: "بطن من قريش", typeFr: "Clan de Quraysh", connection: "Clan of the Prophet ﷺ", connectionAr: "عشيرة النبي ﷺ", connectionFr: "Clan du Prophète ﷺ", description: "The Prophet ﷺ belonged to Banu Hashim. Abu Talib, Hamzah, al-Abbas, Ali, and Fatimah رضي الله عنهم are connected to this household.", descriptionAr: "كان النبي ﷺ من بني هاشم. ويُنسب إلى هذا البيت أبو طالب وحمزة والعباس وعلي وفاطمة رضي الله عنهم.", descriptionFr: "Le Prophète ﷺ appartenait à Banū Hāshim. Abū Ṭālib, Ḥamzah, al-ʿAbbās, ʿAlī et Fāṭimah رضي الله عنهم sont liés à cette maison.", category: "Banu Hashim" },
  { name: "Banu al-Muttalib", nameAr: "بنو المطلب", nameFr: "Banū al-Muṭṭalib", type: "Clan of Quraysh", typeAr: "بطن من قريش", typeFr: "Clan de Quraysh", connection: "Close allies of Banu Hashim", connectionAr: "حلفاء مقرّبون لبني هاشم", connectionFr: "Alliés proches de Banū Hāshim", description: "Closely tied to Banu Hashim and supported them during major moments.", descriptionAr: "كانوا وثيقي الصلة ببني هاشم، ووقفوا معهم في المواقف الكبرى.", descriptionFr: "Étroitement liés à Banū Hāshim, ils les soutinrent dans les moments majeurs.", category: "Quraysh" },
  { name: "Banu Abd Shams", nameAr: "بنو عبد شمس", nameFr: "Banū ʿAbd Shams", type: "Clan of Quraysh", typeAr: "بطن من قريش", typeFr: "Clan de Quraysh", connection: "Related Qurayshi branch", connectionAr: "فرع قرشي ذو صلة", connectionFr: "Branche qurayshite apparentée", description: "A powerful branch of Quraysh connected to major Makkan leaders.", descriptionAr: "فرع قوي من قريش مرتبط بكبار زعماء مكة.", descriptionFr: "Une branche puissante de Quraysh liée aux grands chefs de La Mecque.", category: "Quraysh" },
  { name: "Banu Umayyah", nameAr: "بنو أمية", nameFr: "Banū Umayyah", type: "Clan of Quraysh", typeAr: "بطن من قريش", typeFr: "Clan de Quraysh", connection: "Branch of Abd Shams", connectionAr: "فرع من عبد شمس", connectionFr: "Branche de ʿAbd Shams", description: "The clan of Abu Sufyan, Uthman ibn Affan, Mu'awiyah, and other major figures.", descriptionAr: "عشيرة أبي سفيان وعثمان بن عفان ومعاوية وغيرهم من كبار الشخصيات.", descriptionFr: "Le clan d'Abū Sufyān, ʿUthmān ibn ʿAffān, Muʿāwiyah et d'autres figures majeures.", category: "Quraysh" },
  { name: "Banu Nawfal", nameAr: "بنو نوفل", nameFr: "Banū Nawfal", type: "Clan of Quraysh", typeAr: "بطن من قريش", typeFr: "Clan de Quraysh", connection: "Qurayshi clan", connectionAr: "بطن قرشي", connectionFr: "Clan qurayshite", description: "One of the clans of Quraysh with social and political influence.", descriptionAr: "إحدى بطون قريش ذات نفوذ اجتماعي وسياسي.", descriptionFr: "Un des clans de Quraysh ayant une influence sociale et politique.", category: "Quraysh" },
  { name: "Banu Zuhrah", nameAr: "بنو زهرة", nameFr: "Banū Zuhrah", type: "Clan of Quraysh", typeAr: "بطن من قريش", typeFr: "Clan de Quraysh", connection: "Maternal connection", connectionAr: "صلة عبر الأم", connectionFr: "Lien maternel", description: "The clan of Aminah bint Wahb, the mother of the Prophet ﷺ.", descriptionAr: "عشيرة آمنة بنت وهب، والدة النبي ﷺ.", descriptionFr: "Le clan d'Āminah bint Wahb, la mère du Prophète ﷺ.", category: "Quraysh" },
  { name: "Banu Makhzum", nameAr: "بنو مخزوم", nameFr: "Banū Makhzūm", type: "Clan of Quraysh", typeAr: "بطن من قريش", typeFr: "Clan de Quraysh", connection: "Major Makkan power clan", connectionAr: "عشيرة مكية كبرى", connectionFr: "Grand clan de pouvoir à La Mecque", description: "The clan of Abu Jahl and Khalid ibn al-Walid. It was influential in Makkan opposition and later Islamic history.", descriptionAr: "عشيرة أبي جهل وخالد بن الوليد، وكانت ذات تأثير في معارضة مكة وفي التاريخ الإسلامي لاحقًا.", descriptionFr: "Le clan d'Abū Jahl et de Khālid ibn al-Walīd. Il eut une influence dans l'opposition mecquoise et plus tard dans l'histoire islamique.", category: "Quraysh" },
  { name: "Banu Taym", nameAr: "بنو تيم", nameFr: "Banū Taym", type: "Clan of Quraysh", typeAr: "بطن من قريش", typeFr: "Clan de Quraysh", connection: "Clan of Abu Bakr", connectionAr: "عشيرة أبي بكر", connectionFr: "Clan d'Abū Bakr", description: "The clan of Abu Bakr al-Siddiq رضي الله عنه.", descriptionAr: "عشيرة أبي بكر الصديق رضي الله عنه.", descriptionFr: "Le clan d'Abū Bakr al-Ṣiddīq رضي الله عنه.", category: "Quraysh" },
  { name: "Banu Adi", nameAr: "بنو عدي", nameFr: "Banū ʿAdī", type: "Clan of Quraysh", typeAr: "بطن من قريش", typeFr: "Clan de Quraysh", connection: "Clan of Umar", connectionAr: "عشيرة عمر", connectionFr: "Clan de ʿUmar", description: "The clan of Umar ibn al-Khattab رضي الله عنه.", descriptionAr: "عشيرة عمر بن الخطاب رضي الله عنه.", descriptionFr: "Le clan de ʿUmar ibn al-Khaṭṭāb رضي الله عنه.", category: "Quraysh" },
  { name: "Banu Asad", nameAr: "بنو أسد", nameFr: "Banū Asad", type: "Clan of Quraysh", typeAr: "بطن من قريش", typeFr: "Clan de Quraysh", connection: "Clan of Khadijah", connectionAr: "عشيرة خديجة", connectionFr: "Clan de Khadījah", description: "The clan of Khadijah bint Khuwaylid رضي الله عنها.", descriptionAr: "عشيرة خديجة بنت خويلد رضي الله عنها.", descriptionFr: "Le clan de Khadījah bint Khuwaylid رضي الله عنها.", category: "Quraysh" },
  { name: "Banu Jumah", nameAr: "بنو جمح", nameFr: "Banū Jumaḥ", type: "Clan of Quraysh", typeAr: "بطن من قريش", typeFr: "Clan de Quraysh", connection: "Clan of Umayyah ibn Khalaf", connectionAr: "عشيرة أمية بن خلف", connectionFr: "Clan d'Umayyah ibn Khalaf", description: "Connected to some major opponents of the early Muslims.", descriptionAr: "ارتبطت ببعض كبار معارضي المسلمين الأوائل.", descriptionFr: "Lié à certains grands adversaires des premiers musulmans.", category: "Quraysh" },
  { name: "Banu Sahm", nameAr: "بنو سهم", nameFr: "Banū Sahm", type: "Clan of Quraysh", typeAr: "بطن من قريش", typeFr: "Clan de Quraysh", connection: "Qurayshi clan", connectionAr: "بطن قرشي", connectionFr: "Clan qurayshite", description: "A clan connected to Makkan society and leadership.", descriptionAr: "بطن مرتبط بمجتمع مكة وقيادتها.", descriptionFr: "Un clan lié à la société et à la direction de La Mecque.", category: "Quraysh" },
  { name: "Banu Amir ibn Lu'ayy", nameAr: "بنو عامر بن لؤي", nameFr: "Banū ʿĀmir ibn Luʾayy", type: "Clan of Quraysh", typeAr: "بطن من قريش", typeFr: "Clan de Quraysh", connection: "Qurayshi clan", connectionAr: "بطن قرشي", connectionFr: "Clan qurayshite", description: "Another clan within the wider Quraysh structure.", descriptionAr: "بطن آخر ضمن بنية قريش الأوسع.", descriptionFr: "Un autre clan au sein de la structure plus large de Quraysh.", category: "Quraysh" },
];

const MADINAH_TRIBES: Tribe[] = [
  { name: "Aws", nameAr: "الأوس", nameFr: "Aws", type: "Arab tribe of Madinah", typeAr: "قبيلة عربية من المدينة", typeFr: "Tribu arabe de Médine", connection: "Ansar", connectionAr: "الأنصار", connectionFr: "Anṣār", description: "One of the two major Arab tribes of Madinah. Many members supported the Prophet ﷺ after the Hijrah.", descriptionAr: "إحدى القبيلتين العربيتين الكبريين في المدينة. أيّد كثير من أفرادها النبي ﷺ بعد الهجرة.", descriptionFr: "L'une des deux grandes tribus arabes de Médine. De nombreux membres soutinrent le Prophète ﷺ après l'Hégire.", category: "Ansar" },
  { name: "Khazraj", nameAr: "الخزرج", nameFr: "Khazraj", type: "Arab tribe of Madinah", typeAr: "قبيلة عربية من المدينة", typeFr: "Tribu arabe de Médine", connection: "Ansar", connectionAr: "الأنصار", connectionFr: "Anṣār", description: "One of the two major Arab tribes of Madinah. Many early Madinan Muslims came from Khazraj.", descriptionAr: "إحدى القبيلتين العربيتين الكبريين في المدينة. جاء كثير من مسلمي المدينة الأوائل من الخزرج.", descriptionFr: "L'une des deux grandes tribus arabes de Médine. Beaucoup des premiers musulmans de Médine venaient des Khazraj.", category: "Ansar" },
  { name: "Banu Najjar", nameAr: "بنو النجار", nameFr: "Banū al-Najjār", type: "Clan of Khazraj", typeAr: "بطن من الخزرج", typeFr: "Clan des Khazraj", connection: "Maternal relatives and hosts in Madinah", connectionAr: "أقارب عبر الأم ومستضيفون في المدينة", connectionFr: "Parents maternels et hôtes à Médine", description: "The Prophet ﷺ had family ties through his mother's side, and Abu Ayyub al-Ansari رضي الله عنه hosted him in Madinah.", descriptionAr: "كانت للنبي ﷺ صلة قرابة معهم من جهة أمه، واستضافه أبو أيوب الأنصاري رضي الله عنه في المدينة.", descriptionFr: "Le Prophète ﷺ avait des liens familiaux du côté maternel, et Abū Ayyūb al-Anṣārī رضي الله عنه l'hébergea à Médine.", category: "Ansar" },
  { name: "Banu Sa'idah", nameAr: "بنو ساعدة", nameFr: "Banū Sāʿidah", type: "Clan of Khazraj", typeAr: "بطن من الخزرج", typeFr: "Clan des Khazraj", connection: "Ansar", connectionAr: "الأنصار", connectionFr: "Anṣār", description: "Connected to important Ansari leadership and later political events.", descriptionAr: "ارتبطوا بقيادة أنصارية مهمة وبأحداث سياسية لاحقة.", descriptionFr: "Liés à d'importants dirigeants ansaris et à des événements politiques ultérieurs.", category: "Ansar" },
  { name: "Banu Abdul Ashhal", nameAr: "بنو عبد الأشهل", nameFr: "Banū ʿAbd al-Ashhal", type: "Clan of Aws", typeAr: "بطن من الأوس", typeFr: "Clan des Aws", connection: "Ansar", connectionAr: "الأنصار", connectionFr: "Anṣār", description: "The clan of Sa'd ibn Mu'adh and Usaid ibn Hudayr رضي الله عنهما.", descriptionAr: "عشيرة سعد بن معاذ وأسيد بن حضير رضي الله عنهما.", descriptionFr: "Le clan de Saʿd ibn Muʿādh et d'Usayd ibn Ḥuḍayr رضي الله عنهما.", category: "Ansar" },
  { name: "Banu Harithah", nameAr: "بنو حارثة", nameFr: "Banū Ḥārithah", type: "Clan of Aws", typeAr: "بطن من الأوس", typeFr: "Clan des Aws", connection: "Ansar", connectionAr: "الأنصار", connectionFr: "Anṣār", description: "A Madinan clan involved in the events of the Seerah.", descriptionAr: "بطن من المدينة كان له دور في أحداث السيرة.", descriptionFr: "Un clan médinois impliqué dans les événements de la Sīrah.", category: "Ansar" },
  { name: "Banu Salimah", nameAr: "بنو سلمة", nameFr: "Banū Salimah", type: "Clan of Khazraj", typeAr: "بطن من الخزرج", typeFr: "Clan des Khazraj", connection: "Ansar", connectionAr: "الأنصار", connectionFr: "Anṣār", description: "A Madinan clan connected to the Ansar and the events around Madinah.", descriptionAr: "بطن من المدينة مرتبط بالأنصار والأحداث حول المدينة.", descriptionFr: "Un clan médinois lié aux Anṣār et aux événements autour de Médine.", category: "Ansar" },
  { name: "Banu Qaynuqa", nameAr: "بنو قينقاع", nameFr: "Banū Qaynuqāʿ", type: "Jewish tribe of Madinah", typeAr: "قبيلة يهودية من المدينة", typeFr: "Tribu juive de Médine", connection: "Madinan treaty politics", connectionAr: "سياسات المعاهدات في المدينة", connectionFr: "Politique des traités à Médine", description: "One of the Jewish tribes living in Madinah during the Prophet's ﷺ time.", descriptionAr: "إحدى القبائل اليهودية التي عاشت في المدينة في زمن النبي ﷺ.", descriptionFr: "L'une des tribus juives vivant à Médine à l'époque du Prophète ﷺ.", category: "Jewish Tribes of Madinah" },
  { name: "Banu Nadir", nameAr: "بنو النضير", nameFr: "Banū al-Naḍīr", type: "Jewish tribe of Madinah", typeAr: "قبيلة يهودية من المدينة", typeFr: "Tribu juive de Médine", connection: "Madinan treaty politics", connectionAr: "سياسات المعاهدات في المدينة", connectionFr: "Politique des traités à Médine", description: "A Jewish tribe involved in major political events in Madinah.", descriptionAr: "قبيلة يهودية شاركت في أحداث سياسية كبرى في المدينة.", descriptionFr: "Une tribu juive impliquée dans de grands événements politiques à Médine.", category: "Jewish Tribes of Madinah" },
  { name: "Banu Qurayzah", nameAr: "بنو قريظة", nameFr: "Banū Qurayẓah", type: "Jewish tribe of Madinah", typeAr: "قبيلة يهودية من المدينة", typeFr: "Tribu juive de Médine", connection: "Madinan treaty politics", connectionAr: "سياسات المعاهدات في المدينة", connectionFr: "Politique des traités à Médine", description: "A Jewish tribe connected to the events after the Battle of the Trench.", descriptionAr: "قبيلة يهودية مرتبطة بالأحداث التي تلت غزوة الخندق.", descriptionFr: "Une tribu juive liée aux événements après la bataille du Fossé.", category: "Jewish Tribes of Madinah" },
];

const OTHER_TRIBES: Tribe[] = [
  { name: "Thaqif", nameAr: "ثقيف", nameFr: "Thaqīf", type: "Tribe of Ta'if", typeAr: "قبيلة الطائف", typeFr: "Tribu de Ṭāʾif", connection: "Ta'if and later Islam", connectionAr: "الطائف ودخولهم الإسلام لاحقًا", connectionFr: "Ṭāʾif et l'islam plus tard", description: "The tribe of Ta'if. They opposed the Prophet ﷺ during his visit to Ta'if but later entered Islam.", descriptionAr: "قبيلة الطائف. عارضوا النبي ﷺ خلال زيارته للطائف، ثم دخلوا الإسلام لاحقًا.", descriptionFr: "La tribu de Ṭāʾif. Ils s'opposèrent au Prophète ﷺ lors de sa visite à Ṭāʾif, puis entrèrent dans l'islam plus tard.", category: "Allies" },
  { name: "Hawazin", nameAr: "هوازن", nameFr: "Hawāzin", type: "Arab tribal confederation", typeAr: "تحالف قبلي عربي", typeFr: "Confédération tribale arabe", connection: "Battle of Hunayn", connectionAr: "غزوة حنين", connectionFr: "Bataille de Ḥunayn", description: "A major tribal group involved in the Battle of Hunayn after the conquest of Makkah.", descriptionAr: "مجموعة قبلية كبرى شاركت في غزوة حنين بعد فتح مكة.", descriptionFr: "Un grand groupe tribal impliqué dans la bataille de Ḥunayn après la conquête de La Mecque.", category: "Opponents" },
  { name: "Ghatafan", nameAr: "غطفان", nameFr: "Ghaṭafān", type: "Najdi tribal confederation", typeAr: "تحالف قبلي نجدي", typeFr: "Confédération tribale najdie", connection: "Battle of the Trench", connectionAr: "غزوة الخندق", connectionFr: "Bataille du Fossé", description: "One of the groups involved in the coalition against Madinah during the Battle of the Trench.", descriptionAr: "إحدى الجماعات التي شاركت في التحالف ضد المدينة خلال غزوة الخندق.", descriptionFr: "L'un des groupes de la coalition contre Médine lors de la bataille du Fossé.", category: "Opponents" },
  { name: "Banu Sulaym", nameAr: "بنو سليم", nameFr: "Banū Sulaym", type: "Arab tribe", typeAr: "قبيلة عربية", typeFr: "Tribu arabe", connection: "Arabian tribal politics", connectionAr: "السياسات القبلية في الجزيرة العربية", connectionFr: "Politique tribale en Arabie", description: "A tribe involved in the wider political landscape of Arabia.", descriptionAr: "قبيلة كانت جزءًا من المشهد السياسي الأوسع في الجزيرة العربية.", descriptionFr: "Une tribu impliquée dans le paysage politique plus large de l'Arabie.", category: "Neighboring Tribes" },
  { name: "Banu Tamim", nameAr: "بنو تميم", nameFr: "Banū Tamīm", type: "Arab tribe", typeAr: "قبيلة عربية", typeFr: "Tribu arabe", connection: "Delegations to the Prophet ﷺ", connectionAr: "وفود على النبي ﷺ", connectionFr: "Délégations auprès du Prophète ﷺ", description: "A major Arab tribe connected to the Year of Delegations.", descriptionAr: "قبيلة عربية كبرى مرتبطة بعام الوفود.", descriptionFr: "Une grande tribu arabe liée à l'Année des délégations.", category: "Neighboring Tribes" },
  { name: "Banu Hanifah", nameAr: "بنو حنيفة", nameFr: "Banū Ḥanīfah", type: "Tribe of Yamamah", typeAr: "قبيلة اليمامة", typeFr: "Tribu de Yamāmah", connection: "Musaylimah", connectionAr: "مسيلمة", connectionFr: "Musaylimah", description: "The tribe connected to Musaylimah al-Kadhdhab, who falsely claimed prophethood.", descriptionAr: "القبيلة المرتبطة بمسيلمة الكذاب، الذي زعم النبوة كذبًا.", descriptionFr: "La tribu liée à Musaylimah al-Kadhdhāb, qui prétendit faussement à la prophétie.", category: "Opponents" },
  { name: "Daws", nameAr: "دوس", nameFr: "Daws", type: "Yemeni Arab tribe", typeAr: "قبيلة عربية يمنية", typeFr: "Tribu arabe yéménite", connection: "Tribe of Abu Hurairah and al-Tufayl", connectionAr: "قبيلة أبي هريرة والطفيل", connectionFr: "Tribu d'Abū Hurayrah et d'al-Ṭufayl", description: "The tribe of Abu Hurairah رضي الله عنه and al-Tufayl ibn Amr al-Dawsi رضي الله عنه.", descriptionAr: "قبيلة أبي هريرة رضي الله عنه والطفيل بن عمرو الدوسي رضي الله عنه.", descriptionFr: "La tribu d'Abū Hurayrah رضي الله عنه et d'al-Ṭufayl ibn ʿAmr al-Dawsī رضي الله عنه.", category: "Allies" },
  { name: "Ash'ar", nameAr: "الأشعريون", nameFr: "Ashʿar", type: "Yemeni Arab tribe", typeAr: "قبيلة عربية يمنية", typeFr: "Tribu arabe yéménite", connection: "Tribe of Abu Musa", connectionAr: "قبيلة أبي موسى", connectionFr: "Tribu d'Abū Mūsā", description: "The tribe of Abu Musa al-Ash'ari رضي الله عنه.", descriptionAr: "قبيلة أبي موسى الأشعري رضي الله عنه.", descriptionFr: "La tribu d'Abū Mūsā al-Ashʿarī رضي الله عنه.", category: "Allies" },
  { name: "Khuza'ah", nameAr: "خزاعة", nameFr: "Khuzāʿah", type: "Arab tribe near Makkah", typeAr: "قبيلة عربية قرب مكة", typeFr: "Tribu arabe près de La Mecque", connection: "Ally of the Muslims", connectionAr: "حليفة المسلمين", connectionFr: "Alliée des musulmans", description: "Their alliance and conflict with Banu Bakr helped lead to the conquest of Makkah.", descriptionAr: "أدى تحالفهم وصراعهم مع بني بكر إلى فتح مكة.", descriptionFr: "Leur alliance et leur conflit avec Banū Bakr contribuèrent à la conquête de La Mecque.", category: "Allies" },
  { name: "Banu Bakr", nameAr: "بنو بكر", nameFr: "Banū Bakr", type: "Arab tribe near Makkah", typeAr: "قبيلة عربية قرب مكة", typeFr: "Tribu arabe près de La Mecque", connection: "Ally of Quraysh", connectionAr: "حليفة قريش", connectionFr: "Alliée de Quraysh", description: "Their attack on Khuza'ah became one of the events leading to the conquest of Makkah.", descriptionAr: "أصبح هجومهم على خزاعة من الأحداث التي أدت إلى فتح مكة.", descriptionFr: "Leur attaque contre Khuzāʿah fut l'un des événements menant à la conquête de La Mecque.", category: "Opponents" },
  { name: "Ghifar", nameAr: "غفار", nameFr: "Ghifār", type: "Arab tribe", typeAr: "قبيلة عربية", typeFr: "Tribu arabe", connection: "Tribe of Abu Dharr", connectionAr: "قبيلة أبي ذر", connectionFr: "Tribu d'Abū Dharr", description: "The tribe of Abu Dharr al-Ghifari رضي الله عنه.", descriptionAr: "قبيلة أبي ذر الغفاري رضي الله عنه.", descriptionFr: "La tribu d'Abū Dharr al-Ghifārī رضي الله عنه.", category: "Allies" },
  { name: "Aslam", nameAr: "أسلم", nameFr: "Aslam", type: "Arab tribe", typeAr: "قبيلة عربية", typeFr: "Tribu arabe", connection: "Later support for Islam", connectionAr: "دعم الإسلام لاحقًا", connectionFr: "Soutien ultérieur à l'islam", description: "A tribe that became connected to the growing Muslim community.", descriptionAr: "قبيلة ارتبطت بالمجتمع المسلم المتنامي.", descriptionFr: "Une tribu qui se lia à la communauté musulmane croissante.", category: "Allies" },
  { name: "Muzaynah", nameAr: "مزينة", nameFr: "Muzaynah", type: "Arab tribe", typeAr: "قبيلة عربية", typeFr: "Tribu arabe", connection: "Delegations and support", connectionAr: "الوفود والدعم", connectionFr: "Délégations et soutien", description: "One of the Arab tribes connected to the Prophet's ﷺ later Madinan period.", descriptionAr: "إحدى القبائل العربية المرتبطة بالفترة المدنية اللاحقة للنبي ﷺ.", descriptionFr: "L'une des tribus arabes liées à la période médinoise tardive du Prophète ﷺ.", category: "Allies" },
  { name: "Juhaynah", nameAr: "جهينة", nameFr: "Juhaynah", type: "Arab tribe", typeAr: "قبيلة عربية", typeFr: "Tribu arabe", connection: "Arabian tribal network", connectionAr: "الشبكة القبلية في الجزيرة العربية", connectionFr: "Réseau tribal d'Arabie", description: "A tribe involved in the broader tribal world around Madinah.", descriptionAr: "قبيلة كانت جزءًا من الشبكة القبلية الأوسع حول المدينة.", descriptionFr: "Une tribu du monde tribal plus large autour de Médine.", category: "Neighboring Tribes" },
  { name: "Lihyan", nameAr: "بنو لحيان", nameFr: "Liḥyān", type: "Arab tribe", typeAr: "قبيلة عربية", typeFr: "Tribu arabe", connection: "Conflict in the Seerah", connectionAr: "صراع في السيرة", connectionFr: "Conflit dans la Sīrah", description: "Connected to difficult events faced by the Muslims.", descriptionAr: "ارتبطوا بأحداث صعبة واجهها المسلمون.", descriptionFr: "Liés à des événements difficiles affrontés par les musulmans.", category: "Opponents" },
  { name: "Banu Mustaliq", nameAr: "بنو المصطلق", nameFr: "Banū al-Muṣṭaliq", type: "Branch of Khuza'ah", typeAr: "فرع من خزاعة", typeFr: "Branche de Khuzāʿah", connection: "Campaign of Banu Mustaliq", connectionAr: "غزوة بني المصطلق", connectionFr: "Campagne de Banū al-Muṣṭaliq", description: "Connected to the campaign during the Madinan period.", descriptionAr: "ارتبطوا بالغزوة التي وقعت خلال الفترة المدنية.", descriptionFr: "Liés à la campagne de la période médinoise.", category: "Neighboring Tribes" },
  { name: "Tayy", nameAr: "طيّئ", nameFr: "Ṭayyiʾ", type: "Arab tribe", typeAr: "قبيلة عربية", typeFr: "Tribu arabe", connection: "Adi ibn Hatim", connectionAr: "عدي بن حاتم", connectionFr: "ʿAdī ibn Ḥātim", description: "The tribe of Adi ibn Hatim, a former Christian Arab leader who accepted Islam.", descriptionAr: "قبيلة عدي بن حاتم، الزعيم العربي النصراني سابقًا الذي اعتنق الإسلام.", descriptionFr: "La tribu de ʿAdī ibn Ḥātim, un chef arabe chrétien qui accepta l'islam.", category: "Allies" },
  { name: "Kindah", nameAr: "كندة", nameFr: "Kindah", type: "Arab tribe", typeAr: "قبيلة عربية", typeFr: "Tribu arabe", connection: "Arabian delegations", connectionAr: "وفود الجزيرة العربية", connectionFr: "Délégations d'Arabie", description: "A major Arab tribe connected to later delegations and Arabian leadership.", descriptionAr: "قبيلة عربية كبرى مرتبطة بالوفود والقيادة العربية لاحقًا.", descriptionFr: "Une grande tribu arabe liée aux délégations et à la direction arabe ultérieures.", category: "Neighboring Tribes" },
  { name: "Azd", nameAr: "الأزد", nameFr: "Azd", type: "Yemeni tribal group", typeAr: "مجموعة قبلية يمنية", typeFr: "Groupe tribal yéménite", connection: "Ansar ancestry", connectionAr: "نسب الأنصار", connectionFr: "Ascendance des Anṣār", description: "Aws and Khazraj are commonly connected to the larger Azd tribal background.", descriptionAr: "يُنسب الأوس والخزرج غالبًا إلى الأصل القبلي الأكبر للأزد.", descriptionFr: "Aws et Khazraj sont généralement rattachés au fond tribal plus large des Azd.", category: "Neighboring Tribes" },
  { name: "Kinanah", nameAr: "كنانة", nameFr: "Kinānah", type: "Ancestral tribe", typeAr: "قبيلة من الأجداد", typeFr: "Tribu ancestrale", connection: "Ancestors of Quraysh", connectionAr: "أجداد قريش", connectionFr: "Ancêtres de Quraysh", description: "Quraysh traces upward through Kinanah in the Prophet's ﷺ lineage.", descriptionAr: "يعود نسب قريش إلى الأعلى عبر كنانة في نسب النبي ﷺ.", descriptionFr: "Quraysh remonte à Kinānah dans la lignée du Prophète ﷺ.", category: "Prophet's Lineage" },
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

const CATEGORY_LABELS_FR: Record<string, string> = {
  "All": "Tous",
  "Prophet's Lineage": "Lignée du Prophète ﷺ",
  "Quraysh": "Quraysh",
  "Banu Hashim": "Banū Hāshim",
  "Madinah": "Médine",
  "Ansar": "Anṣār",
  "Jewish Tribes of Madinah": "Tribus juives de Médine",
  "Allies": "Alliés",
  "Opponents": "Adversaires",
  "Neighboring Tribes": "Tribus voisines",
};

function categoryLabel(lang: CourseLang, category: string): string {
  return loc(lang, category, CATEGORY_LABELS_AR[category] ?? category, CATEGORY_LABELS_FR[category] ?? category);
}

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
      results = results.filter((t) => {
        if (lang === "ar") {
          return (
            t.nameAr.toLowerCase().includes(query) ||
            t.typeAr.toLowerCase().includes(query) ||
            t.connectionAr.toLowerCase().includes(query) ||
            t.descriptionAr.toLowerCase().includes(query)
          );
        }
        if (lang === "fr") {
          return (
            t.nameFr.toLowerCase().includes(query) ||
            t.typeFr.toLowerCase().includes(query) ||
            t.connectionFr.toLowerCase().includes(query) ||
            t.descriptionFr.toLowerCase().includes(query)
          );
        }
        return (
          t.name.toLowerCase().includes(query) ||
          t.type.toLowerCase().includes(query) ||
          t.connection.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query)
        );
      });
    }

    return results;
  }, [searchQuery, selectedCategory, allTribes, lang]);

  return (
    <main className="min-h-screen bg-ink py-16" dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* Back link */}
        <Link
          href="/reference"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text transition-colors mb-10"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {loc(lang, "Back to Reference Library", "العودة إلى مكتبة المراجع", "Retour à la bibliothèque de référence")}
        </Link>

        {/* Page header */}
        <div className="mb-12">
          <p className="text-sm text-gold font-medium mb-3 uppercase tracking-wide">
            {loc(lang, "Reference Library", "مكتبة المراجع", "Bibliothèque de référence")}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-text mb-4">
            {loc(lang, "Tribes and Lineage", "القبائل والنسب", "Tribus et lignée")}
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed mb-6">
            {loc(
              lang,
              "The major Arab tribes, their relationships, and the Prophet's ﷺ lineage traced back.",
              "أبرز القبائل العربية وعلاقاتها، ونسب النبي ﷺ.",
              "Les grandes tribus arabes, leurs relations, et la lignée du Prophète ﷺ retracée.",
            )}
          </p>
          <p className="text-sm text-text-secondary leading-relaxed">
            {loc(
              lang,
              "In the Seerah, tribes and lineage shaped protection, alliances, marriage ties, trade, conflict, migration, and leadership. Understanding the Prophet's ﷺ family line and the major tribes around Makkah and Madinah makes the events of the Seerah much easier to follow.",
              "شكّلت القبائل والأنساب في السيرة النبوية الحماية والتحالفات وصلات المصاهرة والتجارة والصراع والهجرة والقيادة. وفهم نسب النبي ﷺ وأهم القبائل حول مكة والمدينة يجعل متابعة أحداث السيرة أسهل بكثير.",
              "Dans la Sīrah, les tribus et la lignée façonnèrent la protection, les alliances, les liens matrimoniaux, le commerce, les conflits, la migration et le leadership. Comprendre la lignée familiale du Prophète ﷺ et les grandes tribus autour de La Mecque et de Médine rend les événements de la Sīrah bien plus faciles à suivre.",
            )}
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: loc(lang, "Lineage chain", "سلسلة النسب", "Chaîne de lignée"),
              value: loc(lang, "24 generations", "٢٤ جيلًا", "24 générations"),
            },
            {
              label: loc(lang, "Quraysh clans", "عشائر قريش", "Clans de Quraysh"),
              value: loc(lang, "13 clans", "١٣ عشيرة", "13 clans"),
            },
            {
              label: loc(lang, "Madinan tribes", "قبائل المدينة", "Tribus médinoises"),
              value: loc(lang, "10 tribes", "١٠ قبائل", "10 tribus"),
            },
            {
              label: loc(lang, "Other tribes", "قبائل أخرى", "Autres tribus"),
              value: loc(lang, "20+ tribes", "+٢٠ قبيلة", "20+ tribus"),
            },
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
            {loc(lang, "The Prophet's ﷺ Lineage", "نسب النبي ﷺ", "La lignée du Prophète ﷺ")}
          </h2>
          <div className="mb-4 p-4 rounded-xl border border-gold/20 bg-gold-bg/30 text-sm text-text-secondary flex gap-3">
            <Info className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
            <p>
              {loc(
                lang,
                "The Prophet's ﷺ lineage is firmly traced through Quraysh, Kinanah, and Banu Hashim. The lineage is traditionally connected back to Isma'il عليه السلام and Ibrahim عليه السلام. Detailed chains beyond Adnan are usually treated with caution because reports differ.",
                "يثبت نسب النبي ﷺ بوضوح عبر قريش وكنانة وبني هاشم. ويُنسب هذا النسب تقليديًا إلى إسماعيل عليه السلام وإبراهيم عليه السلام. أما التفاصيل الدقيقة لما بعد عدنان فتُتناول غالبًا بتحفظ لاختلاف الروايات فيها.",
                "La lignée du Prophète ﷺ est solidement retracée à travers Quraysh, Kinānah et Banū Hāshim. Elle est traditionnellement rattachée à Ismāʿīl عليه السلام et Ibrāhīm عليه السلام. Les chaînes détaillées au-delà d'Adnān sont généralement traitées avec prudence, car les récits divergent.",
              )}
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
                    <p className="text-sm font-medium text-text">
                      {loc(lang, ancestor.label, ancestor.labelAr, ancestor.labelFr)}
                    </p>
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
              title: loc(lang, "Why tribes mattered", "لماذا كانت القبائل مهمة", "Pourquoi les tribus comptaient"),
              text: loc(
                lang,
                "In Arabia, a person's tribe affected protection, marriage, trade, alliances, retaliation, and political support.",
                "في الجزيرة العربية، كانت قبيلة الشخص تؤثر في الحماية والزواج والتجارة والتحالفات والقصاص والدعم السياسي.",
                "En Arabie, la tribu d'une personne influençait la protection, le mariage, le commerce, les alliances, la riposte et le soutien politique.",
              ),
            },
            {
              title: loc(lang, "Why Quraysh mattered", "لماذا كانت قريش مهمة", "Pourquoi Quraysh comptait"),
              text: loc(
                lang,
                "Quraysh controlled Makkah's leadership and held major influence through the Ka'bah, pilgrimage, and trade.",
                "تحكّمت قريش في قيادة مكة، وكان لها نفوذ كبير من خلال الكعبة والحج والتجارة.",
                "Quraysh contrôlait la direction de La Mecque et exerçait une grande influence via la Kaʿbah, le pèlerinage et le commerce.",
              ),
            },
            {
              title: loc(lang, "Why Banu Hashim mattered", "لماذا كان بنو هاشم مهمين", "Pourquoi Banū Hāshim comptait"),
              text: loc(
                lang,
                "Banu Hashim was the Prophet's ﷺ clan. Even before many accepted Islam, tribal protection played a major role in the Makkan period.",
                "كان بنو هاشم عشيرة النبي ﷺ. وحتى قبل أن يعتنق كثير منهم الإسلام، لعبت الحماية القبلية دورًا كبيرًا في الفترة المكية.",
                "Banū Hāshim était le clan du Prophète ﷺ. Même avant que beaucoup n'acceptent l'islam, la protection tribale joua un rôle majeur à la période mecquoise.",
              ),
            },
            {
              title: loc(lang, "Why Aws and Khazraj mattered", "لماذا كان الأوس والخزرج مهمين", "Pourquoi Aws et Khazraj comptaient"),
              text: loc(
                lang,
                "Aws and Khazraj became the Ansar, the supporters of the Prophet ﷺ in Madinah after the Hijrah.",
                "أصبح الأوس والخزرج الأنصار، أي أنصار النبي ﷺ في المدينة بعد الهجرة.",
                "Aws et Khazraj devinrent les Anṣār, les partisans du Prophète ﷺ à Médine après l'Hégire.",
              ),
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
              placeholder={loc(lang, "Search tribes, clans, or lineage…", "ابحث في القبائل والبطون والنسب…", "Rechercher tribus, clans ou lignée…")}
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
                  {categoryLabel(lang, category)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quraysh Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-text mb-4">
            {loc(lang, "Quraysh and Makkah", "قريش ومكة", "Quraysh et La Mecque")}
          </h2>
          <p className="text-sm text-text-secondary mb-6 leading-relaxed">
            {loc(
              lang,
              "Quraysh was the major tribe of Makkah. It held religious, social, and economic influence because of its connection to the Ka'bah, pilgrimage, and trade. The Prophet ﷺ belonged to Banu Hashim, one of the noble clans of Quraysh.",
              "كانت قريش القبيلة الكبرى في مكة. كان لها نفوذ ديني واجتماعي واقتصادي بسبب صلتها بالكعبة والحج والتجارة. وكان النبي ﷺ من بني هاشم، إحدى العشائر النبيلة في قريش.",
              "Quraysh était la grande tribu de La Mecque. Elle détenait une influence religieuse, sociale et économique grâce à son lien avec la Kaʿbah, le pèlerinage et le commerce. Le Prophète ﷺ appartenait à Banū Hāshim, l'un des clans nobles de Quraysh.",
            )}
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {QURAYSH_CLANS.filter((t) =>
              selectedCategory === "All" ||
              t.category === selectedCategory ||
              (searchQuery && filteredTribes.includes(t))
            ).map((tribe, index) => (
              <TribeCard key={index} tribe={tribe} lang={lang} />
            ))}
          </div>
        </section>

        {/* Madinah Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-text mb-4">
            {loc(lang, "Madinah: Aws, Khazraj, and the Ansar", "المدينة: الأوس والخزرج والأنصار", "Médine : Aws, Khazraj et les Anṣār")}
          </h2>
          <p className="text-sm text-text-secondary mb-6 leading-relaxed">
            {loc(
              lang,
              "Before the Hijrah, Madinah was known as Yathrib. Its two major Arab tribes were Aws and Khazraj. After supporting the Prophet ﷺ and the Muhajirun, they became known as the Ansar.",
              "قبل الهجرة، كانت المدينة تُعرف بيثرب. وكانت قبيلتاها العربيتان الكبريان الأوس والخزرج. وبعد أن ناصروا النبي ﷺ والمهاجرين، عُرفوا بالأنصار.",
              "Avant l'Hégire, Médine était connue sous le nom de Yathrib. Ses deux grandes tribus arabes étaient Aws et Khazraj. Après avoir soutenu le Prophète ﷺ et les Muhājirūn, ils furent connus comme les Anṣār.",
            )}
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {MADINAH_TRIBES.filter((t) =>
              selectedCategory === "All" ||
              t.category === selectedCategory ||
              (searchQuery && filteredTribes.includes(t))
            ).map((tribe, index) => (
              <TribeCard key={index} tribe={tribe} lang={lang} />
            ))}
          </div>
          <div className="p-4 rounded-xl border border-border/50 bg-surface-raised/40 text-sm text-text-muted">
            <p className="flex gap-2">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                {loc(
                  lang,
                  "The Jewish tribes are included because they were part of the political and social landscape of Madinah during the Seerah.",
                  "أُدرجت القبائل اليهودية لأنها كانت جزءًا من المشهد السياسي والاجتماعي في المدينة خلال أحداث السيرة.",
                  "Les tribus juives sont incluses car elles faisaient partie du paysage politique et social de Médine pendant la Sīrah.",
                )}
              </span>
            </p>
          </div>
        </section>

        {/* Other Tribes Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-text">
              {loc(lang, "Other Important Tribes", "قبائل مهمة أخرى", "Autres tribus importantes")}
            </h2>
            <button
              onClick={() => setShowMoreTribes(!showMoreTribes)}
              className="inline-flex items-center gap-1 text-sm font-medium text-gold hover:text-gold-light transition-colors"
            >
              {showMoreTribes
                ? loc(lang, "Show Less", "عرض أقل", "Afficher moins")
                : loc(lang, "View More Tribes", "عرض المزيد من القبائل", "Voir plus de tribus")}
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
                <TribeCard key={index} tribe={tribe} lang={lang} />
              ))}
            </div>
          )}
        </section>

        {/* CTA */}
        <section className="pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div>
              <p className="text-sm text-text-muted mb-1">
                {loc(lang, "Ready to go deeper?", "تريد التعمق أكثر؟", "Prêt à aller plus loin ?")}
              </p>
              <p className="text-base font-semibold text-text">
                {loc(
                  lang,
                  "See how these tribes and clans connect throughout the full Seerah.",
                  "تعرّف على كيفية ارتباط هذه القبائل والعشائر عبر السيرة الكاملة.",
                  "Découvrez comment ces tribus et clans s'entrelacent tout au long de la Sīrah.",
                )}
              </p>
            </div>
            <Link
              href="/seerah"
              className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-ink font-semibold text-sm hover:bg-gold-light transition-colors"
            >
              {loc(lang, "Continue Learning the Seerah", "استمر في تعلّم السيرة النبوية", "Continuer à apprendre la Sīrah")}
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
            {loc(lang, "Back to Reference Library", "العودة إلى مكتبة المراجع", "Retour à la bibliothèque de référence")}
          </Link>
        </div>

      </div>
    </main>
  );
}

// ── Tribe Card Component ───────────────────────────────────────────────────────

function TribeCard({ tribe, lang }: { tribe: Tribe; lang: CourseLang }) {
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
        <h3 className="text-base font-bold text-text">
          {loc(lang, tribe.name, tribe.nameAr, tribe.nameFr)}
        </h3>
        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border flex-shrink-0 ${badgeColor}`}>
          {categoryLabel(lang, tribe.category)}
        </span>
      </div>
      <p className="text-xs font-medium text-gold mb-2">
        {loc(lang, tribe.type, tribe.typeAr, tribe.typeFr)}
      </p>
      <p className="text-xs text-text-muted mb-2">
        {loc(lang, tribe.connection, tribe.connectionAr, tribe.connectionFr)}
      </p>
      <p className="text-xs text-text-secondary leading-relaxed">
        {loc(lang, tribe.description, tribe.descriptionAr, tribe.descriptionFr)}
      </p>
    </div>
  );
}
