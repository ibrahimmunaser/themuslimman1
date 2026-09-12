"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Info, Swords, Flag, Shield } from "lucide-react";
import type { CourseLang } from "@/lib/course-lang";
import { loc } from "@/lib/loc";

interface Event {
  id: number;
  name: string;
  nameAr: string;
  nameFr: string;
  type: string;
  typeAr: string;
  typeFr: string;
  hijriYear: string;
  approximateCE?: string;
  location: string;
  locationAr: string;
  locationFr: string;
  region?: string;
  regionAr?: string;
  regionFr?: string;
  relatedParties: string;
  relatedPartiesAr: string;
  relatedPartiesFr: string;
  summary: string;
  summaryAr: string;
  summaryFr: string;
  keyLesson: string;
  keyLessonAr: string;
  keyLessonFr: string;
  importance: "Major" | "Medium" | "Reference";
  fightingOccurred: "Yes" | "No" | "Limited" | "Siege" | "Disputed";
  categoryTags: string[];
  section: "battles" | "campaigns" | "expeditions" | "treaties";
}

const EVENTS_DATA: Event[] = [
  // MAJOR BATTLES
  {
    id: 1,
    name: "Battle of Badr",
    nameAr: "غزوة بدر",
    nameFr: "Bataille de Badr",
    type: "Ghazwah / Major Battle",
    typeAr: "غزوة / معركة كبرى",
    typeFr: "Ghazwa / Bataille majeure",
    hijriYear: "2 AH",
    approximateCE: "624 CE",
    location: "Badr",
    locationAr: "بدر",
    locationFr: "Badr",
    relatedParties: "Muslims and Quraysh",
    relatedPartiesAr: "المسلمون وقريش",
    relatedPartiesFr: "Musulmans et Quraysh",
    summary: "The first major battle between the Muslims and Quraysh.",
    summaryAr: "أول معركة كبرى بين المسلمين وقريش.",
    summaryFr: "La première grande bataille entre les musulmans et Quraysh.",
    keyLesson: "Trust in Allah, preparation, unity, and courage.",
    keyLessonAr: "التوكل على الله، والإعداد، والوحدة، والشجاعة.",
    keyLessonFr: "Confiance en Allah, préparation, unité et courage.",
    importance: "Major",
    fightingOccurred: "Yes",
    categoryTags: ["Major Battles", "Ghazwah", "Quraysh", "Fighting Occurred", "Early Madinan Period"],
    section: "battles",
  },
  {
    id: 2,
    name: "Battle of Uhud",
    nameAr: "غزوة أُحُد",
    nameFr: "Bataille d'Uḥud",
    type: "Ghazwah / Major Battle",
    typeAr: "غزوة / معركة كبرى",
    typeFr: "Ghazwa / Bataille majeure",
    hijriYear: "3 AH",
    approximateCE: "625 CE",
    location: "Mount Uhud, near Madinah",
    locationAr: "جبل أُحُد، قرب المدينة",
    locationFr: "Mont Uḥud, près de Médine",
    relatedParties: "Muslims and Quraysh",
    relatedPartiesAr: "المسلمون وقريش",
    relatedPartiesFr: "Musulmans et Quraysh",
    summary: "Quraysh returned after Badr, and the Muslims faced a painful test.",
    summaryAr: "عادت قريش بعد بدر، وواجه المسلمون ابتلاءً مؤلمًا.",
    summaryFr: "Quraysh revint après Badr, et les musulmans affrontèrent une épreuve douloureuse.",
    keyLesson: "Obedience, discipline, patience, and consequences of disunity.",
    keyLessonAr: "الطاعة، والانضباط، والصبر، وعواقب الفرقة.",
    keyLessonFr: "Obéissance, discipline, patience et conséquences de la division.",
    importance: "Major",
    fightingOccurred: "Yes",
    categoryTags: ["Major Battles", "Ghazwah", "Quraysh", "Madinah-Related", "Fighting Occurred", "Early Madinan Period"],
    section: "battles",
  },
  {
    id: 3,
    name: "Battle of the Trench / Al-Ahzab",
    nameAr: "غزوة الخندق / الأحزاب",
    nameFr: "Bataille du Fossé / al-Khandaq / al-Aḥzāb",
    type: "Ghazwah / Major Defensive Campaign",
    typeAr: "غزوة / حملة دفاعية كبرى",
    typeFr: "Ghazwa / Campagne défensive majeure",
    hijriYear: "5 AH",
    approximateCE: "627 CE",
    location: "Madinah",
    locationAr: "المدينة",
    locationFr: "Médine",
    relatedParties: "Muslims and the Confederates",
    relatedPartiesAr: "المسلمون والأحزاب",
    relatedPartiesFr: "Musulmans et les Confédérés",
    summary: "A large coalition came against Madinah, and the Muslims defended the city by digging a trench.",
    summaryAr: "زحف تحالف كبير على المدينة، فدافع المسلمون عن المدينة بحفر خندق.",
    summaryFr: "Une large coalition marcha contre Médine, et les musulmans défendirent la ville en creusant un fossé.",
    keyLesson: "Strategy, consultation, patience, and Allah's protection.",
    keyLessonAr: "التخطيط، والشورى، والصبر، وحفظ الله.",
    keyLessonFr: "Stratégie, consultation, patience et protection d'Allah.",
    importance: "Major",
    fightingOccurred: "Limited",
    categoryTags: ["Major Battles", "Ghazwah", "Madinah-Related", "Fighting Occurred", "Early Madinan Period"],
    section: "battles",
  },
  {
    id: 4,
    name: "Banu Qurayzah",
    nameAr: "بنو قريظة",
    nameFr: "Banū Qurayẓa",
    type: "Ghazwah / Siege",
    typeAr: "غزوة / حصار",
    typeFr: "Ghazwa / Siège",
    hijriYear: "5 AH",
    location: "Madinah",
    locationAr: "المدينة",
    locationFr: "Médine",
    relatedParties: "Muslims and Banu Qurayzah",
    relatedPartiesAr: "المسلمون وبنو قريظة",
    relatedPartiesFr: "Musulmans et Banū Qurayẓa",
    summary: "This event followed the Battle of the Trench and involved treaty betrayal during a time of siege.",
    summaryAr: "وقع هذا الحدث عقب غزوة الخندق، وتضمّن نقض العهد أثناء الحصار.",
    summaryFr: "Cet événement suivit la bataille du Fossé et impliqua une trahison de traité durant un siège.",
    keyLesson: "Treaties, loyalty, justice, and consequences.",
    keyLessonAr: "العهود، والوفاء، والعدل، والعواقب.",
    keyLessonFr: "Traités, loyauté, justice et conséquences.",
    importance: "Major",
    fightingOccurred: "Siege",
    categoryTags: ["Major Battles", "Ghazwah", "Jewish Tribes of Madinah", "Madinah-Related", "Early Madinan Period"],
    section: "campaigns",
  },
  {
    id: 5,
    name: "Banu Mustaliq / Al-Muraysi'",
    nameAr: "بنو المصطلق / المريسيع",
    nameFr: "Banū al-Muṣṭaliq / al-Muraysīʿ",
    type: "Ghazwah / Campaign",
    typeAr: "غزوة / حملة",
    typeFr: "Ghazwa / Campagne",
    hijriYear: "5 or 6 AH",
    location: "Al-Muraysi'",
    locationAr: "المريسيع",
    locationFr: "Al-Muraysīʿ",
    relatedParties: "Muslims and Banu Mustaliq",
    relatedPartiesAr: "المسلمون وبنو المصطلق",
    relatedPartiesFr: "Musulmans et Banū al-Muṣṭaliq",
    summary: "A campaign connected to Banu Mustaliq and important social events in the Seerah.",
    summaryAr: "حملة تتعلق ببني المصطلق وأحداث اجتماعية مهمة في السيرة.",
    summaryFr: "Une campagne liée à Banū al-Muṣṭaliq et à d'importants événements sociaux de la Sîra.",
    keyLesson: "Community discipline, handling rumors, and leadership.",
    keyLessonAr: "انضباط المجتمع، والتعامل مع الإشاعات، والقيادة.",
    keyLessonFr: "Discipline communautaire, gestion des rumeurs et leadership.",
    importance: "Major",
    fightingOccurred: "Yes",
    categoryTags: ["Major Battles", "Ghazwah", "Fighting Occurred", "Early Madinan Period"],
    section: "battles",
  },
  {
    id: 6,
    name: "Khaybar",
    nameAr: "خيبر",
    nameFr: "Khaybar",
    type: "Ghazwah / Major Campaign",
    typeAr: "غزوة / حملة كبرى",
    typeFr: "Ghazwa / Campagne majeure",
    hijriYear: "7 AH",
    approximateCE: "628 CE",
    location: "Khaybar",
    locationAr: "خيبر",
    locationFr: "Khaybar",
    relatedParties: "Muslims and the people of Khaybar",
    relatedPartiesAr: "المسلمون وأهل خيبر",
    relatedPartiesFr: "Musulmans et habitants de Khaybar",
    summary: "A major campaign against fortified settlements north of Madinah.",
    summaryAr: "حملة كبرى ضد الحصون المنيعة شمال المدينة.",
    summaryFr: "Une campagne majeure contre des établissements fortifiés au nord de Médine.",
    keyLesson: "Patience, strategy, leadership, and reliance upon Allah.",
    keyLessonAr: "الصبر، والتخطيط، والقيادة، والتوكل على الله.",
    keyLessonFr: "Patience, stratégie, leadership et reliance sur Allah.",
    importance: "Major",
    fightingOccurred: "Yes",
    categoryTags: ["Major Battles", "Ghazwah", "Fighting Occurred", "Late Madinan Period"],
    section: "battles",
  },
  {
    id: 7,
    name: "Conquest of Makkah",
    nameAr: "فتح مكة",
    nameFr: "Conquête de La Mecque",
    type: "Ghazwah / Opening of Makkah",
    typeAr: "غزوة / فتح مكة",
    typeFr: "Ghazwa / Ouverture de La Mecque",
    hijriYear: "8 AH",
    approximateCE: "630 CE",
    location: "Makkah",
    locationAr: "مكة",
    locationFr: "La Mecque",
    relatedParties: "Muslims and Quraysh",
    relatedPartiesAr: "المسلمون وقريش",
    relatedPartiesFr: "Musulmans et Quraysh",
    summary: "The Prophet ﷺ entered Makkah victoriously after Quraysh's treaty violation.",
    summaryAr: "دخل النبي ﷺ مكة فاتحًا بعد نقض قريش للعهد.",
    summaryFr: "Le Prophète ﷺ entra victorieusement à La Mecque après la violation du traité par Quraysh.",
    keyLesson: "Mercy, forgiveness, humility, and the victory of truth.",
    keyLessonAr: "الرحمة، والعفو، والتواضع، وانتصار الحق.",
    keyLessonFr: "Miséricorde, pardon, humilité et victoire de la vérité.",
    importance: "Major",
    fightingOccurred: "Limited",
    categoryTags: ["Major Battles", "Ghazwah", "Makkah-Related", "Quraysh", "Late Madinan Period"],
    section: "battles",
  },
  {
    id: 8,
    name: "Battle of Hunayn",
    nameAr: "غزوة حنين",
    nameFr: "Bataille de Ḥunayn",
    type: "Ghazwah / Major Battle",
    typeAr: "غزوة / معركة كبرى",
    typeFr: "Ghazwa / Bataille majeure",
    hijriYear: "8 AH",
    approximateCE: "630 CE",
    location: "Hunayn",
    locationAr: "حنين",
    locationFr: "Ḥunayn",
    relatedParties: "Muslims, Hawazin, and Thaqif",
    relatedPartiesAr: "المسلمون وهوازن وثقيف",
    relatedPartiesFr: "Musulmans, Hawāzin et Thaqīf",
    summary: "A major battle shortly after the conquest of Makkah.",
    summaryAr: "معركة كبرى وقعت بُعيد فتح مكة.",
    summaryFr: "Une bataille majeure peu après la conquête de La Mecque.",
    keyLesson: "Do not rely on numbers; victory comes from Allah.",
    keyLessonAr: "لا تعتمد على كثرة العدد؛ فالنصر من عند الله.",
    keyLessonFr: "Ne pas compter sur le nombre ; la victoire vient d'Allah.",
    importance: "Major",
    fightingOccurred: "Yes",
    categoryTags: ["Major Battles", "Ghazwah", "Fighting Occurred", "Late Madinan Period"],
    section: "battles",
  },
  {
    id: 9,
    name: "Siege of Ta'if",
    nameAr: "حصار الطائف",
    nameFr: "Siège de Ṭāʾif",
    type: "Ghazwah / Siege",
    typeAr: "غزوة / حصار",
    typeFr: "Ghazwa / Siège",
    hijriYear: "8 AH",
    approximateCE: "630 CE",
    location: "Ta'if",
    locationAr: "الطائف",
    locationFr: "Ṭāʾif",
    relatedParties: "Muslims and Thaqif",
    relatedPartiesAr: "المسلمون وثقيف",
    relatedPartiesFr: "Musulmans et Thaqīf",
    summary: "The Muslims moved toward Ta'if after Hunayn.",
    summaryAr: "توجّه المسلمون إلى الطائف بعد حنين.",
    summaryFr: "Les musulmans se dirigèrent vers Ṭāʾif après Ḥunayn.",
    keyLesson: "Patience, restraint, and leaving guidance to Allah.",
    keyLessonAr: "الصبر، وضبط النفس، وتفويض الهداية لله.",
    keyLessonFr: "Patience, retenue et laisser la guidance à Allah.",
    importance: "Major",
    fightingOccurred: "Siege",
    categoryTags: ["Major Battles", "Ghazwah", "Late Madinan Period"],
    section: "campaigns",
  },

  // MAJOR CAMPAIGNS AND SIEGES
  {
    id: 10,
    name: "Banu Qaynuqa",
    nameAr: "بنو قينقاع",
    nameFr: "Banū Qaynuqāʿ",
    type: "Ghazwah / Madinan Campaign",
    typeAr: "غزوة / حملة مدنية",
    typeFr: "Ghazwa / Campagne médinoise",
    hijriYear: "2 AH",
    location: "Madinah",
    locationAr: "المدينة",
    locationFr: "Médine",
    relatedParties: "Muslims and Banu Qaynuqa",
    relatedPartiesAr: "المسلمون وبنو قينقاع",
    relatedPartiesFr: "Musulmans et Banū Qaynuqāʿ",
    summary: "One of the early Madinan treaty-related conflicts.",
    summaryAr: "أحد أولى النزاعات المتعلقة بالعهود في المدينة.",
    summaryFr: "L'un des premiers conflits médinois liés aux traités.",
    keyLesson: "Community security and treaty responsibility.",
    keyLessonAr: "أمن المجتمع والمسؤولية تجاه العهود.",
    keyLessonFr: "Sécurité communautaire et responsabilité des traités.",
    importance: "Medium",
    fightingOccurred: "Siege",
    categoryTags: ["Ghazwah", "Jewish Tribes of Madinah", "Madinah-Related", "Early Madinan Period"],
    section: "campaigns",
  },
  {
    id: 11,
    name: "Sawiq Campaign",
    nameAr: "غزوة السويق",
    nameFr: "Campagne de Sawīq",
    type: "Ghazwah / Pursuit Campaign",
    typeAr: "غزوة / حملة مطاردة",
    typeFr: "Ghazwa / Campagne de poursuite",
    hijriYear: "2 AH",
    location: "Around Madinah",
    locationAr: "حول المدينة",
    locationFr: "Aux environs de Médine",
    relatedParties: "Muslims and Abu Sufyan's party",
    relatedPartiesAr: "المسلمون وجماعة أبي سفيان",
    relatedPartiesFr: "Musulmans et le groupe d'Abū Sufyān",
    summary: "A pursuit after an attack connected to Quraysh hostility.",
    summaryAr: "مطاردة عقب هجوم مرتبط بعداء قريش.",
    summaryFr: "Une poursuite après une attaque liée à l'hostilité de Quraysh.",
    keyLesson: "Readiness and protection of the community.",
    keyLessonAr: "الاستعداد وحماية المجتمع.",
    keyLessonFr: "Préparation et protection de la communauté.",
    importance: "Reference",
    fightingOccurred: "Limited",
    categoryTags: ["Ghazwah", "Quraysh", "Madinah-Related", "Early Madinan Period"],
    section: "campaigns",
  },
  {
    id: 12,
    name: "Dhu Amarr / Ghatafan Campaign",
    nameAr: "غزوة ذي أمر / غطفان",
    nameFr: "Campagne de Dhū Amarr / Ghaṭafān",
    type: "Ghazwah",
    typeAr: "غزوة",
    typeFr: "Ghazwa",
    hijriYear: "3 AH",
    location: "Najd region",
    locationAr: "منطقة نجد",
    locationFr: "Région du Najd",
    relatedParties: "Muslims and Ghatafan-related groups",
    relatedPartiesAr: "المسلمون وجماعات مرتبطة بغطفان",
    relatedPartiesFr: "Musulmans et groupes liés à Ghaṭafān",
    summary: "A campaign connected to threats from Najd.",
    summaryAr: "حملة مرتبطة بتهديدات قادمة من نجد.",
    summaryFr: "Une campagne liée à des menaces venues du Najd.",
    keyLesson: "Deterrence and vigilance.",
    keyLessonAr: "الردع واليقظة.",
    keyLessonFr: "Dissuasion et vigilance.",
    importance: "Reference",
    fightingOccurred: "No",
    categoryTags: ["Ghazwah", "No Fighting", "Early Madinan Period"],
    section: "campaigns",
  },
  {
    id: 13,
    name: "Bahran Campaign",
    nameAr: "غزوة بحران",
    nameFr: "Campagne de Baḥrān",
    type: "Ghazwah",
    typeAr: "غزوة",
    typeFr: "Ghazwa",
    hijriYear: "3 AH",
    location: "Bahran",
    locationAr: "بحران",
    locationFr: "Baḥrān",
    relatedParties: "Muslims and tribal groups",
    relatedPartiesAr: "المسلمون وجماعات قبلية",
    relatedPartiesFr: "Musulmans et groupes tribaux",
    summary: "A campaign during the early Madinan period.",
    summaryAr: "حملة خلال العهد المدني المبكر.",
    summaryFr: "Une campagne du début de la période médinoise.",
    keyLesson: "Monitoring threats and maintaining security.",
    keyLessonAr: "مراقبة التهديدات والحفاظ على الأمن.",
    keyLessonFr: "Surveiller les menaces et maintenir la sécurité.",
    importance: "Reference",
    fightingOccurred: "No",
    categoryTags: ["Ghazwah", "No Fighting", "Early Madinan Period"],
    section: "campaigns",
  },
  {
    id: 14,
    name: "Hamra al-Asad",
    nameAr: "حمراء الأسد",
    nameFr: "Ḥamrāʾ al-Asad",
    type: "Ghazwah / Pursuit Campaign",
    typeAr: "غزوة / حملة مطاردة",
    typeFr: "Ghazwa / Campagne de poursuite",
    hijriYear: "3 AH",
    location: "Near Madinah",
    locationAr: "قرب المدينة",
    locationFr: "Près de Médine",
    relatedParties: "Muslims and Quraysh",
    relatedPartiesAr: "المسلمون وقريش",
    relatedPartiesFr: "Musulmans et Quraysh",
    summary: "The Muslims pursued Quraysh after Uhud to show strength and prevent another attack.",
    summaryAr: "طارد المسلمون قريشًا بعد أُحُد لإظهار القوة ومنع هجوم آخر.",
    summaryFr: "Les musulmans poursuivirent Quraysh après Uḥud pour montrer leur force et prévenir une nouvelle attaque.",
    keyLesson: "Resilience after hardship.",
    keyLessonAr: "الصمود بعد الشدة.",
    keyLessonFr: "Résilience après l'épreuve.",
    importance: "Medium",
    fightingOccurred: "No",
    categoryTags: ["Ghazwah", "Quraysh", "Madinah-Related", "No Fighting", "Early Madinan Period"],
    section: "campaigns",
  },
  {
    id: 15,
    name: "Banu Nadir",
    nameAr: "بنو النضير",
    nameFr: "Banū al-Naḍīr",
    type: "Ghazwah / Siege",
    typeAr: "غزوة / حصار",
    typeFr: "Ghazwa / Siège",
    hijriYear: "4 AH",
    location: "Madinah",
    locationAr: "المدينة",
    locationFr: "Médine",
    relatedParties: "Muslims and Banu Nadir",
    relatedPartiesAr: "المسلمون وبنو النضير",
    relatedPartiesFr: "Musulmans et Banū al-Naḍīr",
    summary: "A major Madinan treaty-related event that led to the removal of Banu Nadir.",
    summaryAr: "حدث مدني كبير متعلق بالعهود أدى إلى إجلاء بني النضير.",
    summaryFr: "Un événement médinois majeur lié aux traités qui conduisit au départ de Banū al-Naḍīr.",
    keyLesson: "Treaty responsibility and internal security.",
    keyLessonAr: "المسؤولية تجاه العهود والأمن الداخلي.",
    keyLessonFr: "Responsabilité des traités et sécurité intérieure.",
    importance: "Major",
    fightingOccurred: "Siege",
    categoryTags: ["Ghazwah", "Jewish Tribes of Madinah", "Madinah-Related", "Early Madinan Period"],
    section: "campaigns",
  },
  {
    id: 16,
    name: "Dhat al-Riqa'",
    nameAr: "غزوة ذات الرقاع",
    nameFr: "Dhāt al-Riqāʿ",
    type: "Ghazwah",
    typeAr: "غزوة",
    typeFr: "Ghazwa",
    hijriYear: "4 or 5 AH",
    location: "Najd region",
    locationAr: "منطقة نجد",
    locationFr: "Région du Najd",
    relatedParties: "Muslims and tribal groups",
    relatedPartiesAr: "المسلمون وجماعات قبلية",
    relatedPartiesFr: "Musulmans et groupes tribaux",
    summary: "A campaign connected to threats from tribes in the Najd region.",
    summaryAr: "حملة مرتبطة بتهديدات من قبائل منطقة نجد.",
    summaryFr: "Une campagne liée à des menaces de tribus de la région du Najd.",
    keyLesson: "Prayer in danger, readiness, and discipline.",
    keyLessonAr: "الصلاة وقت الخوف، والاستعداد، والانضباط.",
    keyLessonFr: "Prière en danger, préparation et discipline.",
    importance: "Medium",
    fightingOccurred: "Limited",
    categoryTags: ["Ghazwah", "Early Madinan Period"],
    section: "campaigns",
  },
  {
    id: 17,
    name: "Dumat al-Jandal",
    nameAr: "دومة الجندل",
    nameFr: "Dūmat al-Jandal",
    type: "Ghazwah",
    typeAr: "غزوة",
    typeFr: "Ghazwa",
    hijriYear: "5 AH",
    location: "Northern Arabia",
    locationAr: "شمال الجزيرة العربية",
    locationFr: "Arabie du Nord",
    relatedParties: "Muslims and northern tribal groups",
    relatedPartiesAr: "المسلمون وجماعات قبلية شمالية",
    relatedPartiesFr: "Musulmans et groupes tribaux du nord",
    summary: "A northern campaign connected to securing routes and responding to threats.",
    summaryAr: "حملة شمالية لتأمين الطرق والرد على التهديدات.",
    summaryFr: "Une campagne septentrionale visant à sécuriser les routes et répondre aux menaces.",
    keyLesson: "Strategic reach and protecting the community.",
    keyLessonAr: "الامتداد الاستراتيجي وحماية المجتمع.",
    keyLessonFr: "Portée stratégique et protection de la communauté.",
    importance: "Medium",
    fightingOccurred: "No",
    categoryTags: ["Ghazwah", "No Fighting", "Early Madinan Period"],
    section: "campaigns",
  },
  {
    id: 18,
    name: "Banu Lahyan",
    nameAr: "بنو لحيان",
    nameFr: "Banū Liḥyān",
    type: "Ghazwah",
    typeAr: "غزوة",
    typeFr: "Ghazwa",
    hijriYear: "6 AH",
    location: "Region connected to Hudhayl",
    locationAr: "منطقة مرتبطة بهذيل",
    locationFr: "Région liée à Hudhayl",
    relatedParties: "Muslims and Banu Lahyan",
    relatedPartiesAr: "المسلمون وبنو لحيان",
    relatedPartiesFr: "Musulmans et Banū Liḥyān",
    summary: "A campaign connected to earlier harm suffered by Muslim teachers and envoys.",
    summaryAr: "حملة مرتبطة بأذى سابق لحق بمعلمين ومبعوثين مسلمين.",
    summaryFr: "Une campagne liée à des préjudices antérieurs subis par des enseignants et envoyés musulmans.",
    keyLesson: "Justice, memory, and caution in da'wah missions.",
    keyLessonAr: "العدل، والذاكرة، والحذر في بعثات الدعوة.",
    keyLessonFr: "Justice, mémoire et prudence dans les missions de daʿwa.",
    importance: "Medium",
    fightingOccurred: "No",
    categoryTags: ["Ghazwah", "No Fighting", "Late Madinan Period"],
    section: "campaigns",
  },
  {
    id: 19,
    name: "Dhu Qarad / Al-Ghabah",
    nameAr: "ذو قرد / الغابة",
    nameFr: "Dhū Qarad / al-Ghāba",
    type: "Ghazwah / Pursuit Campaign",
    typeAr: "غزوة / حملة مطاردة",
    typeFr: "Ghazwa / Campagne de poursuite",
    hijriYear: "6 AH",
    location: "Near Madinah",
    locationAr: "قرب المدينة",
    locationFr: "Près de Médine",
    relatedParties: "Muslims and raiders",
    relatedPartiesAr: "المسلمون والمغيرون",
    relatedPartiesFr: "Musulmans et pillards",
    summary: "A pursuit after livestock were attacked near Madinah.",
    summaryAr: "مطاردة عقب الإغارة على الماشية قرب المدينة.",
    summaryFr: "Une poursuite après une attaque contre le bétail près de Médine.",
    keyLesson: "Quick response and community protection.",
    keyLessonAr: "سرعة الاستجابة وحماية المجتمع.",
    keyLessonFr: "Réaction rapide et protection de la communauté.",
    importance: "Medium",
    fightingOccurred: "Limited",
    categoryTags: ["Ghazwah", "Madinah-Related", "Late Madinan Period"],
    section: "campaigns",
  },
  {
    id: 20,
    name: "Hudaybiyyah",
    nameAr: "الحديبية",
    nameFr: "al-Ḥudaybiyya",
    type: "Ghazwah / Treaty Event",
    typeAr: "غزوة / حدث معاهدة",
    typeFr: "Ghazwa / Événement de traité",
    hijriYear: "6 AH",
    approximateCE: "628 CE",
    location: "Hudaybiyyah, near Makkah",
    locationAr: "الحديبية، قرب مكة",
    locationFr: "al-Ḥudaybiyya, près de La Mecque",
    relatedParties: "Muslims and Quraysh",
    relatedPartiesAr: "المسلمون وقريش",
    relatedPartiesFr: "Musulmans et Quraysh",
    summary: "The Muslims set out for Umrah but were prevented, leading to the Treaty of Hudaybiyyah.",
    summaryAr: "خرج المسلمون لأداء العمرة فمُنعوا، مما أدى إلى صلح الحديبية.",
    summaryFr: "Les musulmans partirent pour la ʿUmra mais furent empêchés, ce qui mena au traité d'al-Ḥudaybiyya.",
    keyLesson: "Long-term wisdom, patience, and strategic peace.",
    keyLessonAr: "الحكمة بعيدة المدى، والصبر، والسلام الاستراتيجي.",
    keyLessonFr: "Sagesse à long terme, patience et paix stratégique.",
    importance: "Major",
    fightingOccurred: "No",
    categoryTags: ["Ghazwah", "Treaty Events", "Makkah-Related", "Quraysh", "No Fighting", "Late Madinan Period"],
    section: "treaties",
  },
  {
    id: 21,
    name: "Umrat al-Qada",
    nameAr: "عمرة القضاء",
    nameFr: "ʿUmrat al-Qaḍāʾ",
    type: "Journey / Fulfilled Umrah",
    typeAr: "رحلة / عمرة مقضية",
    typeFr: "Voyage / ʿUmra accomplie",
    hijriYear: "7 AH",
    location: "Makkah",
    locationAr: "مكة",
    locationFr: "La Mecque",
    relatedParties: "Muslims and Quraysh",
    relatedPartiesAr: "المسلمون وقريش",
    relatedPartiesFr: "Musulmans et Quraysh",
    summary: "The Muslims returned to perform the Umrah they had been prevented from performing the year before.",
    summaryAr: "عاد المسلمون لأداء العمرة التي مُنعوا منها في العام السابق.",
    summaryFr: "Les musulmans revinrent accomplir la ʿUmra dont ils avaient été empêchés l'année précédente.",
    keyLesson: "Patience and fulfillment of agreements.",
    keyLessonAr: "الصبر والوفاء بالعهود.",
    keyLessonFr: "Patience et respect des accords.",
    importance: "Medium",
    fightingOccurred: "No",
    categoryTags: ["Makkah-Related", "Quraysh", "Treaty Events", "No Fighting", "Late Madinan Period"],
    section: "treaties",
  },
  {
    id: 22,
    name: "Tabuk",
    nameAr: "غزوة تبوك",
    nameFr: "Tabūk",
    type: "Ghazwah / Major Expedition",
    typeAr: "غزوة / حملة كبرى",
    typeFr: "Ghazwa / Expédition majeure",
    hijriYear: "9 AH",
    approximateCE: "630 CE",
    location: "Tabuk",
    locationAr: "تبوك",
    locationFr: "Tabūk",
    relatedParties: "Muslims and northern Byzantine-linked threat",
    relatedPartiesAr: "المسلمون وتهديد شمالي مرتبط بالروم",
    relatedPartiesFr: "Musulmans et menace septentrionale liée aux Byzantins",
    summary: "One of the last major expeditions in the Prophet's ﷺ life.",
    summaryAr: "من آخر الغزوات الكبرى في حياة النبي ﷺ.",
    summaryFr: "L'une des dernières grandes expéditions de la vie du Prophète ﷺ.",
    keyLesson: "Sacrifice, sincerity, hardship, and exposing hypocrisy.",
    keyLessonAr: "التضحية، والإخلاص، والمشقة، وكشف النفاق.",
    keyLessonFr: "Sacrifice, sincérité, épreuve et mise au jour de l'hypocrisie.",
    importance: "Major",
    fightingOccurred: "No",
    categoryTags: ["Ghazwah", "No Fighting", "Late Madinan Period"],
    section: "campaigns",
  },

  // KEY EXPEDITIONS AND PATROLS
  {
    id: 23,
    name: "Expedition of Hamzah ibn Abd al-Muttalib",
    nameAr: "سرية حمزة بن عبد المطلب",
    nameFr: "Expédition de Ḥamza ibn ʿAbd al-Muṭṭalib",
    type: "Sariyyah / Patrol",
    typeAr: "سرية / دورية",
    typeFr: "Sariyya / Patrouille",
    hijriYear: "1 AH",
    location: "Toward the Red Sea route",
    locationAr: "باتجاه طريق البحر الأحمر",
    locationFr: "Vers la route de la mer Rouge",
    relatedParties: "Muslims and Quraysh caravan route",
    relatedPartiesAr: "المسلمون وطريق قوافل قريش",
    relatedPartiesFr: "Musulmans et route des caravanes de Quraysh",
    summary: "One of the earliest Muslim patrols after the Hijrah.",
    summaryAr: "من أولى دوريات المسلمين بعد الهجرة.",
    summaryFr: "L'une des premières patrouilles musulmanes après l'Hégire.",
    keyLesson: "Establishing presence and protecting the new community.",
    keyLessonAr: "تثبيت الوجود وحماية المجتمع الناشئ.",
    keyLessonFr: "Établir une présence et protéger la nouvelle communauté.",
    importance: "Reference",
    fightingOccurred: "No",
    categoryTags: ["Sariyyah", "Quraysh", "No Fighting", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 24,
    name: "Expedition of Ubaydah ibn al-Harith",
    nameAr: "سرية عبيدة بن الحارث",
    nameFr: "Expédition de ʿUbayda ibn al-Ḥārith",
    type: "Sariyyah / Patrol",
    typeAr: "سرية / دورية",
    typeFr: "Sariyya / Patrouille",
    hijriYear: "1 AH",
    location: "Rabigh area",
    locationAr: "منطقة رابغ",
    locationFr: "Région de Rābigh",
    relatedParties: "Muslims and Quraysh",
    relatedPartiesAr: "المسلمون وقريش",
    relatedPartiesFr: "Musulmans et Quraysh",
    summary: "An early patrol during the first year after Hijrah.",
    summaryAr: "دورية مبكرة خلال السنة الأولى بعد الهجرة.",
    summaryFr: "Une patrouille précoce durant la première année après l'Hégire.",
    keyLesson: "Early defense and organized leadership.",
    keyLessonAr: "الدفاع المبكر والقيادة المنظمة.",
    keyLessonFr: "Défense précoce et leadership organisé.",
    importance: "Reference",
    fightingOccurred: "Limited",
    categoryTags: ["Sariyyah", "Quraysh", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 25,
    name: "Expedition of Sa'd ibn Abi Waqqas to al-Kharrar",
    nameAr: "سرية سعد بن أبي وقاص إلى الخرار",
    nameFr: "Expédition de Saʿd ibn Abī Waqqāṣ vers al-Kharrār",
    type: "Sariyyah / Patrol",
    typeAr: "سرية / دورية",
    typeFr: "Sariyya / Patrouille",
    hijriYear: "1 AH",
    location: "Al-Kharrar",
    locationAr: "الخرار",
    locationFr: "Al-Kharrār",
    relatedParties: "Muslims and Quraysh caravan route",
    relatedPartiesAr: "المسلمون وطريق قوافل قريش",
    relatedPartiesFr: "Musulmans et route des caravanes de Quraysh",
    summary: "An early patrol led by Sa'd ibn Abi Waqqas رضي الله عنه.",
    summaryAr: "دورية مبكرة بقيادة سعد بن أبي وقاص رضي الله عنه.",
    summaryFr: "Une patrouille précoce menée par Saʿd ibn Abī Waqqāṣ رضي الله عنه.",
    keyLesson: "Readiness and discipline.",
    keyLessonAr: "الاستعداد والانضباط.",
    keyLessonFr: "Préparation et discipline.",
    importance: "Reference",
    fightingOccurred: "No",
    categoryTags: ["Sariyyah", "Quraysh", "No Fighting", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 26,
    name: "Al-Abwa / Waddan",
    nameAr: "الأبواء / ودان",
    nameFr: "Al-Abwāʾ / Waddān",
    type: "Ghazwah",
    typeAr: "غزوة",
    typeFr: "Ghazwa",
    hijriYear: "1 AH",
    location: "Al-Abwa / Waddan",
    locationAr: "الأبواء / ودان",
    locationFr: "Al-Abwāʾ / Waddān",
    relatedParties: "Muslims and local tribal groups",
    relatedPartiesAr: "المسلمون وجماعات قبلية محلية",
    relatedPartiesFr: "Musulmans et groupes tribaux locaux",
    summary: "One of the earliest campaigns the Prophet ﷺ personally went out on.",
    summaryAr: "من أولى الغزوات التي خرج فيها النبي ﷺ بنفسه.",
    summaryFr: "L'une des premières campagnes auxquelles le Prophète ﷺ participa personnellement.",
    keyLesson: "Establishing treaties and presence outside Madinah.",
    keyLessonAr: "عقد المعاهدات وتثبيت الوجود خارج المدينة.",
    keyLessonFr: "Établir des traités et une présence hors de Médine.",
    importance: "Reference",
    fightingOccurred: "No",
    categoryTags: ["Ghazwah", "No Fighting", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 27,
    name: "Buwat",
    nameAr: "غزوة بواط",
    nameFr: "Buwāṭ",
    type: "Ghazwah",
    typeAr: "غزوة",
    typeFr: "Ghazwa",
    hijriYear: "2 AH",
    location: "Buwat",
    locationAr: "بواط",
    locationFr: "Buwāṭ",
    relatedParties: "Muslims and Quraysh caravan route",
    relatedPartiesAr: "المسلمون وطريق قوافل قريش",
    relatedPartiesFr: "Musulmans et route des caravanes de Quraysh",
    summary: "A campaign connected to Quraysh caravan movement.",
    summaryAr: "حملة مرتبطة بتحركات قوافل قريش.",
    summaryFr: "Une campagne liée aux mouvements des caravanes de Quraysh.",
    keyLesson: "Strategic pressure and community security.",
    keyLessonAr: "الضغط الاستراتيجي وأمن المجتمع.",
    keyLessonFr: "Pression stratégique et sécurité communautaire.",
    importance: "Reference",
    fightingOccurred: "No",
    categoryTags: ["Ghazwah", "Quraysh", "No Fighting", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 28,
    name: "Al-Ushayrah",
    nameAr: "غزوة العشيرة",
    nameFr: "Al-ʿUshayra",
    type: "Ghazwah",
    typeAr: "غزوة",
    typeFr: "Ghazwa",
    hijriYear: "2 AH",
    location: "Al-Ushayrah",
    locationAr: "العشيرة",
    locationFr: "Al-ʿUshayra",
    relatedParties: "Muslims and Quraysh caravan route",
    relatedPartiesAr: "المسلمون وطريق قوافل قريش",
    relatedPartiesFr: "Musulmans et route des caravanes de Quraysh",
    summary: "A campaign before Badr connected to Quraysh caravan activity.",
    summaryAr: "حملة قبل بدر مرتبطة بنشاط قوافل قريش.",
    summaryFr: "Une campagne avant Badr liée à l'activité des caravanes de Quraysh.",
    keyLesson: "Monitoring threats and economic pressure.",
    keyLessonAr: "مراقبة التهديدات والضغط الاقتصادي.",
    keyLessonFr: "Surveillance des menaces et pression économique.",
    importance: "Reference",
    fightingOccurred: "No",
    categoryTags: ["Ghazwah", "Quraysh", "No Fighting", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 29,
    name: "First Badr / Safwan",
    nameAr: "بدر الأولى / سفوان",
    nameFr: "Premier Badr / Ṣafwān",
    type: "Ghazwah / Pursuit",
    typeAr: "غزوة / مطاردة",
    typeFr: "Ghazwa / Poursuite",
    hijriYear: "2 AH",
    location: "Badr area",
    locationAr: "منطقة بدر",
    locationFr: "Région de Badr",
    relatedParties: "Muslims and Karaz ibn Jabir",
    relatedPartiesAr: "المسلمون وكرز بن جابر",
    relatedPartiesFr: "Musulmans et Karaz ibn Jābir",
    summary: "A pursuit before the major Battle of Badr.",
    summaryAr: "مطاردة سبقت معركة بدر الكبرى.",
    summaryFr: "Une poursuite avant la grande bataille de Badr.",
    keyLesson: "Protecting Madinah and responding to attacks.",
    keyLessonAr: "حماية المدينة والرد على الهجمات.",
    keyLessonFr: "Protéger Médine et répondre aux attaques.",
    importance: "Reference",
    fightingOccurred: "No",
    categoryTags: ["Ghazwah", "Madinah-Related", "No Fighting", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 30,
    name: "Nakhlah",
    nameAr: "سرية نخلة",
    nameFr: "Nakhlah",
    type: "Sariyyah",
    typeAr: "سرية",
    typeFr: "Sariyya",
    hijriYear: "2 AH",
    location: "Nakhlah",
    locationAr: "نخلة",
    locationFr: "Nakhlah",
    relatedParties: "Muslims and Quraysh",
    relatedPartiesAr: "المسلمون وقريش",
    relatedPartiesFr: "Musulmans et Quraysh",
    summary: "A serious early expedition before Badr that raised important legal and ethical questions.",
    summaryAr: "سرية مبكرة مهمة قبل بدر أثارت مسائل شرعية وأخلاقية مهمة.",
    summaryFr: "Une expédition précoce importante avant Badr qui souleva de sérieuses questions juridiques et éthiques.",
    keyLesson: "Obedience, sacred limits, and revelation-guided correction.",
    keyLessonAr: "الطاعة، وحرمة الأشهر الحرم، والتصحيح بالوحي.",
    keyLessonFr: "Obéissance, limites sacrées et correction guidée par la révélation.",
    importance: "Medium",
    fightingOccurred: "Yes",
    categoryTags: ["Sariyyah", "Quraysh", "Fighting Occurred", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 31,
    name: "Al-Qaradah",
    nameAr: "غزوة القردة",
    nameFr: "Al-Qarada",
    type: "Sariyyah",
    typeAr: "سرية",
    typeFr: "Sariyya",
    hijriYear: "3 AH",
    location: "Najd trade route",
    locationAr: "طريق تجارة نجد",
    locationFr: "Route commerciale du Najd",
    relatedParties: "Muslims and Quraysh caravan",
    relatedPartiesAr: "المسلمون وقافلة قريش",
    relatedPartiesFr: "Musulmans et caravane de Quraysh",
    summary: "A mission that affected Quraysh's trade route after Badr.",
    summaryAr: "مهمة أثّرت على طريق تجارة قريش بعد بدر.",
    summaryFr: "Une mission qui affecta la route commerciale de Quraysh après Badr.",
    keyLesson: "Strategic pressure and changing power dynamics.",
    keyLessonAr: "الضغط الاستراتيجي وتغيّر موازين القوى.",
    keyLessonFr: "Pression stratégique et évolution des rapports de force.",
    importance: "Medium",
    fightingOccurred: "Limited",
    categoryTags: ["Sariyyah", "Quraysh", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 32,
    name: "Qatan",
    nameAr: "سرية قطن",
    nameFr: "Qaṭan",
    type: "Sariyyah",
    typeAr: "سرية",
    typeFr: "Sariyya",
    hijriYear: "4 AH",
    location: "Qatan",
    locationAr: "قطن",
    locationFr: "Qaṭan",
    relatedParties: "Muslims and Banu Asad-related threat",
    relatedPartiesAr: "المسلمون وتهديد مرتبط ببني أسد",
    relatedPartiesFr: "Musulmans et menace liée à Banū Asad",
    summary: "A mission connected to reports of tribal threat.",
    summaryAr: "مهمة مرتبطة بتقارير عن تهديد قبلي.",
    summaryFr: "Une mission liée à des rapports de menace tribale.",
    keyLesson: "Preventive security and intelligence.",
    keyLessonAr: "الأمن الوقائي والاستخبارات.",
    keyLessonFr: "Sécurité préventive et renseignement.",
    importance: "Reference",
    fightingOccurred: "Limited",
    categoryTags: ["Sariyyah", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 33,
    name: "Abdullah ibn Unays Mission",
    nameAr: "سرية عبد الله بن أنيس",
    nameFr: "Mission de ʿAbd Allāh ibn Unays",
    type: "Sariyyah / Targeted Mission",
    typeAr: "سرية / مهمة محددة الهدف",
    typeFr: "Sariyya / Mission ciblée",
    hijriYear: "4 AH",
    location: "Outside Madinah",
    locationAr: "خارج المدينة",
    locationFr: "Hors de Médine",
    relatedParties: "Muslims and hostile tribal leadership",
    relatedPartiesAr: "المسلمون وقيادة قبلية معادية",
    relatedPartiesFr: "Musulmans et chefferie tribale hostile",
    summary: "A mission connected to a threat against Madinah.",
    summaryAr: "مهمة مرتبطة بتهديد ضد المدينة.",
    summaryFr: "Une mission liée à une menace contre Médine.",
    keyLesson: "Leadership, risk, and protection.",
    keyLessonAr: "القيادة، والمخاطرة، والحماية.",
    keyLessonFr: "Leadership, prise de risque et protection.",
    importance: "Reference",
    fightingOccurred: "Limited",
    categoryTags: ["Sariyyah", "Madinah-Related", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 34,
    name: "Al-Raji'",
    nameAr: "سرية الرجيع",
    nameFr: "Al-Rajīʿ",
    type: "Sariyyah / Da'wah Mission",
    typeAr: "سرية / بعثة دعوية",
    typeFr: "Sariyya / Mission de daʿwa",
    hijriYear: "4 AH",
    location: "Al-Raji'",
    locationAr: "الرجيع",
    locationFr: "Al-Rajīʿ",
    relatedParties: "Muslim teachers and hostile tribes",
    relatedPartiesAr: "معلمون مسلمون وقبائل معادية",
    relatedPartiesFr: "Enseignants musulmans et tribus hostiles",
    summary: "A tragic mission where Muslim teachers were betrayed.",
    summaryAr: "بعثة مأساوية غُدر فيها بالمعلمين المسلمين.",
    summaryFr: "Une mission tragique où des enseignants musulmans furent trahis.",
    keyLesson: "Sacrifice, betrayal, and the danger faced by callers to Islam.",
    keyLessonAr: "التضحية، والغدر، وخطورة ما يواجهه الدعاة إلى الإسلام.",
    keyLessonFr: "Sacrifice, trahison et dangers encourus par les appelants à l'islam.",
    importance: "Medium",
    fightingOccurred: "Yes",
    categoryTags: ["Sariyyah", "Fighting Occurred", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 35,
    name: "Bi'r Ma'unah",
    nameAr: "بئر معونة",
    nameFr: "Biʾr Maʿūna",
    type: "Sariyyah / Da'wah Mission",
    typeAr: "سرية / بعثة دعوية",
    typeFr: "Sariyya / Mission de daʿwa",
    hijriYear: "4 AH",
    location: "Bi'r Ma'unah",
    locationAr: "بئر معونة",
    locationFr: "Biʾr Maʿūna",
    relatedParties: "Muslim teachers and hostile tribes",
    relatedPartiesAr: "معلمون مسلمون وقبائل معادية",
    relatedPartiesFr: "Enseignants musulmans et tribus hostiles",
    summary: "A tragic event where many Qur'an reciters were killed.",
    summaryAr: "حدث مأساوي قُتل فيه عدد كبير من قرّاء القرآن.",
    summaryFr: "Un événement tragique où de nombreux récitants du Coran furent tués.",
    keyLesson: "Sacrifice, grief, and the cost of da'wah.",
    keyLessonAr: "التضحية، والحزن، وثمن الدعوة.",
    keyLessonFr: "Sacrifice, douleur et coût de la daʿwa.",
    importance: "Major",
    fightingOccurred: "Yes",
    categoryTags: ["Sariyyah", "Fighting Occurred", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 36,
    name: "Abu Salamah Expedition to Qatan",
    nameAr: "سرية أبي سلمة إلى قطن",
    nameFr: "Expédition d'Abū Salama vers Qaṭan",
    type: "Sariyyah",
    typeAr: "سرية",
    typeFr: "Sariyya",
    hijriYear: "4 AH",
    location: "Qatan",
    locationAr: "قطن",
    locationFr: "Qaṭan",
    relatedParties: "Muslims and Banu Asad-related groups",
    relatedPartiesAr: "المسلمون وجماعات مرتبطة ببني أسد",
    relatedPartiesFr: "Musulmans et groupes liés à Banū Asad",
    summary: "A mission responding to tribal threat.",
    summaryAr: "مهمة للرد على تهديد قبلي.",
    summaryFr: "Une mission répondant à une menace tribale.",
    keyLesson: "Community protection and response to danger.",
    keyLessonAr: "حماية المجتمع والاستجابة للخطر.",
    keyLessonFr: "Protection de la communauté et réponse au danger.",
    importance: "Reference",
    fightingOccurred: "Limited",
    categoryTags: ["Sariyyah", "Early Madinan Period"],
    section: "expeditions",
  },
  {
    id: 37,
    name: "Zayd ibn Harithah Expeditions",
    nameAr: "سرايا زيد بن حارثة",
    nameFr: "Expéditions de Zayd ibn Ḥāritha",
    type: "Sariyyah",
    typeAr: "سرية",
    typeFr: "Sariyya",
    hijriYear: "Multiple missions",
    location: "Various routes",
    locationAr: "طرق متعددة",
    locationFr: "Diverses routes",
    relatedParties: "Muslims and hostile groups",
    relatedPartiesAr: "المسلمون وجماعات معادية",
    relatedPartiesFr: "Musulmans et groupes hostiles",
    summary: "Zayd ibn Harithah رضي الله عنه led multiple missions during the Madinan period.",
    summaryAr: "قاد زيد بن حارثة رضي الله عنه عدة سرايا خلال العهد المدني.",
    summaryFr: "Zayd ibn Ḥāritha رضي الله عنه dirigea plusieurs missions durant la période médinoise.",
    keyLesson: "Trusted leadership and service.",
    keyLessonAr: "القيادة الموثوقة والخدمة.",
    keyLessonFr: "Leadership digne de confiance et service.",
    importance: "Reference",
    fightingOccurred: "Disputed",
    categoryTags: ["Sariyyah", "Early Madinan Period", "Late Madinan Period"],
    section: "expeditions",
  },
  {
    id: 38,
    name: "Dhat al-Salasil",
    nameAr: "ذات السلاسل",
    nameFr: "Dhāt al-Salāsil",
    type: "Sariyyah",
    typeAr: "سرية",
    typeFr: "Sariyya",
    hijriYear: "8 AH",
    location: "Northern Arabia",
    locationAr: "شمال الجزيرة العربية",
    locationFr: "Arabie du Nord",
    relatedParties: "Muslims and northern tribes",
    relatedPartiesAr: "المسلمون وقبائل شمالية",
    relatedPartiesFr: "Musulmans et tribus du nord",
    summary: "An expedition led by Amr ibn al-As رضي الله عنه.",
    summaryAr: "سرية بقيادة عمرو بن العاص رضي الله عنه.",
    summaryFr: "Une expédition menée par ʿAmr ibn al-ʿĀṣ رضي الله عنه.",
    keyLesson: "Leadership, obedience, and unity among commanders.",
    keyLessonAr: "القيادة، والطاعة، والوحدة بين القادة.",
    keyLessonFr: "Leadership, obéissance et unité entre les commandants.",
    importance: "Medium",
    fightingOccurred: "Limited",
    categoryTags: ["Sariyyah", "Late Madinan Period"],
    section: "expeditions",
  },
  {
    id: 39,
    name: "Mu'tah",
    nameAr: "مؤتة",
    nameFr: "Muʾta",
    type: "Major Expedition / Usually called Ghazwah",
    typeAr: "حملة كبرى / تُسمى غالبًا غزوة",
    typeFr: "Expédition majeure / Souvent appelée ghazwa",
    hijriYear: "8 AH",
    approximateCE: "629 CE",
    location: "Mu'tah",
    locationAr: "مؤتة",
    locationFr: "Muʾta",
    relatedParties: "Muslims and Byzantine-allied forces",
    relatedPartiesAr: "المسلمون وقوات موالية للروم",
    relatedPartiesFr: "Musulmans et forces alliées aux Byzantins",
    summary: "A major battle outside Arabia led by Zayd ibn Harithah, Ja'far ibn Abi Talib, and Abdullah ibn Rawahah رضي الله عنهم.",
    summaryAr: "معركة كبرى خارج الجزيرة العربية بقيادة زيد بن حارثة وجعفر بن أبي طالب وعبد الله بن رواحة رضي الله عنهم.",
    summaryFr: "Une bataille majeure hors d'Arabie menée par Zayd ibn Ḥāritha, Jaʿfar ibn Abī Ṭālib et ʿAbd Allāh ibn Rawāḥa رضي الله عنهم.",
    keyLesson: "Courage, sacrifice, and leadership succession.",
    keyLessonAr: "الشجاعة، والتضحية، وتسلسل القيادة.",
    keyLessonFr: "Courage, sacrifice et succession du commandement.",
    importance: "Major",
    fightingOccurred: "Yes",
    categoryTags: ["Sariyyah", "Ghazwah", "Fighting Occurred", "Late Madinan Period"],
    section: "expeditions",
  },
  {
    id: 40,
    name: "Expedition of Khalid ibn al-Walid to Banu Jadhimah",
    nameAr: "سرية خالد بن الوليد إلى بني جذيمة",
    nameFr: "Expédition de Khālid ibn al-Walīd vers Banū Jadḥīma",
    type: "Sariyyah",
    typeAr: "سرية",
    typeFr: "Sariyya",
    hijriYear: "8 AH",
    location: "Banu Jadhimah",
    locationAr: "بنو جذيمة",
    locationFr: "Banū Jadḥīma",
    relatedParties: "Muslims and Banu Jadhimah",
    relatedPartiesAr: "المسلمون وبنو جذيمة",
    relatedPartiesFr: "Musulmans et Banū Jadḥīma",
    summary: "A serious incident after the conquest of Makkah.",
    summaryAr: "حادثة خطيرة وقعت بعد فتح مكة.",
    summaryFr: "Un incident grave après la conquête de La Mecque.",
    keyLesson: "Restraint, justice, and correcting mistakes.",
    keyLessonAr: "ضبط النفس، والعدل، وتصحيح الأخطاء.",
    keyLessonFr: "Retenue, justice et correction des erreurs.",
    importance: "Medium",
    fightingOccurred: "Yes",
    categoryTags: ["Sariyyah", "Fighting Occurred", "Late Madinan Period"],
    section: "expeditions",
  },
  {
    id: 41,
    name: "Expedition of Ali ibn Abi Talib to Yemen",
    nameAr: "سرية علي بن أبي طالب إلى اليمن",
    nameFr: "Expédition de ʿAlī ibn Abī Ṭālib vers le Yémen",
    type: "Sariyyah / Da'wah and Governance Mission",
    typeAr: "سرية / بعثة دعوة وحكم",
    typeFr: "Sariyya / Mission de daʿwa et de gouvernance",
    hijriYear: "10 AH",
    location: "Yemen",
    locationAr: "اليمن",
    locationFr: "Yémen",
    relatedParties: "Muslims and Yemeni tribes",
    relatedPartiesAr: "المسلمون وقبائل اليمن",
    relatedPartiesFr: "Musulmans et tribus yéménites",
    summary: "Ali رضي الله عنه was sent to Yemen for da'wah and judgment.",
    summaryAr: "أُرسل علي رضي الله عنه إلى اليمن للدعوة والقضاء.",
    summaryFr: "ʿAlī رضي الله عنه fut envoyé au Yémen pour la daʿwa et le jugement.",
    keyLesson: "Teaching, justice, and spreading Islam with knowledge.",
    keyLessonAr: "التعليم، والعدل، ونشر الإسلام بالعلم.",
    keyLessonFr: "Enseignement, justice et diffusion de l'islam par le savoir.",
    importance: "Medium",
    fightingOccurred: "No",
    categoryTags: ["Sariyyah", "No Fighting", "Late Madinan Period"],
    section: "expeditions",
  },
  {
    id: 42,
    name: "Expedition of Usamah ibn Zayd",
    nameAr: "سرية أسامة بن زيد",
    nameFr: "Expédition d'Usāma ibn Zayd",
    type: "Sariyyah / Final Ordered Expedition",
    typeAr: "سرية / آخر بعثة أمر بها النبي ﷺ",
    typeFr: "Sariyya / Dernière expédition ordonnée",
    hijriYear: "11 AH",
    location: "Toward the Syrian frontier",
    locationAr: "باتجاه الحدود الشامية",
    locationFr: "Vers la frontière syrienne",
    relatedParties: "Muslims and northern frontier threat",
    relatedPartiesAr: "المسلمون وتهديد على الحدود الشمالية",
    relatedPartiesFr: "Musulmans et menace à la frontière nord",
    summary: "The Prophet ﷺ appointed Usamah ibn Zayd رضي الله عنه to lead an army near the end of his life.",
    summaryAr: "عيّن النبي ﷺ أسامة بن زيد رضي الله عنه لقيادة جيش قرب نهاية حياته.",
    summaryFr: "Le Prophète ﷺ nomma Usāma ibn Zayd رضي الله عنه pour diriger une armée vers la fin de sa vie.",
    keyLesson: "Trusting young leadership and obeying prophetic instruction.",
    keyLessonAr: "الثقة بالقيادة الشابة وطاعة توجيه النبي ﷺ.",
    keyLessonFr: "Faire confiance au leadership jeune et obéir à l'instruction prophétique.",
    importance: "Major",
    fightingOccurred: "No",
    categoryTags: ["Sariyyah", "No Fighting", "Late Madinan Period"],
    section: "expeditions",
  },
];

const TREATY_EVENTS: Event[] = [
  {
    id: 101,
    name: "Constitution of Madinah",
    nameAr: "وثيقة المدينة",
    nameFr: "Constitution de Médine",
    type: "Community Agreement",
    typeAr: "ميثاق مجتمعي",
    typeFr: "Accord communautaire",
    hijriYear: "1 AH",
    location: "Madinah",
    locationAr: "المدينة",
    locationFr: "Médine",
    relatedParties: "Muslims, Jewish tribes, and other Madinan groups",
    relatedPartiesAr: "المسلمون واليهود وجماعات مدنية أخرى",
    relatedPartiesFr: "Musulmans, tribus juives et autres groupes médinois",
    summary: "A foundational agreement organizing the Madinan community.",
    summaryAr: "ميثاق تأسيسي نظّم المجتمع المدني.",
    summaryFr: "Un accord fondateur organisant la communauté médinoise.",
    keyLesson: "Governance, rights, duties, and social order.",
    keyLessonAr: "الحكم، والحقوق، والواجبات، والنظام الاجتماعي.",
    keyLessonFr: "Gouvernance, droits, devoirs et ordre social.",
    importance: "Major",
    fightingOccurred: "No",
    categoryTags: ["Treaty Events", "Madinah-Related", "Jewish Tribes of Madinah", "No Fighting", "Early Madinan Period"],
    section: "treaties",
  },
  {
    id: 102,
    name: "Treaty of Hudaybiyyah",
    nameAr: "صلح الحديبية",
    nameFr: "Traité d'al-Ḥudaybiyya",
    type: "Treaty",
    typeAr: "معاهدة",
    typeFr: "Traité",
    hijriYear: "6 AH",
    location: "Hudaybiyyah",
    locationAr: "الحديبية",
    locationFr: "al-Ḥudaybiyya",
    relatedParties: "Muslims and Quraysh",
    relatedPartiesAr: "المسلمون وقريش",
    relatedPartiesFr: "Musulmans et Quraysh",
    summary: "A peace treaty that appeared difficult but became a clear opening for Islam.",
    summaryAr: "معاهدة سلام بدت صعبة لكنها أصبحت فتحًا واضحًا للإسلام.",
    summaryFr: "Un traité de paix qui parut difficile mais devint une ouverture claire pour l'islam.",
    keyLesson: "Strategic patience and trust in Allah's plan.",
    keyLessonAr: "الصبر الاستراتيجي والثقة بتدبير الله.",
    keyLessonFr: "Patience stratégique et confiance dans le plan d'Allah.",
    importance: "Major",
    fightingOccurred: "No",
    categoryTags: ["Treaty Events", "Makkah-Related", "Quraysh", "No Fighting", "Late Madinan Period"],
    section: "treaties",
  },
  {
    id: 103,
    name: "Letters to Rulers",
    nameAr: "الرسائل إلى الملوك",
    nameFr: "Lettres aux souverains",
    type: "Diplomatic Mission",
    typeAr: "بعثة دبلوماسية",
    typeFr: "Mission diplomatique",
    hijriYear: "6–7 AH",
    location: "Arabia and beyond",
    locationAr: "الجزيرة العربية وما وراءها",
    locationFr: "Arabie et au-delà",
    relatedParties: "Regional rulers and empires",
    relatedPartiesAr: "حكام وإمبراطوريات المنطقة",
    relatedPartiesFr: "Souverains et empires régionaux",
    summary: "The Prophet ﷺ sent letters inviting rulers to Islam.",
    summaryAr: "أرسل النبي ﷺ رسائل يدعو فيها الملوك إلى الإسلام.",
    summaryFr: "Le Prophète ﷺ envoya des lettres invitant les souverains à l'islam.",
    keyLesson: "Global da'wah and confident leadership.",
    keyLessonAr: "الدعوة العالمية والقيادة الواثقة.",
    keyLessonFr: "Daʿwa universelle et leadership confiant.",
    importance: "Major",
    fightingOccurred: "No",
    categoryTags: ["Treaty Events", "No Fighting", "Late Madinan Period"],
    section: "treaties",
  },
  {
    id: 104,
    name: "Year of Delegations",
    nameAr: "عام الوفود",
    nameFr: "Année des délégations",
    type: "Delegations / Diplomacy",
    typeAr: "وفود / دبلوماسية",
    typeFr: "Délégations / Diplomatie",
    hijriYear: "9 AH",
    location: "Madinah",
    locationAr: "المدينة",
    locationFr: "Médine",
    relatedParties: "Arab tribes",
    relatedPartiesAr: "القبائل العربية",
    relatedPartiesFr: "Tribus arabes",
    summary: "Tribes from across Arabia came to Madinah to meet the Prophet ﷺ.",
    summaryAr: "قدمت قبائل من أنحاء الجزيرة العربية إلى المدينة للقاء النبي ﷺ.",
    summaryFr: "Des tribus de toute l'Arabie vinrent à Médine rencontrer le Prophète ﷺ.",
    keyLesson: "Islam spreading through teaching, leadership, and diplomacy.",
    keyLessonAr: "انتشار الإسلام عبر التعليم والقيادة والدبلوماسية.",
    keyLessonFr: "L'islam se répand par l'enseignement, le leadership et la diplomatie.",
    importance: "Major",
    fightingOccurred: "No",
    categoryTags: ["Treaty Events", "Madinah-Related", "No Fighting", "Late Madinan Period"],
    section: "treaties",
  },
];

const ALL_EVENTS = [...EVENTS_DATA, ...TREATY_EVENTS];

const FILTER_CATEGORIES = [
  "All",
  "Major Battles",
  "Ghazwah",
  "Sariyyah",
  "Makkah-Related",
  "Madinah-Related",
  "Quraysh",
  "Jewish Tribes of Madinah",
  "Treaty Events",
  "No Fighting",
  "Fighting Occurred",
  "Early Madinan Period",
  "Late Madinan Period",
];

const CATEGORY_LABELS_AR: Record<string, string> = {
  "All": "الكل",
  "Major Battles": "المعارك الكبرى",
  "Ghazwah": "غزوة",
  "Sariyyah": "سرية",
  "Makkah-Related": "متعلق بمكة",
  "Madinah-Related": "متعلق بالمدينة",
  "Quraysh": "قريش",
  "Jewish Tribes of Madinah": "يهود المدينة",
  "Treaty Events": "أحداث المعاهدات",
  "No Fighting": "بلا قتال",
  "Fighting Occurred": "وقع فيه قتال",
  "Early Madinan Period": "العهد المدني المبكر",
  "Late Madinan Period": "العهد المدني المتأخر",
};

const CATEGORY_LABELS_FR: Record<string, string> = {
  "All": "Tout",
  "Major Battles": "Batailles majeures",
  "Ghazwah": "Ghazwa",
  "Sariyyah": "Sariyya",
  "Makkah-Related": "Lié à La Mecque",
  "Madinah-Related": "Lié à Médine",
  "Quraysh": "Quraysh",
  "Jewish Tribes of Madinah": "Tribus juives de Médine",
  "Treaty Events": "Événements de traités",
  "No Fighting": "Sans combat",
  "Fighting Occurred": "Combat survenu",
  "Early Madinan Period": "Début de la période médinoise",
  "Late Madinan Period": "Fin de la période médinoise",
};

const IMPORTANCE_LABELS_AR: Record<string, string> = {
  "Major": "رئيسي",
  "Medium": "متوسط",
  "Reference": "مرجعي",
};

const IMPORTANCE_LABELS_FR: Record<string, string> = {
  "Major": "Majeur",
  "Medium": "Moyen",
  "Reference": "Référence",
};

const FIGHTING_LABELS_AR: Record<string, string> = {
  "Yes": "وقع قتال",
  "No": "لا قتال",
  "Limited": "محدود",
  "Siege": "حصار",
  "Disputed": "مختلف فيه",
};

const FIGHTING_LABELS_FR: Record<string, string> = {
  "Yes": "Combat",
  "No": "Sans combat",
  "Limited": "Limité",
  "Siege": "Siège",
  "Disputed": "Disputé",
};

function getFightingLabel(
  fightingOccurred: Event["fightingOccurred"],
  lang: CourseLang
) {
  if (lang === "ar") {
    return FIGHTING_LABELS_AR[fightingOccurred] ?? fightingOccurred;
  }
  if (lang === "fr") {
    return FIGHTING_LABELS_FR[fightingOccurred] ?? fightingOccurred;
  }
  return fightingOccurred === "Yes"
    ? "Fighting"
    : fightingOccurred === "No"
    ? "No Fighting"
    : fightingOccurred;
}

const CALLOUT_CARDS = [
  {
    id: "c1",
    title: "Ghazwah vs Sariyyah",
    titleAr: "الغزوة والسرية",
    titleFr: "Ghazwa vs Sariyya",
    text: "A Ghazwah is an expedition the Prophet ﷺ personally went out on. A Sariyyah is an expedition sent by the Prophet ﷺ but led by a companion.",
    textAr: "الغزوة هي الحملة التي خرج فيها النبي ﷺ بنفسه. أما السرية فهي الحملة التي أرسلها النبي ﷺ بقيادة أحد الصحابة.",
    textFr: "Une ghazwa est une expédition à laquelle le Prophète ﷺ participa personnellement. Une sariyya est une expédition envoyée par le Prophète ﷺ mais dirigée par un compagnon.",
  },
  {
    id: "c2",
    title: "Not every expedition involved fighting",
    titleAr: "ليست كل الحملات فيها قتال",
    titleFr: "Toutes les expéditions n'ont pas impliqué de combat",
    text: "Many campaigns were patrols, treaty missions, deterrence efforts, da'wah missions, or strategic movements where no major battle occurred.",
    textAr: "كانت كثير من الحملات دوريات، أو بعثات لعقد المعاهدات، أو جهود ردع، أو بعثات دعوية، أو تحركات استراتيجية لم يقع فيها قتال كبير.",
    textFr: "Beaucoup de campagnes étaient des patrouilles, des missions de traité, des efforts de dissuasion, des missions de daʿwa ou des mouvements stratégiques sans bataille majeure.",
  },
  {
    id: "c3",
    title: "Why Badr mattered",
    titleAr: "لماذا كانت بدر مهمة",
    titleFr: "Pourquoi Badr comptait",
    text: "Badr was the first major battle and became a turning point for the Muslim community in Madinah.",
    textAr: "كانت بدر أول معركة كبرى، وأصبحت نقطة تحول لمجتمع المسلمين في المدينة.",
    textFr: "Badr fut la première grande bataille et devint un tournant pour la communauté musulmane à Médine.",
  },
  {
    id: "c4",
    title: "Why Uhud mattered",
    titleAr: "لماذا كانت أُحُد مهمة",
    titleFr: "Pourquoi Uḥud comptait",
    text: "Uhud taught painful lessons about obedience, discipline, patience, and staying firm after hardship.",
    textAr: "علّمت أُحُد دروسًا مؤلمة في الطاعة والانضباط والصبر والثبات بعد الشدة.",
    textFr: "Uḥud enseigna des leçons douloureuses sur l'obéissance, la discipline, la patience et la fermeté après l'épreuve.",
  },
  {
    id: "c5",
    title: "Why Hudaybiyyah mattered",
    titleAr: "لماذا كان صلح الحديبية مهمًا",
    titleFr: "Pourquoi al-Ḥudaybiyya comptait",
    text: "Hudaybiyyah showed that a treaty that looks difficult in the moment can become a major opening later.",
    textAr: "أظهر صلح الحديبية أن معاهدة قد تبدو صعبة في وقتها يمكن أن تصبح فتحًا كبيرًا لاحقًا.",
    textFr: "Al-Ḥudaybiyya montra qu'un traité difficile sur le moment peut devenir une grande ouverture plus tard.",
  },
  {
    id: "c6",
    title: "Why the Conquest of Makkah mattered",
    titleAr: "لماذا كان فتح مكة مهمًا",
    titleFr: "Pourquoi la conquête de La Mecque comptait",
    text: "The conquest showed the Prophet's ﷺ mercy, humility, and forgiveness at the moment of victory.",
    textAr: "أظهر الفتح رحمة النبي ﷺ وتواضعه وعفوه في لحظة الانتصار.",
    textFr: "La conquête montra la miséricorde, l'humilité et le pardon du Prophète ﷺ au moment de la victoire.",
  },
  {
    id: "c7",
    title: "Why Tabuk mattered",
    titleAr: "لماذا كانت تبوك مهمة",
    titleFr: "Pourquoi Tabūk comptait",
    text: "Tabuk tested sacrifice, sincerity, and readiness during hardship near the end of the Prophet's ﷺ life.",
    textAr: "اختبرت تبوك التضحية والإخلاص والاستعداد وقت الشدة قرب نهاية حياة النبي ﷺ.",
    textFr: "Tabūk mit à l'épreuve le sacrifice, la sincérité et la disponibilité durant la difficulté vers la fin de la vie du Prophète ﷺ.",
  },
];

export function BattlesExpeditionsContent({ lang = "en" }: { lang?: CourseLang }) {
  const isRtl = lang === "ar";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showAll, setShowAll] = useState(false);

  // Major events to show initially (12 most important)
  const majorEventIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 15, 22, 39, 20, 102];

  const filteredEvents = useMemo(() => {
    let events = ALL_EVENTS;

    // Filter by category
    if (selectedCategory !== "All") {
      events = events.filter((event) =>
        event.categoryTags.includes(selectedCategory)
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      events = events.filter((event) => {
        const haystack = [
          event.name,
          event.nameAr,
          event.nameFr,
          event.type,
          event.typeAr,
          event.typeFr,
          event.location,
          event.locationAr,
          event.locationFr,
          event.relatedParties,
          event.relatedPartiesAr,
          event.relatedPartiesFr,
          event.keyLesson,
          event.keyLessonAr,
          event.keyLessonFr,
          event.summary,
          event.summaryAr,
          event.summaryFr,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      });
    }

    return events;
  }, [searchQuery, selectedCategory]);

  const displayedEvents = showAll
    ? filteredEvents
    : filteredEvents.filter((event) => majorEventIds.includes(event.id));

  const hasMore = filteredEvents.length > majorEventIds.length;
  const isFiltered = searchQuery.trim() || selectedCategory !== "All";

  // Stats
  const majorBattlesCount = ALL_EVENTS.filter((e) =>
    e.categoryTags.includes("Major Battles")
  ).length;
  const ghazwahCount = ALL_EVENTS.filter((e) =>
    e.categoryTags.includes("Ghazwah")
  ).length;
  const sariyyahCount = ALL_EVENTS.filter((e) =>
    e.categoryTags.includes("Sariyyah")
  ).length;
  const totalCount = ALL_EVENTS.length;

  // Get icon for event
  const getEventIcon = (event: Event | typeof TREATY_EVENTS[0]) => {
    if (event.categoryTags.includes("Treaty Events")) return Flag;
    if (event.fightingOccurred === "Yes" || event.fightingOccurred === "Siege")
      return Swords;
    return Shield;
  };

  // Get badge color for importance
  const getImportanceBadge = (importance: string) => {
    switch (importance) {
      case "Major":
        return "bg-gold/10 text-gold border-gold/20";
      case "Medium":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-surface-raised text-text-muted border-border/50";
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
            {loc(lang, "Battles and Expeditions", "الغزوات والسرايا", "Batailles et expéditions")}
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed max-w-3xl mb-6">
            {loc(
              lang,
              "A clear reference to the major battles, campaigns, and expeditions of the Prophet ﷺ.",
              "مرجع واضح لأهم المعارك والحملات والغزوات.",
              "Une référence claire aux grandes batailles, campagnes et expéditions du Prophète ﷺ."
            )}
          </p>

          {/* Educational note */}
          <div className="flex gap-3 p-4 rounded-xl bg-surface border border-border/50">
            <Info className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-text-secondary leading-relaxed">
                {lang === "ar" ? (
                  <>
                    كثيرًا ما تستخدم كتب السيرة مصطلحين:{" "}
                    <span className="font-semibold text-text">الغزوة</span>{" "}
                    و<span className="font-semibold text-text">السرية</span>.
                    الغزوة هي حملة خرج فيها النبي ﷺ بنفسه، سواء وقع فيها قتال
                    أم لا. أما السرية فهي حملة أرسلها النبي ﷺ لكن بقيادة أحد
                    الصحابة. ويختلف العلماء في العدد الدقيق للحملات والغزوات،
                    لذا يركز هذا القسم على أبرز الأحداث المعروفة.
                  </>
                ) : lang === "fr" ? (
                  <>
                    Les livres de Sîra utilisent souvent deux termes :{" "}
                    <span className="font-semibold text-text">ghazwa</span>{" "}
                    et{" "}
                    <span className="font-semibold text-text">sariyya</span>.
                    Une ghazwa est une expédition à laquelle le Prophète ﷺ a
                    participé personnellement, qu&apos;il y ait eu combat ou non.
                    Une sariyya est une expédition envoyée par le Prophète ﷺ
                    mais dirigée par un compagnon. Les savants divergent sur
                    le nombre exact de campagnes et d&apos;expéditions ; cette
                    section se concentre donc sur les événements majeurs et
                    couramment cités.
                  </>
                ) : (
                  <>
                    Seerah books often use two terms:{" "}
                    <span className="font-semibold text-text">Ghazwah</span>{" "}
                    and{" "}
                    <span className="font-semibold text-text">Sariyyah</span>.
                    A Ghazwah is an expedition the Prophet ﷺ personally went
                    out on, whether or not fighting occurred. A Sariyyah is an
                    expedition sent by the Prophet ﷺ but led by a companion.
                    Scholars differ on the exact number of campaigns and
                    expeditions, so this section focuses on the major and
                    commonly referenced events.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-2xl font-bold text-gold">{majorBattlesCount}</p>
            <p className="text-xs text-text-secondary mt-1">
              {loc(lang, "Major fighting campaigns", "حملات قتالية كبرى", "Grandes campagnes de combat")}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-2xl font-bold text-gold">{ghazwahCount}+</p>
            <p className="text-xs text-text-secondary mt-1">
              {loc(lang, "Campaigns referenced", "حملات مذكورة", "Campagnes mentionnées")}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-2xl font-bold text-gold">{totalCount}</p>
            <p className="text-xs text-text-secondary mt-1">
              {loc(lang, "Battles, patrols, expeditions", "معارك ودوريات وحملات", "Batailles, patrouilles, expéditions")}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-2xl font-bold text-gold">{sariyyahCount}</p>
            <p className="text-xs text-text-secondary mt-1">
              {loc(lang, "Expeditions (Sariyyah)", "سرايا", "Expéditions (sariyya)")}
            </p>
          </div>
        </div>

        {/* Callout cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {CALLOUT_CARDS.map((card) => (
            <div
              key={card.id}
              className="p-4 rounded-xl bg-gold/5 border border-gold/20"
            >
              <h3 className="text-sm font-semibold text-gold mb-2">
                {loc(lang, card.title, card.titleAr, card.titleFr)}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {loc(lang, card.text, card.textAr, card.textFr)}
              </p>
            </div>
          ))}
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder={loc(
                lang,
                "Search battles, expeditions, places, or lessons…",
                "ابحث عن المعارك أو الحملات أو الأماكن أو الدروس…",
                "Rechercher batailles, expéditions, lieux ou leçons…"
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
                {loc(lang, category, CATEGORY_LABELS_AR[category] ?? category, CATEGORY_LABELS_FR[category] ?? category)}
              </button>
            );
          })}
        </div>

        {/* Events grid */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-text-muted">
              {loc(
                lang,
                "No events match your search or filter.",
                "لا توجد أحداث تطابق بحثك أو الفلتر المحدد.",
                "Aucun événement ne correspond à votre recherche ou filtre."
              )}
            </p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {displayedEvents.map((event) => {
                const Icon = getEventIcon(event);
                return (
                  <div
                    key={event.id}
                    className="p-5 rounded-xl bg-surface border border-border hover:border-gold/30 transition-colors"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-gold/10 border border-gold/20 flex-shrink-0">
                        <Icon className="w-4 h-4 text-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-text">
                          {loc(lang, event.name, event.nameAr, event.nameFr)}
                        </h3>
                        <p className="text-xs text-text-muted mt-0.5">
                          {loc(lang, event.type, event.typeAr, event.typeFr)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-xs text-text-secondary">
                        <span className="font-medium">
                          {loc(lang, "Date:", "التاريخ:", "Date :")}
                        </span>
                        <span>
                          {event.hijriYear}
                          {event.approximateCE && ` / ${event.approximateCE}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-text-secondary">
                        <span className="font-medium">
                          {loc(lang, "Location:", "الموقع:", "Lieu :")}
                        </span>
                        <span>{loc(lang, event.location, event.locationAr, event.locationFr)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-text-secondary">
                        <span className="font-medium">
                          {loc(lang, "Parties:", "الأطراف:", "Parties :")}
                        </span>
                        <span className="line-clamp-1">
                          {loc(lang, event.relatedParties, event.relatedPartiesAr, event.relatedPartiesFr)}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-text-secondary leading-relaxed mb-3">
                      {loc(lang, event.summary, event.summaryAr, event.summaryFr)}
                    </p>

                    <div className="pt-3 border-t border-border space-y-2">
                      <div>
                        <p className="text-xs font-medium text-text-muted mb-1">
                          {loc(lang, "Key Lesson:", "الدرس المستفاد:", "Leçon clé :")}
                        </p>
                        <p className="text-xs text-text-secondary leading-relaxed">
                          {loc(lang, event.keyLesson, event.keyLessonAr, event.keyLessonFr)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded border text-xs font-medium ${getImportanceBadge(
                            event.importance
                          )}`}
                        >
                          {loc(
                            lang,
                            event.importance,
                            IMPORTANCE_LABELS_AR[event.importance] ?? event.importance,
                            IMPORTANCE_LABELS_FR[event.importance] ?? event.importance
                          )}
                        </span>
                        <span
                          className={`px-2 py-1 rounded border text-xs font-medium ${
                            event.fightingOccurred === "Yes" ||
                            event.fightingOccurred === "Siege"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : event.fightingOccurred === "Limited" ||
                                event.fightingOccurred === "Disputed"
                              ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                              : "bg-green-500/10 text-green-400 border-green-500/20"
                          }`}
                        >
                          {getFightingLabel(event.fightingOccurred, lang)}
                        </span>
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
                        `View All ${filteredEvents.length} Events`,
                        `عرض جميع الأحداث (${filteredEvents.length})`,
                        `Voir les ${filteredEvents.length} événements`
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
              {loc(lang, "Continue Learning the Seerah", "واصل تعلم السيرة النبوية", "Continuer l'apprentissage de la Sîra")}
            </h2>
            <p className="text-sm text-text-secondary mb-4">
              {loc(
                lang,
                "Go back to the full Seerah course to study the context, lessons, and details of these events.",
                "عد إلى دورة السيرة الكاملة لدراسة السياق والدروس وتفاصيل هذه الأحداث.",
                "Retournez au cours complet de la Sîra pour étudier le contexte, les leçons et les détails de ces événements."
              )}
            </p>
            <Link
              href="/seerah"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold text-ink font-semibold hover:bg-gold-light transition-colors"
            >
              {loc(lang, "Go to Seerah Course", "اذهب إلى دورة السيرة", "Aller au cours de la Sîra")}
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
